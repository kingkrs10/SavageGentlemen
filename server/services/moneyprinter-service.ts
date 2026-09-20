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
      voice_name: request.voiceName || process.env.VOICE_NAME || "en-US-BrianMultilingualNeural",
      voice_volume: 1.0,
      bgm_type: request.bgmType || "random",
      bgm_volume: 0.15,
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
  async pollTask(taskId: string, maxWaitSeconds: number = 600): Promise<MoneyPrinterTaskResponse> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitSeconds * 1000) {
      try {
        const res = await fetch(`${this.apiUrl}/api/v1/tasks/${taskId}`);
        if (res.ok) {
          const data: any = await res.json();
          const taskData = data.data || data;
          const state = taskData.state;

          if (state === 1 || state === "completed" || state === "success" || (taskData.progress === 100 && taskData.videos?.length)) {
            const rawVideoUrl = taskData.videos?.[0] || taskData.combined_videos?.[0] || taskData.video_url || taskData.file_url;
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
   * Uses MoneyPrinterTurbo if online; seamlessly falls back to local high-performance generator if offline
   */
  async generateVideoFromArticle(article: Article): Promise<{
    videoUrl: string;
    engine: "moneyprinter" | "local-ffmpeg";
    caption: string;
  }> {
    const { resolveArticleMedia } = await import("./media-matcher");
    const mediaInfo = await resolveArticleMedia(article);
    let spokenScript = mediaInfo.spokenScript;
    let videoTerms = mediaInfo.videoTerms;
    let videoSubject = `${mediaInfo.subjectName}: ${mediaInfo.headline}`;
    const siteUrl = process.env.SITE_URL || "https://www.savgent.com";
    let customCaption = `🔥 WATCH NOW: ${mediaInfo.headline.toUpperCase()}\n\n${mediaInfo.summaryQuote}\n\n👉 Read full story: Link in bio or visit ${siteUrl}/magazine/${article.slug}\n\n#SavageGentlemen #SavGent #SocaMusic #Carnival2026 #ReelsViral`;

    // Enhance with Google AI Studio (Gemini 3.8 Flash) if available
    try {
      const { geminiStudioService } = await import("./gemini-studio-service");
      if (geminiStudioService.isAvailable()) {
        console.log(`[MoneyPrinter] 🍌 Generating viral Caribbean script via Google AI Studio Gemini 3.8 Flash...`);
        const geminiResult = await geminiStudioService.generateViralCaribbeanScript({
          topic: article.title,
          category: article.category,
          summary: article.summary,
          style: "2d_anime"
        });

        spokenScript = geminiResult.script;
        videoTerms = geminiResult.brollKeywords;
        videoSubject = geminiResult.title;
        customCaption = `${geminiResult.caption}\n\n${geminiResult.hashtags.join(" ")}`;
        console.log(`[MoneyPrinter] ⚡ Gemini Hook: "${geminiResult.hook}"`);
      }
    } catch (geminiErr: any) {
      console.warn(`[MoneyPrinter] Gemini Studio enhancement note: ${geminiErr.message}`);
    }

    const health = await this.checkHealth();

    if (health.online) {
      try {
        console.log(`[MoneyPrinter] Generating AI Video Reel for "${article.title}" via MoneyPrinterTurbo Sidecar...`);

        const taskId = await this.submitTask({
          videoSubject,
          videoScript: spokenScript,
          videoTerms,
          videoAspect: "9:16",
          voiceName: process.env.VOICE_NAME || "en-US-BrianMultilingualNeural",
          subtitlesEnabled: true
        });

        const taskResult = await this.pollTask(taskId, 360);

        if (taskResult.status === "completed" && taskResult.videoUrl) {
          const localUrl = await this.saveVideoLocally(taskResult.videoUrl, `article_${article.slug}`);
          console.log(`[MoneyPrinter] ✅ AI Video Reel created successfully: ${localUrl}`);

          return {
            videoUrl: localUrl,
            engine: "moneyprinter",
            caption: customCaption
          };
        } else if (taskResult.status === "failed") {
          throw new Error(taskResult.error || "MoneyPrinter video pipeline failed");
        }
      } catch (err: any) {
        console.warn(`[MoneyPrinter] Sidecar render note: ${err.message}. Falling back to verified artist studio generator.`);
      }
    } else {
      console.log(`[MoneyPrinter] Microservice offline. Using verified artist studio generator.`);
    }

    // Verified Artist Visual Studio Generator
    const localAdResult = await generateProductVideoAd({
      id: `article_${article.id}`,
      title: `${mediaInfo.subjectName} • ${article.title}`,
      category: mediaInfo.categoryFormatted,
      priceFormatted: "SAVAGE EDITORIAL",
      description: article.summary,
      imageUrl: mediaInfo.imageUrl,
      ctaText: "READ AT SAVAGE GENTLEMEN",
      stylePreset: "dark-luxury",
      durationSeconds: 8
    });

    return {
      videoUrl: localAdResult.videoUrl,
      engine: "local-ffmpeg",
      caption: `🔥 NEW DISPATCH: ${article.title.toUpperCase()}\n\n${article.summary}\n\n👉 Read full story at ${process.env.SITE_URL || "https://www.savgent.com"}/magazine/${article.slug}\n\n#SavageGentlemen #SavGent #SocaMusic #Carnival2026`
    };
  }
}

export const moneyprinterService = new MoneyPrinterService();
