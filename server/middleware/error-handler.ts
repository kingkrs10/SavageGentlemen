import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Enhanced error response structure
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
  };
}

// Custom error classes for better error handling
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'PAYMENT_ERROR');
    this.name = 'PaymentError';
  }
}

// Enhanced error handling middleware
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    user: req.user?.id || 'anonymous'
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        })),
        timestamp: new Date().toISOString(),
        path: req.path
      }
    };
    return res.status(400).json(errorResponse);
  }

  // Handle custom app errors
  if (error instanceof AppError) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.path
      }
    };
    return res.status(error.statusCode).json(errorResponse);
  }

  // Handle database connection errors
  if (error.message.includes('connect ECONNREFUSED') || 
      error.message.includes('Connection terminated')) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'DATABASE_CONNECTION_ERROR',
        message: 'Database connection failed',
        timestamp: new Date().toISOString(),
        path: req.path
      }
    };
    return res.status(503).json(errorResponse);
  }

  // Handle Stripe errors
  if (error.message.includes('stripe') || error.message.includes('payment')) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'PAYMENT_ERROR',
        message: 'Payment processing failed',
        timestamp: new Date().toISOString(),
        path: req.path
      }
    };
    return res.status(400).json(errorResponse);
  }

  // Generic server error
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  };

  res.status(500).json(errorResponse);
};

// Success response helper
export const successResponse = (data: any, message?: string) => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
};

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};