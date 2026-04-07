CREATE TABLE "enhanced_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer,
	"qr_code" text,
	"metadata" jsonb,
	"is_transferable" boolean DEFAULT true,
	"transfer_count" integer DEFAULT 0,
	"max_transfers" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"views" integer DEFAULT 0,
	"ticket_clicks" integer DEFAULT 0,
	"ticket_sales" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_checkins" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"event_id" integer,
	"checked_in_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"event_id" integer,
	"photo_url" text,
	"caption" text,
	"likes" integer DEFAULT 0,
	"is_approved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"event_id" integer,
	"rating" integer,
	"title" text,
	"review" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"date" timestamp NOT NULL,
	"time" text,
	"end_time" text,
	"location" text NOT NULL,
	"price" integer DEFAULT 0,
	"currency" text DEFAULT 'USD',
	"image_url" text,
	"category" text NOT NULL,
	"featured" boolean DEFAULT false,
	"organizer_name" text DEFAULT 'Savage Gentlemen',
	"is_soca_passport_enabled" boolean DEFAULT false,
	"access_code" text,
	"stamp_image_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "livestreams" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"url" text,
	"is_live" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection_id" integer NOT NULL,
	"title" text,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"type" text NOT NULL,
	"display_order" integer DEFAULT 0,
	"is_published" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "media_collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"cover_image_url" text,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"visibility" text DEFAULT 'public',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "media_collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "media_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text,
	"type" text,
	"user_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "passport_achievement_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text,
	"name" text,
	"description" text,
	"category" text,
	"criteria" jsonb,
	"credit_bonus" integer,
	"tier_requirement" text,
	"is_repeatable" boolean DEFAULT false,
	"icon_url" text,
	"icon" text,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"points" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "passport_achievement_definitions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "passport_credit_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"delta" integer,
	"source_type" text,
	"source_id" integer,
	"memo" text,
	"balance_after" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "passport_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"tier_id" integer,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "passport_missions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"description" text,
	"points" integer,
	"active_from" timestamp,
	"active_to" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "passport_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"handle" text,
	"total_points" integer DEFAULT 0,
	"current_tier" text DEFAULT 'BRONZE',
	"total_events" integer DEFAULT 0,
	"total_countries" integer DEFAULT 0,
	"profile_theme" text DEFAULT 'standard',
	"equipped_badge_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "passport_qr_checkins" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"event_id" integer,
	"credits_earned" integer DEFAULT 0,
	"is_premium" boolean DEFAULT false,
	"access_code" text,
	"checkin_method" text,
	"metadata" jsonb,
	"checked_in_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "passport_redemption_offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"cost" integer,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "passport_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"reward_id" integer,
	"title" text,
	"description" text,
	"status" text DEFAULT 'available',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "passport_stamps" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"event_id" integer,
	"country_code" text,
	"carnival_circuit" text,
	"points_earned" integer DEFAULT 0,
	"source" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "passport_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"min_points" integer,
	"color" text,
	"icon" text
);
--> statement-breakpoint
CREATE TABLE "passport_user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"achievement_id" integer,
	"unlocked_at" timestamp DEFAULT now(),
	"is_unlocked" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "passport_user_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"offer_id" integer,
	"redeemed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"content" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"price" integer NOT NULL,
	"image_url" text,
	"category" text NOT NULL,
	"featured" boolean DEFAULT false,
	"in_stock" boolean DEFAULT true,
	"stock_level" integer DEFAULT 0,
	"track_inventory" boolean DEFAULT true,
	"low_stock_threshold" integer DEFAULT 5,
	"sku" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsored_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"image_url" text,
	"link_url" text,
	"priority" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_addon_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_purchase_id" integer,
	"addon_id" integer,
	"quantity" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_addons" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"name" text,
	"description" text,
	"price" integer,
	"category" text,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "ticket_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"ticket_id" integer,
	"event_id" integer,
	"order_id" text,
	"purchase_date" timestamp DEFAULT now(),
	"status" text DEFAULT 'completed',
	"qr_code_data" text,
	"ticket_type" text,
	"price" integer,
	"attendee_email" text,
	"attendee_name" text,
	"scanned" boolean DEFAULT false,
	"first_scan_at" timestamp,
	"last_scan_at" timestamp,
	"scan_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "ticket_refunds" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_purchase_id" integer,
	"user_id" integer,
	"refund_type" text,
	"reason" text,
	"status" text DEFAULT 'pending',
	"amount" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_scans" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_purchase_id" integer,
	"order_id" text,
	"status" text,
	"notes" text,
	"scanned_at" timestamp DEFAULT now(),
	"scanner_id" integer
);
--> statement-breakpoint
CREATE TABLE "ticket_transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_purchase_id" integer,
	"from_user_id" integer,
	"to_user_id" integer,
	"to_email" text,
	"transfer_code" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"transferred_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"name" text,
	"price" integer,
	"type" text,
	"description" text,
	"available_quantity" integer
);
--> statement-breakpoint
CREATE TABLE "user_follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"follower_id" integer,
	"following_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"email" text,
	"password" text,
	"avatar" text,
	"bio" text,
	"location" text,
	"website" text,
	"role" text DEFAULT 'user',
	"is_guest" boolean DEFAULT false,
	"firebase_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
