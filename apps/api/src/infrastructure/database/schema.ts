import { pgTable, text, timestamp, varchar, index, real, integer } from 'drizzle-orm/pg-core';

// ── Subscribers ──────────────────────────────────────────────────────────────
export const subscribers = pgTable('subscribers', {
  email:        varchar('email', { length: 320 }).primaryKey(),
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }).defaultNow().notNull(),
  regions:      text('regions').array().default([]).notNull(), // empty = all regions
}, (t) => ({
  emailIdx: index('subscribers_email_idx').on(t.email),
}));

// ── Observations (latest conditions per station) ────────────────────────────
export const observations = pgTable('observations', {
  id:                      text('id').primaryKey(),
  stationId:               text('station_id').notNull(),
  regionId:                text('region_id').notNull(),
  latitude:                real('latitude').notNull(),
  longitude:               real('longitude').notNull(),
  temperatureCelsius:      real('temperature_celsius').notNull(),
  windSpeedKmh:            real('wind_speed_kmh').notNull(),
  windGustKmh:             real('wind_gust_kmh').notNull(),
  precipitationMmPerHour:  real('precipitation_mm_per_hour').notNull(),
  humidityPercent:         real('humidity_percent').notNull(),
  visibilityKm:            real('visibility_km').notNull(),
  pressureHpa:             real('pressure_hpa').notNull(),
  weatherCode:             integer('weather_code'),
  source:                  text('source').notNull().default('API_PROVIDER'),
  observedAt:              timestamp('observed_at', { withTimezone: true }).notNull(),
}, (t) => ({
  stationIdx:  index('observations_station_idx').on(t.stationId),
  regionIdx:   index('observations_region_idx').on(t.regionId),
  observedIdx: index('observations_observed_idx').on(t.observedAt),
}));
export const alerts = pgTable('alerts', {
  id:           text('id').primaryKey(),
  regionId:     text('region_id').notNull(),
  regionName:   text('region_name').notNull(),
  severity:     text('severity').notNull(),
  condition:    text('condition').notNull(),
  title:        text('title').notNull(),
  description:  text('description').notNull(),
  recommendations: text('recommendations').array().default([]).notNull(),
  status:       text('status').notNull().default('ACTIVE'),
  issuedAt:     timestamp('issued_at', { withTimezone: true }).notNull(),
  validUntil:   timestamp('valid_until', { withTimezone: true }).notNull(),
  severityColor: text('severity_color').notNull(),
}, (t) => ({
  regionIdx:  index('alerts_region_idx').on(t.regionId),
  statusIdx:  index('alerts_status_idx').on(t.status),
  issuedIdx:  index('alerts_issued_idx').on(t.issuedAt),
}));
