import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { insertArticleSchema } from "@shared/schema";
import { magazineBot } from "../workers/magazine-bot";
import { instagramBot } from "../workers/instagram-bot";
import { socialAutoPoster } from "../workers/social-autoposter";
import { authenticateUser, authorizeAdmin } from "../auth-middleware";

export const magazineRouter = Router();

// Public: Get all articles (with category, limit, offset filtering)
magazineRouter.get("/articles", async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const isPublished = true;

    let articles = await storage.getAllArticles({
      category,
      isPublished,
      limit,
      offset,
    });

    if (articles.length === 0 && (!category || category === "all")) {
      console.log("[Magazine] DB has 0 articles. Seeding starter stories immediately...");
      await magazineBot.seedInitialArticlesIfEmpty();
      magazineBot.syncFeeds().catch(err => console.error("[Magazine] Auto-sync error:", err));

      articles = await storage.getAllArticles({
        category,
        isPublished,
        limit,
        offset,
      });
    }

    res.json(articles);
  } catch (error: any) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});

// Public: Get featured top stories
magazineRouter.get("/articles/featured", async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
    const featured = await storage.getFeaturedArticles(limit);
    res.json(featured);
  } catch (error: any) {
    console.error("Error fetching featured articles:", error);
    res.status(500).json({ error: "Failed to fetch featured articles" });
  }
});

// Public: Get single article by slug & record view
magazineRouter.get("/articles/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const article = await storage.getArticleBySlug(slug);

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    // Increment view asynchronously
    storage.incrementArticleViews(article.id).catch(err => console.error("Error updating views:", err));

    res.json(article);
  } catch (error: any) {
    console.error("Error fetching article:", error);
    res.status(500).json({ error: "Failed to fetch article" });
  }
});

// Public: Like an article
magazineRouter.post("/articles/:id/like", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await storage.incrementArticleLikes(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to like article" });
  }
});

// Trigger instant RSS crawl and AI editorial generation (Public / Webhook / Admin)
magazineRouter.post("/sync", async (req: Request, res: Response) => {
  try {
    const result = await magazineBot.syncFeeds();
    res.json({
      success: true,
      message: `Sync complete. ${result.createdCount} new articles ingested.`,
      ...result,
    });
  } catch (error: any) {
    console.error("Error running magazine sync:", error);
    res.status(500).json({ error: error.message || "Failed to trigger sync" });
  }
});

// Admin: Trigger instant RSS crawl and AI editorial generation
magazineRouter.post("/admin/sync", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const result = await magazineBot.syncFeeds();
    res.json({
      success: true,
      message: `Sync complete. ${result.createdCount} new articles ingested.`,
      ...result,
    });
  } catch (error: any) {
    console.error("Error running magazine sync:", error);
    res.status(500).json({ error: error.message || "Failed to trigger sync" });
  }
});

// Admin: Trigger Instagram auto-post for an article
magazineRouter.post("/admin/publish-ig/:id", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await instagramBot.publishArticlePost(id);
    res.json(result);
  } catch (error: any) {
    console.error("Error publishing to Instagram:", error);
    res.status(500).json({ error: error.message || "Failed to publish to Instagram" });
  }
});

// Admin: Create manual article
magazineRouter.post("/admin/articles", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const data = insertArticleSchema.parse(req.body);
    const article = await storage.createArticle(data);
    res.status(201).json(article);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Invalid article data" });
  }
});

// Admin: Update article
magazineRouter.put("/admin/articles/:id", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const article = await storage.updateArticle(id, req.body);
    res.json(article);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to update article" });
  }
});

// Admin / Public: Get Autopilot 2-Post-Per-Day Status
magazineRouter.get("/autopilot/status", async (req: Request, res: Response) => {
  try {
    const status = await socialAutoPoster.getStatus();
    res.json(status);
  } catch (error: any) {
    console.error("Error fetching autopilot status:", error);
    res.status(500).json({ error: "Failed to fetch autopilot status" });
  }
});

// Admin: Toggle Autopilot (Enable/Disable)
magazineRouter.post("/admin/autopilot/toggle", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    const updatedStatus = await socialAutoPoster.setEnabled(!!enabled);
    res.json({
      success: true,
      message: `Autopilot is now ${enabled ? "active" : "paused"}.`,
      status: updatedStatus,
    });
  } catch (error: any) {
    console.error("Error toggling autopilot:", error);
    res.status(500).json({ error: "Failed to toggle autopilot" });
  }
});

// Admin: Manually Trigger Next Scheduled Social Post Now
magazineRouter.post("/admin/autopilot/trigger-now", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const result = await socialAutoPoster.executeAutoPost();
    res.json(result);
  } catch (error: any) {
    console.error("Error executing manual auto-post:", error);
    res.status(500).json({ error: error.message || "Failed to execute auto-post" });
  }
});

// Admin: Delete article
magazineRouter.delete("/admin/articles/:id", authenticateUser, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteArticle(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete article" });
  }
});
