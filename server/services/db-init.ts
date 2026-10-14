import { db } from "../db";
import { sql, eq, ilike } from "drizzle-orm";
import { events, tickets, siteSettings } from "@shared/schema";
import { magazineBot } from "../workers/magazine-bot";
import { socialAutoPoster } from "../workers/social-autoposter";
import { eventCoordinatorService } from "./event-coordinator";
import { cleanTitle, cleanCaption, isDuplicateStory } from "@shared/text-sanitizer";
import crypto from "crypto";
import { RESTORED_COMMUNITY_MEMBERS } from "./restored-users";

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
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS sponsored_content (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'standard',
          placement TEXT NOT NULL DEFAULT 'header_ticker',
          image_url TEXT,
          logo_url TEXT,
          link_url TEXT,
          background_color TEXT DEFAULT 'bg-gray-800',
          text_color TEXT DEFAULT 'text-white',
          cta_text TEXT DEFAULT 'Learn More',
          price TEXT,
          event_date TEXT,
          location TEXT,
          video_url TEXT,
          is_active BOOLEAN DEFAULT true,
          priority INTEGER DEFAULT 0,
          start_date TIMESTAMP,
          end_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      await db.execute(sql`
        ALTER TABLE sponsored_content 
        ADD COLUMN IF NOT EXISTS placement TEXT DEFAULT 'header_ticker';
      `);
    } catch (scErr: any) {
      console.warn("[DBInit] Sponsored content table note:", scErr.message);
    }

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

    // 4.5 Ensure historical community members, attendees, and registered users exist
    try {
      let addedCount = 0;
      for (const m of RESTORED_COMMUNITY_MEMBERS) {
        const cleanEmail = m.email.toLowerCase().trim();
        const cleanUsername = m.username;
        const cleanDisplayName = m.displayName;
        const fbId = m.firebaseId || null;
        const pwdHash = crypto.createHash("sha256").update(cleanEmail + "Savage2026!").digest("hex");

        const existing = await db.execute(sql`
          SELECT id FROM users WHERE LOWER(email) = ${cleanEmail} OR LOWER(username) = ${cleanUsername} LIMIT 1;
        `);

        let userId: number;
        if (existing.rows.length === 0) {
          const insertRes = await db.execute(sql`
            INSERT INTO users (username, password, display_name, email, role, is_guest, is_pro, firebase_id, created_at, updated_at)
            VALUES (${cleanUsername}, ${pwdHash}, ${cleanDisplayName}, ${cleanEmail}, 'user', false, false, ${fbId}, NOW(), NOW())
            RETURNING id;
          `);
          userId = (insertRes.rows[0] as any).id;
          addedCount++;
        } else {
          userId = (existing.rows[0] as any).id;
        }

        // Ensure Soca Passport profile
        await db.execute(sql`
          INSERT INTO passport_profiles (user_id, handle, total_points, current_tier, created_at, updated_at)
          VALUES (${userId}, ${cleanUsername}, 100, 'BRONZE', NOW(), NOW())
          ON CONFLICT (user_id) DO NOTHING;
        `);

        // Ensure email subscriber entry
        await db.execute(sql`
          INSERT INTO email_subscribers (email, first_name, status, source, user_id, created_at, updated_at)
          VALUES (${cleanEmail}, ${cleanDisplayName.split(' ')[0]}, 'active', ${m.source}, ${userId}, NOW(), NOW())
          ON CONFLICT DO NOTHING;
        `);
      }

      if (addedCount > 0) {
        console.log(`[DBInit] 👥 Restored and seeded ${addedCount} community members into database.`);
      } else {
        console.log(`[DBInit] ✅ Community members verified (${RESTORED_COMMUNITY_MEMBERS.length} active in database).`);
      }
    } catch (usersHealErr: any) {
      console.error("[DBInit] Community user self-healing note:", usersHealErr.message);
    }

    // 5. Seed default high-converting viral ads for all 5 site placements if empty
    try {
      const activeAds = await db.execute(sql`SELECT id, placement FROM sponsored_content WHERE is_active = true;`);
      const existingPlacements = new Set((activeAds.rows as any[]).map((r) => r.placement));

      const viralAdsToSeed = [
        {
          title: "🌴 Carnival Planner | Official Luxury Fete & Itinerary Concierge",
          description: "Elevate your carnival experience with all-inclusive VIP fete schedules, costume concierge, and luxury travel.",
          type: "banner",
          placement: "header_ticker",
          linkUrl: "https://www.carnival-planner.com",
          ctaText: "Plan Your Carnival",
          imageUrl: "/images/carnival-planner-ad.jpg",
          priority: 150,
        },
        {
          title: "🌴 Carnival Planner: Unforgettable Bespoke Caribbean Escapes",
          description: "All-inclusive VIP fete schedules, premium hotel accommodations, and costume concierge for Trinidad, Barbados & Jamaica.",
          type: "banner",
          placement: "article_inline",
          linkUrl: "https://www.carnival-planner.com",
          ctaText: "Book at Carnival-Planner.com",
          imageUrl: "/images/carnival-planner-ad.jpg",
          priority: 140,
        },
        {
          title: "👑 Carnival Planner Masquerade Concierge",
          description: "Custom fete itineraries & luxury carnival masquerader packages.",
          type: "event",
          placement: "article_sidebar",
          linkUrl: "https://www.carnival-planner.com",
          ctaText: "Explore Packages",
          imageUrl: "/images/carnival-planner-vertical.jpg",
          priority: 130,
        },
        {
          title: "⚡ LIMITED DROP: Savage Gentlemen Heavyweight 480GSM French Terry Hoodie",
          description: "Handcrafted luxury streetwear with custom gold embroidery and secret waterproof fete pocket. Only 50 pieces produced.",
          type: "product",
          placement: "shop_feed",
          linkUrl: "/shop",
          ctaText: "Claim Your Drop ($98)",
          imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&h=1000&fit=crop",
          price: "$98.00",
          priority: 100,
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

    // 6. Sanitize existing article titles/captions and remove duplicates in database
    try {
      const articlesRes = await db.execute(sql`SELECT id, title, summary, content, source_url FROM articles ORDER BY id ASC;`);
      const allRows = articlesRes.rows as any[];
      const processedTitles: string[] = [];
      let sanitizedCount = 0;
      let deletedDuplicates = 0;

      for (const row of allRows) {
        const cleanedTitle = cleanTitle(row.title);
        const cleanedSummary = cleanCaption(row.summary);
        const cleanedContent = cleanCaption(row.content);

        // Check if this article is a duplicate of an already preserved story
        if (isDuplicateStory(cleanedTitle, processedTitles)) {
          console.log(`[DBInit] 🗑️ Removing duplicate article (ID: ${row.id}): "${cleanedTitle}"`);
          await db.execute(sql`DELETE FROM articles WHERE id = ${row.id};`);
          deletedDuplicates++;
          continue;
        }

        // If content was modified during sanitization, update in DB
        if (cleanedTitle !== row.title || cleanedSummary !== row.summary) {
          await db.execute(sql`
            UPDATE articles 
            SET title = ${cleanedTitle}, summary = ${cleanedSummary}, content = ${cleanedContent} 
            WHERE id = ${row.id};
          `);
          sanitizedCount++;
        }

        processedTitles.push(cleanedTitle);
      }

      if (sanitizedCount > 0 || deletedDuplicates > 0) {
        console.log(`[DBInit] ✅ Article DB cleanup complete: Sanitized ${sanitizedCount} titles, removed ${deletedDuplicates} duplicate posts.`);
      }
    } catch (cleanupErr: any) {
      console.error("[DBInit] Article cleanup note:", cleanupErr.message);
    }

    // 7. Initialize and start the Autonomous Magazine & Ingestion Bot
    try {
      await magazineBot.start(6);
    } catch (magErr: any) {
      console.error("[DBInit] ⚠️ Error starting MagazineBot:", magErr.message);
    }

    // 8. Initialize and start the Autonomous 2-Post-Per-Day Social Publisher
    try {
      await socialAutoPoster.init();
    } catch (postErr: any) {
      console.error("[DBInit] ⚠️ Error starting SocialAutoPoster:", postErr.message);
    }

    // 8.5 Autonomous Self-Healing: Verify and restore MOVE YUH RASS Event & Ticket Tiers
    try {
      console.log("[DBInit] 🎟️ Verifying events and ticket tiers in database...");

      // Ensure tickets_live_enabled setting exists and defaults to 'true'
      const liveGateRow = await db.select().from(siteSettings).where(eq(siteSettings.key, "tickets_live_enabled")).limit(1);
      if (liveGateRow.length === 0) {
        await db.insert(siteSettings).values({
          key: "tickets_live_enabled",
          value: "true",
          description: "Controls whether ticket sales are live or locked in staging mode",
        });
        console.log("[DBInit] ✅ Created site setting 'tickets_live_enabled' = 'true'.");
      }

      // Check if MOVE YUH RASS or any upcoming event exists
      const existingEvents = await db.select().from(events).where(ilike(events.title, "%move%yuh%"));
      let eventId: number;

      if (existingEvents.length === 0) {
        console.log("[DBInit] 🚀 Auto-healing: Primary event 'MOVE YUH RASS' missing from database. Seeding now...");
        const [newEvent] = await db.insert(events).values({
          title: "MOVE YUH RASS",
          description: "When de bass rumble and de riddim take over, yuh have no choice but to move. Savage Gentlemen presents MOVE YUH RASS — an unapologetic explosion of authentic Caribbean energy, sound, and culture. We bringing pure carnival vibes with non-stop Soca, raw Dancehall heat, and infectious Afrobeats commanded by top-tier selectors. Grab yuh team, rep yuh island, hoist yuh flag high, and prepare for high-octane waistline pressure all night long. Premium bottle service tables available. Lock in and stay ready — official tickets dropping soon. Don't stick!",
          date: new Date("2026-11-27T22:00:00-05:00"),
          time: "22:00",
          endTime: "02:30",
          duration: 270,
          location: "The Ainsworth, 310 Sinatra Dr, Hoboken, NJ 07030",
          price: 2000,
          currency: "USD",
          imageUrl: "/images/early_bird_official_9x16.jpg",
          additionalImages: [
            "/images/sexy_waterfront_fete_square.jpg",
            "/images/sexy_waterfront_fete_story.jpg",
            "/images/vip_bottle_service_flyer_1790806993340.jpg",
            "/images/cyber_carnival_poster_9x16.jpg"
          ],
          category: "Nightlife & Caribbean Fete",
          featured: true,
          organizerName: "Savage Gentlemen",
          organizerEmail: "info@savgent.com",
          isSocaPassportEnabled: true,
          stampPointsDefault: 75,
          isPremiumPassport: true,
          countryCode: "US",
          carnivalCircuit: "Hoboken / NYC Caribbean Circuit",
          venueLatitude: "40.7408",
          venueLongitude: "-74.0270",
          checkinRadiusMeters: 250,
          updatedAt: new Date(),
        }).returning({ id: events.id });
        eventId = newEvent.id;
        console.log(`[DBInit] ✅ Auto-healed: Created MOVE YUH RASS event (ID: ${eventId}).`);
      } else {
        eventId = existingEvents[0].id;
        // Verify image and featured state
        if (!existingEvents[0].featured || !existingEvents[0].imageUrl) {
          await db.update(events).set({
            featured: true,
            imageUrl: existingEvents[0].imageUrl || "/images/early_bird_official_9x16.jpg",
            updatedAt: new Date(),
          }).where(eq(events.id, eventId));
        }
      }

      // Check if ticket tiers exist for this event
      const existingTickets = await db.select().from(tickets).where(eq(tickets.eventId, eventId));
      if (existingTickets.length === 0) {
        console.log(`[DBInit] 🎟️ Auto-healing: Seeding 11 ticket tiers for Event ID ${eventId}...`);
        const stagedTiers = [
          {
            eventId,
            name: "Free Unisex Admission",
            description: "Complimentary unisex RSVP admission before 11:30 PM. Very limited (20 tickets total). Arrive early.",
            price: 0,
            quantity: 20,
            remainingQuantity: 20,
            gender: "unisex",
            tierLevel: "standard",
            badgeColor: "#06B6D4",
            badgeIcon: "sparkles",
            benefits: ["Complimentary Admission before 11:30 PM", "75 Soca Passport Credits", "Guaranteed Entry with Early Arrival"],
            includedItems: ["Complimentary Admission Ticket"],
            maxPerPurchase: 2,
            isActive: true,
            status: "on_sale",
            salesStartDate: new Date("2026-10-16T00:00:00-04:00"),
            salesEndDate: new Date("2026-11-27T23:30:00-05:00"),
          },
          {
            eventId,
            name: "Early Bird Female Admission",
            description: "Limited early bird rate for ladies. General admission into Move Yuh Rass at The Ainsworth.",
            price: 2000,
            quantity: 30,
            remainingQuantity: 30,
            gender: "female",
            tierLevel: "standard",
            badgeColor: "#EC4899",
            badgeIcon: "sparkles",
            benefits: ["Express Entry line before 11 PM", "75 Soca Passport Credits", "Guaranteed Entry"],
            includedItems: ["Female Admission Ticket"],
            maxPerPurchase: 4,
            isActive: false,
            status: "off_sale",
            salesStartDate: new Date("2026-10-16T00:00:00-04:00"),
            salesEndDate: new Date("2026-10-29T23:59:59-04:00"),
          },
          {
            eventId,
            name: "Early Bird Male Admission",
            description: "Limited early bird rate for gentlemen. General admission into Move Yuh Rass at The Ainsworth.",
            price: 2000,
            quantity: 20,
            remainingQuantity: 20,
            gender: "male",
            tierLevel: "standard",
            badgeColor: "#3B82F6",
            badgeIcon: "sparkles",
            benefits: ["Express Entry line before 11 PM", "75 Soca Passport Credits", "Guaranteed Entry"],
            includedItems: ["Male Admission Ticket"],
            maxPerPurchase: 4,
            isActive: false,
            status: "off_sale",
            salesStartDate: new Date("2026-10-16T00:00:00-04:00"),
            salesEndDate: new Date("2026-10-29T23:59:59-04:00"),
          },
          {
            eventId,
            name: "General Admission (Female)",
            description: "Official ladies admission into Move Yuh Rass at The Ainsworth waterfront Hoboken.",
            price: 3000,
            quantity: 50,
            remainingQuantity: 50,
            gender: "female",
            tierLevel: "standard",
            badgeColor: "#F43F5E",
            badgeIcon: "flame",
            benefits: ["General Admission Entry", "75 Soca Passport Credits"],
            includedItems: ["Female General Admission Ticket"],
            maxPerPurchase: 6,
            isActive: false,
            status: "off_sale",
            salesStartDate: new Date("2026-10-16T00:00:00-04:00"),
            salesEndDate: new Date("2026-11-20T23:59:59-05:00"),
          },
          {
            eventId,
            name: "General Admission (Male)",
            description: "Official gentlemen admission into Move Yuh Rass at The Ainsworth waterfront Hoboken.",
            price: 3000,
            quantity: 40,
            remainingQuantity: 40,
            gender: "male",
            tierLevel: "standard",
            badgeColor: "#2563EB",
            badgeIcon: "flame",
            benefits: ["General Admission Entry", "75 Soca Passport Credits"],
            includedItems: ["Male General Admission Ticket"],
            maxPerPurchase: 6,
            isActive: false,
            status: "off_sale",
            salesStartDate: new Date("2026-10-16T00:00:00-04:00"),
            salesEndDate: new Date("2026-11-20T23:59:59-05:00"),
          },
          {
            eventId,
            name: "Late Release (Female)",
            description: "Final tier online passes for ladies before door admission.",
            price: 4000,
            quantity: 25,
            remainingQuantity: 25,
            gender: "female",
            tierLevel: "standard",
            badgeColor: "#D946EF",
            badgeIcon: "zap",
            benefits: ["Guaranteed Late Release Entry", "75 Soca Passport Credits"],
            includedItems: ["Late Release Ticket"],
            maxPerPurchase: 4,
            isActive: false,
            status: "off_sale",
            salesStartDate: new Date("2026-11-21T00:00:00-05:00"),
            salesEndDate: new Date("2026-11-27T20:00:00-05:00"),
          },
          {
            eventId,
            name: "Late Release (Male)",
            description: "Final tier online passes for gentlemen before door admission.",
            price: 4000,
            quantity: 25,
            remainingQuantity: 25,
            gender: "male",
            tierLevel: "standard",
            badgeColor: "#1D4ED8",
            badgeIcon: "zap",
            benefits: ["Guaranteed Late Release Entry", "75 Soca Passport Credits"],
            includedItems: ["Late Release Ticket"],
            maxPerPurchase: 4,
            isActive: false,
            status: "off_sale",
            salesStartDate: new Date("2026-11-21T00:00:00-05:00"),
            salesEndDate: new Date("2026-11-27T20:00:00-05:00"),
          },
          {
            eventId,
            name: "Door Admission (Female)",
            description: "Door rate for ladies subject to venue capacity.",
            price: 5000,
            quantity: 15,
            remainingQuantity: 15,
            gender: "female",
            tierLevel: "standard",
            badgeColor: "#6B7280",
            badgeIcon: "ticket",
            benefits: ["At-the-Door Entry", "75 Soca Passport Credits"],
            includedItems: ["Door Entry Pass"],
            maxPerPurchase: 2,
            isActive: false,
            status: "off_sale",
            salesStartDate: new Date("2026-11-27T22:00:00-05:00"),
            salesEndDate: new Date("2026-11-28T02:00:00-05:00"),
          },
          {
            eventId,
            name: "Door Admission (Male)",
            description: "Door rate for gentlemen subject to venue capacity.",
            price: 5000,
            quantity: 15,
            remainingQuantity: 15,
            gender: "male",
            tierLevel: "standard",
            badgeColor: "#4B5563",
            badgeIcon: "ticket",
            benefits: ["At-the-Door Entry", "75 Soca Passport Credits"],
            includedItems: ["Door Entry Pass"],
            maxPerPurchase: 2,
            isActive: false,
            status: "off_sale",
            salesStartDate: new Date("2026-11-27T22:00:00-05:00"),
            salesEndDate: new Date("2026-11-28T02:00:00-05:00"),
          },
          {
            eventId,
            name: "Solo Table Package (1 Bottle + 2 Tickets)",
            description: "Includes reserved lounge table, 1 premium bottle of your choice, and 2 admission tickets.",
            price: 25000,
            quantity: 6,
            remainingQuantity: 6,
            gender: "unisex",
            tierLevel: "vip",
            badgeColor: "#8B5CF6",
            badgeIcon: "glass",
            benefits: [
              "Reserved Lounge Table",
              "1 Premium Bottle (Hennessy, Ciroc, Casamigos, or D'Ussé)",
              "2 VIP Admission Tickets Included",
              "VIP Skip-the-Line Entry",
              "Dedicated Cocktail Server",
              "150 Soca Passport Credits"
            ],
            includedItems: ["1 Premium Bottle", "Reserved Table", "2 VIP Tickets"],
            maxPerPurchase: 2,
            isActive: true,
            status: "on_sale",
            salesStartDate: new Date("2026-10-16T00:00:00-04:00"),
            salesEndDate: new Date("2026-11-27T23:00:00-05:00"),
          },
          {
            eventId,
            name: "Duo Table Package (2 Bottles + 4 Tickets)",
            description: "Ultimate VIP experience. Includes prime reserved table, 2 premium bottles, and 4 admission tickets.",
            price: 40000,
            quantity: 6,
            remainingQuantity: 6,
            gender: "unisex",
            tierLevel: "ultra_vip",
            badgeColor: "#D4AF37",
            badgeIcon: "crown",
            benefits: [
              "Prime Placement Reserved Table",
              "2 Premium Bottles of your choice",
              "4 VIP Admission Tickets Included",
              "VIP Priority Skip-the-Line Entry",
              "Dedicated Cocktail Server & Mixers",
              "Sparkler Bottle Presentation",
              "250 Soca Passport Credits"
            ],
            includedItems: ["2 Premium Bottles", "Reserved VIP Table", "4 VIP Tickets", "Mixers"],
            maxPerPurchase: 2,
            isActive: true,
            status: "on_sale",
            salesStartDate: new Date("2026-10-16T00:00:00-04:00"),
            salesEndDate: new Date("2026-11-27T23:00:00-05:00"),
          },
        ];

        for (const tier of stagedTiers) {
          await db.insert(tickets).values(tier as any);
        }
        console.log(`[DBInit] ✅ Successfully seeded ${stagedTiers.length} ticket tiers for Event ID ${eventId}.`);
      }
    } catch (eventHealErr: any) {
      console.error("[DBInit] Event auto-healing note:", eventHealErr.message);
    }

    // 9. Initialize and start the Autonomous Event Coordinator & Connoisseur Engine
    try {
      await eventCoordinatorService.init();
    } catch (coordErr: any) {
      console.error("[DBInit] ⚠️ Error starting EventCoordinatorService:", coordErr.message);
    }
  } catch (error: any) {
    console.error("[DBInit] ⚠️ Error during database table initialization:", error.message);
  }
}
