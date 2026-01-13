
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
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  // Render internal network usually requires SSL to be disabled.
  // We've tried multiple configs; reverting to false as it's the standard internal setting.
  ssl: false,
});

export const db = drizzle(pool, { schema });
