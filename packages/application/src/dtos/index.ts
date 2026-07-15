import type { WeatherAlert } from '@stormwatch/domain';
import type { AlertSeverityLevel } from '@stormwatch/domain';
import type { AlertDto } from '@stormwatch/shared';

// Re-export AlertDto so existing application-layer consumers don't need to change their import path
export type { AlertDto } from '@stormwatch/shared';

// ── Inbound DTOs (commands) ──────────────────────────────────────────────────

export interface RecordObservationCommand {
  stationId: string;
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
  source: 'AUTOMATIC_STATION' | 'MANUAL' | 'API_PROVIDER' | 'RADAR';
  observedAt: Date;
  /**
   * When set, this is a forecast observation.
   * forecastFor is the future time the metrics are predicted for.
   * The domain will apply a severity discount and a "Prognoza" title prefix.
   */
  forecastFor?: Date;
}

export interface GetActiveAlertsQuery {
  regionId?: string;
  severity?: AlertSeverityLevel;
  limit?: number;
}

export interface ResolveAlertCommand {
  alertId: string;
  resolvedBy: string;
  reason: string;
}

// ── Outbound DTOs (views) ────────────────────────────────────────────────────
// AlertDto is defined in @stormwatch/shared and re-exported above.

export interface ObservationDto {
  id: string;
  stationId: string;
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
  observedAt: string;
}

export function toAlertDto(alert: WeatherAlert): AlertDto {
  return {
    id: alert.id,
    regionId: alert.regionId,
    regionName: alert.regionName,
    severity: alert.severity.level,
    condition: alert.condition.type,
    title: alert.title,
    description: alert.description,
    recommendations: [...alert.recommendations],
    status: alert.status,
    issuedAt: alert.issuedAt.toISOString(),
    validUntil: alert.validUntil.toISOString(),
    severityColor: alert.severity.color,
    isForecasted: alert.isForecasted,
    // Use spread to satisfy exactOptionalPropertyTypes — only include forecastFor
    // when it actually has a value, not when it is undefined
    ...(alert.forecastFor ? { forecastFor: alert.forecastFor.toISOString() } : {}),
  };
}
