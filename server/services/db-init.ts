import { db } from "../db";
import { sql } from "drizzle-orm";
import { magazineBot } from "../workers/magazine-bot";

/**
 * Self-healing database initialization.
 * Automatically verifies that all tables and columns exist in PostgreSQL on every server startup,
 * ensuring zero errors on fresh cloud deploys (Render, Railway, Replit).
 */
export async function initializeDatabaseTables(): Promise<void> {
  try {
    console.log("[DBInit] 🛠️ Verifying database tables and schemas...");

    // 1. Verify and create articles table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'nightlife',
        featured_image TEXT,
        source_url TEXT,
        source_name TEXT,
        author TEXT DEFAULT 'Savage Editorial',
        tags TEXT[],
        read_time TEXT DEFAULT '3 min read',
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        is_ai_generated BOOLEAN DEFAULT true,
        is_published BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        ig_posted BOOLEAN DEFAULT false,
        ig_post_id TEXT,
        published_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Verify placement column on sponsored_content
    await db.execute(sql`
      ALTER TABLE sponsored_content 
      ADD COLUMN IF NOT EXISTS placement TEXT DEFAULT 'header_ticker';
    `);

    // 3. Verify site_settings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_by INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("[DBInit] ✅ Tables verified successfully.");

    // 4. Initialize and start the Autonomous Magazine & Ingestion Bot
    await magazineBot.start(6);
  } catch (error: any) {
    console.error("[DBInit] ⚠️ Error during database table initialization:", error.message);
  }
}
