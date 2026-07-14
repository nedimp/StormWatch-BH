import { pgTable, text, timestamp, varchar, index } from 'drizzle-orm/pg-core';

// ── Subscribers ──────────────────────────────────────────────────────────────
export const subscribers = pgTable('subscribers', {
  email:        varchar('email', { length: 320 }).primaryKey(),
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }).defaultNow().notNull(),
  regions:      text('regions').array().default([]).notNull(), // empty = all regions
}, (t) => ({
  emailIdx: index('subscribers_email_idx').on(t.email),
}));

// ── Alerts (persisted for history) ──────────────────────────────────────────
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
