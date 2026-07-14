import { WeatherAlert } from '../entities/WeatherAlert.js';
import { WeatherObservation } from '../entities/WeatherObservation.js';

export interface IWeatherAlertRepository {
  findById(id: string): Promise<WeatherAlert | null>;
  findActiveByRegion(regionId: string): Promise<WeatherAlert[]>;
  findAllActive(): Promise<WeatherAlert[]>;
  findByRegion(regionId: string, limit?: number): Promise<WeatherAlert[]>;
  save(alert: WeatherAlert): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IWeatherObservationRepository {
  findById(id: string): Promise<WeatherObservation | null>;
  findByStation(stationId: string, limit?: number): Promise<WeatherObservation[]>;
  findByRegion(regionId: string, since: Date): Promise<WeatherObservation[]>;
  findLatestByStation(stationId: string): Promise<WeatherObservation | null>;
  save(observation: WeatherObservation): Promise<void>;
}
