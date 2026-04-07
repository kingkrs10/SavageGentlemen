import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function run() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "affiliates" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "referral_code" text NOT NULL UNIQUE,
      "campaign_name" text DEFAULT 'Soca Noir',
      "sales_count" integer DEFAULT 0,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );
  `);
  console.log("Created affiliates table");
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "affiliate_clicks" (
      "id" serial PRIMARY KEY NOT NULL,
      "affiliate_id" integer NOT NULL,
      "ip_address" text,
      "created_at" timestamp DEFAULT now()
    );
  `);
  console.log("Created affiliate_clicks table");
  process.exit(0);
}

run().catch(console.error);
