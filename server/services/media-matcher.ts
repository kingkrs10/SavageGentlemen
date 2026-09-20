import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { Article } from "@shared/schema";
import { cleanTitle, cleanCaption } from "@shared/text-sanitizer";

export interface ResolvedMediaInfo {
  subjectName: string;
  headline: string;
  summaryQuote: string;
  imagePath: string;
  imageUrl: string;
  videoTerms: string[];
  categoryFormatted: string;
}

// Known Caribbean & diaspora artists and icons directory
const KNOWN_ARTISTS: Record<string, { name: string; fallbackImage?: string; defaultTerms: string[] }> = {
  "sean paul": {
    name: "SEAN PAUL",
    defaultTerms: ["dancehall stage concert", "reggae music video", "sound system party"]
  },
  "bob marley": {
    name: "BOB MARLEY",
    defaultTerms: ["reggae concert stage", "roots reggae guitar", "jamaica music culture"]
  },
  "450": {
    name: "450",
    defaultTerms: ["dancehall performance", "music studio recording", "caribbean concert"]
  },
  "stalk ashley": {
    name: "STALK ASHLEY",
    defaultTerms: ["caribbean female singer", "r&b stage performance", "music video set"]
  },
  "vanessa bling": {
    name: "VANESSA BLING",
    defaultTerms: ["gospel dancehall stage", "caribbean singer concert", "live microphone performance"]
  },
  "v'ghn": {
    name: "V'GHN",
    defaultTerms: ["soca concert live", "carnival stage performance", "grenada carnival singer"]
  },
  "machel montano": {
    name: "MACHEL MONTANO",
    defaultTerms: ["carnival stage fete", "soca music concert", "trinidad carnival road"]
  },
  "shenseea": {
    name: "SHENSEEA",
    defaultTerms: ["dancehall stage dance", "music video performance", "caribbean pop concert"]
  },
  "popcaan": {
    name: "POPCAAN",
    defaultTerms: ["dancehall concert crowd", "sound system stage", "jamaica reggae fete"]
  },
  "skillibeng": {
    name: "SKILLIBENG",
    defaultTerms: ["dancehall music video", "caribbean rap stage", "concert crowd lights"]
  },
  "spice": {
    name: "SPICE",
    defaultTerms: ["queen of dancehall", "carnival stage performance", "fete dancers crowd"]
  },
  "masicka": {
    name: "MASICKA",
    defaultTerms: ["dancehall stage lights", "reggae concert crowd", "recording studio mic"]
  },
  "teejay": {
    name: "TEEJAY",
    defaultTerms: ["drift dancehall concert", "caribbean fete crowd", "music video set"]
  },
  "valiant": {
    name: "VALIANT",
    defaultTerms: ["dancehall concert stage", "caribbean nightlife crowd", "luxury streetwear stage"]
  },
  "dexta daps": {
    name: "DEXTA DAPS",
    defaultTerms: ["dancehall live performance", "romantic reggae concert", "caribbean singer stage"]
  },
  "buju banton": {
    name: "BUJU BANTON",
    defaultTerms: ["reggae concert stadium", "sound system live", "roots reggae microphone"]
  }
};

/**
 * Extracts the primary artist or subject name from the article title
 */
export function extractArtistOrSubject(title: string): string {
  const clean = cleanTitle(title);
  const lower = clean.toLowerCase();

  for (const [key, artist] of Object.entries(KNOWN_ARTISTS)) {
    if (lower.includes(key)) {
      return artist.name;
    }
  }

  // Extract name before common verbs (Takes, Drops, Releases, Teams Up, Links Up, Featured In)
  const verbMatch = clean.match(/^([A-Z0-9'’\s-]+?)(?:\s+(?:Takes|Drops|Releases|Teams|Links|Featured|Performs|Reveals|Announces|Hits|Wins|Celebrates|Shines|Speaks|Breaks|Unveils|Discusses|Addresses|Dominates|Leads|Earns|Signs))\b/i);
  if (verbMatch && verbMatch[1] && verbMatch[1].trim().length > 2) {
    return verbMatch[1].trim().toUpperCase();
  }

  // Extract from title start
  const colonParts = clean.split(":");
  if (colonParts.length > 1 && colonParts[0].trim().length < 25) {
    return colonParts[0].trim().toUpperCase();
  }

  return "SAVAGE GENTLEMEN";
}

/**
 * Downloads image to temp location
 */
async function downloadImage(url: string, destPath: string): Promise<string> {
  if (url.startsWith("/") || url.startsWith("./")) {
    const localFull = path.resolve(process.cwd(), url.replace(/^\//, ""));
    if (fs.existsSync(localFull)) {
      fs.copyFileSync(localFull, destPath);
      return destPath;
    }
  }

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            return downloadImage(redirectUrl, destPath).then(resolve).catch(reject);
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

export interface ResolvedMediaInfo {
  subjectName: string;
  headline: string;
  summaryQuote: string;
  spokenScript: string;
  imagePath: string;
  imageUrl: string;
  videoTerms: string[];
  categoryFormatted: string;
}

/**
 * Builds a natural, conversational, spoken news script for video voiceovers.
 * - No robotic syntax
 * - No spoken hashtags
 * - No clothing drop promotions on news stories
 * - Never reads web addresses (strictly says "Tap the link in bio")
 */
export function buildSpokenNewsScript(article: Article, subjectName: string): string {
  let cleanTitleStr = cleanTitle(article.title)
    .replace(/&#\d+;/g, "")
    .replace(/["'“”‘’]/g, "")
    .replace(/^[a-z\s,]+[—–-]\s*/i, "") // Remove news agency datelines like "PORT OF SPAIN, Trinidad — "
    .trim();

  let cleanSummaryStr = cleanCaption(article.summary)
    .replace(/&#\d+;/g, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/#\w+/g, "")
    .replace(/\.\.\.$/, "")
    .replace(/^[a-z\s,]+[—–-]\s*/i, "")
    .replace(/Match the vibe with our luxury streetwear.*$/i, "")
    .replace(/Shop the collection.*$/i, "")
    .replace(/Available now in the Savage Gentlemen shop.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanSummaryStr.endsWith(".") && !cleanSummaryStr.endsWith("!") && !cleanSummaryStr.endsWith("?")) {
    cleanSummaryStr += ".";
  }

  // Natural conversational contractions for human-sounding neural TTS
  cleanSummaryStr = cleanSummaryStr
    .replace(/\bdo not\b/gi, "don't")
    .replace(/\bcannot\b/gi, "can't")
    .replace(/\bit is\b/gi, "it's")
    .replace(/\bwe are\b/gi, "we're")
    .replace(/\bthey are\b/gi, "they're")
    .replace(/\bthere is\b/gi, "there's");

  // Conversational broadcast script with natural pause punctuation
  return `${cleanTitleStr} — ${cleanSummaryStr} Tap the link in bio for the full story.`;
}

/**
 * Resolves media, spoken voiceover script, and contextual keywords for an article
 */
export async function resolveArticleMedia(article: Article): Promise<ResolvedMediaInfo> {
  const cleanTitleStr = cleanTitle(article.title);
  const cleanSummaryStr = cleanCaption(article.summary);
  const subjectName = extractArtistOrSubject(cleanTitleStr);
  const lowerSubject = subjectName.toLowerCase();

  const spokenScript = buildSpokenNewsScript(article, subjectName);

  const artistConfig = KNOWN_ARTISTS[lowerSubject];
  const videoTerms = artistConfig?.defaultTerms || [
    `${subjectName.toLowerCase()} concert`,
    "caribbean stage performance",
    "dancehall sound system",
    "fete crowd dancing"
  ];

  const tempDir = path.resolve(process.cwd(), "scratch");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const tempImgPath = path.join(tempDir, `article_${article.id}_subject_${Date.now()}.jpg`);

  // Determine the best image URL: Prioritize real editorial image over unsplash placeholder
  let imageUrl = article.featuredImage || "";
  const isUnsplashGeneric = imageUrl.includes("images.unsplash.com");

  if (!imageUrl || isUnsplashGeneric) {
    if (artistConfig?.fallbackImage) {
      imageUrl = artistConfig.fallbackImage;
    }
  }

  // Fallback to Savage Gentlemen brand asset if no valid image
  if (!imageUrl) {
    imageUrl = path.resolve(process.cwd(), "attached_assets", "SGFLYERLOGO.png");
  }

  try {
    await downloadImage(imageUrl, tempImgPath);
  } catch (err: any) {
    console.warn(`[MediaMatcher] Could not download remote image (${imageUrl}): ${err.message}. Using default logo.`);
    const fallbackAsset = path.resolve(process.cwd(), "attached_assets", "SGFLYERLOGO.png");
    fs.copyFileSync(fallbackAsset, tempImgPath);
  }

  return {
    subjectName,
    headline: cleanTitleStr,
    summaryQuote: cleanSummaryStr,
    spokenScript,
    imagePath: tempImgPath,
    imageUrl,
    videoTerms,
    categoryFormatted: (article.category || "CULTURE").toUpperCase()
  };
}
