import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "../storage";
import { authenticateUser, authorizeAdmin } from "../auth-middleware";

export const settingsRouter = Router();

// Ensure uploads/videos directory exists
const videoUploadsDir = path.join(process.cwd(), "uploads", "videos");
if (!fs.existsSync(videoUploadsDir)) {
  fs.mkdirSync(videoUploadsDir, { recursive: true });
}

// Multer storage for video uploads
const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, videoUploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase() || ".mp4";
    cb(null, `bg-video-${uniqueSuffix}${ext}`);
  },
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max video size
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(mp4|webm|mov|m4v)$/i.test(path.extname(file.originalname));
    if (allowed) {
      cb(null, true);
    } else {
      cb(new Error("Only video files (.mp4, .webm, .mov, .m4v) are supported"));
    }
  },
});

export interface BackgroundVideoConfig {
  videoUrl: string;
  posterUrl?: string;
  opacity: number;
  contrast: number;
  brightness: number;
  isDefault: boolean;
  updatedAt?: string;
}

const DEFAULT_CONFIG: BackgroundVideoConfig = {
  videoUrl: "", // Empty string represents using the bundled default brand video
  posterUrl: "",
  opacity: 0.45,
  contrast: 125,
  brightness: 90,
  isDefault: true,
};

/**
 * GET /api/settings/background-video
 * Public endpoint to fetch the current active site background video config
 */
settingsRouter.get("/background-video", async (_req: Request, res: Response) => {
  try {
    const setting = await storage.getSiteSetting("background_video");
    if (!setting) {
      return res.json(DEFAULT_CONFIG);
    }

    try {
      const parsed = JSON.parse(setting.value);
      return res.json({
        ...DEFAULT_CONFIG,
        ...parsed,
        isDefault: !parsed.videoUrl,
        updatedAt: setting.updatedAt,
      });
    } catch {
      return res.json(DEFAULT_CONFIG);
    }
  } catch (error: any) {
    console.error("[Settings] Error fetching background video setting:", error);
    return res.status(500).json({ error: "Failed to fetch background video setting" });
  }
});

/**
 * POST /api/settings/background-video/upload
 * Admin-only endpoint to upload a new background video file
 */
settingsRouter.post(
  "/background-video/upload",
  authenticateUser,
  authorizeAdmin,
  videoUpload.single("video"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }

      const relativeUrl = `/uploads/videos/${req.file.filename}`;
      const opacity = req.body.opacity ? parseFloat(req.body.opacity) : 0.45;
      const contrast = req.body.contrast ? parseInt(req.body.contrast) : 125;
      const brightness = req.body.brightness ? parseInt(req.body.brightness) : 90;

      const newConfig: BackgroundVideoConfig = {
        videoUrl: relativeUrl,
        posterUrl: req.body.posterUrl || "",
        opacity: isNaN(opacity) ? 0.45 : opacity,
        contrast: isNaN(contrast) ? 125 : contrast,
        brightness: isNaN(brightness) ? 90 : brightness,
        isDefault: false,
        updatedAt: new Date().toISOString(),
      };

      await storage.setSiteSetting(
        "background_video",
        JSON.stringify(newConfig),
        req.user?.id
      );

      console.log(`[Settings] Background video updated by user ${req.user?.username}: ${relativeUrl}`);

      return res.json({
        success: true,
        message: "Background video uploaded and activated successfully",
        config: newConfig,
      });
    } catch (error: any) {
      console.error("[Settings] Error uploading background video:", error);
      return res.status(500).json({ error: error.message || "Failed to upload background video" });
    }
  }
);

/**
 * PUT /api/settings/background-video
 * Admin-only endpoint to update background video URL (e.g. external link/CDN) or display properties
 */
settingsRouter.put(
  "/background-video",
  authenticateUser,
  authorizeAdmin,
  async (req: Request, res: Response) => {
    try {
      const { videoUrl, posterUrl, opacity, contrast, brightness } = req.body;

      const updatedConfig: BackgroundVideoConfig = {
        videoUrl: videoUrl || "",
        posterUrl: posterUrl || "",
        opacity: typeof opacity === "number" ? opacity : 0.45,
        contrast: typeof contrast === "number" ? contrast : 125,
        brightness: typeof brightness === "number" ? brightness : 90,
        isDefault: !videoUrl,
        updatedAt: new Date().toISOString(),
      };

      await storage.setSiteSetting(
        "background_video",
        JSON.stringify(updatedConfig),
        req.user?.id
      );

      console.log(`[Settings] Background video config updated by user ${req.user?.username}`);

      return res.json({
        success: true,
        message: "Background video settings saved successfully",
        config: updatedConfig,
      });
    } catch (error: any) {
      console.error("[Settings] Error saving background video settings:", error);
      return res.status(500).json({ error: error.message || "Failed to save settings" });
    }
  }
);

/**
 * POST /api/settings/background-video/reset
 * Admin-only endpoint to reset the background video back to the default Savage Gentlemen brand video
 */
settingsRouter.post(
  "/background-video/reset",
  authenticateUser,
  authorizeAdmin,
  async (req: Request, res: Response) => {
    try {
      await storage.setSiteSetting(
        "background_video",
        JSON.stringify(DEFAULT_CONFIG),
        req.user?.id
      );

      console.log(`[Settings] Background video reset to default by user ${req.user?.username}`);

      return res.json({
        success: true,
        message: "Background video reset to default Savage Gentlemen brand video",
        config: DEFAULT_CONFIG,
      });
    } catch (error: any) {
      console.error("[Settings] Error resetting background video:", error);
      return res.status(500).json({ error: "Failed to reset background video" });
    }
  }
);
