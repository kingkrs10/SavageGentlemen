import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import { Article } from "@shared/schema";
import { generateProductVideoAd } from "./ad-video-generator";

export interface MoneyPrinterGenerateRequest {
  videoSubject: string;
  videoScript?: string;
  videoTerms?: string[];
  videoAspect?: "9:16" | "16:9" | "1:1";
  voiceName?: string;
  bgmType?: string;
  subtitlesEnabled?: boolean;
}

export interface MoneyPrinterTaskResponse {
  taskId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  videoUrl?: string;
  error?: string;
}

export interface MoneyPrinterHealthStatus {
  online: boolean;
  apiUrl: string;
  version?: string;
  message: string;
}

export class MoneyPrinterService {
  private apiUrl: string;
  private uploadsDir: string;

  constructor() {
    this.apiUrl = (process.env.MONEYPRINTER_API_URL || "http://127.0.0.1:8090").replace(/\/+$/, "");
    this.uploadsDir = path.join(process.cwd(), "uploads", "videos");
    if (!fs.existsSync(this.uploadsDir)) {
      try {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      } catch {}
    }
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  /**
   * Check if the MoneyPrinterTurbo FastAPI server is reachable
   */
  async checkHealth(): Promise<MoneyPrinterHealthStatus> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      
      const res = await fetch(`${this.apiUrl}/docs`, {
        method: "GET",
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok || res.status === 200 || res.status === 307) {
        return {
          online: true,
          apiUrl: this.apiUrl,
          message: "MoneyPrinterTurbo AI Video Engine is online and ready."
        };
      }

      return {
        online: false,
        apiUrl: this.apiUrl,
        message: `Microservice returned status ${res.status}`
      };
    } catch (err: any) {
      return {
        online: false,
        apiUrl: this.apiUrl,
        message: `Offline (${err.message || "Connection refused"}). Fallback engine active.`
      };
    }
  }

  /**
   * Submits a video creation task to MoneyPrinterTurbo
   */
  async submitTask(request: MoneyPrinterGenerateRequest): Promise<string> {
    const payload = {
      video_subject: request.videoSubject,
      video_script: request.videoScript || "",
      video_terms: request.videoTerms || ["caribbean", "nightlife", "party", "carnival", "luxury"],
      video_aspect: request.videoAspect || "9:16",
      voice_name: request.voiceName || "en-US-ChristopherNeural",
      voice_volume: 1.0,
      bgm_type: request.bgmType || "random",
      bgm_volume: 0.2,
      subtitle_enabled: request.subtitlesEnabled ?? true,
      font_name: "STHeitiMedium.ttc",
      text_fore_color: "#FFFFFF",
      font_size: 60,
      stroke_color: "#000000",
      stroke_width: 1.5,
    };

    const res = await fetch(`${this.apiUrl}/api/v1/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`MoneyPrinter API error (${res.status}): ${errorText}`);
    }

    const data: any = await res.json();
    const taskId = data.task_id || data.data?.task_id || data.id;

    if (!taskId) {
      throw new Error("No task_id returned from MoneyPrinter API");
    }

    return taskId;
  }

  /**
   * Polls task status until video is finished or failed
   */
  async pollTask(taskId: string, maxWaitSeconds: number = 180): Promise<MoneyPrinterTaskResponse> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitSeconds * 1000) {
      try {
        const res = await fetch(`${this.apiUrl}/api/v1/tasks/${taskId}`);
        if (res.ok) {
          const data: any = await res.json();
          const taskData = data.data || data;
          const state = taskData.state;

          if (state === 1 || state === "completed" || state === "success" || (taskData.progress === 100 && taskData.videos?.length)) {
            const rawVideoUrl = taskData.combined_videos?.[0] || taskData.videos?.[0] || taskData.video_url || taskData.file_url;
            return {
              taskId,
              status: "completed",
              progress: 100,
              videoUrl: rawVideoUrl
            };
          }

          if (state === -1 || state === "failed" || state === "error" || taskData.failed_stage || taskData.error) {
            return {
              taskId,
              status: "failed",
              error: taskData.error || taskData.message || "Video compilation failed"
            };
          }
        }
      } catch {}

      // Wait 3 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    throw new Error(`MoneyPrinter task ${taskId} timed out after ${maxWaitSeconds} seconds`);
  }

  /**
   * Downloads remote video file to local uploads directory
   */
  async saveVideoLocally(remoteUrl: string, filenamePrefix: string = "reel"): Promise<string> {
    const fullRemoteUrl = remoteUrl.startsWith("http") ? remoteUrl : `${this.apiUrl}${remoteUrl}`;
    const filename = `${filenamePrefix}_${Date.now()}.mp4`;
    const localFilePath = path.join(this.uploadsDir, filename);

    const res = await fetch(fullRemoteUrl);
    if (!res.ok) {
      throw new Error(`Failed to download completed video: ${res.statusText}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    await fs.promises.writeFile(localFilePath, buffer);

    return `/uploads/videos/${filename}`;
  }

  /**
   * Converts an article into a full vertical video reel
   * Uses MoneyPrinterTurbo if online; seamlessly falls back to local ffmpeg template if offline
   */
  async generateVideoFromArticle(article: Article): Promise<{
    videoUrl: string;
    engine: "moneyprinter" | "local-ffmpeg";
    caption: string;
  }> {
    const health = await this.checkHealth();

    if (health.online) {
      try {
        console.log(`[MoneyPrinter] Generating AI Video Reel for "${article.title}" via MoneyPrinterTurbo Sidecar...`);

        const keywordsByCategory: Record<string, string[]> = {
          nightlife: ["caribbean nightlife", "club party", "dj lights", "fete dancing"],
          music: ["soca concert", "dancehall stage", "sound system", "steelpan"],
          style: ["luxury streetwear", "tropical fashion", "sneakers urban", "gold jewelry"],
          cocktails: ["caribbean rum", "cocktail bar", "bartender craft", "tropical drink"],
          culture: ["carnival costumes", "masquerade", "island beach", "caribbean sunset"],
        };

        const terms = keywordsByCategory[article.category] || ["caribbean", "nightlife", "party", "carnival"];

        const taskId = await this.submitTask({
          videoSubject: article.title,
          videoScript: `${article.title}. ${article.summary}`,
          videoTerms: terms,
          videoAspect: "9:16",
          voiceName: "en-US-ChristopherNeural",
          subtitlesEnabled: true
        });

        const taskResult = await this.pollTask(taskId, 60);

        if (taskResult.status === "completed" && taskResult.videoUrl) {
          const localUrl = await this.saveVideoLocally(taskResult.videoUrl, `article_${article.slug}`);
          console.log(`[MoneyPrinter] ✅ AI Video Reel created successfully: ${localUrl}`);

          return {
            videoUrl: localUrl,
            engine: "moneyprinter",
            caption: `🔥 WATCH NOW: ${article.title.toUpperCase()}\n\n${article.summary}\n\n👉 Read full story at https://savagegentlemen.com/magazine/${article.slug}\n\n#SavageGentlemen #CaribbeanCulture #Carnival2026 #ReelsViral`
          };
        } else if (taskResult.status === "failed") {
          throw new Error(taskResult.error || "MoneyPrinter video pipeline failed");
        }
      } catch (err: any) {
        console.warn(`[MoneyPrinter] Sidecar render note: ${err.message}. Falling back to local high-performance video generator.`);
      }
    } else {
      console.log(`[MoneyPrinter] Microservice offline. Using local high-performance FFmpeg video generator.`);
    }

    // High-performance Local FFmpeg fallback
    const localAdResult = await generateProductVideoAd({
      id: `article_${article.id}`,
      title: article.title,
      category: article.category.toUpperCase(),
      priceFormatted: "SAVAGE EDITORIAL",
      description: article.summary,
      imageUrl: article.featuredImage || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1080&h=1920&fit=crop",
      ctaText: "READ AT SAVGENT.COM",
      stylePreset: "dark-luxury",
      durationSeconds: 12
    });

    return {
      videoUrl: localAdResult.videoUrl,
      engine: "local-ffmpeg",
      caption: `🔥 NEW DISPATCH: ${article.title.toUpperCase()}\n\n${article.summary}\n\n👉 Read full story at https://savagegentlemen.com/magazine/${article.slug}\n\n#SavageGentlemen #CaribbeanCulture #Carnival2026`
    };
  }
}

export const moneyprinterService = new MoneyPrinterService();
