import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { parse } from 'cookie';
import { randomBytes } from 'crypto';

/**
 * Enhanced validation middleware that validates request data against a Zod schema
 * and provides better error messages
 */
export const validateRequest = <T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the data from the specified source
      const data = req[source];
      
      // Parse and validate the data
      const validatedData = schema.parse(data);
      
      // Replace the request data with the validated data
      req[source] = validatedData;
      
      // Continue to the next middleware
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format the errors in a user-friendly way
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        // Return a 400 Bad Request with the validation errors
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: formattedErrors
        });
      }
      
      // For other errors, log and pass to error handler
      console.error('Validation error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during validation'
      });
    }
  };
};

/**
 * Rate limiting middleware to prevent brute force attacks
 */
export const createRateLimiter = (
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 100, // limit each IP to 100 requests per windowMs
  message = 'Too many requests from this IP, please try again later'
) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { status: 'error', message }
  });
};

/**
 * Authentication rate limiter specifically for login/auth endpoints
 */
export const authRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  20, // 20 attempts per hour (increased from 5)
  'Too many login attempts, please try again later'
);

/**
 * Security headers middleware using helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://www.paypal.com", "https://00dcd90e-d031-4095-90fd-c1ff532901ca-00-wc6t90e8ztsv.riker.replit.dev"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://i.etsystatic.com", "https://printify.com", "https:", "*.replit.dev", "*.replit.app"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://www.paypal.com", "https://fonts.googleapis.com", "https://fonts.gstatic.com", "https://00dcd90e-d031-4095-90fd-c1ff532901ca-00-wc6t90e8ztsv.riker.replit.dev"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://www.paypal.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  // Hide X-Powered-By header
  hidePoweredBy: true,
  // Set strict Transport Security for 1 year, including subdomains
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  // Do not allow the page to be framed
  frameguard: { 
    action: 'deny' 
  },
  // Additional security settings are managed by Helmet's defaults
});

/**
 * Generate a CSRF token
 */
export const generateCsrfToken = (): string => {
  return randomBytes(32).toString('hex');
};

/**
 * CSRF protection middleware
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF check for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const csrfCookie = parse(req.headers.cookie || '').csrfToken;
  const csrfHeader = req.headers['x-csrf-token'] as string;

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({
      status: 'error',
      message: 'CSRF token validation failed'
    });
  }

  next();
};

/**
 * Sanitize middleware to sanitize input
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  // Function to deeply sanitize an object
  const sanitizeObject = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      // Basic XSS protection for strings
      return obj
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }

    if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
      }

      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  };

  // Sanitize request body, query, and params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Log request information for audit trail
 */
export const auditLogger = (req: Request, _res: Response, next: NextFunction) => {
  // Only log state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const userId = req.headers['user-id'] || 'anonymous';
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    
    console.log(`[AUDIT] ${new Date().toISOString()} | User: ${userId} | IP: ${ipAddress} | ${req.method} ${req.originalUrl}`);
    
    // For sensitive operations, we could log more details
    if (req.originalUrl.includes('/admin/') || req.originalUrl.includes('/payment/')) {
      console.log(`[SENSITIVE OPERATION] Details: ${JSON.stringify({
        method: req.method,
        path: req.originalUrl,
        user: userId,
        ip: ipAddress,
        userAgent: req.headers['user-agent']
      })}`);
    }
  }
  
  next();
};