import express, { type Express, Request, Response, NextFunction } from "express";
import { User } from "@shared/schema";

// Extend the Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  registrationSchema,
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
  insertOrderItemSchema,
  insertSponsoredContentSchema,
  loginSchema
} from "@shared/schema";
import { validateRequest, authRateLimiter } from "./security/middleware";
import { ZodError } from "zod";
import { admin, verifyFirebaseToken } from "./firebase";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { sendEmail, sendTicketEmail, sendOrderConfirmation, sendAdminNotification, sendWelcomeEmail, sendPasswordResetEmail } from "./email";
import { analyticsRouter } from "./analytics-routes";
import { emailMarketingRouter } from "./email-marketing-routes";
import { registerSocialRoutes } from "./social-routes";
import { registerEnhancedTicketingRoutes } from "./enhanced-ticketing-routes";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  appInfo: { 
    name: 'SGX Media',
    version: '1.0.0',
    url: 'https://sgxmedia.com'
  }
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

// Firebase Admin is already initialized in server/firebase.ts
// Import the configured admin instance from there

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix for all routes
  const router = express.Router();
  app.use("/api", router);
  
  // Register analytics router
  router.use("/analytics", analyticsRouter);
  
  // Register social and enhanced ticketing routes
  registerSocialRoutes(app);
  registerEnhancedTicketingRoutes(app);
  
  // Create uploads directory for media files if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Serve uploaded files
  app.use('/uploads', express.static(uploadsDir));
  
  // Authentication middleware
  const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    // Try Authorization header first (for production)
    const authHeader = req.headers['authorization'];
    let userId = req.headers['user-id'];
    let user = null;
    
    console.log("Authenticating request:", {
      path: req.path,
      userId: userId,
      hasAuthHeader: !!authHeader
    });
    
    // If we have an Authorization header, try to validate it
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // Get the token
        const token = authHeader.split(' ')[1];
        
        // Verify using Firebase Admin (if token exists)
        if (token && token !== 'undefined' && token !== 'null') {
          try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            console.log("Firebase token verified:", decodedToken.uid);
            
            // Look up user by firebase uid
            const userByFirebase = await storage.getUserByFirebaseId(decodedToken.uid);
            if (userByFirebase) {
              user = userByFirebase;
              console.log("User authenticated via Firebase token:", user.id);
            }
          } catch (fbError) {
            console.error("Firebase token verification failed:", fbError);
          }
        }
      } catch (tokenError) {
        console.error("Error processing auth token:", tokenError);
      }
    }
    
    // If we couldn't authenticate via token, try user-id header as fallback
    if (!user && userId) {
      try {
        const id = parseInt(userId as string);
        user = await storage.getUser(id);
        
        if (user) {
          console.log("User authenticated via user-id header:", user.id);
        }
      } catch (userIdError) {
        console.error("Error authenticating with user-id:", userIdError);
      }
    }
    
    // Try to use x-user-data header as another fallback
    if (!user && req.headers['x-user-data']) {
      try {
        const userData = JSON.parse(req.headers['x-user-data'] as string);
        
        if (userData && userData.id) {
          // Get the user from storage to ensure this is a real user
          const userFromStorage = await storage.getUser(userData.id);
          
          if (userFromStorage) {
            user = userFromStorage;
            console.log("User authenticated via x-user-data header:", user.id);
          }
        }
      } catch (xUserDataError) {
        console.error("Error authenticating with x-user-data:", xUserDataError);
      }
    }
    
    // If we still don't have a user, authentication failed
    if (!user) {
      console.log("Authentication failed for request:", req.path);
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Add user to request object
    req.user = user;
    next();
  };
  
  // Endpoint to check if user is logged in (for session validation)
  router.get("/me", async (req: Request, res: Response) => {
    try {
      let user = null;
      
      // Try user-id header first
      const userId = req.headers['user-id'];
      if (userId) {
        try {
          const id = parseInt(userId as string);
          user = await storage.getUser(id);
          if (user) {
            console.log("User found via user-id header in /me endpoint:", user.id);
          }
        } catch (e) {
          console.error("Error retrieving user by ID:", e);
        }
      }
      
      // Try token authentication if user-id failed
      if (!user) {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          
          if (token && token !== 'undefined' && token !== 'null') {
            try {
              // Try Firebase token
              const decodedToken = await admin.auth().verifyIdToken(token);
              const userByFirebase = await storage.getUserByFirebaseId(decodedToken.uid);
              
              if (userByFirebase) {
                user = userByFirebase;
                console.log("User found via Firebase token in /me endpoint:", user.id);
              }
            } catch (e) {
              console.error("Error verifying Firebase token:", e);
            }
          }
        }
      }
      
      // Try x-user-data as a last resort
      if (!user && req.headers['x-user-data']) {
        try {
          const userData = JSON.parse(req.headers['x-user-data'] as string);
          
          if (userData && userData.id) {
            // Get the user from storage to ensure this is a real user
            const userFromStorage = await storage.getUser(userData.id);
            
            if (userFromStorage) {
              user = userFromStorage;
              console.log("User found via x-user-data header in /me endpoint:", user.id);
            }
          }
        } catch (e) {
          console.error("Error parsing x-user-data:", e);
        }
      }
      
      // If no user found through any method, return authentication failure
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Generate a new token for API authentication
      const token = Buffer.from(`${user.id}:${user.username}:${Date.now()}`).toString('base64');
      
      // Return user information without sensitive data
      return res.status(200).json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        isGuest: user.isGuest,
        role: user.role,
        token: token
      });
    } catch (error) {
      console.error("Error in /me endpoint:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Admin authorization middleware
  const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
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
    const user = req.user;
    
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

  // Auth routes with rate limiting and validation
  router.post(
    "/auth/login", 
    authRateLimiter, 
    validateRequest(loginSchema), 
    async (req: Request, res: Response) => {
      try {
        // The data is already validated by the middleware
        const { username, password } = req.body;
        
        // Add a small delay to prevent timing attacks that could
        // expose whether a username exists or not
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
        
        const user = await storage.getUserByUsername(username);
        
        if (!user || user.password !== password) {
          return res.status(401).json({ 
            status: 'error',
            message: "Invalid username or password" 
          });
        }
        
        // Log successful logins for audit purposes
        console.log(`[AUTH] Successful login: ${username} from IP ${req.ip || req.socket.remoteAddress || 'unknown'}`);
        
        // Generate a simple token for additional authentication
        const token = Buffer.from(`${user.id}:${user.username}:${Date.now()}`).toString('base64');
        
        return res.status(200).json({ 
          status: 'success',
          data: {
            id: user.id, 
            username: user.username, 
            displayName: user.displayName,
            avatar: user.avatar,
            isGuest: user.isGuest,
            role: user.role,
            token: token // Include token in the response
          }
        });
      } catch (err) {
        return handleZodError(err, res);
      }
    }
  );

  router.post(
    "/auth/register", 
    authRateLimiter,
    validateRequest(registrationSchema),
    async (req: Request, res: Response) => {
      try {
        // The data is already validated by the middleware
        const userData = req.body;
        
        // Check for existing username
        const existingUser = await storage.getUserByUsername(userData.username);
        
        if (existingUser) {
          return res.status(409).json({ 
            status: 'error',
            message: "Username already exists" 
          });
        }
        
        // Check for existing email if provided
        if (userData.email) {
          const existingEmail = await storage.getUserByEmail(userData.email);
          if (existingEmail) {
            return res.status(409).json({ 
              status: 'error',
              message: "Email already in use" 
            });
          }
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
      
      // Generate authentication token
      const token = Buffer.from(`${user.id}:${user.username}:${Date.now()}`).toString('base64');
      
      return res.status(201).json({ 
        id: user.id, 
        username: user.username, 
        displayName: user.displayName,
        avatar: user.avatar,
        isGuest: user.isGuest,
        role: user.role,
        token: token
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
        displayName: `Guest-${Math.floor(Math.random() * 1000)}`,
        role: 'user' // Explicitly set role for guest users
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
  
  // Firebase authentication endpoint - using our enhanced Firebase utility
  router.post("/auth/firebase", async (req: Request, res: Response) => {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ message: "ID token is required" });
      }
      
      try {
        // Use our enhanced verification function
        const verificationResult = await verifyFirebaseToken(idToken);
        
        if (!verificationResult.success) {
          return res.status(401).json({ 
            message: "Authentication failed", 
            error: verificationResult.error instanceof Error ? verificationResult.error.message : "Token verification failed",
            requestInfo: {
              hasToken: Boolean(idToken),
              tokenLength: idToken ? idToken.length : 0,
              tokenPrefix: idToken ? idToken.substring(0, 10) + '...' : 'none'
            }
          });
        }
        
        // Log successful token verification
        console.log("Firebase token verified successfully for user:", verificationResult.uid);
        
        const firebaseUid = verificationResult.uid;
        const email = verificationResult.email || '';
        const displayName = verificationResult.name || email.split('@')[0] || `User_${Date.now()}`;
        const photoURL = verificationResult.picture || null;
        
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
            email: email,
            role: 'user', // Explicitly set user role for Firebase users
            firebaseId: firebaseUid // Store the Firebase UID for future reference
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
        
        // Generate a secure token for API authentication
        const token = crypto.randomBytes(32).toString('hex');
        
        // Store the token in memory or database if needed for validation later
        
        return res.status(200).json({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          isGuest: user.isGuest,
          role: user.role || 'user',
          token: token
        });
      } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        
        // Provide a more detailed error response with error information when possible
        let errorMessage = "Failed to verify Firebase token";
        
        if (error instanceof Error) {
          errorMessage = error.message;
          console.error('Firebase authentication error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
        
        return res.status(401).json({ 
          message: "Authentication failed", 
          error: errorMessage,
          requestInfo: {
            hasToken: Boolean(idToken),
            tokenLength: idToken ? idToken.length : 0,
            tokenPrefix: idToken ? idToken.substring(0, 10) + '...' : 'none'
          }
        });
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
      console.log(`[PASSWORD RESET] Request received for email: ${email}`);
      
      if (!email) {
        console.log("[PASSWORD RESET] Error: Email is required");
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      console.log(`[PASSWORD RESET] Looking up user by email: ${email}`);
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log(`[PASSWORD RESET] No user found for email: ${email}`);
        // Don't reveal if email exists for security
        return res.status(200).json({ message: "If your email is registered, you will receive a reset link" });
      }
      
      console.log(`[PASSWORD RESET] User found: ${user.username} (ID: ${user.id})`);
      
      // Generate reset token (64 bytes = 128 hex characters)
      const resetToken = crypto.randomBytes(64).toString('hex');
      const resetExpiry = new Date(Date.now() + 3600000); // Token valid for 1 hour
      
      console.log(`[PASSWORD RESET] Generated token for user ${user.id}, expires: ${resetExpiry}`);
      
      // Store the token in the database
      await storage.storePasswordResetToken(user.id, resetToken, resetExpiry);
      console.log(`[PASSWORD RESET] Token stored in database for user ${user.id}`);
      
      // Create reset link
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://yourdomain.com' // Update this with your domain after deployment
        : `${req.protocol}://${req.get('host')}`;
      
      const resetUrl = `${baseUrl}/password-reset?token=${resetToken}`;
      console.log(`[PASSWORD RESET] Reset URL generated: ${resetUrl}`);
      
      // Send reset email
      console.log(`[PASSWORD RESET] Attempting to send email to: ${email}`);
      const emailSent = await sendPasswordResetEmail(
        user.displayName || user.username,
        email,
        resetUrl
      );
      
      if (!emailSent) {
        console.error(`[PASSWORD RESET] Failed to send email to: ${email}`);
        return res.status(500).json({ message: "Failed to send password reset email. Please check if the email service is configured correctly." });
      }
      
      console.log(`[PASSWORD RESET] Email sent successfully to: ${email}`);
      return res.status(200).json({ message: "Password reset link sent to your email" });
    } catch (err) {
      console.error("[PASSWORD RESET] Error:", err);
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
      console.log("Fetching all events...");
      // Use real data from database
      const events = await storage.getAllEvents();
      console.log(`Successfully retrieved ${events?.length || 0} events`);
      return res.status(200).json(events || []);
    } catch (err) {
      console.error("Error fetching all events:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  router.get("/events/featured", async (req: Request, res: Response) => {
    try {
      console.log("Fetching featured events...");
      const events = await storage.getFeaturedEvents();
      console.log(`Successfully retrieved ${events?.length || 0} featured events`);
      return res.status(200).json(events || []);
    } catch (err) {
      console.error("Error fetching featured events:", err);
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
      
      // Get tickets for this event
      const tickets = await storage.getTicketsByEventId(id);
      
      // Return event with its tickets
      return res.status(200).json({
        ...event,
        tickets: tickets || []
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Sponsored Content API Routes (public endpoints first)
  router.get("/sponsored-content", async (req: Request, res: Response) => {
    try {
      const sponsoredContent = await storage.getAllSponsoredContent();
      return res.status(200).json(sponsoredContent);
    } catch (err) {
      console.error("Error fetching sponsored content:", err);
      return res.status(500).json({ message: "Failed to fetch sponsored content" });
    }
  });

  router.get("/sponsored-content/active", async (req: Request, res: Response) => {
    try {
      const sponsoredContent = await storage.getActiveSponsoredContent();
      return res.status(200).json(sponsoredContent);
    } catch (err) {
      console.error("Error fetching active sponsored content:", err);
      return res.status(500).json({ message: "Failed to fetch active sponsored content" });
    }
  });

  router.post("/sponsored-content/:id/click", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementSponsoredContentClicks(id);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Error tracking sponsored content click:", err);
      return res.status(500).json({ message: "Failed to track click" });
    }
  });

  router.post("/sponsored-content/:id/view", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementSponsoredContentViews(id);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Error tracking sponsored content view:", err);
      return res.status(500).json({ message: "Failed to track view" });
    }
  });

  // Admin-only sponsored content routes
  router.post("/admin/sponsored-content", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const sponsoredContentData = insertSponsoredContentSchema.parse({
        ...req.body,
        createdBy: req.user!.id
      });
      const sponsoredContent = await storage.createSponsoredContent(sponsoredContentData);
      return res.status(201).json(sponsoredContent);
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  router.put("/admin/sponsored-content/:id", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const sponsoredContentData = insertSponsoredContentSchema.partial().parse(req.body);
      const sponsoredContent = await storage.updateSponsoredContent(id, sponsoredContentData);
      return res.status(200).json(sponsoredContent);
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  router.delete("/admin/sponsored-content/:id", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSponsoredContent(id);
      return res.status(204).send();
    } catch (err) {
      console.error("Error deleting sponsored content:", err);
      return res.status(500).json({ message: "Failed to delete sponsored content" });
    }
  });

  // User tickets routes
  router.get("/user/tickets", authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
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
  
  // Manual ticket creation endpoint for after successful payment
  router.post("/payment/create-ticket", async (req: Request, res: Response) => {
    try {
      // Get user from request headers if possible
      let userId = req.headers['user-id'];
      
      if (!userId) {
        console.error("No user ID found in create-ticket request");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(parseInt(userId as string));
      if (!user) {
        console.error(`User not found with ID: ${userId}`);
        return res.status(401).json({ message: "Authentication failed - user not found" });
      }
      
      const { 
        eventId, 
        ticketId,
        payment_intent,
        amount,
        currency = "usd",
        paymentMethod = 'stripe'
      } = req.body;
      
      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
      }

      console.log(`Manual ticket creation: Event ID ${eventId}, User ID ${user.id}, Payment ${payment_intent}`);

      // Get the event
      const event = await storage.getEvent(Number(eventId));
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Create an order first
      const order = await storage.createOrder({
        userId: user.id,
        totalAmount: amount || event.price || 0,
        status: 'completed',
        paymentMethod: paymentMethod,
        paymentId: payment_intent || `manual-${Date.now()}`
      });
      
      console.log(`Created order #${order.id} for user ${user.id}, event ${eventId}, ticket ${ticketId || 'default'}`);

      // Determine ticket type
      let selectedTicket = null;
      let ticketType = 'standard';
      let ticketName = 'General Admission';
      
      if (ticketId) {
        try {
          selectedTicket = await storage.getTicket(Number(ticketId));
          if (selectedTicket) {
            ticketType = selectedTicket.type || 'standard';
            ticketName = selectedTicket.name || 'General Admission';
          }
        } catch (err) {
          console.error("Error getting ticket details:", err);
        }
      }
      
      // Generate QR code data
      const qrCodeData = `EVENT-${eventId}-ORDER-${order.id}-USER-${user.id}-${Date.now()}`;
      
      // Create the ticket
      const ticketPurchase = await storage.createTicketPurchase({
        eventId: Number(eventId),
        userId: user.id,
        ticketId: selectedTicket ? Number(ticketId) : null,
        orderId: order.id,
        qrCodeData: qrCodeData,
        status: 'valid',
        price: amount || event.price || 0,
        purchaseDate: new Date(),
        ticketType: ticketType,
        attendeeEmail: user.email || null,
        attendeeName: user.displayName || user.username || null
      });
      
      console.log(`Created ticket purchase #${ticketPurchase.id} for order #${order.id}`);
      
      return res.status(201).json({
        success: true,
        message: "Ticket created successfully",
        ticket: ticketPurchase
      });
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      return res.status(500).json({
        message: error.message || "Error creating ticket"
      });
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
  
  router.delete("/comments/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      // Only admins can delete comments
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized: Admin privileges required" });
      }
      
      const commentId = parseInt(req.params.id);
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }
      
      // Get the comment to find its post ID (needed for decrementing comment count)
      const comment = await storage.getCommentById(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Delete the comment
      await storage.deleteComment(commentId);
      
      // Decrement the post's comment count
      await storage.decrementPostCommentCount(comment.postId);
      
      return res.status(200).json({ message: "Comment deleted successfully" });
    } catch (err) {
      console.error("Error deleting comment:", err);
      return res.status(500).json({ message: "Internal server error" });
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
  
  // Get all users (admin only)
  router.get("/admin/users", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Map users to only send required fields to client
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        email: user.email,
        createdAt: user.createdAt,
        isGuest: user.isGuest
      }));
      
      return res.status(200).json(safeUsers);
    } catch (err) {
      console.error("Error getting users:", err);
      return res.status(500).json({ message: "Failed to retrieve users" });
    }
  });
  
  // Update user role (admin only)
  router.put("/admin/users/:id/role", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;
      
      if (!userId || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      if (!role || !['user', 'admin', 'moderator'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'user', 'admin', or 'moderator'" });
      }
      
      // Prevent changing your own role to prevent lockout
      if (req.user.id === userId) {
        return res.status(403).json({ 
          message: "You cannot change your own role to prevent accidental lockout" 
        });
      }
      
      const updatedUser = await storage.updateUserRole(userId, role);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return safe user object
      return res.status(200).json({
        id: updatedUser.id,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        email: updatedUser.email,
        message: `User role updated to ${role} successfully`
      });
    } catch (err) {
      console.error("Error updating user role:", err);
      return res.status(500).json({ message: "Failed to update user role" });
    }
  });
  
  // Register email marketing router (admin only)
  // We'll use the authenticateUser middleware but not require admin for CSV operations
  // Modified email marketing authentication to allow more fallback options
  router.use("/email-marketing", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Try multiple authentication methods
      // 1. Check for user-id header as primary fallback in all environments
      const userId = req.headers['user-id'];
      
      if (userId) {
        try {
          const id = parseInt(userId as string);
          const user = await storage.getUser(id);
          
          if (user) {
            console.log("User authenticated via user-id header for email marketing routes:", id);
            req.user = user;
            return next();
          }
        } catch (err) {
          console.error("Error with user-id authentication:", err);
        }
      }
      
      // 2. Try standard authentication as secondary option
      return authenticateUser(req, res, next);
    } catch (error) {
      console.error("Error in email marketing auth middleware:", error);
      return res.status(500).json({ message: "Authentication error" });
    }
  }, emailMarketingRouter);
  
  // Check if user has staff permissions (admin or moderator)
  router.get("/staff/me", authenticateUser, authorizeModerator, (req: Request, res: Response) => {
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
  
  // Endpoint to scan tickets at events
  router.post("/tickets/scan", authenticateUser, authorizeModerator, async (req: Request, res: Response) => {
    try {
      const { ticketCode } = req.body;
      
      if (!ticketCode) {
        return res.status(400).json({ message: "Ticket code is required" });
      }
      
      // Log the scan attempt with user info
      console.log(`Ticket scan attempt by ${req.user.username} (${req.user.role}): ${ticketCode}`);
      
      // Use the storage function to scan the ticket
      const scanResult = await storage.scanTicket(ticketCode);
      
      if (!scanResult.valid) {
        return res.status(400).json({ 
          valid: false,
          error: scanResult.error || "Invalid ticket"
        });
      }
      
      // Return scan result with information about the ticket
      return res.status(200).json({
        valid: true,
        alreadyScanned: scanResult.alreadyScanned || false,
        scannedAt: scanResult.scannedAt,
        ticketInfo: scanResult.ticketInfo
      });
    } catch (err) {
      console.error("Error scanning ticket:", err);
      return res.status(500).json({ message: "Failed to scan ticket" });
    }
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
  
  // Media uploads - make sure we use router not app
  router.post("/admin/uploads", upload.single('file'), async (req: Request, res: Response) => {
    try {
      // Check authentication manually since multer needs to run before we access the file
      const userId = req.headers['user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required - No user ID" });
      }
      
      try {
        const id = parseInt(userId as string);
        const user = await storage.getUser(id);
        
        if (!user) {
          return res.status(401).json({ message: `User not found - ID: ${id}` });
        }
        
        // Check if user is admin
        if (user.role !== 'admin') {
          return res.status(403).json({ 
            message: `Admin access required - Current role: ${user.role}` 
          });
        }
        
        const file = req.file;
        
        if (!file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        
        console.log('File uploaded:', file.originalname, 'by user ID:', id);
        
        // Create a relative URL to the file
        const fileUrl = `/uploads/${file.filename}`;
        
        // Create a record in the database
        const mediaUpload = await storage.createMediaUpload({
          userId: id,
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
      } catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({ message: "Authentication error" });
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      return res.status(500).json({ message: "Failed to upload file" });
    }
  });
  
  // Event management
  router.post("/admin/events", authenticateUser, authorizeAdmin, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
  ]), async (req: Request, res: Response) => {
    try {
      // Get the request data
      const requestData = req.body;
      
      // Process uploaded files if present
      if (req.files) {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        // Process main image
        if (files['image'] && files['image'][0]) {
          const mainImage = files['image'][0];
          const mainImagePath = `/uploads/${mainImage.filename}`;
          requestData.imageUrl = mainImagePath;
        }
        
        // Process additional images
        if (files['additionalImages'] && files['additionalImages'].length > 0) {
          const additionalImagePaths = files['additionalImages'].map(
            file => `/uploads/${file.filename}`
          );
          requestData.additionalImages = additionalImagePaths;
        }
      }
      
      // Always ensure date is properly converted to a Date object
      if (requestData.date) {
        try {
          // Handle ISO string format from client
          if (typeof requestData.date === 'string') {
            requestData.date = new Date(requestData.date);
            
            // Verify date is valid
            if (isNaN(requestData.date.getTime())) {
              throw new Error('Invalid date format');
            }
          }
        } catch (error) {
          console.error('Error parsing date:', error, 'Received date:', requestData.date);
          return res.status(400).json({ message: "Invalid date format" });
        }
      }
      
      // Log the date being saved
      console.log(`Creating event with date:`, requestData.date);
      
      // Set price to null if not provided
      if (requestData.price === undefined) {
        requestData.price = null;
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
  
  // Modified endpoint for event updates to add fallback authentication
  router.put("/admin/events/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Try to authenticate via headers first - simple header check for admin page
      const userId = req.headers['user-id'];
      const userData = req.headers['x-user-data'];
      
      if (userId || userData) {
        try {
          let user = null;
          
          // Try user-id header first
          if (userId) {
            const id = parseInt(userId as string);
            user = await storage.getUser(id);
            if (user && user.role === 'admin') {
              console.log("Admin user authenticated via user-id header:", id);
              req.user = user;
              return next();
            }
          }
          
          // Try x-user-data header as fallback
          if (userData && !user) {
            try {
              const parsedUserData = JSON.parse(userData as string);
              if (parsedUserData && parsedUserData.id && parsedUserData.role === 'admin') {
                user = await storage.getUser(parsedUserData.id);
                if (user) {
                  console.log("Admin user authenticated via x-user-data header:", parsedUserData.id);
                  req.user = user;
                  return next();
                }
              }
            } catch (e) {
              console.error("Error parsing x-user-data:", e);
            }
          }
        } catch (err) {
          console.error("Error with header authentication for admin events:", err);
        }
      }
      
      // Fall back to standard authentication
      return authenticateUser(req, res, () => {
        // Check for admin permission
        if (req.user && req.user.role === 'admin') {
          return next();
        } else {
          return res.status(403).json({ message: "Admin access required" });
        }
      });
    } catch (error) {
      console.error("Error in admin events auth middleware:", error);
      return res.status(500).json({ message: "Authentication error" });
    }
  }, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
  ]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Get the request data
      const requestData = req.body;
      
      // Process uploaded files if present
      if (req.files) {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        // Process main image
        if (files['image'] && files['image'][0]) {
          const mainImage = files['image'][0];
          const mainImagePath = `/uploads/${mainImage.filename}`;
          requestData.imageUrl = mainImagePath;
        }
        
        // Process additional images
        if (files['additionalImages'] && files['additionalImages'].length > 0) {
          const additionalImagePaths = files['additionalImages'].map(
            file => `/uploads/${file.filename}`
          );
          
          // If we're retaining existing images and adding new ones
          if (requestData.retainExistingImages === 'true' && event.additionalImages) {
            // Combine with existing images (if event.additionalImages is not null)
            requestData.additionalImages = [
              ...(Array.isArray(event.additionalImages) ? event.additionalImages : []),
              ...additionalImagePaths
            ];
          } else {
            // Only use the newly uploaded images
            requestData.additionalImages = additionalImagePaths;
          }
        } else if (requestData.additionalImages) {
          // If no new files but additionalImages comes as a string, convert to array
          if (typeof requestData.additionalImages === 'string') {
            requestData.additionalImages = [requestData.additionalImages];
          }
        }
      }
      
      // Parse additionalImages from JSON string if it comes in that format
      if (typeof requestData.additionalImages === 'string' && requestData.additionalImages.startsWith('[')) {
        try {
          requestData.additionalImages = JSON.parse(requestData.additionalImages);
        } catch (e) {
          console.error('Error parsing additionalImages JSON:', e);
        }
      }
      
      // Always ensure date is properly converted to a Date object
      if (requestData.date) {
        try {
          // Handle ISO string format from client
          if (typeof requestData.date === 'string') {
            requestData.date = new Date(requestData.date);
            
            // Verify date is valid
            if (isNaN(requestData.date.getTime())) {
              throw new Error('Invalid date format');
            }
          }
        } catch (error) {
          console.error('Error parsing date:', error, 'Received date:', requestData.date);
          return res.status(400).json({ message: "Invalid date format" });
        }
      }
      
      // Log the update details
      console.log(`Updating event ${id} with date:`, requestData.date);
      console.log(`Image URL:`, requestData.imageUrl);
      console.log(`Additional Images:`, requestData.additionalImages);
      
      // Clean up by removing properties we don't want to persist
      delete requestData.retainExistingImages;
      
      // Now update the event with the processed data
      const updatedEvent = await storage.updateEvent(id, requestData);
      return res.status(200).json(updatedEvent);
    } catch (err) {
      console.error("Event update error:", err);
      return res.status(500).json({ message: "Failed to update event" });
    }
  });
  
  // Delete event endpoint - using both paths for compatibility
  router.delete(["/admin/events/:id", "/api/admin/events/:id"], authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Admin user ${req.user?.id} deleting event ID: ${id}`);
      
      // First check if the event exists
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Delete event
      await storage.deleteEvent(id);
      
      // Return success
      return res.status(200).json({ 
        success: true, 
        message: "Event deleted successfully" 
      });
    } catch (err) {
      console.error("Error deleting event:", err);
      return res.status(500).json({ message: "Failed to delete event" });
    }
  });
  
  // Get last deleted event (for undo functionality)
  router.get(["/admin/events/last-deleted", "/api/admin/events/last-deleted"], authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      console.log(`Admin user ${req.user?.id} checking last deleted event`);
      
      const lastDeletedEvent = await storage.getLastDeletedEvent();
      if (!lastDeletedEvent) {
        return res.status(404).json({ message: "No recently deleted events found" });
      }
      
      return res.status(200).json({
        success: true,
        event: lastDeletedEvent.event,
        deletedAt: lastDeletedEvent.deletedAt
      });
    } catch (err) {
      console.error("Error getting last deleted event:", err);
      return res.status(500).json({ message: "Failed to get last deleted event" });
    }
  });
  
  // Restore deleted event endpoint
  router.post(["/admin/events/restore/:id", "/api/admin/events/restore/:id"], authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Admin user ${req.user?.id} restoring deleted event ID: ${id}`);
      
      const restoredEvent = await storage.restoreDeletedEvent(id);
      if (!restoredEvent) {
        return res.status(404).json({ message: "Event not found or could not be restored" });
      }
      
      return res.status(200).json({
        success: true,
        message: "Event restored successfully",
        event: restoredEvent
      });
    } catch (err) {
      console.error("Error restoring deleted event:", err);
      return res.status(500).json({ message: "Failed to restore deleted event" });
    }
  });
  
  // Ticket management
  router.post("/admin/tickets", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      // Process date fields and data conversion before validation
      const processedData = { ...req.body };
      
      // Handle price conversion
      if (typeof processedData.price === 'string') {
        const priceValue = parseFloat(processedData.price);
        if (!isNaN(priceValue)) {
          processedData.price = Math.round(priceValue * 100); // Convert to cents
        }
      }
      
      // Handle quantity conversion
      if (typeof processedData.quantity === 'string') {
        processedData.quantity = parseInt(processedData.quantity, 10);
      }
      
      // Handle date fields
      const dateFields = ['salesStartDate', 'salesEndDate', 'sales_start_date', 'sales_end_date'];
      for (const field of dateFields) {
        if (field in processedData) {
          if (processedData[field] === '' || processedData[field] === undefined) {
            processedData[field] = null;
          } else if (typeof processedData[field] === 'string' && processedData[field]) {
            try {
              const parsedDate = new Date(processedData[field]);
              if (!isNaN(parsedDate.getTime())) {
                processedData[field] = parsedDate;
              } else {
                processedData[field] = null;
              }
            } catch (e) {
              console.warn(`Failed to parse date for field ${field}:`, processedData[field]);
              processedData[field] = null;
            }
          }
        }
      }
      
      // Make sure eventId is properly formatted as a number
      if (processedData.eventId) {
        processedData.eventId = parseInt(String(processedData.eventId));
      }
      
      console.log("Processed ticket data:", processedData);
      
      // Create the ticket with processed data
      const ticket = await storage.createTicket(processedData);
      return res.status(201).json(ticket);
    } catch (err) {
      console.error("Error creating ticket:", err);
      if (err instanceof Error) {
        return res.status(400).json({ errors: [{ path: "server", message: err.message }] });
      }
      return res.status(500).json({ message: "Failed to create ticket" });
    }
  });
  
  // Get all tickets in the admin dashboard
  router.get("/admin/tickets", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
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
      console.log(`Updating ticket with ID: ${ticketId} Data:`, req.body);
      
      // Convert price from dollars to cents properly
      let price = req.body.price;
      if (typeof price === 'string' || typeof price === 'number') {
        const priceValue = parseFloat(String(price));
        if (!isNaN(priceValue)) {
          // Always convert to cents by multiplying by 100
          price = Math.round(priceValue * 100);
          console.log(`Converting price from ${req.body.price} to ${price} cents`);
        }
      }
      
      // Clean up empty date fields
      const updateData = { 
        ...req.body,
        price,
        updatedAt: new Date()
      };
      
      // Handle date fields - convert empty strings to null or ensure proper Date objects
      const dateFields = ['salesStartDate', 'salesEndDate', 'sales_start_date', 'sales_end_date', 'createdAt', 'updatedAt'];
      
      for (const field of dateFields) {
        if (field in updateData) {
          if (updateData[field] === '' || updateData[field] === undefined) {
            updateData[field] = null;
          } else if (typeof updateData[field] === 'string' && updateData[field]) {
            try {
              // Try to parse as Date if it's not empty
              const parsedDate = new Date(updateData[field]);
              if (!isNaN(parsedDate.getTime())) {
                updateData[field] = parsedDate;
              } else {
                updateData[field] = null;
              }
            } catch (e) {
              console.warn(`Failed to parse date for field ${field}:`, updateData[field]);
              updateData[field] = null;
            }
          }
        }
      }
      
      // Make sure eventId is properly formatted
      if (updateData.eventId) {
        updateData.eventId = parseInt(String(updateData.eventId));
        // For database schema that uses event_id instead of eventId
        updateData.event_id = updateData.eventId;
      }
      
      console.log("Processed update data:", updateData);
      
      const updatedTicket = await storage.updateTicket(ticketId, updateData);
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
  
  // Scan ticket route (admin/moderator only)
  router.post("/tickets/scan", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { ticketCode } = req.body;
      
      if (!ticketCode) {
        return res.status(400).json({ 
          valid: false, 
          error: "Ticket code is required" 
        });
      }
      
      console.log(`Processing ticket scan for code: ${ticketCode}`);
      
      // Get current user
      const user = req.user;
      
      // Check if user is admin or moderator
      if (user.role !== 'admin' && user.role !== 'moderator') {
        return res.status(403).json({ 
          valid: false, 
          error: "You don't have permission to scan tickets" 
        });
      }
      
      // Parse the ticket code
      // Format: SGX-TIX-{ticketId}-{orderId}
      const parts = ticketCode.split('-');
      
      if (parts.length !== 4 || parts[0] !== 'SGX' || parts[1] !== 'TIX') {
        console.log(`Invalid ticket format: ${ticketCode}`);
        return res.status(400).json({ 
          valid: false, 
          error: "Invalid ticket format. Expected: SGX-TIX-ticketId-orderId" 
        });
      }
      
      const ticketId = parseInt(parts[2]);
      const orderId = parseInt(parts[3]);
      
      if (isNaN(ticketId) || isNaN(orderId)) {
        console.log(`Invalid ticket or order ID: ticketId=${parts[2]}, orderId=${parts[3]}`);
        return res.status(400).json({ 
          valid: false, 
          error: "Invalid ticket identifier. Ticket ID and Order ID must be numbers." 
        });
      }
      
      console.log(`Processing scan for ticketId=${ticketId}, orderId=${orderId}`);
      
      // Verify the ticket exists
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        console.log(`Ticket not found in database: ${ticketId}`);
        return res.status(404).json({ 
          valid: false, 
          error: "Ticket not found in our system." 
        });
      }
      
      // Get event information
      const event = await storage.getEvent(ticket.eventId);
      if (!event) {
        console.log(`Event not found for ticket: ${ticketId}`);
        return res.status(404).json({ 
          valid: false, 
          error: "Event information not found" 
        });
      }
      
      // Check the order item in the database
      const orderItem = await db
        .select()
        .from(orderItems)
        .where(and(
          eq(orderItems.orderId, orderId),
          eq(orderItems.ticketId, ticketId)
        ))
        .then(rows => rows[0]);
      
      if (!orderItem) {
        console.log(`No order item found for ticketId=${ticketId}, orderId=${orderId}`);
        return res.status(404).json({ 
          valid: false, 
          error: "Ticket not found in our system." 
        });
      }
      
      // Check if this ticket has already been scanned
      const alreadyScanned = orderItem.scanDate !== null;
      let scannedAt = orderItem.scanDate;
      
      // Mark the ticket as scanned if it hasn't been scanned yet
      if (!alreadyScanned) {
        console.log(`Marking ticket as scanned: ticketId=${ticketId}, orderId=${orderId}`);
        
        // Update the order item with scan date
        const [updated] = await db
          .update(orderItems)
          .set({ 
            scanDate: new Date(),
            updatedAt: new Date()
          })
          .where(and(
            eq(orderItems.orderId, orderId),
            eq(orderItems.ticketId, ticketId)
          ))
          .returning();
        
        scannedAt = updated.scanDate;
        
        // Also create a ticket scan record for reporting
        await storage.createTicketScan({
          ticketId: ticketId,
          orderId: orderId,
          scannedBy: user.id,
          scannedAt: new Date(),
          notes: "Scanned via ticket scanner"
        });
      } else {
        console.log(`Ticket already scanned at: ${scannedAt}`);
      }
      
      // Format and return ticket info
      const ticketInfo = {
        ticketId: ticketId,
        orderId: orderId,
        ticketName: ticket.name,
        eventName: event.title,
        eventDate: event.date,
        eventLocation: event.location || "Not specified",
        purchaseDate: orderItem.createdAt,
        scannedAt: scannedAt
      };
      
      return res.status(200).json({
        valid: true,
        alreadyScanned,
        ticketInfo,
        scannedAt
      });
    } catch (err) {
      console.error("Error scanning ticket:", err);
      return res.status(500).json({ 
        valid: false,
        error: "Failed to process ticket scan" 
      });
    }
  });
  
  // Delete ticket endpoint
  router.delete("/admin/tickets/:id", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      console.log(`Admin deleting ticket with ID: ${ticketId}`);
      
      // Check if ticket exists
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check if ticket has any purchases
      const ticketPurchases = await storage.getTicketPurchasesByTicketId(ticketId);
      const hasPurchases = ticketPurchases && ticketPurchases.length > 0;
      
      if (hasPurchases) {
        console.log(`WARNING: Attempted to delete ticket ${ticketId} with existing purchases (${ticketPurchases.length})`);
        // You might want to just mark the ticket as inactive instead of deleting it
        // Or ask for confirmation to delete
        
        // For now, we'll still allow deletion with a warning log
      }
      
      // Delete the ticket
      const result = await storage.deleteTicket(ticketId);
      
      if (result) {
        console.log(`Successfully deleted ticket ${ticketId}`);
        return res.status(200).json({ 
          success: true,
          message: "Ticket deleted successfully" 
        });
      } else {
        return res.status(500).json({ message: "Failed to delete ticket" });
      }
    } catch (err) {
      console.error("Error deleting ticket:", err);
      return res.status(500).json({ message: "Failed to delete ticket" });
    }
  });
  
  // Ticket validation endpoint for QR code scanner (accessible by both admins and moderators)
  router.post("/admin/tickets/validate", authenticateUser, authorizeModerator, async (req: Request, res: Response) => {
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
  router.get("/admin/orders", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      // Use real data from database
      const orders = await storage.getAllOrders();
      return res.status(200).json(orders);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Ticket scanning endpoint for the ticket scanner component
  router.post("/tickets/scan", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { ticketCode } = req.body;
      const user = (req as any).user;
      
      if (!ticketCode) {
        return res.status(400).json({ 
          valid: false,
          error: "Ticket code is required" 
        });
      }
      
      // Extract orderId and ticketId from the ticket code
      // Format: SGX-TIX-{ticketId}-{orderId}
      const codeParts = ticketCode.split('-');
      
      if (codeParts.length !== 4 || codeParts[0] !== 'SGX' || codeParts[1] !== 'TIX') {
        return res.status(400).json({ 
          valid: false,
          error: "Invalid ticket code format" 
        });
      }
      
      const ticketId = parseInt(codeParts[2]);
      const orderId = parseInt(codeParts[3]);
      
      if (isNaN(ticketId) || isNaN(orderId)) {
        return res.status(400).json({ 
          valid: false,
          error: "Invalid ticket code" 
        });
      }
      
      // Get ticket purchase (order) info
      const ticketPurchase = await storage.getOrderById(orderId);
      
      if (!ticketPurchase) {
        return res.status(404).json({ 
          valid: false,
          error: "Ticket purchase not found" 
        });
      }
      
      // Get ticket and event info
      const ticket = await storage.getTicket(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ 
          valid: false,
          error: "Ticket information not found" 
        });
      }
      
      const event = await storage.getEvent(ticket.eventId);
      
      if (!event) {
        return res.status(404).json({ 
          valid: false,
          error: "Event information not found" 
        });
      }
      
      // Check if this ticket has been scanned before
      const existingScans = await storage.getTicketScansByTicketId(ticketId);
      const alreadyScanned = existingScans.length > 0;
      
      // Create a new scan record if it hasn't been scanned
      let scanRecord = null;
      if (!alreadyScanned) {
        scanRecord = await storage.createTicketScan({
          ticketId: ticket.id,
          orderId: ticketPurchase.id,
          scannedBy: user.id,
          scannedAt: new Date(),
          notes: "Scanned via ticket scanner"
        });
      }
      
      // Format and return ticket info
      const ticketInfo = {
        ticketId: ticket.id,
        orderId: ticketPurchase.id,
        ticketName: ticket.name,
        eventName: event.title,
        eventDate: event.date,
        eventLocation: event.location || "Not specified",
        purchaseDate: ticketPurchase.createdAt,
        scannedAt: alreadyScanned ? existingScans[0].scannedAt : scanRecord?.scannedAt
      };
      
      return res.status(200).json({
        valid: true,
        alreadyScanned,
        ticketInfo,
        scannedAt: alreadyScanned ? existingScans[0].scannedAt : null
      });
    } catch (err) {
      console.error("Error scanning ticket:", err);
      return res.status(500).json({ 
        valid: false,
        error: "Failed to process ticket scan" 
      });
    }
  });
  
  // User profile routes
  router.get("/users/:id/profile", authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove sensitive information
      const { password, ...userProfile } = user;
      return res.status(200).json(userProfile);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      return res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  router.get("/users/:id/attendance", authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const tickets = await storage.getTicketPurchasesByUserId(userId);
      const attendance = tickets.filter(ticket => ticket.status === 'confirmed' || ticket.status === 'used');
      
      return res.status(200).json(attendance);
    } catch (err) {
      console.error("Error fetching user attendance:", err);
      return res.status(500).json({ message: "Failed to fetch user attendance" });
    }
  });

  router.get("/users/:id/reviews", authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Return empty array for now since reviews aren't implemented yet
      return res.status(200).json([]);
    } catch (err) {
      console.error("Error fetching user reviews:", err);
      return res.status(500).json({ message: "Failed to fetch user reviews" });
    }
  });

  router.get("/users/:id/photos", authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Return empty array for now since photos aren't implemented yet
      return res.status(200).json([]);
    } catch (err) {
      console.error("Error fetching user photos:", err);
      return res.status(500).json({ message: "Failed to fetch user photos" });
    }
  });

  router.get("/users/:id/follow-stats", authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Return empty stats for now since follow system isn't implemented yet
      return res.status(200).json({ followers: 0, following: 0 });
    } catch (err) {
      console.error("Error fetching follow stats:", err);
      return res.status(500).json({ message: "Failed to fetch follow stats" });
    }
  });

  // Update user profile
  router.put("/users/:id/profile", authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Ensure user can only update their own profile or admin can update any
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized to update this profile" });
      }

      const updateData = {
        displayName: req.body.displayName,
        username: req.body.username,
        email: req.body.email,
        bio: req.body.bio,
        location: req.body.location,
        website: req.body.website,
      };

      // Remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );

      const updatedUser = await storage.updateUser(userId, cleanedData);
      return res.status(200).json(updatedUser);
    } catch (err) {
      console.error("Error updating user profile:", err);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // User management
  router.get("/admin/users", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
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
  
  // Update user email (admin only)
  router.put("/admin/users/:id", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Check if user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if email is already in use by another user
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Email is already in use by another user" });
      }

      // Update the user's email
      const updatedUser = await storage.updateUser(userId, { email });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user email" });
      }

      // Remove sensitive information
      const { password, ...userWithoutPassword } = updatedUser;
      return res.status(200).json(userWithoutPassword);
    } catch (err) {
      console.error("Error updating user email:", err);
      return res.status(500).json({ message: "Failed to update user email" });
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
  // Duplicate routes for compatibility with both /api/payment and /payment paths
  // PayPal setup with /api prefix
  router.get("/api/payment/paypal-setup", async (req: Request, res: Response) => {
    await loadPaypalDefault(req, res);
  });
  
  // PayPal setup without /api prefix (for backward compatibility)
  router.get("/payment/paypal-setup", async (req: Request, res: Response) => {
    await loadPaypalDefault(req, res);
  });
  
  // API prefixed PayPal order route
  router.post("/api/payment/paypal-order", async (req: Request, res: Response) => {
    await createPaypalOrder(req, res);
  });
  
  // Non-prefixed PayPal order route (for backward compatibility)
  router.post("/payment/paypal-order", async (req: Request, res: Response) => {
    await createPaypalOrder(req, res);
  });
  
  // API prefixed PayPal capture route
  router.post("/api/payment/paypal-order/:orderID/capture", async (req: Request, res: Response) => {
    await capturePaypalOrder(req, res);
  });
  
  // Non-prefixed PayPal capture route (for backward compatibility)
  router.post("/payment/paypal-order/:orderID/capture", async (req: Request, res: Response) => {
    await capturePaypalOrder(req, res);
  });
  
  // Endpoint to email ticket QR code to customer
  // Original endpoint without /api prefix (for backward compatibility)
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

  // Delete ticket endpoint to match client expectations
  router.delete("/api/tickets/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      console.log(`User ${req.user.id} attempting to delete ticket ${ticketId}`);

      // Check if ticket exists
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check if user is authorized (admin or event creator)
      if (req.user.role !== 'admin') {
        // Get the event
        const event = await storage.getEvent(ticket.eventId);
        if (!event || event.creatorId !== req.user.id) {
          return res.status(403).json({ message: "You don't have permission to delete this ticket" });
        }
      }
      
      // Check if ticket has any purchases
      const ticketPurchases = await storage.getTicketPurchasesByTicketId(ticketId);
      const hasPurchases = ticketPurchases && ticketPurchases.length > 0;
      
      if (hasPurchases) {
        console.log(`WARNING: Attempted to delete ticket ${ticketId} with existing purchases (${ticketPurchases.length})`);
        // For now, we'll still allow deletion with a warning log
      }
      
      // Delete the ticket
      const result = await storage.deleteTicket(ticketId);
      
      if (result) {
        console.log(`Successfully deleted ticket ${ticketId}`);
        return res.status(200).json({ 
          success: true,
          message: "Ticket deleted successfully" 
        });
      } else {
        return res.status(500).json({ message: "Failed to delete ticket" });
      }
    } catch (err) {
      console.error("Error deleting ticket:", err);
      return res.status(500).json({ message: "Failed to delete ticket" });
    }
  });

// New endpoint with /api prefix to match client expectations
  router.post("/api/tickets/email", async (req: Request, res: Response) => {
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

  // Endpoint to monitor ticket delivery status for specific users
  router.get("/api/tickets/delivery-status/:username", async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      const { ticketMonitor } = await import('./ticket-monitor');
      
      console.log(`Checking ticket delivery status for user: ${username}`);
      
      // Get user information
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all tickets for the user
      const tickets = await storage.getTicketsByUserId(user.id);
      
      // Check delivery status for each ticket
      const deliveryStatuses = [];
      for (const ticket of tickets) {
        const status = ticketMonitor.getDeliveryStatus(ticket.id, ticket.orderId);
        deliveryStatuses.push({
          ticketId: ticket.id,
          orderId: ticket.orderId,
          eventTitle: 'Event Title', // Would fetch from event table
          delivered: !status || status.delivered,
          attempts: status?.deliveryAttempts || 1,
          lastAttempt: status?.lastAttempt || ticket.purchaseDate,
          error: status?.errorMessage
        });
      }

      res.json({
        username: user.username,
        email: user.email,
        totalTickets: tickets.length,
        deliveryStatuses,
        pendingDeliveries: ticketMonitor.getPendingDeliveries().filter(d => d.userId === user.id)
      });

    } catch (error: any) {
      console.error("Error checking delivery status:", error);
      res.status(500).json({ error: "Failed to check delivery status: " + error.message });
    }
  });

  // Endpoint to manually create a ticket for a user (for missed purchases)
  router.post("/api/tickets/manual-create", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const { username, eventId, ticketType, amount, notes } = req.body;
      
      console.log(`Manually creating ticket for user: ${username}`);
      
      // Get user information
      const user = await storage.getUserByUsername(username);
      if (!user || !user.email) {
        return res.status(404).json({ message: "User not found or no email address" });
      }

      // Get event details
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Create order record
      const order = await storage.createOrder({
        userId: user.id,
        totalAmount: amount || 0,
        status: 'completed',
        paymentMethod: 'manual',
        paymentId: `manual-${Date.now()}`
      });

      // Generate QR code data
      const qrCodeData = `EVENT-${eventId}-ORDER-${order.id}-${Date.now()}`;

      // Create ticket purchase record
      const ticketData = {
        userId: user.id,
        eventId: eventId,
        ticketId: null,
        orderId: order.id,
        qrCodeData: qrCodeData,
        status: 'valid',
        ticketType: ticketType || 'General Admission',
        price: amount?.toString() || '0',
        attendeeEmail: user.email,
        attendeeName: user.displayName || user.username,
        purchaseDate: new Date()
      };

      const ticket = await storage.createTicketPurchase(ticketData);

      // Send ticket email with delivery monitoring
      const { ticketMonitor } = await import('./ticket-monitor');
      await ticketMonitor.ensureTicketDelivery(
        ticket.id,
        order.id,
        user.id,
        user.email,
        event.title,
        ticket.qrCodeData,
        event.location,
        event.date,
        ticketType || 'General Admission',
        amount || 0
      );

      res.json({
        success: true,
        message: `Manual ticket created and delivered for ${username}`,
        ticket: {
          id: ticket.id,
          orderId: order.id,
          eventTitle: event.title,
          qrCode: ticket.qrCodeData,
          email: user.email
        },
        notes: notes || 'Manual ticket creation'
      });

    } catch (error: any) {
      console.error("Error creating manual ticket:", error);
      res.status(500).json({ error: "Failed to create manual ticket: " + error.message });
    }
  });

  // Endpoint to manually retry ticket delivery for a specific user
  router.post("/api/tickets/retry-delivery/:username", async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      const { ticketMonitor } = await import('./ticket-monitor');
      
      console.log(`Manually retrying ticket delivery for user: ${username}`);
      
      // Get user information
      const user = await storage.getUserByUsername(username);
      if (!user || !user.email) {
        return res.status(404).json({ message: "User not found or no email address" });
      }

      // Get all tickets for the user
      const tickets = await storage.getTicketsByUserId(user.id);
      
      const retryResults = [];
      for (const ticket of tickets) {
        try {
          // Get event details
          const event = await storage.getEvent(ticket.eventId);
          if (!event) continue;

          const result = await ticketMonitor.ensureTicketDelivery(
            ticket.id,
            ticket.orderId,
            user.id,
            user.email,
            event.title,
            ticket.qrCodeData,
            event.location,
            event.date,
            ticket.ticketType || 'General Admission',
            typeof ticket.price === 'string' ? parseFloat(ticket.price) : ticket.price || 0
          );

          retryResults.push({
            ticketId: ticket.id,
            success: result,
            eventTitle: event.title
          });

        } catch (error) {
          retryResults.push({
            ticketId: ticket.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        username: user.username,
        email: user.email,
        retryResults,
        message: `Retry attempted for ${tickets.length} tickets`
      });

    } catch (error: any) {
      console.error("Error retrying delivery:", error);
      res.status(500).json({ error: "Failed to retry delivery: " + error.message });
    }
  });
  
  // Special endpoint for free tickets (0.00) - no payment processing required
  // API prefixed endpoint
  router.post("/api/tickets/free", async (req: Request, res: Response) => {
    try {
      const { eventId, eventTitle } = req.body;
      
      // More flexible authentication for free tickets
      let user = null;
      
      // 1. Try user-id header first
      const userId = req.headers['user-id'];
      if (userId) {
        try {
          const id = parseInt(userId as string);
          user = await storage.getUser(id);
          if (user) {
            console.log("User found via user-id header for free ticket:", user.id);
          }
        } catch (e) {
          console.error("Error retrieving user by ID:", e);
        }
      }
      
      // 2. Try token authentication if user-id failed
      if (!user) {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          
          if (token && token !== 'undefined' && token !== 'null') {
            try {
              // Try Firebase token
              const decodedToken = await admin.auth().verifyIdToken(token);
              const userByFirebase = await storage.getUserByFirebaseId(decodedToken.uid);
              
              if (userByFirebase) {
                user = userByFirebase;
                console.log("User found via Firebase token for free ticket:", user.id);
              }
            } catch (e) {
              console.error("Error verifying Firebase token:", e);
            }
          }
        }
      }
      
      // 3. Try x-user-data as a last resort
      if (!user && req.headers['x-user-data']) {
        try {
          const userData = JSON.parse(req.headers['x-user-data'] as string);
          
          if (userData && userData.id) {
            // Get the user from storage to ensure this is a real user
            const userFromStorage = await storage.getUser(userData.id);
            
            if (userFromStorage) {
              user = userFromStorage;
              console.log("User found via x-user-data header for free ticket:", user.id);
            }
          }
        } catch (e) {
          console.error("Error parsing x-user-data:", e);
        }
      }
      
      // If no user found through any method, return authentication failure
      if (!user) {
        console.log("Authentication failed for free ticket request");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Store authenticated user in request
      (req as any).user = user;
      
      // Ensure user has an email address for ticket delivery
      if (!user.email || user.email.trim() === '') {
        return res.status(400).json({ 
          message: "Email address is required to receive tickets. Please update your profile with a valid email address.",
          requiresEmail: true
        });
      }
      
      // Handle free ticket claim logic
      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
      }
      
      // Get the event to verify it exists and is free
      const event = await storage.getEvent(Number(eventId));
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Make sure the event price is actually zero or null (free)
      if (event.price && event.price > 0) {
        return res.status(400).json({ 
          message: "This endpoint is only for free tickets. Use payment endpoints for paid tickets." 
        });
      }
      
      // Create order record for the free ticket
      const order = await storage.createOrder({
        userId: user.id,
        totalAmount: 0,
        status: 'completed',
        paymentMethod: 'free',
        paymentId: `free-${Date.now()}`
      });
      
      // Check if ticketId was provided in the request
      let ticketType = 'standard';
      let ticketName = 'General Admission';
      let ticketPrice = 0;
      let selectedTicket = null;
      
      if (req.body.ticketId) {
        try {
          selectedTicket = await storage.getTicket(Number(req.body.ticketId));
          if (selectedTicket) {
            ticketType = selectedTicket.name;
            ticketName = selectedTicket.name;
            ticketPrice = selectedTicket.price;
            
            // Make sure the ticket is actually free
            if (ticketPrice > 0) {
              return res.status(400).json({ 
                message: "This endpoint is only for free tickets. Use payment endpoints for paid tickets." 
              });
            }
          }
        } catch (err) {
          console.error("Error fetching ticket:", err);
          // Continue with default ticket type if there's an error
        }
      }
      
      // Create ticket record
      const ticketData = {
        orderId: order.id,
        eventId: event.id,
        ticketId: selectedTicket ? selectedTicket.id : null,
        status: 'valid',
        userId: user.id,
        purchaseDate: new Date(),
        qrCodeData: `EVENT-${event.id}-ORDER-${order.id}-${Date.now()}`,
        ticketType: ticketType,
        price: 0,
        attendeeEmail: user.email || null,
        attendeeName: user.displayName || user.username || null
      };
      
      const ticket = await storage.createTicketPurchase(ticketData);
      
      // If user has email, send ticket confirmation
      if (user.email) {
        try {
          await sendTicketEmail({
            ticketId: ticket.id.toString(),
            qrCodeDataUrl: ticket.qrCodeData,
            eventName: event.title,
            eventLocation: event.location,
            eventDate: event.date,
            ticketType: ticketName,
            ticketPrice: 0,
            purchaseDate: new Date()
          }, user.email);
        } catch (emailError) {
          console.error("Failed to send ticket email:", emailError);
          // Continue despite email failure
        }
      }
      
      // Track analytics - count as ticket sale for free event
      try {
        // Use the proper event analytics function
        await storage.incrementEventTicketSales(event.id);
      } catch (analyticsError) {
        console.error("Error updating analytics:", analyticsError);
        // Continue despite analytics failure
      }
      
      return res.status(200).json({
        success: true,
        ticket: {
          id: ticket.id,
          eventId: ticket.eventId,
          eventTitle: event.title,
          status: ticket.status,
          qrCodeData: ticket.qrCodeData
        },
        message: "Free ticket successfully claimed"
      });
    } catch (error) {
      console.error("Error claiming free ticket:", error);
      return res.status(500).json({ message: "Failed to claim free ticket" });
    }
  });
  
  // Non-prefixed endpoint (for backward compatibility)
  router.post("/tickets/free", async (req: Request, res: Response) => {
    try {
      const { eventId, eventTitle } = req.body;
      
      // More flexible authentication for free tickets
      let user = null;
      
      // 1. Try user-id header first
      const userId = req.headers['user-id'];
      if (userId) {
        try {
          const id = parseInt(userId as string);
          user = await storage.getUser(id);
          if (user) {
            console.log("User found via user-id header for free ticket (non-prefixed):", user.id);
          }
        } catch (e) {
          console.error("Error retrieving user by ID:", e);
        }
      }
      
      // 2. Try token authentication if user-id failed
      if (!user) {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          
          if (token && token !== 'undefined' && token !== 'null') {
            try {
              // Try Firebase token
              const decodedToken = await admin.auth().verifyIdToken(token);
              const userByFirebase = await storage.getUserByFirebaseId(decodedToken.uid);
              
              if (userByFirebase) {
                user = userByFirebase;
                console.log("User found via Firebase token for free ticket (non-prefixed):", user.id);
              }
            } catch (e) {
              console.error("Error verifying Firebase token:", e);
            }
          }
        }
      }
      
      // 3. Try x-user-data as a last resort
      if (!user && req.headers['x-user-data']) {
        try {
          const userData = JSON.parse(req.headers['x-user-data'] as string);
          
          if (userData && userData.id) {
            // Get the user from storage to ensure this is a real user
            const userFromStorage = await storage.getUser(userData.id);
            
            if (userFromStorage) {
              user = userFromStorage;
              console.log("User found via x-user-data header for free ticket (non-prefixed):", user.id);
            }
          }
        } catch (e) {
          console.error("Error parsing x-user-data:", e);
        }
      }
      
      // If no user found through any method, return authentication failure
      if (!user) {
        console.log("Authentication failed for free ticket request (non-prefixed)");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Store authenticated user in request
      (req as any).user = user;
      
      // Ensure user has an email address for ticket delivery
      if (!user.email || user.email.trim() === '') {
        return res.status(400).json({ 
          message: "Email address is required to receive tickets. Please update your profile with a valid email address.",
          requiresEmail: true
        });
      }
      
      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
      }
      
      // Get the event to verify it exists and is free
      const event = await storage.getEvent(Number(eventId));
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Make sure the event price is actually zero or null (free)
      if (event.price && event.price > 0) {
        return res.status(400).json({ 
          message: "This endpoint is only for free tickets. Use payment endpoints for paid tickets." 
        });
      }
      
      // Create order record for the free ticket
      const order = await storage.createOrder({
        userId: user.id,
        totalAmount: 0,
        status: 'completed',
        paymentMethod: 'free',
        paymentId: `free-${Date.now()}`
      });
      
      // Check if ticketId was provided in the request
      let ticketType = 'standard';
      let ticketName = 'General Admission';
      let ticketPrice = 0;
      let selectedTicket = null;
      
      if (req.body.ticketId) {
        try {
          selectedTicket = await storage.getTicket(Number(req.body.ticketId));
          if (selectedTicket) {
            ticketType = selectedTicket.name;
            ticketName = selectedTicket.name;
            ticketPrice = selectedTicket.price;
            
            // Make sure the ticket is actually free
            if (ticketPrice > 0) {
              return res.status(400).json({ 
                message: "This endpoint is only for free tickets. Use payment endpoints for paid tickets." 
              });
            }
          }
        } catch (err) {
          console.error("Error fetching ticket:", err);
          // Continue with default ticket type if there's an error
        }
      }
      
      // Create ticket record
      const ticketData = {
        orderId: order.id,
        eventId: event.id,
        ticketId: selectedTicket ? selectedTicket.id : null,
        status: 'valid',
        userId: user.id,
        purchaseDate: new Date(),
        qrCodeData: `EVENT-${event.id}-ORDER-${order.id}-${Date.now()}`,
        ticketType: ticketType,
        price: 0,
        attendeeEmail: user.email || null,
        attendeeName: user.displayName || user.username || null
      };
      
      const ticket = await storage.createTicketPurchase(ticketData);
      
      // If user has email, send ticket confirmation
      if (user.email) {
        try {
          await sendTicketEmail({
            ticketId: ticket.id.toString(),
            qrCodeDataUrl: ticket.qrCodeData,
            eventName: event.title,
            eventLocation: event.location,
            eventDate: event.date,
            ticketType: ticketName,
            ticketPrice: 0,
            purchaseDate: new Date()
          }, user.email);
        } catch (emailError) {
          console.error("Failed to send ticket email:", emailError);
          // Continue despite email failure
        }
      }
      
      // Track analytics - count as ticket sale for free event
      try {
        // Use the proper event analytics function
        await storage.incrementEventTicketSales(event.id);
      } catch (analyticsError) {
        console.error("Error updating analytics:", analyticsError);
        // Continue despite analytics failure
      }
      
      return res.status(200).json({
        success: true,
        ticket: {
          id: ticket.id,
          eventId: ticket.eventId,
          eventTitle: event.title,
          status: ticket.status,
          qrCodeData: ticket.qrCodeData
        },
        message: "Free ticket successfully claimed"
      });
    } catch (error) {
      console.error("Error claiming free ticket:", error);
      return res.status(500).json({ message: "Failed to claim free ticket" });
    }
  });

  // Stripe payment routes
  // API prefixed create-intent endpoint
  router.post("/api/payment/create-intent", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      // Ensure user has an email address for ticket delivery
      if (!user.email || user.email.trim() === '') {
        return res.status(400).json({ 
          message: "Email address is required to receive tickets. Please update your profile with a valid email address.",
          requiresEmail: true
        });
      }
      
      const { 
        items, 
        amount, 
        currency = "usd",
        eventId,
        eventTitle,
        ticketId,
        ticketName
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
      
      // Add ticket information to metadata if provided
      if (ticketId) {
        metadata.ticketId = ticketId.toString();
      }
      
      if (ticketName) {
        metadata.ticketName = ticketName;
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
  
  // Non-prefixed create-intent endpoint (for backward compatibility)
  router.post("/payment/create-intent", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      // Ensure user has an email address for ticket delivery
      if (!user.email || user.email.trim() === '') {
        return res.status(400).json({ 
          message: "Email address is required to receive tickets. Please update your profile with a valid email address.",
          requiresEmail: true
        });
      }
      
      const { 
        items, 
        amount, 
        currency = "usd",
        eventId,
        eventTitle,
        ticketId,
        ticketName
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
      
      // Add ticket information to metadata if provided
      if (ticketId) {
        metadata.ticketId = ticketId.toString();
      }
      
      if (ticketName) {
        metadata.ticketName = ticketName;
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
          // Get customer and payment details
          const customerId = paymentIntent.customer;
          const payerEmail = paymentIntent.receipt_email;
          const amount = paymentIntent.amount / 100;
          
          // Check if this is an event ticket purchase
          const eventId = paymentIntent.metadata?.eventId ? parseInt(paymentIntent.metadata.eventId) : null;
          const eventTitle = paymentIntent.metadata?.eventTitle || null;
          const ticketId = paymentIntent.metadata?.ticketId ? parseInt(paymentIntent.metadata.ticketId) : null;
          const ticketName = paymentIntent.metadata?.ticketName || 'General Admission';
          
          let user = null;
          let email = payerEmail;
          let customerName = 'Guest User';
          
          // Try to get customer details if customer ID exists
          if (customerId) {
            try {
              const customer = await stripe.customers.retrieve(customerId as string);
              if (customer && !customer.deleted) {
                email = customer.email || payerEmail;
                customerName = customer.name || customerName;
                
                // Try to find existing user by customer metadata or email
                if (customer.metadata?.userId) {
                  user = await storage.getUser(parseInt(customer.metadata.userId));
                } else if (email) {
                  user = await storage.getUserByEmail(email);
                }
              }
            } catch (customerError) {
              console.error('Error retrieving Stripe customer:', customerError);
            }
          }
          
          // If no user found and we have an email, create a guest user
          if (!user && email) {
            try {
              user = await storage.createUser({
                username: `guest_${Date.now()}`,
                password: '',
                displayName: customerName,
                email: email,
                isGuest: true,
                role: 'user'
              });
            } catch (userError) {
              console.error('Error creating guest user:', userError);
            }
          }
          
          if (user && email) {
            // Create order record
            const order = await storage.createOrder({
              userId: user.id,
              totalAmount: Math.round(amount * 100), // Convert back to cents for storage
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
                    ticketId: ticketId,
                    status: 'valid',
                    userId: user.id,
                    purchaseDate: new Date(),
                    qrCodeData: `EVENT-${eventId}-ORDER-${order.id}-${Date.now()}`,
                    ticketType: ticketName,
                    price: Math.round(amount * 100).toString(), // Convert to cents and stringify
                    attendeeEmail: email,
                    attendeeName: customerName
                  };
                  
                  const ticket = await storage.createTicketPurchase(ticketData);
                  
                  // Send ticket email with QR code automatically using delivery monitoring
                  try {
                    const { ticketMonitor } = await import('./ticket-monitor');
                    await ticketMonitor.ensureTicketDelivery(
                      ticket.id,
                      order.id,
                      user.id,
                      email,
                      event.title,
                      ticket.qrCodeData,
                      event.location,
                      event.date,
                      ticketName,
                      amount
                    );
                    
                    console.log(`Ticket email delivery initiated for ${email} for Stripe payment ${paymentIntent.id}`);
                  } catch (emailError) {
                    console.error('Failed to initiate ticket email delivery:', emailError);
                  }
                  
                  console.log(`Successfully processed Stripe payment and created ticket for event ${eventId}: ${eventTitle} - Amount: $${amount}`);
                }
              } catch (err) {
                console.error('Error creating ticket record:', err);
              }
            } else {
              // For non-ticket purchases, send regular order confirmation
              const items = paymentIntent.metadata?.items ? JSON.parse(paymentIntent.metadata.items) : [];
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
                Amount: `$${amount.toFixed(2)}`,
                Customer: email,
                PaymentId: paymentIntent.id,
                PaymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
                ...(eventId ? { EventId: eventId.toString(), EventTitle: eventTitle } : {})
              }
            );
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

  // Free ticket monitoring endpoint
  router.get("/admin/free-tickets", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {

    try {
      const freeTickets = await storage.getFreeTicketPurchases();
      
      // Calculate summary statistics
      const summary = {
        totalFreeTickets: freeTickets.length,
        uniqueUsers: new Set(freeTickets.map(ticket => ticket.userId)).size,
        events: [...new Set(freeTickets.map(ticket => ticket.eventTitle))],
        recentPurchases: freeTickets.slice(0, 10), // Last 10 purchases
        userBreakdown: freeTickets.reduce((acc, ticket) => {
          const key = ticket.username || 'Unknown';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      res.json({
        summary,
        tickets: freeTickets
      });
    } catch (error) {
      console.error('Error fetching free tickets:', error);
      res.status(500).json({ message: "Failed to fetch free ticket data" });
    }
  });

  // Image proxy for external images (Etsy, etc.)
  app.get('/api/proxy-image', async (req: Request, res: Response) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL parameter required' });
      }

      // Decode HTML entities and URL decode
      const decodedUrl = decodeURIComponent(url.replace(/&#x2F;/g, '/').replace(/&amp;/g, '&'));

      // Validate URL is from allowed domains
      const allowedDomains = ['i.etsystatic.com', 'printify.com'];
      const urlObj = new URL(decodedUrl);
      
      if (!allowedDomains.includes(urlObj.hostname)) {
        return res.status(403).json({ error: 'Domain not allowed', hostname: urlObj.hostname });
      }

      const response = await fetch(decodedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/*,*/*;q=0.8',
        }
      });

      if (!response.ok) {
        return res.status(404).json({ error: 'Image not found' });
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Image proxy error:', error);
      res.status(500).json({ error: 'Failed to fetch image' });
    }
  });

  // Serve PWA files
  app.get('/manifest.json', (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'public/manifest.json'));
  });

  app.get('/sw.js', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(process.cwd(), 'public/sw.js'));
  });

  return httpServer;
}
