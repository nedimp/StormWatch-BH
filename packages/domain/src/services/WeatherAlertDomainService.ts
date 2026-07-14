import { AlertSeverity, AlertSeverityLevel } from '../value-objects/AlertSeverity.js';
import { WeatherCondition, WeatherConditionType } from '../value-objects/WeatherCondition.js';
import { WeatherMetrics } from '../value-objects/WeatherMetrics.js';
import { WeatherAlert } from '../entities/WeatherAlert.js';
import { Region } from '../entities/Region.js';
import { Result, ok, err } from '../core/index.js';

export interface AlertAssessment {
  shouldAlert: boolean;
  severity: AlertSeverity;
  condition: WeatherCondition;
  title: string;
  description: string;
  recommendations: string[];
}

/**
 * WeatherAlertDomainService
 *
 * Pure domain service — no infrastructure dependencies.
 * Encapsulates the business rules for evaluating weather observations
 * and deciding whether an alert should be issued, and at what severity.
 *
 * BiH-specific thresholds based on FHMZ (Federal Hydrometeorological Institute)
 * and RHMZ (Republic Hydrometeorological Institute) guidelines.
 */
export class WeatherAlertDomainService {
  /**
   * Assess observed metrics and return an alert recommendation.
   * Returns { shouldAlert: false } when conditions are normal.
   */
  assessObservation(metrics: WeatherMetrics): AlertAssessment {
    // Check in descending severity order
    if (metrics.isExtremeWind()) {
      return this.buildAssessment(
        AlertSeverityLevel.CRITICAL,
        WeatherConditionType.STRONG_WIND,
        `Olujni vjetar ${metrics.windSpeed.toFixed(0)} km/h, udari do ${metrics.windGust.toFixed(0)} km/h`,
        [
          'Izbjegavajte kretanje na otvorenom',
          'Sklonite predmete koji mogu biti odneseni vjetrom',
          'Ne parkirajte vozila ispod drveća ili blizu zgrada',
          'Pratite upute civilne zaštite',
        ],
      );
    }

    if (metrics.isExtremeRain()) {
      return this.buildAssessment(
        AlertSeverityLevel.CRITICAL,
        WeatherConditionType.HEAVY_RAIN,
        `Izuzetno jaka kiša: ${metrics.precipitation.toFixed(1)} mm/h — opasnost od bujičnih poplava`,
        [
          'Ne ulazite u poplavljena područja',
          'Evakuišite se iz nizinskih i priobaltnih zona',
          'Pozovite 121 (Hitna pomoć) ili 123 (Vatrogasci) u slučaju opasnosti',
        ],
      );
    }

    if (metrics.isThunderstormLikely() && metrics.isHeavyRain()) {
      return this.buildAssessment(
        AlertSeverityLevel.HIGH,
        WeatherConditionType.THUNDERSTORM,
        `Nevrijeme s grmljavinom i jakom kišom — pritisak ${metrics.pressure.toFixed(0)} hPa`,
        [
          'Ostanite u zatvorenom prostoru',
          'Sklonite se od drveta, stubova i visokih objekata',
          'Isključite električne uređaje i antene',
          'Ne koristite žičane telefone',
        ],
      );
    }

    if (metrics.isStrongWind()) {
      return this.buildAssessment(
        AlertSeverityLevel.HIGH,
        WeatherConditionType.STRONG_WIND,
        `Jak vjetar: ${metrics.windSpeed.toFixed(0)} km/h, udari do ${metrics.windGust.toFixed(0)} km/h`,
        [
          'Opreznost pri vožnji, posebno na otvorenim putevima',
          'Sklonite predmete sa terasa i balkona',
          'Pratite meteorološka upozorenja',
        ],
      );
    }

    if (metrics.isHeavyRain()) {
      return this.buildAssessment(
        AlertSeverityLevel.MEDIUM,
        WeatherConditionType.HEAVY_RAIN,
        `Jaka kiša: ${metrics.precipitation.toFixed(1)} mm/h`,
        [
          'Opreznost pri vožnji — mokri kolnici',
          'Pratite nivo vodotoka u blizini',
          'Provjerte kanalizacione odušivače',
        ],
      );
    }

    if (metrics.isExtremeHeat()) {
      return this.buildAssessment(
        AlertSeverityLevel.HIGH,
        WeatherConditionType.EXTREME_HEAT,
        `Ekstremna vrućina: ${metrics.temperature.toFixed(1)}°C`,
        [
          'Pijte dovoljno tekućine',
          'Izbjegavajte izlaganje suncu između 11 i 17 sati',
          'Provjerite starije osobe i djecu',
          'Koristite klima uređaje ili hladne prostore',
        ],
      );
    }

    if (metrics.isDenseFog()) {
      return this.buildAssessment(
        AlertSeverityLevel.MEDIUM,
        WeatherConditionType.FOG,
        `Gusta magla — vidljivost ispod ${(metrics.visibility * 1000).toFixed(0)} m`,
        [
          'Smanjite brzinu vožnje',
          'Koristite maglenke',
          'Povećajte razmak između vozila',
        ],
      );
    }

    if (metrics.isFrost()) {
      return this.buildAssessment(
        AlertSeverityLevel.LOW,
        WeatherConditionType.FROST,
        `Mraz: temperatura ${metrics.temperature.toFixed(1)}°C`,
        [
          'Zaštitite biljke od mraza',
          'Opreznost pri hodu i vožnji — klizave površine',
          'Zaštitite vodovod od zamrzavanja',
        ],
      );
    }

    return {
      shouldAlert: false,
      severity: AlertSeverity.low(),
      condition: WeatherCondition.create(
        WeatherConditionType.FOG,
        'Normal conditions',
      ).value as WeatherCondition,
      title: '',
      description: '',
      recommendations: [],
    };
  }

  /**
   * Determine if an existing alert should be escalated based on new metrics.
   */
  shouldEscalate(alert: WeatherAlert, metrics: WeatherMetrics): AlertSeverity | null {
    const assessment = this.assessObservation(metrics);
    if (!assessment.shouldAlert) return null;
    if (assessment.severity.isSevererThan(alert.severity)) {
      return assessment.severity;
    }
    return null;
  }

  /**
   * Determine if an active alert can be resolved based on current metrics.
   */
  canResolve(metrics: WeatherMetrics): boolean {
    const assessment = this.assessObservation(metrics);
    return !assessment.shouldAlert;
  }

  private buildAssessment(
    level: AlertSeverityLevel,
    condType: WeatherConditionType,
    description: string,
    recommendations: string[],
  ): AlertAssessment {
    const condition = WeatherCondition.create(condType, description);
    const severity = AlertSeverity.create(level);
    return {
      shouldAlert: true,
      severity: severity.ok ? severity.value : AlertSeverity.low(),
      condition: condition.ok ? condition.value : ({} as WeatherCondition),
      title: this.buildTitle(level, condType),
      description,
      recommendations,
    };
  }

  private buildTitle(level: AlertSeverityLevel, condType: WeatherConditionType): string {
    const levelLabels: Record<AlertSeverityLevel, string> = {
      [AlertSeverityLevel.LOW]: 'Obavijest',
      [AlertSeverityLevel.MEDIUM]: 'Upozorenje',
      [AlertSeverityLevel.HIGH]: 'Uzbuna',
      [AlertSeverityLevel.CRITICAL]: 'KRITIČNA UZBUNA',
    };
    const condLabels: Record<WeatherConditionType, string> = {
      [WeatherConditionType.THUNDERSTORM]: 'Nevrijeme',
      [WeatherConditionType.HEAVY_RAIN]: 'Jaka kiša',
      [WeatherConditionType.HAIL]: 'Tuča',
      [WeatherConditionType.STRONG_WIND]: 'Jak vjetar',
      [WeatherConditionType.HEAVY_SNOW]: 'Jak snijeg',
      [WeatherConditionType.FOG]: 'Magla',
      [WeatherConditionType.EXTREME_HEAT]: 'Ekstremna vrućina',
      [WeatherConditionType.FROST]: 'Mraz',
      [WeatherConditionType.TORNADO_RISK]: 'Tornado',
    };
    return `${levelLabels[level]}: ${condLabels[condType]}`;
  }
}
