import { desc, eq, sql } from 'drizzle-orm';
import { observations } from '../database/schema.js';
import type { Db } from '../database/db.js';
import type { IWeatherObservationRepository } from '@stormwatch/domain';
import { WeatherObservation, Coordinates, WeatherMetrics } from '@stormwatch/domain';

function rowToEntity(row: typeof observations.$inferSelect): WeatherObservation | null {
  const coords = Coordinates.create(row.latitude, row.longitude);
  const metrics = WeatherMetrics.create({
    temperatureCelsius: row.temperatureCelsius,
    windSpeedKmh: row.windSpeedKmh,
    windGustKmh: row.windGustKmh,
    precipitationMmPerHour: row.precipitationMmPerHour,
    humidityPercent: row.humidityPercent,
    visibilityKm: row.visibilityKm,
    pressureHpa: row.pressureHpa,
  });
  if (!coords.ok || !metrics.ok) return null;

  const result = WeatherObservation.create(row.id, {
    stationId: row.stationId,
    regionId: row.regionId,
    coordinates: coords.value,
    metrics: metrics.value,
    conditions: [],
    observedAt: row.observedAt,
    source: row.source as WeatherObservation['source'],
  });
  return result.ok ? result.value : null;
}

/**
 * DrizzleObservationRepository
 *
 * Persists weather observations in PostgreSQL.
 * Uses UPSERT by station so we always keep the latest reading per station
 * without unbounded table growth — perfect for the "current conditions" use case.
 */
export class DrizzleObservationRepository implements IWeatherObservationRepository {
  constructor(private readonly db: Db) {}

  async save(obs: WeatherObservation): Promise<void> {
    await this.db
      .insert(observations)
      .values({
        id: obs.id,
        stationId: obs.stationId,
        regionId: obs.regionId,
        latitude: obs.coordinates.latitude,
        longitude: obs.coordinates.longitude,
        temperatureCelsius: obs.metrics.temperature,
        windSpeedKmh: obs.metrics.windSpeed,
        windGustKmh: obs.metrics.windGust,
        precipitationMmPerHour: obs.metrics.precipitation,
        humidityPercent: obs.metrics.humidity,
        visibilityKm: obs.metrics.visibility,
        pressureHpa: obs.metrics.pressure,
        source: obs.source,
        observedAt: obs.observedAt,
      })
      .onConflictDoUpdate({
        target: observations.stationId,
        set: {
          id: sql`excluded.id`,
          regionId: sql`excluded.region_id`,
          latitude: sql`excluded.latitude`,
          longitude: sql`excluded.longitude`,
          temperatureCelsius: sql`excluded.temperature_celsius`,
          windSpeedKmh: sql`excluded.wind_speed_kmh`,
          windGustKmh: sql`excluded.wind_gust_kmh`,
          precipitationMmPerHour: sql`excluded.precipitation_mm_per_hour`,
          humidityPercent: sql`excluded.humidity_percent`,
          visibilityKm: sql`excluded.visibility_km`,
          pressureHpa: sql`excluded.pressure_hpa`,
          source: sql`excluded.source`,
          observedAt: sql`excluded.observed_at`,
        },
      });
  }

  async findById(id: string): Promise<WeatherObservation | null> {
    const [row] = await this.db.select().from(observations).where(eq(observations.id, id));
    return row ? rowToEntity(row) : null;
  }

  async findByStation(stationId: string, limit = 100): Promise<WeatherObservation[]> {
    const rows = await this.db
      .select().from(observations)
      .where(eq(observations.stationId, stationId))
      .orderBy(desc(observations.observedAt))
      .limit(limit);
    return rows.map(rowToEntity).filter(Boolean) as WeatherObservation[];
  }

  async findByRegion(regionId: string, since: Date): Promise<WeatherObservation[]> {
    const rows = await this.db
      .select().from(observations)
      .where(eq(observations.regionId, regionId))
      .orderBy(desc(observations.observedAt));
    return rows
      .filter((r) => r.observedAt >= since)
      .map(rowToEntity).filter(Boolean) as WeatherObservation[];
  }

  async findLatestByStation(stationId: string): Promise<WeatherObservation | null> {
    const [row] = await this.db
      .select().from(observations)
      .where(eq(observations.stationId, stationId))
      .orderBy(desc(observations.observedAt))
      .limit(1);
    return row ? rowToEntity(row) : null;
  }

  async findAllLatestPerStation(): Promise<WeatherObservation[]> {
    // DISTINCT ON is PostgreSQL-specific but efficient — one row per station, latest first
    const rows = await this.db.execute<typeof observations.$inferSelect>(sql`
      SELECT DISTINCT ON (station_id) *
      FROM observations
      ORDER BY station_id, observed_at DESC
    `);
    return (rows.rows as (typeof observations.$inferSelect)[])
      .map(rowToEntity).filter(Boolean) as WeatherObservation[];
  }
}
