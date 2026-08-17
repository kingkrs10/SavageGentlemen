import { Router, Request, Response } from "express";
import { generateProductVideoAd, getGeneratedAdsHistory } from "../services/ad-video-generator";
import { publishToSocialMedia } from "../services/social-publisher";
import { moneyprinterService } from "../services/moneyprinter-service";
import { SAVAGE_MERCH_CATALOG } from "../services/printify-service";
import { db } from "../db";
import { events } from "@shared/schema";
import { desc } from "drizzle-orm";

export const adAutomationRouter = Router();

// In-memory publishing log cache
const publishingLogs: any[] = [];

// GET /api/ad-automation/catalog — Fetch all eligible products & events for ad generation
adAutomationRouter.get("/catalog", async (req: Request, res: Response) => {
  try {
    // 1. Get Merch Items
    const merchItems = SAVAGE_MERCH_CATALOG.map((item) => ({
      id: item.id,
      type: "merch",
      title: item.title,
      category: item.category,
      price: item.price,
      priceFormatted: `$${(item.price / 100).toFixed(2)}`,
      description: item.description,
      imageUrl: item.images[0] || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&h=1000&fit=crop",
      suggestedHook: `🚨 EXCLUSIVE DROP: ${item.title.toUpperCase()}`,
      suggestedCaption: `Elevate your streetwear standard with the ${item.title}. Limited handcrafted batch.`,
      productLink: `https://savagegentlemen.com/shop`
    }));

    // 2. Get Events
    let eventItems: any[] = [];
    try {
      const recentEvents = await db.select().from(events).orderBy(desc(events.id)).limit(5);
      eventItems = recentEvents.map((ev) => ({
        id: `event-${ev.id}`,
        type: "event",
        title: ev.title,
        category: ev.category || "VIP Experience",
        price: ev.price || 3500,
        priceFormatted: `$${((ev.price || 3500) / 100).toFixed(2)}`,
        description: ev.description || "The premier Caribbean luxury event of the season.",
        imageUrl: ev.imageUrl || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=1000&fit=crop",
        suggestedHook: `🔥 TICKET ALERT: ${ev.title.toUpperCase()}`,
        suggestedCaption: `Experience ${ev.title}. Secure your VIP passes before tier closes.`,
        productLink: `https://savagegentlemen.com/events/${ev.id}`
      }));
    } catch {}

    res.json({
      merch: merchItems,
      events: eventItems,
      total: merchItems.length + eventItems.length
    });
  } catch (error: any) {
    console.error("[AdAutomationRouter] Catalog error:", error);
    res.status(500).json({ error: "Failed to fetch advertising catalog" });
  }
});

// POST /api/ad-automation/generate — Compile 9:16 vertical video ad
adAutomationRouter.post("/generate", async (req: Request, res: Response) => {
  try {
    const {
      id,
      title,
      category,
      priceFormatted,
      description,
      imageUrl,
      ctaText,
      stylePreset,
      durationSeconds
    } = req.body;

    if (!title || !imageUrl) {
      return res.status(400).json({ error: "Title and Image URL are required" });
    }

    const result = await generateProductVideoAd({
      id: id || `item_${Date.now()}`,
      title,
      category: category || "EXCLUSIVE DROP",
      priceFormatted: priceFormatted || "$45.00",
      description: description || "",
      imageUrl,
      ctaText: ctaText || "SHOP NOW • SAVAGEGENTLEMEN.COM",
      stylePreset: stylePreset || "dark-luxury",
      durationSeconds: durationSeconds ? parseInt(durationSeconds) : 15
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error("[AdAutomationRouter] Generate error:", error);
    res.status(500).json({ error: error.message || "Failed to generate video ad" });
  }
});

// POST /api/ad-automation/publish — Broadcast video to social channels
adAutomationRouter.post("/publish", async (req: Request, res: Response) => {
  try {
    const {
      videoUrl,
      caption,
      platforms,
      title,
      hashtags,
      productLink,
      isTestMode
    } = req.body;

    if (!videoUrl || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ error: "Video URL and at least one target platform are required" });
    }

    const host = req.headers.host || "savagegentlemen.com";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const absoluteVideoUrl = videoUrl.startsWith("http") ? videoUrl : `${protocol}://${host}${videoUrl}`;

    const publishResult = await publishToSocialMedia({
      videoUrl: absoluteVideoUrl,
      caption: caption || "Check out the newest drop from Savage Gentlemen.",
      platforms,
      title,
      hashtags,
      productLink,
      isTestMode: isTestMode ?? false
    });

    // Record in memory log
    publishingLogs.unshift({
      id: `pub_${Date.now()}`,
      videoUrl,
      title: title || "Ad Broadcast",
      platforms,
      result: publishResult,
      timestamp: new Date().toISOString()
    });

    res.json(publishResult);
  } catch (error: any) {
    console.error("[AdAutomationRouter] Publish error:", error);
    res.status(500).json({ error: error.message || "Failed to publish social media ad" });
  }
});

// GET /api/ad-automation/history — View generated ads & publishing logs
adAutomationRouter.get("/history", async (req: Request, res: Response) => {
  try {
    const videoFiles = getGeneratedAdsHistory();
    res.json({
      videos: videoFiles,
      publishingLogs: publishingLogs.slice(0, 30)
    });
  } catch (error: any) {
    console.error("[AdAutomationRouter] History error:", error);
    res.status(500).json({ error: "Failed to fetch ads history" });
  }
});

// GET /api/ad-automation/moneyprinter/health — Check MoneyPrinterTurbo microservice status
adAutomationRouter.get("/moneyprinter/health", async (req: Request, res: Response) => {
  try {
    const status = await moneyprinterService.checkHealth();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ online: false, message: error.message });
  }
});

// POST /api/ad-automation/moneyprinter/generate — Generate AI Narrated Video Reel
adAutomationRouter.post("/moneyprinter/generate", async (req: Request, res: Response) => {
  try {
    const { videoSubject, videoScript, videoTerms, voiceName } = req.body;

    if (!videoSubject) {
      return res.status(400).json({ error: "videoSubject is required" });
    }

    const health = await moneyprinterService.checkHealth();

    if (!health.online) {
      // Return helpful fallback response if microservice is offline
      return res.json({
        success: false,
        fallbackMode: true,
        message: "MoneyPrinterTurbo microservice is currently offline. You can start it via Docker or use the local studio generator.",
        health
      });
    }

    const taskId = await moneyprinterService.submitTask({
      videoSubject,
      videoScript,
      videoTerms,
      voiceName,
      videoAspect: "9:16"
    });

    const taskResult = await moneyprinterService.pollTask(taskId, 120);

    if (taskResult.status === "completed" && taskResult.videoUrl) {
      const localUrl = await moneyprinterService.saveVideoLocally(taskResult.videoUrl, "custom_reel");
      return res.status(201).json({
        success: true,
        videoUrl: localUrl,
        engine: "moneyprinter",
        taskId
      });
    }

    res.status(500).json({
      success: false,
      error: taskResult.error || "Video generation failed"
    });
  } catch (error: any) {
    console.error("[AdAutomationRouter] MoneyPrinter generate error:", error);
    res.status(500).json({ error: error.message || "Failed to generate video reel" });
  }
});
