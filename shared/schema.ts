import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

export const insertUserSchema = createInsertSchema(users).pick({
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
});

// Events schema
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  price: integer("price").notNull(),
  imageUrl: text("image_url"),
  category: text("category"),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  date: true,
  location: true,
  price: true,
  imageUrl: true,
  category: true,
  featured: true,
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
});

// Livestreams schema
export const livestreams = pgTable("livestreams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  streamDate: timestamp("stream_date").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  isLive: boolean("is_live").default(false),
  streamUrl: text("stream_url"),
  hostName: text("host_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLivestreamSchema = createInsertSchema(livestreams).pick({
  title: true,
  description: true,
  streamDate: true,
  thumbnailUrl: true,
  isLive: true,
  streamUrl: true,
  hostName: true,
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
  ticketId: integer("ticket_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  subtotal: integer("subtotal").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  ticketId: true,
  quantity: true,
  unitPrice: true,
  subtotal: true,
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

export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type MediaUpload = typeof mediaUploads.$inferSelect;
export type InsertMediaUpload = z.infer<typeof insertMediaUploadSchema>;
