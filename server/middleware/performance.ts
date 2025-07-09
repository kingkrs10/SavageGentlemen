import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

// Performance monitoring middleware
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  
  // Track request start time
  req.startTime = startTime;
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    // Log performance metrics
    console.log(`[PERF] ${req.method} ${req.path} - ${responseTime.toFixed(2)}ms`);
    
    // Store metrics for analytics
    storePerformanceMetric({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      timestamp: new Date(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Memory usage monitoring
export const memoryMonitor = () => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    uptime: process.uptime()
  };
};

// Database query performance tracking
export const trackDatabaseQuery = (query: string, duration: number) => {
  console.log(`[DB] ${query} - ${duration.toFixed(2)}ms`);
  
  // Store database performance metrics
  storeDatabaseMetric({
    query,
    duration,
    timestamp: new Date(),
    isSlowQuery: duration > 1000 // Flag queries over 1 second
  });
};

// Store performance metrics (implement based on your storage solution)
const storePerformanceMetric = (metric: any) => {
  // This would typically store to a database or metrics service
  // For now, we'll just keep in memory with a simple cache
  if (!global.performanceMetrics) {
    global.performanceMetrics = [];
  }
  
  global.performanceMetrics.push(metric);
  
  // Keep only last 1000 metrics to prevent memory leak
  if (global.performanceMetrics.length > 1000) {
    global.performanceMetrics = global.performanceMetrics.slice(-1000);
  }
};

const storeDatabaseMetric = (metric: any) => {
  if (!global.databaseMetrics) {
    global.databaseMetrics = [];
  }
  
  global.databaseMetrics.push(metric);
  
  // Keep only last 1000 metrics
  if (global.databaseMetrics.length > 1000) {
    global.databaseMetrics = global.databaseMetrics.slice(-1000);
  }
};

// Get performance metrics
export const getPerformanceMetrics = () => {
  return global.performanceMetrics || [];
};

export const getDatabaseMetrics = () => {
  return global.databaseMetrics || [];
};

// Error rate tracking
export const trackError = (error: Error, req: Request) => {
  const errorMetric = {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date(),
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };
  
  if (!global.errorMetrics) {
    global.errorMetrics = [];
  }
  
  global.errorMetrics.push(errorMetric);
  
  // Keep only last 1000 errors
  if (global.errorMetrics.length > 1000) {
    global.errorMetrics = global.errorMetrics.slice(-1000);
  }
};

export const getErrorMetrics = () => {
  return global.errorMetrics || [];
};

// Health check endpoint data
export const getHealthStatus = () => {
  const memory = memoryMonitor();
  const performanceMetrics = getPerformanceMetrics();
  const databaseMetrics = getDatabaseMetrics();
  const errorMetrics = getErrorMetrics();
  
  // Calculate average response time for last 100 requests
  const recentMetrics = performanceMetrics.slice(-100);
  const avgResponseTime = recentMetrics.length > 0 
    ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length 
    : 0;
  
  // Calculate error rate for last 100 requests
  const recentErrors = errorMetrics.slice(-100);
  const errorRate = recentMetrics.length > 0 
    ? (recentErrors.length / recentMetrics.length) * 100 
    : 0;
  
  // Calculate database performance
  const recentDbMetrics = databaseMetrics.slice(-100);
  const avgDbTime = recentDbMetrics.length > 0
    ? recentDbMetrics.reduce((sum, m) => sum + m.duration, 0) / recentDbMetrics.length
    : 0;
  
  const slowQueries = recentDbMetrics.filter(m => m.isSlowQuery).length;
  
  return {
    status: 'healthy',
    timestamp: new Date(),
    system: {
      uptime: memory.uptime,
      memory: memory.memory,
      cpu: memory.cpu
    },
    performance: {
      avgResponseTime,
      errorRate,
      requestsPerMinute: Math.round(recentMetrics.length / 10) * 6 // Estimate based on last 10 minutes
    },
    database: {
      avgQueryTime: avgDbTime,
      slowQueries,
      connectionPool: 'healthy' // This would be dynamic based on actual pool
    }
  };
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
  
  var performanceMetrics: any[];
  var databaseMetrics: any[];
  var errorMetrics: any[];
}