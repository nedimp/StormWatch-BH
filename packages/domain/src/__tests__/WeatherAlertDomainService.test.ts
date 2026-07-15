import { describe, it, expect } from 'vitest';
import { WeatherAlertDomainService } from '../services/WeatherAlertDomainService';
import { WeatherMetrics } from '../value-objects/WeatherMetrics';
import { AlertSeverityLevel } from '../value-objects/AlertSeverity';
import { WeatherConditionType } from '../value-objects/WeatherCondition';

function makeMetrics(overrides: Partial<Parameters<typeof WeatherMetrics.create>[0]> = {}) {
  const defaults = {
    temperatureCelsius: 20,
    windSpeedKmh: 10,
    windGustKmh: 15,
    precipitationMmPerHour: 0,
    humidityPercent: 60,
    visibilityKm: 10,
    pressureHpa: 1013,
  };
  const result = WeatherMetrics.create({ ...defaults, ...overrides });
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe('WeatherAlertDomainService', () => {
  const service = new WeatherAlertDomainService();

  describe('assessObservation', () => {
    it('returns shouldAlert=false for normal conditions', () => {
      const metrics = makeMetrics();
      const assessment = service.assessObservation(metrics);
      expect(assessment.shouldAlert).toBe(false);
    });

    it('returns CRITICAL alert for extreme wind (>= 90 km/h)', () => {
      const metrics = makeMetrics({ windSpeedKmh: 95, windGustKmh: 130 });
      const assessment = service.assessObservation(metrics);
      expect(assessment.shouldAlert).toBe(true);
      expect(assessment.severity.level).toBe(AlertSeverityLevel.CRITICAL);
      expect(assessment.condition.type).toBe(WeatherConditionType.STRONG_WIND);
    });

    it('returns CRITICAL alert for extreme rain (>= 30 mm/h)', () => {
      const metrics = makeMetrics({ precipitationMmPerHour: 35 });
      const assessment = service.assessObservation(metrics);
      expect(assessment.shouldAlert).toBe(true);
      expect(assessment.severity.level).toBe(AlertSeverityLevel.CRITICAL);
      expect(assessment.condition.type).toBe(WeatherConditionType.HEAVY_RAIN);
    });

    it('returns HIGH alert for thunderstorm conditions (low pressure + high humidity + heavy rain)', () => {
      const metrics = makeMetrics({
        precipitationMmPerHour: 12,
        pressureHpa: 985,
        humidityPercent: 90,
      });
      const assessment = service.assessObservation(metrics);
      expect(assessment.shouldAlert).toBe(true);
      expect(assessment.severity.level).toBe(AlertSeverityLevel.HIGH);
      expect(assessment.condition.type).toBe(WeatherConditionType.THUNDERSTORM);
    });

    it('returns HIGH alert for strong wind (>= 60 km/h)', () => {
      const metrics = makeMetrics({ windSpeedKmh: 65, windGustKmh: 85 });
      const assessment = service.assessObservation(metrics);
      expect(assessment.shouldAlert).toBe(true);
      expect(assessment.severity.level).toBe(AlertSeverityLevel.HIGH);
    });

    it('returns MEDIUM alert for heavy rain (>= 10 mm/h)', () => {
      const metrics = makeMetrics({ precipitationMmPerHour: 15 });
      const assessment = service.assessObservation(metrics);
      expect(assessment.shouldAlert).toBe(true);
      expect(assessment.severity.level).toBe(AlertSeverityLevel.MEDIUM);
      expect(assessment.condition.type).toBe(WeatherConditionType.HEAVY_RAIN);
    });

    it('returns HIGH alert for extreme heat (>= 40°C)', () => {
      const metrics = makeMetrics({ temperatureCelsius: 42 });
      const assessment = service.assessObservation(metrics);
      expect(assessment.shouldAlert).toBe(true);
      expect(assessment.severity.level).toBe(AlertSeverityLevel.HIGH);
      expect(assessment.condition.type).toBe(WeatherConditionType.EXTREME_HEAT);
    });

    it('returns MEDIUM alert for dense fog (visibility < 200m)', () => {
      const metrics = makeMetrics({ visibilityKm: 0.1 });
      const assessment = service.assessObservation(metrics);
      expect(assessment.shouldAlert).toBe(true);
      expect(assessment.severity.level).toBe(AlertSeverityLevel.MEDIUM);
      expect(assessment.condition.type).toBe(WeatherConditionType.FOG);
    });

    it('returns LOW alert for frost (<= -5°C)', () => {
      const metrics = makeMetrics({ temperatureCelsius: -8 });
      const assessment = service.assessObservation(metrics);
      expect(assessment.shouldAlert).toBe(true);
      expect(assessment.severity.level).toBe(AlertSeverityLevel.LOW);
      expect(assessment.condition.type).toBe(WeatherConditionType.FROST);
    });

    it('includes Bosnian-language recommendations', () => {
      const metrics = makeMetrics({ windSpeedKmh: 95, windGustKmh: 130 });
      const assessment = service.assessObservation(metrics);
      expect(assessment.recommendations.length).toBeGreaterThan(0);
      expect(assessment.recommendations.some((r) => r.includes('vjetar') || r.includes('voz'))).toBe(true);
    });
  });

  describe('canResolve', () => {
    it('returns true when conditions are normal', () => {
      const metrics = makeMetrics();
      expect(service.canResolve(metrics)).toBe(true);
    });

    it('returns false when conditions are still severe', () => {
      const metrics = makeMetrics({ windSpeedKmh: 95, windGustKmh: 130 });
      expect(service.canResolve(metrics)).toBe(false);
    });
  });

  describe('assessForecast', () => {
    it('discounts severity by one level (CRITICAL → HIGH)', () => {
      // Extreme wind would be CRITICAL if observed — forecast discounts to HIGH
      const metrics = makeMetrics({ windSpeedKmh: 95, windGustKmh: 130 });
      const assessment = service.assessForecast(metrics, 24);
      expect(assessment.shouldAlert).toBe(true);
      expect(assessment.severity.level).toBe(AlertSeverityLevel.HIGH);
    });

    it('discounts severity by one level (HIGH → MEDIUM)', () => {
      // Strong wind (not extreme) would be HIGH — forecast discounts to MEDIUM
      const metrics = makeMetrics({ windSpeedKmh: 65, windGustKmh: 85 });
      const assessment = service.assessForecast(metrics, 48);
      expect(assessment.shouldAlert).toBe(true);
      expect(assessment.severity.level).toBe(AlertSeverityLevel.MEDIUM);
    });

    it('drops LOW severity forecasts (not actionable)', () => {
      // Frost would be LOW — forecast of LOW is not worth alerting
      const metrics = makeMetrics({ temperatureCelsius: -6 });
      const assessment = service.assessForecast(metrics, 72);
      expect(assessment.shouldAlert).toBe(false);
    });

    it('does not alert for below-threshold forecast conditions', () => {
      const metrics = makeMetrics(); // normal conditions
      const assessment = service.assessForecast(metrics, 24);
      expect(assessment.shouldAlert).toBe(false);
    });

    it('adds Bosnian lead-time prefix to title', () => {
      const metrics = makeMetrics({ windSpeedKmh: 95, windGustKmh: 130 });
      const assessment = service.assessForecast(metrics, 20); // ~"danas kasno"
      expect(assessment.title).toMatch(/^Prognoza \(/);
    });

    it('includes forecast uncertainty recommendation', () => {
      const metrics = makeMetrics({ windSpeedKmh: 95, windGustKmh: 130 });
      const assessment = service.assessForecast(metrics, 24);
      expect(assessment.recommendations[0]).toMatch(/prognoz/i);
    });
  });
});
