import { generateProductVideoAd } from "../server/services/ad-video-generator";

async function generateCarnivalPlannerAds() {
  console.log("🎬 Generating visual video ads for Carnival Planner (www.carnival-planner.com)...");

  // 1. 9:16 Vertical Reel
  const verticalAd = await generateProductVideoAd({
    id: "carnival_planner_visual",
    title: "Carnival Planner • Luxury Fete & Itinerary Concierge",
    category: "OFFICIAL SPONSOR",
    priceFormatted: "WWW.CARNIVAL-PLANNER.COM",
    description: "Elevate your carnival experience. Bespoke fete itineraries, VIP costume packages, and luxury travel.",
    imageUrl: "/images/carnival-planner-vertical.jpg",
    ctaText: "PLAN YOUR CARNIVAL • WWW.CARNIVAL-PLANNER.COM",
    stylePreset: "caribbean-energy",
    aspectRatio: "9:16",
    durationSeconds: 10,
  });

  console.log("✅ 9:16 Carnival Planner Video Ad created:", verticalAd.videoUrl);

  // 2. 16:9 Landscape Banner Video
  const landscapeAd = await generateProductVideoAd({
    id: "carnival_planner_banner",
    title: "Carnival Planner • Elevate Your Experience",
    category: "OFFICIAL SPONSOR",
    priceFormatted: "WWW.CARNIVAL-PLANNER.COM",
    description: "Unforgettable bespoke Caribbean carnival travel and fete planning concierge.",
    imageUrl: "/images/carnival-planner-ad.jpg",
    ctaText: "BOOK AT WWW.CARNIVAL-PLANNER.COM",
    stylePreset: "caribbean-energy",
    aspectRatio: "16:9",
    durationSeconds: 10,
  });

  console.log("✅ 16:9 Carnival Planner Video Ad created:", landscapeAd.videoUrl);
}

generateCarnivalPlannerAds()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
