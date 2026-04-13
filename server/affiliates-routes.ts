import { Express, Request, Response } from "express";
import { db } from "./db";
import { affiliates, affiliateClicks } from "../shared/schema";
import { eq, count, sql, desc, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { authenticateUser, requireAdmin } from "./auth-middleware";

export function registerAffiliatesRoutes(app: Express) {
  // Helper for tracking and cookie setting
  const trackAffiliateClick = async (res: Response, affiliateId: number, ip: string) => {
    // 1. Record the click
    await db.insert(affiliateClicks).values({
      affiliateId,
      ipAddress: ip,
    });

    // 2. Set the 30-day tracking cookie
    res.cookie('sg_affiliate_id', affiliateId.toString(), {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  };

  // 1. Redirect Endpoint /api/ref (legacy supports ?a=ID)
  app.get("/api/ref", async (req: Request, res: Response) => {
    try {
      const affiliateId = req.query.a ? parseInt(req.query.a as string, 10) : null;
      let redirectTo = (req.query.redirect as string) || "/";
      
      // Retroactive fix: if old link points to broken product page, redirect to home
      if (redirectTo.includes("/products/soca-noir-rose")) {
        redirectTo = "/";
      }

      const ip = (req.headers["x-forwarded-for"] as string) || req.ip || "127.0.0.1";
      
      if (affiliateId && !isNaN(affiliateId)) {
        await trackAffiliateClick(res, affiliateId, ip);
      }
      res.redirect(redirectTo);
    } catch (error: any) {
      console.error("Affiliate tracking error:", error);
      res.redirect("/");
    }
  });

  // 1b. Pretty Redirect Endpoint /ref/:code
  app.get("/ref/:code", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const redirectTo = (req.query.redirect as string) || "/";
      const ip = (req.headers["x-forwarded-for"] as string) || req.ip || "127.0.0.1";

      const [affiliate] = await db
        .select()
        .from(affiliates)
        .where(eq(affiliates.referralCode, code.toUpperCase()));

      if (affiliate) {
        await trackAffiliateClick(res, affiliate.id, ip);
      }

      res.redirect(redirectTo);
    } catch (error: any) {
      console.error("Affiliate code redirect error:", error);
      res.redirect("/");
    }
  });

  // 1c. Short ID Redirect Endpoint /a/:id
  app.get("/a/:id", async (req: Request, res: Response) => {
    try {
      const affiliateId = parseInt(req.params.id, 10);
      const redirectTo = (req.query.redirect as string) || "/";
      const ip = (req.headers["x-forwarded-for"] as string) || req.ip || "127.0.0.1";

      if (!isNaN(affiliateId)) {
        await trackAffiliateClick(res, affiliateId, ip);
      }
      res.redirect(redirectTo);
    } catch (error: any) {
      console.error("Affiliate ID redirect error:", error);
      res.redirect("/");
    }
  });

  // 2. User Specific Affiliate Endpoints /api/users/:id/affiliate
  app.get("/api/users/:id/affiliate", authenticateUser, async (req: Request, res: Response) => {
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
      
      // Fetch actual conversions from orders table
      const conversionStats = await db.execute(sql`
        SELECT 
          COUNT(*)::int as "count",
          COALESCE(SUM(total_amount), 0)::int as "revenue"
        FROM orders
        WHERE affiliate_id = ${affiliate.id} AND status = 'completed'
      `);
      
      const stats = conversionStats.rows[0] as { count: number, revenue: number };
      
      return res.json({
        affiliate,
        clicks: clickCount,
        conversions: stats.count,
        revenue: stats.revenue,
      });

    } catch (error: any) {
      console.error("Error fetching affiliate data", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/users/:id/affiliate", authenticateUser, async (req: Request, res: Response) => {
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
  app.get("/api/admin/affiliates", authenticateUser, requireAdmin, async (req: Request, res: Response) => {
    try {
      // Improved query to get real stats
      const performanceRecords = await db.execute(sql`
        SELECT 
          a.id, 
          a.user_id as "userId",
          a.referral_code as "referralCode",
          a.status,
          a.created_at as "createdAt",
          u.username,
          u.email,
          (SELECT COUNT(*) FROM affiliate_clicks WHERE affiliate_id = a.id)::int as "totalClicks",
          (SELECT COUNT(*) FROM orders WHERE affiliate_id = a.id AND status = 'completed')::int as "totalConversions",
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE affiliate_id = a.id AND status = 'completed')::int as "totalRevenueGenerated"
        FROM affiliates a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY "totalClicks" DESC
      `);

      const [{ overallClicks }] = await db
        .select({ overallClicks: count() })
        .from(affiliateClicks);

      const overallStats = await db.execute(sql`
        SELECT 
          COUNT(*)::int as "count",
          COALESCE(SUM(total_amount), 0)::int as "revenue"
        FROM orders
        WHERE affiliate_id IS NOT NULL AND status = 'completed'
      `);
      
      const stats = overallStats.rows[0] as { count: number, revenue: number };

      return res.json({
        performance: performanceRecords.rows,
        overallClicks,
        overallConversions: stats.count,
        overallRevenue: stats.revenue,
      });

    } catch (error: any) {
      console.error("Error fetching admin affiliate data", error);
      res.status(500).json({ error: "Server error" });
    }
  });
}
