import { pgTable, text, serial, integer, boolean, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================
// USERS
// ============================================================
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    displayName: text("display_name"),
    email: text("email"),
    avatar: text("avatar"),
    bio: text("bio"),
    location: text("location"),
    website: text("website"),
    role: text("role").default("user"),
    isGuest: boolean("is_guest").default(false),
    isPro: boolean("is_pro").default(false),
    stripeCustomerId: text("stripe_customer_id"),
    paypalCustomerId: text("paypal_customer_id"),
    firebaseId: text("firebase_id"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================
// EVENTS — fully synced with production
// ============================================================
export const events = pgTable("events", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"), // nullable in production
    date: timestamp("date").notNull(),
    time: text("time"),
    endTime: text("end_time"),
    duration: integer("duration"),
    location: text("location").notNull(),
    price: integer("price"),
    currency: text("currency").default("USD"),
    imageUrl: text("image_url"),
    additionalImages: text("additional_images").array(),
    videoUrl: text("video_url"),
    galleryMedia: jsonb("gallery_media").$type<{ type: 'image' | 'video', url: string, caption?: string, thumbnail?: string }[]>(),
    category: text("category"), // nullable in production
    featured: boolean("featured").default(false),
    organizerName: text("organizer_name").default("Savage Gentlemen"),
    organizerEmail: text("organizer_email").default("savgmen@gmail.com"),
    // Soca Passport fields
    isSocaPassportEnabled: boolean("is_soca_passport_enabled").default(false),
    stampPointsDefault: integer("stamp_points_default").default(50),
    isPremiumPassport: boolean("is_premium_passport").default(false),
    countryCode: text("country_code"),
    carnivalCircuit: text("carnival_circuit"),
    accessCode: text("access_code"),
    // Geo-fencing
    venueLatitude: numeric("venue_latitude"),
    venueLongitude: numeric("venue_longitude"),
    checkinRadiusMeters: integer("checkin_radius_meters").default(200),
    stampImageUrl: text("stamp_image_url"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================
// TICKETS — fully synced with production (multi-tier support)
// ============================================================
export const tickets = pgTable("tickets", {
    id: serial("id").primaryKey(),
    eventId: integer("event_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    price: integer("price").notNull(),
    quantity: integer("quantity").notNull(),
    remainingQuantity: integer("remaining_quantity"),
    isActive: boolean("is_active").default(true),
    status: text("status").default("on_sale"), // on_sale, off_sale, sold_out, staff_only
    priceType: text("price_type").default("standard"), // standard, pay_what_you_can
    type: text("type"), // For backwards compat
    minPerOrder: integer("min_per_order").default(1),
    maxPerPurchase: integer("max_per_purchase").default(10),
    displayRemainingQuantity: boolean("display_remaining_quantity").default(true),
    hideIfSoldOut: boolean("hide_if_sold_out").default(false),
    hidePriceIfSoldOut: boolean("hide_price_if_sold_out").default(false),
    secretCode: text("secret_code"),
    salesStartDate: timestamp("sales_start_date"),
    salesStartTime: text("sales_start_time"),
    salesEndDate: timestamp("sales_end_date"),
    salesEndTime: text("sales_end_time"),
    hideBeforeSalesStart: boolean("hide_before_sales_start").default(false),
    hideAfterSalesEnd: boolean("hide_after_sales_end").default(false),
    lockMinQuantity: integer("lock_min_quantity"),
    lockTicketTypeId: integer("lock_ticket_type_id"),
    // Tier system
    tierLevel: text("tier_level").default("standard"), // standard, premium, vip, ultra_vip
    benefits: text("benefits").array(),
    badgeColor: text("badge_color").default("#3b82f6"),
    badgeIcon: text("badge_icon").default("ticket"),
    includedItems: text("included_items").array(),
    transferable: boolean("transferable").default(true),
    refundable: boolean("refundable").default(false),
    earlyAccess: boolean("early_access").default(false),
    prioritySupport: boolean("priority_support").default(false),
    exclusiveContent: boolean("exclusive_content").default(false),
    meetGreet: boolean("meet_greet").default(false),
    backstageAccess: boolean("backstage_access").default(false),
    seatingPriority: text("seating_priority").default("general"),
    availableQuantity: integer("available_quantity"), // legacy compat
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================
// TICKET PURCHASES
// ============================================================
export const ticketPurchases = pgTable("ticket_purchases", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    ticketId: integer("ticket_id"),
    eventId: integer("event_id").notNull(),
    orderId: integer("order_id").notNull(),
    purchaseDate: timestamp("purchase_date").defaultNow().notNull(),
    status: text("status").default("valid"),
    qrCodeData: text("qr_code_data").notNull().unique(),
    ticketType: text("ticket_type").default("standard"),
    price: numeric("price"),
    attendeeEmail: text("attendee_email"),
    attendeeName: text("attendee_name"),
    scanned: boolean("scanned").default(false),
    firstScanAt: timestamp("first_scan_at"),
    lastScanAt: timestamp("last_scan_at"),
    scanCount: integer("scan_count").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================
// ENHANCED TICKETS
// ============================================================
export const enhancedTickets = pgTable("enhanced_tickets", {
    id: serial("id").primaryKey(),
    ticketId: integer("ticket_id"),
    qrCode: text("qr_code"),
    securityHash: text("security_hash"),
    metadata: jsonb("metadata"),
    isTransferable: boolean("is_transferable").default(true),
    transferCount: integer("transfer_count").default(0),
    maxTransfers: integer("max_transfers").default(3),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// TICKET TRANSFERS
// ============================================================
export const ticketTransfers = pgTable("ticket_transfers", {
    id: serial("id").primaryKey(),
    ticketPurchaseId: integer("ticket_purchase_id"),
    fromUserId: integer("from_user_id"),
    toUserId: integer("to_user_id"),
    toEmail: text("to_email"),
    transferCode: text("transfer_code"),
    status: text("status").default("pending"),
    transferredAt: timestamp("transferred_at"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// TICKET REFUNDS
// ============================================================
export const ticketRefunds = pgTable("ticket_refunds", {
    id: serial("id").primaryKey(),
    ticketPurchaseId: integer("ticket_purchase_id"),
    userId: integer("user_id"),
    refundType: text("refund_type"),
    refundAmount: integer("refund_amount"),
    reason: text("reason"),
    status: text("status").default("pending"),
    processedAt: timestamp("processed_at"),
    stripeRefundId: text("stripe_refund_id"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// TICKET ADD-ONS (VIP / Bottle Service / Experiences)
// ============================================================
export const ticketAddons = pgTable("ticket_addons", {
    id: serial("id").primaryKey(),
    eventId: integer("event_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    price: integer("price").notNull(), // in cents
    category: text("category"), // vip, bottle_service, experience, merchandise, food
    maxQuantity: integer("max_quantity"),
    isActive: boolean("is_active").default(true),
    // Bottle service specific metadata
    bottleServiceMeta: jsonb("bottle_service_meta").$type<{
        bottleType?: string;      // e.g., "Hennessy", "Dom Perignon"
        tableLocation?: string;   // e.g., "VIP Section A", "Poolside"
        maxGuests?: number;       // guests allowed at table
        minSpend?: number;        // minimum spend requirement in cents
        includesEntry?: boolean;  // whether bottle service includes event entry
    }>(),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// TICKET ADD-ON PURCHASES
// ============================================================
export const ticketAddonPurchases = pgTable("ticket_addon_purchases", {
    id: serial("id").primaryKey(),
    ticketPurchaseId: integer("ticket_purchase_id"),
    addonId: integer("addon_id"),
    quantity: integer("quantity").default(1),
    unitPrice: integer("unit_price"),
    totalPrice: integer("total_price"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// PRODUCTS
// ============================================================
export const products = pgTable("products", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    price: integer("price").notNull(),
    imageUrl: text("image_url"),
    category: text("category"),
    sizes: text("sizes").array(),
    featured: boolean("featured").default(false),
    etsyUrl: text("etsy_url"),
    printifyUrl: text("printify_url"),
    sku: text("sku"),
    inStock: boolean("in_stock").default(true),
    stockLevel: integer("stock_level").default(0),
    lowStockThreshold: integer("low_stock_threshold").default(5),
    weight: numeric("weight"),
    dimensions: jsonb("dimensions"),
    hasVariants: boolean("has_variants").default(false),
    trackInventory: boolean("track_inventory").default(true),
    restockDate: timestamp("restock_date"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================
// LIVESTREAMS
// ============================================================
export const livestreams = pgTable("livestreams", {
    id: serial("id").primaryKey(),
    title: text("title"),
    description: text("description"),
    streamDate: timestamp("stream_date"),
    thumbnailUrl: text("thumbnail_url"),
    isLive: boolean("is_live").default(false),
    hostName: text("host_name"),
    platform: text("platform").default("custom"),
    youtubeUrl: text("youtube_url"),
    twitchChannel: text("twitch_channel"),
    instagramUsername: text("instagram_username"),
    facebookUrl: text("facebook_url"),
    tiktokUsername: text("tiktok_username"),
    customStreamUrl: text("custom_stream_url"),
    embedCode: text("embed_code"),
    streamUrl: text("stream_url"),
    url: text("url"), // legacy compat
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================
// POSTS
// ============================================================
export const posts = pgTable("posts", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    content: text("content"),
    mediaUrl: text("media_url"),
    imageUrl: text("image_url"), // legacy compat
    createdAt: timestamp("created_at").defaultNow(),
    likes: integer("likes").default(0),
    comments: integer("comments").default(0),
});

// ============================================================
// MEDIA UPLOADS
// ============================================================
export const mediaUploads = pgTable("media_uploads", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    url: text("url"),
    fileName: text("file_name"),
    fileType: text("file_type"),
    fileSize: integer("file_size"),
    type: text("type"), // legacy compat
    relatedEntityType: text("related_entity_type"),
    relatedEntityId: integer("related_entity_id"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================
// SPONSORED CONTENT
// ============================================================
export const sponsoredContent = pgTable("sponsored_content", {
    id: serial("id").primaryKey(),
    title: text("title"),
    description: text("description"),
    imageUrl: text("image_url"),
    videoUrl: text("video_url"),
    linkUrl: text("link_url"),
    type: text("type"),
    position: text("position"),
    priority: integer("priority").default(0),
    isActive: boolean("is_active").default(true),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    clickCount: integer("click_count").default(0),
    viewCount: integer("view_count").default(0),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================
// EVENT ANALYTICS
// ============================================================
export const eventAnalytics = pgTable("event_analytics", {
    id: serial("id").primaryKey(),
    eventId: integer("event_id"),
    views: integer("views").default(0),
    ticketClicks: integer("ticket_clicks").default(0),
    ticketSales: integer("ticket_sales").default(0),
    revenue: integer("revenue").default(0),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================
// EVENT CHECK-INS
// ============================================================
export const eventCheckins = pgTable("event_checkins", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    eventId: integer("event_id"),
    location: text("location"),
    isPublic: boolean("is_public").default(true),
    checkedInAt: timestamp("checked_in_at").defaultNow(),
});

// ============================================================
// EVENT REVIEWS
// ============================================================
export const eventReviews = pgTable("event_reviews", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    eventId: integer("event_id"),
    rating: integer("rating"),
    title: text("title"),
    review: text("review"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// EVENT PHOTOS
// ============================================================
export const eventPhotos = pgTable("event_photos", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    eventId: integer("event_id"),
    photoUrl: text("photo_url"),
    caption: text("caption"),
    likes: integer("likes").default(0),
    isApproved: boolean("is_approved").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// USER FOLLOWS
// ============================================================
export const userFollows = pgTable("user_follows", {
    id: serial("id").primaryKey(),
    followerId: integer("follower_id"),
    followingId: integer("following_id"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// TICKET SCANS
// ============================================================
export const ticketScans = pgTable("ticket_scans", {
    id: serial("id").primaryKey(),
    ticketPurchaseId: integer("ticket_purchase_id"),
    orderId: text("order_id"),
    status: text("status"),
    notes: text("notes"),
    scannedAt: timestamp("scanned_at").defaultNow(),
    scannerId: integer("scanner_id"),
});

// ============================================================
// PASSPORT TABLES
// ============================================================
export const passportProfiles = pgTable("passport_profiles", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    handle: text("handle"),
    totalPoints: integer("total_points").default(0),
    currentTier: text("current_tier").default("BRONZE"),
    totalEvents: integer("total_events").default(0),
    totalCountries: integer("total_countries").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const passportQrCheckins = pgTable("passport_qr_checkins", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    eventId: integer("event_id"),
    creditsEarned: integer("credits_earned").default(0),
    isPremium: boolean("is_premium").default(false),
    accessCode: text("access_code"),
    checkinMethod: text("checkin_method"),
    metadata: jsonb("metadata"),
    checkedInAt: timestamp("checked_in_at").defaultNow(),
});

export const mediaCollections = pgTable("media_collections", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").unique().notNull(),
    description: text("description"),
    coverImageUrl: text("cover_image_url"),
    thumbnailUrl: text("thumbnail_url"),
    displayOrder: integer("display_order").default(0),
    isActive: boolean("is_active").default(true),
    visibility: text("visibility").default("public"),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const mediaAssets = pgTable("media_assets", {
    id: serial("id").primaryKey(),
    collectionId: integer("collection_id").notNull(),
    title: text("title"),
    url: text("url"),
    storageKey: text("storage_key"),
    originalFilename: text("original_filename"),
    fileSize: integer("file_size"),
    mimeType: text("mime_type"),
    thumbnailUrl: text("thumbnail_url"),
    type: text("type").notNull(),
    duration: integer("duration"),
    dimensions: jsonb("dimensions"),
    transcodedVariants: jsonb("transcoded_variants"),
    displayOrder: integer("display_order").default(0),
    isPublished: boolean("is_published").default(true),
    watermarkEnabled: boolean("watermark_enabled").default(true),
    downloadProtected: boolean("download_protected").default(true),
    viewCount: integer("view_count").default(0),
    lastViewedAt: timestamp("last_viewed_at"),
    metadata: jsonb("metadata"),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const passportStamps = pgTable("passport_stamps", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    eventId: integer("event_id"),
    countryCode: text("country_code"),
    carnivalCircuit: text("carnival_circuit"),
    pointsEarned: integer("points_earned").default(0),
    source: text("source"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const passportTiers = pgTable("passport_tiers", {
    id: serial("id").primaryKey(),
    name: text("name"),
    minPoints: integer("min_points"),
    color: text("color"),
    icon: text("icon"),
});

export const passportRewards = pgTable("passport_rewards", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    rewardId: integer("reward_id"),
    title: text("title"),
    description: text("description"),
    rewardType: text("reward_type"),
    metadata: jsonb("metadata"),
    expiresAt: timestamp("expires_at"),
    status: text("status").default("available"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const passportMissions = pgTable("passport_missions", {
    id: serial("id").primaryKey(),
    title: text("title"),
    description: text("description"),
    points: integer("points"),
    activeFrom: timestamp("active_from"),
    activeTo: timestamp("active_to"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const passportAchievementDefinitions = pgTable("passport_achievement_definitions", {
    id: serial("id").primaryKey(),
    name: text("name"),
    description: text("description"),
    icon: text("icon"),
    points: integer("points"),
    isRepeatable: boolean("is_repeatable").default(false),
    criteria: jsonb("criteria"),
    creditBonus: integer("credit_bonus").default(0),
});

export const passportUserAchievements = pgTable("passport_user_achievements", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    achievementId: integer("achievement_id"),
    unlockedAt: timestamp("unlocked_at").defaultNow(),
    isUnlocked: boolean("is_unlocked").default(true),
});

export const passportCreditTransactions = pgTable("passport_credit_transactions", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    delta: integer("delta"),
    sourceType: text("source_type"),
    sourceId: integer("source_id"),
    memo: text("memo"),
    balanceAfter: integer("balance_after"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const passportMemberships = pgTable("passport_memberships", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    tierId: integer("tier_id"),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at"),
});

export const passportRedemptionOffers = pgTable("passport_redemption_offers", {
    id: serial("id").primaryKey(),
    title: text("title"),
    cost: integer("cost"),
    description: text("description"),
});

export const passportUserRedemptions = pgTable("passport_user_redemptions", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    offerId: integer("offer_id"),
    redeemedAt: timestamp("redeemed_at").defaultNow(),
});

// ============================================================
// ORDERS
// ============================================================
export const orders = pgTable("orders", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    totalAmount: integer("total_amount").notNull(),
    status: text("status").notNull().default("pending"),
    paymentMethod: text("payment_method"),
    paymentId: text("payment_id"),
    discountCodeId: integer("discount_code_id"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================
// DISCOUNT CODES
// ============================================================
export const discountCodes = pgTable("discount_codes", {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    discountType: text("discount_type").notNull(),
    discountValue: integer("discount_value").notNull(),
    expiresAt: timestamp("expires_at"),
    maxUses: integer("max_uses"),
    currentUses: integer("current_uses").default(0),
    eventId: integer("event_id"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================
// ZOD INSERT SCHEMAS
// ============================================================
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true, updatedAt: true }).extend({
    date: z.coerce.date(),
    price: z.coerce.number().nullable().optional(),
    currency: z.enum(["USD", "CAD"]).default("USD").optional(),
    isSocaPassportEnabled: z.boolean().default(false).optional(),
    featured: z.boolean().default(false).optional(),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, createdAt: true, updatedAt: true }).extend({
    price: z.coerce.number(),
    quantity: z.coerce.number().min(1),
    remainingQuantity: z.coerce.number().optional(),
    tierLevel: z.enum(['standard', 'premium', 'vip', 'ultra_vip']).default('standard').optional(),
    seatingPriority: z.enum(['general', 'reserved', 'premium', 'vip']).default('general').optional(),
    benefits: z.array(z.string()).optional(),
    includedItems: z.array(z.string()).optional(),
    salesStartDate: z.coerce.date().nullable().optional(),
    salesEndDate: z.coerce.date().nullable().optional(),
});

export const insertTicketAddonSchema = createInsertSchema(ticketAddons).omit({ id: true, createdAt: true }).extend({
    price: z.coerce.number().min(0),
    category: z.enum(['vip', 'bottle_service', 'experience', 'merchandise', 'food']).optional(),
    maxQuantity: z.coerce.number().optional(),
    bottleServiceMeta: z.object({
        bottleType: z.string().optional(),
        tableLocation: z.string().optional(),
        maxGuests: z.number().optional(),
        minSpend: z.number().optional(),
        includesEntry: z.boolean().optional(),
    }).optional(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true }).extend({
    price: z.coerce.number(),
    stockLevel: z.coerce.number().optional(),
    lowStockThreshold: z.coerce.number().optional(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMediaCollectionSchema = createInsertSchema(mediaCollections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMediaAssetSchema = createInsertSchema(mediaAssets).omit({ id: true, createdAt: true, updatedAt: true });

// ============================================================
// TYPE EXPORTS
// ============================================================
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;
export type TicketPurchase = typeof ticketPurchases.$inferSelect;
export type InsertTicketPurchase = typeof ticketPurchases.$inferInsert;
export type EnhancedTicket = typeof enhancedTickets.$inferSelect;
export type InsertEnhancedTicket = typeof enhancedTickets.$inferInsert;
export type TicketTransfer = typeof ticketTransfers.$inferSelect;
export type InsertTicketTransfer = typeof ticketTransfers.$inferInsert;
export type TicketRefund = typeof ticketRefunds.$inferSelect;
export type InsertTicketRefund = typeof ticketRefunds.$inferInsert;
export type TicketAddon = typeof ticketAddons.$inferSelect;
export type InsertTicketAddon = typeof ticketAddons.$inferInsert;
export type TicketAddonPurchase = typeof ticketAddonPurchases.$inferSelect;
export type InsertTicketAddonPurchase = typeof ticketAddonPurchases.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertPassportProfile = typeof passportProfiles.$inferInsert;
export type PassportProfile = typeof passportProfiles.$inferSelect;
export type InsertPassportStamp = typeof passportStamps.$inferInsert;
export type PassportStamp = typeof passportStamps.$inferSelect;
export type PassportTier = typeof passportTiers.$inferSelect;
export type PassportReward = typeof passportRewards.$inferSelect;
export type InsertPassportReward = typeof passportRewards.$inferInsert;
export type PassportAchievementDefinition = typeof passportAchievementDefinitions.$inferSelect;
export type PassportUserAchievement = typeof passportUserAchievements.$inferSelect;
export type PassportCreditTransaction = typeof passportCreditTransactions.$inferSelect;
export type InsertPassportCreditTransaction = typeof passportCreditTransactions.$inferInsert;
export type PassportMembership = typeof passportMemberships.$inferSelect;
export type InsertPassportMembership = typeof passportMemberships.$inferInsert;
export type PassportRedemptionOffer = typeof passportRedemptionOffers.$inferSelect;
export type PassportUserRedemption = typeof passportUserRedemptions.$inferSelect;
export type MediaCollection = typeof mediaCollections.$inferSelect;
export type InsertMediaCollection = typeof mediaCollections.$inferInsert;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type InsertMediaAsset = typeof mediaAssets.$inferInsert;

export const ads = pgTable("ads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  targetUrl: text("target_url").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAdSchema = createInsertSchema(ads);
export type InsertAd = z.infer<typeof insertAdSchema>;
export type Ad = typeof ads.$inferSelect;

// ============================================================
// AFFILIATE SYSTEM
// ============================================================
export const affiliates = pgTable("affiliates", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    referralCode: text("referral_code").notNull().unique(),
    campaignName: text("campaign_name").default("Soca Noir"),
    salesCount: integer("sales_count").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const affiliateClicks = pgTable("affiliate_clicks", {
    id: serial("id").primaryKey(),
    affiliateId: integer("affiliate_id").notNull(),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const insertAffiliateSchema = createInsertSchema(affiliates);
export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;
export type Affiliate = typeof affiliates.$inferSelect;

export const insertAffiliateClickSchema = createInsertSchema(affiliateClicks);
export type InsertAffiliateClick = z.infer<typeof insertAffiliateClickSchema>;
export type AffiliateClick = typeof affiliateClicks.$inferSelect;

