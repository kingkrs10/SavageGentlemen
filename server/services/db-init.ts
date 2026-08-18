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

    // 5. Seed default high-converting viral ads for all 5 site placements if empty
    try {
      const activeAds = await db.execute(sql`SELECT id, placement FROM sponsored_content WHERE is_active = true;`);
      const existingPlacements = new Set((activeAds.rows as any[]).map((r) => r.placement));

      const viralAdsToSeed = [
        {
          title: "⚡ LIMITED DROP: Savage Gentlemen Heavyweight 480GSM French Terry Hoodie",
          description: "Handcrafted luxury streetwear with custom gold embroidery and secret waterproof fete pocket. Only 50 pieces produced.",
          type: "product",
          placement: "header_ticker",
          linkUrl: "/shop",
          ctaText: "Claim Your Drop",
          imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&h=1000&fit=crop",
          price: "$98.00",
          priority: 100,
        },
        {
          title: "🌴 Soca Passport: The Caribbean Loyalty Program That Pays You To Party",
          description: "Check into Caribbean events, earn digital stamps, and unlock free VIP passes, $10 drink discounts, and exclusive soundclash merch.",
          type: "banner",
          placement: "article_inline",
          linkUrl: "/socapassport/dashboard",
          ctaText: "Activate Free Passport (+100 Pts)",
          imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=600&fit=crop",
          priority: 95,
        },
        {
          title: "🔥 Soca Noir 2026: The Obsidian & Gold Masquerade",
          description: "World-class sound system, ultra-premium open bar, secret Brooklyn/Miami warehouse venue. Tier 1 passes closing soon.",
          type: "event",
          placement: "article_sidebar",
          linkUrl: "/events",
          ctaText: "Secure VIP Passes",
          imageUrl: "https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&h=800&fit=crop",
          priority: 90,
        },
        {
          title: "✨ Savage Gentlemen Laser-Engraved Stainless Steel Flask Set",
          description: "Matte obsidian black food-grade stainless steel with precision gold funnel. Engineered for high-energy nightlife.",
          type: "product",
          placement: "shop_feed",
          linkUrl: "/shop",
          ctaText: "Order Merch ($48)",
          imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=600&fit=crop",
          price: "$48.00",
          priority: 85,
        },
        {
          title: "🎧 Unlock Uncensored Studio Dubplates & Full 135BPM Stems",
          description: "Live raw recordings from premier Caribbean soundclash selectors.",
          type: "standard",
          placement: "audio_player",
          linkUrl: "/media",
          ctaText: "Unlock Stems ($1.99)",
          priority: 80,
        },
      ];

      for (const ad of viralAdsToSeed) {
        if (!existingPlacements.has(ad.placement)) {
          console.log(`[DBInit] 📢 Seeding high-traffic viral ad for placement: ${ad.placement}...`);
          await db.execute(sql`
            INSERT INTO sponsored_content (
              title, description, type, placement, link_url, cta_text, image_url, price, priority, is_active, created_at, updated_at
            ) VALUES (
              ${ad.title}, ${ad.description}, ${ad.type}, ${ad.placement}, ${ad.linkUrl}, ${ad.ctaText}, ${ad.imageUrl || null}, ${ad.price || null}, ${ad.priority}, true, NOW(), NOW()
            );
          `);
        }
      }
      console.log("[DBInit] ✅ High-traffic viral ads verified and active across all placements.");
    } catch (adSeedErr: any) {
      console.error("[DBInit] Viral ad seeder note:", adSeedErr.message);
    }

    // 6. Initialize and start the Autonomous Magazine & Ingestion Bot
    await magazineBot.start(6);

    // 7. Initialize and start the Autonomous 2-Post-Per-Day Social Publisher
    await socialAutoPoster.init();
  } catch (error: any) {
    console.error("[DBInit] ⚠️ Error during database table initialization:", error.message);
  }
}
