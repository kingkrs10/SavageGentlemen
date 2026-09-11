import "dotenv/config";
import path from "path";
import fs from "fs";
import { generateProductVideoAd } from "../server/services/ad-video-generator";
import { publishToSocialMedia } from "../server/services/social-publisher";

async function generateExactProductReel() {
  console.log("================================================================================");
  console.log("🦁 SAVAGE GENTLEMEN: COMPILING AUTHENTIC PRODUCT SHOWCASE REEL");
  console.log("================================================================================");

  // Exact authentic product photo cropped from user upload
  const exactProductImg = path.join(process.cwd(), "public", "generated-ads", "sg_lion_tee_exact_product.png");
  const siteUrl = process.env.SITE_URL || "https://savagegentlemen.onrender.com";

  console.log(`\n[1/3] 🎬 Compiling 9:16 Vertical Video Reel with Exact Product Photo...`);
  console.log(`   - Product Image: ${exactProductImg}`);

  const adResult = await generateProductVideoAd({
    id: "colorful_heart_mosaic_sg_lion_tee",
    title: "Colorful Heart Mosaic SG Lion T-Shirt",
    category: "VIP DROP • LUXURY STREETWEAR",
    priceFormatted: "$25.99",
    description: "Heavyweight garment-dyed cotton. Bold mosaic lion motif with Savage Life back print.",
    imageUrl: exactProductImg,
    ctaText: "SHOP NOW • $25.99",
    stylePreset: "dark-luxury",
    durationSeconds: 10
  });

  console.log(`   - ✅ Video Rendered: ${adResult.videoUrl}`);

  // 2. Prepare Social Payload
  const title = "Colorful Heart Mosaic SG Lion T-Shirt ($25.99) #Shorts";
  const fullCaption = `🦁 VIP DROP: COLORFUL HEART MOSAIC SG LION T-SHIRT ($25.99)\n\n` +
    `Heavyweight garment-dyed cotton. Bold Caribbean-inspired heart mosaic with SG Lion central motif and Savage Life back print.\n\n` +
    `🛍️ Shop the drop now:\n` +
    `👉 ${siteUrl}/shop\n\n` +
    `—\n` +
    `Savage Gentlemen | Unapologetically Caribbean ⚡\n\n` +
    `#SavageGentlemen #SavGent #SGGang #SocaPassport #LuxuryStreetwear #UrbanFashion #OOTD #StreetStyle #CaribbeanCulture #Carnival2026 #ReelsViral #ExplorePage #FYP #Shorts`;

  // 3. Publish to Multi-Platform Channels
  console.log("\n[2/3] 🚀 Broadcasting Exact Product Reel to Instagram, YouTube Shorts & Pinterest...");
  const publishResponse = await publishToSocialMedia({
    videoUrl: adResult.videoUrl,
    caption: fullCaption,
    title,
    platforms: ["instagram", "youtube", "tiktok", "facebook"],
    productLink: `${siteUrl}/shop`,
    hashtags: [
      "#SavageGentlemen",
      "#SavGent",
      "#LuxuryStreetwear",
      "#OOTD",
      "#CaribbeanCulture",
      "#Carnival2026",
      "#ReelsViral",
      "#FYP"
    ]
  });

  console.log("\n[3/3] 📡 Publish Response:", JSON.stringify(publishResponse, null, 2));
  console.log("================================================================================");
  console.log("🎉 AUTHENTIC PRODUCT REEL GENERATED & BROADCAST COMPLETED!");
  console.log("================================================================================");
}

generateExactProductReel().catch(err => {
  console.error("❌ Error generating exact product reel:", err);
  process.exit(1);
});
