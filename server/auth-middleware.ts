import { Request, Response, NextFunction } from "express";
import { User } from "@shared/schema";
import { storage } from "./storage";
import { admin } from "./firebase";
import * as crypto from "crypto";

// Extend the Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Secret key for HMAC token signing (in production, this should be an environment variable)
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'CHANGE_THIS_IN_PRODUCTION_' + crypto.randomBytes(32).toString('hex');

// Validate HMAC-signed login token
const validateSecureLoginToken = async (token: string): Promise<User | null> => {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payload)
      .digest('base64url');
    
    if (expectedSignature !== signature) {
      console.log("Token signature verification failed");
      return null;
    }

    // Decode payload
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    const [userId, username, timestamp] = decoded.split(':');
    
    if (!userId || !username || !timestamp) return null;

    // Check token age (24 hour expiry)
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000;
    
    if (tokenAge >= maxAge) {
      console.log("Secure token expired:", tokenAge / (60 * 60 * 1000), "hours old");
      return null;
    }

    // Verify user exists and username matches
    const user = await storage.getUser(parseInt(userId));
    if (!user || user.username !== username) {
      console.log("Token user validation failed");
      return null;
    }

    return user;
  } catch (error) {
    console.error("Secure token validation error:", error);
    return null;
  }
};

// Generate secure HMAC-signed login token
export const generateSecureLoginToken = (user: User): string => {
  const payload = `${user.id}:${user.username}:${Date.now()}`;
  const payloadBase64 = Buffer.from(payload).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadBase64)
    .digest('base64url');
  
  return `${payloadBase64}.${signature}`;
};

// Authentication middleware
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
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
      
      // Try Firebase verification first (for users with Firebase IDs)
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
          
          // If Firebase fails, try to validate as secure HMAC-signed login token
          const validatedUser = await validateSecureLoginToken(token);
          if (validatedUser) {
            user = validatedUser;
            console.log("User authenticated via secure login token:", user.id);
          }
        }
      }
    } catch (tokenError) {
      console.error("Error processing auth token:", tokenError);
    }
  }
  
  // SECURITY: Check if this is a payment-related or sensitive route requiring strict authentication
  const isPaymentRoute = req.path.includes('/payment') || req.path.includes('create-intent') || req.path.includes('paypal');
  const isTicketRoute = req.path.includes('/ticket');
  const isAdminRoute = req.path.includes('/admin');
  
  // For payment and ticket routes, require strict Firebase authentication
  if ((isPaymentRoute || isTicketRoute) && !user) {
    console.log("SECURITY: Strict authentication required for sensitive route:", req.path);
    return res.status(401).json({ 
      message: "Secure authentication required. Please sign in with a valid account.",
      requiresAuth: true 
    });
  }
  
  // Admin users without Firebase IDs can now authenticate via login tokens
  // No additional fallback needed - the token validation above handles this securely
  
  // Final check for admin routes - verify both authentication AND admin role
  if (isAdminRoute) {
    if (!user) {
      console.log("SECURITY: Authentication required for admin route:", req.path);
      return res.status(401).json({ 
        message: "Admin authentication required. Please sign in with your admin account.",
        requiresAuth: true 
      });
    }
    
    // CRITICAL: Verify user has admin role
    if (user.role !== 'admin') {
      console.log("SECURITY: Admin role required for route:", req.path, "User role:", user.role);
      return res.status(403).json({ 
        message: "Admin privileges required. Access denied.",
        requiresAuth: true 
      });
    }
    
    console.log("SECURITY: Admin access granted to user:", user.username, "for route:", req.path);
  }
  
  // SECURITY: For non-sensitive routes only, allow limited fallback for development
  // This prevents authentication bypass on payment/ticket routes while maintaining compatibility
  if (!user && !isPaymentRoute && !isTicketRoute && !isAdminRoute && process.env.NODE_ENV === 'development' && userId) {
    try {
      const id = parseInt(userId as string);
      user = await storage.getUser(id);
      
      if (user) {
        console.log("DEV-ONLY: User authenticated via user-id header for non-sensitive route:", user.id);
      }
    } catch (userIdError) {
      console.error("Error authenticating with user-id:", userIdError);
    }
  }
  
  // REMOVED: x-user-data header fallback completely (too insecure even for dev)
  
  // If we still don't have a user, authentication failed
  if (!user) {
    console.log("Authentication failed for request:", req.path);
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // Add user to request object
  req.user = user;
  next();
};