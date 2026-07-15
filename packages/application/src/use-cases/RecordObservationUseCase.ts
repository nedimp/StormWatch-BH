import {
  WeatherObservation,
  WeatherAlert,
  WeatherMetrics,
  WeatherCondition,
  WeatherConditionType,
  Coordinates,
  AlertSeverity,
  WeatherAlertDomainService,
  IWeatherAlertRepository,
  IWeatherObservationRepository,
} from '@stormwatch/domain';
import type { RecordObservationCommand, AlertDto } from '../dtos/index.js';
import { toAlertDto } from '../dtos/index.js';
import type {
  IIdGenerator,
  INotificationService,
  IEventBus,
  IRegionNameResolver,
} from '../ports/index.js';

interface Deps {
  alertRepository: IWeatherAlertRepository;
  observationRepository: IWeatherObservationRepository;
  alertDomainService: WeatherAlertDomainService;
  idGenerator: IIdGenerator;
  notificationService: INotificationService;
  eventBus: IEventBus;
  regionNameResolver?: IRegionNameResolver;
}

/**
 * RecordObservationUseCase
 *
 * Orchestrates the full flow:
 * 1. Persist the incoming weather observation
 * 2. Assess it against domain alert thresholds
 * 3. Create or escalate an alert if needed
 * 4. Publish domain events and send notifications
 */
export class RecordObservationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(cmd: RecordObservationCommand): Promise<{ alertCreated: AlertDto | null }> {
    const coordinatesResult = Coordinates.create(cmd.latitude, cmd.longitude);
    if (!coordinatesResult.ok) throw new Error(coordinatesResult.error);

    const metricsResult = WeatherMetrics.create({
      temperatureCelsius: cmd.temperatureCelsius,
      windSpeedKmh: cmd.windSpeedKmh,
      windGustKmh: cmd.windGustKmh,
      precipitationMmPerHour: cmd.precipitationMmPerHour,
      humidityPercent: cmd.humidityPercent,
      visibilityKm: cmd.visibilityKm,
      pressureHpa: cmd.pressureHpa,
    });
    if (!metricsResult.ok) throw new Error(metricsResult.error);

    const observationResult = WeatherObservation.create(this.deps.idGenerator.generate(), {
      stationId: cmd.stationId,
      regionId: cmd.regionId,
      coordinates: coordinatesResult.value,
      metrics: metricsResult.value,
      conditions: [],
      observedAt: cmd.observedAt,
      source: cmd.source,
    });
    if (!observationResult.ok) throw new Error(observationResult.error);

    const observation = observationResult.value;
    await this.deps.observationRepository.save(observation);

    // Publish observation recorded event
    for (const event of observation.domainEvents) {
      await this.deps.eventBus.publish(event.eventName, event);
    }
    observation.clearDomainEvents();

    // Assess for alert.
    // If forecastFor is set, use assessForecast() which applies a severity
    // discount and adds Bosnian lead-time language ("Prognoza (sutra): ...").
    // Otherwise use the standard assessObservation() for current conditions.
    const leadHours = cmd.forecastFor
      ? Math.round((cmd.forecastFor.getTime() - Date.now()) / 3_600_000)
      : 0;
    const assessment = cmd.forecastFor
      ? this.deps.alertDomainService.assessForecast(metricsResult.value, leadHours)
      : this.deps.alertDomainService.assessObservation(metricsResult.value);

    if (!assessment.shouldAlert) {
      // Observation is below threshold. Check if an existing OBSERVED alert
      // for this region can now be resolved (conditions have improved).
      // We intentionally do NOT auto-resolve forecast alerts here — they
      // represent future predictions and should expire naturally.
      if (!cmd.forecastFor) {
        const activeAlerts = await this.deps.alertRepository.findActiveByRegion(cmd.regionId);
        for (const alert of activeAlerts) {
          if (!alert.isForecasted && this.deps.alertDomainService.canResolve(metricsResult.value)) {
            const resolveResult = alert.resolve(new Date());
            if (resolveResult.ok) {
              await this.deps.alertRepository.save(alert);
              for (const event of alert.domainEvents) {
                await this.deps.eventBus.publish(event.eventName, event);
              }
              alert.clearDomainEvents();
            }
          }
        }
      }
      return { alertCreated: null };
    }

    // Check if there's already an active alert for this region + condition.
    // For forecast alerts: match on condition type AND whether the existing alert
    // is also a forecast (to avoid conflating observed vs forecast alerts).
    const existingAlerts = await this.deps.alertRepository.findActiveByRegion(cmd.regionId);
    const sameTypeAlert = existingAlerts.find(
      (a) => a.condition.type === assessment.condition.type
          && a.isForecasted === !!cmd.forecastFor,
    );

    if (sameTypeAlert) {
      const newSeverity = this.deps.alertDomainService.shouldEscalate(
        sameTypeAlert,
        metricsResult.value,
      );
      if (newSeverity) {
        const escalateResult = sameTypeAlert.escalate(newSeverity);
        if (escalateResult.ok) {
          await this.deps.alertRepository.save(sameTypeAlert);
          for (const event of sameTypeAlert.domainEvents) {
            await this.deps.eventBus.publish(event.eventName, event);
          }
          sameTypeAlert.clearDomainEvents();
        }
      }
      return { alertCreated: toAlertDto(sameTypeAlert) };
    }

    // Create new alert.
    // Forecast alerts are valid until the forecast period ends (forecastFor + 6h).
    // Observed alerts are valid for 6h from the observation time.
    const validUntil = cmd.forecastFor
      ? new Date(cmd.forecastFor.getTime() + 6 * 3_600_000)
      : new Date(cmd.observedAt.getTime() + 6 * 3_600_000);

    const alertResult = WeatherAlert.create(this.deps.idGenerator.generate(), {
      regionId: cmd.regionId,
      regionName: this.deps.regionNameResolver?.resolve(cmd.regionId) ?? cmd.regionId,
      affectedArea: [coordinatesResult.value, coordinatesResult.value, coordinatesResult.value],
      severity: assessment.severity,
      condition: assessment.condition,
      title: assessment.title,
      description: assessment.description,
      recommendations: assessment.recommendations,
      issuedAt: cmd.observedAt,
      validUntil,
      observationIds: [observation.id],
      isForecasted: !!cmd.forecastFor,
      // exactOptionalPropertyTypes: only spread forecastFor when it has a value
      ...(cmd.forecastFor ? { forecastFor: cmd.forecastFor } : {}),
    });

    if (!alertResult.ok) throw new Error(alertResult.error);
    const newAlert = alertResult.value;

    await this.deps.alertRepository.save(newAlert);
    for (const event of newAlert.domainEvents) {
      await this.deps.eventBus.publish(event.eventName, event);
    }
    newAlert.clearDomainEvents();

    const alertDto = toAlertDto(newAlert);
    // Send email notifications to all subscribers (fire-and-forget)
    void this.deps.notificationService.sendAlertCreated(alertDto);

    return { alertCreated: alertDto };
  }
}
