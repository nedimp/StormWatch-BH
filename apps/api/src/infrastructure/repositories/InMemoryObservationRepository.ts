import type { IWeatherObservationRepository } from '@stormwatch/domain';
import { WeatherObservation } from '@stormwatch/domain';

export class InMemoryObservationRepository implements IWeatherObservationRepository {
  private readonly store = new Map<string, WeatherObservation>();

  async findById(id: string): Promise<WeatherObservation | null> {
    return this.store.get(id) ?? null;
  }

  async findByStation(stationId: string, limit = 100): Promise<WeatherObservation[]> {
    return [...this.store.values()]
      .filter((o) => o.stationId === stationId)
      .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime())
      .slice(0, limit);
  }

  async findByRegion(regionId: string, since: Date): Promise<WeatherObservation[]> {
    return [...this.store.values()]
      .filter((o) => o.regionId === regionId && o.observedAt >= since)
      .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime());
  }

  async findLatestByStation(stationId: string): Promise<WeatherObservation | null> {
    const sorted = [...this.store.values()]
      .filter((o) => o.stationId === stationId)
      .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime());
    return sorted[0] ?? null;
  }

  async save(observation: WeatherObservation): Promise<void> {
    this.store.set(observation.id, observation);
  }
}
