import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

export interface AdGenerationOptions {
  id: string;
  title: string;
  category?: string;
  priceFormatted: string;
  description: string;
  imageUrl: string;
  ctaText?: string;
  stylePreset?: "dark-luxury" | "caribbean-energy" | "streetwear-bold" | "fete-fomo";
  aspectRatio?: "9:16" | "16:9" | "1:1";
  durationSeconds?: number;
}

export interface GeneratedAdResult {
  videoUrl: string;
  filePath: string;
  duration: number;
  width: number;
  height: number;
  aspectRatio: string;
  title: string;
  stylePreset: string;
  createdAt: string;
}

// Find ffmpeg and ffprobe binaries
function findBinary(name: string): string {
  try {
    const systemPath = execSync(`which ${name}`, { encoding: "utf-8", timeout: 3000 }).trim();
    if (systemPath) return systemPath;
  } catch {
    // fallback
  }
  try {
    if (name === "ffmpeg") {
      const ffmpegStatic = require("ffmpeg-static");
      if (ffmpegStatic && fs.existsSync(ffmpegStatic)) return ffmpegStatic;
    } else if (name === "ffprobe") {
      const ffprobeStatic = require("ffprobe-static");
      if (ffprobeStatic?.path && fs.existsSync(ffprobeStatic.path)) return ffprobeStatic.path;
    }
  } catch {
    // fallback
  }
  return name;
}

const ffmpegPath = findBinary("ffmpeg");

// Ensure ads output directory exists
const ADS_OUTPUT_DIR = path.resolve(process.cwd(), "public", "generated-ads");
if (!fs.existsSync(ADS_OUTPUT_DIR)) {
  fs.mkdirSync(ADS_OUTPUT_DIR, { recursive: true });
}

// Helper to download remote image to temp local file
async function downloadImageToTemp(url: string, destPath: string): Promise<string> {
  // If local file path
  if (url.startsWith("/") || url.startsWith("./")) {
    const localFull = path.resolve(process.cwd(), url.replace(/^\//, ""));
    if (fs.existsSync(localFull)) {
      fs.copyFileSync(localFull, destPath);
      return destPath;
    }
    const publicFull = path.resolve(process.cwd(), "public", url.replace(/^\//, ""));
    if (fs.existsSync(publicFull)) {
      fs.copyFileSync(publicFull, destPath);
      return destPath;
    }
    const assetFull = path.resolve(process.cwd(), "client", "src", "assets", url.replace(/^\//, ""));
    if (fs.existsSync(assetFull)) {
      fs.copyFileSync(assetFull, destPath);
      return destPath;
    }
  }

  // If http/https URL
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(destPath);
      const client = url.startsWith("https") ? https : http;
      client
        .get(url, (response) => {
          if (response.statusCode === 302 || response.statusCode === 301) {
            const redirectUrl = response.headers.location;
            if (redirectUrl) {
              return downloadImageToTemp(redirectUrl, destPath).then(resolve).catch(reject);
            }
          }
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve(destPath);
          });
        })
        .on("error", (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
    });
  }

  // Fallback: Check standard assets in repo
  const fallbackImages = [
    path.resolve(process.cwd(), "client", "src", "assets", "SGFLYERLOGO.png"),
    path.resolve(process.cwd(), "public", "logo512.png"),
    path.resolve(process.cwd(), "generated-icon.png")
  ];

  for (const fallback of fallbackImages) {
    if (fs.existsSync(fallback)) {
      fs.copyFileSync(fallback, destPath);
      return destPath;
    }
  }

  throw new Error(`Unable to resolve image source: ${url}`);
}

/**
 * Generates an ultra-crisp viral video ad in 9:16 or 16:9 for TikTok, Reels, Shorts, and Web Banners.
 */
export async function generateProductVideoAd(options: AdGenerationOptions): Promise<GeneratedAdResult> {
  const duration = options.durationSeconds || 12;
  const timestamp = Date.now();
  const safeId = options.id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const aspect = options.aspectRatio || "9:16";
  const style = options.stylePreset || "dark-luxury";
  const filename = `ad_${safeId}_${aspect.replace(":", "x")}_${timestamp}.mp4`;
  const outputPath = path.join(ADS_OUTPUT_DIR, filename);

  const tempDir = path.resolve(process.cwd(), "scratch");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempImgPath = path.join(tempDir, `temp_img_${timestamp}.jpg`);

  try {
    console.log(`[AdVideoGenerator] Fetching media for "${options.title}"...`);
    await downloadImageToTemp(options.imageUrl, tempImgPath);

    console.log(`[AdVideoGenerator] Compiling ${aspect} (${style}) viral video ad via FFmpeg: ${filename}`);

    const safeTitle = options.title.replace(/[:"'\\]/g, "").toUpperCase();
    const safePrice = options.priceFormatted.replace(/[:"'\\]/g, "");
    const safeCta = (options.ctaText || "SHOP NOW • SAVAGEGENTLEMEN.COM").replace(/[:"'\\]/g, "").toUpperCase();
    const safeBadge = (options.category || "EXCLUSIVE DROP").replace(/[:"'\\]/g, "").toUpperCase();

    // Style colors
    let bgColor = "0x0a0a0f";
    let accentColor = "0xD4AF37"; // Gold
    let headerText = "SAVAGE GENTLEMEN EXCLUSIVE";

    if (style === "caribbean-energy") {
      bgColor = "0x0b132b";
      accentColor = "0x10B981"; // Emerald
      headerText = "CARIBBEAN NOCTURNE • HIGH ENERGY";
    } else if (style === "streetwear-bold") {
      bgColor = "0x111111";
      accentColor = "0xFACC15"; // Cyber Yellow
      headerText = "SAVAGE GENTLEMEN STREETWEAR";
    } else if (style === "fete-fomo") {
      bgColor = "0x1a0624";
      accentColor = "0xF59E0B"; // Amber Gold
      headerText = "⚡ LIMITED TIME ONLY • SELLING OUT FAST";
    }

    let filterComplex = "";
    let width = 1080;
    let height = 1920;

    if (aspect === "16:9") {
      width = 1920;
      height = 1080;
      // 16:9 Landscape Layout (1920x1080)
      filterComplex = [
        `color=c=${bgColor}:s=1920x1080:d=${duration}[bg]`,
        `[0:v]scale=850:900:force_original_aspect_ratio=decrease,pad=850:900:(ow-iw)/2:(oh-ih)/2:color=0x00000000[prod]`,
        `[bg][prod]overlay=80:90[v1]`,
        `[v1]drawbox=x=980:y=120:w=860:h=60:color=${accentColor}@0.3:t=fill[v2]`,
        `[v2]drawtext=text='${headerText}':fontsize=28:fontcolor=0xFFFFFF:x=1010:y=135[v3]`,
        `[v3]drawtext=text='${safeBadge}':fontsize=24:fontcolor=${accentColor}:x=1010:y=210[v4]`,
        `[v4]drawtext=text='${safeTitle}':fontsize=52:fontcolor=0xFFFFFF:x=1010:y=280[v5]`,
        `[v5]drawbox=x=1010:y=480:w=320:h=80:color=${accentColor}:t=fill[v6]`,
        `[v6]drawtext=text='${safePrice}':fontsize=44:fontcolor=0x000000:x=1040:y=498[v7]`,
        `[v7]drawbox=x=980:y=860:w=860:h=120:color=0x111118@0.95:t=fill[v8]`,
        `[v8]drawtext=text='${safeCta}':fontsize=36:fontcolor=${accentColor}:x=1020:y=900[vout]`
      ].join(";");
    } else {
      // 9:16 Vertical Layout (1080x1920) for TikTok, Reels, Shorts
      filterComplex = [
        `color=c=${bgColor}:s=1080x1920:d=${duration}[bg]`,
        `[0:v]scale=920:1080:force_original_aspect_ratio=decrease,pad=920:1080:(ow-iw)/2:(oh-ih)/2:color=0x00000000[prod]`,
        `[bg][prod]overlay=(W-w)/2:380[v1]`,
        `[v1]drawbox=x=0:y=0:w=1080:h=180:color=0x000000@0.85:t=fill[v2]`,
        `[v2]drawtext=text='${headerText}':fontsize=32:fontcolor=${accentColor}:x=(w-text_w)/2:y=70[v3]`,
        `[v3]drawbox=x=(1080-420)/2:y=240:w=420:h=64:color=${accentColor}@0.25:t=fill[v4]`,
        `[v4]drawtext=text='${safeBadge}':fontsize=28:fontcolor=0xFFFFFF:x=(w-text_w)/2:y=258[v5]`,
        `[v5]drawtext=text='${safeTitle}':fontsize=46:fontcolor=0xFFFFFF:x=(w-text_w)/2:y=1530[v6]`,
        `[v6]drawbox=x=(1080-320)/2:y=1630:w=320:h=76:color=${accentColor}:t=fill[v7]`,
        `[v7]drawtext=text='${safePrice}':fontsize=40:fontcolor=0x000000:x=(w-text_w)/2:y=1648[v8]`,
        `[v8]drawbox=x=0:y=1760:w=1080:h=160:color=0x111118@0.95:t=fill[v9]`,
        `[v9]drawtext=text='${safeCta}':fontsize=34:fontcolor=${accentColor}:x=(w-text_w)/2:y=1820[vout]`
      ].join(";");
    }

    // High energy synthesized rhythmic audio pulse (4-on-the-floor kick rhythm)
    const audioSource = `aevalsrc=sin(2*PI*55*t)*exp(-8*mod(t\\,0.5))+sin(2*PI*110*t)*0.2*exp(-4*mod(t\\,0.25)):s=44100:d=${duration}`;

    return new Promise((resolve, reject) => {
      const args = [
        "-y",
        "-loop", "1",
        "-i", tempImgPath,
        "-f", "lavfi",
        "-i", audioSource,
        "-filter_complex", filterComplex,
        "-map", "[vout]",
        "-map", "1:a",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-pix_fmt", "yuv420p",
        "-r", "30",
        "-c:a", "aac",
        "-b:a", "128k",
        "-t", duration.toString(),
        outputPath
      ];

      const proc = spawn(ffmpegPath, args);

      let stderrOutput = "";
      proc.stderr.on("data", (data) => {
        stderrOutput += data.toString();
      });

      proc.on("close", (code) => {
        // Clean up temp image
        try {
          if (fs.existsSync(tempImgPath)) fs.unlinkSync(tempImgPath);
        } catch {}

        if (code === 0 && fs.existsSync(outputPath)) {
          console.log(`[AdVideoGenerator] ✅ Successfully rendered ${aspect} video ad: ${outputPath}`);
          resolve({
            videoUrl: `/generated-ads/${filename}`,
            filePath: outputPath,
            duration,
            width,
            height,
            aspectRatio: aspect,
            stylePreset: style,
            title: options.title,
            createdAt: new Date().toISOString()
          });
        } else {
          console.error(`[AdVideoGenerator] FFmpeg failed with code ${code}:`, stderrOutput);
          reject(new Error(`Video ad rendering failed (exit code ${code})`));
        }
      });
    });
  } catch (err: any) {
    if (fs.existsSync(tempImgPath)) {
      try { fs.unlinkSync(tempImgPath); } catch {}
    }
    throw err;
  }
}

/**
 * Lists previously generated ads from the output directory.
 */
export function getGeneratedAdsHistory(): GeneratedAdResult[] {
  if (!fs.existsSync(ADS_OUTPUT_DIR)) return [];

  const files = fs.readdirSync(ADS_OUTPUT_DIR)
    .filter((file) => file.endsWith(".mp4"))
    .map((file) => {
      const fullPath = path.join(ADS_OUTPUT_DIR, file);
      const stat = fs.statSync(fullPath);
      const isLandscape = file.includes("16x9");
      return {
        videoUrl: `/generated-ads/${file}`,
        filePath: fullPath,
        duration: 12,
        width: isLandscape ? 1920 : 1080,
        height: isLandscape ? 1080 : 1920,
        aspectRatio: isLandscape ? "16:9" : "9:16",
        stylePreset: "dark-luxury",
        title: file.replace(/^ad_/, "").replace(/_\d+x\d+_\d+\.mp4$/, "").replace(/_\d+\.mp4$/, "").replace(/_/g, " "),
        createdAt: stat.birthtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return files;
}
