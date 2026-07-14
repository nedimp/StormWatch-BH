import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';

const DATABASE_URL =
  process.env['DATABASE_URL'] ??
  `postgresql://127.0.0.1:5432/stormwatch_bh`;

// Single shared connection pool for the process lifetime
const queryClient = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
});

export const db = drizzle(queryClient, { schema });
export type Db = typeof db;
