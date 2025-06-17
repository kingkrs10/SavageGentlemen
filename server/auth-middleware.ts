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