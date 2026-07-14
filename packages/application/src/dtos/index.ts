import type { WeatherAlert } from '@stormwatch/domain';
import type { AlertSeverityLevel } from '@stormwatch/domain';
import type { WeatherConditionType } from '@stormwatch/domain';

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

export interface AlertDto {
  id: string;
  regionId: string;
  regionName: string;
  severity: AlertSeverityLevel;
  condition: WeatherConditionType;
  title: string;
  description: string;
  recommendations: string[];
  status: string;
  issuedAt: string;
  validUntil: string;
  severityColor: string;
}

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
  };
}
