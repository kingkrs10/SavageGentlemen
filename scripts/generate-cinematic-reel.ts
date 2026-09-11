import "dotenv/config";
import { moneyprinterService } from "../server/services/moneyprinter-service";
import fetch from "node-fetch";

async function generateCinematicReel() {
  console.log("================================================================================");
  console.log("🎬 SAVAGE GENTLEMEN: COMPILING HIGH-CINEMATIC VIRAL VIDEO REEL");
  console.log("================================================================================");

  const subject = "Savage Gentlemen: The Ultimate Caribbean Luxury & Sound System Experience";
  const script = "Welcome to the new standard of modern Caribbean luxury. From the high-energy sound systems and VIP masquerade fetes to our handcrafted Savage Nocturne streetwear drops. This is where high fashion meets raw island culture. Elevate your standard at savgent dot com.";
  const terms = [
    "caribbean nightlife",
    "carnival masquerade lights",
    "dj party crowd dancing",
    "luxury streetwear gold",
    "tropical concert stage"
  ];

  console.log("\n[1/4] 📡 Submitting Cinematic Reel Task to MoneyPrinterTurbo Engine...");
  console.log(`   - Subject: ${subject}`);
  console.log(`   - Voice: en-US-ChristopherNeural`);
  console.log(`   - Keywords: ${terms.join(", ")}`);

  const taskId = await moneyprinterService.submitTask({
    videoSubject: subject,
    videoScript: script,
    videoTerms: terms,
    videoAspect: "9:16",
    voiceName: "en-US-ChristopherNeural",
    subtitlesEnabled: true
  });

  console.log(`   - Task ID: ${taskId}`);
  console.log("\n[2/4] ⏳ Rendering HD 9:16 Video (Pexels Clips + Voiceover + Subtitles)...");

  const taskResult = await moneyprinterService.pollTask(taskId, 240);

  if (taskResult.status !== "completed" || !taskResult.videoUrl) {
    throw new Error(`Video rendering failed: ${taskResult.error || "Unknown error"}`);
  }

  console.log(`   - Raw Sidecar Video URL: ${taskResult.videoUrl}`);
  const localVideoUrl = await moneyprinterService.saveVideoLocally(taskResult.videoUrl, "cinematic_drop");
  console.log(`   - ✅ Video saved locally: ${localVideoUrl}`);

  // Formulate Viral Social Copy
  console.log("\n[3/4] ✍️ Formatting Viral Copy & Brand Hashtag Stack...");
  
  const title = "🔥 SAVAGE GENTLEMEN: ELEVATING CARIBBEAN LUXURY & STREETWEAR";
  const fullCaption = `🔥 THE STANDARD HAS CHANGED: SAVAGE GENTLEMEN NOCTURNE\n\n` +
    `🌴 Where high fashion meets raw Caribbean sound system culture. From exclusive fete VIP experiences to handcrafted heavyweight streetwear drops.\n\n` +
    `👑 Explore the collection & RSVP for upcoming experiences:\n` +
    `👉 https://savagegentlemen.com/shop\n\n` +
    `—\n` +
    `Savage Gentlemen | Unapologetically Caribbean ⚡\n\n` +
    `#SavageGentlemen #SavGent #SGGang #SocaPassport #CaribbeanExcellence ` +
    `#CaribbeanCulture #Carnival2026 #TriniCarnival #SoundSystemCulture ` +
    `#LuxuryStreetwear #UrbanFashion #OOTD #ReelsViral #ExplorePage #FYP #TrendingNow #Shorts`;

  console.log("--- CAPTION ---");
  console.log(fullCaption);
  console.log("---------------");

  // Send to Make.com Webhook
  const webhookUrl = process.env.MAKE_WEBHOOK_URL || "https://hook.us1.make.com/2txuakwgj4ajmd44l5lkip449r80ljfp";
  console.log(`\n[4/4] 🚀 Broadcasting Video Payload to Make.com Webhook (${webhookUrl})...`);

  const { uploadLocalVideoToPublicCDN } = await import("../server/services/social-publisher");
  const publicVideoUrl = uploadLocalVideoToPublicCDN(localVideoUrl);

  const payload = {
    title: "Savage Gentlemen: The Ultimate Caribbean Luxury Experience #Shorts",
    caption: fullCaption,
    videoUrl: publicVideoUrl,
    localFile: localVideoUrl,
    productLink: "https://savagegentlemen.com/shop",
    platforms: ["youtube", "instagram", "facebook", "tiktok"],
    hashtags: [
      "#SavageGentlemen",
      "#SavGent",
      "#CaribbeanCulture",
      "#Carnival2026",
      "#Shorts",
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
  console.log(`   - Make.com Response Status: ${response.status} ${response.statusText}`);
  console.log(`   - Make.com Response Body: ${responseText}`);

  console.log("\n================================================================================");
  console.log("🎉 CINEMATIC REEL GENERATED & BROADCAST DISPATCHED SUCCESSFULLY!");
  console.log("================================================================================");
  console.log(`📹 Video Location: ${localVideoUrl}`);
  console.log(`📡 Destination: YouTube Shorts, Instagram Reels, TikTok`);
  console.log("================================================================================");
}

generateCinematicReel().catch(err => {
  console.error("❌ Error generating cinematic reel:", err);
  process.exit(1);
});
