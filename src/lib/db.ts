
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with standard pg driver
// Render internal connections often require no SSL or strict SSL disabled
// Global object to cache the pool in development to prevent connection exhaustion
const globalForDb = globalThis as unknown as { conn: Pool | undefined };

export const pool = globalForDb.conn ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  ssl: { rejectUnauthorized: false }, // Verified working config
});

// Add error handler to prevent the pool from crashing on idle client errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

if (process.env.NODE_ENV !== 'production') globalForDb.conn = pool;

export const db = drizzle(pool, { schema });
