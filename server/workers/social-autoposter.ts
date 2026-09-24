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
  scheduledSlotsEST: string[]; // ["11:00 AM EST", "7:00 PM EST"]
  lastPostTime: string | null;
  lastPostTitle: string | null;
  lastPostChannel: string | null;
  lastError: string | null;
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

const SOCA_DISCOVERY_KEYWORDS = [
  "soca", "calypso", "carnival", "fete", "mas", "j'ouvert", "jouvert", 
  "road march", "crop over", "spicemas", "vincy mas", "caribana", 
  "pan", "steelband", "steelpan", "chutney soca", "groovy soca", "power soca",
  "machel montano", "kes", "patrice roberts", "voice", "bunji garlin", 
  "fay-ann", "nailah blackman", "destra", "skinny fabulous", "teddyson john", 
  "lyrikal", "kerwin du bois", "preedy", "erphaan alves", "shurwayne winchester",
  "nadia batson", "adam o", "asa bantan", "problem child", "dennery segment",
  "bouyon", "kadooment", "jab jab", "panorama", "band launch", "costume", "cooler fete"
];

export function isSocaArticle(article: any): boolean {
  if (!article) return false;
  if (article.category?.toLowerCase() === "soca") return true;
  const combined = `${article.title || ""} ${article.summary || ""} ${(article.tags || []).join(" ")}`.toLowerCase();
  return SOCA_DISCOVERY_KEYWORDS.some(kw => combined.includes(kw));
}

export class SocialAutoPoster {
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private enabled: boolean = true;
  private postsPerDay: number = 2;
  private scheduledHoursEST: number[] = [11, 19]; // 11:00 AM & 7:00 PM EST
  private lastPostDateSlot: string = ""; // e.g. "2026-08-16_11"
  private completedSlots: string[] = [];
  private lastPostTitle: string | null = null;
  private lastPostTime: string | null = null;
  private lastPostChannel: string | null = null;
  private lastError: string | null = null;
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
        this.completedSlots = Array.isArray(parsed.completedSlots)
          ? parsed.completedSlots
          : (this.lastPostDateSlot ? this.lastPostDateSlot.split(",").filter(Boolean) : []);
        this.lastPostTitle = parsed.lastPostTitle || null;
        this.lastPostTime = parsed.lastPostTime || null;
        this.lastPostChannel = parsed.lastPostChannel || null;
        this.lastError = parsed.lastError || null;
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
        completedSlots: this.completedSlots,
        lastPostTitle: this.lastPostTitle,
        lastPostTime: this.lastPostTime,
        lastPostChannel: this.lastPostChannel,
        lastError: this.lastError,
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
      // Next day 11:00 AM EST (calculate using EST date)
      const [y, m, d] = est.dateStr.split("-").map(Number);
      const nextEstDate = new Date(Date.UTC(y, m - 1, d + 1));
      const nextYear = nextEstDate.getUTCFullYear();
      const nextMonth = String(nextEstDate.getUTCMonth() + 1).padStart(2, "0");
      const nextDay = String(nextEstDate.getUTCDate()).padStart(2, "0");
      targetDate = `${nextYear}-${nextMonth}-${nextDay}`;
      targetHour = this.scheduledHoursEST[0];
    }

    const timeLabel = targetHour === 11 ? "11:00 AM EST" : "7:00 PM EST";
    return `${targetDate} at ${timeLabel}`;
  }

  async checkAndExecuteSchedule() {
    if (!this.enabled) return;

    const est = this.getCurrentESTTime();
    const currentHour = est.hour;

    // Resilient Missed-Slot Recovery:
    // Slot 1 (11:00 AM): eligible if currentHour >= 11
    // Slot 2 (7:00 PM): eligible if currentHour >= 19
    const eligibleSlots: number[] = [];
    if (currentHour >= this.scheduledHoursEST[0]) {
      eligibleSlots.push(this.scheduledHoursEST[0]); // 11
    }
    if (currentHour >= this.scheduledHoursEST[1]) {
      eligibleSlots.push(this.scheduledHoursEST[1]); // 19
    }

    for (const slotHour of eligibleSlots) {
      const slotKey = `${est.dateStr}_${slotHour}`;
      if (this.completedSlots.includes(slotKey) || this.lastPostDateSlot.split(",").includes(slotKey)) {
        // Slot already posted successfully today
        continue;
      }

      console.log(`[SocialAutoPoster] ⏰ Reached scheduled publishing window for slot: ${slotHour}:00 EST (${est.dateStr}). Executing broadcast...`);
      const result = await this.executeAutoPost(slotKey);
      if (!result.success) {
        console.warn(`[SocialAutoPoster] Auto-post for slot ${slotKey} failed: ${result.message}. Will retry in next interval.`);
      }
      // Only execute at most one post per schedule check interval
      break;
    }
  }

  async executeAutoPost(slotKey?: string, targetArticleId?: number): Promise<{ success: boolean; message: string; article?: any }> {
    try {
      // 1. Fetch unposted published articles or target specific article
      let candidate: any = null;
      if (targetArticleId) {
        candidate = await storage.getArticleById(targetArticleId);
      }

      if (!candidate) {
        const allArticles = await storage.getAllArticles({ isPublished: true, limit: 100 });
        const socaArticles = allArticles.filter(isSocaArticle);
        candidate = socaArticles.find(a => !a.igPosted);

        // If no unposted Soca article found, trigger an instant RSS crawl to ingest new stories
        if (!candidate) {
          console.log("[SocialAutoPoster] No unposted Soca articles found. Triggering fresh RSS crawl...");
          await magazineBot.syncFeeds();
          const refreshed = await storage.getAllArticles({ isPublished: true, limit: 100 });
          candidate = refreshed.filter(isSocaArticle).find(a => !a.igPosted);
        }

        // If still none, pick the latest Soca story as fallback
        if (!candidate && socaArticles.length > 0) {
          candidate = socaArticles[0];
        }
      }

      if (!candidate) {
        return {
          success: false,
          message: "No Soca or Carnival articles available in database to publish.",
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

      if (!postResult.success) {
        this.lastError = postResult.error || "Social dispatch rejected by downstream service";
        await this.saveConfig();
        console.error(`[SocialAutoPoster] ❌ Social dispatch failed: ${this.lastError}`);
        return {
          success: false,
          message: `Social dispatch failed: ${this.lastError}`,
          article: candidate,
        };
      }

      // 4. Update tracking metadata only when broadcast truly succeeded
      const nowIso = new Date().toISOString();
      if (slotKey) {
        if (!this.completedSlots.includes(slotKey)) {
          this.completedSlots.push(slotKey);
        }
        this.completedSlots = this.completedSlots.slice(-10);
        this.lastPostDateSlot = this.completedSlots.join(",");
      } else {
        this.lastPostDateSlot = `${new Date().toISOString().split("T")[0]}_manual`;
      }
      this.lastPostTitle = candidate.title;
      this.lastPostTime = nowIso;
      this.lastPostChannel = postResult.simulated 
        ? "Simulated Preview" 
        : `Make.com (${videoResult?.engine === "moneyprinter" ? "AI Reel" : "Video Ad"})`;
      this.totalAutoPosted += 1;
      this.lastError = null;

      await this.saveConfig();

      console.log(`[SocialAutoPoster] ✅ Successfully automated post: "${candidate.title}". Total posts: ${this.totalAutoPosted}`);

      return {
        success: true,
        message: `Successfully broadcasted "${candidate.title}" across social channels.`,
        article: candidate,
      };
    } catch (error: any) {
      console.error("[SocialAutoPoster] Auto-post execution error:", error);
      this.lastError = error.message || "Failed to execute auto-post";
      await this.saveConfig();
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
      lastError: this.lastError,
      nextScheduledPostTime: this.getNextScheduledPostTime(),
      totalAutoPosted: this.totalAutoPosted,
      isRunning: this.isRunning,
      videoEngineStatus,
    };
  }
}

export const socialAutoPoster = new SocialAutoPoster();
