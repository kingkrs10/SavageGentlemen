import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from 'cors';
import path from 'path';
import { securityHeaders, auditLogger, sanitizeInput } from './security/middleware';

const app = express();

// Trust proxy for rate limiting and proper IP detection (needed for Replit)
app.set('trust proxy', true);

// Configure CORS - In development, we're more permissive
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        // Production domains
        'https://savgent.com',
        'https://www.savgent.com',
        'https://sgxmedia.com',
        'https://www.sgxmedia.com',
        /\.savgent\.com$/,
        /\.sgxmedia\.com$/,
        /\.replit\.app$/,
        // Allow all during development, even in production mode
        ...(true ? ['http://localhost:3000', 'http://localhost:5000', /localhost/, /127.0.0.1/] : [])
      ] 
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id', 'X-Firebase-Token'],
  exposedHeaders: ['Content-Length', 'Date'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Apply security headers
app.use(securityHeaders);

// Apply input sanitization
app.use(sanitizeInput);

// Add audit logging for sensitive operations
app.use(auditLogger);

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static file serving for uploads directory with proper MIME types and caching
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  dotfiles: 'deny',
  index: false,
  setHeaders: (res, path) => {
    // Set proper MIME types for different file types
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (path.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (path.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (path.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (path.endsWith('.webm')) {
      res.setHeader('Content-Type', 'video/webm');
    }
    
    // Set CORS headers for cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Set cache headers for optimal performance
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// Alternative uploads route for API compatibility
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  dotfiles: 'deny',
  index: false,
  setHeaders: (res, path) => {
    // Set proper MIME types for different file types
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (path.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (path.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (path.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (path.endsWith('.webm')) {
      res.setHeader('Content-Type', 'video/webm');
    }
    
    // Set CORS headers for cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Set cache headers for optimal performance
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the error with request context for troubleshooting
    console.error(`[ERROR] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | Status: ${status} | ${message}`);
    
    if (err.stack && process.env.NODE_ENV !== 'production') {
      console.error(err.stack);
    }
    
    // Only send detailed error information in development
    if (process.env.NODE_ENV === 'production') {
      // In production, send generic messages for 500 errors to avoid leaking sensitive info
      if (status >= 500) {
        return res.status(status).json({ 
          status: 'error',
          message: 'Internal server error'
        });
      }
    }
    
    // For 4xx errors, it's safe to send the actual error message
    return res.status(status).json({ 
      status: 'error',
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    console.log(`✅ Server is running and accessible on all interfaces at port ${port}`);
    console.log(`🔥 Application ready for deployment at http://0.0.0.0:${port}`);
  });
})();
