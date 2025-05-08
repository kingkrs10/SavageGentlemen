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
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  avatar: true,
  isGuest: true,
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
