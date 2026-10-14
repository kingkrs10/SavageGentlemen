import pg from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const databaseUrl = process.env.DATABASE_URL;
const isNeon = databaseUrl.includes('neon.tech');

let pool: any;
let db: any;

if (isNeon) {
  // Configure Neon with WebSocket constructor
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ 
    connectionString: databaseUrl,
    max: 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });
  db = drizzleNeon({ client: pool, schema });
} else {
  // Standard PostgreSQL (Coolify, Docker, Local, AWS RDS)
  const { Pool: PgPool } = pg;
  const requiresSsl = databaseUrl.includes('sslmode=require') || databaseUrl.includes('ssl=true');
  pool = new PgPool({ 
    connectionString: databaseUrl,
    max: 20,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
  });
  db = drizzlePg({ client: pool, schema });
}

export { pool, db };
