import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertEventSchema, 
  insertProductSchema, 
  insertLivestreamSchema, 
  insertPostSchema, 
  insertCommentSchema,
  insertChatMessageSchema,
  insertMediaUploadSchema,
  insertTicketSchema,
  insertDiscountCodeSchema,
  insertOrderSchema,
  insertOrderItemSchema
} from "@shared/schema";
import { ZodError } from "zod";
import admin from "firebase-admin";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import fs from "fs";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Multer storage configuration for file uploads
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Initialize Firebase Admin
try {
  // Initialize without credentials for now - we'll use token verification only
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
  console.log('Firebase Admin initialized');
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix for all routes
  const router = express.Router();
  app.use("/api", router);
  
  // Create uploads directory for media files if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Serve uploaded files
  app.use('/uploads', express.static(uploadsDir));
  
  // Authentication middleware
  const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const id = parseInt(userId as string);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Add user to request object
      (req as any).user = user;
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(500).json({ message: "Authentication error" });
    }
  };
  
  // Admin authorization middleware
  const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  };
  
  // Moderator authorization middleware
  const authorizeModerator = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return res.status(403).json({ message: "Moderator access required" });
    }
    
    next();
  };

  // Error handling middleware for validation errors
  const handleZodError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      const errorMessages = err.errors.map(error => ({
        path: error.path.join('.'),
        message: error.message
      }));
      return res.status(400).json({ errors: errorMessages });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  };

  // Auth routes
  router.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      return res.status(200).json({ 
        id: user.id, 
        username: user.username, 
        displayName: user.displayName,
        avatar: user.avatar,
        isGuest: user.isGuest
      });
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  router.post("/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      return res.status(201).json({ 
        id: user.id, 
        username: user.username, 
        displayName: user.displayName,
        avatar: user.avatar,
        isGuest: user.isGuest
      });
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  router.post("/auth/guest", async (req: Request, res: Response) => {
    try {
      const guestId = `guest-${Date.now()}`;
      const user = await storage.createUser({
        username: guestId,
        password: guestId,
        isGuest: true,
        displayName: `Guest-${Math.floor(Math.random() * 1000)}`
      });
      
      return res.status(201).json({ 
        id: user.id, 
        username: user.username, 
        displayName: user.displayName,
        isGuest: user.isGuest
      });
    } catch (err) {
      return handleZodError(err, res);
    }
  });
  
  // Firebase authentication endpoint
  router.post("/auth/firebase", async (req: Request, res: Response) => {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ message: "ID token is required" });
      }
      
      try {
        // Verify the ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decodedToken.uid;
        const email = decodedToken.email || '';
        const displayName = decodedToken.name || email.split('@')[0];
        const photoURL = decodedToken.picture || null;
        
        // Check if the user already exists in our database
        const existingUsername = `firebase_${firebaseUid}`;
        let user = await storage.getUserByUsername(existingUsername);
        
        if (!user) {
          // If user doesn't exist, create a new one
          user = await storage.createUser({
            username: existingUsername,
            password: `firebase_${Date.now()}`, // Random password since auth is handled by Firebase
            displayName: displayName,
            avatar: photoURL,
            isGuest: false
          });
        }
        
        return res.status(200).json({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          isGuest: user.isGuest
        });
      } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        return res.status(401).json({ message: "Invalid ID token" });
      }
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  // Events routes
  router.get("/events", async (req: Request, res: Response) => {
    try {
      const events = await storage.getAllEvents();
      return res.status(200).json(events);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  router.get("/events/featured", async (req: Request, res: Response) => {
    try {
      const events = await storage.getFeaturedEvents();
      return res.status(200).json(events);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  router.get("/events/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      return res.status(200).json(event);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Products routes
  router.get("/products", async (req: Request, res: Response) => {
    try {
      const products = await storage.getAllProducts();
      return res.status(200).json(products);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  router.get("/products/featured", async (req: Request, res: Response) => {
    try {
      const products = await storage.getFeaturedProducts();
      return res.status(200).json(products);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  router.get("/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      return res.status(200).json(product);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Livestreams routes
  router.get("/livestreams", async (req: Request, res: Response) => {
    try {
      const livestreams = await storage.getAllLivestreams();
      return res.status(200).json(livestreams);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  router.get("/livestreams/current", async (req: Request, res: Response) => {
    try {
      const livestream = await storage.getCurrentLivestream();
      return res.status(200).json(livestream || null);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  router.get("/livestreams/upcoming", async (req: Request, res: Response) => {
    try {
      const livestreams = await storage.getUpcomingLivestreams();
      return res.status(200).json(livestreams);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Posts routes
  router.get("/posts", async (req: Request, res: Response) => {
    try {
      const posts = await storage.getAllPosts();
      return res.status(200).json(posts);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  router.post("/posts", async (req: Request, res: Response) => {
    try {
      const postData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(postData);
      return res.status(201).json(post);
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  // Comments routes
  router.get("/posts/:postId/comments", async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);
      const comments = await storage.getCommentsByPostId(postId);
      return res.status(200).json(comments);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  router.post("/comments", async (req: Request, res: Response) => {
    try {
      const commentData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(commentData);
      return res.status(201).json(comment);
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  // Add single product
  router.post("/products/add-product", async (req: Request, res: Response) => {
    try {
      // Black Roses Unisex Flannel Shirt
      const product = {
        title: "Black Roses Unisex Flannel Shirt",
        description: "Stylish Black Roses Unisex Flannel Shirt, perfect for any casual occasion.",
        price: 4999, // $49.99
        imageUrl: "https://i.etsystatic.com/17162514/r/il/fb40bd/5763089644/il_794xN.5763089644_lxgy.jpg",
        category: "shirts",
        sizes: ["S", "M", "L", "XL", "2XL"],
        featured: true,
        etsyUrl: "https://www.etsy.com/listing/1805910132/black-roses-unisex-flannel-shirt"
      };
      
      const savedProduct = await storage.createProduct(product);
      
      return res.status(201).json({
        message: "Added new product to the database",
        product: savedProduct
      });
    } catch (err) {
      console.error("Error adding product:", err);
      return res.status(500).json({ message: "Failed to add product" });
    }
  });
  
  // Admin routes
  // These routes require authentication and admin authorization
  
  // Get current admin user
  router.get("/admin/me", authenticateUser, authorizeAdmin, (req: Request, res: Response) => {
    const user = (req as any).user;
    return res.status(200).json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      role: user.role,
      email: user.email
    });
  });
  
  // Product management
  router.post("/admin/products", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      return res.status(201).json(product);
    } catch (err) {
      return handleZodError(err, res);
    }
  });
  
  router.put("/admin/products/:id", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Assuming updateProduct method exists in storage
      const updatedProduct = await storage.updateProduct(id, req.body);
      return res.status(200).json(updatedProduct);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  router.delete("/admin/products/:id", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      // Assuming deleteProduct method exists in storage
      await storage.deleteProduct(id);
      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Media uploads
  router.post("/admin/uploads", authenticateUser, authorizeAdmin, upload.single('file'), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const userId = (req as any).user.id;
      
      // Create a relative URL to the file
      const fileUrl = `/uploads/${file.filename}`;
      
      // Create a record in the database
      const mediaUpload = await storage.createMediaUpload({
        userId,
        url: fileUrl,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        relatedEntityType: req.body.relatedEntityType,
        relatedEntityId: req.body.relatedEntityId ? parseInt(req.body.relatedEntityId) : undefined
      });
      
      return res.status(201).json({
        message: "File uploaded successfully",
        file: mediaUpload
      });
    } catch (err) {
      console.error("Error uploading file:", err);
      return res.status(500).json({ message: "Failed to upload file" });
    }
  });
  
  // Event management
  router.post("/admin/events", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      return res.status(201).json(event);
    } catch (err) {
      return handleZodError(err, res);
    }
  });
  
  router.put("/admin/events/:id", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Assuming updateEvent method exists in storage
      const updatedEvent = await storage.updateEvent(id, req.body);
      return res.status(200).json(updatedEvent);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  router.delete("/admin/events/:id", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      // Assuming deleteEvent method exists in storage
      await storage.deleteEvent(id);
      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Ticket management
  router.post("/admin/tickets", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const ticketData = insertTicketSchema.parse(req.body);
      // Assuming createTicket method exists in storage
      const ticket = await storage.createTicket(ticketData);
      return res.status(201).json(ticket);
    } catch (err) {
      return handleZodError(err, res);
    }
  });
  
  router.get("/admin/tickets/event/:eventId", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      // Assuming getTicketsByEventId method exists in storage
      const tickets = await storage.getTicketsByEventId(eventId);
      return res.status(200).json(tickets);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Discount codes
  router.post("/admin/discount-codes", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const discountData = insertDiscountCodeSchema.parse(req.body);
      // Assuming createDiscountCode method exists in storage
      const discountCode = await storage.createDiscountCode(discountData);
      return res.status(201).json(discountCode);
    } catch (err) {
      return handleZodError(err, res);
    }
  });
  
  // Orders management
  router.get("/admin/orders", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      // Assuming getAllOrders method exists in storage
      const orders = await storage.getAllOrders();
      return res.status(200).json(orders);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // User management
  router.get("/admin/users", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      // Assuming getAllUsers method exists in storage
      const users = await storage.getAllUsers();
      return res.status(200).json(users);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  router.post("/admin/users", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      return res.status(201).json({ 
        id: user.id, 
        username: user.username, 
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        email: user.email
      });
    } catch (err) {
      return handleZodError(err, res);
    }
  });
  
  router.put("/admin/users/:id/role", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { role } = req.body;
      
      if (!role || !['user', 'moderator', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      // Assuming updateUserRole method exists in storage
      const user = await storage.updateUserRole(id, role);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add product initialization for SGX Merch Etsy shop
  router.post("/products/init-etsy", async (req: Request, res: Response) => {
    try {
      // SGX Merch Etsy shop items
      const etsyProducts = [
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
          title: "SG Fly Sweatshirt",
          description: "Unisex SG Fly Sweatshirt in Black",
          price: 4999, // $49.99
          imageUrl: "https://i.etsystatic.com/17162514/r/il/6a3c83/5894452402/il_794xN.5894452402_rbtu.jpg",
          category: "hoodies",
          sizes: ["S", "M", "L", "XL", "2XL"],
          featured: true,
          etsyUrl: "https://www.etsy.com/listing/4316150547/sg-fly-sweatshirt"
        },
        {
          title: "SG X Maracas Crop Hoodie",
          description: "Women's SG X Maracas Crop Hoodie in Black",
          price: 4499, // $44.99
          imageUrl: "https://i.etsystatic.com/17162514/r/il/bb60fa/5877683809/il_794xN.5877683809_acyp.jpg",
          category: "hoodies",
          sizes: ["S", "M", "L", "XL"],
          featured: true,
          etsyUrl: "https://www.etsy.com/listing/4298499741/sg-x-maracas-crop-hoodie"
        },
        {
          title: "Soca SG Music Hoodie",
          description: "Soca SG Music Hoodie in Black",
          price: 4999, // $49.99
          imageUrl: "https://i.etsystatic.com/17162514/r/il/5a8dbd/5846190986/il_794xN.5846190986_1uqp.jpg",
          category: "hoodies",
          sizes: ["S", "M", "L", "XL", "2XL"],
          featured: true,
          etsyUrl: "https://www.etsy.com/listing/4316161947/soca-sg-music-hoodie"
        },
        {
          title: "Black Roses Unisex Flannel Shirt",
          description: "Stylish Black Roses Unisex Flannel Shirt, perfect for any casual occasion.",
          price: 4999, // $49.99
          imageUrl: "https://i.etsystatic.com/17162514/r/il/fb40bd/5763089644/il_794xN.5763089644_lxgy.jpg",
          category: "shirts",
          sizes: ["S", "M", "L", "XL", "2XL"],
          featured: true,
          etsyUrl: "https://www.etsy.com/listing/1805910132/black-roses-unisex-flannel-shirt"
        },
        {
          title: "SG Logo Dad Hat",
          description: "SG Logo Dad Hat in Black",
          price: 2999, // $29.99
          imageUrl: "https://i.etsystatic.com/17162514/r/il/27dda1/5877695073/il_794xN.5877695073_bvmq.jpg",
          category: "hats",
          sizes: ["One Size"],
          featured: false,
          etsyUrl: "https://www.etsy.com/listing/4281853037/sg-logo-dad-hat"
        }
      ];

      // Store each product
      const savedProducts = [];
      for (const product of etsyProducts) {
        try {
          const savedProduct = await storage.createProduct(product);
          savedProducts.push(savedProduct);
        } catch (error) {
          console.error(`Error saving product ${product.title}:`, error);
        }
      }

      return res.status(201).json({
        message: `Initialized ${savedProducts.length} products from SGX Merch Etsy shop`,
        products: savedProducts
      });
    } catch (err) {
      console.error("Error initializing Etsy products:", err);
      return res.status(500).json({ message: "Failed to initialize Etsy products" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket Server on the same HTTP server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket connection event handler
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        if (data.type === 'chat-message') {
          const messageData = {
            userId: data.userId,
            livestreamId: data.livestreamId,
            content: data.content
          };
          
          const chatMessage = await storage.createChatMessage(messageData);
          
          // Broadcast to all clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'chat-message',
                message: chatMessage
              }));
            }
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  return httpServer;
}
