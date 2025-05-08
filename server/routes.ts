import express, { type Express, Request, Response } from "express";
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
  insertChatMessageSchema
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix for all routes
  const router = express.Router();
  app.use("/api", router);

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

  const httpServer = createServer(app);

  // Setup WebSocket server for chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('message', async (data) => {
      try {
        const parsedData = JSON.parse(data.toString());
        
        if (parsedData.type === 'chat-message') {
          const messageData = {
            userId: parsedData.userId,
            livestreamId: parsedData.livestreamId,
            content: parsedData.content
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
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  return httpServer;
}
