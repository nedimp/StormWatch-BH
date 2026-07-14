import type { WeatherAlert } from '@stormwatch/domain';
import type { AlertDto } from '../dtos/index.js';

/**
 * Outbound port — alert persistence.
 * Implemented in the infrastructure layer (Postgres, in-memory, etc.)
 */
export interface IAlertRepository {
  findById(id: string): Promise<WeatherAlert | null>;
  findActiveByRegion(regionId: string): Promise<WeatherAlert[]>;
  findAllActive(): Promise<WeatherAlert[]>;
  save(alert: WeatherAlert): Promise<void>;
}

/**
 * Outbound port — weather data provider.
 * Could be OpenWeatherMap, FHMZ RSS feed, etc.
 */
export interface IWeatherDataProvider {
  fetchCurrentConditions(latitude: number, longitude: number): Promise<RawWeatherData>;
  fetchForecast(
    latitude: number,
    longitude: number,
    hoursAhead: number,
  ): Promise<RawWeatherForecast[]>;
}

export interface RawWeatherData {
  temperatureCelsius: number;
  windSpeedKmh: number;
  windGustKmh: number;
  precipitationMmPerHour: number;
  humidityPercent: number;
  visibilityKm: number;
  pressureHpa: number;
  fetchedAt: Date;
}

export interface RawWeatherForecast extends RawWeatherData {
  forecastFor: Date;
}

/**
 * Outbound port — notification delivery.
 * Implementations: Email, SMS, Push, Webhook
 */
export interface INotificationService {
  sendAlertCreated(alert: AlertDto): Promise<void>;
  sendAlertEscalated(alert: AlertDto): Promise<void>;
  sendAlertResolved(alertId: string, regionId: string): Promise<void>;
  sendWelcomeEmail(email: string): Promise<void>;
}

/**
 * Outbound port — publish domain events to a message bus.
 */
export interface IEventBus {
  publish(eventName: string, payload: unknown): Promise<void>;
}

/**
 * Outbound port — unique ID generation (injectable for testing).
 */
export interface IIdGenerator {
  generate(): string;
}

/**
 * Outbound port — resolve a region ID to its human-readable local name.
 */
export interface IRegionNameResolver {
  resolve(regionId: string): string | undefined;
}
