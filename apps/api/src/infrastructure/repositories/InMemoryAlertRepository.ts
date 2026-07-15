import type { IWeatherAlertRepository } from '@stormwatch/domain';
import { WeatherAlert } from '@stormwatch/domain';

/**
 * In-memory alert repository — used for development and tests.
 * Replace with DrizzleAlertRepository for production.
 */
export class InMemoryAlertRepository implements IWeatherAlertRepository {
  private readonly store = new Map<string, WeatherAlert>();

  findById(id: string): Promise<WeatherAlert | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  findActiveByRegion(regionId: string): Promise<WeatherAlert[]> {
    return Promise.resolve(
      [...this.store.values()].filter(
        (a) => a.regionId === regionId && a.isActive(),
      ),
    );
  }

  findAllActive(): Promise<WeatherAlert[]> {
    return Promise.resolve([...this.store.values()].filter((a) => a.isActive()));
  }

  findByRegion(regionId: string, limit = 50): Promise<WeatherAlert[]> {
    return Promise.resolve(
      [...this.store.values()]
        .filter((a) => a.regionId === regionId)
        .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime())
        .slice(0, limit),
    );
  }

  save(alert: WeatherAlert): Promise<void> {
    this.store.set(alert.id, alert);
    return Promise.resolve();
  }

  delete(id: string): Promise<void> {
    this.store.delete(id);
    return Promise.resolve();
  }
}
