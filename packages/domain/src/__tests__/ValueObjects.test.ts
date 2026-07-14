import { describe, it, expect } from 'vitest';
import { Coordinates } from '../value-objects/Coordinates';
import { AlertSeverity, AlertSeverityLevel } from '../value-objects/AlertSeverity';
import { WeatherMetrics } from '../value-objects/WeatherMetrics';

describe('Coordinates', () => {
  it('creates valid BiH coordinates', () => {
    const result = Coordinates.create(43.8564, 18.4131);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.latitude).toBe(43.8564);
      expect(result.value.isWithinBiH()).toBe(true);
    }
  });

  it('rejects invalid latitude', () => {
    const result = Coordinates.create(200, 18);
    expect(result.ok).toBe(false);
  });

  it('recognizes out-of-BiH coordinates', () => {
    const result = Coordinates.create(52.5, 13.4); // Berlin
    if (result.ok) expect(result.value.isWithinBiH()).toBe(false);
  });

  it('calculates approximate distance between cities', () => {
    const sarajevo = Coordinates.create(43.8564, 18.4131);
    const bihac = Coordinates.create(44.8167, 15.8706);
    if (sarajevo.ok && bihac.ok) {
      const dist = sarajevo.value.distanceTo(bihac.value);
      expect(dist).toBeGreaterThan(200);
      expect(dist).toBeLessThan(300);
    }
  });
});

describe('AlertSeverity', () => {
  it('orders severity correctly', () => {
    expect(AlertSeverity.critical().isSevererThan(AlertSeverity.high())).toBe(true);
    expect(AlertSeverity.high().isSevererThan(AlertSeverity.medium())).toBe(true);
    expect(AlertSeverity.medium().isSevererThan(AlertSeverity.low())).toBe(true);
    expect(AlertSeverity.low().isSevererThan(AlertSeverity.medium())).toBe(false);
  });

  it('provides correct color for each level', () => {
    expect(AlertSeverity.critical().color).toBe('#9C27B0');
    expect(AlertSeverity.high().color).toBe('#F44336');
    expect(AlertSeverity.medium().color).toBe('#FF9800');
    expect(AlertSeverity.low().color).toBe('#4CAF50');
  });

  it('isAtLeast is inclusive', () => {
    expect(AlertSeverity.high().isAtLeast(AlertSeverity.high())).toBe(true);
    expect(AlertSeverity.high().isAtLeast(AlertSeverity.medium())).toBe(true);
    expect(AlertSeverity.medium().isAtLeast(AlertSeverity.high())).toBe(false);
  });
});

describe('WeatherMetrics', () => {
  it('rejects invalid humidity', () => {
    const result = WeatherMetrics.create({
      temperatureCelsius: 20,
      windSpeedKmh: 10,
      windGustKmh: 15,
      precipitationMmPerHour: 0,
      humidityPercent: 150, // invalid
      visibilityKm: 10,
      pressureHpa: 1013,
    });
    expect(result.ok).toBe(false);
  });

  it('detects extreme rain threshold correctly', () => {
    const normal = WeatherMetrics.create({
      temperatureCelsius: 20, windSpeedKmh: 10, windGustKmh: 15,
      precipitationMmPerHour: 9.9, humidityPercent: 70, visibilityKm: 5, pressureHpa: 1010,
    });
    const extreme = WeatherMetrics.create({
      temperatureCelsius: 20, windSpeedKmh: 10, windGustKmh: 15,
      precipitationMmPerHour: 30, humidityPercent: 70, visibilityKm: 5, pressureHpa: 1010,
    });
    if (normal.ok) expect(normal.value.isExtremeRain()).toBe(false);
    if (extreme.ok) expect(extreme.value.isExtremeRain()).toBe(true);
  });
});
