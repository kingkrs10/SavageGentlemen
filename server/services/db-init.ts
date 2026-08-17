import { db } from "../db";
import { sql } from "drizzle-orm";
import { magazineBot } from "../workers/magazine-bot";
import { socialAutoPoster } from "../workers/social-autoposter";

/**
 * Self-healing database initialization.
 * Automatically verifies that all tables, columns, and admin accounts exist in PostgreSQL on every server startup,
 * ensuring zero errors on cloud deploys (Render, Railway, Replit).
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

    // 4. Ensure primary admin account krsone12 / savgmen@gmail.com exists with password Keny@592
    try {
      const userRows = await db.execute(sql`
        SELECT id, username, email FROM users 
        WHERE LOWER(username) = 'krsone12' OR LOWER(email) = 'savgmen@gmail.com';
      `);

      if (userRows.rows.length === 0) {
        console.log("[DBInit] 👑 Creating primary admin account krsone12...");
        await db.execute(sql`
          INSERT INTO users (username, password, email, display_name, role, is_guest, is_pro, created_at, updated_at)
          VALUES ('krsone12', 'Keny@592', 'savgmen@gmail.com', 'KingKrs', 'admin', false, true, NOW(), NOW());
        `);
      } else {
        console.log("[DBInit] 👑 Updating primary admin account credentials for krsone12...");
        await db.execute(sql`
          UPDATE users 
          SET password = 'Keny@592', role = 'admin', username = 'krsone12', email = 'savgmen@gmail.com', display_name = 'KingKrs'
          WHERE LOWER(username) = 'krsone12' OR LOWER(email) = 'savgmen@gmail.com';
        `);
      }
      console.log("[DBInit] ✅ Primary admin account krsone12 verified and active.");
    } catch (adminErr: any) {
      console.error("[DBInit] Admin account sync note:", adminErr.message);
    }

    console.log("[DBInit] ✅ Tables and Admin verified successfully.");

    // 5. Initialize and start the Autonomous Magazine & Ingestion Bot
    await magazineBot.start(6);

    // 6. Initialize and start the Autonomous 2-Post-Per-Day Social Publisher
    await socialAutoPoster.init();
  } catch (error: any) {
    console.error("[DBInit] ⚠️ Error during database table initialization:", error.message);
  }
}
