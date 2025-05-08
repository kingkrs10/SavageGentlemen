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
  DiscountCode,
  InsertDiscountCode,
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  MediaUpload,
  InsertMediaUpload,
  users,
  events,
  products,
  livestreams,
  posts,
  comments,
  chatMessages,
  tickets,
  discountCodes,
  orders,
  orderItems,
  mediaUploads
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gt, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  
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
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getTicketsByEventId(eventId: number): Promise<Ticket[]>;
  
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

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async getFeaturedEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).filter(event => event.featured);
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
    const livestream: Livestream = {
      id,
      title: livestreamData.title,
      streamDate: livestreamData.streamDate,
      description: livestreamData.description || null,
      thumbnailUrl: livestreamData.thumbnailUrl || null,
      isLive: livestreamData.isLive || false,
      streamUrl: livestreamData.streamUrl || null,
      hostName: livestreamData.hostName || null
    };
    this.livestreams.set(id, livestream);
    return livestream;
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
  async createTicket(ticketData: InsertTicket): Promise<Ticket> {
    const id = this.ticketCurrentId++;
    const createdAt = new Date();
    const ticket: Ticket = { 
      ...ticketData,
      id,
      createdAt,
      isUsed: false 
    };
    this.tickets.set(id, ticket);
    return ticket;
  }
  
  async getTicketsByEventId(eventId: number): Promise<Ticket[]> {
    return Array.from(this.tickets.values())
      .filter(ticket => ticket.eventId === eventId);
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

  // Initialize with sample data
  private initializeSampleData(): void {
    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      displayName: "Admin",
      avatar: "https://i.pravatar.cc/150?img=1",
      isGuest: false
    });

    // Create events
    const eventData: InsertEvent[] = [
      {
        title: "Beach Vibes Party",
        description: "Join us for the hottest beach party with live DJs and Caribbean vibes.",
        date: new Date("2023-08-12T20:00:00"),
        location: "Miami Beach",
        price: 4500, // $45.00
        imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7",
        category: "party",
        featured: true
      },
      {
        title: "Carnival Warmup",
        description: "Get ready for carnival season with our special pre-event celebration.",
        date: new Date("2023-09-05T21:00:00"),
        location: "Fort Lauderdale",
        price: 3500, // $35.00
        imageUrl: "https://images.unsplash.com/photo-1535083783855-76ae62b2914e",
        category: "festival",
        featured: true
      },
      {
        title: "Summer Beach Party",
        description: "Join us for a day of sun, sand, and soca beats at our annual beach party!",
        date: new Date("2023-08-20T15:00:00"),
        location: "South Beach, Miami",
        price: 5000, // $50.00
        imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3",
        category: "party",
        featured: false
      },
      {
        title: "Island Vibes",
        description: "Experience the best of Caribbean music with our special guest DJs!",
        date: new Date("2023-09-05T22:00:00"),
        location: "Club Azul, Orlando",
        price: 3500, // $35.00
        imageUrl: "https://pixabay.com/get/g92cd5469507e9b4d7a2b7f93bd80674d2e4e17493ea314d421c81acf2f56b47a6ce6dbc0c00455622f8518ad01eb4446de59c38c97a1513f393f27406257b74f_1280.jpg",
        category: "party",
        featured: false
      },
      {
        title: "Caribbean Culture Festival",
        description: "A full day celebration of Caribbean culture with food, music, and performances!",
        date: new Date("2023-10-15T12:00:00"),
        location: "City Park, Fort Lauderdale",
        price: 7500, // $75.00
        imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
        category: "festival",
        featured: true
      },
      {
        title: "Caribbean Festival 2023",
        description: "The biggest celebration of Caribbean culture",
        date: new Date("2023-10-15T14:00:00"),
        location: "Miami Beach",
        price: 8000, // $80.00
        imageUrl: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec",
        category: "festival",
        featured: true
      }
    ];

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

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async getAllProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.featured, true));
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
}

export const storage = new DatabaseStorage();
