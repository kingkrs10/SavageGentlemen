import { Request, Response, Router } from "express";
import { storage } from "./storage";
import { insertPageViewSchema, insertUserEventSchema, insertDailyStatSchema } from "@shared/schema";
import { ZodError } from "zod";
import { eq } from "drizzle-orm";

// Create a router for analytics endpoints
export const analyticsRouter = Router();

// Middleware to add CORS headers for analytics endpoints
analyticsRouter.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, user-id");
  next();
});

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

// Track page view
analyticsRouter.post("/page-view", async (req: Request, res: Response) => {
  try {
    const pageViewData = insertPageViewSchema.parse(req.body);
    const pageView = await storage.createPageView(pageViewData);
    return res.status(201).json(pageView);
  } catch (err) {
    return handleZodError(err, res);
  }
});

// Get page views by path
analyticsRouter.get("/page-views/path/:path", async (req: Request, res: Response) => {
  try {
    const path = decodeURIComponent(req.params.path);
    const pageViews = await storage.getPageViewsByPath(path);
    return res.status(200).json(pageViews);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get page views by user ID
analyticsRouter.get("/page-views/user/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const pageViews = await storage.getPageViewsByUserId(userId);
    return res.status(200).json(pageViews);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Event views tracking
analyticsRouter.post("/events/:eventId/view", async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }
    const eventAnalytic = await storage.incrementEventViews(eventId);
    return res.status(200).json(eventAnalytic);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Event ticket clicks tracking
analyticsRouter.post("/events/:eventId/ticket-click", async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }
    const eventAnalytic = await storage.incrementEventTicketClicks(eventId);
    return res.status(200).json(eventAnalytic);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Event ticket sales tracking
analyticsRouter.post("/events/:eventId/ticket-sale", async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }
    const eventAnalytic = await storage.incrementEventTicketSales(eventId);
    return res.status(200).json(eventAnalytic);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get event analytics by event ID
analyticsRouter.get("/events/:eventId/analytics", async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }
    const eventAnalytic = await storage.getEventAnalyticsByEventId(eventId);
    return res.status(200).json(eventAnalytic || { eventId, views: 0, ticketClicks: 0, ticketSales: 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Product views tracking
analyticsRouter.post("/products/:productId/view", async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const productAnalytic = await storage.incrementProductViews(productId);
    return res.status(200).json(productAnalytic);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Product detail clicks tracking
analyticsRouter.post("/products/:productId/detail-click", async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const productAnalytic = await storage.incrementProductDetailClicks(productId);
    return res.status(200).json(productAnalytic);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Product purchase clicks tracking
analyticsRouter.post("/products/:productId/purchase-click", async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const productAnalytic = await storage.incrementProductPurchaseClicks(productId);
    return res.status(200).json(productAnalytic);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get product analytics by product ID
analyticsRouter.get("/products/:productId/analytics", async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const productAnalytic = await storage.getProductAnalyticsByProductId(productId);
    return res.status(200).json(productAnalytic || { productId, views: 0, detailClicks: 0, purchaseClicks: 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Create user event
analyticsRouter.post("/user-event", async (req: Request, res: Response) => {
  try {
    const userEventData = insertUserEventSchema.parse(req.body);
    const userEvent = await storage.createUserEvent(userEventData);
    return res.status(201).json(userEvent);
  } catch (err) {
    return handleZodError(err, res);
  }
});

// Get user events by user ID
analyticsRouter.get("/user-events/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const userEvents = await storage.getUserEventsByUserId(userId);
    return res.status(200).json(userEvents);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Daily stats endpoints
analyticsRouter.post("/daily-stats", async (req: Request, res: Response) => {
  try {
    const dailyStatData = insertDailyStatSchema.parse(req.body);
    const dailyStat = await storage.createDailyStat(dailyStatData);
    return res.status(201).json(dailyStat);
  } catch (err) {
    return handleZodError(err, res);
  }
});

// Get or create daily stat for current day
analyticsRouter.get("/daily-stats/today", async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    try {
      let dailyStat = await storage.getDailyStatByDate(today);
      
      if (!dailyStat) {
        // Create a new daily stat for today with a properly formatted date string
        const formattedDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        dailyStat = await storage.createDailyStat({
          date: formattedDate,
          newUsers: 0,
          activeUsers: 0,
          pageViews: 0,
          eventViews: 0,
          productViews: 0,
          ticketSales: 0,
          productClicks: 0,
          totalRevenue: "0"
        });
      }
      
      return res.status(200).json(dailyStat);
    } catch (storageError) {
      // Provide a fallback response if there's a database access error
      console.error('Error retrieving daily stats:', storageError);
      const formattedDate = today.toISOString().split('T')[0];
      return res.status(200).json({
        id: 0,
        date: formattedDate,
        newUsers: 0,
        activeUsers: 0,
        pageViews: 0,
        eventViews: 0,
        productViews: 0,
        ticketSales: 0,
        productClicks: 0,
        totalRevenue: "0"
      });
    }
  } catch (err) {
    console.error('Unhandled error in daily stats endpoint:', err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Update daily stat for a specific date
analyticsRouter.put("/daily-stats/:date", async (req: Request, res: Response) => {
  try {
    try {
      const dateParam = req.params.date; // Format: YYYY-MM-DD
      const date = new Date(dateParam);
      
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
      }
      
      const updates = req.body;
      
      // Ensure date is stored as string in YYYY-MM-DD format if it's being updated
      if (updates.date && updates.date instanceof Date) {
        updates.date = updates.date.toISOString().split('T')[0];
      }
      
      const updatedStat = await storage.updateDailyStat(date, updates);
      
      if (!updatedStat) {
        // If no stat exists yet, try to create one with the updates
        try {
          const newStat = await storage.createDailyStat({
            date: dateParam,
            newUsers: updates.newUsers || 0,
            activeUsers: updates.activeUsers || 0,
            pageViews: updates.pageViews || 0,
            eventViews: updates.eventViews || 0,
            productViews: updates.productViews || 0,
            ticketSales: updates.ticketSales || 0,
            productClicks: updates.productClicks || 0,
            totalRevenue: updates.totalRevenue || "0"
          });
          return res.status(201).json(newStat);
        } catch (createError) {
          console.error('Error creating new daily stat:', createError);
          return res.status(404).json({ message: "Daily stat not found for this date and could not be created" });
        }
      }
      
      return res.status(200).json(updatedStat);
    } catch (updateError) {
      console.error('Error updating daily stat:', updateError);
      const errorMessage = updateError instanceof Error ? updateError.message : String(updateError);
      return res.status(400).json({ message: "Could not update daily stat", error: errorMessage });
    }
  } catch (err) {
    console.error('Unhandled error in update daily stat endpoint:', err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get daily stats for a date range
analyticsRouter.get("/daily-stats/range", async (req: Request, res: Response) => {
  try {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Both startDate and endDate are required" });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
      }
      
      // Make the end date inclusive by setting it to the end of the day
      end.setHours(23, 59, 59, 999);
      
      const stats = await storage.getDailyStatsByDateRange(start, end);
      
      // Ensure dates are properly formatted in the response
      const formattedStats = stats.map(stat => ({
        ...stat,
        date: typeof stat.date === 'object' && stat.date instanceof Date 
          ? stat.date.toISOString().split('T')[0] 
          : stat.date
      }));
      
      return res.status(200).json(formattedStats);
    } catch (rangeError) {
      console.error('Error retrieving daily stats for range:', rangeError);
      
      // Return empty array with proper error message
      return res.status(200).json({
        stats: [],
        message: "Could not retrieve stats for the specified date range"
      });
    }
  } catch (err) {
    console.error('Unhandled error in daily stats range endpoint:', err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get all analytics data for dashboard
analyticsRouter.get("/dashboard", async (req: Request, res: Response) => {
  try {
    try {
      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get last 7 days
      const last7Days = new Date(today);
      last7Days.setDate(today.getDate() - 6);
      
      // Get last 30 days
      const last30Days = new Date(today);
      last30Days.setDate(today.getDate() - 29);
      
      // Get daily stats for last 30 days
      const dailyStats = await storage.getDailyStatsByDateRange(last30Days, today);
      
      // Calculate totals for the last 7 days
      const last7DaysStats = dailyStats.filter(
        stat => new Date(stat.date).getTime() >= last7Days.getTime()
      );
      
      // Helper function to safely handle null values in sums
      const safeSum = (array: any[], accessor: (item: any) => number): number => {
        return array.reduce((sum, item) => sum + (accessor(item) || 0), 0);
      };
      
      // Helper function to safely handle null values in revenue calculations
      const safeRevenueSum = (array: any[], accessor: (item: any) => string | number | null): string => {
        return array.reduce((sum, item) => {
          const value = accessor(item);
          if (value === null || value === undefined) return sum;
          return sum + (typeof value === 'string' ? parseFloat(value) : value);
        }, 0).toFixed(2);
      };
      
      const summary = {
        totalPageViews: safeSum(dailyStats, stat => stat.pageViews),
        totalEventViews: safeSum(dailyStats, stat => stat.eventViews),
        totalProductViews: safeSum(dailyStats, stat => stat.productViews),
        totalTicketSales: safeSum(dailyStats, stat => stat.ticketSales),
        totalProductClicks: safeSum(dailyStats, stat => stat.productClicks),
        totalRevenue: safeRevenueSum(dailyStats, stat => stat.totalRevenue),
        totalNewUsers: safeSum(dailyStats, stat => stat.newUsers),
        totalActiveUsers: safeSum(dailyStats, stat => stat.activeUsers),
        
        last7Days: {
          pageViews: safeSum(last7DaysStats, stat => stat.pageViews),
          eventViews: safeSum(last7DaysStats, stat => stat.eventViews),
          productViews: safeSum(last7DaysStats, stat => stat.productViews),
          ticketSales: safeSum(last7DaysStats, stat => stat.ticketSales),
          productClicks: safeSum(last7DaysStats, stat => stat.productClicks),
          revenue: safeRevenueSum(last7DaysStats, stat => stat.totalRevenue),
          newUsers: safeSum(last7DaysStats, stat => stat.newUsers),
          activeUsers: safeSum(last7DaysStats, stat => stat.activeUsers),
        },
        
        dailyData: dailyStats.map(stat => ({
          date: stat.date,
          pageViews: stat.pageViews || 0,
          eventViews: stat.eventViews || 0,
          productViews: stat.productViews || 0,
          ticketSales: stat.ticketSales || 0,
          productClicks: stat.productClicks || 0,
          revenue: stat.totalRevenue ? (typeof stat.totalRevenue === 'string' ? parseFloat(stat.totalRevenue) : Number(stat.totalRevenue)) : 0,
          newUsers: stat.newUsers || 0,
          activeUsers: stat.activeUsers || 0
        }))
      };
      
      return res.status(200).json(summary);
    } catch (analyticsError) {
      // Provide a fallback response with default values in case of any error
      console.error('Analytics dashboard error, providing fallback data:', analyticsError);
      
      // Generate empty daily data for the past 30 days
      const dailyData = [];
      const today = new Date();
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        dailyData.push({
          date: date.toISOString().split('T')[0],
          pageViews: 0,
          eventViews: 0,
          productViews: 0,
          ticketSales: 0,
          productClicks: 0,
          revenue: 0,
          newUsers: 0,
          activeUsers: 0
        });
      }
      
      // Return a default summary structure with zeroed values
      const defaultSummary = {
        totalPageViews: 0,
        totalEventViews: 0,
        totalProductViews: 0,
        totalTicketSales: 0,
        totalProductClicks: 0,
        totalRevenue: "0.00",
        totalNewUsers: 0,
        totalActiveUsers: 0,
        
        last7Days: {
          pageViews: 0,
          eventViews: 0,
          productViews: 0,
          ticketSales: 0,
          productClicks: 0,
          revenue: "0.00",
          newUsers: 0,
          activeUsers: 0,
        },
        
        dailyData: dailyData
      };
      
      return res.status(200).json(defaultSummary);
    }
  } catch (err) {
    console.error('Unhandled error in analytics dashboard:', err);
    return res.status(500).json({ message: "Internal server error" });
  }
});