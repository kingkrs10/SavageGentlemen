import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    displayName: text("display_name"),
    email: text("email"),
    password: text("password"),
    avatar: text("avatar"),
    bio: text("bio"),
    location: text("location"),
    website: text("website"),
    role: text("role").default("user"),
    isGuest: boolean("is_guest").default(false),
    firebaseUid: text("firebase_uid"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const events = pgTable("events", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    date: timestamp("date").notNull(),
    time: text("time"),
    endTime: text("end_time"), // inferred from api.ts
    location: text("location").notNull(),
    price: integer("price").default(0),
    currency: text("currency").default("USD"),
    imageUrl: text("image_url"),
    category: text("category").notNull(),
    featured: boolean("featured").default(false),
    organizerName: text("organizer_name").default("Savage Gentlemen"),
    isSocaPassportEnabled: boolean("is_soca_passport_enabled").default(false),
    accessCode: text("access_code"), // inferred from passport-api.ts
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const tickets = pgTable("tickets", {
    id: serial("id").primaryKey(),
    eventId: integer("event_id").notNull(), // FK implies relations or direct join
    name: text("name"),
    price: integer("price"),
    type: text("type"),
    description: text("description"),
    availableQuantity: integer("available_quantity"),
});

export const ticketPurchases = pgTable("ticket_purchases", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    ticketId: integer("ticket_id"),
    eventId: integer("event_id"),
    orderId: text("order_id"),
    purchaseDate: timestamp("purchase_date").defaultNow(),
    status: text("status").default("completed"),
    qrCodeData: text("qr_code_data"),
    ticketType: text("ticket_type"),
    price: integer("price"),
    attendeeEmail: text("attendee_email"),
    attendeeName: text("attendee_name"),
    scanned: boolean("scanned").default(false),
    firstScanAt: timestamp("first_scan_at"),
    lastScanAt: timestamp("last_scan_at"),
    scanCount: integer("scan_count").default(0),
});

export const enhancedTickets = pgTable("enhanced_tickets", {
    id: serial("id").primaryKey(),
    ticketId: integer("ticket_id"),
    qrCode: text("qr_code"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const ticketTransfers = pgTable("ticket_transfers", {
    id: serial("id").primaryKey(),
    ticketPurchaseId: integer("ticket_purchase_id"),
    fromUserId: integer("from_user_id"),
    toUserId: integer("to_user_id"),
    transferCode: text("transfer_code"),
    status: text("status").default("pending"),
    createdAt: timestamp("created_at").defaultNow(),
    transferredAt: timestamp("transferred_at"),
});

export const ticketRefunds = pgTable("ticket_refunds", {
    id: serial("id").primaryKey(),
    ticketPurchaseId: integer("ticket_purchase_id"),
    reason: text("reason"),
    status: text("status").default("pending"),
    amount: integer("amount"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const ticketAddons = pgTable("ticket_addons", {
    id: serial("id").primaryKey(),
    eventId: integer("event_id"),
    name: text("name"),
    description: text("description"),
    price: integer("price"),
    category: text("category"),
    isActive: boolean("is_active").default(true),
});

export const ticketAddonPurchases = pgTable("ticket_addon_purchases", {
    id: serial("id").primaryKey(),
    ticketPurchaseId: integer("ticket_purchase_id"),
    addonId: integer("addon_id"),
    quantity: integer("quantity").default(1),
    createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    price: integer("price").notNull(),
    imageUrl: text("image_url"),
    category: text("category").notNull(),
    featured: boolean("featured").default(false),
    inStock: boolean("in_stock").default(true),
    stockLevel: integer("stock_level").default(0),
    trackInventory: boolean("track_inventory").default(true),
    lowStockThreshold: integer("low_stock_threshold").default(5),
    sku: text("sku"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const livestreams = pgTable("livestreams", {
    id: serial("id").primaryKey(),
    title: text("title"),
    url: text("url"),
    isLive: boolean("is_live").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    content: text("content"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const mediaUploads = pgTable("media_uploads", {
    id: serial("id").primaryKey(),
    url: text("url"),
    type: text("type"), // image, video
    userId: integer("user_id"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const sponsoredContent = pgTable("sponsored_content", {
    id: serial("id").primaryKey(),
    title: text("title"),
    imageUrl: text("image_url"),
    linkUrl: text("link_url"),
    priority: integer("priority").default(0),
    isActive: boolean("is_active").default(true),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const eventAnalytics = pgTable("event_analytics", {
    id: serial("id").primaryKey(),
    eventId: integer("event_id"),
    views: integer("views").default(0),
    ticketClicks: integer("ticket_clicks").default(0),
    ticketSales: integer("ticket_sales").default(0),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const eventCheckins = pgTable("event_checkins", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    eventId: integer("event_id"),
    checkedInAt: timestamp("checked_in_at").defaultNow(),
});

export const eventReviews = pgTable("event_reviews", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    eventId: integer("event_id"),
    rating: integer("rating"),
    title: text("title"),
    review: text("review"),
    createdAt: timestamp("created_at").defaultNow(),
});

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

export const userFollows = pgTable("user_follows", {
    id: serial("id").primaryKey(),
    followerId: integer("follower_id"),
    followingId: integer("following_id"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const ticketScans = pgTable("ticket_scans", {
    id: serial("id").primaryKey(),
    ticketPurchaseId: integer("ticket_purchase_id"),
    orderId: text("order_id"),
    status: text("status"),
    notes: text("notes"),
    scannedAt: timestamp("scanned_at").defaultNow(),
    scannerId: integer("scanner_id"),
});

// --- Passport Tables ---

export const passportProfiles = pgTable("passport_profiles", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    handle: text("handle"),
    points: integer("points").default(0),
    level: integer("level").default(1),
    createdAt: timestamp("created_at").defaultNow(),
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
    displayOrder: integer("display_order").default(0),
    isActive: boolean("is_active").default(true),
    visibility: text("visibility").default("public"), // public, unlisted, private
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const mediaAssets = pgTable("media_assets", {
    id: serial("id").primaryKey(),
    collectionId: integer("collection_id").notNull(),
    title: text("title"),
    url: text("url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    type: text("type").notNull(), // image, video
    displayOrder: integer("display_order").default(0),
    isPublished: boolean("is_published").default(true),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
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
    rewardId: integer("reward_id"), // if referencing a catalog
    title: text("title"),
    description: text("description"),
    status: text("status").default("available"), // available, redeemed
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
    sourceType: text("source_type"), // EARN, SPEND, BONUS
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

// Schemas & Types
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true }).extend({
    date: z.coerce.date(),
    price: z.coerce.number(),
    isSocaPassportEnabled: z.boolean().default(false).optional(),
    featured: z.boolean().default(false).optional(),
});
export const insertProductSchema = createInsertSchema(products).omit({ id: true }).extend({
    price: z.coerce.number(),
    stockLevel: z.coerce.number(),
    lowStockThreshold: z.coerce.number(),
});
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertMediaCollectionSchema = createInsertSchema(mediaCollections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMediaAssetSchema = createInsertSchema(mediaAssets).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type InsertProduct = typeof products.$inferInsert;
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
export type TicketPurchase = typeof ticketPurchases.$inferSelect;
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
