export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'ESCALATED' | 'RESOLVED' | 'EXPIRED';
export type WeatherCondition =
  | 'THUNDERSTORM'
  | 'HEAVY_RAIN'
  | 'HAIL'
  | 'STRONG_WIND'
  | 'HEAVY_SNOW'
  | 'FOG'
  | 'EXTREME_HEAT'
  | 'FROST'
  | 'TORNADO_RISK';

export interface AlertDto {
  id: string;
  regionId: string;
  regionName: string;
  severity: AlertSeverity;
  condition: WeatherCondition;
  title: string;
  description: string;
  recommendations: string[];
  status: AlertStatus;
  issuedAt: string;
  validUntil: string;
  severityColor: string;
}

export interface RegionDto {
  id: string;
  name: string;
  localName: string;
  entity: 'FBiH' | 'RS' | 'BD';
  canton?: string;
  centroid: { lat: number; lng: number };
  population: number;
}

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
  observedAt: string;
  source: string;
}
