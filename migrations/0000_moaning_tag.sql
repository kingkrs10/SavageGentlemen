CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"livestream_id" integer,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"user" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"new_users" integer DEFAULT 0,
	"active_users" integer DEFAULT 0,
	"page_views" integer DEFAULT 0,
	"event_views" integer DEFAULT 0,
	"product_views" integer DEFAULT 0,
	"ticket_sales" integer DEFAULT 0,
	"product_clicks" integer DEFAULT 0,
	"total_revenue" numeric DEFAULT '0',
	CONSTRAINT "daily_stats_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "deleted_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"event_data" jsonb NOT NULL,
	"deleted_at" timestamp DEFAULT now(),
	"deleted_by" integer,
	"recovered" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "discount_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"discount_type" text NOT NULL,
	"discount_value" integer NOT NULL,
	"expires_at" timestamp,
	"max_uses" integer,
	"current_uses" integer DEFAULT 0,
	"event_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "discount_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "email_campaign_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"sent" integer DEFAULT 0,
	"delivered" integer DEFAULT 0,
	"opened" integer DEFAULT 0,
	"clicked" integer DEFAULT 0,
	"bounced" integer DEFAULT 0,
	"unsubscribed" integer DEFAULT 0,
	"complaints" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'draft',
	"sent_at" timestamp,
	"scheduled_for" timestamp,
	"list_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_list_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"list_id" integer NOT NULL,
	"subscriber_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"status" text DEFAULT 'active',
	"source" text,
	"user_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"views" integer DEFAULT 0,
	"ticket_clicks" integer DEFAULT 0,
	"ticket_sales" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" timestamp NOT NULL,
	"time" text,
	"end_time" text,
	"duration" integer,
	"location" text NOT NULL,
	"price" integer,
	"image_url" text,
	"additional_images" text[],
	"category" text,
	"featured" boolean DEFAULT false,
	"organizer_name" text DEFAULT 'Savage Gentlemen',
	"organizer_email" text DEFAULT 'savgmen@gmail.com',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer,
	"variant_id" integer,
	"previous_stock" integer NOT NULL,
	"new_stock" integer NOT NULL,
	"change_quantity" integer NOT NULL,
	"change_type" text NOT NULL,
	"reason" text,
	"user_id" integer,
	"order_id" integer,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "livestreams" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"stream_date" timestamp NOT NULL,
	"thumbnail_url" text,
	"is_live" boolean DEFAULT false,
	"host_name" text,
	"platform" text DEFAULT 'custom',
	"youtube_url" text,
	"twitch_channel" text,
	"instagram_username" text,
	"facebook_url" text,
	"tiktok_username" text,
	"custom_stream_url" text,
	"embed_code" text,
	"stream_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "media_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"related_entity_type" text,
	"related_entity_id" integer
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"item_type" text NOT NULL,
	"product_id" integer,
	"variant_id" integer,
	"ticket_id" integer,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"sku" text,
	"item_name" text,
	"item_details" jsonb DEFAULT '{}'::jsonb,
	"scan_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"payment_id" text,
	"discount_code_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "page_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"user_id" integer,
	"session_id" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"device_type" text,
	"browser" text,
	"referrer" text,
	"duration" integer
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"used" boolean DEFAULT false,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"content" text,
	"media_url" text,
	"created_at" timestamp DEFAULT now(),
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "product_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer,
	"views" integer DEFAULT 0,
	"detail_clicks" integer DEFAULT 0,
	"purchase_clicks" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb,
	"price" integer,
	"image_url" text,
	"stock_level" integer DEFAULT 0,
	"in_stock" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"image_url" text,
	"category" text,
	"sizes" text[],
	"featured" boolean DEFAULT false,
	"etsy_url" text,
	"printify_url" text,
	"sku" text,
	"in_stock" boolean DEFAULT true,
	"stock_level" integer DEFAULT 0,
	"low_stock_threshold" integer DEFAULT 5,
	"weight" numeric,
	"dimensions" jsonb,
	"has_variants" boolean DEFAULT false,
	"track_inventory" boolean DEFAULT true,
	"restock_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsored_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text DEFAULT 'standard' NOT NULL,
	"image_url" text,
	"logo_url" text,
	"link_url" text,
	"background_color" text DEFAULT 'bg-gray-800',
	"text_color" text DEFAULT 'text-white',
	"cta_text" text DEFAULT 'Learn More',
	"price" text,
	"event_date" text,
	"location" text,
	"video_url" text,
	"is_active" boolean DEFAULT true,
	"priority" integer DEFAULT 0,
	"start_date" timestamp,
	"end_date" timestamp,
	"clicks" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"ticket_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"purchase_date" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'valid',
	"qr_code_data" text NOT NULL,
	"ticket_type" text DEFAULT 'standard',
	"price" numeric,
	"attendee_email" text,
	"attendee_name" text,
	"scanned" boolean DEFAULT false,
	"first_scan_at" timestamp,
	"last_scan_at" timestamp,
	"scan_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ticket_purchases_qr_code_data_unique" UNIQUE("qr_code_data")
);
--> statement-breakpoint
CREATE TABLE "ticket_scans" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"scanned_at" timestamp DEFAULT now(),
	"scanned_by" integer,
	"status" text DEFAULT 'valid',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"remaining_quantity" integer,
	"is_active" boolean DEFAULT true,
	"status" text DEFAULT 'on_sale',
	"price_type" text DEFAULT 'standard',
	"min_per_order" integer DEFAULT 1,
	"max_per_purchase" integer DEFAULT 10,
	"display_remaining_quantity" boolean DEFAULT true,
	"hide_if_sold_out" boolean DEFAULT false,
	"hide_price_if_sold_out" boolean DEFAULT false,
	"secret_code" text,
	"sales_start_date" timestamp,
	"sales_start_time" text,
	"sales_end_date" timestamp,
	"sales_end_time" text,
	"hide_before_sales_start" boolean DEFAULT false,
	"hide_after_sales_end" boolean DEFAULT false,
	"lock_min_quantity" integer,
	"lock_ticket_type_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"event_type" text NOT NULL,
	"event_data" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"session_id" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"display_name" text,
	"avatar" text,
	"is_guest" boolean DEFAULT false,
	"role" text DEFAULT 'user',
	"stripe_customer_id" text,
	"paypal_customer_id" text,
	"email" text,
	"firebase_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "email_campaign_stats" ADD CONSTRAINT "email_campaign_stats_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_list_id_email_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."email_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_list_subscribers" ADD CONSTRAINT "email_list_subscribers_list_id_email_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."email_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_list_subscribers" ADD CONSTRAINT "email_list_subscribers_subscriber_id_email_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."email_subscribers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_subscribers" ADD CONSTRAINT "email_subscribers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_analytics" ADD CONSTRAINT "event_analytics_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_history" ADD CONSTRAINT "inventory_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_history" ADD CONSTRAINT "inventory_history_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_history" ADD CONSTRAINT "inventory_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_history" ADD CONSTRAINT "inventory_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_analytics" ADD CONSTRAINT "product_analytics_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsored_content" ADD CONSTRAINT "sponsored_content_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_events" ADD CONSTRAINT "user_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "list_subscriber_idx" ON "email_list_subscribers" USING btree ("list_id","subscriber_id");--> statement-breakpoint
CREATE UNIQUE INDEX "email_idx" ON "email_subscribers" USING btree ("email");