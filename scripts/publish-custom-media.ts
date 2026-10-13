import "dotenv/config";
import path from "path";
import fs from "fs";
import { geminiStudioService } from "../server/services/gemini-studio-service";
import { uploadLocalVideoToPublicCDN } from "../server/services/social-publisher";

interface PublishCustomOptions {
  media: string;
  topic?: string;
  caption?: string;
  title?: string;
  dryRun?: boolean;
}

function parseArgs(): PublishCustomOptions {
  const args = process.argv.slice(2);
  const options: PublishCustomOptions = {
    media: "",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--media" || arg === "-m") {
      options.media = args[++i] || "";
    } else if (arg === "--topic" || arg === "-t") {
      options.topic = args[++i] || "";
    } else if (arg === "--caption" || arg === "-c") {
      options.caption = args[++i] || "";
    } else if (arg === "--title") {
      options.title = args[++i] || "";
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    }
  }

  return options;
}

async function run() {
  const options = parseArgs();

  if (!options.media) {
    console.error("❌ Error: Missing --media argument. Provide an image/video URL or local file path.");
    console.log("Usage: npx tsx scripts/publish-custom-media.ts --media <url_or_path> [--topic <description>] [--caption <custom_caption>] [--dry-run]");
    process.exit(1);
  }

  const siteUrl = process.env.SITE_URL || "https://www.savgent.com";
  const webhookUrl = process.env.MAKE_WEBHOOK_URL || process.env.INSTAGRAM_WEBHOOK_URL || process.env.SOCIAL_WEBHOOK_URL;

  console.log("================================================================================");
  console.log("🌴 SAVAGE GENTLEMEN: CUSTOM MEDIA SOCIAL POST DISPATCH");
  console.log("================================================================================");
  console.log(`📸 Input Media: ${options.media}`);
  console.log(`🎯 Topic / Context: ${options.topic || "(AI Auto-Detect)"}`);
  console.log(`🌐 Site URL: ${siteUrl}`);

  // Step 1: Upload media to public CDN if local
  let publicMediaUrl = options.media;
  if (!options.media.startsWith("http://") && !options.media.startsWith("https://")) {
    console.log("\n[Step 1/3] 📡 Uploading local media asset to public CDN...");
    publicMediaUrl = await uploadLocalVideoToPublicCDN(options.media);
    console.log(`   - Public CDN URL: ${publicMediaUrl}`);
  } else {
    console.log("\n[Step 1/3] 📡 Media is already a public URL.");
  }

  const isVideo = /\.(mp4|mov|webm|avi|m4v)(\?.*)?$/i.test(publicMediaUrl);

  // Step 2: Generate Viral Soca & Carnival Copy via Gemini 3.8 Flash
  console.log("\n[Step 2/3] ⚡ Generating viral Caribbean / Soca copy via Gemini 3.8 Flash...");
  let postTitle = options.title || "";
  let finalCaption = options.caption || "";

  if (!finalCaption) {
    const promptTopic = options.topic || "Caribbean Soca music, carnival energy, and luxury island streetwear";
    try {
      const generated = await geminiStudioService.generateViralCaribbeanScript({
        topic: promptTopic,
        category: "soca",
        summary: `Exclusive Savage Gentlemen dispatch featuring ${promptTopic}. High energy Caribbean vibes and luxury culture.`,
        style: "cinematic_luxury",
      });

      postTitle = postTitle || generated.title;
      finalCaption = `🔥 ${generated.hook}\n\n` +
        `🌴 ${generated.caption}\n\n` +
        `📖 Explore the movement: ${siteUrl}\n\n` +
        `—\n` +
        `Savage Gentlemen | The Pulse of Caribbean Lifestyle & Culture ⚡\n\n` +
        `${generated.hashtags.join(" ")}`;
    } catch (err: any) {
      console.warn(`[GeminiStudio] Note: ${err.message}. Using high-energy fallback caption.`);
      postTitle = postTitle || "Savage Gentlemen Island Culture Dispatch";
      finalCaption = `🔥 SAVAGE GENTLEMEN CULTURE DISPATCH\n\n` +
        `🌴 The rhythm of the road meets heavyweight luxury streetwear. Turn up the volume and feel the carnival vibration.\n\n` +
        `📖 Explore the movement: ${siteUrl}\n\n` +
        `—\n` +
        `Savage Gentlemen | The Pulse of Caribbean Lifestyle & Culture ⚡\n\n` +
        `#SavageGentlemen #SavGent #SGGang #SocaMusic #Carnival2026 #CropOver #Spicemas #VincyMas #LucianCarnival #ReelsViral #FYP`;
    }
  }

  console.log("--- GENERATED CAPTION ---");
  console.log(finalCaption);
  console.log("-------------------------");

  // Step 3: Broadcast to Make.com Webhook
  console.log("\n[Step 3/3] 🚀 Broadcasting to Social Media Webhook...");
  const payload = {
    title: postTitle || "Savage Gentlemen Culture Dispatch",
    caption: finalCaption,
    videoUrl: isVideo ? publicMediaUrl : undefined,
    imageUrl: !isVideo ? publicMediaUrl : undefined,
    mediaUrl: publicMediaUrl,
    mediaType: isVideo ? "video" : "image",
    platforms: ["instagram", "facebook", "youtube", "tiktok"],
    productLink: siteUrl,
    engine: "gemini-3.8-flash-custom",
    timestamp: new Date().toISOString(),
  };

  if (options.dryRun) {
    console.log("🧪 DRY RUN MODE: Webhook dispatch skipped.");
    console.log(JSON.stringify(payload, null, 2));
    process.exit(0);
  }

  if (!webhookUrl) {
    console.warn("⚠️ No MAKE_WEBHOOK_URL or INSTAGRAM_WEBHOOK_URL configured. Payload prepared:");
    console.log(JSON.stringify(payload, null, 2));
    process.exit(0);
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  console.log(`   - Webhook HTTP Status: ${response.status} ${response.statusText}`);
  console.log(`   - Webhook Response: ${responseText}`);

  console.log("\n================================================================================");
  console.log("🎉 MEDIA POST SUCCESSFULLY DISPATCHED!");
  console.log("================================================================================");
  console.log(`📱 Media URL: ${publicMediaUrl}`);
  console.log(`🎬 Media Type: ${isVideo ? "Vertical Video" : "High-Res Image"}`);
  console.log(`🌐 Distribution: Instagram, Facebook, YouTube, TikTok`);
  console.log("================================================================================");
}

run().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
