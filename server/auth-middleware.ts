import { Request, Response, NextFunction } from "express";
import { User } from "@shared/schema";
import { storage } from "./storage";
import { admin } from "./firebase";

// Extend the Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

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
  
  // SECURITY: Check if this is a payment-related or sensitive route requiring strict authentication
  const isPaymentRoute = req.path.includes('/payment') || req.path.includes('create-intent') || req.path.includes('paypal');
  const isSensitiveRoute = isPaymentRoute || req.path.includes('/admin') || req.path.includes('/ticket');
  
  if (isSensitiveRoute && !user) {
    console.log("SECURITY: Strict authentication required for sensitive route:", req.path);
    return res.status(401).json({ 
      message: "Secure authentication required. Please sign in with a valid account.",
      requiresAuth: true 
    });
  }
  
  // SECURITY: For non-sensitive routes only, allow limited fallback for development
  // This prevents authentication bypass on payment/admin routes while maintaining compatibility
  if (!user && !isSensitiveRoute && process.env.NODE_ENV === 'development' && userId) {
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