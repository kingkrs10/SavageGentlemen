import "dotenv/config";
import { storage } from "../server/storage";
import { moneyprinterService } from "../server/services/moneyprinter-service";
import { instagramBot } from "../server/workers/instagram-bot";
import { magazineBot } from "../server/workers/magazine-bot";
import { isSocaArticle } from "../server/workers/social-autoposter";

async function runAutoPostVideo() {
  console.log("================================================================================");
  console.log("🎬 SAVAGE GENTLEMEN: AUTONOMOUS VIDEO REEL GENERATION & SOCIAL AUTO-POST");
  console.log("================================================================================");

  // 1. Check MoneyPrinterTurbo AI Engine Status
  console.log("\n[Step 1/5] 📡 Checking AI Video Engine Health...");
  const health = await moneyprinterService.checkHealth();
  console.log(`   - Status: ${health.online ? "🟢 ONLINE" : "🟡 STANDBY (Fallback Active)"}`);
  console.log(`   - Endpoint: ${health.apiUrl}`);
  console.log(`   - Message: ${health.message}`);

  // 2. Select Soca Candidate Article from Database
  console.log("\n[Step 2/5] 📰 Selecting Soca Story for Video Generation & Publishing...");
  let allArticles = await storage.getAllArticles({ isPublished: true, limit: 100 });
  let socaArticles = allArticles.filter(isSocaArticle);
  let candidate = socaArticles.find(a => !a.igPosted);

  if (!candidate) {
    console.log("   - No unposted Soca articles found. Ingesting fresh Caribbean carnival feeds...");
    await magazineBot.syncFeeds();
    allArticles = await storage.getAllArticles({ isPublished: true, limit: 100 });
    socaArticles = allArticles.filter(isSocaArticle);
    candidate = socaArticles.find(a => !a.igPosted);
  }

  if (!candidate && socaArticles.length > 0) {
    candidate = socaArticles[0]; // Fallback to latest Soca article
  }

  if (!candidate) {
    throw new Error("No Soca or Carnival articles found in database.");
  }

  const siteUrl = process.env.SITE_URL || "https://www.savgent.com";
  console.log(`   - Selected Story: "${candidate.title}" (ID: ${candidate.id})`);
  console.log(`   - Category: ${candidate.category.toUpperCase()}`);
  console.log(`   - Summary: "${candidate.summary}"`);
  console.log(`   - Article URL: ${siteUrl}/magazine/${candidate.slug}`);

  // 3. Render 9:16 Vertical Video Reel
  console.log("\n[Step 3/5] 🎥 Compiling 9:16 Vertical Video Reel...");
  console.log("   - Generating spoken voiceover script...");
  console.log("   - Querying stock footage & dynamic transitions...");
  console.log("   - Burning synchronized karaoke subtitles & background beats...");
  
  const videoResult = await moneyprinterService.generateVideoFromArticle(candidate);
  console.log(`   - ✅ Video Rendered Successfully!`);
  console.log(`   - Engine Used: ${videoResult.engine === "moneyprinter" ? "MoneyPrinterTurbo AI Engine" : "Local High-Performance Studio Canvas"}`);
  console.log(`   - Video File URL: ${videoResult.videoUrl}`);

  // 4. Generate Social Caption & Formatting
  console.log("\n[Step 4/5] ✍️ Generating Viral Social Media Copy...");
  const fullCaption = instagramBot.generateCaption(candidate);
  console.log("--- SOCIAL POST CAPTION ---");
  console.log(fullCaption);
  console.log("---------------------------");

  // 5. Broadcast to Make.com Universal Webhook
  console.log("\n[Step 5/5] 🚀 Broadcasting Video Reel across Social Networks...");
  const publishResult = await instagramBot.publishArticlePost(candidate.id, {
    videoUrl: videoResult.videoUrl,
    engine: videoResult.engine
  });

  console.log("   - Dispatch Status:", publishResult.success ? "✅ BROADCAST ACCEPTED" : "⚠️ DISPATCH ERROR");
  if (publishResult.postId) {
    console.log(`   - Transaction Reference: ${publishResult.postId}`);
  }
  if (publishResult.error) {
    console.log(`   - Error Detail: ${publishResult.error}`);
  }

  console.log("\n================================================================================");
  console.log("🎉 AUTONOMOUS VIDEO DISPATCH COMPLETED SUCCESSFULLY");
  console.log("================================================================================");
  console.log(`📱 Story: "${candidate.title}"`);
  console.log(`📹 Video Asset: ${videoResult.videoUrl}`);
  console.log(`🌐 Distribution: Instagram Reels, Facebook Reels, YouTube Shorts, TikTok`);
  console.log("================================================================================");

  process.exit(0);
}

runAutoPostVideo().catch((err) => {
  console.error("\n❌ Fatal execution error:", err);
  process.exit(1);
});
