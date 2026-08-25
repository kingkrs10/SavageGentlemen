import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { insertSponsoredContentSchema } from "@shared/schema";
import { authenticateUser, authorizeAdmin } from "../auth-middleware";

export const adsRouter = Router();

// Public: Get active ads (optionally filtered by placement slot)
adsRouter.get("/active", async (req: Request, res: Response) => {
  try {
    const placement = req.query.placement as string | undefined;
    const allActive = await storage.getActiveSponsoredContent();

    if (placement && placement !== "all") {
      const filtered = allActive.filter((ad: any) => ad.placement === placement || (!ad.placement && placement === "header_ticker"));
      return res.json(filtered);
    }

    res.json(allActive);
  } catch (error: any) {
    console.error("Error fetching active ads:", error);
    res.status(500).json({ error: "Failed to fetch active ads" });
  }
});

// Public: Record ad impression
adsRouter.post("/:id/view", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (!isNaN(id)) {
      await storage.incrementSponsoredContentViews(id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to track impression" });
  }
});

// Public: Record ad click (POST or GET redirect)
adsRouter.post("/:id/click", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (!isNaN(id)) {
      await storage.incrementSponsoredContentClicks(id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to track click" });
  }
});

// Public: Click-through and redirect directly to destination URL
adsRouter.get(["/:id/click", "/:id/redirect"], async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    let targetUrl = "https://www.carnival-planner.com";
    if (!isNaN(id)) {
      await storage.incrementSponsoredContentClicks(id);
      const allAds = await storage.getActiveSponsoredContent();
      const matched = allAds.find((a: any) => a.id === id);
      if (matched && matched.linkUrl) {
        targetUrl = matched.linkUrl;
      }
    }
    res.redirect(302, targetUrl);
  } catch (error) {
    res.redirect(302, "https://www.carnival-planner.com");
  }
});

// Public: Direct Carnival Planner redirect endpoint
adsRouter.get(["/carnival-planner", "/planner"], (req: Request, res: Response) => {
  res.redirect(302, "https://www.carnival-planner.com");
});

// Admin: Get all ads (active & inactive)
adsRouter.get("/all", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const allAds = await storage.getAllSponsoredContent();
    res.json(allAds);
  } catch (error: any) {
    console.error("Error fetching all ads:", error);
    res.status(500).json({ error: "Failed to fetch ads" });
  }
});

// Admin: Create new ad
adsRouter.post("/admin", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const data = insertSponsoredContentSchema.parse(req.body);
    const newAd = await storage.createSponsoredContent(data);
    res.status(201).json(newAd);
  } catch (error: any) {
    console.error("Error creating ad:", error);
    res.status(400).json({ error: error.message || "Invalid ad data" });
  }
});

// Admin: Update ad
adsRouter.put("/admin/:id", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updatedAd = await storage.updateSponsoredContent(id, req.body);
    res.json(updatedAd);
  } catch (error: any) {
    console.error("Error updating ad:", error);
    res.status(400).json({ error: error.message || "Failed to update ad" });
  }
});

// Admin: Delete ad
adsRouter.delete("/admin/:id", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteSponsoredContent(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting ad:", error);
    res.status(500).json({ error: "Failed to delete ad" });
  }
});
