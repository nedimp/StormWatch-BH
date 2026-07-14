import { sql } from 'drizzle-orm';
import { db } from './db.js';
import { logger } from '../logger.js';

/**
 * Run schema migrations at startup.
 * Uses raw SQL so we don't need drizzle-kit in production runtime.
 */
export async function migrate(): Promise<void> {
  logger.info('Running database migrations...');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS subscribers (
      email         VARCHAR(320) PRIMARY KEY,
      subscribed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      regions       TEXT[]        NOT NULL DEFAULT '{}'
    );

    CREATE INDEX IF NOT EXISTS subscribers_email_idx ON subscribers (email);

    CREATE TABLE IF NOT EXISTS alerts (
      id               TEXT        PRIMARY KEY,
      region_id        TEXT        NOT NULL,
      region_name      TEXT        NOT NULL,
      severity         TEXT        NOT NULL,
      condition        TEXT        NOT NULL,
      title            TEXT        NOT NULL,
      description      TEXT        NOT NULL,
      recommendations  TEXT[]      NOT NULL DEFAULT '{}',
      status           TEXT        NOT NULL DEFAULT 'ACTIVE',
      issued_at        TIMESTAMPTZ NOT NULL,
      valid_until      TIMESTAMPTZ NOT NULL,
      severity_color   TEXT        NOT NULL
    );

    CREATE INDEX IF NOT EXISTS alerts_region_idx ON alerts (region_id);
    CREATE INDEX IF NOT EXISTS alerts_status_idx ON alerts (status);
    CREATE INDEX IF NOT EXISTS alerts_issued_idx ON alerts (issued_at);

    CREATE TABLE IF NOT EXISTS observations (
      id                       TEXT        PRIMARY KEY,
      station_id               TEXT        NOT NULL,
      region_id                TEXT        NOT NULL,
      latitude                 REAL        NOT NULL,
      longitude                REAL        NOT NULL,
      temperature_celsius      REAL        NOT NULL,
      wind_speed_kmh           REAL        NOT NULL,
      wind_gust_kmh            REAL        NOT NULL,
      precipitation_mm_per_hour REAL       NOT NULL,
      humidity_percent         REAL        NOT NULL,
      visibility_km            REAL        NOT NULL,
      pressure_hpa             REAL        NOT NULL,
      weather_code             INTEGER,
      source                   TEXT        NOT NULL DEFAULT 'API_PROVIDER',
      observed_at              TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS observations_station_idx ON observations (station_id);
    CREATE INDEX IF NOT EXISTS observations_region_idx  ON observations (region_id);
    CREATE INDEX IF NOT EXISTS observations_observed_idx ON observations (observed_at DESC);
  `);

  logger.info('Database migrations complete');
}
