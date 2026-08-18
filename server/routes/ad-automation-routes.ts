import { Router, Request, Response } from "express";
import { generateProductVideoAd, getGeneratedAdsHistory } from "../services/ad-video-generator";
import { publishToSocialMedia } from "../services/social-publisher";
import { moneyprinterService } from "../services/moneyprinter-service";
import { SAVAGE_MERCH_CATALOG } from "../services/printify-service";
import { db } from "../db";
import { events, sponsoredContent } from "@shared/schema";
import { desc, sql } from "drizzle-orm";

export const adAutomationRouter = Router();

// In-memory publishing log cache
const publishingLogs: any[] = [];

// Curated Viral Hooks Matrix for high-converting marketing campaigns
export const VIRAL_HOOKS_MATRIX = [
  {
    category: "fomo",
    label: "FOMO & Scarcity",
    hooks: [
      "🚨 ONLY 50 PIECES MADE. When this drop sells out, it will never restock.",
      "⚡ TIER 1 PASSES ARE 90% SOLD OUT. Don't get stuck paying door price.",
      "🛑 Stop buying fast-fashion streetwear that shrinks after one fete.",
      "⏳ The clock is ticking on our early-bird VIP release."
    ]
  },
  {
    category: "status",
    label: "Luxury Status & Exclusivity",
    hooks: [
      "👑 POV: You just walked into the Caribbean VIP section everyone is talking about.",
      "✨ Handcrafted 480GSM French Terry. Designed for those who set the standard.",
      "🍸 Laser-engraved matte black barware engineered for high-energy nightlife.",
      "🔥 The official Obsidian & Gold dress code experience."
    ]
  },
  {
    category: "value",
    label: "Soca Passport & Rewards",
    hooks: [
      "🌴 You party all year. Why aren't you getting rewarded for it?",
      "🎁 Claim 100 free Soca Passport points today and unlock your first drink perk.",
      "💳 Every Caribbean event you attend now earns you free VIP tickets and merch.",
      "🚀 Promoters: Stop losing 15% to Eventbrite fees on every ticket."
    ]
  },
  {
    category: "music",
    label: "Soundclash & Energy",
    hooks: [
      "🔊 Turn the bass up. The uncensored 135BPM studio dubplates just dropped.",
      "🎧 The live recordings and riddims radio stations are too afraid to play.",
      "⚡ Full uncompressed soundclash masters available for $1.99."
    ]
  }
];

// GET /api/ad-automation/catalog — Fetch all eligible products, events, passport & mixes
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
      productLink: `https://savagegentlemen.com/shop`,
      defaultPlacement: "shop_feed"
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
        productLink: `https://savagegentlemen.com/events/${ev.id}`,
        defaultPlacement: "article_sidebar"
      }));
    } catch {}

    // 3. Soca Passport Loyalty Program Item
    const passportItem = {
      id: "soca_passport_vip",
      type: "passport",
      title: "Soca Passport Loyalty Membership",
      category: "LOYALTY PROGRAM",
      price: 0,
      priceFormatted: "FREE (100 BONUS PTS)",
      description: "Attend events, earn digital passport stamps, and unlock free VIP passes, drink discounts, and exclusive soundclash merch.",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=600&fit=crop",
      suggestedHook: "🌴 You party all year. Why aren't you getting paid for it?",
      suggestedCaption: "Join thousands of Caribbean music lovers earning stamps and VIP perks at every fete with Soca Passport.",
      productLink: "https://savagegentlemen.com/socapassport/dashboard",
      defaultPlacement: "article_inline"
    };

    // 4. Music Mixes Item
    const musicMixItem = {
      id: "soundclash_dubplates_hq",
      type: "media",
      title: "Uncensored Soundclash Dubplates & 135BPM Stems",
      category: "STUDIO MASTER",
      price: 199,
      priceFormatted: "$1.99",
      description: "High-bitrate studio master recordings and uncensored live soundclash dubplates.",
      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=800&fit=crop",
      suggestedHook: "🔊 Turn the bass up. The uncensored 135BPM studio dubplates just dropped.",
      suggestedCaption: "Download the full uncompressed soundclash master session for $1.99.",
      productLink: "https://savagegentlemen.com/media",
      defaultPlacement: "audio_player"
    };

    // 5. Promoter Subscription Item
    const promoterItem = {
      id: "promoter_subscription_plan",
      type: "promoter",
      title: "Soca Passport for Event Promoters",
      category: "PROMOTER PLATFORM",
      price: 3900,
      priceFormatted: "$39.00 / EVENT",
      description: "Keep 100% of your ticket revenue, instant QR scanner app, and automated attendee SMS/email marketing.",
      imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=800&fit=crop",
      suggestedHook: "🚀 Promoters: Stop losing 15% to Eventbrite fees on every ticket.",
      suggestedCaption: "Scale your Caribbean events with automated ticketing, loyalty check-ins, and zero middlemen.",
      productLink: "https://savagegentlemen.com/socapassport/promoters",
      defaultPlacement: "header_ticker"
    };

    res.json({
      merch: merchItems,
      events: eventItems,
      passport: [passportItem],
      media: [musicMixItem],
      promoter: [promoterItem],
      viralHooks: VIRAL_HOOKS_MATRIX,
      total: merchItems.length + eventItems.length + 3
    });
  } catch (error: any) {
    console.error("[AdAutomationRouter] Catalog error:", error);
    res.status(500).json({ error: "Failed to fetch advertising catalog" });
  }
});

// POST /api/ad-automation/generate — Compile 9:16 vertical or 16:9 landscape video ad
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
      aspectRatio,
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
      aspectRatio: aspectRatio || "9:16",
      durationSeconds: durationSeconds ? parseInt(durationSeconds) : 12
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error("[AdAutomationRouter] Generate error:", error);
    res.status(500).json({ error: error.message || "Failed to generate video ad" });
  }
});

// POST /api/ad-automation/deploy-to-site — 1-Click deploy creative directly to live site placements
adAutomationRouter.post("/deploy-to-site", async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      placement,
      linkUrl,
      ctaText,
      imageUrl,
      price,
      type,
      priority
    } = req.body;

    if (!title || !placement) {
      return res.status(400).json({ error: "Title and placement slot are required" });
    }

    const validPlacements = ["header_ticker", "article_inline", "article_sidebar", "shop_feed", "audio_player"];
    const targetPlacement = validPlacements.includes(placement) ? placement : "header_ticker";

    // Insert new ad into sponsored_content
    const result = await db.insert(sponsoredContent).values({
      title,
      description: description || "Exclusive feature from Savage Gentlemen.",
      placement: targetPlacement,
      type: type || "banner",
      linkUrl: linkUrl || "/shop",
      ctaText: ctaText || "Explore Now",
      imageUrl: imageUrl || null,
      price: price || null,
      priority: priority ? parseInt(priority) : 100,
      isActive: true,
    }).returning();

    console.log(`[AdAutomation] 🚀 Deployed ad to live site [${targetPlacement}]: "${title}"`);

    res.status(201).json({
      success: true,
      message: `Successfully deployed ad to live site [${targetPlacement}]!`,
      ad: result[0]
    });
  } catch (error: any) {
    console.error("[AdAutomationRouter] Deploy to site error:", error);
    res.status(500).json({ error: error.message || "Failed to deploy ad to site" });
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
      hashtags: hashtags || ["#SavageGentlemen", "#LuxuryStreetwear", "#CaribbeanCulture", "#CarnivalVibes"],
      productLink: productLink || "https://savagegentlemen.com",
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
