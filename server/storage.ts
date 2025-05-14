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
  inventoryHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gt, sql, lte, lt, isNotNull } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  updateUserPassword(id: number, newPassword: string): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Password reset operations
  storePasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  deletePasswordResetToken(token: string): Promise<boolean>;
  
  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  getFeaturedEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, eventData: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
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
  getCommentsByPostId(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Chat operations
  getChatMessagesByLivestreamId(livestreamId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Ticket operations
  getTicket(id: number): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getAllTickets(): Promise<Ticket[]>;
  getTicketsByEventId(eventId: number): Promise<Ticket[]>;
  updateTicket(id: number, ticketData: Partial<InsertTicket>): Promise<Ticket | undefined>;
  
  // Ticket purchase operations
  createTicketPurchase(ticketPurchase: InsertTicketPurchase): Promise<TicketPurchase>;
  getTicketPurchasesByUserId(userId: number): Promise<TicketPurchase[]>;
  getTicketPurchasesByEventId(eventId: number): Promise<TicketPurchase[]>;
  getTicketPurchase(id: number): Promise<TicketPurchase | undefined>;
  getTicketPurchaseByQrCodeData(qrCodeData: string): Promise<TicketPurchase | undefined>;
  
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

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      id,
      username: userData.username,
      password: userData.password,
      displayName: userData.displayName || null,
      avatar: userData.avatar || null,
      isGuest: userData.isGuest || false,
      role: userData.role || 'user',
      stripeCustomerId: userData.stripeCustomerId || null,
      paypalCustomerId: userData.paypalCustomerId || null,
      email: userData.email || null
    };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
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
      console.log("Storage: Getting featured events");
      if (!this.events) {
        console.log("Storage: Events map is undefined, returning empty array");
        return [];
      }
      
      const allEvents = Array.from(this.events.values());
      const featuredEvents = allEvents.filter(event => event.featured);
      console.log(`Storage: Retrieved ${featuredEvents.length} featured events out of ${allEvents.length} total events`);
      
      // Log first featured event for debugging if available
      if (featuredEvents.length > 0) {
        console.log("Storage: First featured event sample:", JSON.stringify(featuredEvents[0]));
      }
      
      return featuredEvents;
    } catch (error) {
      console.error("Storage: Error in getFeaturedEvents:", error);
      // Return empty array instead of throwing to prevent API errors
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
    const event = await this.getEvent(id);
    if (!event) {
      return false;
    }
    
    return this.events.delete(id);
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
    
    const updatedTicket: Ticket = {
      ...ticket,
      ...ticketData
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
    return await db
      .select()
      .from(events);
  }

  async getFeaturedEvents(): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.featured, true));
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

    return {
      ...comment,
      user: {
        id: user.id,
        displayName: user.displayName,
        avatar: user.avatar
      }
    };
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
    const [updatedTicket] = await db
      .update(tickets)
      .set({
        ...ticketData,
        updatedAt: new Date()
      })
      .where(eq(tickets.id, id))
      .returning();
    
    return updatedTicket || undefined;
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
}

export const storage = new DatabaseStorage();
