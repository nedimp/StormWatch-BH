/**
 * @stormwatch/shared
 *
 * HTTP API contract types — the shape of data that crosses the network boundary.
 * Imported by both the API server (apps/api) and the web client (apps/web) so
 * the JSON contract has a single authoritative definition.
 *
 * Rules:
 *  - No runtime code (no functions, no classes, no imports from other packages)
 *  - No Node.js-specific types
 *  - Types reflect what JSON actually contains (string literals, not enums)
 */

// ── Primitive string-literal unions ─────────────────────────────────────────

/** Severity level of a weather alert. */
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Lifecycle status of a weather alert. */
export type AlertStatus = 'ACTIVE' | 'ESCALATED' | 'RESOLVED' | 'EXPIRED';

/** Category of weather condition that triggered an alert. */
export type WeatherConditionType =
  | 'THUNDERSTORM'
  | 'HEAVY_RAIN'
  | 'HAIL'
  | 'STRONG_WIND'
  | 'HEAVY_SNOW'
  | 'FOG'
  | 'EXTREME_HEAT'
  | 'FROST'
  | 'TORNADO_RISK';

/** BiH administrative entity. */
export type BiHEntity = 'FBiH' | 'RS' | 'BD';

// ── API response shapes (DTOs) ───────────────────────────────────────────────

/**
 * A weather alert as returned by GET /api/v1/alerts.
 * All dates are ISO 8601 strings.
 *
 * isForecasted: true  → alert is based on forecast data (a few days ahead)
 * isForecasted: false → alert is based on currently observed conditions
 */
export interface AlertDto {
  id: string;
  regionId: string;
  regionName: string;
  severity: AlertSeverity;
  condition: WeatherConditionType;
  title: string;
  description: string;
  recommendations: string[];
  status: AlertStatus;
  issuedAt: string;
  validUntil: string;
  severityColor: string;
  /** True when this alert is a forecast (predicted), not an observation. */
  isForecasted: boolean;
  /** ISO 8601 — when the severe weather is expected to occur (forecast only). */
  forecastFor?: string;
}

/**
 * A BiH geographic region as returned by GET /api/v1/regions.
 */
export interface RegionDto {
  id: string;
  name: string;
  localName: string;
  entity: BiHEntity;
  canton?: string;
  centroid: { lat: number; lng: number };
  population: number;
}

/**
 * Current weather conditions for a single station as returned by
 * GET /api/v1/observations/current.
 * All dates are ISO 8601 strings.
 */
export interface CurrentConditionDto {
  id: string;
  stationId: string;
  stationName: string;
  regionId: string;
  latitude: number;
  longitude: number;
  temperatureCelsius: number;
  windSpeedKmh: number;
  windGustKmh: number;
  precipitationMmPerHour: number;
  humidityPercent: number;
  visibilityKm: number;
  pressureHpa: number;
  weatherCode: number;
  observedAt: string;
  source: string;
}
