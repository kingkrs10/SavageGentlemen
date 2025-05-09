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
import crypto from "crypto";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { sendEmail, sendTicketEmail, sendOrderConfirmation, sendAdminNotification, sendWelcomeEmail, sendPasswordResetEmail } from "./email";
import { analyticsRouter } from "./analytics-routes";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16", // Will update when appropriate
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
  
  // Register analytics router
  router.use("/analytics", analyticsRouter);
  
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
    
    console.log("Authorization check - user:", user);
    
    if (!user) {
      console.log("Authorization failed: No user found in request");
      return res.status(403).json({ message: "Admin access required - No user found" });
    }
    
    if (user.role !== 'admin') {
      console.log(`Authorization failed: User role is ${user.role}, not admin`);
      return res.status(403).json({ message: `Admin access required - Current role: ${user.role}` });
    }
    
    console.log("Authorization successful: User is admin");
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
      
      // Send welcome email if email is provided
      if (userData.email) {
        try {
          await sendWelcomeEmail(
            user.displayName || user.username, 
            userData.email
          );
          
          // Notify admin about new registration
          await sendAdminNotification(
            'New User Registration',
            `A new user has registered on the platform.`,
            {
              Username: user.username,
              Email: userData.email,
              DisplayName: user.displayName || 'Not provided',
              RegistrationTime: new Date().toLocaleString()
            }
          );
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Continue with the registration process even if email fails
        }
      }
      
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
        let isNewUser = false;
        
        if (!user) {
          // If user doesn't exist, create a new one
          user = await storage.createUser({
            username: existingUsername,
            password: `firebase_${Date.now()}`, // Random password since auth is handled by Firebase
            displayName: displayName,
            avatar: photoURL,
            isGuest: false,
            email: email
          });
          isNewUser = true;
        }
        
        // Send welcome email if this is a new user and we have their email
        if (isNewUser && email) {
          try {
            await sendWelcomeEmail(
              user.displayName || user.username, 
              email
            );
            
            // Notify admin about new registration
            await sendAdminNotification(
              'New User Registration (Firebase)',
              `A new user has registered via Firebase.`,
              {
                Username: user.username,
                Email: email,
                DisplayName: user.displayName || 'Not provided',
                FirebaseUID: firebaseUid,
                RegistrationTime: new Date().toLocaleString()
              }
            );
          } catch (emailError) {
            console.error('Failed to send welcome email for Firebase user:', emailError);
            // Continue with the auth process even if email fails
          }
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
  
  // Password Reset Routes
  // Step 1: Request password reset - generates a token and sends an email
  router.post("/auth/password-reset/request", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal if email exists for security
        return res.status(200).json({ message: "If your email is registered, you will receive a reset link" });
      }
      
      // Generate reset token (64 bytes = 128 hex characters)
      const resetToken = crypto.randomBytes(64).toString('hex');
      const resetExpiry = new Date(Date.now() + 3600000); // Token valid for 1 hour
      
      // Store the token in the database
      await storage.storePasswordResetToken(user.id, resetToken, resetExpiry);
      
      // Create reset link
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://yourdomain.com' // Update this with your domain after deployment
        : `${req.protocol}://${req.get('host')}`;
      
      const resetUrl = `${baseUrl}/password-reset?token=${resetToken}`;
      
      // Send reset email
      const emailSent = await sendPasswordResetEmail(
        user.displayName || user.username,
        email,
        resetUrl
      );
      
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send password reset email" });
      }
      
      return res.status(200).json({ message: "Password reset link sent to your email" });
    } catch (err) {
      console.error("Password reset request error:", err);
      return res.status(500).json({ message: "An error occurred while processing your request" });
    }
  });
  
  // Step 2: Verify and process password reset
  router.post("/auth/password-reset/reset", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }
      
      // Verify token
      const resetRequest = await storage.getPasswordResetToken(token);
      
      if (!resetRequest || !resetRequest.userId) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      // Check if token is expired
      if (new Date() > new Date(resetRequest.expiresAt)) {
        await storage.deletePasswordResetToken(token);
        return res.status(400).json({ message: "Password reset token has expired" });
      }
      
      // Update the user's password
      await storage.updateUserPassword(resetRequest.userId, password);
      
      // Delete the used token
      await storage.deletePasswordResetToken(token);
      
      // Log the password change
      const user = await storage.getUser(resetRequest.userId);
      await sendAdminNotification(
        'Password Reset Completed',
        `A user has successfully reset their password.`,
        {
          Username: user?.username || 'Unknown',
          Email: user?.email || 'Unknown',
          ResetTime: new Date().toLocaleString()
        }
      );
      
      return res.status(200).json({ message: "Password has been reset successfully" });
    } catch (err) {
      console.error("Password reset error:", err);
      return res.status(500).json({ message: "An error occurred while resetting your password" });
    }
  });

  // Events routes
  router.get("/events", async (req: Request, res: Response) => {
    try {
      // Use real data from database
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
  
  // User tickets routes
  router.get("/user/tickets", authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const purchasedTickets = await storage.getTicketPurchasesByUserId(userId);
      
      // Enhance ticket data with event information
      const enhancedTickets = await Promise.all(
        purchasedTickets.map(async (ticket) => {
          const event = await storage.getEvent(ticket.eventId);
          return {
            ...ticket,
            event: event || { title: "Unknown Event", date: new Date(), location: "Unknown" }
          };
        })
      );
      
      return res.status(200).json(enhancedTickets);
    } catch (err) {
      console.error("Error fetching user tickets:", err);
      return res.status(500).json({ message: "Failed to retrieve your tickets" });
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
  
  // Livestream management
  router.post("/admin/livestreams", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const livestreamData = insertLivestreamSchema.parse(req.body);
      const livestream = await storage.createLivestream(livestreamData);
      return res.status(201).json(livestream);
    } catch (err) {
      console.error("Error creating livestream:", err);
      return handleZodError(err, res);
    }
  });
  
  router.put("/admin/livestreams/:id", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const livestream = await storage.getLivestream(id);
      
      if (!livestream) {
        return res.status(404).json({ message: "Livestream not found" });
      }
      
      const updatedLivestream = await storage.updateLivestream(id, req.body);
      return res.status(200).json(updatedLivestream);
    } catch (err) {
      console.error("Error updating livestream:", err);
      return handleZodError(err, res);
    }
  });
  
  router.put("/admin/livestreams/:id/toggle-status", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const livestream = await storage.getLivestream(id);
      
      if (!livestream) {
        return res.status(404).json({ message: "Livestream not found" });
      }
      
      const updatedLivestream = await storage.updateLivestream(id, {
        isLive: !livestream.isLive
      });
      
      return res.status(200).json(updatedLivestream);
    } catch (err) {
      console.error("Error toggling livestream status:", err);
      return res.status(500).json({ message: "Failed to update livestream status" });
    }
  });
  
  router.delete("/admin/livestreams/:id", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLivestream(id);
      return res.status(204).send();
    } catch (err) {
      console.error("Error deleting livestream:", err);
      return res.status(500).json({ message: "Failed to delete livestream" });
    }
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
  
  // Inventory Management Endpoints
  
  // Update product stock level
  router.post("/admin/products/:id/stock", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { newStockLevel, changeType, reason } = req.body;
      
      if (typeof newStockLevel !== 'number' || newStockLevel < 0) {
        return res.status(400).json({ message: "Invalid stock level" });
      }
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const updatedProduct = await storage.updateProductStock(
        id, 
        newStockLevel, 
        changeType || 'manual_update', 
        userId,
        reason
      );
      
      return res.status(200).json(updatedProduct);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to update stock level" });
    }
  });
  
  // Update variant stock level
  router.post("/admin/variants/:id/stock", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { newStockLevel, changeType, reason } = req.body;
      
      if (typeof newStockLevel !== 'number' || newStockLevel < 0) {
        return res.status(400).json({ message: "Invalid stock level" });
      }
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const updatedVariant = await storage.updateVariantStock(
        id, 
        newStockLevel, 
        changeType || 'manual_update', 
        userId,
        reason
      );
      
      return res.status(200).json(updatedVariant);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to update variant stock level" });
    }
  });
  
  // Get inventory history for a product
  router.get("/admin/products/:id/inventory-history", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const history = await storage.getInventoryHistoryByProduct(id);
      return res.status(200).json(history);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch inventory history" });
    }
  });
  
  // Get inventory history for a variant
  router.get("/admin/variants/:id/inventory-history", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const history = await storage.getInventoryHistoryByVariant(id);
      return res.status(200).json(history);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch variant inventory history" });
    }
  });
  
  // Get recent inventory changes (for dashboard)
  router.get("/admin/inventory/recent-changes", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const history = await storage.getRecentInventoryChanges(limit);
      return res.status(200).json(history);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch recent inventory changes" });
    }
  });
  
  // Get low stock products
  router.get("/admin/products/inventory/low-stock", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : undefined;
      const products = await storage.getLowStockProducts(threshold);
      return res.status(200).json(products);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch low stock products" });
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
      // Manually convert date string to Date object before validation
      const requestData = req.body;
      if (requestData.date && typeof requestData.date === 'string') {
        requestData.date = new Date(requestData.date);
      }
      
      // Now parse with the schema
      const eventData = insertEventSchema.parse(requestData);
      const event = await storage.createEvent(eventData);
      return res.status(201).json(event);
    } catch (err) {
      console.error("Event creation error:", err);
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

      // Manually convert date string to Date object if it exists
      const requestData = req.body;
      if (requestData.date && typeof requestData.date === 'string') {
        requestData.date = new Date(requestData.date);
      }
      
      // Now update the event with the processed data
      const updatedEvent = await storage.updateEvent(id, requestData);
      return res.status(200).json(updatedEvent);
    } catch (err) {
      console.error("Event update error:", err);
      return res.status(500).json({ message: "Failed to update event" });
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
  
  // Get all tickets in the admin dashboard
  router.get("/admin/tickets", async (req: Request, res: Response) => {
    try {
      // Use real data from database
      const tickets = await storage.getAllTickets();
      return res.status(200).json(tickets);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
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
  
  // Update ticket
  router.put("/admin/tickets/:id", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      const updatedTicket = await storage.updateTicket(ticketId, req.body);
      if (!updatedTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      return res.status(200).json(updatedTicket);
    } catch (err) {
      console.error("Error updating ticket:", err);
      return res.status(500).json({ message: "Failed to update ticket" });
    }
  });
  
  // Toggle ticket status
  router.put("/admin/tickets/:id/toggle-status", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      const ticket = await storage.getTicket(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const updatedTicket = await storage.updateTicket(ticketId, { 
        isActive: !ticket.isActive 
      });
      
      return res.status(200).json(updatedTicket);
    } catch (err) {
      console.error("Error toggling ticket status:", err);
      return res.status(500).json({ message: "Failed to toggle ticket status" });
    }
  });
  
  // Ticket validation endpoint for QR code scanner
  router.post("/admin/tickets/validate", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const { ticketId, orderId } = req.body;
      
      if (!ticketId || !orderId) {
        return res.status(400).json({ message: "Ticket ID and Order ID are required" });
      }
      
      // Check if ticket exists
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ 
          isValid: false,
          status: "invalid",
          message: "Ticket not found" 
        });
      }
      
      // Get event information
      const event = await storage.getEvent(ticket.eventId);
      if (!event) {
        return res.status(404).json({ 
          isValid: false,
          status: "invalid",
          message: "Event not found" 
        });
      }
      
      // Get order information
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ 
          isValid: false,
          status: "invalid",
          message: "Order not found" 
        });
      }
      
      // Check if the ticket has been scanned before
      const previousScans = await storage.getTicketScansByTicketId(ticketId);
      
      if (previousScans.length > 0) {
        // Ticket has been scanned before
        return res.status(200).json({
          ticketId,
          orderId,
          eventName: event.title,
          ticketName: ticket.name,
          holderName: "Attendee", // This would ideally come from the order information
          isValid: false,
          status: "already_used",
          scannedAt: previousScans[0].scannedAt
        });
      }
      
      // If we get here, the ticket is valid and hasn't been scanned before
      // Create a new ticket scan record
      const adminId = (req as any).user?.id || null;
      
      const ticketScan = await storage.createTicketScan({
        ticketId,
        orderId,
        scannedBy: adminId,
        status: "valid",
        scannedAt: new Date()
      });
      
      return res.status(200).json({
        ticketId,
        orderId,
        eventName: event.title,
        ticketName: ticket.name,
        holderName: "Attendee", // This would ideally come from the order information
        isValid: true,
        status: "valid",
        scannedAt: ticketScan.scannedAt
      });
    } catch (err) {
      console.error("Error validating ticket:", err);
      return res.status(500).json({ 
        isValid: false,
        status: "error",
        message: "Failed to validate ticket" 
      });
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
  router.get("/admin/orders", async (req: Request, res: Response) => {
    try {
      // Use real data from database
      const orders = await storage.getAllOrders();
      return res.status(200).json(orders);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // User management
  router.get("/admin/users", async (req: Request, res: Response) => {
    try {
      // Use real data from database
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
      
      // Get the current user before updating
      const currentUser = (req as any).user;
      const userBeforeUpdate = await storage.getUser(id);
      
      if (!userBeforeUpdate) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't allow changing your own role (to prevent locking yourself out)
      if (currentUser.id === id) {
        return res.status(403).json({ message: "You cannot change your own role" });
      }
      
      // Only proceed if the role is actually changing
      if (userBeforeUpdate.role === role) {
        return res.status(200).json({ 
          message: `User already has role: ${role}`,
          user: userBeforeUpdate
        });
      }
      
      // Update the user's role
      const updatedUser = await storage.updateUserRole(id, role);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Failed to update user role" });
      }
      
      // Send notification to admin about the role change
      await sendAdminNotification(
        'User Role Changed',
        `A user's role has been updated from ${userBeforeUpdate.role || 'user'} to ${role}.`,
        {
          UserID: id,
          Username: userBeforeUpdate.username,
          PreviousRole: userBeforeUpdate.role || 'user',
          NewRole: role,
          ChangedBy: currentUser.username,
          ChangeTime: new Date().toLocaleString()
        }
      );
      
      // If user has an email, notify them about the role change
      if (userBeforeUpdate.email) {
        try {
          const subject = `Your account role has been updated`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #c01c28;">Account Role Update</h2>
              <p>Hello ${userBeforeUpdate.displayName || userBeforeUpdate.username},</p>
              <p>Your account role on the Savage Gentlemen platform has been updated from <strong>${userBeforeUpdate.role || 'user'}</strong> to <strong>${role}</strong>.</p>
              ${role === 'admin' ? `
                <p>As an admin, you now have access to:</p>
                <ul>
                  <li>Admin dashboard</li>
                  <li>User management</li>
                  <li>Content management</li>
                  <li>System settings</li>
                </ul>
              ` : ''}
              ${role === 'moderator' ? `
                <p>As a moderator, you now have access to:</p>
                <ul>
                  <li>Comment moderation</li>
                  <li>Content moderation</li>
                  <li>User reports</li>
                </ul>
              ` : ''}
              <p>If you have any questions about this change, please contact support.</p>
              <p>Thank you,<br>Savage Gentlemen Team</p>
            </div>
          `;
          
          await sendEmail({
            to: userBeforeUpdate.email,
            subject,
            html
          });
        } catch (emailError) {
          console.error('Failed to send role change notification email:', emailError);
          // Continue with the role update even if email fails
        }
      }
      
      return res.status(200).json({
        id: updatedUser.id,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        role: updatedUser.role,
        message: `User role updated to ${role}`
      });
    } catch (err) {
      console.error("Error updating user role:", err);
      return res.status(500).json({ message: "Failed to update user role" });
    }
  });
  
  router.delete("/admin/users/:id", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent deletion of the current user
      const currentUser = (req as any).user;
      if (id === currentUser.id) {
        return res.status(400).json({ message: "Cannot delete yourself" });
      }
      
      // Store user info before deletion for the notification
      const deletedUserInfo = {
        id: user.id,
        username: user.username,
        displayName: user.displayName || 'Not provided',
        email: user.email || 'Not provided',
        role: user.role || 'user'
      };
      
      // Delete the user
      await storage.deleteUser(id);
      
      // Send notification to admin about the deletion
      await sendAdminNotification(
        'User Account Deleted',
        `A user account has been deleted from the platform.`,
        {
          UserID: deletedUserInfo.id,
          Username: deletedUserInfo.username,
          DisplayName: deletedUserInfo.displayName,
          Email: deletedUserInfo.email,
          Role: deletedUserInfo.role,
          DeletedBy: currentUser.username,
          DeletionTime: new Date().toLocaleString()
        }
      );
      
      return res.status(204).send();
    } catch (err) {
      console.error("Error deleting user:", err);
      return res.status(500).json({ message: "Failed to delete user" });
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

  // PayPal payment routes
  router.get("/payment/paypal-setup", async (req: Request, res: Response) => {
    await loadPaypalDefault(req, res);
  });
  
  router.post("/payment/paypal-order", async (req: Request, res: Response) => {
    await createPaypalOrder(req, res);
  });
  
  router.post("/payment/paypal-order/:orderID/capture", async (req: Request, res: Response) => {
    await capturePaypalOrder(req, res);
  });
  
  // Endpoint to email ticket QR code to customer
  router.post("/tickets/email", async (req: Request, res: Response) => {
    try {
      const { 
        ticketId, 
        orderId, 
        email, 
        eventName, 
        eventDate,
        eventLocation,
        ticketName, 
        ticketPrice,
        holderName,
        qrCodeDataUrl
      } = req.body;
      
      if (!ticketId || !orderId || !email || !eventName || !qrCodeDataUrl) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          required: "ticketId, orderId, email, eventName, qrCodeDataUrl" 
        });
      }
      
      console.log(`Processing ticket email for ticketId ${ticketId}, orderId ${orderId} to ${email}`);
      
      // Format the ticket info for the email
      const ticketInfo = {
        eventName,
        eventDate: eventDate ? new Date(eventDate) : new Date(),
        eventLocation: eventLocation || "Venue to be announced",
        ticketId,
        ticketType: ticketName || "General Admission",
        ticketPrice: ticketPrice || 0,
        purchaseDate: new Date(),
        qrCodeDataUrl
      };
      
      // Send the ticket email using our email service
      const emailSent = await sendTicketEmail(ticketInfo, email);
      
      if (emailSent) {
        // Also notify admin about the ticket purchase
        await sendAdminNotification(
          "New Ticket Purchase", 
          `A new ticket has been purchased and the confirmation email was sent to ${email}`,
          {
            TicketID: ticketId,
            OrderID: orderId,
            Event: eventName,
            Purchaser: email,
            HolderName: holderName,
            PurchaseTime: new Date().toLocaleString()
          }
        );
        
        return res.status(200).json({ 
          success: true,
          message: `Ticket confirmation sent to ${email}`
        });
      } else {
        throw new Error("Failed to send email");
      }
    } catch (err) {
      console.error("Error sending ticket email:", err);
      return res.status(500).json({ message: "Failed to send ticket email" });
    }
  });
  
  // Endpoint to get PayPal order details for the payment success page
  router.get("/payment/paypal-order/:orderID/details", async (req: Request, res: Response) => {
    try {
      const { orderID } = req.params;
      
      // In a real app, you would fetch the order from your database
      // For now, we'll return minimal information since the capture already happened
      res.json({
        id: orderID,
        status: "completed",
        amount: req.query.amount || "Payment completed"
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get PayPal order details: " + error.message });
    }
  });
  
  // Stripe payment routes  
  router.post("/payment/create-intent", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { 
        items, 
        amount, 
        currency = "usd",
        eventId,
        eventTitle
      } = req.body;
      
      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }
      
      // Build metadata object with all relevant information
      const metadata: Record<string, string> = {
        items: JSON.stringify(items || [])
      };
      
      // Add event information to metadata if provided
      if (eventId) {
        metadata.eventId = eventId.toString();
      }
      
      if (eventTitle) {
        metadata.eventTitle = eventTitle;
      }
      
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata,
      });
      
      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      return res.status(500).json({ 
        message: error.message || "Error creating payment intent" 
      });
    }
  });
  
  // Get or create a customer's subscription
  router.post("/payment/get-or-create-subscription", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      // Check if the user already has a subscription
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          
          return res.status(200).json({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
            status: subscription.status,
          });
        } catch (error) {
          console.log("Previous subscription not found, creating a new one");
        }
      }
      
      // Create or get the customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: user.displayName || user.username,
          metadata: {
            userId: user.id.toString(),
          },
        });
        
        customerId = customer.id;
        await storage.updateStripeCustomerId(user.id, customerId);
      }
      
      // Define the subscription price ID (must be created in the Stripe dashboard)
      const priceId = process.env.STRIPE_PRICE_ID;
      
      if (!priceId) {
        return res.status(400).json({ message: "Stripe price ID not configured" });
      }
      
      // Create the subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: priceId,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Store the subscription ID on the user
      // Note: you would typically also update the user with stripe subscription ID
      
      return res.status(200).json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      return res.status(500).json({ 
        message: error.message || "Error creating subscription" 
      });
    }
  });
  
  // Webhook to handle Stripe events (payment success, subscription updates, etc.)
  router.post("/payment/stripe-webhook", express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
      return res.status(400).send('Webhook secret not configured');
    }
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
        
        try {
          // Get customer email from payment intent
          const customerId = paymentIntent.customer;
          if (customerId) {
            const customer = await stripe.customers.retrieve(customerId as string);
            if (customer && !customer.deleted) {
              const items = paymentIntent.metadata?.items ? JSON.parse(paymentIntent.metadata.items) : [];
              const email = customer.email;
              
              // Check if this is an event ticket purchase
              const eventId = paymentIntent.metadata?.eventId ? parseInt(paymentIntent.metadata.eventId) : null;
              const eventTitle = paymentIntent.metadata?.eventTitle || null;
              
              if (email) {
                // Create order record
                const order = await storage.createOrder({
                  userId: customer.metadata?.userId ? parseInt(customer.metadata.userId) : 0,
                  totalAmount: paymentIntent.amount / 100,
                  status: 'completed',
                  paymentMethod: 'stripe',
                  paymentId: paymentIntent.id
                });
                
                // If this is an event ticket purchase, create a ticket record
                if (eventId) {
                  try {
                    // Get the event info
                    const event = await storage.getEvent(eventId);
                    
                    if (event) {
                      // Create ticket record
                      const ticketData = {
                        orderId: order.id,
                        eventId: eventId,
                        status: 'valid',
                        userId: order.userId,
                        purchaseDate: new Date(),
                        qrCodeData: `EVENT-${eventId}-ORDER-${order.id}-${Date.now()}`,
                        ticketType: 'standard'
                      };
                      
                      const ticket = await storage.createTicketPurchase(ticketData);
                      
                      // Send ticket email with QR code
                      await sendTicketEmail({
                        ticketId: ticket.id,
                        qrCodeData: ticket.qrCodeData,
                        eventName: event.title,
                        eventLocation: event.location,
                        eventDate: event.date,
                        ticketType: ticket.ticketType,
                        price: (paymentIntent.amount / 100).toFixed(2),
                        purchaseDate: new Date()
                      }, email);
                    }
                  } catch (err) {
                    console.error('Error creating ticket record:', err);
                  }
                } else {
                  // For non-ticket purchases, send regular order confirmation
                  await sendOrderConfirmation({
                    orderId: paymentIntent.id,
                    orderDate: new Date(paymentIntent.created * 1000),
                    items: items.map((item: any) => ({
                      name: item.name || 'Product',
                      quantity: item.quantity || 1,
                      price: item.price || (paymentIntent.amount / 100)
                    })),
                    totalAmount: paymentIntent.amount / 100
                  }, email);
                }
                
                // Notify admins about the successful payment
                await sendAdminNotification(
                  'New Successful Payment',
                  `Payment for order ${paymentIntent.id} was successful.`,
                  {
                    Amount: `$${(paymentIntent.amount / 100).toFixed(2)}`,
                    Customer: email,
                    PaymentId: paymentIntent.id,
                    PaymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
                    ...(eventId ? { EventId: eventId.toString(), EventTitle: eventTitle } : {})
                  }
                );
              }
            }
          }
        } catch (error) {
          console.error('Error handling payment success webhook:', error);
        }
        break;
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        // Update subscription status and send confirmation email
        try {
          const subscription = invoice.subscription;
          const customerId = invoice.customer;
          
          if (customerId) {
            const customer = await stripe.customers.retrieve(customerId as string);
            if (customer && !customer.deleted && customer.email) {
              // Send subscription confirmation email
              // This would use a subscription-specific email template
              await sendAdminNotification(
                'New Subscription Payment',
                `Subscription ${subscription} payment was successful.`,
                {
                  Customer: customer.email,
                  Amount: `$${(invoice.total / 100).toFixed(2)}`,
                  SubscriptionId: subscription
                }
              );
            }
          }
        } catch (error) {
          console.error('Error handling subscription payment success webhook:', error);
        }
        break;
        
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        
        try {
          const customerId = subscription.customer;
          const status = subscription.status;
          
          if (customerId) {
            const customer = await stripe.customers.retrieve(customerId as string);
            if (customer && !customer.deleted && customer.email) {
              // Notify admin about subscription status change
              await sendAdminNotification(
                `Subscription ${event.type === 'customer.subscription.deleted' ? 'Cancelled' : 'Updated'}`,
                `Subscription ${subscription.id} status changed to ${status}.`,
                {
                  Customer: customer.email,
                  Status: status,
                  SubscriptionId: subscription.id
                }
              );
            }
          }
        } catch (error) {
          console.error('Error handling subscription update webhook:', error);
        }
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    // Return a 200 response to acknowledge receipt of the event
    return res.status(200).json({ received: true });
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
