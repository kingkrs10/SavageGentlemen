import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, date, numeric, uniqueIndex } from "drizzle-orm/pg-core";
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
  isGuest: boolean("is_guest").default(false),
  role: text("role").default("user"), // Add role field: user, admin, moderator
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
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    email: z.string().email('Invalid email format').nullish(),
    role: z.enum(['user', 'admin', 'moderator']).default('user'),
    displayName: z.string().min(1, 'Display name cannot be empty').nullish(),
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
  imageUrl: text("image_url"),
  category: text("category"),
  featured: boolean("featured").default(false),
  organizerName: text("organizer_name").default("Savage Gentlemen"),
  organizerEmail: text("organizer_email").default("savgmen@gmail.com"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
    price: false,
    imageUrl: true,
    category: true,
    featured: true,
    organizerName: true,
    organizerEmail: true,
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTicketSchema = createInsertSchema(tickets).pick({
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
  salesStartDate: true,
  salesStartTime: true,
  salesEndDate: true,
  salesEndTime: true,
  hideBeforeSalesStart: true,
  hideAfterSalesEnd: true,
  lockMinQuantity: true,
  lockTicketTypeId: true,
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
  ticketId: integer("ticket_id").notNull(),
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

// Export email marketing types
export type EmailList = typeof emailLists.$inferSelect;
export type InsertEmailList = z.infer<typeof insertEmailListSchema>;

export type EmailSubscriber = typeof emailSubscribers.$inferSelect;
export type InsertEmailSubscriber = z.infer<typeof insertEmailSubscriberSchema>;

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
