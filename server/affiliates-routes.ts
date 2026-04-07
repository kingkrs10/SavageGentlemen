import { Express, Request, Response } from "express";
import { db } from "./db";
import { affiliates, affiliateClicks } from "../shared/schema";
import { eq, count, sql, desc, and } from "drizzle-orm";
import { randomBytes } from "crypto";

export function registerAffiliatesRoutes(app: Express) {
  // 1. Redirect Endpoint /api/ref
  app.get("/api/ref", async (req: Request, res: Response) => {
    try {
      const affiliateId = req.query.a ? parseInt(req.query.a as string, 10) : null;
      const redirectTo = (req.query.redirect as string) || "/";
      
      const ip = (req.headers["x-forwarded-for"] as string) || "127.0.0.1";
      
      if (affiliateId && !isNaN(affiliateId)) {
        // Track the click
        await db.insert(affiliateClicks).values({
          affiliateId,
          ipAddress: ip,
        });

        // Store active affiliate info in cookie
        res.cookie('sg_affiliate_id', affiliateId.toString(), {
          maxAge: 30 * 24 * 60 * 60 * 1000, 
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });
      }

      res.redirect(redirectTo);
    } catch (error: any) {
      console.error("Affiliate tracking error:", error);
      res.redirect((req.query.redirect as string) || "/");
    }
  });

  // 2. User Specific Affiliate Endpoints /api/users/:id/affiliate
  app.get("/api/users/:id/affiliate", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) return res.status(400).json({ error: "Invalid user ID" });
      
      if (!req.user || req.user.id !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const affiliateRecords = await db.select().from(affiliates).where(eq(affiliates.userId, userId));

      if (affiliateRecords.length === 0) {
        return res.json({ affiliate: null, clicks: 0, conversions: 0, revenue: 0 });
      }

      const affiliate = affiliateRecords[0];

      const [{ clickCount }] = await db
        .select({ clickCount: count() })
        .from(affiliateClicks)
        .where(eq(affiliateClicks.affiliateId, affiliate.id));
      
      return res.json({
        affiliate,
        clicks: clickCount,
        conversions: 0,
        revenue: 0,
      });

    } catch (error: any) {
      console.error("Error fetching affiliate data", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/users/:id/affiliate", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) return res.status(400).json({ error: "Invalid user ID" });
      
      if (!req.user || req.user.id !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const existingRecords = await db.select().from(affiliates).where(eq(affiliates.userId, userId));
      
      if (existingRecords.length > 0) {
        return res.status(400).json({ error: "User is already an affiliate" });
      }
      
      const referralCode = randomBytes(4).toString("hex").toUpperCase();
      
      const [newAffiliate] = await db.insert(affiliates).values({
        userId,
        referralCode,
        status: "active",
      }).returning();
      
      return res.json(newAffiliate);
    } catch (error: any) {
      console.error("Error creating affiliate", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // 3. Admin endpoints /api/admin/affiliates
  app.get("/api/admin/affiliates", async (req: Request, res: Response) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const performanceRecords = await db.execute(sql`
        SELECT 
          a.id, 
          a.user_id as "userId",
          a.referral_code as "referralCode",
          a.status,
          a.created_at as "createdAt",
          u.username,
          u.email,
          COUNT(ac.id) as "totalClicks",
          0 as "totalConversions",
          0 as "totalRevenueGenerated"
        FROM affiliates a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN affiliate_clicks ac ON ac.affiliate_id = a.id
        GROUP BY a.id, u.username, u.email
        ORDER BY "totalClicks" DESC
      `);

      const [{ overallClicks }] = await db
        .select({ overallClicks: count() })
        .from(affiliateClicks);

      return res.json({
        performance: performanceRecords.rows,
        overallClicks,
        overallConversions: 0,
        overallRevenue: 0,
      });

    } catch (error: any) {
      console.error("Error fetching admin affiliate data", error);
      res.status(500).json({ error: "Server error" });
    }
  });
}
