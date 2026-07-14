import type { IWeatherAlertRepository } from '@stormwatch/domain';
import { WeatherAlert } from '@stormwatch/domain';

/**
 * In-memory alert repository — used for development and tests.
 * Replace with DrizzleAlertRepository for production.
 */
export class InMemoryAlertRepository implements IWeatherAlertRepository {
  private readonly store = new Map<string, WeatherAlert>();

  async findById(id: string): Promise<WeatherAlert | null> {
    return this.store.get(id) ?? null;
  }

  async findActiveByRegion(regionId: string): Promise<WeatherAlert[]> {
    return [...this.store.values()].filter(
      (a) => a.regionId === regionId && a.isActive(),
    );
  }

  async findAllActive(): Promise<WeatherAlert[]> {
    return [...this.store.values()].filter((a) => a.isActive());
  }

  async findByRegion(regionId: string, limit = 50): Promise<WeatherAlert[]> {
    return [...this.store.values()]
      .filter((a) => a.regionId === regionId)
      .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime())
      .slice(0, limit);
  }

  async save(alert: WeatherAlert): Promise<void> {
    this.store.set(alert.id, alert);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
