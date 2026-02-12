import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, date, numeric, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  avatar: text("avatar"),
  bio: text("bio"),
  location: text("location"),
  website: text("website"),
  isGuest: boolean("is_guest").default(false),
  role: text("role").default("user"), // Add role field: user, admin, moderator, promoter
  stripeCustomerId: text("stripe_customer_id"),
  paypalCustomerId: text("paypal_customer_id"),
  email: text("email"),
  firebaseId: text("firebase_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Extended user schema with validation
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    displayName: true,
    avatar: true,
    bio: true,
    location: true,
    website: true,
    isGuest: true,
    role: true,
    email: true,
    firebaseId: true,
    stripeCustomerId: true,
    paypalCustomerId: true,
  })
  .extend({
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    password: z.string()
      .min(6, 'Password must be at least 6 characters'),
    email: z.string().email('Invalid email format').optional(),
    role: z.enum(['user', 'admin', 'moderator', 'promoter']).default('user'),
    displayName: z.string().min(1, 'Display name cannot be empty').nullish(),
  });

// Registration schema that requires email
export const registrationSchema = insertUserSchema.extend({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
}).pick({
  username: true,
  email: true,
  displayName: true,
  password: true,
});

// Login schema for validation
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Events schema
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  time: text("time"), // Time string in HH:MM format
  endTime: text("end_time"), // End time string in HH:MM format
  duration: integer("duration"), // Duration in minutes
  location: text("location").notNull(),
  price: integer("price"),
  currency: text("currency").default("USD"), // Currency code (USD, CAD, etc.)
  imageUrl: text("image_url"),
  additionalImages: text("additional_images").array(), // Array of additional image URLs
  category: text("category"),
  featured: boolean("featured").default(false),
  organizerName: text("organizer_name").default("Savage Gentlemen"),
  organizerEmail: text("organizer_email").default("savgmen@gmail.com"),
  // Soca Passport fields
  isSocaPassportEnabled: boolean("is_soca_passport_enabled").default(false),
  stampPointsDefault: integer("stamp_points_default").default(50),
  isPremiumPassport: boolean("is_premium_passport").default(false), // Premium events award 75 credits instead of 50
  countryCode: text("country_code"), // ISO country code (e.g., "TT", "US", "CA")
  carnivalCircuit: text("carnival_circuit"), // e.g., "Trinidad Carnival", "Miami Carnival"
  accessCode: text("access_code"), // Unique code for promoter check-in (e.g., "EVT-123-ABC456")
  // Geo-fencing for scanner-free check-in
  venueLatitude: numeric("venue_latitude"), // Venue latitude for geo-fencing
  venueLongitude: numeric("venue_longitude"), // Venue longitude for geo-fencing
  checkinRadiusMeters: integer("checkin_radius_meters").default(200), // Allowed check-in radius in meters
  stampImageUrl: text("stamp_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deleted Events schema (for recovery/undo functionality)
export const deletedEvents = pgTable("deleted_events", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  eventData: jsonb("event_data").notNull(),
  deletedAt: timestamp("deleted_at").defaultNow(),
  deletedBy: integer("deleted_by"),
  recovered: boolean("recovered").default(false),
});

export const insertEventSchema = createInsertSchema(events)
  .pick({
    title: true,
    description: true,
    date: true,
    time: true,
    endTime: true,
    duration: true,
    location: true,
    price: true,
    currency: true,
    imageUrl: true,
    additionalImages: true,
    category: true,
    featured: true,
    organizerName: true,
    organizerEmail: true,
    isSocaPassportEnabled: true,
    stampPointsDefault: true,
    isPremiumPassport: true,
    countryCode: true,
    carnivalCircuit: true,
    accessCode: true,
    venueLatitude: true,
    venueLongitude: true,
    checkinRadiusMeters: true,
  })
  .extend({
    price: z.number().nullable().optional(),
    currency: z.enum(["USD", "CAD"]).default("USD"),
    isSocaPassportEnabled: z.boolean().default(false),
    stampPointsDefault: z.number().min(0).default(50),
    isPremiumPassport: z.boolean().default(false),
    countryCode: z.string().length(2).transform((val) => val.toUpperCase()).optional(),
    carnivalCircuit: z.string().max(120).optional(),
    stampImageUrl: z.string().optional(),
    accessCode: z.string().max(20).optional(),
    venueLatitude: z.number().min(-90).max(90).optional(),
    venueLongitude: z.number().min(-180).max(180).optional(),
    checkinRadiusMeters: z.number().min(50).max(1000).default(200),
  })
  .transform((data) => {
    // If date is provided as a string, convert it to a Date object
    if (typeof data.date === 'string') {
      return {
        ...data,
        date: new Date(data.date),
      };
    }
    return data;
  });

// Products schema
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
  // Inventory management fields
  sku: text("sku"), // Stock Keeping Unit for inventory tracking
  inStock: boolean("in_stock").default(true),
  stockLevel: integer("stock_level").default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  weight: numeric("weight"), // For shipping calculations
  dimensions: jsonb("dimensions"), // For shipping calculations {length, width, height}
  hasVariants: boolean("has_variants").default(false), // If product has variants like sizes, colors
  trackInventory: boolean("track_inventory").default(true), // Whether to track inventory for this product
  restockDate: timestamp("restock_date"), // Expected date for restocking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).pick({
  title: true,
  description: true,
  price: true,
  imageUrl: true,
  category: true,
  sizes: true,
  featured: true,
  etsyUrl: true,
  printifyUrl: true,
  // Inventory fields
  sku: true,
  inStock: true,
  stockLevel: true,
  lowStockThreshold: true,
  weight: true,
  dimensions: true,
  hasVariants: true,
  trackInventory: true,
  restockDate: true,
});

// Livestreams schema
export const livestreams = pgTable("livestreams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  streamDate: timestamp("stream_date").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  isLive: boolean("is_live").default(false),
  hostName: text("host_name"),
  // Enhanced multi-platform support
  platform: text("platform").default("custom"), // youtube, twitch, instagram, facebook, tiktok, custom
  youtubeUrl: text("youtube_url"),
  twitchChannel: text("twitch_channel"),
  instagramUsername: text("instagram_username"),
  facebookUrl: text("facebook_url"),
  tiktokUsername: text("tiktok_username"),
  customStreamUrl: text("custom_stream_url"),
  embedCode: text("embed_code"), // For custom embed codes
  // Keep streamUrl for backward compatibility
  streamUrl: text("stream_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLivestreamSchema = createInsertSchema(livestreams).pick({
  title: true,
  description: true,
  streamDate: true,
  thumbnailUrl: true,
  isLive: true,
  hostName: true,
  platform: true,
  youtubeUrl: true,
  twitchChannel: true,
  instagramUsername: true,
  facebookUrl: true,
  tiktokUsername: true,
  customStreamUrl: true,
  embedCode: true,
  streamUrl: true,
});

// Posts schema
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content"),
  mediaUrl: text("media_url"),
  createdAt: timestamp("created_at").defaultNow(),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
});

export const insertPostSchema = createInsertSchema(posts).pick({
  userId: true,
  content: true,
  mediaUrl: true,
});

// Comments schema
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  postId: true,
  userId: true,
  content: true,
});

// Chat messages schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  livestreamId: integer("livestream_id"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  // Virtual relation to user (not stored in DB but used in the app)
  user: jsonb("user").notNull().default({}),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  livestreamId: true,
  content: true,
});

// AI Assistant schema
export const aiAssistantConfigs = pgTable("ai_assistant_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  provider: text("provider").notNull(), // 'openai', 'anthropic', 'google', 'custom'
  model: text("model").notNull(), // 'gpt-4', 'claude-3-opus', 'gemini-pro', etc.
  apiKey: text("api_key"), // Encrypted API key
  customEndpoint: text("custom_endpoint"), // For custom AI services
  systemPrompt: text("system_prompt"), // Custom system prompt
  temperature: numeric("temperature").default('0.7'), // Response randomness
  maxTokens: integer("max_tokens").default(1000), // Max response length
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAiAssistantConfigSchema = createInsertSchema(aiAssistantConfigs).pick({
  userId: true,
  provider: true,
  model: true,
  apiKey: true,
  customEndpoint: true,
  systemPrompt: true,
  temperature: true,
  maxTokens: true,
  isActive: true,
});

// AI Chat Sessions schema
export const aiChatSessions = pgTable("ai_chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  configId: integer("config_id").notNull(),
  title: text("title").notNull(),
  context: text("context"), // Additional context for the session
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAiChatSessionSchema = createInsertSchema(aiChatSessions).pick({
  userId: true,
  configId: true,
  title: true,
  context: true,
});

// AI Chat Messages schema
export const aiChatMessages = pgTable("ai_chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  role: text("role").notNull(), // 'user', 'assistant', 'system'
  content: text("content").notNull(),
  tokenCount: integer("token_count"),
  cost: numeric("cost"), // Cost in cents
  processingTime: integer("processing_time"), // Time in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiChatMessageSchema = createInsertSchema(aiChatMessages).pick({
  sessionId: true,
  role: true,
  content: true,
  tokenCount: true,
  cost: true,
  processingTime: true,
});

// Media Collections schema - for grouping media assets (albums/galleries)
export const mediaCollections = pgTable("media_collections", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(), // URL-friendly identifier
  title: text("title").notNull(),
  description: text("description"),
  visibility: text("visibility").notNull().default("public"), // public, private, admin_only
  displayOrder: integer("display_order").default(0),
  thumbnailUrl: text("thumbnail_url"), // Collection cover image
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMediaCollectionSchema = createInsertSchema(mediaCollections)
  .pick({
    slug: true,
    title: true,
    description: true,
    visibility: true,
    displayOrder: true,
    thumbnailUrl: true,
    isActive: true,
  })
  .extend({
    slug: z.string()
      .min(3, 'Slug must be at least 3 characters')
      .max(50, 'Slug must be at most 50 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
    title: z.string()
      .min(1, 'Title is required')
      .max(200, 'Title must be at most 200 characters'),
    description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
    visibility: z.enum(['public', 'private', 'admin_only']).default('public'),
  });

// Media Assets schema - for individual media files
export const mediaAssets = pgTable("media_assets", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull(),
  type: text("type").notNull(), // image, video
  title: text("title").notNull(),
  description: text("description"),
  storageKey: text("storage_key").notNull(), // Hashed filename in storage
  originalFilename: text("original_filename").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  mimeType: text("mime_type").notNull(),
  duration: integer("duration"), // for videos, in seconds
  dimensions: jsonb("dimensions"), // { width: number, height: number }
  transcodedVariants: jsonb("transcoded_variants").default({}), // { hls: string, webm: string, etc }
  displayOrder: integer("display_order").default(0),
  isPublished: boolean("is_published").default(false),
  watermarkEnabled: boolean("watermark_enabled").default(true),
  downloadProtected: boolean("download_protected").default(true),
  viewCount: integer("view_count").default(0),
  lastViewedAt: timestamp("last_viewed_at"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMediaAssetSchema = createInsertSchema(mediaAssets)
  .pick({
    collectionId: true,
    type: true,
    title: true,
    description: true,
    storageKey: true,
    originalFilename: true,
    fileSize: true,
    mimeType: true,
    duration: true,
    dimensions: true,
    transcodedVariants: true,
    displayOrder: true,
    isPublished: true,
    watermarkEnabled: true,
    downloadProtected: true,
    // createdBy is omitted - set programmatically from authenticated user
  })
  .extend({
    type: z.enum(['image', 'video']),
    title: z.string()
      .min(1, 'Title is required')
      .max(200, 'Title must be at most 200 characters'),
    description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
    storageKey: z.string().min(1, 'Storage key is required'),
    originalFilename: z.string().min(1, 'Original filename is required'),
    fileSize: z.number().min(1, 'File size must be greater than 0'),
    mimeType: z.string().min(1, 'MIME type is required'),
  });

// Media Access Logs schema - for tracking views and access attempts
export const mediaAccessLogs = pgTable("media_access_logs", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull(),
  userId: integer("user_id"), // null for anonymous users
  accessType: text("access_type").notNull(), // view, download_attempt, screenshot_attempt
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  success: boolean("success").default(true),
  failureReason: text("failure_reason"),
  accessedAt: timestamp("accessed_at").defaultNow(),
});

export const insertMediaAccessLogSchema = createInsertSchema(mediaAccessLogs)
  .pick({
    assetId: true,
    userId: true,
    accessType: true,
    userAgent: true,
    ipAddress: true,
    success: true,
    failureReason: true,
  })
  .extend({
    accessType: z.enum(['view', 'download_attempt', 'screenshot_attempt']),
  });

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Livestream = typeof livestreams.$inferSelect;
export type InsertLivestream = z.infer<typeof insertLivestreamSchema>;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type AiAssistantConfig = typeof aiAssistantConfigs.$inferSelect;
export type InsertAiAssistantConfig = z.infer<typeof insertAiAssistantConfigSchema>;

export type AiChatSession = typeof aiChatSessions.$inferSelect;
export type InsertAiChatSession = z.infer<typeof insertAiChatSessionSchema>;

export type AiChatMessage = typeof aiChatMessages.$inferSelect;
export type InsertAiChatMessage = z.infer<typeof insertAiChatMessageSchema>;

// Tickets schema
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  name: text("name").notNull(), // e.g., "VIP", "General Admission", "Bottle Service"
  description: text("description"),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
  remainingQuantity: integer("remaining_quantity"),
  isActive: boolean("is_active").default(true),
  status: text("status").default("on_sale"), // on_sale, off_sale, sold_out, staff_only
  priceType: text("price_type").default("standard"), // standard, pay_what_you_can
  minPerOrder: integer("min_per_order").default(1),
  maxPerPurchase: integer("max_per_purchase").default(10),
  displayRemainingQuantity: boolean("display_remaining_quantity").default(true),
  hideIfSoldOut: boolean("hide_if_sold_out").default(false),
  hidePriceIfSoldOut: boolean("hide_price_if_sold_out").default(false),
  secretCode: text("secret_code"), // Access code to see/purchase this ticket
  salesStartDate: timestamp("sales_start_date"),
  salesStartTime: text("sales_start_time"),
  salesEndDate: timestamp("sales_end_date"),
  salesEndTime: text("sales_end_time"),
  hideBeforeSalesStart: boolean("hide_before_sales_start").default(false),
  hideAfterSalesEnd: boolean("hide_after_sales_end").default(false),
  // Lock condition: Requires another ticket to be in cart before this can be purchased
  lockMinQuantity: integer("lock_min_quantity"),
  lockTicketTypeId: integer("lock_ticket_type_id"),
  // Advanced ticket features
  tierLevel: text("tier_level").default("standard"), // standard, premium, vip, ultra_vip
  benefits: text("benefits").array(), // Array of benefits/features
  badgeColor: text("badge_color").default("#3b82f6"), // Color for tier badge
  badgeIcon: text("badge_icon").default("ticket"), // Icon for tier badge
  includedItems: text("included_items").array(), // What's included with this ticket
  transferable: boolean("transferable").default(true), // Can ticket be transferred
  refundable: boolean("refundable").default(false), // Can ticket be refunded
  earlyAccess: boolean("early_access").default(false), // Early entry privilege
  prioritySupport: boolean("priority_support").default(false), // Priority customer support
  exclusiveContent: boolean("exclusive_content").default(false), // Access to exclusive content
  meetGreet: boolean("meet_greet").default(false), // Meet & greet access
  backstageAccess: boolean("backstage_access").default(false), // Backstage access
  seatingPriority: text("seating_priority").default("general"), // general, reserved, premium, vip
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTicketSchema = createInsertSchema(tickets)
  .pick({
    eventId: true,
    name: true,
    description: true,
    price: true,
    quantity: true,
    remainingQuantity: true,
    isActive: true,
    status: true,
    priceType: true,
    minPerOrder: true,
    maxPerPurchase: true,
    displayRemainingQuantity: true,
    hideIfSoldOut: true,
    hidePriceIfSoldOut: true,
    secretCode: true,
    salesStartTime: true,
    salesEndTime: true,
    hideBeforeSalesStart: true,
    hideAfterSalesEnd: true,
    lockMinQuantity: true,
    lockTicketTypeId: true,
    tierLevel: true,
    benefits: true,
    badgeColor: true,
    badgeIcon: true,
    includedItems: true,
    transferable: true,
    refundable: true,
    earlyAccess: true,
    prioritySupport: true,
    exclusiveContent: true,
    meetGreet: true,
    backstageAccess: true,
    seatingPriority: true,
  })
  .extend({
    // Handle dates as strings and convert them in the transform
    salesStartDate: z.string().nullable().optional(),
    salesEndDate: z.string().nullable().optional(),
    // Ensure arrays are properly handled
    benefits: z.array(z.string()).optional(),
    includedItems: z.array(z.string()).optional(),
    tierLevel: z.enum(['standard', 'premium', 'vip', 'ultra_vip']).default('standard'),
    seatingPriority: z.enum(['general', 'reserved', 'premium', 'vip']).default('general'),
  })
  .transform((data) => {
    // Convert string dates to Date objects if present
    return {
      ...data,
      salesStartDate: data.salesStartDate ? new Date(data.salesStartDate) : null,
      salesEndDate: data.salesEndDate ? new Date(data.salesEndDate) : null,
    };
  });

// Discount Codes schema
export const discountCodes = pgTable("discount_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(), // "percentage", "fixed"
  discountValue: integer("discount_value").notNull(), // Amount in cents or percentage
  expiresAt: timestamp("expires_at"),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").default(0),
  eventId: integer("event_id"), // Optional - can be for specific event or all events
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDiscountCodeSchema = createInsertSchema(discountCodes).pick({
  code: true,
  discountType: true,
  discountValue: true,
  expiresAt: true,
  maxUses: true,
  eventId: true,
  isActive: true,
});

// Orders schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  paymentMethod: text("payment_method"), // stripe, paypal, bitcoin
  paymentId: text("payment_id"), // ID from payment provider
  discountCodeId: integer("discount_code_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  totalAmount: true,
  status: true,
  paymentMethod: true,
  paymentId: true,
  discountCodeId: true,
});

// Order Items schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  itemType: text("item_type").notNull(), // product, ticket, variant
  productId: integer("product_id"), // If type is product
  variantId: integer("variant_id"), // If type is variant
  ticketId: integer("ticket_id"), // If type is ticket
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  subtotal: integer("subtotal").notNull(),
  sku: text("sku"), // For inventory tracking
  itemName: text("item_name"), // Name of the product/ticket
  itemDetails: jsonb("item_details").default({}), // Additional details like size, color
  scanDate: timestamp("scan_date"), // When ticket was scanned for entry
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  itemType: true,
  productId: true,
  variantId: true,
  ticketId: true,
  quantity: true,
  unitPrice: true,
  subtotal: true,
  sku: true,
  itemName: true,
  itemDetails: true,
});

// Media Upload schema for product images
export const mediaUploads = pgTable("media_uploads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  url: text("url").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  relatedEntityType: text("related_entity_type"), // product, event, post, etc.
  relatedEntityId: integer("related_entity_id"),
});

export const insertMediaUploadSchema = createInsertSchema(mediaUploads).pick({
  userId: true,
  url: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  relatedEntityType: true,
  relatedEntityId: true,
});

// Export additional types
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

// Ticket Purchases schema
export const ticketPurchases = pgTable("ticket_purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  ticketId: integer("ticket_id"), // Made nullable to support free tickets without specific ticket types
  eventId: integer("event_id").notNull(),
  orderId: integer("order_id").notNull(),
  purchaseDate: timestamp("purchase_date").defaultNow().notNull(),
  status: text("status").default("valid"), // valid, used, cancelled, refunded
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

export const insertTicketPurchaseSchema = createInsertSchema(ticketPurchases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  scanCount: true,
  scanned: true,
  firstScanAt: true,
  lastScanAt: true,
}).extend({
  ticketId: z.number().nullable(), // Explicitly make ticketId nullable for free tickets
});

export type TicketPurchase = typeof ticketPurchases.$inferSelect;
export type InsertTicketPurchase = z.infer<typeof insertTicketPurchaseSchema>;

export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type MediaUpload = typeof mediaUploads.$inferSelect;
export type InsertMediaUpload = z.infer<typeof insertMediaUploadSchema>;

// Define ticket purchase relations
export const ticketPurchasesRelations = relations(ticketPurchases, ({ one }) => ({
  user: one(users, {
    fields: [ticketPurchases.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [ticketPurchases.eventId],
    references: [events.id],
  }),
  order: one(orders, {
    fields: [ticketPurchases.orderId],
    references: [orders.id],
  }),
}));

// Ticket Scans schema to track when tickets are scanned
export const ticketScans = pgTable("ticket_scans", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  orderId: integer("order_id").notNull(),
  scannedAt: timestamp("scanned_at").defaultNow(),
  scannedBy: integer("scanned_by"), // User ID of admin who scanned the ticket
  status: text("status").default("valid"), // valid, already_used, invalid
  notes: text("notes"),
  passportStampId: integer("passport_stamp_id").references(() => passportStamps.id, { onDelete: "set null" }), // FK to passport_stamps for auditing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTicketScanSchema = createInsertSchema(ticketScans).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type TicketScan = typeof ticketScans.$inferSelect;
export type InsertTicketScan = z.infer<typeof insertTicketScanSchema>;

// Product Variants schema
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(), // e.g., "Red - Small", "Blue - Large"
  attributes: jsonb("attributes").default({}), // e.g., {color: "red", size: "S"}
  price: integer("price"), // Override price for this variant
  imageUrl: text("image_url"),
  stockLevel: integer("stock_level").default(0),
  inStock: boolean("in_stock").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductVariantSchema = createInsertSchema(productVariants).pick({
  productId: true,
  sku: true,
  name: true,
  attributes: true,
  price: true,
  imageUrl: true,
  stockLevel: true,
  inStock: true,
});

// Inventory History schema for tracking stock changes
export const inventoryHistory = pgTable("inventory_history", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  variantId: integer("variant_id").references(() => productVariants.id),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  changeQuantity: integer("change_quantity").notNull(),
  changeType: text("change_type").notNull(), // purchase, restock, adjustment, return
  reason: text("reason"),
  userId: integer("user_id").references(() => users.id), // Who made the change
  orderId: integer("order_id").references(() => orders.id), // If change was from purchase
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertInventoryHistorySchema = createInsertSchema(inventoryHistory).omit({
  id: true,
  timestamp: true,
});

// Password reset tokens schema
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: integer("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  used: boolean("used").default(false),
});

// Define relationships between tables
export const usersRelations = relations(users, ({ many }) => ({
  passwordResetTokens: many(passwordResetTokens),
  orders: many(orders),
  inventoryChanges: many(inventoryHistory, { relationName: "userInventoryChanges" }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
  inventoryHistory: many(inventoryHistory),
  analytics: many(productAnalytics),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  inventoryHistory: many(inventoryHistory),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  inventoryChanges: many(inventoryHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
    relationName: "productOrderItems",
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
    relationName: "variantOrderItems",
  }),
  ticket: one(tickets, {
    fields: [orderItems.ticketId],
    references: [tickets.id],
    relationName: "ticketOrderItems",
  }),
}));

export const inventoryHistoryRelations = relations(inventoryHistory, ({ one }) => ({
  product: one(products, {
    fields: [inventoryHistory.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [inventoryHistory.variantId],
    references: [productVariants.id],
  }),
  user: one(users, {
    fields: [inventoryHistory.userId],
    references: [users.id],
    relationName: "userInventoryChanges",
  }),
  order: one(orders, {
    fields: [inventoryHistory.orderId],
    references: [orders.id],
  }),
}));

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).pick({
  token: true,
  userId: true,
  expiresAt: true,
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// Analytics schemas
export const pageViews = pgTable('page_views', {
  id: serial('id').primaryKey(),
  path: text('path').notNull(),
  userId: integer('user_id').references(() => users.id),
  sessionId: text('session_id').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  deviceType: text('device_type'),
  browser: text('browser'),
  referrer: text('referrer'),
  duration: integer('duration'),
});

export const eventAnalytics = pgTable('event_analytics', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id),
  views: integer('views').default(0),
  ticketClicks: integer('ticket_clicks').default(0),
  ticketSales: integer('ticket_sales').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const productAnalytics = pgTable('product_analytics', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id),
  views: integer('views').default(0),
  detailClicks: integer('detail_clicks').default(0),
  purchaseClicks: integer('purchase_clicks').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userEvents = pgTable('user_events', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  eventType: text('event_type').notNull(), // login, register, purchase, view_event, view_product, etc.
  eventData: jsonb('event_data'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  sessionId: text('session_id'),
});

export const dailyStats = pgTable('daily_stats', {
  id: serial('id').primaryKey(),
  date: date('date').notNull().unique(),
  newUsers: integer('new_users').default(0),
  activeUsers: integer('active_users').default(0),
  pageViews: integer('page_views').default(0),
  eventViews: integer('event_views').default(0),
  productViews: integer('product_views').default(0),
  ticketSales: integer('ticket_sales').default(0),
  productClicks: integer('product_clicks').default(0),
  totalRevenue: numeric('total_revenue').default('0'),
});

// Create insert schemas for analytics tables
export const insertPageViewSchema = createInsertSchema(pageViews).omit({
  id: true,
  timestamp: true,
});

export const insertEventAnalyticSchema = createInsertSchema(eventAnalytics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductAnalyticSchema = createInsertSchema(productAnalytics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserEventSchema = createInsertSchema(userEvents).omit({
  id: true,
  timestamp: true,
});

export const insertDailyStatSchema = createInsertSchema(dailyStats).omit({
  id: true,
});

// Define analytics types
export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = z.infer<typeof insertPageViewSchema>;

export type EventAnalytic = typeof eventAnalytics.$inferSelect;
export type InsertEventAnalytic = z.infer<typeof insertEventAnalyticSchema>;

export type ProductAnalytic = typeof productAnalytics.$inferSelect;
export type InsertProductAnalytic = z.infer<typeof insertProductAnalyticSchema>;

export type UserEvent = typeof userEvents.$inferSelect;
export type InsertUserEvent = z.infer<typeof insertUserEventSchema>;

export type DailyStat = typeof dailyStats.$inferSelect;
export type InsertDailyStat = z.infer<typeof insertDailyStatSchema>;

// Export inventory management types
export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;

export type InventoryHistory = typeof inventoryHistory.$inferSelect;
export type InsertInventoryHistory = z.infer<typeof insertInventoryHistorySchema>;

// Email Marketing Schemas
// Email Marketing Lists
export const emailLists = pgTable("email_lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Subscribers
export const emailSubscribers = pgTable("email_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  status: text("status").default("active"), // active, unsubscribed, bounced
  source: text("source"), // registration, manual, import, etc.
  userId: integer("user_id").references(() => users.id),
  metadata: jsonb("metadata"), // Any additional data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    emailIdx: uniqueIndex("email_idx").on(table.email),
  }
});

// Email Campaigns
export const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(), // HTML content
  status: text("status").default("draft"), // draft, scheduled, sent, cancelled
  sentAt: timestamp("sent_at"),
  scheduledFor: timestamp("scheduled_for"),
  listId: integer("list_id").references(() => emailLists.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations between subscribers and lists (many-to-many)
export const emailListSubscribers = pgTable("email_list_subscribers", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull().references(() => emailLists.id),
  subscriberId: integer("subscriber_id").notNull().references(() => emailSubscribers.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    listSubscriberIdx: uniqueIndex("list_subscriber_idx").on(table.listId, table.subscriberId),
  }
});

// Email Campaign Statistics
export const emailCampaignStats = pgTable("email_campaign_stats", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => emailCampaigns.id),
  sent: integer("sent").default(0),
  delivered: integer("delivered").default(0),
  opened: integer("opened").default(0),
  clicked: integer("clicked").default(0),
  bounced: integer("bounced").default(0),
  unsubscribed: integer("unsubscribed").default(0),
  complaints: integer("complaints").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sponsored Content / Ads
export const sponsoredContent = pgTable("sponsored_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull().default("standard"), // standard, banner, product, event, video
  imageUrl: text("image_url"),
  logoUrl: text("logo_url"),
  linkUrl: text("link_url"),
  backgroundColor: text("background_color").default("bg-gray-800"),
  textColor: text("text_color").default("text-white"),
  ctaText: text("cta_text").default("Learn More"),
  price: text("price"), // For product ads
  eventDate: text("event_date"), // For event ads
  location: text("location"), // For event ads
  videoUrl: text("video_url"), // For video ads
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // Higher priority shows first
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  clicks: integer("clicks").default(0),
  views: integer("views").default(0),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Defining insertion schemas for email marketing entities
export const insertEmailListSchema = createInsertSchema(emailLists)
  .pick({
    name: true,
    description: true,
    isActive: true,
  });

export const insertEmailSubscriberSchema = createInsertSchema(emailSubscribers)
  .pick({
    email: true,
    firstName: true,
    lastName: true,
    status: true,
    source: true,
    userId: true,
    metadata: true,
  })
  .extend({
    email: z.string().email('Invalid email format'),
    status: z.enum(['active', 'unsubscribed', 'bounced']).default('active'),
  });

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns)
  .pick({
    name: true,
    subject: true,
    content: true,
    status: true,
    scheduledFor: true,
    listId: true,
  })
  .extend({
    status: z.enum(['draft', 'scheduled', 'sent', 'cancelled']).default('draft'),
  });

// Sponsored Content schema
export const insertSponsoredContentSchema = createInsertSchema(sponsoredContent)
  .pick({
    title: true,
    description: true,
    type: true,
    imageUrl: true,
    logoUrl: true,
    linkUrl: true,
    backgroundColor: true,
    textColor: true,
    ctaText: true,
    price: true,
    eventDate: true,
    location: true,
    videoUrl: true,
    isActive: true,
    priority: true,
    startDate: true,
    endDate: true,
    createdBy: true,
  })
  .extend({
    type: z.enum(['standard', 'banner', 'product', 'event', 'video']).default('standard'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    backgroundColor: z.string().default('bg-gray-800'),
    textColor: z.string().default('text-white'),
    ctaText: z.string().default('Learn More'),
    isActive: z.boolean().default(true),
    priority: z.number().default(0),
  });

export type SponsoredContent = typeof sponsoredContent.$inferSelect;
export type InsertSponsoredContent = z.infer<typeof insertSponsoredContentSchema>;

// Social Integration Tables

// Event Check-ins
export const eventCheckins = pgTable("event_checkins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  checkedInAt: timestamp("checked_in_at").defaultNow(),
  location: text("location"), // GPS coordinates or venue area
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Event Reviews and Ratings
export const eventReviews = pgTable("event_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"),
  review: text("review"),
  isVerifiedAttendee: boolean("is_verified_attendee").default(false),
  helpful: integer("helpful").default(0), // upvotes from other users
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event Photo Galleries (User-Generated Content)
export const eventPhotos = pgTable("event_photos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  photoUrl: text("photo_url").notNull(),
  caption: text("caption"),
  isApproved: boolean("is_approved").default(false), // moderation
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Follows for Social Features
export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: integer("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced Ticketing Tables

// Enhanced Tickets with QR codes and security
export const enhancedTickets = pgTable("enhanced_tickets", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  qrCode: text("qr_code").notNull().unique(), // UUID-based QR code
  securityHash: text("security_hash").notNull(), // Additional security layer
  isTransferable: boolean("is_transferable").default(true),
  transferCount: integer("transfer_count").default(0),
  maxTransfers: integer("max_transfers").default(3),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ticket Transfers
export const ticketTransfers = pgTable("ticket_transfers", {
  id: serial("id").primaryKey(),
  ticketPurchaseId: integer("ticket_purchase_id").notNull().references(() => ticketPurchases.id, { onDelete: "cascade" }),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").references(() => users.id),
  toEmail: text("to_email"), // For transfers to non-users
  transferCode: text("transfer_code").notNull().unique(),
  status: text("status").default("pending"), // pending, completed, cancelled
  transferredAt: timestamp("transferred_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ticket Refunds and Exchanges
export const ticketRefunds = pgTable("ticket_refunds", {
  id: serial("id").primaryKey(),
  ticketPurchaseId: integer("ticket_purchase_id").notNull().references(() => ticketPurchases.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  refundType: text("refund_type").notNull(), // full, partial, exchange
  refundAmount: integer("refund_amount"), // in cents
  reason: text("reason"),
  status: text("status").default("pending"), // pending, approved, rejected, processed
  processedAt: timestamp("processed_at"),
  stripeRefundId: text("stripe_refund_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// VIP Packages and Add-ons
export const ticketAddons = pgTable("ticket_addons", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in cents
  category: text("category"), // vip, merchandise, experience, food
  maxQuantity: integer("max_quantity"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ticket Addon Purchases
export const ticketAddonPurchases = pgTable("ticket_addon_purchases", {
  id: serial("id").primaryKey(),
  ticketPurchaseId: integer("ticket_purchase_id").notNull().references(() => ticketPurchases.id, { onDelete: "cascade" }),
  addonId: integer("addon_id").notNull().references(() => ticketAddons.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1),
  unitPrice: integer("unit_price").notNull(), // in cents
  totalPrice: integer("total_price").notNull(), // in cents
  createdAt: timestamp("created_at").defaultNow(),
});

// Music Mixes
export const musicMixes = pgTable("music_mixes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  priceInCents: integer("price_in_cents").notNull().default(199), // $1.99
  fileUrl: text("file_url").notNull(), // Full mix file path
  previewUrl: text("preview_url"), // Preview/sample clip path
  artworkUrl: text("artwork_url"), // Cover art
  durationSeconds: integer("duration_seconds"), // Duration in seconds
  fileSize: integer("file_size"), // File size in bytes
  isPublished: boolean("is_published").default(false),
  displayOrder: integer("display_order").default(0),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Music Mix Purchases
export const musicMixPurchases = pgTable("music_mix_purchases", {
  id: serial("id").primaryKey(),
  mixId: integer("mix_id").notNull().references(() => musicMixes.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amountPaid: integer("amount_paid").notNull(), // in cents
  currency: text("currency").default("usd"),
  purchasedAt: timestamp("purchased_at").defaultNow(),
  downloadCount: integer("download_count").default(0),
});

// Define email marketing relations
export const emailListsRelations = relations(emailLists, ({ many }) => ({
  subscribers: many(emailListSubscribers),
  campaigns: many(emailCampaigns),
}));

export const emailSubscribersRelations = relations(emailSubscribers, ({ one, many }) => ({
  user: one(users, {
    fields: [emailSubscribers.userId],
    references: [users.id],
  }),
  lists: many(emailListSubscribers),
}));

export const emailCampaignsRelations = relations(emailCampaigns, ({ one, many }) => ({
  list: one(emailLists, {
    fields: [emailCampaigns.listId],
    references: [emailLists.id],
  }),
  stats: many(emailCampaignStats),
}));

export const emailListSubscribersRelations = relations(emailListSubscribers, ({ one }) => ({
  list: one(emailLists, {
    fields: [emailListSubscribers.listId],
    references: [emailLists.id],
  }),
  subscriber: one(emailSubscribers, {
    fields: [emailListSubscribers.subscriberId],
    references: [emailSubscribers.id],
  }),
}));

// Social Integration Relations
export const eventCheckinsRelations = relations(eventCheckins, ({ one }) => ({
  user: one(users, {
    fields: [eventCheckins.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [eventCheckins.eventId],
    references: [events.id],
  }),
}));

export const eventReviewsRelations = relations(eventReviews, ({ one }) => ({
  user: one(users, {
    fields: [eventReviews.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [eventReviews.eventId],
    references: [events.id],
  }),
}));

export const eventPhotosRelations = relations(eventPhotos, ({ one }) => ({
  user: one(users, {
    fields: [eventPhotos.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [eventPhotos.eventId],
    references: [events.id],
  }),
}));

export const userFollowsRelations = relations(userFollows, ({ one }) => ({
  follower: one(users, {
    fields: [userFollows.followerId],
    references: [users.id],
  }),
  following: one(users, {
    fields: [userFollows.followingId],
    references: [users.id],
  }),
}));

// Enhanced Ticketing Relations
export const enhancedTicketsRelations = relations(enhancedTickets, ({ one }) => ({
  ticket: one(tickets, {
    fields: [enhancedTickets.ticketId],
    references: [tickets.id],
  }),
}));

export const ticketTransfersRelations = relations(ticketTransfers, ({ one }) => ({
  ticketPurchase: one(ticketPurchases, {
    fields: [ticketTransfers.ticketPurchaseId],
    references: [ticketPurchases.id],
  }),
  fromUser: one(users, {
    fields: [ticketTransfers.fromUserId],
    references: [users.id],
  }),
  toUser: one(users, {
    fields: [ticketTransfers.toUserId],
    references: [users.id],
  }),
}));

export const ticketRefundsRelations = relations(ticketRefunds, ({ one }) => ({
  ticketPurchase: one(ticketPurchases, {
    fields: [ticketRefunds.ticketPurchaseId],
    references: [ticketPurchases.id],
  }),
  user: one(users, {
    fields: [ticketRefunds.userId],
    references: [users.id],
  }),
}));

export const ticketAddonsRelations = relations(ticketAddons, ({ one, many }) => ({
  event: one(events, {
    fields: [ticketAddons.eventId],
    references: [events.id],
  }),
  purchases: many(ticketAddonPurchases),
}));

export const ticketAddonPurchasesRelations = relations(ticketAddonPurchases, ({ one }) => ({
  ticketPurchase: one(ticketPurchases, {
    fields: [ticketAddonPurchases.ticketPurchaseId],
    references: [ticketPurchases.id],
  }),
  addon: one(ticketAddons, {
    fields: [ticketAddonPurchases.addonId],
    references: [ticketAddons.id],
  }),
}));

// Export email marketing types
export type EmailList = typeof emailLists.$inferSelect;
export type InsertEmailList = z.infer<typeof insertEmailListSchema>;

export type EmailSubscriber = typeof emailSubscribers.$inferSelect;
export type InsertEmailSubscriber = z.infer<typeof insertEmailSubscriberSchema>;

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;

// Social Integration Schemas
export const insertEventCheckinSchema = createInsertSchema(eventCheckins).pick({
  userId: true,
  eventId: true,
  location: true,
  isPublic: true,
});

export const insertEventReviewSchema = createInsertSchema(eventReviews).pick({
  userId: true,
  eventId: true,
  rating: true,
  title: true,
  review: true,
}).extend({
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  review: z.string().max(1000).optional(),
});

export const insertEventPhotoSchema = createInsertSchema(eventPhotos).pick({
  userId: true,
  eventId: true,
  photoUrl: true,
  caption: true,
}).extend({
  caption: z.string().max(500).optional(),
});

export const insertUserFollowSchema = createInsertSchema(userFollows).pick({
  followerId: true,
  followingId: true,
});

// Enhanced Ticketing Schemas
export const insertEnhancedTicketSchema = createInsertSchema(enhancedTickets).pick({
  ticketId: true,
  qrCode: true,
  securityHash: true,
  isTransferable: true,
  maxTransfers: true,
});

export const insertTicketTransferSchema = createInsertSchema(ticketTransfers).pick({
  ticketPurchaseId: true,
  fromUserId: true,
  toUserId: true,
  toEmail: true,
  transferCode: true,
}).extend({
  toEmail: z.string().email().optional(),
});

export const insertTicketRefundSchema = createInsertSchema(ticketRefunds).pick({
  ticketPurchaseId: true,
  userId: true,
  refundType: true,
  refundAmount: true,
  reason: true,
}).extend({
  refundType: z.enum(['full', 'partial', 'exchange']),
  reason: z.string().max(500).optional(),
});

export const insertTicketAddonSchema = createInsertSchema(ticketAddons).pick({
  eventId: true,
  name: true,
  description: true,
  price: true,
  category: true,
  maxQuantity: true,
}).extend({
  category: z.enum(['vip', 'merchandise', 'experience', 'food']).optional(),
  price: z.number().min(0),
});

export const insertTicketAddonPurchaseSchema = createInsertSchema(ticketAddonPurchases).pick({
  ticketPurchaseId: true,
  addonId: true,
  quantity: true,
  unitPrice: true,
  totalPrice: true,
}).extend({
  quantity: z.number().min(1),
});

export const insertMusicMixSchema = createInsertSchema(musicMixes).pick({
  title: true,
  description: true,
  priceInCents: true,
  fileUrl: true,
  previewUrl: true,
  artworkUrl: true,
  durationSeconds: true,
  fileSize: true,
  isPublished: true,
  displayOrder: true,
  uploadedBy: true,
}).extend({
  title: z.string().min(1, 'Title is required'),
  priceInCents: z.number().min(0).default(199),
  fileUrl: z.string().min(1, 'File URL is required'),
});

export const insertMusicMixPurchaseSchema = createInsertSchema(musicMixPurchases).pick({
  mixId: true,
  userId: true,
  stripePaymentIntentId: true,
  amountPaid: true,
  currency: true,
}).extend({
  mixId: z.number().min(1),
  userId: z.number().min(1),
  amountPaid: z.number().min(0),
});

// ===========================================
// SOCA PASSPORT LOYALTY SYSTEM TABLES
// ===========================================

// Passport Profiles - User's passport identity
export const passportProfiles = pgTable("passport_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  handle: text("handle").notNull().unique(), // Public display name
  totalPoints: integer("total_points").notNull().default(0),
  currentTier: text("current_tier").notNull().default("BRONZE"), // BRONZE, SILVER, GOLD, ELITE
  totalEvents: integer("total_events").notNull().default(0),
  totalCountries: integer("total_countries").notNull().default(0),
  profileTheme: text("profile_theme").default("standard"),
  equippedBadgeId: integer("equipped_badge_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    userIdIdx: uniqueIndex("passport_profiles_user_id_idx").on(table.userId),
    handleIdx: uniqueIndex("passport_profiles_handle_idx").on(table.handle),
  };
});

// Passport Stamps - One per event attended
export const passportStamps = pgTable("passport_stamps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  countryCode: text("country_code").notNull(), // ISO country code
  carnivalCircuit: text("carnival_circuit"), // e.g., "Trinidad Carnival"
  pointsEarned: integer("points_earned").notNull(),
  source: text("source").notNull().default("TICKET_SCAN"), // TICKET_SCAN, MISSION, BONUS
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    userEventIdx: uniqueIndex("passport_stamps_user_event_idx").on(table.userId, table.eventId),
  };
});

// Tier Perks Type
export interface TierPerks {
  description: string;
  perks: string[];
  discounts: string[];
  earlyAccess: boolean;
  earlyAccessHours?: number;
  vipPerks?: string[];
}

// Passport Tiers - Configurable tier levels
export const passportTiers = pgTable("passport_tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // BRONZE, SILVER, GOLD, ELITE
  minPoints: integer("min_points").notNull(), // Minimum points required for this tier
  perks: jsonb("perks").$type<TierPerks>().notNull().default(sql`'{}'::jsonb`), // JSON object with tier perks
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    nameIdx: uniqueIndex("passport_tiers_name_idx").on(table.name),
  };
});

// Reward Metadata Type
export interface RewardMetadata {
  title: string;
  description: string;
  tierRequired: string; // BRONZE, SILVER, GOLD, ELITE
  pointsCost: number | null;
  isActive: boolean;
}

// Passport Rewards - Rewards unlocked by users
export const passportRewards = pgTable("passport_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rewardType: text("reward_type").notNull(), // MERCH_DISCOUNT, VIP_LINE, FREE_DRINK, EARLY_ACCESS
  metadata: jsonb("metadata").$type<RewardMetadata>().notNull().default(sql`'{}'::jsonb`), // Additional reward data
  status: text("status").notNull().default("AVAILABLE"), // AVAILABLE, REDEEMED, EXPIRED
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Passport Missions - Future feature for gamification (stub for now)
export const passportMissions = pgTable("passport_missions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  pointsReward: integer("points_reward").notNull(),
  rules: jsonb("rules").notNull().default('{}'), // Mission completion criteria
  activeFrom: timestamp("active_from").notNull(),
  activeTo: timestamp("active_to").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Promoters - External event creators using Soca Passport
export const promoters = pgTable("promoters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }), // Optional FK if promoter has a login
  name: text("name").notNull(),
  email: text("email").notNull(),
  organization: text("organization"),
  locationCity: text("location_city"),
  locationCountry: text("location_country"), // ISO country code (e.g., "US", "TT", "CA")
  websiteOrSocial: text("website_or_social"),
  eventTypes: text("event_types"), // Comma-separated or JSON string
  status: text("status").notNull().default("PENDING"), // PENDING, APPROVED, REJECTED
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event Passport Billing - Per-event fees for using Soca Passport
export const eventPassportBilling = pgTable("event_passport_billing", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  promoterId: integer("promoter_id").references(() => promoters.id, { onDelete: "set null" }),
  billingModel: text("billing_model").notNull().default("PER_EVENT"), // PER_EVENT, SUBSCRIPTION, HYBRID
  feeAmountCents: integer("fee_amount_cents"), // e.g., 1999 for $19.99, null until pricing decided
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("DRAFT"), // DRAFT, PENDING_PAYMENT, PAID, WAIVED
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Passport Memberships - User upgrade tiers (FREE, GOLD, ELITE)
export const passportMemberships = pgTable("passport_memberships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tier: text("tier").notNull().default("FREE"), // FREE, GOLD, ELITE
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, CANCELLED, EXPIRED
  startedAt: timestamp("started_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  metadataJson: jsonb("metadata_json").notNull().default(sql`'{}'::jsonb`), // Stripe subscription IDs, notes, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Passport Profile Insert Schema
export const insertPassportProfileSchema = createInsertSchema(passportProfiles)
  .pick({
    userId: true,
    handle: true,
    totalPoints: true,
    currentTier: true,
    totalEvents: true,
    totalCountries: true,
  })
  .extend({
    handle: z.string()
      .min(3, 'Handle must be at least 3 characters')
      .max(50, 'Handle must be at most 50 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Handle can only contain letters, numbers, underscores, and hyphens'),
    currentTier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'ELITE']).default('BRONZE'),
    totalPoints: z.number().min(0).default(0),
    totalEvents: z.number().min(0).default(0),
    totalCountries: z.number().min(0).default(0),
  });

// Passport Stamp Insert Schema
export const insertPassportStampSchema = createInsertSchema(passportStamps)
  .pick({
    userId: true,
    eventId: true,
    countryCode: true,
    carnivalCircuit: true,
    pointsEarned: true,
    source: true,
  })
  .extend({
    countryCode: z.string().length(2).transform((val) => val.toUpperCase()),
    carnivalCircuit: z.string().max(120).optional(),
    pointsEarned: z.number().min(1, 'Points must be at least 1'),
    source: z.enum(['TICKET_SCAN', 'MISSION', 'BONUS']).default('TICKET_SCAN'),
  });

// Passport Tier Insert Schema
export const insertPassportTierSchema = createInsertSchema(passportTiers)
  .pick({
    name: true,
    minPoints: true,
    perks: true,
  })
  .extend({
    name: z.enum(['BRONZE', 'SILVER', 'GOLD', 'ELITE']),
    minPoints: z.number().min(0),
    perks: z.record(z.any()).default({}),
  });

// Passport Reward Insert Schema
export const insertPassportRewardSchema = createInsertSchema(passportRewards)
  .pick({
    userId: true,
    rewardType: true,
    metadata: true,
    status: true,
    expiresAt: true,
  })
  .extend({
    rewardType: z.enum(['MERCH_DISCOUNT', 'VIP_LINE', 'FREE_DRINK', 'EARLY_ACCESS', 'PRIORITY_ENTRY', 'BACKSTAGE_ACCESS']),
    status: z.enum(['AVAILABLE', 'REDEEMED', 'EXPIRED']).default('AVAILABLE'),
    metadata: z.record(z.any()).default({}),
  });

// Passport Mission Insert Schema
export const insertPassportMissionSchema = createInsertSchema(passportMissions)
  .pick({
    title: true,
    description: true,
    pointsReward: true,
    rules: true,
    activeFrom: true,
    activeTo: true,
  })
  .extend({
    title: z.string().min(1, 'Title is required').max(120),
    pointsReward: z.number().min(1, 'Points reward must be at least 1'),
    rules: z.record(z.any()).default({}),
  });

// Promoter Insert Schema
export const insertPromoterSchema = createInsertSchema(promoters)
  .omit({ id: true, createdAt: true, updatedAt: true, status: true })
  .extend({
    name: z.string().min(1, 'Name is required').max(120),
    email: z.string().email('Valid email is required'),
    organization: z.string().max(255).optional(),
    locationCity: z.string().max(120).optional(),
    locationCountry: z.string().length(2, 'Country code must be 2 characters').optional(),
    websiteOrSocial: z.string().max(255).optional(),
    eventTypes: z.string().max(255).optional(),
  });

// Event Passport Billing Insert Schema
export const insertEventPassportBillingSchema = createInsertSchema(eventPassportBilling)
  .pick({
    eventId: true,
    promoterId: true,
    billingModel: true,
    feeAmountCents: true,
    currency: true,
    status: true,
    notes: true,
  })
  .extend({
    billingModel: z.enum(['PER_EVENT', 'SUBSCRIPTION', 'HYBRID']).default('PER_EVENT'),
    feeAmountCents: z.number().min(0).optional(),
    currency: z.string().length(3).default('USD'),
    status: z.enum(['DRAFT', 'PENDING_PAYMENT', 'PAID', 'WAIVED']).default('DRAFT'),
  });

// Passport Membership Insert Schema
export const insertPassportMembershipSchema = createInsertSchema(passportMemberships)
  .pick({
    userId: true,
    tier: true,
    status: true,
    startedAt: true,
    expiresAt: true,
    metadataJson: true,
  })
  .extend({
    tier: z.enum(['FREE', 'GOLD', 'ELITE']).default('FREE'),
    status: z.enum(['ACTIVE', 'CANCELLED', 'EXPIRED']).default('ACTIVE'),
    metadataJson: z.record(z.any()).default({}),
  });

// ============================================================
// ENHANCED PASSPORT LOYALTY - CREDITS & ACHIEVEMENTS SYSTEM
// ============================================================

// Passport Credit Transactions - Double-entry ledger for all credit earn/spend activity
export const passportCreditTransactions = pgTable("passport_credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  delta: integer("delta").notNull(), // Positive for earning, negative for spending
  balanceAfter: integer("balance_after").notNull(), // Running balance snapshot
  sourceType: text("source_type").notNull(), // CHECK_IN, MISSION, BONUS, REDEMPTION, ADMIN_ADJUSTMENT
  sourceId: integer("source_id"), // FK to relevant table (stamp_id, mission_id, redemption_id, etc.)
  memo: text("memo"), // Human-readable description
  expiresAt: timestamp("expires_at"), // Optional credit expiration
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id), // Admin user who created manual adjustment
}, (table) => {
  return {
    userIdIdx: uniqueIndex("passport_credit_transactions_user_id_idx").on(table.userId),
    createdAtIdx: uniqueIndex("passport_credit_transactions_created_at_idx").on(table.createdAt),
  };
});

// Passport Achievement Definitions - Catalog of all possible achievements
export const passportAchievementDefinitions = pgTable("passport_achievement_definitions", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(), // first_fete, party_animal_10, big_spender_500
  name: text("name").notNull(), // "First Fête"
  description: text("description").notNull(), // "Attend your first event"
  category: text("category").notNull(), // BEGINNER, SOCIAL, ATTENDANCE, TRAVEL, SPENDING (non-unique)
  criteria: jsonb("criteria").notNull().default(sql`'{}'::jsonb`), // { eventsAttended: 10 } or { totalSpent: 500 }
  creditBonus: integer("credit_bonus").default(0), // Bonus credits awarded on unlock
  tierRequirement: text("tier_requirement"), // BRONZE, SILVER, GOLD, ELITE (null if no requirement)
  isRepeatable: boolean("is_repeatable").default(false), // Can be unlocked multiple times
  iconUrl: text("icon_url"), // Badge icon image
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    slugIdx: uniqueIndex("passport_achievement_definitions_slug_idx").on(table.slug),
    // categoryIdx removed to allow duplicates
  };
});

// Passport User Achievements - Tracks which achievements each user has unlocked
export const passportUserAchievements = pgTable("passport_user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: integer("achievement_id").notNull().references(() => passportAchievementDefinitions.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  progressState: jsonb("progress_state").default(sql`'{}'::jsonb`), // Current progress for repeatable achievements
  notifiedAt: timestamp("notified_at"), // When user was notified
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    userAchievementIdx: uniqueIndex("passport_user_achievements_user_achievement_idx").on(table.userId, table.achievementId),
  };
});

// Passport Redemption Offers - Marketplace catalog of available perks
export const passportRedemptionOffers = pgTable("passport_redemption_offers", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(), // ticket_discount_5, vip_line_access, free_drink
  name: text("name").notNull(), // "$5 Off Tickets"
  description: text("description"),
  category: text("category").notNull(), // TICKET_BENEFITS, EVENT_PERKS, MERCH_REWARDS, COLLECTOR_EXPERIENCES
  pointsCost: integer("points_cost").notNull(), // Credits required to claim
  inventory: integer("inventory"), // null = unlimited, number = limited quantity
  inventoryRemaining: integer("inventory_remaining"), // Tracks remaining inventory
  channel: text("channel").default("ALL"), // ALL, MOBILE, WEB, IN_PERSON
  fulfillmentMetadata: jsonb("fulfillment_metadata").default(sql`'{}'::jsonb`), // Instructions for redemption
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  tierRequirement: text("tier_requirement"), // BRONZE, SILVER, GOLD, ELITE (null if no requirement)
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    slugIdx: uniqueIndex("passport_redemption_offers_slug_idx").on(table.slug),
    // Removed incorrect unique indexes on category and isActive
  };
});

// Passport User Redemptions - Tracks user's claimed perks/rewards
export const passportUserRedemptions = pgTable("passport_user_redemptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  offerId: integer("offer_id").notNull().references(() => passportRedemptionOffers.id, { onDelete: "restrict" }),
  transactionId: integer("transaction_id").references(() => passportCreditTransactions.id), // FK to credit deduction
  status: text("status").notNull().default("CLAIMED"), // CLAIMED, REDEEMED, EXPIRED, CANCELLED
  validationCode: text("validation_code").unique(), // Unique code for promoter validation (e.g., "RDM-ABC123")
  redeemedAt: timestamp("redeemed_at"), // When promoter validated the code
  redeemedBy: integer("redeemed_by").references(() => users.id), // Admin/promoter who validated
  expiresAt: timestamp("expires_at"), // Expiration date for the reward
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`), // Additional redemption data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    userIdIdx: uniqueIndex("passport_user_redemptions_user_id_idx").on(table.userId),
    validationCodeIdx: uniqueIndex("passport_user_redemptions_validation_code_idx").on(table.validationCode),
  };
});

// Passport Social Shares - Tracks user's social media shares for achievements
export const passportSocialShares = pgTable("passport_social_shares", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  shareType: text("share_type").notNull(), // ACHIEVEMENT, TIER_UPGRADE, COUNTRY_STAMP, MILESTONE
  payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`), // Share card data
  platform: text("platform"), // INSTAGRAM, TIKTOK, WHATSAPP, FACEBOOK, TWITTER
  resultingAchievementId: integer("resulting_achievement_id").references(() => passportUserAchievements.id), // If share unlocked an achievement
  bonusCreditsAwarded: integer("bonus_credits_awarded").default(0), // Bonus for tagging event
  sharedAt: timestamp("shared_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    userIdIdx: uniqueIndex("passport_social_shares_user_id_idx").on(table.userId),
    sharedAtIdx: uniqueIndex("passport_social_shares_shared_at_idx").on(table.sharedAt),
  };
});

// Passport QR Check-ins - Decoupled scanner events for earning credits
export const passportQrCheckins = pgTable("passport_qr_checkins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  stampId: integer("stamp_id").references(() => passportStamps.id), // FK to created stamp
  transactionId: integer("transaction_id").references(() => passportCreditTransactions.id), // FK to credit transaction
  creditsEarned: integer("credits_earned").notNull(), // 50 for standard, 75 for premium
  isPremium: boolean("is_premium").default(false), // Premium event gets +75 credits
  accessCode: text("access_code"), // Event's access code that was scanned
  checkinMethod: text("checkin_method").default("QR_SCAN"), // QR_SCAN, MANUAL_ENTRY, TICKET_VALIDATION
  checkedInAt: timestamp("checked_in_at").defaultNow(),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`), // Device info, location, etc.
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    userEventIdx: uniqueIndex("passport_qr_checkins_user_event_idx").on(table.userId, table.eventId),
    eventIdIdx: uniqueIndex("passport_qr_checkins_event_id_idx").on(table.eventId),
  };
});

// Insert Schemas for new tables
export const insertPassportCreditTransactionSchema = createInsertSchema(passportCreditTransactions)
  .pick({
    userId: true,
    delta: true,
    balanceAfter: true,
    sourceType: true,
    sourceId: true,
    memo: true,
    expiresAt: true,
    createdBy: true,
  })
  .extend({
    sourceType: z.enum(['CHECK_IN', 'MISSION', 'BONUS', 'REDEMPTION', 'ADMIN_ADJUSTMENT']),
    delta: z.number(),
    balanceAfter: z.number().min(0),
  });

export const insertPassportAchievementDefinitionSchema = createInsertSchema(passportAchievementDefinitions)
  .pick({
    slug: true,
    name: true,
    description: true,
    category: true,
    criteria: true,
    creditBonus: true,
    tierRequirement: true,
    isRepeatable: true,
    iconUrl: true,
    sortOrder: true,
    isActive: true,
  })
  .extend({
    category: z.enum(['BEGINNER', 'SOCIAL', 'ATTENDANCE', 'TRAVEL', 'SPENDING']),
    tierRequirement: z.enum(['BRONZE', 'SILVER', 'GOLD', 'ELITE']).optional(),
    criteria: z.record(z.any()).default({}),
  });

export const insertPassportUserAchievementSchema = createInsertSchema(passportUserAchievements)
  .pick({
    userId: true,
    achievementId: true,
    progressState: true,
    notifiedAt: true,
  })
  .extend({
    progressState: z.record(z.any()).default({}),
  });

export const insertPassportRedemptionOfferSchema = createInsertSchema(passportRedemptionOffers)
  .pick({
    slug: true,
    name: true,
    description: true,
    category: true,
    pointsCost: true,
    inventory: true,
    inventoryRemaining: true,
    channel: true,
    fulfillmentMetadata: true,
    validFrom: true,
    validTo: true,
    tierRequirement: true,
    isActive: true,
    sortOrder: true,
    imageUrl: true,
  })
  .extend({
    category: z.enum(['TICKET_BENEFITS', 'EVENT_PERKS', 'MERCH_REWARDS', 'COLLECTOR_EXPERIENCES']),
    pointsCost: z.number().min(0),
    channel: z.enum(['ALL', 'MOBILE', 'WEB', 'IN_PERSON']).default('ALL'),
    tierRequirement: z.enum(['BRONZE', 'SILVER', 'GOLD', 'ELITE']).optional(),
    fulfillmentMetadata: z.record(z.any()).default({}),
  });

export const insertPassportUserRedemptionSchema = createInsertSchema(passportUserRedemptions)
  .pick({
    userId: true,
    offerId: true,
    transactionId: true,
    status: true,
    validationCode: true,
    redeemedAt: true,
    redeemedBy: true,
    expiresAt: true,
    metadata: true,
  })
  .extend({
    status: z.enum(['CLAIMED', 'REDEEMED', 'EXPIRED', 'CANCELLED']).default('CLAIMED'),
    metadata: z.record(z.any()).default({}),
  });

export const insertPassportSocialShareSchema = createInsertSchema(passportSocialShares)
  .pick({
    userId: true,
    shareType: true,
    payload: true,
    platform: true,
    resultingAchievementId: true,
    bonusCreditsAwarded: true,
  })
  .extend({
    shareType: z.enum(['ACHIEVEMENT', 'TIER_UPGRADE', 'COUNTRY_STAMP', 'MILESTONE']),
    platform: z.enum(['INSTAGRAM', 'TIKTOK', 'WHATSAPP', 'FACEBOOK', 'TWITTER']).optional(),
    payload: z.record(z.any()).default({}),
  });

export const insertPassportQrCheckinSchema = createInsertSchema(passportQrCheckins)
  .pick({
    userId: true,
    eventId: true,
    stampId: true,
    transactionId: true,
    creditsEarned: true,
    isPremium: true,
    accessCode: true,
    checkinMethod: true,
    metadata: true,
  })
  .extend({
    creditsEarned: z.number().min(0),
    isPremium: z.boolean().default(false),
    checkinMethod: z.enum(['QR_SCAN', 'MANUAL_ENTRY', 'TICKET_VALIDATION']).default('QR_SCAN'),
    metadata: z.record(z.any()).default({}),
  });

// ============================================================
// PROMOTER SUBSCRIPTION SYSTEM
// ============================================================

// Promoter Subscription Plans - Pricing tiers for event promoters
export const promoterSubscriptionPlans = pgTable("promoter_subscription_plans", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(), // FREE, STARTER, PRO, ENTERPRISE
  displayName: text("display_name").notNull(), // "Free", "Starter", "Pro", "Enterprise"
  description: text("description"),
  isEnterprise: boolean("is_enterprise").default(false), // Custom pricing for enterprise

  // Feature flags (typed columns for reliability)
  hasBasicScanner: boolean("has_basic_scanner").default(true),
  hasBasicDashboard: boolean("has_basic_dashboard").default(true),
  hasAdvancedAnalytics: boolean("has_advanced_analytics").default(false),
  hasDataExports: boolean("has_data_exports").default(false),
  hasCrossEventInsights: boolean("has_cross_event_insights").default(false),
  hasWhiteLabel: boolean("has_white_label").default(false),
  hasPrioritySupport: boolean("has_priority_support").default(false),
  hasCustomIntegrations: boolean("has_custom_integrations").default(false),

  // Early adopter program configuration
  earlyAdopterSlotsTotal: integer("early_adopter_slots_total").default(5), // Total early adopter slots (e.g., 5)
  earlyAdopterSlotsFilled: integer("early_adopter_slots_filled").default(0), // Slots filled so far
  earlyAdopterTrialDays: integer("early_adopter_trial_days").default(90), // 3 months = 90 days
  earlyAdopterDiscountPercent: integer("early_adopter_discount_percent").default(50), // 50% lifetime discount

  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Promoter Plan Billing Options - Separate table for pricing with FK
export const promoterPlanBillingOptions = pgTable("promoter_plan_billing_options", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => promoterSubscriptionPlans.id),
  billingInterval: text("billing_interval").notNull(), // 'event' or 'year'
  priceCents: integer("price_cents").notNull(), // Price in cents (e.g., 3900 for $39)
  stripePriceId: text("stripe_price_id"), // Stripe price ID for this specific option
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Promoter Subscriptions - Track active subscriptions for promoters
export const promoterSubscriptions = pgTable("promoter_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => promoterSubscriptionPlans.id),
  billingOptionId: integer("billing_option_id").notNull().references(() => promoterPlanBillingOptions.id), // FK to specific billing option
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, CANCELLED, EXPIRED, TRIAL

  // Stripe integration
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),

  // Per-event tracking
  perEventUsageCount: integer("per_event_usage_count").default(0), // Track events scanned for per-event plans

  // Billing period
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),

  // Trial and early adopter tracking
  trialEnd: timestamp("trial_end"), // Trial end date (populated from plan early adopter config)
  isEarlyAdopter: boolean("is_early_adopter").default(false),
  earlyAdopterNumber: integer("early_adopter_number"), // 1-5 for first 5 promoters (unique per plan)
  lifetimeDiscountPercent: integer("lifetime_discount_percent").default(0), // Copied from plan config when granted

  // Metadata
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`), // Notes, custom enterprise pricing, etc

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  cancelledAt: timestamp("cancelled_at"),
});

// Promoter Profiles - Additional business information for promoters
export const promoterProfiles = pgTable("promoter_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  businessName: text("business_name"),
  businessEmail: text("business_email"),
  businessPhone: text("business_phone"),
  businessWebsite: text("business_website"),
  taxId: text("tax_id"), // For enterprise billing
  billingAddress: jsonb("billing_address").default(sql`'{}'::jsonb`),
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert Schemas
export const insertPromoterSubscriptionPlanSchema = createInsertSchema(promoterSubscriptionPlans)
  .pick({
    slug: true,
    displayName: true,
    description: true,
    isEnterprise: true,
    hasBasicScanner: true,
    hasBasicDashboard: true,
    hasAdvancedAnalytics: true,
    hasDataExports: true,
    hasCrossEventInsights: true,
    hasWhiteLabel: true,
    hasPrioritySupport: true,
    hasCustomIntegrations: true,
    earlyAdopterSlotsTotal: true,
    earlyAdopterSlotsFilled: true,
    earlyAdopterTrialDays: true,
    earlyAdopterDiscountPercent: true,
    isActive: true,
    sortOrder: true,
  })
  .extend({
    slug: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']),
  });

export const insertPromoterPlanBillingOptionSchema = createInsertSchema(promoterPlanBillingOptions)
  .pick({
    planId: true,
    billingInterval: true,
    priceCents: true,
    stripePriceId: true,
    isActive: true,
  })
  .extend({
    billingInterval: z.enum(['event', 'year']),
    priceCents: z.number().min(0),
  });

export const insertPromoterSubscriptionSchema = createInsertSchema(promoterSubscriptions)
  .pick({
    userId: true,
    planId: true,
    billingOptionId: true,
    status: true,
    stripeSubscriptionId: true,
    stripeCustomerId: true,
    currentPeriodStart: true,
    currentPeriodEnd: true,
    trialEnd: true,
    isEarlyAdopter: true,
    earlyAdopterNumber: true,
    lifetimeDiscountPercent: true,
    metadata: true,
  })
  .extend({
    status: z.enum(['ACTIVE', 'CANCELLED', 'EXPIRED', 'TRIAL']).default('ACTIVE'),
    metadata: z.record(z.any()).default({}),
  });

export const insertPromoterProfileSchema = createInsertSchema(promoterProfiles)
  .pick({
    userId: true,
    businessName: true,
    businessEmail: true,
    businessPhone: true,
    businessWebsite: true,
    taxId: true,
    billingAddress: true,
    isVerified: true,
  })
  .extend({
    businessEmail: z.string().email().optional(),
    billingAddress: z.record(z.any()).default({}),
  });

// Export Passport Types
export type PassportProfile = typeof passportProfiles.$inferSelect;
export type InsertPassportProfile = z.infer<typeof insertPassportProfileSchema>;

export type PassportStamp = typeof passportStamps.$inferSelect;
export type InsertPassportStamp = z.infer<typeof insertPassportStampSchema>;

export type PassportTier = typeof passportTiers.$inferSelect;
export type InsertPassportTier = z.infer<typeof insertPassportTierSchema>;

export type PassportReward = typeof passportRewards.$inferSelect;
export type InsertPassportReward = z.infer<typeof insertPassportRewardSchema>;

export type PassportMission = typeof passportMissions.$inferSelect;
export type InsertPassportMission = z.infer<typeof insertPassportMissionSchema>;

export type Promoter = typeof promoters.$inferSelect;
export type InsertPromoter = z.infer<typeof insertPromoterSchema>;

export type EventPassportBilling = typeof eventPassportBilling.$inferSelect;
export type InsertEventPassportBilling = z.infer<typeof insertEventPassportBillingSchema>;

export type PassportMembership = typeof passportMemberships.$inferSelect;
export type InsertPassportMembership = z.infer<typeof insertPassportMembershipSchema>;

// Type exports for new tables
export type EventCheckin = typeof eventCheckins.$inferSelect;
export type InsertEventCheckin = z.infer<typeof insertEventCheckinSchema>;

export type EventReview = typeof eventReviews.$inferSelect;
export type InsertEventReview = z.infer<typeof insertEventReviewSchema>;

export type EventPhoto = typeof eventPhotos.$inferSelect;
export type InsertEventPhoto = z.infer<typeof insertEventPhotoSchema>;

export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = z.infer<typeof insertUserFollowSchema>;

export type EnhancedTicket = typeof enhancedTickets.$inferSelect;
export type InsertEnhancedTicket = z.infer<typeof insertEnhancedTicketSchema>;

export type TicketTransfer = typeof ticketTransfers.$inferSelect;
export type InsertTicketTransfer = z.infer<typeof insertTicketTransferSchema>;

export type TicketRefund = typeof ticketRefunds.$inferSelect;
export type InsertTicketRefund = z.infer<typeof insertTicketRefundSchema>;

export type TicketAddon = typeof ticketAddons.$inferSelect;
export type InsertTicketAddon = z.infer<typeof insertTicketAddonSchema>;

export type TicketAddonPurchase = typeof ticketAddonPurchases.$inferSelect;
export type InsertTicketAddonPurchase = z.infer<typeof insertTicketAddonPurchaseSchema>;

// Media types
export type MediaCollection = typeof mediaCollections.$inferSelect;
export type InsertMediaCollection = z.infer<typeof insertMediaCollectionSchema>;

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type InsertMediaAsset = z.infer<typeof insertMediaAssetSchema>;

export type MediaAccessLog = typeof mediaAccessLogs.$inferSelect;
export type InsertMediaAccessLog = z.infer<typeof insertMediaAccessLogSchema>;

// Music Mix types
export type MusicMix = typeof musicMixes.$inferSelect;
export type InsertMusicMix = z.infer<typeof insertMusicMixSchema>;

export type MusicMixPurchase = typeof musicMixPurchases.$inferSelect;
export type InsertMusicMixPurchase = z.infer<typeof insertMusicMixPurchaseSchema>;

// Promoter Subscription types
export type PromoterSubscriptionPlan = typeof promoterSubscriptionPlans.$inferSelect;
export type InsertPromoterSubscriptionPlan = z.infer<typeof insertPromoterSubscriptionPlanSchema>;

export type PromoterPlanBillingOption = typeof promoterPlanBillingOptions.$inferSelect;
export type InsertPromoterPlanBillingOption = z.infer<typeof insertPromoterPlanBillingOptionSchema>;

export type PromoterSubscription = typeof promoterSubscriptions.$inferSelect;
export type InsertPromoterSubscription = z.infer<typeof insertPromoterSubscriptionSchema>;

export type PromoterProfile = typeof promoterProfiles.$inferSelect;
export type InsertPromoterProfile = z.infer<typeof insertPromoterProfileSchema>;

// Passport Credit System types
export type PassportCreditTransaction = typeof passportCreditTransactions.$inferSelect;
export type InsertPassportCreditTransaction = z.infer<typeof insertPassportCreditTransactionSchema>;

export type PassportAchievementDefinition = typeof passportAchievementDefinitions.$inferSelect;
export type InsertPassportAchievementDefinition = z.infer<typeof insertPassportAchievementDefinitionSchema>;

export type PassportUserAchievement = typeof passportUserAchievements.$inferSelect;
export type InsertPassportUserAchievement = z.infer<typeof insertPassportUserAchievementSchema>;

export type PassportRedemptionOffer = typeof passportRedemptionOffers.$inferSelect;
export type InsertPassportRedemptionOffer = z.infer<typeof insertPassportRedemptionOfferSchema>;

export type PassportUserRedemption = typeof passportUserRedemptions.$inferSelect;
export type InsertPassportUserRedemption = z.infer<typeof insertPassportUserRedemptionSchema>;

export type PassportSocialShare = typeof passportSocialShares.$inferSelect;
export type InsertPassportSocialShare = z.infer<typeof insertPassportSocialShareSchema>;

export type PassportQrCheckin = typeof passportQrCheckins.$inferSelect;
export type InsertPassportQrCheckin = z.infer<typeof insertPassportQrCheckinSchema>;
