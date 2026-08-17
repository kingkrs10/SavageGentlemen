import { storage } from "../storage";
import { instagramBot } from "./instagram-bot";
import { magazineBot } from "./magazine-bot";
import { moneyprinterService } from "../services/moneyprinter-service";
import { db } from "../db";
import { siteSettings } from "@shared/schema";
import { eq } from "drizzle-orm";

interface AutoPosterStatus {
  enabled: boolean;
  postsPerDay: number;
  scheduledSlotsEST: string[]; // ["11:00", "19:00"]
  lastPostTime: string | null;
  lastPostTitle: string | null;
  lastPostChannel: string | null;
  nextScheduledPostTime: string;
  totalAutoPosted: number;
  isRunning: boolean;
  videoEngineStatus?: {
    online: boolean;
    apiUrl: string;
    message: string;
  };
}

const SETTING_KEY = "social_autoposter_config";

export class SocialAutoPoster {
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private enabled: boolean = true;
  private postsPerDay: number = 2;
  private scheduledHoursEST: number[] = [11, 19]; // 11:00 AM & 7:00 PM EST
  private lastPostDateSlot: string = ""; // e.g. "2026-08-16_11"
  private lastPostTitle: string | null = null;
  private lastPostTime: string | null = null;
  private lastPostChannel: string | null = null;
  private totalAutoPosted: number = 0;

  async init() {
    await this.loadConfig();
    this.start();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[SocialAutoPoster] 🚀 2-Post-Per-Day Autonomous Social Publishing Engine started (11:00 AM & 7:00 PM EST).");

    // Check every 10 minutes for scheduled posting slot
    const checkIntervalMs = 10 * 60 * 1000;
    this.timer = setInterval(() => {
      this.checkAndExecuteSchedule().catch(err => {
        console.error("[SocialAutoPoster] Scheduled check error:", err);
      });
    }, checkIntervalMs);

    // Initial check 5 seconds after startup
    setTimeout(() => {
      this.checkAndExecuteSchedule().catch(err => {
        console.error("[SocialAutoPoster] Initial startup check error:", err);
      });
    }, 5000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log("[SocialAutoPoster] Engine stopped.");
  }

  private async loadConfig() {
    try {
      const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, SETTING_KEY)).limit(1);
      if (rows.length > 0) {
        const parsed = JSON.parse(rows[0].value);
        this.enabled = parsed.enabled ?? true;
        this.postsPerDay = parsed.postsPerDay ?? 2;
        this.lastPostDateSlot = parsed.lastPostDateSlot || "";
        this.lastPostTitle = parsed.lastPostTitle || null;
        this.lastPostTime = parsed.lastPostTime || null;
        this.lastPostChannel = parsed.lastPostChannel || null;
        this.totalAutoPosted = parsed.totalAutoPosted || 0;
      }
    } catch (err: any) {
      console.log("[SocialAutoPoster] Config init note:", err.message);
    }
  }

  private async saveConfig() {
    try {
      const payload = JSON.stringify({
        enabled: this.enabled,
        postsPerDay: this.postsPerDay,
        lastPostDateSlot: this.lastPostDateSlot,
        lastPostTitle: this.lastPostTitle,
        lastPostTime: this.lastPostTime,
        lastPostChannel: this.lastPostChannel,
        totalAutoPosted: this.totalAutoPosted,
      });

      const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, SETTING_KEY)).limit(1);
      if (existing.length > 0) {
        await db.update(siteSettings).set({ value: payload, updatedAt: new Date() }).where(eq(siteSettings.key, SETTING_KEY));
      } else {
        await db.insert(siteSettings).values({ key: SETTING_KEY, value: payload });
      }
    } catch (err: any) {
      console.error("[SocialAutoPoster] Failed to persist config:", err.message);
    }
  }

  async setEnabled(enabled: boolean) {
    this.enabled = enabled;
    await this.saveConfig();
    console.log(`[SocialAutoPoster] Auto-posting is now ${this.enabled ? "ENABLED" : "PAUSED"}.`);
    return this.getStatus();
  }

  // Get current hour in EST / New York timezone
  getCurrentESTTime(): { dateStr: string; hour: number; minute: number } {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === "year")?.value || "";
    const month = parts.find(p => p.type === "month")?.value || "";
    const day = parts.find(p => p.type === "day")?.value || "";
    const hour = parseInt(parts.find(p => p.type === "hour")?.value || "0", 10);
    const minute = parseInt(parts.find(p => p.type === "minute")?.value || "0", 10);

    return {
      dateStr: `${year}-${month}-${day}`,
      hour,
      minute,
    };
  }

  getNextScheduledPostTime(): string {
    const est = this.getCurrentESTTime();
    const currentHour = est.hour;

    let targetDate = est.dateStr;
    let targetHour = this.scheduledHoursEST[0]; // 11

    if (currentHour < this.scheduledHoursEST[0]) {
      targetHour = this.scheduledHoursEST[0]; // 11:00 AM today
    } else if (currentHour < this.scheduledHoursEST[1]) {
      targetHour = this.scheduledHoursEST[1]; // 7:00 PM today
    } else {
      // Next day 11:00 AM
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const tomorrowStr = d.toISOString().split("T")[0];
      targetDate = tomorrowStr;
      targetHour = this.scheduledHoursEST[0];
    }

    const timeLabel = targetHour === 11 ? "11:00 AM EST" : "7:00 PM EST";
    return `${targetDate} at ${timeLabel}`;
  }

  async checkAndExecuteSchedule() {
    if (!this.enabled) return;

    const est = this.getCurrentESTTime();
    const currentHour = est.hour;

    // Check if current hour matches one of the scheduled windows (11:00 AM or 7:00 PM EST)
    const matchingSlot = this.scheduledHoursEST.find(h => currentHour === h);
    if (matchingSlot === undefined) {
      return;
    }

    const slotKey = `${est.dateStr}_${matchingSlot}`;
    if (this.lastPostDateSlot === slotKey) {
      // Slot already posted today
      return;
    }

    console.log(`[SocialAutoPoster] ⏰ Reached scheduled publishing slot: ${matchingSlot}:00 EST (${est.dateStr}). Executing broadcast...`);
    await this.executeAutoPost(slotKey);
  }

  async executeAutoPost(slotKey?: string): Promise<{ success: boolean; message: string; article?: any }> {
    try {
      // 1. Fetch unposted published articles
      const allArticles = await storage.getAllArticles({ isPublished: true, limit: 50 });
      let candidate = allArticles.find(a => !a.igPosted);

      // If no unposted article found, trigger an instant RSS crawl to ingest new stories
      if (!candidate) {
        console.log("[SocialAutoPoster] No unposted articles found. Triggering fresh RSS crawl...");
        await magazineBot.syncFeeds();
        const refreshed = await storage.getAllArticles({ isPublished: true, limit: 50 });
        candidate = refreshed.find(a => !a.igPosted);
      }

      // If still none, pick the highest-viewed story as fallback
      if (!candidate && allArticles.length > 0) {
        candidate = allArticles[0];
      }

      if (!candidate) {
        return {
          success: false,
          message: "No articles available in database to publish.",
        };
      }

      console.log(`[SocialAutoPoster] Selected article for autonomous publishing: "${candidate.title}" (ID: ${candidate.id})`);

      // 2. Generate Vertical Video Reel (MoneyPrinterTurbo AI voiceover + B-roll or fast local canvas)
      console.log(`[SocialAutoPoster] Rendering high-retention video reel for article...`);
      let videoResult: { videoUrl: string; engine: "moneyprinter" | "local-ffmpeg"; caption: string } | null = null;
      try {
        videoResult = await moneyprinterService.generateVideoFromArticle(candidate);
      } catch (videoErr: any) {
        console.warn(`[SocialAutoPoster] Video reel generation note: ${videoErr.message}. Proceeding with standard media.`);
      }

      // 3. Publish to social channels via InstagramBot / Make.com Webhook
      const postResult = await instagramBot.publishArticlePost(candidate.id, {
        videoUrl: videoResult?.videoUrl,
        engine: videoResult?.engine || "standard",
      });

      // 4. Update tracking metadata
      const nowIso = new Date().toISOString();
      this.lastPostDateSlot = slotKey || `${new Date().toISOString().split("T")[0]}_manual`;
      this.lastPostTitle = candidate.title;
      this.lastPostTime = nowIso;
      this.lastPostChannel = postResult.simulated 
        ? "Simulated Preview" 
        : `Make.com (${videoResult?.engine === "moneyprinter" ? "AI Reel" : "Video Ad"})`;
      this.totalAutoPosted += 1;

      await this.saveConfig();

      console.log(`[SocialAutoPoster] ✅ Successfully automated post: "${candidate.title}". Total posts: ${this.totalAutoPosted}`);

      return {
        success: true,
        message: `Successfully broadcasted "${candidate.title}" across social channels.`,
        article: candidate,
      };
    } catch (error: any) {
      console.error("[SocialAutoPoster] Auto-post execution error:", error);
      return {
        success: false,
        message: error.message || "Failed to execute auto-post",
      };
    }
  }

  async getStatus(): Promise<AutoPosterStatus> {
    let videoEngineStatus: any = undefined;
    try {
      videoEngineStatus = await moneyprinterService.checkHealth();
    } catch {}

    return {
      enabled: this.enabled,
      postsPerDay: this.postsPerDay,
      scheduledSlotsEST: ["11:00 AM EST", "7:00 PM EST"],
      lastPostTime: this.lastPostTime,
      lastPostTitle: this.lastPostTitle,
      lastPostChannel: this.lastPostChannel,
      nextScheduledPostTime: this.getNextScheduledPostTime(),
      totalAutoPosted: this.totalAutoPosted,
      isRunning: this.isRunning,
      videoEngineStatus,
    };
  }
}

export const socialAutoPoster = new SocialAutoPoster();
