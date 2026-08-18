import { generateProductVideoAd } from "../server/services/ad-video-generator";
import path from "path";
import fs from "fs";

async function generateAllViralAds() {
  console.log("🎬 Starting batch generation of Savage Gentlemen High-Traffic Viral Ads...");

  const adSpecs = [
    {
      id: "savage_hoodie_drop",
      title: "Heavyweight 480GSM French Terry Hoodie",
      category: "LIMITED STREETWEAR DROP",
      priceFormatted: "$98.00",
      description: "Handcrafted 480GSM French Terry with custom gold embroidery and fete phone pocket.",
      imageUrl: "/generated-icon.png",
      ctaText: "CLAIM DROP • SAVGENT.COM",
      stylePreset: "dark-luxury" as const,
      aspectRatio: "9:16" as const,
      durationSeconds: 8,
    },
    {
      id: "soca_passport_vip",
      title: "Soca Passport Caribbean VIP Program",
      category: "CARIBBEAN VIP REWARDS",
      priceFormatted: "FREE (+100 PTS)",
      description: "Check into Caribbean events, earn digital stamps, and unlock free VIP drinks & tickets.",
      imageUrl: "/generated-icon.png",
      ctaText: "ACTIVATE FREE • SAVGENT.COM",
      stylePreset: "caribbean-energy" as const,
      aspectRatio: "9:16" as const,
      durationSeconds: 8,
    },
    {
      id: "soca_noir_event",
      title: "Soca Noir 2026 Obsidian Masquerade",
      category: "SIGNATURE FETE EXPERIENCE",
      priceFormatted: "$45.00",
      description: "Secret Brooklyn warehouse location • World-class sound system • Tier 1 closing soon.",
      imageUrl: "/generated-icon.png",
      ctaText: "GET VIP PASSES • SAVGENT.COM",
      stylePreset: "fete-fomo" as const,
      aspectRatio: "9:16" as const,
      durationSeconds: 8,
    },
    {
      id: "savage_flask_set",
      title: "Laser-Engraved Matte Black Flask Set",
      category: "PREMIUM NIGHTLIFE BARWARE",
      priceFormatted: "$48.00",
      description: "Food-grade stainless steel with precision gold funnel for VIP nightlife access.",
      imageUrl: "/generated-icon.png",
      ctaText: "ORDER MERCH • SAVGENT.COM",
      stylePreset: "dark-luxury" as const,
      aspectRatio: "16:9" as const,
      durationSeconds: 8,
    },
    {
      id: "soundclash_dubplates",
      title: "Uncensored Soundclash Dubplates & Stems",
      category: "STUDIO MASTER AUDIO",
      priceFormatted: "$1.99",
      description: "Raw 135BPM live soundclash masters and uncompressed studio stems.",
      imageUrl: "/generated-icon.png",
      ctaText: "UNLOCK STEMS • SAVGENT.COM",
      stylePreset: "streetwear-bold" as const,
      aspectRatio: "16:9" as const,
      durationSeconds: 8,
    },
  ];

  for (const spec of adSpecs) {
    try {
      console.log(`[BatchAdGen] 🚀 Compiling ad: "${spec.title}" (${spec.aspectRatio}, ${spec.stylePreset})...`);
      const result = await generateProductVideoAd(spec);
      console.log(`[BatchAdGen] ✅ Successfully created: ${result.videoUrl}`);
    } catch (err: any) {
      console.error(`[BatchAdGen] ❌ Error generating ad for "${spec.title}":`, err.message);
    }
  }

  console.log("🎉 All Savage Gentlemen viral ads generated successfully!");
}

generateAllViralAds()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
