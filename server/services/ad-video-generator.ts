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

import ffmpegStatic from "ffmpeg-static";

// Find ffmpeg and ffprobe binaries
function findBinary(name: string): string {
  // 1. Try static bundle first
  try {
    if (name === "ffmpeg") {
      const staticPath = typeof ffmpegStatic === "string" ? ffmpegStatic : (ffmpegStatic as any)?.default;
      if (staticPath && fs.existsSync(staticPath)) {
        execSync(`"${staticPath}" -version`, { stdio: "ignore", timeout: 3000 });
        return staticPath;
      }
    }
  } catch {
    // fallback
  }

  // 2. Try system path and verify it executes without dylib errors
  try {
    const systemPath = execSync(`which ${name}`, { encoding: "utf-8", timeout: 3000 }).trim();
    if (systemPath) {
      execSync(`"${systemPath}" -version`, { stdio: "ignore", timeout: 3000 });
      return systemPath;
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

    // Generate Crisp Branded Overlay PNG via Resvg
    const { Resvg } = await import("@resvg/resvg-js");
    const overlayPngPath = path.join(tempDir, `overlay_${timestamp}.png`);

    const escapeXml = (unsafe: string) => 
      unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });

    const displayTitle = escapeXml(safeTitle.length > 55 ? safeTitle.slice(0, 52) + "..." : safeTitle);
    const displayBadge = escapeXml(safeBadge);
    const displayHeader = escapeXml(headerText);
    const displayCta = escapeXml(safeCta);
    const displayPrice = escapeXml(safePrice);
    const width = aspect === "16:9" ? 1920 : 1080;
    const height = aspect === "16:9" ? 1080 : 1920;

    let svgContent = "";
    if (aspect === "16:9") {
      svgContent = `
      <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradRight" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.0"/>
            <stop offset="45%" stop-color="#07070a" stop-opacity="0.85"/>
            <stop offset="100%" stop-color="#07070a" stop-opacity="0.98"/>
          </linearGradient>
        </defs>
        <rect x="750" y="0" width="1170" height="1080" fill="url(#gradRight)"/>
        <!-- Header -->
        <text x="1350" y="140" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="28" font-weight="900" letter-spacing="3" fill="#D4AF37" text-anchor="middle">${displayHeader}</text>
        <rect x="1150" y="190" width="400" height="50" rx="10" fill="#D4AF37" fill-opacity="0.2" stroke="#D4AF37" stroke-width="2"/>
        <text x="1350" y="224" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${displayBadge}</text>
        <!-- Card -->
        <rect x="850" y="300" width="1000" height="680" rx="24" fill="#111116" fill-opacity="0.92" stroke="#D4AF37" stroke-width="2"/>
        <text x="1350" y="420" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF" text-anchor="middle">${displayTitle}</text>
        <text x="1350" y="550" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="40" font-weight="bold" fill="#D4AF37" text-anchor="middle">${displayPrice}</text>
        <rect x="1100" y="800" width="500" height="74" rx="37" fill="#D4AF37"/>
        <text x="1350" y="848" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="26" font-weight="900" fill="#000000" text-anchor="middle">${displayCta}</text>
      </svg>
      `;
    } else {
      svgContent = `
      <svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.95"/>
            <stop offset="100%" stop-color="#000000" stop-opacity="0.0"/>
          </linearGradient>
          <linearGradient id="gradBottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.0"/>
            <stop offset="40%" stop-color="#07070a" stop-opacity="0.88"/>
            <stop offset="100%" stop-color="#07070a" stop-opacity="0.98"/>
          </linearGradient>
        </defs>
        <!-- Top Gradient -->
        <rect x="0" y="0" width="1080" height="320" fill="url(#gradTop)"/>
        <text x="540" y="100" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="30" font-weight="900" letter-spacing="4" fill="#D4AF37" text-anchor="middle">${displayHeader}</text>
        <rect x="360" y="150" width="360" height="50" rx="10" fill="#D4AF37" fill-opacity="0.2" stroke="#D4AF37" stroke-width="2"/>
        <text x="540" y="184" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${displayBadge}</text>
        
        <!-- Bottom Gradient Content Area -->
        <rect x="0" y="1200" width="1080" height="720" fill="url(#gradBottom)"/>
        <!-- Content Glass Card -->
        <rect x="50" y="1380" width="980" height="440" rx="24" fill="#111116" fill-opacity="0.92" stroke="#D4AF37" stroke-width="2"/>
        <text x="540" y="1470" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="38" font-weight="900" fill="#FFFFFF" text-anchor="middle">${displayTitle}</text>
        <text x="540" y="1550" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="32" font-weight="bold" fill="#D4AF37" text-anchor="middle">${displayPrice}</text>
        <rect x="290" y="1670" width="500" height="74" rx="37" fill="#D4AF37"/>
        <text x="540" y="1718" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="26" font-weight="900" fill="#000000" text-anchor="middle">${displayCta}</text>
      </svg>
      `;
    }

    const resvg = new Resvg(svgContent, { fitTo: { mode: "width", value: width } });
    const pngBuffer = resvg.render().asPng();
    fs.writeFileSync(overlayPngPath, pngBuffer);

    // Audio & Filter Complex using overlay
    const audioSource = `aevalsrc=sin(2*PI*55*t)*exp(-8*mod(t\\,0.5))+sin(2*PI*110*t)*0.2*exp(-4*mod(t\\,0.25)):s=44100:d=${duration}`;
    const filterComplex = `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1[bg];[bg][1:v]overlay=0:0[vout]`;

    return new Promise((resolve, reject) => {
      const args = [
        "-y",
        "-loop", "1",
        "-i", tempImgPath,
        "-loop", "1",
        "-i", overlayPngPath,
        "-f", "lavfi",
        "-i", audioSource,
        "-filter_complex", filterComplex,
        "-map", "[vout]",
        "-map", "2:a",
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
