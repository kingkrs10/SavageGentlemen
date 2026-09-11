import "dotenv/config";
import { moneyprinterService } from "../server/services/moneyprinter-service";
import { uploadLocalVideoToPublicCDN } from "../server/services/social-publisher";
import fetch from "node-fetch";

async function run2DAnimatedReel() {
  console.log("================================================================================");
  console.log("🎨 SAVAGE GENTLEMEN: COMPILING 2D ANIMATED VIRAL REEL");
  console.log("================================================================================");

  const subject = "Savage Gentlemen: 2D Animated Caribbean Sound System & Streetwear Drop";
  const script = "Level up your standard with Savage Gentlemen. Handcrafted luxury streetwear infused with raw Caribbean soundclash energy. Step into the next dimension of Caribbean lifestyle at savgent dot com.";
  const terms = [
    "2d animation motion graphics",
    "anime city night lights",
    "cartoon party dance loop",
    "2d neon sound waves",
    "anime aesthetic street"
  ];

  console.log("\n[1/4] 📡 Submitting 2D Animated Reel Task to MoneyPrinterTurbo...");
  console.log(`   - Subject: ${subject}`);
  console.log(`   - Animation Terms: ${terms.join(", ")}`);

  const taskId = await moneyprinterService.submitTask({
    videoSubject: subject,
    videoScript: script,
    videoTerms: terms,
    videoAspect: "9:16",
    voiceName: "en-US-ChristopherNeural",
    subtitlesEnabled: true
  });

  console.log(`   - Task ID: ${taskId}`);
  console.log("\n[2/4] ⏳ Rendering 2D Motion Graphics Video (Pexels Animation + Voiceover + Subtitles)...");

  const taskResult = await moneyprinterService.pollTask(taskId, 360);

  if (taskResult.status !== "completed" || !taskResult.videoUrl) {
    throw new Error(`Video rendering failed: ${taskResult.error || "Unknown error"}`);
  }

  const localVideoUrl = await moneyprinterService.saveVideoLocally(taskResult.videoUrl, "2d_animated_drop");
  console.log(`   - ✅ 2D Animated Video saved locally: ${localVideoUrl}`);

  // Upload to Public CDN for Make.com / Instagram
  console.log("\n[3/4] 🌐 Uploading Video to Fast Public CDN...");
  const publicVideoUrl = uploadLocalVideoToPublicCDN(localVideoUrl);
  console.log(`   - ✅ Public CDN URL: ${publicVideoUrl}`);

  // Formulate Viral Social Copy
  console.log("\n[4/4] ✍️ Formatting Viral Copy & Brand Hashtags...");
  const title = "🎨 SAVAGE GENTLEMEN 2D DIMENSION: THE CARIBBEAN SOUND SYSTEM DROP";
  const fullCaption = `🎨 ENTER THE NEXT DIMENSION: SAVAGE GENTLEMEN 2D NOCTURNE 🌴⚡\n\n` +
    `Handcrafted luxury streetwear meets 2D anime soundclash aesthetics. Built for high-energy fete survival, island culture, and global streetwear dominance.\n\n` +
    `👑 Cop the exclusive drop & secure your passes:\n` +
    `👉 https://savagegentlemen.com/shop\n\n` +
    `—\n` +
    `Savage Gentlemen | The Pulse of Caribbean Culture ⚡\n\n` +
    `#SavageGentlemen #SavGent #SGGang #SocaPassport #2DAnimation #AnimeAesthetic #MotionGraphics #CaribbeanCulture #Carnival2026 #SoundSystemCulture #LuxuryStreetwear #ReelsViral #ExplorePage #FYP #TrendingNow`;

  // Send to Make.com Webhook
  const webhookUrl = process.env.MAKE_WEBHOOK_URL || "https://hook.us1.make.com/2txuakwgj4ajmd44l5lkip449r80ljfp";
  console.log(`\n🚀 Broadcasting 2D Reel to Make.com (${webhookUrl})...`);

  const payload = {
    title,
    caption: fullCaption,
    videoUrl: publicVideoUrl,
    productLink: "https://savagegentlemen.com/shop",
    platforms: ["instagram", "youtube", "tiktok", "facebook"],
    hashtags: [
      "#SavageGentlemen",
      "#SavGent",
      "#2DAnimation",
      "#AnimeAesthetic",
      "#CaribbeanCulture",
      "#Carnival2026",
      "#ReelsViral",
      "#FYP"
    ],
    timestamp: new Date().toISOString()
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  console.log(`   - Make.com Response: ${response.status} ${response.statusText} - ${responseText}`);

  console.log("\n================================================================================");
  console.log("🎉 2D ANIMATED REEL GENERATED & BROADCAST DISPATCHED SUCCESSFULLY!");
  console.log("================================================================================");
  console.log(`📹 Video Asset: ${publicVideoUrl}`);
  console.log(`📡 Dispatched To: Instagram Reels (Feed Enabled), YouTube Shorts, TikTok`);
  console.log("================================================================================");
}

run2DAnimatedReel().catch(err => {
  console.error("❌ Error generating 2D animated reel:", err);
  process.exit(1);
});
