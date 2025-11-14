import {
  User,
  InsertUser,
  Event,
  InsertEvent,
  Product,
  InsertProduct,
  Livestream,
  InsertLivestream,
  Post,
  InsertPost,
  Comment,
  InsertComment,
  ChatMessage,
  InsertChatMessage,
  Ticket,
  InsertTicket,
  TicketPurchase,
  InsertTicketPurchase,
  DiscountCode,
  InsertDiscountCode,
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  MediaUpload,
  InsertMediaUpload,
  TicketScan,
  InsertTicketScan,
  PasswordResetToken,
  InsertPasswordResetToken,
  // Inventory management types
  ProductVariant,
  InsertProductVariant,
  InventoryHistory,
  InsertInventoryHistory,
  // Analytics schemas
  PageView,
  InsertPageView,
  EventAnalytic,
  InsertEventAnalytic,
  ProductAnalytic,
  InsertProductAnalytic,
  UserEvent,
  InsertUserEvent,
  DailyStat,
  InsertDailyStat,
  // Sponsored Content schemas
  SponsoredContent,
  InsertSponsoredContent,
  // AI Assistant schemas
  AiAssistantConfig,
  InsertAiAssistantConfig,
  AiChatSession,
  InsertAiChatSession,
  AiChatMessage,
  InsertAiChatMessage,
  // Media schemas
  MediaCollection,
  InsertMediaCollection,
  MediaAsset,
  InsertMediaAsset,
  MediaAccessLog,
  InsertMediaAccessLog,
  // Music Mix schemas
  MusicMix,
  InsertMusicMix,
  MusicMixPurchase,
  InsertMusicMixPurchase,
  users,
  events,
  products,
  livestreams,
  posts,
  ticketPurchases,
  comments,
  chatMessages,
  tickets,
  discountCodes,
  orders,
  orderItems,
  mediaUploads,
  ticketScans,
  passwordResetTokens,
  productVariants,
  inventoryHistory,
  // Analytics tables
  pageViews,
  eventAnalytics,
  productAnalytics,
  userEvents,
  dailyStats,
  // Sponsored content table
  sponsoredContent,
  // AI Assistant tables
  aiAssistantConfigs,
  aiChatSessions,
  aiChatMessages,
  // Media tables
  mediaCollections,
  mediaAssets,
  mediaAccessLogs,
  // Music Mix tables
  musicMixes,
  musicMixPurchases,
  // Passport tables
  passportProfiles,
  passportStamps,
  passportTiers,
  passportRewards,
  passportMissions,
  PassportProfile,
  InsertPassportProfile,
  PassportStamp,
  InsertPassportStamp,
  PassportTier,
  InsertPassportTier,
  PassportReward,
  InsertPassportReward,
  PassportMission,
  InsertPassportMission,
  // Promoter tables
  promoters,
  Promoter,
  InsertPromoter,
  // Passport Membership tables
  passportMemberships,
  PassportMembership,
  InsertPassportMembership
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gt, sql, lte, lt, isNotNull, not } from "drizzle-orm";

// Interface for storage operations
// Store for recently deleted events (for undo functionality)
// Store for recently deleted events (for undo functionality)
const deletedEventsStore: Map<number, { event: Event, deletedAt: Date }> = new Map();

// Function to store a deleted event
const storeDeletedEvent = (event: Event) => {
  console.log(`Storing deleted event: ${event.title} (ID: ${event.id})`);
  deletedEventsStore.set(event.id, { 
    event, 
    deletedAt: new Date() 
  });
  
  // Clean up older deleted events (keep for 24 hours max)
  cleanupOldDeletedEvents();
  
  // Log what's in the store after storing
  console.log(`Current deleted event store has ${deletedEventsStore.size} items`);
  deletedEventsStore.forEach((value, key) => {
    console.log(`- Deleted event in store: ID ${key}, Title: ${value.event.title}, Deleted at: ${value.deletedAt}`);
  });
};

// Clean up older deleted events (keep for 24 hours max)
const cleanupOldDeletedEvents = () => {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  
  deletedEventsStore.forEach((value, key) => {
    if (value.deletedAt < twentyFourHoursAgo) {
      console.log(`Cleaning up old deleted event: ${value.event.title} (ID: ${key})`);
      deletedEventsStore.delete(key);
    }
  });
};

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseId(firebaseId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  updateUserPassword(id: number, newPassword: string): Promise<User | undefined>;
  verifyPassword(userId: number, password: string): Promise<boolean>;
  deleteUser(id: number): Promise<boolean>;
  
  // Password reset operations
  storePasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  deletePasswordResetToken(token: string): Promise<boolean>;
  
  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  getUpcomingEvents(): Promise<Event[]>;
  getPastEvents(): Promise<Event[]>;
  getFeaturedEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, eventData: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  getLastDeletedEvent(): Promise<{ event: Event, deletedAt: Date } | null>;
  restoreDeletedEvent(id: number): Promise<Event | null>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Livestream operations
  getLivestream(id: number): Promise<Livestream | undefined>;
  getAllLivestreams(): Promise<Livestream[]>;
  getCurrentLivestream(): Promise<Livestream | undefined>;
  getUpcomingLivestreams(): Promise<Livestream[]>;
  createLivestream(livestream: InsertLivestream): Promise<Livestream>;
  updateLivestream(id: number, livestreamData: Partial<Livestream>): Promise<Livestream | undefined>;
  deleteLivestream(id: number): Promise<boolean>;
  
  // Post operations
  getPost(id: number): Promise<Post | undefined>;
  getAllPosts(): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  
  // Comment operations
  getComment(id: number): Promise<Comment | undefined>;
  getCommentById(id: number): Promise<Comment | undefined>;
  getCommentsByPostId(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;
  decrementPostCommentCount(postId: number): Promise<void>;
  
  // Chat operations
  getChatMessagesByLivestreamId(livestreamId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Ticket operations
  getTicket(id: number): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getAllTickets(): Promise<Ticket[]>;
  getTicketsByEventId(eventId: number): Promise<Ticket[]>;
  getPublicTicketsByEventId(eventId: number): Promise<Ticket[]>;
  updateTicket(id: number, ticketData: Partial<InsertTicket>): Promise<Ticket | undefined>;
  
  // Ticket purchase operations
  createTicketPurchase(ticketPurchase: InsertTicketPurchase): Promise<TicketPurchase>;
  getTicketPurchasesByUserId(userId: number): Promise<TicketPurchase[]>;
  getTicketPurchasesByEventId(eventId: number): Promise<TicketPurchase[]>;
  getTicketPurchase(id: number): Promise<TicketPurchase | undefined>;
  getTicketPurchaseByQrCodeData(qrCodeData: string): Promise<TicketPurchase | undefined>;
  getFreeTicketPurchases(): Promise<any[]>;
  
  // Ticket scan operations
  createTicketScan(ticketScan: InsertTicketScan): Promise<TicketScan>;
  getTicketScansByTicketId(ticketId: number): Promise<TicketScan[]>;
  getTicketScansByOrderId(orderId: number): Promise<TicketScan[]>;
  
  // Discount code operations
  createDiscountCode(discountCode: InsertDiscountCode): Promise<DiscountCode>;
  getDiscountCodeByCode(code: string): Promise<DiscountCode | undefined>;
  
  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getAllOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  
  // Media upload operations
  createMediaUpload(mediaUpload: InsertMediaUpload): Promise<MediaUpload>;
  getMediaUploadsByRelatedEntity(relatedEntityType: string, relatedEntityId: number): Promise<MediaUpload[]>;
  
  // Stripe & PayPal customer operations
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User>;
  updatePaypalCustomerId(userId: number, paypalCustomerId: string): Promise<User>;
  
  // Analytics operations
  createPageView(pageView: InsertPageView): Promise<PageView>;
  getPageViewsByPath(path: string): Promise<PageView[]>;
  getPageViewsByUserId(userId: number): Promise<PageView[]>;
  
  // Event analytics operations
  createEventAnalytic(eventAnalytic: InsertEventAnalytic): Promise<EventAnalytic>;
  getEventAnalyticsByEventId(eventId: number): Promise<EventAnalytic | undefined>;
  incrementEventViews(eventId: number): Promise<EventAnalytic | undefined>;
  incrementEventTicketClicks(eventId: number): Promise<EventAnalytic | undefined>;
  incrementEventTicketSales(eventId: number): Promise<EventAnalytic | undefined>;
  
  // Product analytics operations
  createProductAnalytic(productAnalytic: InsertProductAnalytic): Promise<ProductAnalytic>;
  getProductAnalyticsByProductId(productId: number): Promise<ProductAnalytic | undefined>;
  incrementProductViews(productId: number): Promise<ProductAnalytic | undefined>;
  incrementProductDetailClicks(productId: number): Promise<ProductAnalytic | undefined>;
  incrementProductPurchaseClicks(productId: number): Promise<ProductAnalytic | undefined>;
  
  // User events operations
  createUserEvent(userEvent: InsertUserEvent): Promise<UserEvent>;
  getUserEventsByUserId(userId: number): Promise<UserEvent[]>;
  
  // Daily stats operations
  createDailyStat(dailyStat: InsertDailyStat): Promise<DailyStat>;
  getDailyStatByDate(date: Date): Promise<DailyStat | undefined>;
  updateDailyStat(date: Date, updates: Partial<InsertDailyStat>): Promise<DailyStat | undefined>;
  getDailyStatsByDateRange(startDate: Date, endDate: Date): Promise<DailyStat[]>;
  
  // Inventory management operations
  getProductVariantsByProductId(productId: number): Promise<ProductVariant[]>;
  getProductVariant(id: number): Promise<ProductVariant | undefined>;
  createProductVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  updateProductVariant(id: number, variantData: Partial<InsertProductVariant>): Promise<ProductVariant | undefined>;
  deleteProductVariant(id: number): Promise<boolean>;
  
  // Inventory history operations
  recordInventoryChange(change: InsertInventoryHistory): Promise<InventoryHistory>;
  getInventoryHistoryByProduct(productId: number): Promise<InventoryHistory[]>;
  getInventoryHistoryByVariant(variantId: number): Promise<InventoryHistory[]>;
  getRecentInventoryChanges(limit?: number): Promise<InventoryHistory[]>;
  
  // Inventory management operations
  updateProductStock(productId: number, newStockLevel: number, changeType: string, userId: number, reason?: string): Promise<Product>;
  updateVariantStock(variantId: number, newStockLevel: number, changeType: string, userId: number, reason?: string): Promise<ProductVariant>;
  checkProductAvailability(productId: number, quantity: number): Promise<boolean>;
  checkVariantAvailability(variantId: number, quantity: number): Promise<boolean>;
  getLowStockProducts(threshold?: number): Promise<Product[]>;
  
  // AI Assistant operations
  createAiAssistantConfig(config: InsertAiAssistantConfig): Promise<AiAssistantConfig>;
  getAiAssistantConfigsByUserId(userId: number): Promise<AiAssistantConfig[]>;
  getAiAssistantConfig(id: number): Promise<AiAssistantConfig | undefined>;
  updateAiAssistantConfig(id: number, configData: Partial<InsertAiAssistantConfig>): Promise<AiAssistantConfig | undefined>;
  deleteAiAssistantConfig(id: number): Promise<boolean>;
  
  // AI Chat Session operations
  createAiChatSession(session: InsertAiChatSession): Promise<AiChatSession>;
  getAiChatSessionsByUserId(userId: number): Promise<AiChatSession[]>;
  getAiChatSession(id: number): Promise<AiChatSession | undefined>;
  updateAiChatSession(id: number, sessionData: Partial<InsertAiChatSession>): Promise<AiChatSession | undefined>;
  deleteAiChatSession(id: number): Promise<boolean>;
  
  // AI Chat Message operations
  createAiChatMessage(message: InsertAiChatMessage): Promise<AiChatMessage>;
  getAiChatMessagesBySessionId(sessionId: number): Promise<AiChatMessage[]>;
  getAiChatMessage(id: number): Promise<AiChatMessage | undefined>;
  deleteAiChatMessage(id: number): Promise<boolean>;
  
  // Media Collection operations
  createMediaCollection(collection: InsertMediaCollection): Promise<MediaCollection>;
  getMediaCollection(id: number): Promise<MediaCollection | undefined>;
  getMediaCollectionBySlug(slug: string): Promise<MediaCollection | undefined>;
  getAllMediaCollections(options?: { visibility?: string; isActive?: boolean }): Promise<MediaCollection[]>;
  updateMediaCollection(id: number, collectionData: Partial<InsertMediaCollection>): Promise<MediaCollection | undefined>;
  deleteMediaCollection(id: number): Promise<boolean>;
  
  // Media Asset operations
  createMediaAsset(asset: InsertMediaAsset): Promise<MediaAsset>;
  getMediaAsset(id: number): Promise<MediaAsset | undefined>;
  getMediaAssetsByCollectionId(collectionId: number, options?: { isPublished?: boolean; limit?: number; offset?: number }): Promise<MediaAsset[]>;
  updateMediaAsset(id: number, assetData: Partial<InsertMediaAsset>): Promise<MediaAsset | undefined>;
  deleteMediaAsset(id: number): Promise<boolean>;
  incrementAssetViewCount(id: number): Promise<boolean>;
  
  // Media Access Log operations
  createMediaAccessLog(log: InsertMediaAccessLog): Promise<MediaAccessLog>;
  getMediaAccessLogsByAssetId(assetId: number, limit?: number): Promise<MediaAccessLog[]>;
  getMediaAccessLogsByUserId(userId: number, limit?: number): Promise<MediaAccessLog[]>;
  
  // Music Mix operations
  getMusicMix(id: number): Promise<any | undefined>;
  getAllMusicMixes(): Promise<any[]>;
  getPublishedMusicMixes(): Promise<any[]>;
  createMusicMix(mix: any): Promise<any>;
  updateMusicMix(id: number, mixData: any): Promise<any | undefined>;
  deleteMusicMix(id: number): Promise<boolean>;
  getMusicMixPurchase(userId: number, mixId: number): Promise<any | undefined>;
  createMusicMixPurchase(purchase: any): Promise<any>;
  incrementMusicMixDownloadCount(purchaseId: number): Promise<void>;
  
  // Sponsored Content operations
  getAllSponsoredContent(): Promise<SponsoredContent[]>;
  getActiveSponsoredContent(): Promise<SponsoredContent[]>;
  createSponsoredContent(data: InsertSponsoredContent): Promise<SponsoredContent>;
  updateSponsoredContent(id: number, data: Partial<InsertSponsoredContent>): Promise<SponsoredContent>;
  deleteSponsoredContent(id: number): Promise<void>;
  incrementSponsoredContentClicks(id: number): Promise<void>;
  incrementSponsoredContentViews(id: number): Promise<void>;
  
  // Passport Profile operations
  getPassportProfile(userId: number): Promise<PassportProfile | undefined>;
  getPassportProfileByHandle(handle: string): Promise<PassportProfile | undefined>;
  createPassportProfile(profile: InsertPassportProfile): Promise<PassportProfile>;
  updatePassportProfile(userId: number, data: Partial<InsertPassportProfile>): Promise<PassportProfile | undefined>;
  addPointsToProfile(userId: number, points: number): Promise<PassportProfile | undefined>;
  
  // Passport Stamp operations
  getPassportStamp(id: number): Promise<PassportStamp | undefined>;
  getPassportStampsByUserId(userId: number, limit?: number): Promise<PassportStamp[]>;
  getPassportStampsByEventId(eventId: number): Promise<PassportStamp[]>;
  getPassportStampByUserAndEvent(userId: number, eventId: number): Promise<PassportStamp | undefined>;
  createPassportStamp(stamp: InsertPassportStamp): Promise<PassportStamp>;
  getStampCountByCountry(userId: number, countryCode: string): Promise<number>;
  getStampCountByCarnival(userId: number, carnivalCircuit: string): Promise<number>;
  
  // Passport Tier operations
  getPassportTier(name: string): Promise<PassportTier | undefined>;
  getAllPassportTiers(): Promise<PassportTier[]>;
  createPassportTier(tier: InsertPassportTier): Promise<PassportTier>;
  updatePassportTier(name: string, data: Partial<InsertPassportTier>): Promise<PassportTier | undefined>;
  
  // Passport Reward operations
  getPassportReward(id: number): Promise<PassportReward | undefined>;
  getPassportRewardsByUserId(userId: number, status?: string): Promise<PassportReward[]>;
  createPassportReward(reward: InsertPassportReward): Promise<PassportReward>;
  updatePassportReward(id: number, data: Partial<InsertPassportReward>): Promise<PassportReward | undefined>;
  redeemPassportReward(id: number): Promise<PassportReward | undefined>;
  
  // Passport Mission operations
  getPassportMission(id: number): Promise<PassportMission | undefined>;
  getAllPassportMissions(isActive?: boolean): Promise<PassportMission[]>;
  createPassportMission(mission: InsertPassportMission): Promise<PassportMission>;
  updatePassportMission(id: number, data: Partial<InsertPassportMission>): Promise<PassportMission | undefined>;
  
  // Passport Landing Page operations
  getPassportLandingStats(): Promise<{ totalPassportUsers: number; totalStampsIssued: number }>;
  
  // Promoter operations
  createPromoter(promoter: InsertPromoter): Promise<Promoter>;
  getPromoterByUserId(userId: number): Promise<Promoter | undefined>;
  getPromoter(id: number): Promise<Promoter | undefined>;
  
  // Passport Membership operations
  createPassportMembership(membership: InsertPassportMembership): Promise<PassportMembership>;
  getPassportMembershipByUserId(userId: number): Promise<PassportMembership | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private products: Map<number, Product>;
  private livestreams: Map<number, Livestream>;
  private posts: Map<number, Post>;
  private comments: Map<number, Comment>;
  private chatMessages: Map<number, ChatMessage>;
  private tickets: Map<number, Ticket>;
  private discountCodes: Map<number, DiscountCode>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private mediaUploads: Map<number, MediaUpload>;
  private ticketScans: Map<number, TicketScan>;
  private mediaCollections: Map<number, MediaCollection>;
  private mediaAssets: Map<number, MediaAsset>;
  private mediaAccessLogs: Map<number, MediaAccessLog>;
  private sponsoredContent: Map<number, SponsoredContent>;
  
  private userCurrentId: number;
  private eventCurrentId: number;
  private productCurrentId: number;
  private livestreamCurrentId: number;
  private postCurrentId: number;
  private commentCurrentId: number;
  private chatMessageCurrentId: number;
  private ticketCurrentId: number;
  private discountCodeCurrentId: number;
  private orderCurrentId: number;
  private orderItemCurrentId: number;
  private mediaUploadCurrentId: number;
  private ticketScanCurrentId: number;
  private mediaCollectionCurrentId: number;
  private mediaAssetCurrentId: number;
  private mediaAccessLogCurrentId: number;
  private sponsoredContentCurrentId: number;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.products = new Map();
    this.livestreams = new Map();
    this.posts = new Map();
    this.comments = new Map();
    this.chatMessages = new Map();
    this.tickets = new Map();
    this.discountCodes = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.mediaUploads = new Map();
    this.ticketScans = new Map();
    this.mediaCollections = new Map();
    this.mediaAssets = new Map();
    this.mediaAccessLogs = new Map();
    this.sponsoredContent = new Map();
    
    this.userCurrentId = 1;
    this.eventCurrentId = 1;
    this.productCurrentId = 1;
    this.livestreamCurrentId = 1;
    this.postCurrentId = 1;
    this.commentCurrentId = 1;
    this.chatMessageCurrentId = 1;
    this.ticketCurrentId = 1;
    this.discountCodeCurrentId = 1;
    this.orderCurrentId = 1;
    this.orderItemCurrentId = 1;
    this.mediaUploadCurrentId = 1;
    this.ticketScanCurrentId = 1;
    this.mediaCollectionCurrentId = 1;
    this.mediaAssetCurrentId = 1;
    this.mediaAccessLogCurrentId = 1;
    this.sponsoredContentCurrentId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async getUserByFirebaseId(firebaseId: string): Promise<User | undefined> {
    if (!firebaseId) return undefined;
    return Array.from(this.users.values()).find(
      (user) => user.firebaseId === firebaseId
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      id,
      username: userData.username,
      password: userData.password,
      displayName: userData.displayName || null,
      avatar: userData.avatar || null,
      bio: userData.bio || null,
      location: userData.location || null,
      website: userData.website || null,
      isGuest: userData.isGuest || false,
      role: userData.role || 'user',
      stripeCustomerId: userData.stripeCustomerId || null,
      paypalCustomerId: userData.paypalCustomerId || null,
      email: userData.email || null,
      firebaseId: userData.firebaseId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) {
      return undefined;
    }
    
    // Update user fields
    Object.assign(user, userData);
    user.updatedAt = new Date();
    this.users.set(id, user);
    return user;
  }
  
  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) {
      return undefined;
    }
    
    user.role = role;
    this.users.set(id, user);
    return user;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) {
      return false;
    }
    
    return this.users.delete(id);
  }
  
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    user.stripeCustomerId = stripeCustomerId;
    this.users.set(userId, user);
    return user;
  }
  
  async updatePaypalCustomerId(userId: number, paypalCustomerId: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    user.paypalCustomerId = paypalCustomerId;
    this.users.set(userId, user);
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  
  async updateUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) {
      return undefined;
    }
    
    user.password = newPassword;
    this.users.set(id, user);
    return user;
  }

  async verifyPassword(userId: number, password: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }
    
    // For in-memory storage, we do a simple string comparison
    // In production, this would use bcrypt or similar hashing
    return user.password === password;
  }
  
  // Password reset operations
  async storePasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    console.log(`[MemStorage] Storing password reset token: ${token} for user ${userId}`);
    // In-memory implementation just logs the token (no need to store)
  }
  
  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    console.log(`[MemStorage] Getting password reset token: ${token}`);
    // In-memory implementation doesn't actually store tokens
    return undefined;
  }
  
  async deletePasswordResetToken(token: string): Promise<boolean> {
    console.log(`[MemStorage] Deleting password reset token: ${token}`);
    // In-memory implementation doesn't actually store tokens
    return true;
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getAllEvents(): Promise<Event[]> {
    try {
      console.log("Storage: Getting all events");
      if (!this.events) {
        console.log("Storage: Events map is undefined, returning empty array");
        return [];
      }
      
      const eventsList = Array.from(this.events.values());
      console.log(`Storage: Retrieved ${eventsList.length} events`);
      
      // Log first event for debugging if available
      if (eventsList.length > 0) {
        console.log("Storage: First event sample:", JSON.stringify(eventsList[0]));
      }
      
      return eventsList;
    } catch (error) {
      console.error("Storage: Error in getAllEvents:", error);
      // Return empty array instead of throwing to prevent API errors
      return [];
    }
  }

  async getFeaturedEvents(): Promise<Event[]> {
    try {
      console.log("Storage: Getting featured events (upcoming only)");
      if (!this.events) {
        console.log("Storage: Events map is undefined, returning empty array");
        return [];
      }
      
      const allEvents = Array.from(this.events.values());
      const now = new Date();
      
      const featuredEvents = allEvents.filter(event => {
        if (!event.featured) return false;
        
        try {
          const eventDate = new Date(event.date);
          
          // If we have an end time, use that for comparison
          if (event.endTime) {
            const [hours, minutes] = event.endTime.split(':').map(Number);
            const eventEndDateTime = new Date(eventDate);
            eventEndDateTime.setHours(hours, minutes, 0, 0);
            return eventEndDateTime >= now; // Event is still ongoing or in the future
          }
          
          // If we have a duration and start time, calculate end time
          if (event.duration && event.time) {
            const [hours, minutes] = event.time.split(':').map(Number);
            const eventStartDateTime = new Date(eventDate);
            eventStartDateTime.setHours(hours, minutes, 0, 0);
            const eventEndDateTime = new Date(eventStartDateTime.getTime() + event.duration * 60 * 1000);
            return eventEndDateTime >= now;
          }
          
          // If we have a start time but no end time/duration
          if (event.time) {
            const [hours, minutes] = event.time.split(':').map(Number);
            const eventStartDateTime = new Date(eventDate);
            eventStartDateTime.setHours(hours, minutes, 0, 0);
            // Add 4 hours as default event duration
            const eventEndDateTime = new Date(eventStartDateTime.getTime() + 4 * 60 * 60 * 1000);
            return eventEndDateTime >= now;
          }
          
          // If no time specified, compare just the date
          const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
          const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return eventDateOnly >= todayDateOnly;
        } catch (error) {
          console.error('Storage: Error determining if featured event is upcoming:', error);
          return true; // Default to showing if there's an error
        }
      });
      
      console.log(`Storage: Retrieved ${featuredEvents.length} upcoming featured events out of ${allEvents.length} total events`);
      
      // Log first featured event for debugging if available
      if (featuredEvents.length > 0) {
        console.log("Storage: First upcoming featured event sample:", JSON.stringify(featuredEvents[0]));
      }
      
      return featuredEvents;
    } catch (error) {
      console.error("Storage: Error in getFeaturedEvents:", error);
      // Return empty array instead of throwing to prevent API errors
      return [];
    }
  }
  
  async getUpcomingEvents(): Promise<Event[]> {
    try {
      console.log("Storage: Getting upcoming events");
      const allEvents = await this.getAllEvents();
      const now = new Date();
      
      const upcomingEvents = allEvents.filter(event => {
        try {
          const eventDate = new Date(event.date);
          
          // If we have an end time, use that for comparison
          if (event.endTime) {
            const [hours, minutes] = event.endTime.split(':').map(Number);
            const eventEndDateTime = new Date(eventDate);
            eventEndDateTime.setHours(hours, minutes, 0, 0);
            return eventEndDateTime >= now;
          }
          
          // If we have a duration and start time, calculate end time
          if (event.duration && event.time) {
            const [hours, minutes] = event.time.split(':').map(Number);
            const eventStartDateTime = new Date(eventDate);
            eventStartDateTime.setHours(hours, minutes, 0, 0);
            const eventEndDateTime = new Date(eventStartDateTime.getTime() + event.duration * 60 * 1000);
            return eventEndDateTime >= now;
          }
          
          // If we have a start time but no end time/duration
          if (event.time) {
            const [hours, minutes] = event.time.split(':').map(Number);
            const eventStartDateTime = new Date(eventDate);
            eventStartDateTime.setHours(hours, minutes, 0, 0);
            // Add 4 hours as default event duration
            const eventEndDateTime = new Date(eventStartDateTime.getTime() + 4 * 60 * 60 * 1000);
            return eventEndDateTime >= now;
          }
          
          // If no time specified, compare just the date
          const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
          const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return eventDateOnly >= todayDateOnly;
        } catch (error) {
          console.error('Error determining if event is upcoming:', error);
          return true; // Default to upcoming if there's an error
        }
      });
      
      console.log(`Storage: Retrieved ${upcomingEvents.length} upcoming events`);
      return upcomingEvents;
    } catch (error) {
      console.error("Storage: Error in getUpcomingEvents:", error);
      return [];
    }
  }

  async getPastEvents(): Promise<Event[]> {
    try {
      console.log("Storage: Getting past events");
      const allEvents = await this.getAllEvents();
      const now = new Date();
      
      const pastEvents = allEvents.filter(event => {
        try {
          const eventDate = new Date(event.date);
          
          // If we have an end time, use that for comparison
          if (event.endTime) {
            const [hours, minutes] = event.endTime.split(':').map(Number);
            const eventEndDateTime = new Date(eventDate);
            eventEndDateTime.setHours(hours, minutes, 0, 0);
            return eventEndDateTime < now;
          }
          
          // If we have a duration and start time, calculate end time
          if (event.duration && event.time) {
            const [hours, minutes] = event.time.split(':').map(Number);
            const eventStartDateTime = new Date(eventDate);
            eventStartDateTime.setHours(hours, minutes, 0, 0);
            const eventEndDateTime = new Date(eventStartDateTime.getTime() + event.duration * 60 * 1000);
            return eventEndDateTime < now;
          }
          
          // If we have a start time but no end time/duration
          if (event.time) {
            const [hours, minutes] = event.time.split(':').map(Number);
            const eventStartDateTime = new Date(eventDate);
            eventStartDateTime.setHours(hours, minutes, 0, 0);
            // Add 4 hours as default event duration
            const eventEndDateTime = new Date(eventStartDateTime.getTime() + 4 * 60 * 60 * 1000);
            return eventEndDateTime < now;
          }
          
          // If no time specified, compare just the date
          const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
          const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return eventDateOnly < todayDateOnly;
        } catch (error) {
          console.error('Error determining if event is past:', error);
          return false; // Default to not past if there's an error
        }
      });
      
      console.log(`Storage: Retrieved ${pastEvents.length} past events`);
      return pastEvents;
    } catch (error) {
      console.error("Storage: Error in getPastEvents:", error);
      return [];
    }
  }

  async createEvent(eventData: InsertEvent): Promise<Event> {
    const id = this.eventCurrentId++;
    const event: Event = {
      id,
      title: eventData.title,
      date: eventData.date,
      location: eventData.location,
      price: eventData.price,
      description: eventData.description || null,
      imageUrl: eventData.imageUrl || null,
      category: eventData.category || null,
      featured: eventData.featured || false
    };
    this.events.set(id, event);
    return event;
  }
  
  async updateEvent(id: number, eventData: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = await this.getEvent(id);
    if (!event) {
      return undefined;
    }
    
    const updatedEvent: Event = {
      ...event,
      ...eventData
    };
    
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    try {
      // Check if event exists
      const event = await this.getEvent(id);
      if (!event) {
        console.log(`Event with ID ${id} not found for deletion`);
        return false;
      }
      
      console.log(`Deleting event with ID: ${id}`);
      
      // Store the event in memory before deleting (for undo functionality)
      storeDeletedEvent(event);
      
      // Using db directly since this is a PostgreSQL implementation
      await db.delete(events).where(eq(events.id, id));
      console.log(`Event with ID ${id} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`Error deleting event with ID ${id}:`, error);
      return false;
    }
  }
  
  async getLastDeletedEvent(): Promise<{ event: Event, deletedAt: Date } | null> {
    try {
      // Find the most recently deleted event
      let mostRecentDeletedEvent: { event: Event, deletedAt: Date } | null = null;
      
      deletedEventsStore.forEach((entry) => {
        if (!mostRecentDeletedEvent || entry.deletedAt > mostRecentDeletedEvent.deletedAt) {
          mostRecentDeletedEvent = entry;
        }
      });
      
      return mostRecentDeletedEvent;
    } catch (error) {
      console.error("Error getting last deleted event:", error);
      return null;
    }
  }
  
  async restoreDeletedEvent(id: number): Promise<Event | null> {
    try {
      // Get the deleted event data
      const deletedEventData = deletedEventsStore.get(id);
      if (!deletedEventData) {
        console.log(`No deleted event found with ID ${id} for restoration`);
        return null;
      }
      
      const eventToRestore = deletedEventData.event;
      console.log(`Restoring deleted event: ${eventToRestore.title} (ID: ${id})`);
      
      // Insert the event back into the database with all its original data
      const result = await db.insert(events).values({
        title: eventToRestore.title,
        description: eventToRestore.description,
        date: new Date(eventToRestore.date),
        time: eventToRestore.time,
        endTime: eventToRestore.endTime,
        duration: eventToRestore.duration,
        location: eventToRestore.location,
        imageUrl: eventToRestore.imageUrl,
        category: eventToRestore.category,
        price: eventToRestore.price,
        featured: eventToRestore.featured,
        organizerName: eventToRestore.organizerName,
        organizerEmail: eventToRestore.organizerEmail,
        additionalImages: eventToRestore.additionalImages || [],
        // Set updated timestamps
        createdAt: eventToRestore.createdAt,
        updatedAt: new Date()
      }).returning();
      
      // Remove from deleted events store
      deletedEventsStore.delete(id);
      
      console.log(`Event successfully restored: ${eventToRestore.title} (ID: ${id})`);
      return result[0];
    } catch (error) {
      console.error(`Error restoring deleted event ${id}:`, error);
      return null;
    }
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.featured);
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const id = this.productCurrentId++;
    const product: Product = {
      id,
      title: productData.title,
      price: productData.price,
      description: productData.description || null,
      imageUrl: productData.imageUrl || null,
      category: productData.category || null,
      sizes: productData.sizes || [],
      featured: productData.featured || false,
      etsyUrl: productData.etsyUrl || null
    };
    this.products.set(id, product);
    return product;
  }
  
  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = await this.getProduct(id);
    if (!product) {
      return undefined;
    }
    
    const updatedProduct: Product = {
      ...product,
      ...productData
    };
    
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const product = await this.getProduct(id);
    if (!product) {
      return false;
    }
    
    return this.products.delete(id);
  }

  // Livestream operations
  async getLivestream(id: number): Promise<Livestream | undefined> {
    return this.livestreams.get(id);
  }

  async getAllLivestreams(): Promise<Livestream[]> {
    return Array.from(this.livestreams.values());
  }

  async getCurrentLivestream(): Promise<Livestream | undefined> {
    return Array.from(this.livestreams.values()).find(stream => stream.isLive);
  }

  async getUpcomingLivestreams(): Promise<Livestream[]> {
    const now = new Date();
    return Array.from(this.livestreams.values())
      .filter(stream => !stream.isLive && new Date(stream.streamDate) > now)
      .sort((a, b) => new Date(a.streamDate).getTime() - new Date(b.streamDate).getTime());
  }

  async createLivestream(livestreamData: InsertLivestream): Promise<Livestream> {
    const id = this.livestreamCurrentId++;
    const now = new Date();
    const livestream: Livestream = {
      id,
      title: livestreamData.title,
      streamDate: livestreamData.streamDate,
      description: livestreamData.description || null,
      thumbnailUrl: livestreamData.thumbnailUrl || null,
      isLive: livestreamData.isLive || false,
      hostName: livestreamData.hostName || null,
      platform: livestreamData.platform || 'custom',
      youtubeUrl: livestreamData.youtubeUrl || null,
      twitchChannel: livestreamData.twitchChannel || null,
      instagramUsername: livestreamData.instagramUsername || null,
      facebookUrl: livestreamData.facebookUrl || null,
      tiktokUsername: livestreamData.tiktokUsername || null,
      customStreamUrl: livestreamData.customStreamUrl || null,
      embedCode: livestreamData.embedCode || null,
      streamUrl: livestreamData.streamUrl || null,
      createdAt: now,
      updatedAt: now
    };
    this.livestreams.set(id, livestream);
    return livestream;
  }
  
  async updateLivestream(id: number, updates: Partial<Livestream>): Promise<Livestream | null> {
    const existingLivestream = await this.getLivestream(id);
    
    if (!existingLivestream) {
      return null;
    }
    
    const updatedLivestream: Livestream = {
      ...existingLivestream,
      ...updates,
      updatedAt: new Date()
    };
    
    this.livestreams.set(id, updatedLivestream);
    return updatedLivestream;
  }
  
  async deleteLivestream(id: number): Promise<boolean> {
    return this.livestreams.delete(id);
  }

  // Post operations
  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async getAllPosts(): Promise<Post[]> {
    return Array.from(this.posts.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createPost(postData: InsertPost): Promise<Post> {
    const id = this.postCurrentId++;
    const createdAt = new Date();
    const post: Post = { 
      id, 
      userId: postData.userId,
      content: postData.content || null,
      mediaUrl: postData.mediaUrl || null,
      createdAt,
      likes: 0,
      comments: 0 
    };
    this.posts.set(id, post);
    return post;
  }

  // Comment operations
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const id = this.commentCurrentId++;
    const createdAt = new Date();
    const comment: Comment = { ...commentData, id, createdAt };
    this.comments.set(id, comment);
    
    // Update comment count on post
    const post = await this.getPost(commentData.postId);
    if (post) {
      post.comments = (post.comments || 0) + 1;
      this.posts.set(post.id, post);
    }
    
    return comment;
  }

  // Chat operations
  async getChatMessagesByLivestreamId(livestreamId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.livestreamId === livestreamId)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  }

  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageCurrentId++;
    const createdAt = new Date();
    
    // Find the user to include user details in the chat message
    const user = await this.getUser(messageData.userId);
    
    if (!user) {
      throw new Error(`User with ID ${messageData.userId} not found`);
    }
    
    const chatMessage: ChatMessage = {
      id,
      userId: messageData.userId,
      content: messageData.content,
      livestreamId: messageData.livestreamId || null,
      createdAt,
      user: {
        id: user.id,
        displayName: user.displayName || 'Anonymous',
        avatar: user.avatar || null
      }
    };
    
    this.chatMessages.set(id, chatMessage);
    return chatMessage;
  }
  
  // Ticket operations
  async getTicket(id: number): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }
  
  async getAllTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values());
  }
  
  async updateTicket(id: number, ticketData: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const ticket = await this.getTicket(id);
    if (!ticket) {
      return undefined;
    }
    
    // Handle date fields
    const dateFields = ['salesStartDate', 'salesEndDate', 'sales_start_date', 'sales_end_date', 'createdAt', 'updatedAt'];
    const cleanedData = { ...ticketData };
    
    // Clean date fields
    for (const field of dateFields) {
      if (field in cleanedData) {
        // If it's an empty string, make it null
        if (cleanedData[field] === '') {
          cleanedData[field] = null;
        }
        // If it's a string but not empty, try to parse it as a date
        else if (typeof cleanedData[field] === 'string' && cleanedData[field]) {
          try {
            cleanedData[field] = new Date(cleanedData[field]);
          } catch (e) {
            console.warn(`Failed to parse date for field ${field}:`, cleanedData[field]);
            cleanedData[field] = null;
          }
        }
      }
    }
    
    // Force updatedAt to be a valid Date
    cleanedData.updatedAt = new Date();
    
    const updatedTicket: Ticket = {
      ...ticket,
      ...cleanedData
    };
    
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }
  
  async createTicket(ticketData: InsertTicket): Promise<Ticket> {
    const id = this.ticketCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    // Ensure remainingQuantity is set if not provided
    if (ticketData.remainingQuantity === undefined) {
      ticketData.remainingQuantity = ticketData.quantity;
    }
    
    const ticket: Ticket = { 
      ...ticketData,
      id,
      createdAt,
      updatedAt
    };
    this.tickets.set(id, ticket);
    return ticket;
  }
  
  async getTicketsByEventId(eventId: number): Promise<Ticket[]> {
    return Array.from(this.tickets.values())
      .filter(ticket => ticket.eventId === eventId);
  }
  
  // Ticket scan operations
  async createTicketScan(ticketScanData: InsertTicketScan): Promise<TicketScan> {
    const id = this.ticketScanCurrentId++;
    const createdAt = new Date();
    const updatedAt = createdAt;
    
    const ticketScan: TicketScan = {
      id,
      ticketId: ticketScanData.ticketId,
      orderId: ticketScanData.orderId,
      scannedAt: ticketScanData.scannedAt || createdAt,
      scannedBy: ticketScanData.scannedBy || null,
      status: ticketScanData.status || 'valid',
      notes: ticketScanData.notes || null,
      createdAt,
      updatedAt
    };
    
    this.ticketScans.set(id, ticketScan);
    return ticketScan;
  }
  
  async getTicketScansByTicketId(ticketId: number): Promise<TicketScan[]> {
    return Array.from(this.ticketScans.values())
      .filter(scan => scan.ticketId === ticketId)
      .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
  }
  
  async getTicketScansByOrderId(orderId: number): Promise<TicketScan[]> {
    return Array.from(this.ticketScans.values())
      .filter(scan => scan.orderId === orderId)
      .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
  }
  
  // Discount code operations
  async createDiscountCode(discountCodeData: InsertDiscountCode): Promise<DiscountCode> {
    const id = this.discountCodeCurrentId++;
    const createdAt = new Date();
    const discountCode: DiscountCode = { 
      ...discountCodeData,
      id,
      createdAt,
      isActive: true,
      usageCount: 0
    };
    this.discountCodes.set(id, discountCode);
    return discountCode;
  }
  
  async getDiscountCodeByCode(code: string): Promise<DiscountCode | undefined> {
    return Array.from(this.discountCodes.values())
      .find(discount => discount.code === code && discount.isActive);
  }
  
  // Order operations
  async createOrder(orderData: InsertOrder): Promise<Order> {
    const id = this.orderCurrentId++;
    const createdAt = new Date();
    const order: Order = { 
      ...orderData,
      id,
      createdAt,
      status: 'processing'
    };
    this.orders.set(id, order);
    return order;
  }
  
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  async getOrderById(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  // Media upload operations
  async createMediaUpload(mediaUploadData: InsertMediaUpload): Promise<MediaUpload> {
    const id = this.mediaUploadCurrentId++;
    const createdAt = new Date();
    const mediaUpload: MediaUpload = { 
      ...mediaUploadData,
      id,
      createdAt
    };
    this.mediaUploads.set(id, mediaUpload);
    return mediaUpload;
  }
  
  async getMediaUploadsByRelatedEntity(relatedEntityType: string, relatedEntityId: number): Promise<MediaUpload[]> {
    return Array.from(this.mediaUploads.values())
      .filter(upload => upload.relatedEntityType === relatedEntityType && upload.relatedEntityId === relatedEntityId);
  }

  // Analytics methods for MemStorage
  private pageViews: Map<number, PageView>;
  private eventAnalytics: Map<number, EventAnalytic>;
  private productAnalytics: Map<number, ProductAnalytic>;
  private userEvents: Map<number, UserEvent>;
  private dailyStats: Map<number, DailyStat>;
  
  private pageViewCurrentId: number;
  private eventAnalyticCurrentId: number;
  private productAnalyticCurrentId: number;
  private userEventCurrentId: number;
  private dailyStatCurrentId: number;
  
  // Page Views
  async createPageView(pageViewData: InsertPageView): Promise<PageView> {
    const id = this.pageViewCurrentId++;
    const pageView: PageView = {
      id,
      ...pageViewData,
      timestamp: new Date()
    };
    this.pageViews.set(id, pageView);
    return pageView;
  }
  
  async getPageViewsByPath(path: string): Promise<PageView[]> {
    return Array.from(this.pageViews.values())
      .filter(view => view.path === path)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async getPageViewsByUserId(userId: number): Promise<PageView[]> {
    return Array.from(this.pageViews.values())
      .filter(view => view.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  // Event Analytics
  async createEventAnalytic(eventAnalyticData: InsertEventAnalytic): Promise<EventAnalytic> {
    const id = this.eventAnalyticCurrentId++;
    const eventAnalytic: EventAnalytic = {
      id,
      ...eventAnalyticData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.eventAnalytics.set(id, eventAnalytic);
    return eventAnalytic;
  }
  
  async getEventAnalyticsByEventId(eventId: number): Promise<EventAnalytic | undefined> {
    return Array.from(this.eventAnalytics.values())
      .find(analytic => analytic.eventId === eventId);
  }
  
  async incrementEventViews(eventId: number): Promise<EventAnalytic | undefined> {
    const existing = await this.getEventAnalyticsByEventId(eventId);
    
    if (existing) {
      existing.views += 1;
      existing.updatedAt = new Date();
      this.eventAnalytics.set(existing.id, existing);
      return existing;
    } else {
      return await this.createEventAnalytic({
        eventId,
        views: 1,
        ticketClicks: 0,
        ticketSales: 0
      });
    }
  }
  
  async incrementEventTicketClicks(eventId: number): Promise<EventAnalytic | undefined> {
    const existing = await this.getEventAnalyticsByEventId(eventId);
    
    if (existing) {
      existing.ticketClicks += 1;
      existing.updatedAt = new Date();
      this.eventAnalytics.set(existing.id, existing);
      return existing;
    } else {
      return await this.createEventAnalytic({
        eventId,
        views: 0,
        ticketClicks: 1,
        ticketSales: 0
      });
    }
  }
  
  async incrementEventTicketSales(eventId: number): Promise<EventAnalytic | undefined> {
    const existing = await this.getEventAnalyticsByEventId(eventId);
    
    if (existing) {
      existing.ticketSales += 1;
      existing.updatedAt = new Date();
      this.eventAnalytics.set(existing.id, existing);
      return existing;
    } else {
      return await this.createEventAnalytic({
        eventId,
        views: 0,
        ticketClicks: 0,
        ticketSales: 1
      });
    }
  }
  
  // Product Analytics
  async createProductAnalytic(productAnalyticData: InsertProductAnalytic): Promise<ProductAnalytic> {
    const id = this.productAnalyticCurrentId++;
    const productAnalytic: ProductAnalytic = {
      id,
      ...productAnalyticData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.productAnalytics.set(id, productAnalytic);
    return productAnalytic;
  }
  
  async getProductAnalyticsByProductId(productId: number): Promise<ProductAnalytic | undefined> {
    return Array.from(this.productAnalytics.values())
      .find(analytic => analytic.productId === productId);
  }
  
  async incrementProductViews(productId: number): Promise<ProductAnalytic | undefined> {
    const existing = await this.getProductAnalyticsByProductId(productId);
    
    if (existing) {
      existing.views += 1;
      existing.updatedAt = new Date();
      this.productAnalytics.set(existing.id, existing);
      return existing;
    } else {
      return await this.createProductAnalytic({
        productId,
        views: 1,
        detailClicks: 0,
        purchaseClicks: 0
      });
    }
  }
  
  async incrementProductDetailClicks(productId: number): Promise<ProductAnalytic | undefined> {
    const existing = await this.getProductAnalyticsByProductId(productId);
    
    if (existing) {
      existing.detailClicks += 1;
      existing.updatedAt = new Date();
      this.productAnalytics.set(existing.id, existing);
      return existing;
    } else {
      return await this.createProductAnalytic({
        productId,
        views: 0,
        detailClicks: 1,
        purchaseClicks: 0
      });
    }
  }
  
  async incrementProductPurchaseClicks(productId: number): Promise<ProductAnalytic | undefined> {
    const existing = await this.getProductAnalyticsByProductId(productId);
    
    if (existing) {
      existing.purchaseClicks += 1;
      existing.updatedAt = new Date();
      this.productAnalytics.set(existing.id, existing);
      return existing;
    } else {
      return await this.createProductAnalytic({
        productId,
        views: 0,
        detailClicks: 0,
        purchaseClicks: 1
      });
    }
  }
  
  // User Events
  async createUserEvent(userEventData: InsertUserEvent): Promise<UserEvent> {
    const id = this.userEventCurrentId++;
    const userEvent: UserEvent = {
      id,
      ...userEventData,
      timestamp: new Date()
    };
    this.userEvents.set(id, userEvent);
    return userEvent;
  }
  
  async getUserEventsByUserId(userId: number): Promise<UserEvent[]> {
    return Array.from(this.userEvents.values())
      .filter(event => event.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  // Daily Stats
  async createDailyStat(dailyStatData: InsertDailyStat): Promise<DailyStat> {
    const id = this.dailyStatCurrentId++;
    const dailyStat: DailyStat = {
      id,
      ...dailyStatData
    };
    this.dailyStats.set(id, dailyStat);
    return dailyStat;
  }
  
  async getDailyStatByDate(date: Date): Promise<DailyStat | undefined> {
    const dateStr = date.toISOString().split('T')[0];
    return Array.from(this.dailyStats.values())
      .find(stat => stat.date.toISOString().split('T')[0] === dateStr);
  }
  
  async updateDailyStat(date: Date, updates: Partial<InsertDailyStat>): Promise<DailyStat | undefined> {
    const stat = await this.getDailyStatByDate(date);
    
    if (!stat) {
      return undefined;
    }
    
    const updatedStat: DailyStat = {
      ...stat,
      ...updates
    };
    
    this.dailyStats.set(stat.id, updatedStat);
    return updatedStat;
  }
  
  async getDailyStatsByDateRange(startDate: Date, endDate: Date): Promise<DailyStat[]> {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    return Array.from(this.dailyStats.values())
      .filter(stat => {
        const statTime = stat.date.getTime();
        return statTime >= startTime && statTime <= endTime;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  // Initialize with sample data
  private initializeSampleData(): void {
    // Initialize analytics maps
    this.pageViews = new Map();
    this.eventAnalytics = new Map();
    this.productAnalytics = new Map();
    this.userEvents = new Map();
    this.dailyStats = new Map();
    
    this.pageViewCurrentId = 1;
    this.eventAnalyticCurrentId = 1;
    this.productAnalyticCurrentId = 1;
    this.userEventCurrentId = 1;
    this.dailyStatCurrentId = 1;
    
    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      displayName: "Admin",
      avatar: "https://i.pravatar.cc/150?img=1",
      isGuest: false
    });

    // No mock events will be created - real events will be added through the admin interface
    const eventData: InsertEvent[] = [];

    eventData.forEach(event => this.createEvent(event));

    // Create products
    const productData: InsertProduct[] = [
      {
        title: "Festival T-Shirt",
        description: "Show your Savage Gentlemen spirit with our exclusive festival t-shirt.",
        price: 2999, // $29.99
        imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27",
        category: "t-shirts",
        sizes: ["S", "M", "L", "XL"],
        featured: true,
        etsyUrl: "https://www.etsy.com/shop/savagegentlemen"
      },
      {
        title: "SG Signature Cap",
        description: "Our classic signature cap with the Savage Gentlemen logo.",
        price: 2499, // $24.99
        imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b",
        category: "hats",
        sizes: ["One Size"],
        featured: true,
        etsyUrl: "https://www.etsy.com/shop/savagegentlemen"
      },
      {
        title: "Caribbean Pride Hoodie",
        description: "Stay warm while showing your Caribbean pride with our premium hoodie.",
        price: 4999, // $49.99
        imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633",
        category: "hoodies",
        sizes: ["M", "L", "XL", "XXL"],
        featured: true,
        etsyUrl: "https://www.etsy.com/shop/savagegentlemen"
      },
      {
        title: "Caribbean Vibes T-Shirt",
        description: "Our bestselling Caribbean Vibes t-shirt with vibrant design.",
        price: 2999, // $29.99
        imageUrl: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990",
        category: "t-shirts",
        sizes: ["S", "M", "L", "XL"],
        featured: false,
        etsyUrl: "https://www.etsy.com/shop/savagegentlemen"
      },
      {
        title: "Festival Hoodie",
        description: "Get ready for festival season with our comfortable festival hoodie.",
        price: 5499, // $54.99
        imageUrl: "https://pixabay.com/get/g28b5cafc339cc5f16e65f521848908ff9a5ffc6df084471a361439d3b18d7a60e692fe8a5afd3ffa1b9cf9a10702e04347375d55b8c22a98a716a3b2cf0af354_1280.jpg",
        category: "hoodies",
        sizes: ["M", "L", "XL"],
        featured: false,
        etsyUrl: "https://www.etsy.com/shop/savagegentlemen"
      },
      {
        title: "Savage Snapback",
        description: "Our premium snapback hat with embroidered Savage Gentlemen logo.",
        price: 2499, // $24.99
        imageUrl: "https://images.unsplash.com/photo-1576063945564-e8a1380e7148",
        category: "hats",
        sizes: ["One Size"],
        featured: false,
        etsyUrl: "https://www.etsy.com/shop/savagegentlemen"
      },
      {
        title: "Soca SG Music Denim Hat",
        description: "Custom embroidered denim hat featuring Soca SG Music design.",
        price: 3499, // $34.99
        imageUrl: "https://i.etsystatic.com/17162514/r/il/d48c3e/5876583399/il_794xN.5876583399_5zzi.jpg",
        category: "hats",
        sizes: ["One Size"],
        featured: true,
        etsyUrl: "https://www.etsy.com/listing/4298475457/soca-sg-music-custom-embroidered-denim"
      },
      {
        title: "Summer Tank Top",
        description: "Perfect for those hot summer days and Caribbean festivals.",
        price: 1999, // $19.99
        imageUrl: "https://pixabay.com/get/g0284d247154d9111ca4d4ad133e467d0ccd4325eb09868b5f9852dcc899e17f1dbb60fdccfc10ddfce7cc25e6af7ed70623283e313fb282eeedb13d4f48bd4e3_1280.jpg",
        category: "t-shirts",
        sizes: ["S", "M", "L"],
        featured: false,
        etsyUrl: "https://www.etsy.com/shop/savagegentlemen"
      }
    ];

    productData.forEach(product => this.createProduct(product));

    // Create livestreams
    const livestreamData: InsertLivestream[] = [
      {
        title: "Miami Carnival Prep",
        description: "Get ready for Miami Carnival with DJ Savage",
        streamDate: new Date(),
        thumbnailUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
        isLive: true,
        streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCqVDpXKLmKeBU_yyt_QkItQ",
        hostName: "DJ Savage"
      },
      {
        title: "DJ Session with DJ Marcus",
        description: "Join DJ Marcus for some hot Caribbean beats",
        streamDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        thumbnailUrl: "https://pixabay.com/get/g797e6b0cd8b66982536b8208e802291ab77b31b44f8ddc03f4538d2870360a367093182e6d90e27c8650f2fbfa0f4fa07c34d0558f837d3ca9d984e4171876b7_1280.jpg",
        isLive: false,
        streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCqVDpXKLmKeBU_yyt_QkItQ",
        hostName: "DJ Marcus"
      },
      {
        title: "Soca Dance Workshop",
        description: "Learn the hottest Soca dance moves",
        streamDate: new Date("2023-08-15T18:00:00"),
        thumbnailUrl: "https://images.unsplash.com/photo-1547153760-18fc86324498",
        isLive: false,
        streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCqVDpXKLmKeBU_yyt_QkItQ",
        hostName: "Tanya K"
      },
      {
        title: "Live Band Session",
        description: "Live Caribbean music session with Island Vibes band",
        streamDate: new Date("2023-08-20T21:00:00"),
        thumbnailUrl: "https://images.unsplash.com/photo-1525130413817-d45c1d127c42",
        isLive: false,
        streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCqVDpXKLmKeBU_yyt_QkItQ",
        hostName: "Island Vibes Band"
      }
    ];

    livestreamData.forEach(livestream => this.createLivestream(livestream));

    // Create some users for posts
    const users = [
      {
        username: "marcus_j",
        password: "password123",
        displayName: "Marcus J.",
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61",
        isGuest: false
      },
      {
        username: "sophia_j",
        password: "password123",
        displayName: "Sophia J.",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        isGuest: false
      },
      {
        username: "michael_t",
        password: "password123",
        displayName: "Michael T.",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        isGuest: false
      }
    ];

    const userIds: number[] = [];
    for (const userData of users) {
      this.createUser(userData).then(user => userIds.push(user.id));
    }

    // Create posts after users
    setTimeout(() => {
      if (userIds.length > 0) {
        const postsData: InsertPost[] = [
          {
            userId: userIds[0],
            content: "Last night's event was 🔥! Can't wait for the next one! #SavageVibes",
            mediaUrl: "https://pixabay.com/get/g1ab8b5ddc0e3cee8b292d61a62433c8d23dac1d854c30210ba01964f813ceaff4acd3f525b48eeacb8359a4c5cf1efb76e8de18a66cafb8db8214e255531a9bc_1280.jpg"
          },
          {
            userId: userIds[1],
            content: "Just received my new Savage Gentlemen hoodie and I'm obsessed! The quality is amazing 🔥 #SGMerch",
            mediaUrl: "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e"
          },
          {
            userId: userIds[2],
            content: "Just got my tickets for the Caribbean Festival! Who else is going? #SavageGentlemen #CaribbeanFest",
            mediaUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2"
          }
        ];

        postsData.forEach(postData => this.createPost(postData));
      }
    }, 100);
  }

  // Media Collection operations
  async createMediaCollection(collectionData: InsertMediaCollection): Promise<MediaCollection> {
    const id = this.mediaCollectionCurrentId++;
    const collection: MediaCollection = {
      id,
      slug: collectionData.slug,
      title: collectionData.title,
      description: collectionData.description || null,
      visibility: collectionData.visibility || 'public',
      displayOrder: collectionData.displayOrder || 0,
      thumbnailUrl: collectionData.thumbnailUrl || null,
      isActive: collectionData.isActive ?? true,
      createdBy: collectionData.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.mediaCollections.set(id, collection);
    return collection;
  }

  async getMediaCollection(id: number): Promise<MediaCollection | undefined> {
    return this.mediaCollections.get(id);
  }

  async getMediaCollectionBySlug(slug: string): Promise<MediaCollection | undefined> {
    return Array.from(this.mediaCollections.values()).find(
      (collection) => collection.slug === slug
    );
  }

  async getAllMediaCollections(options?: { visibility?: string; isActive?: boolean }): Promise<MediaCollection[]> {
    let collections = Array.from(this.mediaCollections.values());
    
    if (options?.visibility) {
      collections = collections.filter(c => c.visibility === options.visibility);
    }
    
    if (options?.isActive !== undefined) {
      collections = collections.filter(c => c.isActive === options.isActive);
    }
    
    return collections.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async updateMediaCollection(id: number, collectionData: Partial<InsertMediaCollection>): Promise<MediaCollection | undefined> {
    const collection = this.mediaCollections.get(id);
    if (!collection) return undefined;
    
    Object.assign(collection, collectionData, { updatedAt: new Date() });
    this.mediaCollections.set(id, collection);
    return collection;
  }

  async deleteMediaCollection(id: number): Promise<boolean> {
    // First, get all assets in this collection to delete their access logs
    const assetsToDelete = Array.from(this.mediaAssets.values()).filter(
      asset => asset.collectionId === id
    );
    
    // Delete all access logs for assets in this collection
    for (const asset of assetsToDelete) {
      const logsToDelete = Array.from(this.mediaAccessLogs.entries()).filter(
        ([, log]) => log.assetId === asset.id
      );
      logsToDelete.forEach(([logId]) => this.mediaAccessLogs.delete(logId));
    }
    
    // Delete all assets in this collection
    const assetEntries = Array.from(this.mediaAssets.entries()).filter(
      ([, asset]) => asset.collectionId === id
    );
    assetEntries.forEach(([assetId]) => this.mediaAssets.delete(assetId));
    
    // Finally, delete the collection
    return this.mediaCollections.delete(id);
  }

  // Media Asset operations
  async createMediaAsset(assetData: InsertMediaAsset): Promise<MediaAsset> {
    const id = this.mediaAssetCurrentId++;
    const asset: MediaAsset = {
      id,
      collectionId: assetData.collectionId,
      type: assetData.type,
      title: assetData.title,
      description: assetData.description || null,
      storageKey: assetData.storageKey,
      originalFilename: assetData.originalFilename,
      fileSize: assetData.fileSize,
      mimeType: assetData.mimeType,
      duration: assetData.duration || null,
      dimensions: assetData.dimensions || null,
      transcodedVariants: assetData.transcodedVariants || {},
      displayOrder: assetData.displayOrder || 0,
      isPublished: assetData.isPublished ?? false,
      watermarkEnabled: assetData.watermarkEnabled ?? true,
      downloadProtected: assetData.downloadProtected ?? true,
      viewCount: 0,
      lastViewedAt: null,
      createdBy: assetData.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.mediaAssets.set(id, asset);
    return asset;
  }

  async getMediaAsset(id: number): Promise<MediaAsset | undefined> {
    const asset = this.mediaAssets.get(id);
    if (!asset) return undefined;
    
    // Add URL fields for frontend display
    return {
      ...asset,
      url: `/uploads/${asset.storageKey}`,
      thumbnailUrl: `/uploads/${asset.storageKey}` // Use same URL for thumbnail for now
    } as MediaAsset & { url: string; thumbnailUrl: string };
  }

  async getMediaAssetsByCollectionId(collectionId: number, options?: { isPublished?: boolean; limit?: number; offset?: number }): Promise<MediaAsset[]> {
    let assets = Array.from(this.mediaAssets.values()).filter(
      asset => asset.collectionId === collectionId
    );
    
    if (options?.isPublished !== undefined) {
      assets = assets.filter(asset => asset.isPublished === options.isPublished);
    }
    
    assets.sort((a, b) => a.displayOrder - b.displayOrder);
    
    if (options?.offset) {
      assets = assets.slice(options.offset);
    }
    
    if (options?.limit) {
      assets = assets.slice(0, options.limit);
    }
    
    // Add URL fields for frontend display
    return assets.map(asset => ({
      ...asset,
      url: `/uploads/${asset.storageKey}`,
      thumbnailUrl: `/uploads/${asset.storageKey}` // Use same URL for thumbnail for now
    })) as (MediaAsset & { url: string; thumbnailUrl: string })[];
  }

  async updateMediaAsset(id: number, assetData: Partial<InsertMediaAsset>): Promise<MediaAsset | undefined> {
    const asset = this.mediaAssets.get(id);
    if (!asset) return undefined;
    
    Object.assign(asset, assetData, { updatedAt: new Date() });
    this.mediaAssets.set(id, asset);
    return asset;
  }

  async deleteMediaAsset(id: number): Promise<boolean> {
    // Delete all access logs for this asset
    const logsToDelete = Array.from(this.mediaAccessLogs.entries()).filter(
      ([, log]) => log.assetId === id
    );
    logsToDelete.forEach(([logId]) => this.mediaAccessLogs.delete(logId));
    
    // Delete the asset
    return this.mediaAssets.delete(id);
  }

  async incrementAssetViewCount(id: number): Promise<boolean> {
    const asset = this.mediaAssets.get(id);
    if (!asset) return false;
    
    asset.viewCount = (asset.viewCount || 0) + 1;
    asset.lastViewedAt = new Date();
    this.mediaAssets.set(id, asset);
    return true;
  }

  // Media Access Log operations
  async createMediaAccessLog(logData: InsertMediaAccessLog): Promise<MediaAccessLog> {
    const id = this.mediaAccessLogCurrentId++;
    const log: MediaAccessLog = {
      id,
      assetId: logData.assetId,
      userId: logData.userId || null,
      accessType: logData.accessType,
      userAgent: logData.userAgent || null,
      ipAddress: logData.ipAddress || null,
      success: logData.success ?? true,
      failureReason: logData.failureReason || null,
      accessedAt: new Date(),
    };
    this.mediaAccessLogs.set(id, log);
    return log;
  }

  async getMediaAccessLogsByAssetId(assetId: number, limit?: number): Promise<MediaAccessLog[]> {
    let logs = Array.from(this.mediaAccessLogs.values()).filter(
      log => log.assetId === assetId
    );
    logs.sort((a, b) => b.accessedAt.getTime() - a.accessedAt.getTime());
    
    if (limit) {
      logs = logs.slice(0, limit);
    }
    
    return logs;
  }

  async getMediaAccessLogsByUserId(userId: number, limit?: number): Promise<MediaAccessLog[]> {
    let logs = Array.from(this.mediaAccessLogs.values()).filter(
      log => log.userId === userId
    );
    logs.sort((a, b) => b.accessedAt.getTime() - a.accessedAt.getTime());
    
    if (limit) {
      logs = logs.slice(0, limit);
    }
    
    return logs;
  }

  // Sponsored Content Management
  async getAllSponsoredContent(): Promise<SponsoredContent[]> {
    return Array.from(this.sponsoredContent.values())
      .sort((a, b) => (b.priority || 0) - (a.priority || 0) || b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getActiveSponsoredContent(): Promise<SponsoredContent[]> {
    const now = new Date();
    return Array.from(this.sponsoredContent.values())
      .filter(content => {
        if (!content.isActive) return false;
        if (content.startDate && content.startDate > now) return false;
        if (content.endDate && content.endDate < now) return false;
        return true;
      })
      .sort((a, b) => (b.priority || 0) - (a.priority || 0) || b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createSponsoredContent(data: InsertSponsoredContent): Promise<SponsoredContent> {
    const id = this.sponsoredContentCurrentId++;
    const content: SponsoredContent = {
      id,
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl || null,
      linkUrl: data.linkUrl || null,
      priority: data.priority || 0,
      isActive: data.isActive ?? true,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      targetAudience: data.targetAudience || null,
      clicks: 0,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sponsoredContent.set(id, content);
    return content;
  }

  async updateSponsoredContent(id: number, data: Partial<InsertSponsoredContent>): Promise<SponsoredContent> {
    const content = this.sponsoredContent.get(id);
    if (!content) {
      throw new Error(`Sponsored content with id ${id} not found`);
    }
    
    Object.assign(content, data, { updatedAt: new Date() });
    this.sponsoredContent.set(id, content);
    return content;
  }

  async deleteSponsoredContent(id: number): Promise<void> {
    this.sponsoredContent.delete(id);
  }

  async incrementSponsoredContentClicks(id: number): Promise<void> {
    const content = this.sponsoredContent.get(id);
    if (content) {
      content.clicks = (content.clicks || 0) + 1;
      content.updatedAt = new Date();
      this.sponsoredContent.set(id, content);
    }
  }

  async incrementSponsoredContentViews(id: number): Promise<void> {
    const content = this.sponsoredContent.get(id);
    if (content) {
      content.views = (content.views || 0) + 1;
      content.updatedAt = new Date();
      this.sponsoredContent.set(id, content);
    }
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }
  
  async getUserByFirebaseId(firebaseId: string): Promise<User | undefined> {
    if (!firebaseId) return undefined;
    
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.firebaseId, firebaseId));
      
      console.log("Found user by Firebase ID:", firebaseId, user?.id || "none");
      return user;
    } catch (error) {
      console.error("Error finding user by Firebase ID:", error);
      return undefined;
    }
  }
  


  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        password: newPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async verifyPassword(userId: number, password: string): Promise<boolean> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) {
        return false;
      }
      
      // For now, we do a simple string comparison
      // In production, this would use bcrypt to compare hashed passwords
      return user.password === password;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }
  
  // Password reset operations
  async storePasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    await db
      .insert(passwordResetTokens)
      .values({
        userId,
        token,
        expiresAt,
        createdAt: new Date()
      });
  }
  
  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
      
    return resetToken;
  }
  
  async deletePasswordResetToken(token: string): Promise<boolean> {
    const result = await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
      
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  // Verify and scan a ticket
  async scanTicket(ticketIdentifier: string, scannedBy: number = 1): Promise<{ 
    valid: boolean; 
    ticketInfo?: any; 
    error?: string;
    alreadyScanned?: boolean;
    scannedAt?: Date;
  }> {
    try {
      console.log(`Processing ticket scan for code: ${ticketIdentifier}`);
      
      // Parse the ticket identifier
      // Support multiple formats:
      // 1. New format: EVENT-{eventId}-ORDER-{orderId}-{timestamp}
      // 2. Manual format: EVENT-{eventId}-ORDER-MANUAL-{timestamp}
      // 3. Legacy format: SGX-TIX-{ticketId}-{orderId}
      const parts = ticketIdentifier.split('-');
      
      let isValidFormat = false;
      let ticketPurchase = null;
      
      if (parts.length >= 4) {
        // Check for EVENT-X-ORDER format
        if (parts[0] === 'EVENT' && parts[2] === 'ORDER') {
          isValidFormat = true;
          console.log(`Processing EVENT format QR code: ${ticketIdentifier}`);
          
          // Look up ticket by QR code data directly
          ticketPurchase = await this.getTicketPurchaseByQrCodeData(ticketIdentifier);
          if (!ticketPurchase) {
            console.log(`No ticket purchase found for QR code: ${ticketIdentifier}`);
            return {
              valid: false,
              error: 'Ticket not found in our system.'
            };
          }
        }
        // Check for legacy SGX-TIX format
        else if (parts.length === 4 && parts[0] === 'SGX' && parts[1] === 'TIX') {
          isValidFormat = true;
          console.log(`Processing legacy SGX format QR code: ${ticketIdentifier}`);
          
          const ticketId = parseInt(parts[2]);
          const orderId = parseInt(parts[3]);
          
          if (isNaN(ticketId) || isNaN(orderId)) {
            console.log(`Invalid ticket or order ID: ticketId=${parts[2]}, orderId=${parts[3]}`);
            return {
              valid: false,
              error: 'Invalid ticket identifier. Ticket ID and Order ID must be numbers.'
            };
          }
          
          // For legacy format, look up by ticket/order IDs
          ticketPurchase = await this.getTicketPurchaseByIds(ticketId, orderId);
          if (!ticketPurchase) {
            console.log(`No ticket purchase found for ticketId=${ticketId}, orderId=${orderId}`);
            return {
              valid: false,
              error: 'Ticket not found in our system.'
            };
          }
        }
      }
      
      if (!isValidFormat) {
        console.log(`Invalid ticket format: ${ticketIdentifier}`);
        return {
          valid: false,
          error: 'Invalid ticket format. Expected: EVENT-{eventId}-ORDER-{orderId}-{timestamp} or SGX-TIX-{ticketId}-{orderId}'
        };
      }
      
      if (!ticketPurchase) {
        console.log(`Ticket purchase not found for code: ${ticketIdentifier}`);
        return {
          valid: false,
          error: 'Ticket not found in our system.'
        };
      }
      
      // Get event information
      const event = await this.getEvent(ticketPurchase.eventId);
      if (!event) {
        console.log(`Event not found for ticket purchase: ${ticketPurchase.id}`);
        return {
          valid: false,
          error: 'Event information not found'
        };
      }
      
      // Get ticket information
      const ticket = ticketPurchase.ticketId ? await this.getTicket(ticketPurchase.ticketId) : null;
      
      // Check if this ticket has already been scanned
      const alreadyScanned = ticketPurchase.firstScanAt !== null && ticketPurchase.firstScanAt !== undefined;
      let scannedAt = ticketPurchase.lastScanAt;
      
      // Mark the ticket as scanned if it hasn't been scanned yet
      if (!alreadyScanned) {
        console.log(`Marking ticket as scanned: ticketPurchase ID=${ticketPurchase.id}`);
        
        // Update the ticket purchase with scan date
        const nowTime = new Date();
        await this.updateTicketPurchase(ticketPurchase.id, {
          scanCount: (ticketPurchase.scanCount || 0) + 1,
          firstScanAt: ticketPurchase.firstScanAt || nowTime,
          lastScanAt: nowTime
        });
        
        // Create a scan record in the ticket_scans table
        try {
          await db.execute(sql`
            INSERT INTO ticket_scans (ticket_id, order_id, scanned_at, scanned_by, status, notes, created_at, updated_at)
            VALUES (${ticketPurchase.ticketId || 0}, ${ticketPurchase.orderId}, ${nowTime}, ${scannedBy}, 'valid', 'Live ticket scan', ${nowTime}, ${nowTime})
          `);
          console.log(`Created scan record for ticket ID ${ticketPurchase.ticketId}, order ID ${ticketPurchase.orderId}`);
        } catch (scanRecordError) {
          console.error('Error creating scan record:', scanRecordError);
          // Don't fail the scan if we can't create the record
        }
        
        scannedAt = nowTime;
        
        console.log(`Successfully marked ticket as scanned at: ${scannedAt}`);
      } else {
        console.log(`Ticket already scanned at: ${scannedAt}`);
      }
      
      // Format and return ticket info
      const ticketInfo = {
        ticketId: ticketPurchase.ticketId || 0,
        orderId: ticketPurchase.orderId,
        ticketName: ticket?.name || "General Admission",
        eventName: event.title,
        eventDate: event.date,
        eventLocation: event.location || "Not specified",
        purchaseDate: ticketPurchase.purchaseDate || ticketPurchase.createdAt,
        scannedAt: scannedAt
      };
      
      return {
        valid: true,
        alreadyScanned,
        ticketInfo,
        scannedAt
      };
    } catch (error) {
      console.error('Error scanning ticket:', error);
      return {
        valid: false,
        error: 'Error processing ticket. Please try again.'
      };
    }
  }
  
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return user;
  }
  
  async updatePaypalCustomerId(userId: number, paypalCustomerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ paypalCustomerId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return user;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(users)
        .where(eq(users.id, id));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      return false;
    }
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, id));
    return event;
  }

  async getAllEvents(): Promise<Event[]> {
    const allEvents = await db
      .select()
      .from(events);
      
    // For each event, get the lowest active ticket price
    const eventsWithLowestPrice = await Promise.all(
      allEvents.map(async (event) => {
        // Get all tickets for this event
        const eventTickets = await db
          .select()
          .from(tickets)
          .where(eq(tickets.eventId, event.id));
          
        // Filter tickets that are active, within their sales period and have remaining quantity
        const now = new Date();
        const activeTickets = eventTickets.filter(ticket => {
          // Check if ticket is active
          if (ticket.status !== 'active') return false;
          
          // Check remaining quantity
          if (ticket.remainingQuantity <= 0) return false;
          
          // Check if sales have ended
          if (ticket.salesEndDate) {
            const endDate = new Date(ticket.salesEndDate);
            if (ticket.salesEndTime) {
              const [hours, minutes] = ticket.salesEndTime.split(':');
              endDate.setHours(parseInt(hours), parseInt(minutes));
            }
            if (now > endDate) return false;
          }
          
          // Check if sales have started
          if (ticket.salesStartDate) {
            const startDate = new Date(ticket.salesStartDate);
            if (ticket.salesStartTime) {
              const [hours, minutes] = ticket.salesStartTime.split(':');
              startDate.setHours(parseInt(hours), parseInt(minutes));
            }
            if (now < startDate) return false;
          }
          
          return true;
        });
        
        // Find the lowest price among active tickets
        let lowestActivePrice = null;
        if (activeTickets.length > 0) {
          lowestActivePrice = Math.min(...activeTickets.map(t => t.price || 0));
        }
        
        return {
          ...event,
          lowestActivePrice
        };
      })
    );
    
    return eventsWithLowestPrice;
  }

  async getFeaturedEvents(): Promise<Event[]> {
    // Get featured events that are not past events (upcoming only)
    const now = new Date();
    
    const featuredEvents = await db
      .select()
      .from(events)
      .where(eq(events.featured, true));
      
    // Filter out past events before processing tickets
    const upcomingFeaturedEvents = featuredEvents.filter(event => {
      try {
        const eventDate = new Date(event.date);
        
        // If we have an end time, use that for comparison
        if (event.endTime) {
          const [hours, minutes] = event.endTime.split(':').map(Number);
          const eventEndDateTime = new Date(eventDate);
          eventEndDateTime.setHours(hours, minutes, 0, 0);
          return eventEndDateTime >= now; // Event is still ongoing or in the future
        }
        
        // If we have a duration and start time, calculate end time
        if (event.duration && event.time) {
          const [hours, minutes] = event.time.split(':').map(Number);
          const eventStartDateTime = new Date(eventDate);
          eventStartDateTime.setHours(hours, minutes, 0, 0);
          const eventEndDateTime = new Date(eventStartDateTime.getTime() + event.duration * 60 * 1000);
          return eventEndDateTime >= now;
        }
        
        // If we have a start time but no end time/duration
        if (event.time) {
          const [hours, minutes] = event.time.split(':').map(Number);
          const eventStartDateTime = new Date(eventDate);
          eventStartDateTime.setHours(hours, minutes, 0, 0);
          // Add 4 hours as default event duration
          const eventEndDateTime = new Date(eventStartDateTime.getTime() + 4 * 60 * 60 * 1000);
          return eventEndDateTime >= now;
        }
        
        // If no time specified, compare just the date
        const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return eventDateOnly >= todayDateOnly;
      } catch (error) {
        console.error('Database: Error determining if featured event is upcoming:', error);
        return true; // Default to showing if there's an error
      }
    });
    
    // For each upcoming featured event, get the lowest active ticket price
    const eventsWithLowestPrice = await Promise.all(
      upcomingFeaturedEvents.map(async (event) => {
        // Get all tickets for this event
        const eventTickets = await db
          .select()
          .from(tickets)
          .where(eq(tickets.eventId, event.id));
          
        // Filter tickets that are active, within their sales period and have remaining quantity
        const activeTickets = eventTickets.filter(ticket => {
          // Check if ticket is active
          if (ticket.status !== 'active') return false;
          
          // Check remaining quantity
          if (ticket.remainingQuantity <= 0) return false;
          
          // Check if sales have ended
          if (ticket.salesEndDate) {
            const endDate = new Date(ticket.salesEndDate);
            if (ticket.salesEndTime) {
              const [hours, minutes] = ticket.salesEndTime.split(':');
              endDate.setHours(parseInt(hours), parseInt(minutes));
            }
            if (now > endDate) return false;
          }
          
          // Check if sales have started
          if (ticket.salesStartDate) {
            const startDate = new Date(ticket.salesStartDate);
            if (ticket.salesStartTime) {
              const [hours, minutes] = ticket.salesStartTime.split(':');
              startDate.setHours(parseInt(hours), parseInt(minutes));
            }
            if (now < startDate) return false;
          }
          
          return true;
        });
        
        // Find the lowest price among active tickets
        let lowestActivePrice = null;
        if (activeTickets.length > 0) {
          lowestActivePrice = Math.min(...activeTickets.map(t => t.price || 0));
        }
        
        return {
          ...event,
          lowestActivePrice
        };
      })
    );
    
    return eventsWithLowestPrice;
  }
  
  async getUpcomingEvents(): Promise<Event[]> {
    const allEvents = await this.getAllEvents();
    const now = new Date();
    
    return allEvents.filter(event => {
      try {
        const eventDate = new Date(event.date);
        
        // If we have an end time, use that for comparison
        if (event.endTime) {
          const [hours, minutes] = event.endTime.split(':').map(Number);
          const eventEndDateTime = new Date(eventDate);
          eventEndDateTime.setHours(hours, minutes, 0, 0);
          return eventEndDateTime >= now;
        }
        
        // If we have a duration and start time, calculate end time
        if (event.duration && event.time) {
          const [hours, minutes] = event.time.split(':').map(Number);
          const eventStartDateTime = new Date(eventDate);
          eventStartDateTime.setHours(hours, minutes, 0, 0);
          const eventEndDateTime = new Date(eventStartDateTime.getTime() + event.duration * 60 * 1000);
          return eventEndDateTime >= now;
        }
        
        // If we have a start time but no end time/duration
        if (event.time) {
          const [hours, minutes] = event.time.split(':').map(Number);
          const eventStartDateTime = new Date(eventDate);
          eventStartDateTime.setHours(hours, minutes, 0, 0);
          // Add 4 hours as default event duration
          const eventEndDateTime = new Date(eventStartDateTime.getTime() + 4 * 60 * 60 * 1000);
          return eventEndDateTime >= now;
        }
        
        // If no time specified, compare just the date
        const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return eventDateOnly >= todayDateOnly;
      } catch (error) {
        console.error('Error determining if event is upcoming:', error);
        return true; // Default to upcoming if there's an error
      }
    });
  }

  async getPastEvents(): Promise<Event[]> {
    const allEvents = await this.getAllEvents();
    const now = new Date();
    
    return allEvents.filter(event => {
      try {
        const eventDate = new Date(event.date);
        
        // If we have an end time, use that for comparison
        if (event.endTime) {
          const [hours, minutes] = event.endTime.split(':').map(Number);
          const eventEndDateTime = new Date(eventDate);
          eventEndDateTime.setHours(hours, minutes, 0, 0);
          return eventEndDateTime < now;
        }
        
        // If we have a duration and start time, calculate end time
        if (event.duration && event.time) {
          const [hours, minutes] = event.time.split(':').map(Number);
          const eventStartDateTime = new Date(eventDate);
          eventStartDateTime.setHours(hours, minutes, 0, 0);
          const eventEndDateTime = new Date(eventStartDateTime.getTime() + event.duration * 60 * 1000);
          return eventEndDateTime < now;
        }
        
        // If we have a start time but no end time/duration
        if (event.time) {
          const [hours, minutes] = event.time.split(':').map(Number);
          const eventStartDateTime = new Date(eventDate);
          eventStartDateTime.setHours(hours, minutes, 0, 0);
          // Add 4 hours as default event duration
          const eventEndDateTime = new Date(eventStartDateTime.getTime() + 4 * 60 * 60 * 1000);
          return eventEndDateTime < now;
        }
        
        // If no time specified, compare just the date
        const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return eventDateOnly < todayDateOnly;
      } catch (error) {
        console.error('Error determining if event is past:', error);
        return false; // Default to not past if there's an error
      }
    });
  }

  async createEvent(eventData: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values({
        ...eventData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return event;
  }
  
  async updateEvent(id: number, eventData: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set({
        ...eventData,
        updatedAt: new Date()
      })
      .where(eq(events.id, id))
      .returning();
    return event;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    const result = await db
      .delete(events)
      .where(eq(events.id, id));
    return result.rowCount > 0;
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    try {
      // Use direct SQL to avoid schema inconsistency issues
      const result = await db.execute(
        sql`SELECT id, title, description, price, image_url as "imageUrl", 
            category, sizes, featured, etsy_url as "etsyUrl", created_at as "createdAt", 
            updated_at as "updatedAt" FROM products WHERE id = ${id}`
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      // Add default inventory fields
      return {
        ...(result.rows[0] as Product),
        stockLevel: 0,
        sku: '',
        inStock: true,
        lowStockThreshold: 5
      };
    } catch (error) {
      console.error('Error in getProduct:', error);
      return undefined;
    }
  }

  async getAllProducts(): Promise<Product[]> {
    try {
      // Skip trying to use select with drizzle ORM and go straight to SQL
      // since we're having schema inconsistency issues
      const result = await db.execute(
        sql`SELECT id, title, description, price, image_url as "imageUrl", 
            category, sizes, featured, etsy_url as "etsyUrl", created_at as "createdAt", 
            updated_at as "updatedAt" FROM products`
      );
      
      // Add default inventory fields that may not exist in the database
      return (result.rows as Product[]).map(product => ({
        ...product,
        stockLevel: 0,
        sku: '',
        inStock: true,
        lowStockThreshold: 5
      }));
    } catch (error) {
      console.error('Error in getAllProducts:', error);
      return [];
    }
  }

  async getFeaturedProducts(): Promise<Product[]> {
    try {
      // Skip trying to use select with drizzle ORM and go straight to SQL
      // since we're having schema inconsistency issues
      const result = await db.execute(
        sql`SELECT id, title, description, price, image_url as "imageUrl", 
            category, sizes, featured, etsy_url as "etsyUrl", created_at as "createdAt", 
            updated_at as "updatedAt" FROM products WHERE featured = true`
      );
      
      // Add default inventory fields that may not exist in the database
      return (result.rows as Product[]).map(product => ({
        ...product,
        stockLevel: 0,
        sku: '',
        inStock: true,
        lowStockThreshold: 5
      }));
    } catch (error) {
      console.error('Error in getFeaturedProducts:', error);
      
      // Ultimate fallback - try to get all products and filter in memory
      try {
        const result = await db.execute(
          sql`SELECT id, title, description, price, image_url as "imageUrl", 
              category, sizes, featured, etsy_url as "etsyUrl", created_at as "createdAt", 
              updated_at as "updatedAt" FROM products`
        );
        
        return (result.rows as Product[])
          .filter(product => product.featured === true)
          .map(product => ({
            ...product,
            stockLevel: 0,
            sku: '',
            inStock: true,
            lowStockThreshold: 5
          }));
      } catch (ultimateFallbackError) {
        console.error('Ultimate fallback error in getFeaturedProducts:', ultimateFallbackError);
        return [];
      }
    }
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values({
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return product;
  }
  
  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({
        ...productData,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    return product;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id));
    return result.rowCount > 0;
  }

  // Livestream operations
  async getLivestream(id: number): Promise<Livestream | undefined> {
    const [livestream] = await db
      .select()
      .from(livestreams)
      .where(eq(livestreams.id, id));
    return livestream;
  }

  async getAllLivestreams(): Promise<Livestream[]> {
    return await db
      .select()
      .from(livestreams);
  }

  async getCurrentLivestream(): Promise<Livestream | undefined> {
    const [livestream] = await db
      .select()
      .from(livestreams)
      .where(eq(livestreams.isLive, true))
      .limit(1);
    return livestream;
  }

  async getUpcomingLivestreams(): Promise<Livestream[]> {
    const now = new Date();
    return await db
      .select()
      .from(livestreams)
      .where(
        and(
          eq(livestreams.isLive, false),
          gt(livestreams.streamDate, now)
        )
      );
  }

  async createLivestream(livestreamData: InsertLivestream): Promise<Livestream> {
    const [livestream] = await db
      .insert(livestreams)
      .values({
        ...livestreamData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return livestream;
  }
  
  async updateLivestream(id: number, livestreamData: Partial<Livestream>): Promise<Livestream | undefined> {
    const livestream = await this.getLivestream(id);
    if (!livestream) {
      return undefined;
    }
    
    const [updatedLivestream] = await db
      .update(livestreams)
      .set({
        ...livestreamData,
        updatedAt: new Date()
      })
      .where(eq(livestreams.id, id))
      .returning();
    
    return updatedLivestream;
  }
  
  async deleteLivestream(id: number): Promise<boolean> {
    const result = await db
      .delete(livestreams)
      .where(eq(livestreams.id, id));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Post operations
  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db
      .select({
        ...posts,
        user: {
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar
        }
      })
      .from(posts)
      .where(eq(posts.id, id))
      .leftJoin(users, eq(posts.userId, users.id));
    return post;
  }

  async getAllPosts(): Promise<Post[]> {
    return await db
      .select({
        ...posts,
        user: {
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar
        }
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt));
  }

  async createPost(postData: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values({
        ...postData,
        likes: 0,
        comments: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Get user data for the post
    const user = await this.getUser(post.userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      ...post,
      user: {
        id: user.id,
        displayName: user.displayName,
        avatar: user.avatar
      }
    };
  }

  // Comment operations
  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db
      .select({
        ...comments,
        user: {
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar
        }
      })
      .from(comments)
      .where(eq(comments.id, id))
      .leftJoin(users, eq(comments.userId, users.id));
    return comment;
  }

  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return await db
      .select({
        ...comments,
        user: {
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar
        }
      })
      .from(comments)
      .where(eq(comments.postId, postId))
      .leftJoin(users, eq(comments.userId, users.id))
      .orderBy(comments.createdAt);
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values({
        ...commentData,
        createdAt: new Date()
      })
      .returning();

    // Get user data for the comment
    const user = await this.getUser(comment.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update comment count on post
    await db
      .update(posts)
      .set({
        comments: sql`${posts.comments} + 1`
      })
      .where(eq(posts.id, comment.postId));
      
    // Return comment with user data
    return {
      ...comment,
      user: {
        id: user.id,
        displayName: user.displayName || user.username,
        avatar: user.avatar
      }
    };
  }
  
  async getCommentById(id: number): Promise<Comment | undefined> {
    return await this.getComment(id);
  }
  
  async deleteComment(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(comments)
        .where(eq(comments.id, id))
        .returning();
        
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting comment:", error);
      return false;
    }
  }
  
  async decrementPostCommentCount(postId: number): Promise<void> {
    await db
      .update(posts)
      .set({
        comments: sql`GREATEST(${posts.comments} - 1, 0)`
      })
      .where(eq(posts.id, postId));
  }

  // Chat operations
  async getChatMessagesByLivestreamId(livestreamId: number): Promise<ChatMessage[]> {
    return await db
      .select({
        ...chatMessages,
        user: {
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar
        }
      })
      .from(chatMessages)
      .where(eq(chatMessages.livestreamId, livestreamId))
      .leftJoin(users, eq(chatMessages.userId, users.id))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values({
        ...messageData,
        createdAt: new Date()
      })
      .returning();

    // Get user data for the chat message
    const user = await this.getUser(message.userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      ...message,
      user: {
        id: user.id,
        displayName: user.displayName,
        avatar: user.avatar
      }
    };
  }

  // Livestream management operations
  async getAllLivestreams(): Promise<Livestream[]> {
    return await db
      .select()
      .from(livestreams)
      .orderBy(desc(livestreams.streamDate));
  }

  async getLivestream(id: number): Promise<Livestream | undefined> {
    const [livestream] = await db
      .select()
      .from(livestreams)
      .where(eq(livestreams.id, id));
    return livestream;
  }

  async createLivestream(livestreamData: InsertLivestream): Promise<Livestream> {
    const [livestream] = await db
      .insert(livestreams)
      .values({
        ...livestreamData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return livestream;
  }

  async updateLivestream(id: number, livestreamData: Partial<InsertLivestream>): Promise<Livestream | undefined> {
    const [livestream] = await db
      .update(livestreams)
      .set({
        ...livestreamData,
        updatedAt: new Date()
      })
      .where(eq(livestreams.id, id))
      .returning();
    return livestream;
  }

  async deleteLivestream(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(livestreams)
        .where(eq(livestreams.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting livestream:", error);
      return false;
    }
  }
  
  // Ticket operations
  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id));
    
    return ticket || undefined;
  }
  
  async getAllTickets(): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets);
  }
  
  async updateTicket(id: number, ticketData: Partial<InsertTicket>): Promise<Ticket | undefined> {
    try {
      console.log("Updating ticket with ID:", id, "Data:", JSON.stringify(ticketData, null, 2));
      
      // Handle dates appropriately
      let dataToUpdate: any = {
        updatedAt: new Date()
      };
      
      // Only include fields that are actually present to avoid null overrides
      Object.keys(ticketData).forEach(key => {
        if (ticketData[key] !== undefined) {
          // Special handling for price - convert to integer cents
          if (key === 'price') {
            if (typeof ticketData.price === 'string') {
              // If price is a string like "21.50", convert to cents (2150)
              const floatPrice = parseFloat(ticketData.price);
              if (!isNaN(floatPrice)) {
                const priceCents = Math.round(floatPrice * 100);
                console.log(`Converting price from ${ticketData.price} to ${priceCents} cents`);
                dataToUpdate.price = priceCents;
              } else {
                console.warn(`Invalid price format: ${ticketData.price}, skipping price update`);
              }
            } else if (typeof ticketData.price === 'number') {
              // Always convert the price to cents
              const priceCents = Math.round(ticketData.price * 100);
              console.log(`Converting number price from ${ticketData.price} to ${priceCents} cents`);
              dataToUpdate.price = priceCents;
            }
          } else {
            dataToUpdate[key] = ticketData[key];
          }
        }
      });
      
      // Safely process dates - convert string dates to Date objects, but only if they're valid
      if (typeof dataToUpdate.salesStartDate === 'string' && dataToUpdate.salesStartDate) {
        const startDate = new Date(dataToUpdate.salesStartDate);
        if (!isNaN(startDate.getTime())) {
          dataToUpdate.salesStartDate = startDate;
        } else {
          delete dataToUpdate.salesStartDate; // Remove invalid date
        }
      }
      
      if (typeof dataToUpdate.salesEndDate === 'string' && dataToUpdate.salesEndDate) {
        const endDate = new Date(dataToUpdate.salesEndDate);
        if (!isNaN(endDate.getTime())) {
          dataToUpdate.salesEndDate = endDate;
        } else {
          delete dataToUpdate.salesEndDate; // Remove invalid date
        }
      }
      
      // If dates are null/undefined in the input, keep them that way without trying to convert
      if (ticketData.salesStartDate === null) dataToUpdate.salesStartDate = null;
      if (ticketData.salesEndDate === null) dataToUpdate.salesEndDate = null;
      
      console.log("Processed update data:", JSON.stringify(dataToUpdate, null, 2));
      
      const [updatedTicket] = await db
        .update(tickets)
        .set(dataToUpdate)
        .where(eq(tickets.id, id))
        .returning();
      
      console.log("Updated ticket result:", updatedTicket ? "Success" : "No ticket returned");
      return updatedTicket || undefined;
    } catch (error) {
      console.error("Error updating ticket in database:", error);
      throw error;
    }
  }
  
  async deleteTicket(id: number): Promise<boolean> {
    try {
      await db
        .delete(tickets)
        .where(eq(tickets.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting ticket:", error);
      return false;
    }
  }
  
  async getTicketPurchasesByTicketId(ticketId: number): Promise<TicketPurchase[]> {
    return await db
      .select()
      .from(ticketPurchases)
      .where(eq(ticketPurchases.ticketId, ticketId));
  }
  
  async createTicket(ticketData: InsertTicket): Promise<Ticket> {
    const [ticket] = await db
      .insert(tickets)
      .values({
        ...ticketData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return ticket;
  }
  
  async getTicketsByEventId(eventId: number): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.eventId, eventId));
  }

  async getPublicTicketsByEventId(eventId: number): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.eventId, eventId),
          eq(tickets.isActive, true),
          not(eq(tickets.status, 'hidden'))
        )
      );
  }
  
  // Ticket purchase operations
  async createTicketPurchase(ticketPurchaseData: InsertTicketPurchase): Promise<TicketPurchase> {
    try {
      console.log("Creating ticket purchase with data:", ticketPurchaseData);
      
      // Make sure we have the ticketPurchases table defined
      if (!ticketPurchases) {
        throw new Error('ticketPurchases table is not defined');
      }
      
      // Make sure the data has the required fields for insertion
      if (!ticketPurchaseData.userId || !ticketPurchaseData.eventId || !ticketPurchaseData.orderId || !ticketPurchaseData.qrCodeData) {
        throw new Error(`Missing required fields for ticket purchase: ${JSON.stringify(ticketPurchaseData)}`);
      }
      
      const [ticketPurchase] = await db
        .insert(ticketPurchases)
        .values({
          ...ticketPurchaseData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      console.log("Successfully created ticket purchase:", ticketPurchase);
      return ticketPurchase;
    } catch (error) {
      console.error("Error creating ticket purchase:", error);
      throw error;
    }
  }
  
  async getTicketPurchasesByUserId(userId: number): Promise<TicketPurchase[]> {
    return await db
      .select()
      .from(ticketPurchases)
      .where(eq(ticketPurchases.userId, userId))
      .orderBy(desc(ticketPurchases.purchaseDate));
  }
  
  async getTicketPurchasesByEventId(eventId: number): Promise<TicketPurchase[]> {
    return await db
      .select()
      .from(ticketPurchases)
      .where(eq(ticketPurchases.eventId, eventId))
      .orderBy(desc(ticketPurchases.purchaseDate));
  }
  
  async getTicketPurchase(id: number): Promise<TicketPurchase | undefined> {
    const [ticketPurchase] = await db
      .select()
      .from(ticketPurchases)
      .where(eq(ticketPurchases.id, id));
      
    return ticketPurchase;
  }
  
  async getTicketPurchaseByQrCodeData(qrCodeData: string): Promise<TicketPurchase | undefined> {
    const [ticketPurchase] = await db
      .select()
      .from(ticketPurchases)
      .where(eq(ticketPurchases.qrCodeData, qrCodeData));
      
    return ticketPurchase;
  }
  
  async getTicketPurchaseByIds(ticketId: number, orderId: number): Promise<TicketPurchase | undefined> {
    const [ticketPurchase] = await db
      .select()
      .from(ticketPurchases)
      .where(
        and(
          eq(ticketPurchases.ticketId, ticketId),
          eq(ticketPurchases.orderId, orderId)
        )
      );
      
    return ticketPurchase;
  }
  
  async updateTicketPurchase(id: number, updates: Partial<InsertTicketPurchase>): Promise<TicketPurchase | undefined> {
    const [ticketPurchase] = await db
      .update(ticketPurchases)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(ticketPurchases.id, id))
      .returning();
      
    return ticketPurchase;
  }

  async getTicketsByUserId(userId: number): Promise<TicketPurchase[]> {
    return await db
      .select()
      .from(ticketPurchases)
      .where(eq(ticketPurchases.userId, userId))
      .orderBy(desc(ticketPurchases.purchaseDate));
  }

  async getTodaysTicketPurchases(): Promise<any[]> {
    try {
      // Use SQL to get today's ticket purchases with joined event and ticket data
      const result = await db.execute(
        sql`
          SELECT 
            tp.id,
            tp.attendee_email as "attendeeEmail",
            tp.attendee_name as "attendeeName", 
            tp.purchase_date as "purchaseDate",
            tp.qr_code_data as "qrCodeData",
            tp.price,
            e.title as "eventTitle",
            e.date as "eventDate",
            e.location as "eventLocation",
            t.name as "ticketName"
          FROM ticket_purchases tp
          LEFT JOIN events e ON tp.event_id = e.id
          LEFT JOIN tickets t ON tp.ticket_id = t.id
          WHERE tp.purchase_date >= CURRENT_DATE
            AND tp.attendee_email IS NOT NULL
            AND tp.attendee_email != ''
          ORDER BY tp.purchase_date DESC
        `
      );
      
      return result.rows.map(row => ({
        id: row.id,
        attendeeEmail: row.attendeeEmail,
        attendeeName: row.attendeeName,
        purchaseDate: row.purchaseDate,
        qrCodeData: row.qrCodeData,
        price: row.price,
        eventTitle: row.eventTitle,
        eventDate: row.eventDate,
        eventLocation: row.eventLocation,
        ticketName: row.ticketName
      }));
    } catch (error) {
      console.error("Error getting today's ticket purchases:", error);
      return [];
    }
  }
  
  // Discount code operations
  async createDiscountCode(discountCodeData: InsertDiscountCode): Promise<DiscountCode> {
    const [discountCode] = await db
      .insert(discountCodes)
      .values({
        ...discountCodeData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return discountCode;
  }
  
  async getDiscountCodeByCode(code: string): Promise<DiscountCode | undefined> {
    const [discountCode] = await db
      .select()
      .from(discountCodes)
      .where(eq(discountCodes.code, code));
    return discountCode;
  }
  
  // Order operations
  async createOrder(orderData: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values({
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return order;
  }
  
  async getAllOrders(): Promise<Order[]> {
    return await db
      .select()
      .from(orders);
  }
  
  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return order;
  }
  
  // Media upload operations
  async createMediaUpload(mediaUploadData: InsertMediaUpload): Promise<MediaUpload> {
    const [mediaUpload] = await db
      .insert(mediaUploads)
      .values({
        ...mediaUploadData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return mediaUpload;
  }
  
  async getMediaUploadsByRelatedEntity(relatedEntityType: string, relatedEntityId: number): Promise<MediaUpload[]> {
    return await db
      .select()
      .from(mediaUploads)
      .where(
        and(
          eq(mediaUploads.relatedEntityType, relatedEntityType),
          eq(mediaUploads.relatedEntityId, relatedEntityId)
        )
      );
  }
  
  // Inventory management - Product Variants
  async getProductVariantsByProductId(productId: number): Promise<ProductVariant[]> {
    return await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));
  }
  
  async getProductVariant(id: number): Promise<ProductVariant | undefined> {
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, id));
    return variant;
  }
  
  async createProductVariant(variantData: InsertProductVariant): Promise<ProductVariant> {
    const [variant] = await db
      .insert(productVariants)
      .values({
        ...variantData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    // Update product to mark that it has variants
    await db
      .update(products)
      .set({ hasVariants: true })
      .where(eq(products.id, variant.productId));
      
    return variant;
  }
  
  async updateProductVariant(id: number, variantData: Partial<InsertProductVariant>): Promise<ProductVariant | undefined> {
    const [variant] = await db
      .update(productVariants)
      .set({
        ...variantData,
        updatedAt: new Date()
      })
      .where(eq(productVariants.id, id))
      .returning();
      
    return variant;
  }
  
  async deleteProductVariant(id: number): Promise<boolean> {
    const variant = await this.getProductVariant(id);
    if (!variant) return false;
    
    const result = await db
      .delete(productVariants)
      .where(eq(productVariants.id, id));
      
    // Check if there are any remaining variants for this product
    const remainingVariants = await this.getProductVariantsByProductId(variant.productId);
    
    // If no variants left, update the product to show it no longer has variants
    if (remainingVariants.length === 0) {
      await db
        .update(products)
        .set({ hasVariants: false })
        .where(eq(products.id, variant.productId));
    }
    
    return result.rowCount > 0;
  }
  
  // Ticket scan operations
  async createTicketScan(ticketScanData: InsertTicketScan): Promise<TicketScan> {
    const [ticketScan] = await db
      .insert(ticketScans)
      .values({
        ticketId: ticketScanData.ticketId,
        orderId: ticketScanData.orderId,
        scannedAt: ticketScanData.scannedAt || new Date(),
        scannedBy: ticketScanData.scannedBy || null,
        status: ticketScanData.status || 'valid',
        notes: ticketScanData.notes || null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return ticketScan;
  }
  
  async getTicketScansByTicketId(ticketId: number): Promise<TicketScan[]> {
    return await db
      .select()
      .from(ticketScans)
      .where(eq(ticketScans.ticketId, ticketId))
      .orderBy(desc(ticketScans.scannedAt));
  }
  
  async getTicketScansByOrderId(orderId: number): Promise<TicketScan[]> {
    return await db
      .select()
      .from(ticketScans)
      .where(eq(ticketScans.orderId, orderId))
      .orderBy(desc(ticketScans.scannedAt));
  }

  async getAllTicketScans(): Promise<any[]> {
    try {
      // Join ticket_scans with tickets, events, and users for comprehensive scan data
      const scanRecords = await db
        .select({
          id: ticketScans.id,
          ticketId: ticketScans.ticketId,
          orderId: ticketScans.orderId,
          scannedAt: ticketScans.scannedAt,
          scannedBy: ticketScans.scannedBy,
          status: ticketScans.status,
          notes: ticketScans.notes,
          ticketName: tickets.name,
          eventName: events.title,
          scannerName: users.displayName
        })
        .from(ticketScans)
        .leftJoin(tickets, eq(ticketScans.ticketId, tickets.id))
        .leftJoin(events, eq(tickets.eventId, events.id))
        .leftJoin(users, eq(ticketScans.scannedBy, users.id))
        .orderBy(desc(ticketScans.scannedAt))
        .limit(100); // Limit to prevent excessive data loading

      return scanRecords;
    } catch (error) {
      console.error('Error fetching all ticket scans:', error);
      throw error;
    }
  }
  
  // Analytics operations
  
  // Page Views
  async createPageView(pageViewData: InsertPageView): Promise<PageView> {
    try {
      console.log('Creating page view with data:', JSON.stringify(pageViewData));
      
      // Make sure we have required fields
      if (!pageViewData.path || !pageViewData.sessionId) {
        throw new Error('Missing required fields for page view');
      }
      
      const [pageView] = await db
        .insert(pageViews)
        .values({
          ...pageViewData,
          timestamp: new Date()
        })
        .returning();
        
      console.log('Page view created successfully');
      return pageView;
    } catch (error) {
      console.error('Error in createPageView:', error);
      throw error;
    }
  }
  
  async getPageViewsByPath(path: string): Promise<PageView[]> {
    return await db
      .select()
      .from(pageViews)
      .where(eq(pageViews.path, path))
      .orderBy(desc(pageViews.timestamp));
  }
  
  async getPageViewsByUserId(userId: number): Promise<PageView[]> {
    return await db
      .select()
      .from(pageViews)
      .where(eq(pageViews.userId, userId))
      .orderBy(desc(pageViews.timestamp));
  }

  async getAllPageViews(): Promise<PageView[]> {
    return await db
      .select()
      .from(pageViews)
      .orderBy(desc(pageViews.timestamp));
  }
  
  // Event Analytics
  async createEventAnalytic(eventAnalyticData: InsertEventAnalytic): Promise<EventAnalytic> {
    const [eventAnalytic] = await db
      .insert(eventAnalytics)
      .values({
        ...eventAnalyticData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return eventAnalytic;
  }
  
  async getEventAnalyticsByEventId(eventId: number): Promise<EventAnalytic | undefined> {
    const [eventAnalytic] = await db
      .select()
      .from(eventAnalytics)
      .where(eq(eventAnalytics.eventId, eventId));
    return eventAnalytic;
  }
  
  async incrementEventViews(eventId: number): Promise<EventAnalytic | undefined> {
    const existing = await this.getEventAnalyticsByEventId(eventId);
    
    if (existing) {
      const [updated] = await db
        .update(eventAnalytics)
        .set({ 
          views: existing.views + 1,
          updatedAt: new Date()
        })
        .where(eq(eventAnalytics.eventId, eventId))
        .returning();
      return updated;
    } else {
      return await this.createEventAnalytic({
        eventId,
        views: 1,
        ticketClicks: 0,
        ticketSales: 0
      });
    }
  }
  
  async incrementEventTicketClicks(eventId: number): Promise<EventAnalytic | undefined> {
    const existing = await this.getEventAnalyticsByEventId(eventId);
    
    if (existing) {
      const [updated] = await db
        .update(eventAnalytics)
        .set({ 
          ticketClicks: existing.ticketClicks + 1,
          updatedAt: new Date()
        })
        .where(eq(eventAnalytics.eventId, eventId))
        .returning();
      return updated;
    } else {
      return await this.createEventAnalytic({
        eventId,
        views: 0,
        ticketClicks: 1,
        ticketSales: 0
      });
    }
  }
  
  async incrementEventTicketSales(eventId: number): Promise<EventAnalytic | undefined> {
    const existing = await this.getEventAnalyticsByEventId(eventId);
    
    if (existing) {
      const [updated] = await db
        .update(eventAnalytics)
        .set({ 
          ticketSales: existing.ticketSales + 1,
          updatedAt: new Date()
        })
        .where(eq(eventAnalytics.eventId, eventId))
        .returning();
      return updated;
    } else {
      return await this.createEventAnalytic({
        eventId,
        views: 0,
        ticketClicks: 0,
        ticketSales: 1
      });
    }
  }
  
  // Product Analytics
  async createProductAnalytic(productAnalyticData: InsertProductAnalytic): Promise<ProductAnalytic> {
    const [productAnalytic] = await db
      .insert(productAnalytics)
      .values({
        ...productAnalyticData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return productAnalytic;
  }
  
  async getProductAnalyticsByProductId(productId: number): Promise<ProductAnalytic | undefined> {
    const [productAnalytic] = await db
      .select()
      .from(productAnalytics)
      .where(eq(productAnalytics.productId, productId));
    return productAnalytic;
  }
  
  async incrementProductViews(productId: number): Promise<ProductAnalytic | undefined> {
    const existing = await this.getProductAnalyticsByProductId(productId);
    
    if (existing) {
      const [updated] = await db
        .update(productAnalytics)
        .set({ 
          views: existing.views + 1,
          updatedAt: new Date()
        })
        .where(eq(productAnalytics.productId, productId))
        .returning();
      return updated;
    } else {
      return await this.createProductAnalytic({
        productId,
        views: 1,
        detailClicks: 0,
        purchaseClicks: 0
      });
    }
  }
  
  async incrementProductDetailClicks(productId: number): Promise<ProductAnalytic | undefined> {
    const existing = await this.getProductAnalyticsByProductId(productId);
    
    if (existing) {
      const [updated] = await db
        .update(productAnalytics)
        .set({ 
          detailClicks: existing.detailClicks + 1,
          updatedAt: new Date()
        })
        .where(eq(productAnalytics.productId, productId))
        .returning();
      return updated;
    } else {
      return await this.createProductAnalytic({
        productId,
        views: 0,
        detailClicks: 1,
        purchaseClicks: 0
      });
    }
  }
  
  async incrementProductPurchaseClicks(productId: number): Promise<ProductAnalytic | undefined> {
    const existing = await this.getProductAnalyticsByProductId(productId);
    
    if (existing) {
      const [updated] = await db
        .update(productAnalytics)
        .set({ 
          purchaseClicks: existing.purchaseClicks + 1,
          updatedAt: new Date()
        })
        .where(eq(productAnalytics.productId, productId))
        .returning();
      return updated;
    } else {
      return await this.createProductAnalytic({
        productId,
        views: 0,
        detailClicks: 0,
        purchaseClicks: 1
      });
    }
  }
  
  // User Events
  async createUserEvent(userEventData: InsertUserEvent): Promise<UserEvent> {
    const [userEvent] = await db
      .insert(userEvents)
      .values({
        ...userEventData,
        timestamp: new Date()
      })
      .returning();
    return userEvent;
  }
  
  async getUserEventsByUserId(userId: number): Promise<UserEvent[]> {
    return await db
      .select()
      .from(userEvents)
      .where(eq(userEvents.userId, userId))
      .orderBy(desc(userEvents.timestamp));
  }
  
  // Daily Stats
  async createDailyStat(dailyStatData: InsertDailyStat): Promise<DailyStat> {
    const [dailyStat] = await db
      .insert(dailyStats)
      .values(dailyStatData)
      .returning();
    return dailyStat;
  }
  
  async getDailyStatByDate(date: Date): Promise<DailyStat | undefined> {
    const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    const [dailyStat] = await db
      .select()
      .from(dailyStats)
      .where(sql`${dailyStats.date}::text = ${dateStr}`);
    
    return dailyStat;
  }
  
  async updateDailyStat(date: Date, updates: Partial<InsertDailyStat>): Promise<DailyStat | undefined> {
    const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    const [updated] = await db
      .update(dailyStats)
      .set(updates)
      .where(sql`${dailyStats.date}::text = ${dateStr}`)
      .returning();
    
    return updated;
  }
  
  async getDailyStatsByDateRange(startDate: Date, endDate: Date): Promise<DailyStat[]> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return await db
      .select()
      .from(dailyStats)
      .where(
        and(
          sql`${dailyStats.date}::text >= ${startDateStr}`,
          sql`${dailyStats.date}::text <= ${endDateStr}`
        )
      )
      .orderBy(dailyStats.date);
  }
  
  // Inventory management - Inventory History
  // Note: These methods are safely stubbed to avoid schema migration issues
  // Will be properly implemented after database migration is complete
  
  async recordInventoryChange(change: InsertInventoryHistory): Promise<InventoryHistory> {
    try {
      const [history] = await db
        .insert(inventoryHistory)
        .values({
          productId: change.entityType === 'product' ? change.entityId : null,
          variantId: change.entityType === 'variant' ? change.entityId : null,
          previousStock: change.oldValue,
          newStock: change.newValue,
          changeQuantity: change.newValue - change.oldValue,
          changeType: change.changeType,
          userId: change.userId,
          reason: change.notes,
          timestamp: new Date()
        })
        .returning();
        
      return history;
    } catch (error) {
      console.error('Error recording inventory change:', error);
      // Return a minimal object that satisfies the return type
      return {
        id: 0,
        productId: change.entityType === 'product' ? change.entityId : null,
        variantId: change.entityType === 'variant' ? change.entityId : null,
        previousStock: change.oldValue,
        newStock: change.newValue,
        changeQuantity: change.newValue - change.oldValue,
        changeType: change.changeType,
        userId: change.userId,
        reason: change.notes,
        timestamp: new Date(),
        createdAt: new Date(),
        orderId: null
      };
    }
  }
  
  async getInventoryHistoryByProduct(productId: number): Promise<InventoryHistory[]> {
    try {
      return await db
        .select()
        .from(inventoryHistory)
        .where(eq(inventoryHistory.productId, productId))
        .orderBy(desc(inventoryHistory.timestamp));
    } catch (error) {
      console.error('Error getting inventory history by product:', error);
      return []; // Return empty array on error
    }
  }
  
  async getInventoryHistoryByVariant(variantId: number): Promise<InventoryHistory[]> {
    try {
      return await db
        .select()
        .from(inventoryHistory)
        .where(eq(inventoryHistory.variantId, variantId))
        .orderBy(desc(inventoryHistory.timestamp));
    } catch (error) {
      console.error('Error getting inventory history by variant:', error);
      return []; // Return empty array on error
    }
  }
  
  async getRecentInventoryChanges(limit: number = 20): Promise<InventoryHistory[]> {
    try {
      return await db
        .select()
        .from(inventoryHistory)
        .orderBy(desc(inventoryHistory.timestamp))
        .limit(limit);
    } catch (error) {
      console.error('Error getting recent inventory changes:', error);
      return []; // Return empty array on error
    }
  }
  
  // Inventory management - Stock operations
  async updateProductStock(productId: number, newStockLevel: number, changeType: string, userId: number, reason?: string): Promise<Product> {
    try {
      // First get current product
      const product = await this.getProduct(productId);
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      
      // Get old stock level
      const oldStockLevel = product.stockLevel || 0;
      
      // Update the product with stockLevel if possible
      try {
        const [updatedProduct] = await db
          .update(products)
          .set({
            stockLevel: newStockLevel,
            inStock: newStockLevel > 0,
            updatedAt: new Date()
          })
          .where(eq(products.id, productId))
          .returning();
          
        // Try to record the inventory change
        try {
          await this.recordInventoryChange({
            entityType: 'product',
            entityId: productId,
            changeType: changeType,
            oldValue: oldStockLevel,
            newValue: newStockLevel,
            userId: userId,
            notes: reason || null
          });
        } catch (err) {
          console.error('Failed to record inventory change:', err);
        }
        
        return updatedProduct;
      } catch (updateError) {
        console.error('Error updating product stock, likely schema mismatch:', updateError);
        // If we couldn't update with the new schema, return the original product
        return product;
      }
    } catch (error) {
      console.error('Error in updateProductStock:', error);
      throw error;
    }
  }
  
  async updateVariantStock(variantId: number, newStockLevel: number, changeType: string, userId: number, reason?: string): Promise<ProductVariant> {
    try {
      // First get current variant
      const variant = await this.getProductVariant(variantId);
      if (!variant) {
        throw new Error(`Product variant with ID ${variantId} not found`);
      }
      
      // Get old stock level
      const oldStockLevel = variant.stockLevel || 0;
      
      // Update the variant
      const [updatedVariant] = await db
        .update(productVariants)
        .set({
          stockLevel: newStockLevel,
          inStock: newStockLevel > 0,
          updatedAt: new Date()
        })
        .where(eq(productVariants.id, variantId))
        .returning();
        
      // Try to record the inventory change
      try {
        await this.recordInventoryChange({
          entityType: 'variant',
          entityId: variantId,
          changeType: changeType,
          oldValue: oldStockLevel,
          newValue: newStockLevel,
          userId: userId,
          notes: reason || null
        });
      } catch (err) {
        console.error('Failed to record variant inventory change:', err);
      }
      
      return updatedVariant;
    } catch (error) {
      console.error('Error in updateVariantStock:', error);
      throw error;
    }
  }
  
  async checkProductAvailability(productId: number, quantity: number = 1): Promise<boolean> {
    try {
      const product = await this.getProduct(productId);
      if (!product) return false;
      
      // If we can't determine hasVariants, check both options
      const hasVariants = product.hasVariants === true; 
      
      if (hasVariants) {
        try {
          const variants = await this.getProductVariantsByProductId(productId);
          return variants.some(variant => (variant.stockLevel || 0) >= quantity);
        } catch (err) {
          console.error('Error checking variant availability:', err);
          return false;
        }
      }
      
      // Otherwise check the product stock directly if stockLevel exists
      return product.stockLevel !== undefined ? product.stockLevel >= quantity : true;
    } catch (error) {
      console.error('Error in checkProductAvailability:', error);
      return false; // Assume not available on error
    }
  }
  
  async checkVariantAvailability(variantId: number, quantity: number = 1): Promise<boolean> {
    try {
      const variant = await this.getProductVariant(variantId);
      if (!variant) return false;
      
      return variant.stockLevel !== undefined ? variant.stockLevel >= quantity : true;
    } catch (error) {
      console.error('Error in checkVariantAvailability:', error);
      return false; // Assume not available on error
    }
  }
  
  async getLowStockProducts(threshold: number = 5): Promise<Product[]> {
    try {
      // Try with new schema properties
      return await db
        .select()
        .from(products)
        .where(
          and(
            lt(products.stockLevel, threshold),
            isNotNull(products.stockLevel)
          )
        );
    } catch (error) {
      console.error('Error in getLowStockProducts, likely schema mismatch:', error);
      // Fallback to simple query
      try {
        return await db.select().from(products);
      } catch (fallbackError) {
        console.error('Failed to get products with fallback:', fallbackError);
        return [];
      }
    }
  }

  // Sponsored Content Management
  async getAllSponsoredContent(): Promise<SponsoredContent[]> {
    try {
      return await db.select().from(sponsoredContent).orderBy(desc(sponsoredContent.priority), desc(sponsoredContent.createdAt));
    } catch (error) {
      console.error('Error fetching sponsored content:', error);
      return [];
    }
  }

  async getActiveSponsoredContent(): Promise<SponsoredContent[]> {
    try {
      const now = new Date();
      return await db.select().from(sponsoredContent)
        .where(
          and(
            eq(sponsoredContent.isActive, true),
            // Check if within date range or no date restrictions
            sql`(${sponsoredContent.startDate} IS NULL OR ${sponsoredContent.startDate} <= ${now})`,
            sql`(${sponsoredContent.endDate} IS NULL OR ${sponsoredContent.endDate} >= ${now})`
          )
        )
        .orderBy(desc(sponsoredContent.priority), desc(sponsoredContent.createdAt));
    } catch (error) {
      console.error('Error fetching active sponsored content:', error);
      return [];
    }
  }

  async createSponsoredContent(data: InsertSponsoredContent): Promise<SponsoredContent> {
    const [content] = await db.insert(sponsoredContent).values(data).returning();
    return content;
  }

  async updateSponsoredContent(id: number, data: Partial<InsertSponsoredContent>): Promise<SponsoredContent> {
    const [content] = await db.update(sponsoredContent)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sponsoredContent.id, id))
      .returning();
    return content;
  }

  async deleteSponsoredContent(id: number): Promise<void> {
    await db.delete(sponsoredContent).where(eq(sponsoredContent.id, id));
  }

  async incrementSponsoredContentClicks(id: number): Promise<void> {
    await db.update(sponsoredContent)
      .set({ clicks: sql`${sponsoredContent.clicks} + 1` })
      .where(eq(sponsoredContent.id, id));
  }

  async incrementSponsoredContentViews(id: number): Promise<void> {
    await db.update(sponsoredContent)
      .set({ views: sql`${sponsoredContent.views} + 1` })
      .where(eq(sponsoredContent.id, id));
  }

  async getFreeTicketPurchases(): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: ticketPurchases.id,
          userId: ticketPurchases.userId,
          eventId: ticketPurchases.eventId,
          ticketId: ticketPurchases.ticketId,
          orderId: ticketPurchases.orderId,
          purchaseDate: ticketPurchases.purchaseDate,
          price: ticketPurchases.price,
          status: ticketPurchases.status,
          attendeeEmail: ticketPurchases.attendeeEmail,
          attendeeName: ticketPurchases.attendeeName,
          username: users.username,
          displayName: users.displayName,
          eventTitle: events.title,
          ticketName: tickets.name
        })
        .from(ticketPurchases)
        .leftJoin(users, eq(ticketPurchases.userId, users.id))
        .leftJoin(events, eq(ticketPurchases.eventId, events.id))
        .leftJoin(tickets, eq(ticketPurchases.ticketId, tickets.id))
        .where(eq(ticketPurchases.price, '0'))
        .orderBy(desc(ticketPurchases.purchaseDate));
      
      return result;
    } catch (error) {
      console.error('Error fetching free ticket purchases:', error);
      return [];
    }
  }

  async getRecentTicketPurchases(startDate: string, endDate: string): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: ticketPurchases.id,
          user_id: ticketPurchases.userId,
          email: users.email,
          username: users.username,
          qr_code_data: ticketPurchases.qrCodeData,
          purchase_date: ticketPurchases.purchaseDate,
          ticket_type: ticketPurchases.ticketType,
          price: ticketPurchases.price,
          event_title: events.title,
          event_location: events.location,
          event_date: events.date
        })
        .from(ticketPurchases)
        .leftJoin(users, eq(ticketPurchases.userId, users.id))
        .leftJoin(events, eq(ticketPurchases.eventId, events.id))
        .where(
          and(
            gte(ticketPurchases.purchaseDate, new Date(startDate + ' 00:00:00')),
            lt(ticketPurchases.purchaseDate, new Date(endDate + ' 23:59:59'))
          )
        )
        .orderBy(desc(ticketPurchases.purchaseDate));
      
      return result;
    } catch (error) {
      console.error('Error fetching recent ticket purchases:', error);
      return [];
    }
  }

  // AI Assistant Config operations
  async createAiAssistantConfig(config: InsertAiAssistantConfig): Promise<AiAssistantConfig> {
    const result = await db.insert(aiAssistantConfigs).values(config).returning();
    return result[0];
  }

  async getAiAssistantConfigsByUserId(userId: number): Promise<AiAssistantConfig[]> {
    return await db
      .select()
      .from(aiAssistantConfigs)
      .where(eq(aiAssistantConfigs.userId, userId))
      .orderBy(desc(aiAssistantConfigs.createdAt));
  }

  async getAiAssistantConfig(id: number): Promise<AiAssistantConfig | undefined> {
    const result = await db
      .select()
      .from(aiAssistantConfigs)
      .where(eq(aiAssistantConfigs.id, id))
      .limit(1);
    return result[0];
  }

  async updateAiAssistantConfig(id: number, configData: Partial<InsertAiAssistantConfig>): Promise<AiAssistantConfig | undefined> {
    const result = await db
      .update(aiAssistantConfigs)
      .set({ ...configData, updatedAt: new Date() })
      .where(eq(aiAssistantConfigs.id, id))
      .returning();
    return result[0];
  }

  async deleteAiAssistantConfig(id: number): Promise<boolean> {
    const result = await db
      .delete(aiAssistantConfigs)
      .where(eq(aiAssistantConfigs.id, id));
    return result.rowCount > 0;
  }

  // AI Chat Session operations
  async createAiChatSession(session: InsertAiChatSession): Promise<AiChatSession> {
    const result = await db.insert(aiChatSessions).values(session).returning();
    return result[0];
  }

  async getAiChatSessionsByUserId(userId: number): Promise<AiChatSession[]> {
    return await db
      .select()
      .from(aiChatSessions)
      .where(eq(aiChatSessions.userId, userId))
      .orderBy(desc(aiChatSessions.updatedAt));
  }

  async getAiChatSession(id: number): Promise<AiChatSession | undefined> {
    const result = await db
      .select()
      .from(aiChatSessions)
      .where(eq(aiChatSessions.id, id))
      .limit(1);
    return result[0];
  }

  async updateAiChatSession(id: number, sessionData: Partial<InsertAiChatSession>): Promise<AiChatSession | undefined> {
    const result = await db
      .update(aiChatSessions)
      .set({ ...sessionData, updatedAt: new Date() })
      .where(eq(aiChatSessions.id, id))
      .returning();
    return result[0];
  }

  async deleteAiChatSession(id: number): Promise<boolean> {
    const result = await db
      .delete(aiChatSessions)
      .where(eq(aiChatSessions.id, id));
    return result.rowCount > 0;
  }

  // AI Chat Message operations
  async createAiChatMessage(message: InsertAiChatMessage): Promise<AiChatMessage> {
    const result = await db.insert(aiChatMessages).values(message).returning();
    return result[0];
  }

  async getAiChatMessagesBySessionId(sessionId: number): Promise<AiChatMessage[]> {
    return await db
      .select()
      .from(aiChatMessages)
      .where(eq(aiChatMessages.sessionId, sessionId))
      .orderBy(aiChatMessages.createdAt);
  }

  async getAiChatMessage(id: number): Promise<AiChatMessage | undefined> {
    const result = await db
      .select()
      .from(aiChatMessages)
      .where(eq(aiChatMessages.id, id))
      .limit(1);
    return result[0];
  }

  async deleteAiChatMessage(id: number): Promise<boolean> {
    const result = await db
      .delete(aiChatMessages)
      .where(eq(aiChatMessages.id, id));
    return result.rowCount > 0;
  }

  // Media Collection operations
  async createMediaCollection(collectionData: InsertMediaCollection): Promise<MediaCollection> {
    const result = await db.insert(mediaCollections).values(collectionData).returning();
    return result[0];
  }

  async getMediaCollection(id: number): Promise<MediaCollection | undefined> {
    const [collection] = await db
      .select()
      .from(mediaCollections)
      .where(eq(mediaCollections.id, id));
    return collection;
  }

  async getMediaCollectionBySlug(slug: string): Promise<MediaCollection | undefined> {
    const [collection] = await db
      .select()
      .from(mediaCollections)
      .where(eq(mediaCollections.slug, slug));
    return collection;
  }

  async getAllMediaCollections(options?: { visibility?: string; isActive?: boolean }): Promise<MediaCollection[]> {
    let query = db.select().from(mediaCollections);
    
    if (options?.visibility) {
      query = query.where(eq(mediaCollections.visibility, options.visibility));
    }
    if (options?.isActive !== undefined) {
      query = query.where(eq(mediaCollections.isActive, options.isActive));
    }
    
    return await query;
  }

  async updateMediaCollection(id: number, collectionData: Partial<InsertMediaCollection>): Promise<MediaCollection | undefined> {
    const result = await db
      .update(mediaCollections)
      .set(collectionData)
      .where(eq(mediaCollections.id, id))
      .returning();
    return result[0];
  }

  async deleteMediaCollection(id: number): Promise<boolean> {
    const result = await db
      .delete(mediaCollections)
      .where(eq(mediaCollections.id, id));
    return result.rowCount > 0;
  }

  // Media Asset operations  
  async createMediaAsset(assetData: InsertMediaAsset): Promise<MediaAsset> {
    const result = await db.insert(mediaAssets).values(assetData).returning();
    const asset = result[0];
    
    // Add URL fields for frontend display
    return {
      ...asset,
      url: `/uploads/${asset.storageKey}`,
      thumbnailUrl: `/uploads/${asset.storageKey}` // Use same URL for thumbnail for now
    } as MediaAsset & { url: string; thumbnailUrl: string };
  }

  async getMediaAsset(id: number): Promise<MediaAsset | undefined> {
    const [asset] = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id));
      
    if (!asset) return undefined;
    
    // Add URL fields for frontend display
    return {
      ...asset,
      url: `/uploads/${asset.storageKey}`,
      thumbnailUrl: `/uploads/${asset.storageKey}` // Use same URL for thumbnail for now
    } as MediaAsset & { url: string; thumbnailUrl: string };
  }

  async getMediaAssetsByCollectionId(collectionId: number, options?: { isPublished?: boolean; limit?: number; offset?: number }): Promise<MediaAsset[]> {
    let query = db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.collectionId, collectionId));
    
    if (options?.isPublished !== undefined) {
      query = query.where(eq(mediaAssets.isPublished, options.isPublished));
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    const assets = await query;
    
    // Add URL fields for frontend display
    return assets.map(asset => ({
      ...asset,
      url: `/uploads/${asset.storageKey}`,
      thumbnailUrl: `/uploads/${asset.storageKey}` // Use same URL for thumbnail for now  
    })) as (MediaAsset & { url: string; thumbnailUrl: string })[];
  }

  async updateMediaAsset(id: number, assetData: Partial<InsertMediaAsset>): Promise<MediaAsset | undefined> {
    const result = await db
      .update(mediaAssets)
      .set({ ...assetData, updatedAt: new Date() })
      .where(eq(mediaAssets.id, id))
      .returning();
    return result[0];
  }

  async deleteMediaAsset(id: number): Promise<boolean> {
    const result = await db
      .delete(mediaAssets)
      .where(eq(mediaAssets.id, id));
    return result.rowCount > 0;
  }

  async incrementAssetViewCount(id: number): Promise<boolean> {
    const result = await db
      .update(mediaAssets)
      .set({ 
        viewCount: sql`${mediaAssets.viewCount} + 1`,
        lastViewedAt: new Date()
      })
      .where(eq(mediaAssets.id, id));
    return result.rowCount > 0;
  }

  // Media Access Log operations
  async createMediaAccessLog(logData: InsertMediaAccessLog): Promise<MediaAccessLog> {
    const result = await db.insert(mediaAccessLogs).values(logData).returning();
    return result[0];
  }

  async getMediaAccessLogsByAssetId(assetId: number, limit: number = 100): Promise<MediaAccessLog[]> {
    return await db
      .select()
      .from(mediaAccessLogs)
      .where(eq(mediaAccessLogs.assetId, assetId))
      .limit(limit)
      .orderBy(desc(mediaAccessLogs.createdAt));
  }

  async getMediaAccessLogsByUserId(userId: number, limit: number = 100): Promise<MediaAccessLog[]> {
    return await db
      .select()
      .from(mediaAccessLogs)
      .where(eq(mediaAccessLogs.userId, userId))
      .limit(limit)
      .orderBy(desc(mediaAccessLogs.createdAt));
  }

  // Music Mix operations
  async getMusicMix(id: number): Promise<MusicMix | undefined> {
    const [mix] = await db
      .select()
      .from(musicMixes)
      .where(eq(musicMixes.id, id));
    return mix;
  }

  async getAllMusicMixes(): Promise<MusicMix[]> {
    return await db
      .select()
      .from(musicMixes)
      .orderBy(desc(musicMixes.displayOrder), desc(musicMixes.createdAt));
  }

  async getPublishedMusicMixes(): Promise<MusicMix[]> {
    return await db
      .select()
      .from(musicMixes)
      .where(eq(musicMixes.isPublished, true))
      .orderBy(desc(musicMixes.displayOrder), desc(musicMixes.createdAt));
  }

  async createMusicMix(mixData: InsertMusicMix): Promise<MusicMix> {
    const result = await db.insert(musicMixes).values(mixData).returning();
    return result[0];
  }

  async updateMusicMix(id: number, mixData: Partial<InsertMusicMix>): Promise<MusicMix | undefined> {
    const result = await db
      .update(musicMixes)
      .set({ ...mixData, updatedAt: new Date() })
      .where(eq(musicMixes.id, id))
      .returning();
    return result[0];
  }

  async deleteMusicMix(id: number): Promise<boolean> {
    const result = await db
      .delete(musicMixes)
      .where(eq(musicMixes.id, id));
    return result.rowCount > 0;
  }

  async getMusicMixPurchase(userId: number, mixId: number): Promise<MusicMixPurchase | undefined> {
    const [purchase] = await db
      .select()
      .from(musicMixPurchases)
      .where(and(
        eq(musicMixPurchases.userId, userId),
        eq(musicMixPurchases.mixId, mixId)
      ));
    return purchase;
  }

  async createMusicMixPurchase(purchaseData: InsertMusicMixPurchase): Promise<MusicMixPurchase> {
    const result = await db.insert(musicMixPurchases).values(purchaseData).returning();
    return result[0];
  }

  async incrementMusicMixDownloadCount(purchaseId: number): Promise<void> {
    await db
      .update(musicMixPurchases)
      .set({ downloadCount: sql`${musicMixPurchases.downloadCount} + 1` })
      .where(eq(musicMixPurchases.id, purchaseId));
  }

  // Passport Profile operations
  async getPassportProfile(userId: number): Promise<PassportProfile | undefined> {
    const [profile] = await db
      .select()
      .from(passportProfiles)
      .where(eq(passportProfiles.userId, userId));
    return profile;
  }

  async getPassportProfileByHandle(handle: string): Promise<PassportProfile | undefined> {
    const [profile] = await db
      .select()
      .from(passportProfiles)
      .where(eq(passportProfiles.handle, handle));
    return profile;
  }

  async createPassportProfile(profileData: InsertPassportProfile): Promise<PassportProfile> {
    const [profile] = await db
      .insert(passportProfiles)
      .values({
        ...profileData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return profile;
  }

  async updatePassportProfile(userId: number, data: Partial<InsertPassportProfile>): Promise<PassportProfile | undefined> {
    const [profile] = await db
      .update(passportProfiles)
      .set({ 
        ...data,
        updatedAt: new Date()
      })
      .where(eq(passportProfiles.userId, userId))
      .returning();
    return profile;
  }

  async addPointsToProfile(userId: number, points: number): Promise<PassportProfile | undefined> {
    const [profile] = await db
      .update(passportProfiles)
      .set({ 
        totalPoints: sql`${passportProfiles.totalPoints} + ${points}`,
        updatedAt: new Date()
      })
      .where(eq(passportProfiles.userId, userId))
      .returning();
    return profile;
  }

  // Passport Stamp operations
  async getPassportStamp(id: number): Promise<PassportStamp | undefined> {
    const [stamp] = await db
      .select()
      .from(passportStamps)
      .where(eq(passportStamps.id, id));
    return stamp;
  }

  async getPassportStampsByUserId(userId: number, limit?: number): Promise<PassportStamp[]> {
    let query = db
      .select()
      .from(passportStamps)
      .where(eq(passportStamps.userId, userId))
      .orderBy(desc(passportStamps.createdAt));
    
    if (limit) {
      query = query.limit(limit) as any;
    }
    
    return await query;
  }

  async getPassportStampsByEventId(eventId: number): Promise<PassportStamp[]> {
    return await db
      .select()
      .from(passportStamps)
      .where(eq(passportStamps.eventId, eventId))
      .orderBy(desc(passportStamps.createdAt));
  }

  async getPassportStampByUserAndEvent(userId: number, eventId: number): Promise<PassportStamp | undefined> {
    const [stamp] = await db
      .select()
      .from(passportStamps)
      .where(and(
        eq(passportStamps.userId, userId),
        eq(passportStamps.eventId, eventId)
      ));
    return stamp;
  }

  async createPassportStamp(stampData: InsertPassportStamp): Promise<PassportStamp> {
    const [stamp] = await db
      .insert(passportStamps)
      .values(stampData)
      .returning();
    return stamp;
  }

  async getStampCountByCountry(userId: number, countryCode: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(passportStamps)
      .where(and(
        eq(passportStamps.userId, userId),
        eq(passportStamps.countryCode, countryCode)
      ));
    return result[0]?.count || 0;
  }

  async getStampCountByCarnival(userId: number, carnivalCircuit: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(passportStamps)
      .where(and(
        eq(passportStamps.userId, userId),
        eq(passportStamps.carnivalCircuit, carnivalCircuit)
      ));
    return result[0]?.count || 0;
  }

  // Passport Tier operations
  async getPassportTier(name: string): Promise<PassportTier | undefined> {
    const [tier] = await db
      .select()
      .from(passportTiers)
      .where(eq(passportTiers.name, name));
    return tier;
  }

  async getAllPassportTiers(): Promise<PassportTier[]> {
    return await db
      .select()
      .from(passportTiers)
      .orderBy(passportTiers.minPoints);
  }

  async createPassportTier(tierData: InsertPassportTier): Promise<PassportTier> {
    const [tier] = await db
      .insert(passportTiers)
      .values(tierData)
      .returning();
    return tier;
  }

  async updatePassportTier(name: string, data: Partial<InsertPassportTier>): Promise<PassportTier | undefined> {
    const [tier] = await db
      .update(passportTiers)
      .set(data)
      .where(eq(passportTiers.name, name))
      .returning();
    return tier;
  }

  // Passport Reward operations
  async getPassportReward(id: number): Promise<PassportReward | undefined> {
    const [reward] = await db
      .select()
      .from(passportRewards)
      .where(eq(passportRewards.id, id));
    return reward;
  }

  async getPassportRewardsByUserId(userId: number, status?: string): Promise<PassportReward[]> {
    let query = db
      .select()
      .from(passportRewards)
      .where(eq(passportRewards.userId, userId));
    
    if (status) {
      query = query.where(eq(passportRewards.status, status)) as any;
    }
    
    return await query.orderBy(desc(passportRewards.createdAt));
  }

  async createPassportReward(rewardData: InsertPassportReward): Promise<PassportReward> {
    const [reward] = await db
      .insert(passportRewards)
      .values(rewardData)
      .returning();
    return reward;
  }

  async updatePassportReward(id: number, data: Partial<InsertPassportReward>): Promise<PassportReward | undefined> {
    const [reward] = await db
      .update(passportRewards)
      .set(data)
      .where(eq(passportRewards.id, id))
      .returning();
    return reward;
  }

  async redeemPassportReward(id: number): Promise<PassportReward | undefined> {
    const [reward] = await db
      .update(passportRewards)
      .set({ 
        status: 'REDEEMED',
        redeemedAt: new Date()
      })
      .where(eq(passportRewards.id, id))
      .returning();
    return reward;
  }

  // Passport Mission operations
  async getPassportMission(id: number): Promise<PassportMission | undefined> {
    const [mission] = await db
      .select()
      .from(passportMissions)
      .where(eq(passportMissions.id, id));
    return mission;
  }

  async getAllPassportMissions(isActive?: boolean): Promise<PassportMission[]> {
    let query = db
      .select()
      .from(passportMissions);
    
    if (isActive !== undefined) {
      query = query.where(eq(passportMissions.isActive, isActive)) as any;
    }
    
    return await query.orderBy(desc(passportMissions.createdAt));
  }

  async createPassportMission(missionData: InsertPassportMission): Promise<PassportMission> {
    const [mission] = await db
      .insert(passportMissions)
      .values({
        ...missionData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return mission;
  }

  async updatePassportMission(id: number, data: Partial<InsertPassportMission>): Promise<PassportMission | undefined> {
    const [mission] = await db
      .update(passportMissions)
      .set({ 
        ...data,
        updatedAt: new Date()
      })
      .where(eq(passportMissions.id, id))
      .returning();
    return mission;
  }

  async getPassportLandingStats(): Promise<{ totalPassportUsers: number; totalStampsIssued: number }> {
    const [userCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(passportProfiles)
      .where(gt(passportProfiles.totalPoints, 0));
    
    const [stampCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(passportStamps);
    
    return {
      totalPassportUsers: userCount?.count || 0,
      totalStampsIssued: stampCount?.count || 0
    };
  }

  async createPromoter(promoterData: InsertPromoter): Promise<Promoter> {
    const [promoter] = await db
      .insert(promoters)
      .values({
        ...promoterData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return promoter;
  }

  async getPromoterByUserId(userId: number): Promise<Promoter | undefined> {
    const [promoter] = await db
      .select()
      .from(promoters)
      .where(eq(promoters.userId, userId));
    return promoter;
  }

  async getPromoter(id: number): Promise<Promoter | undefined> {
    const [promoter] = await db
      .select()
      .from(promoters)
      .where(eq(promoters.id, id));
    return promoter;
  }

  async createPassportMembership(membershipData: InsertPassportMembership): Promise<PassportMembership> {
    const [membership] = await db
      .insert(passportMemberships)
      .values({
        ...membershipData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return membership;
  }

  async getPassportMembershipByUserId(userId: number): Promise<PassportMembership | undefined> {
    const [membership] = await db
      .select()
      .from(passportMemberships)
      .where(eq(passportMemberships.userId, userId))
      .orderBy(desc(passportMemberships.createdAt))
      .limit(1);
    return membership;
  }
}

export const storage = new DatabaseStorage();

// Enhanced ticket database synchronization utilities
export class TicketDatabaseSync {
  // Comprehensive ticket database synchronization system
  static async syncTicketDatabases(): Promise<void> {
    try {
      console.log('Starting comprehensive ticket database synchronization...');
      
      // 1. Verify all ticket-event relationships and fix remaining quantities
      await db.execute(sql`
        UPDATE tickets 
        SET remaining_quantity = CASE 
          WHEN remaining_quantity IS NULL THEN quantity 
          ELSE remaining_quantity 
        END 
        WHERE remaining_quantity IS NULL AND quantity IS NOT NULL
      `);
      
      // 2. Sync ticket purchase counts with actual inventory
      await db.execute(sql`
        UPDATE tickets 
        SET remaining_quantity = GREATEST(0, 
          quantity - COALESCE((
            SELECT COUNT(*) 
            FROM ticket_purchases tp 
            WHERE tp.ticket_id = tickets.id 
            AND tp.status IN ('confirmed', 'valid')
          ), 0)
        )
        WHERE quantity IS NOT NULL
      `);
      
      // 3. Ensure all ticket purchases have valid QR codes
      await db.execute(sql`
        UPDATE ticket_purchases 
        SET qr_code_data = CONCAT('EVENT-', event_id, '-ORDER-', 
          CASE 
            WHEN order_id IS NULL THEN 'FREE'
            ELSE order_id::text
          END, 
          '-', EXTRACT(EPOCH FROM NOW())::bigint)
        WHERE qr_code_data IS NULL OR qr_code_data = ''
      `);
      
      // 4. Update ticket status based on inventory (preserve hidden status)
      await db.execute(sql`
        UPDATE tickets 
        SET status = CASE 
          WHEN remaining_quantity <= 0 THEN 'sold_out'
          WHEN remaining_quantity > 0 AND status = 'sold_out' THEN 'on_sale'
          ELSE status
        END
        WHERE remaining_quantity IS NOT NULL
      `);
      
      console.log('Ticket database synchronization completed successfully');
    } catch (error) {
      console.error('Error during ticket database synchronization:', error);
      throw error;
    }
  }

  // Real-time ticket inventory management
  static async updateTicketInventory(ticketId: number, quantityChange: number): Promise<void> {
    try {
      await db
        .update(tickets)
        .set({
          remainingQuantity: sql`GREATEST(0, COALESCE(${tickets.remainingQuantity}, ${tickets.quantity}) + ${sql.param(quantityChange)})`,
          updatedAt: new Date()
        })
        .where(eq(tickets.id, ticketId));
        
      // Update status based on new inventory
      await db
        .update(tickets)
        .set({
          status: sql`CASE 
            WHEN remaining_quantity <= 0 THEN 'sold_out'
            WHEN remaining_quantity > 0 AND status = 'sold_out' THEN 'on_sale'
            ELSE status
          END`
        })
        .where(eq(tickets.id, ticketId));
    } catch (error) {
      console.error('Error updating ticket inventory:', error);
      throw error;
    }
  }

  // Site-wide ticket status validation
  static async validateTicketSystemIntegrity(): Promise<{ valid: boolean; issues: string[] }> {
    try {
      const issues: string[] = [];
      
      // Check for orphaned records
      const orphanedPurchases = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM ticket_purchases tp
        LEFT JOIN events e ON tp.event_id = e.id
        WHERE e.id IS NULL
      `);
      
      if (Number(orphanedPurchases.rows[0]?.count) > 0) {
        issues.push(`${orphanedPurchases.rows[0]?.count} ticket purchases with invalid events`);
      }
      
      // Check for negative inventory
      const negativeInventory = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM tickets
        WHERE remaining_quantity < 0
      `);
      
      if (Number(negativeInventory.rows[0]?.count) > 0) {
        issues.push(`${negativeInventory.rows[0]?.count} tickets with negative inventory`);
      }
      
      // Check for duplicate QR codes
      const duplicateQRCodes = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM (
          SELECT qr_code_data
          FROM ticket_purchases
          GROUP BY qr_code_data
          HAVING COUNT(*) > 1
        ) duplicates
      `);
      
      if (Number(duplicateQRCodes.rows[0]?.count) > 0) {
        issues.push(`${duplicateQRCodes.rows[0]?.count} duplicate QR codes found`);
      }
      
      return {
        valid: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('Error validating ticket system integrity:', error);
      return {
        valid: false,
        issues: ['Failed to validate ticket system integrity']
      };
    }
  }

  // Cross-database ticket data reconciliation
  static async reconcileTicketData(): Promise<void> {
    try {
      // Reconcile ticket purchases with scan records
      await db.execute(sql`
        UPDATE ticket_purchases 
        SET 
          scanned = CASE WHEN scan_count > 0 THEN true ELSE false END,
          scan_count = COALESCE((
            SELECT COUNT(*) 
            FROM ticket_scans ts 
            WHERE ts.ticket_id = ticket_purchases.ticket_id 
            AND ts.order_id = ticket_purchases.order_id
          ), 0)
        WHERE ticket_id IS NOT NULL
      `);
      
      // Update first and last scan timestamps
      await db.execute(sql`
        UPDATE ticket_purchases 
        SET 
          first_scan_at = (
            SELECT MIN(scanned_at) 
            FROM ticket_scans ts 
            WHERE ts.ticket_id = ticket_purchases.ticket_id 
            AND ts.order_id = ticket_purchases.order_id
          ),
          last_scan_at = (
            SELECT MAX(scanned_at) 
            FROM ticket_scans ts 
            WHERE ts.ticket_id = ticket_purchases.ticket_id 
            AND ts.order_id = ticket_purchases.order_id
          )
        WHERE ticket_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM ticket_scans ts 
          WHERE ts.ticket_id = ticket_purchases.ticket_id 
          AND ts.order_id = ticket_purchases.order_id
        )
      `);
      
      console.log('Ticket data reconciliation completed');
    } catch (error) {
      console.error('Error reconciling ticket data:', error);
      throw error;
    }
  }
}
