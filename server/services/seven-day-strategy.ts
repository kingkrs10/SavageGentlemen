import { db } from "../db";
import { siteSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import { publishToSocialMedia, uploadLocalVideoToPublicCDN } from "./social-publisher";
import path from "path";
import fs from "fs";

export interface StrategyDayPlan {
  day: number;
  title: string;
  country: string;
  flag: string;
  theme: string;
  hook: string;
  storyScript: string;
  caption: string;
  hashtags: string[];
  product: {
    id: string;
    title: string;
    priceFormatted: string;
    shopUrl: string;
    imageUrl: string;
    videoUrl?: string;
  };
  promoCode: string;
  growthMultiplier: string;
  targetPlatforms: ("instagram" | "tiktok" | "youtube" | "facebook")[];
}

const SITE_URL = process.env.SITE_URL || "https://www.savgent.com";
const SETTINGS_KEY = "seven_day_autopost_strategy";

export const SEVEN_DAY_CARIBBEAN_STRATEGY: StrategyDayPlan[] = [
  {
    day: 1,
    title: "Trinidad & Tobago J'ouvert Stamina & The Savage Nocturne Drop",
    country: "Trinidad & Tobago",
    flag: "🇹🇹",
    theme: "J'ouvert Paint Rituals & 4 AM Predawn Road March",
    hook: "The 1 unwritten rule of Trinidad J'ouvert that outsiders ALWAYS break...",
    storyScript: "4 AM in Port of Spain. Mud, paint, steelpan vibrating your chest, and a predawn chill only true road marchers understand. That is why we built the Savage Nocturne Heavyweight Hoodie. 480GSM French Terry, double-lined hood, and metallic gold crest. Built to outlast the fete.",
    caption: `🔥 THE UNWRITTEN J'OUVERT RULE 🇹🇹\n\n` +
      `At 4:00 AM on the streets of Port of Spain, there's one rule every true fetegoer knows: if you wear cheap threads to J'ouvert, the paint and mud will claim it by sunrise.\n\n` +
      `We engineered the Savage Nocturne Heavyweight Hoodie specifically for high-stamina carnival culture. 480 GSM ultra-dense French Terry, double-lined hood for cold pre-dawn fete winds, and an embossed gold Savage Gentlemen crest that commands respect anywhere on the globe.\n\n` +
      `⚡ LIMITED FIRST BATCH RUN (50 Pieces Only)\n` +
      `🎁 Use code: CARIBBEAN10 at checkout for 10% off.\n\n` +
      `🛍️ Shop the drop now:\n` +
      `👉 ${SITE_URL}/shop\n\n` +
      `💬 QUESTION: Tag your carnival crew who wouldn't last 2 hours in J'ouvert! Drop a 🇹🇹 if your stamina is undefeated.\n\n` +
      `—\n` +
      `Savage Gentlemen | The Pulse of Caribbean Luxury & Sound System Culture ⚡`,
    hashtags: [
      "#SavageGentlemen",
      "#SavGent",
      "#TrinidadCarnival",
      "#Jouvert",
      "#SocaMusic",
      "#TriniCarnival2026",
      "#RoadMarch",
      "#LuxuryStreetwear",
      "#CaribbeanCulture",
      "#CarnivalVibes",
      "#ReelsViral",
      "#ExplorePage",
      "#FYP"
    ],
    product: {
      id: "sg-obsidian-hoodie",
      title: "Savage Nocturne Heavyweight Hoodie",
      priceFormatted: "$78.00",
      shopUrl: `${SITE_URL}/shop`,
      imageUrl: "/mockups/sg_luxury_hoodie.jpg",
      videoUrl: "https://files.catbox.moe/9kjk70.mp4",
    },
    promoCode: "CARIBBEAN10",
    growthMultiplier: "High WhatsApp & Group DM Share Rate + Comment debate on J'ouvert survival.",
    targetPlatforms: ["instagram", "tiktok", "youtube", "facebook"]
  },
  {
    day: 2,
    title: "Jamaica Sound System Heritage & Studio One Boxy Graphic Tee",
    country: "Jamaica",
    flag: "🇯🇲",
    theme: "Soundclash Dubplates, Studio One & Rewind Culture",
    hook: "Why real Jamaican sound selectors never play the radio version of a hit...",
    storyScript: "From Kingston to the world. Sound system clash culture was built on exclusive dubplates cut in secret to destroy rival speakers. Our Sound System Heavy Graphic Tee pays homage with 260GSM vintage-washed cotton and gold foil soundclash typography.",
    caption: `🔊 DUBPLATE CULTURE & KINGSTON HERITAGE 🇯🇲\n\n` +
      `Real selectors know: when the bass drops at 135BPM, you don't play the radio edit. You play the uncensored, custom-cut dubplate that took 6 months to track down in Kingston.\n\n` +
      `Our Sound System Heavy Graphic Tee brings that heavyweight soundclash energy to premium streetwear. Cut from 260 GSM vintage-washed combed cotton with drop-shoulder boxy silhouette and metallic gold soundclash lettering.\n\n` +
      `👕 Premium Heavyweight Drop: $42.00\n` +
      `🎁 Use code: CARIBBEAN10 for 10% off today.\n\n` +
      `🛍️ Cop yours before it sells out:\n` +
      `👉 ${SITE_URL}/shop\n\n` +
      `💬 QUESTION: Which Jamaican sound system had the most lethal dubplate box in history: Stone Love, Bass Odyssey, or Killamanjaro? Tell us below!\n\n` +
      `—\n` +
      `Savage Gentlemen | Unapologetically Caribbean ⚡`,
    hashtags: [
      "#SavageGentlemen",
      "#SavGent",
      "#JamaicaCulture",
      "#SoundSystem",
      "#SoundClash",
      "#StudioOne",
      "#ReggaeRoots",
      "#Dancehall",
      "#VintageStreetwear",
      "#KingstonVibes",
      "#GraphicTee",
      "#FYP"
    ],
    product: {
      id: "sg-riddim-tee",
      title: "Sound System Heavy Graphic Tee",
      priceFormatted: "$42.00",
      shopUrl: `${SITE_URL}/shop`,
      imageUrl: "/mockups/sg_soundclash_tee.jpg",
      videoUrl: "https://files.catbox.moe/4vt4w1.mp4",
    },
    promoCode: "CARIBBEAN10",
    growthMultiplier: "High Comment Debate on legendary sound systems + Audio Saves.",
    targetPlatforms: ["instagram", "tiktok", "youtube", "facebook"]
  },
  {
    day: 3,
    title: "Barbados Crop Over vs. Grenada Spicemas & The Barology Flask Set",
    country: "Barbados & Grenada",
    flag: "🇧🇧 🇬🇩",
    theme: "Sweet Soca on the Highway vs. Primal Jab Jab Defiance",
    hook: "Could you survive 6 hours in a Grenada Spicemas Jab Jab band? Most people tap out by 5 AM.",
    storyScript: "Barbados brings silky Sweet Soca on Spring Garden. Grenada brings raw, chain-rattling Jab Jab in the pitch black of St. George's. Two legendary island energies, one universal truth: you need your rum close. Enter the Savage Barology Matte Black Flask Set.",
    caption: `🌴 SWEET SOCA vs. JAB JAB CHAOS 🇧🇧 🇬🇩\n\n` +
      `There are two kinds of carnival energy in August:\n` +
      `1️⃣ The silky, sun-drenched Sweet Soca and Grand Kadooment elegance of Barbados.\n` +
      `2️⃣ The raw, horn-blowing, oil-soaked, chain-rattling defiance of Grenada Spicemas Jab Jab.\n\n` +
      `Whichever road you choose, you don't drink warm bottom-shelf liquor. The Savage Barology Flask Set is laser-engraved food-grade stainless steel with a stealth matte black finish, two matching shot cups, and filling funnel. Built for 10-year aged Caribbean rum.\n\n` +
      `🍸 Savage Barology Flask Set ($48.00)\n` +
      `🎁 Code: CARIBBEAN10 unlocks 10% off today.\n\n` +
      `🛍️ Order your luxury flask set:\n` +
      `👉 ${SITE_URL}/shop\n\n` +
      `💬 DEBATE: Bajans vs. Grenadians — who had the better carnival season? Drop a 🇧🇧 or 🇬🇩 in the comments!\n\n` +
      `—\n` +
      `Savage Gentlemen | Island Luxury Redefined ⚡`,
    hashtags: [
      "#SavageGentlemen",
      "#SavGent",
      "#CropOver2026",
      "#Spicemas",
      "#JabJab",
      "#BarbadosCarnival",
      "#GrenadaCarnival",
      "#SweetSoca",
      "#IslandLuxury",
      "#Barware",
      "#RumLovers",
      "#FYP"
    ],
    product: {
      id: "sg-flask-set",
      title: "Savage Barology Matte Black Flask Set",
      priceFormatted: "$48.00",
      shopUrl: `${SITE_URL}/shop`,
      imageUrl: "/mockups/sg_barology_flask.jpg",
      videoUrl: "https://files.catbox.moe/igsf07.mp4",
    },
    promoCode: "CARIBBEAN10",
    growthMultiplier: "Fierce regional pride comments (Bajan vs. Grenadian) + Travel itinerary saves.",
    targetPlatforms: ["instagram", "tiktok", "youtube", "facebook"]
  },
  {
    day: 4,
    title: "St. Lucia Dennery Segment & Savage Nocturne Shield Shades",
    country: "St. Lucia & Dominica",
    flag: "🇱🇨 🇩🇲",
    theme: "Dennery Segment Syncopation, Bouyon & High-Noon Glare",
    hook: "They said Dennery Segment would never leave St. Lucia. Now it runs every carnival worldwide.",
    storyScript: "Born on the streets of Gros Islet and Dennery, that rapid-fire Kuduro-infused Lucian rhythm took over the globe. Feting under blazing 95-degree Caribbean sun demands unbreakable style. Savage Nocturne Polarized Shield Shades: UV400 protection with zero glare.",
    caption: `🔥 THE DENNERY SEGMENT REVOLUTION 🇱🇨 🇩🇲\n\n` +
      `When Lucian producers first started dropping Dennery Segment in Gros Islet, critics said the tempo was too fast. Today? You can't enter a cooler fete in Trinidad, Miami, Toronto, or London without hearing that syncopated baseline shatter the speakers.\n\n` +
      `When the midday sun hits the parade route, you need eye defense engineered for the heat. The Savage Nocturne Shield Shades deliver UV400 polarized frameless protection, scratch-resistant mirrored gold lenses, and high-impact durability.\n\n` +
      `🕶️ Savage Nocturne Polarized Shield Shades ($55.00)\n` +
      `🎁 Use code: CARIBBEAN10 for 10% off.\n\n` +
      `🛍️ Secure your pair:\n` +
      `👉 ${SITE_URL}/shop\n\n` +
      `💬 QUESTION: Drop a 🇱🇨 or 🇩🇲 if Dennery Segment or Bouyon is on your daily workout playlist!\n\n` +
      `—\n` +
      `Savage Gentlemen | The Pulse of Caribbean Lifestyle ⚡`,
    hashtags: [
      "#SavageGentlemen",
      "#SavGent",
      "#DennerySegment",
      "#Bouyon",
      "#LucianCarnival",
      "#DominicaMas",
      "#Soca2026",
      "#HighEnergySoca",
      "#ShieldShades",
      "#CarnivalStyle",
      "#FYP"
    ],
    product: {
      id: "sg-nocturne-shades",
      title: "Savage Nocturne Polarized Shield Shades",
      priceFormatted: "$55.00",
      shopUrl: `${SITE_URL}/shop`,
      imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=1000&fit=crop",
      videoUrl: "https://files.catbox.moe/vbp89b.mp4",
    },
    promoCode: "CARIBBEAN10",
    growthMultiplier: "Lucian diaspora group chat shares + high-tempo audio sync.",
    targetPlatforms: ["instagram", "tiktok", "youtube", "facebook"]
  },
  {
    day: 5,
    title: "St. Vincent Vincy Mas, Antigua Wadadli & The Carnival Heavy Canvas Tote",
    country: "St. Vincent & Antigua",
    flag: "🇻🇨 🇦🇬",
    theme: "Ragga Soca Royalty, Wadadli Iron Bands & Road March Survival",
    hook: "Unpopular opinion: St. Vincent produces the hardest Ragga Soca melodies in Caribbean history.",
    storyScript: "Vincy Mas Ragga Soca melodies run deep in the soul, while Antigua's Wadadli iron band percussion commands your feet to move. Surving 12 hours on the road requires serious gear: our 20oz duck canvas tote with waterproof inner lining guards your phone and road essentials.",
    caption: `🥁 RAGGA SOCA SOUL & ROAD ESSENTIALS 🇻🇨 🇦🇬\n\n` +
      `No other island captures melodic soul like St. Vincent during Vincy Mas. And no other sound compares to the raw iron bands of Antigua echoing through St. John's.\n\n` +
      `When you're jumping up from 10 AM to sundown, you can't afford a torn bag or a waterlogged phone. The Savage Gentlemen Carnival Heavy Duty Canvas Tote is built from military-grade 20oz duck canvas with a waterproof interior lining, zippered security pocket, and reinforced handles.\n\n` +
      `🎒 Carnival Heavy Duty Duck Canvas Tote ($32.00)\n` +
      `🎁 Promo code: CARIBBEAN10 for 10% off.\n\n` +
      `🛍️ Get your fete essentials bag:\n` +
      `👉 ${SITE_URL}/shop\n\n` +
      `💬 QUESTION: What's the #1 Ragga Soca anthem of all time? Drop your pick and your flag (🇻🇨 / 🇦🇬) below!\n\n` +
      `—\n` +
      `Savage Gentlemen | Built for the Culture ⚡`,
    hashtags: [
      "#SavageGentlemen",
      "#SavGent",
      "#VincyMas",
      "#AntiguaCarnival",
      "#Wadadli",
      "#RaggaSoca",
      "#IronBand",
      "#CarnivalBag",
      "#RoadEssentials",
      "#CaribbeanCulture",
      "#FYP"
    ],
    product: {
      id: "sg-fete-tote",
      title: "Carnival Heavy Duty Canvas Tote",
      priceFormatted: "$32.00",
      shopUrl: `${SITE_URL}/shop`,
      imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&h=1000&fit=crop",
      videoUrl: "https://files.catbox.moe/ww254b.mp4",
    },
    promoCode: "CARIBBEAN10",
    growthMultiplier: "Saves for carnival packing checklists + Vincy patriot shares.",
    targetPlatforms: ["instagram", "tiktok", "youtube", "facebook"]
  },
  {
    day: 6,
    title: "Bahamas Junkanoo & Guyana Mashramani: The SG Lion Mosaic Drop",
    country: "Bahamas & Guyana",
    flag: "🇧🇸 🇬🇾",
    theme: "Junkanoo Brass, Goatskin Drums & Mashramani Pride",
    hook: "If you've never heard 100 cowbells echoing through Nassau at 3 AM, you haven't truly lived.",
    storyScript: "Bay Street at Boxing Day: thunderous goatskin drums, blaring brass, and thousands of handmade paper costumes. Pair that with the kaleidoscopic energy of Guyana's Mashramani. Our Colorful Heart Mosaic SG Lion Tee embodies that fearless Caribbean spirit in garment-dyed cotton.",
    caption: `🦁 JUNKANOO THUNDER & MASHRAMANI MAJESTY 🇧🇸 🇬🇾\n\n` +
      `At 3:00 AM on Bay Street in Nassau, the sound of 100 cowbells, whistles, and hand-tuned goatskin drums hits you right in the center of your chest. In Georgetown, Guyana, Mashramani turns the entire city into an unstoppable explosion of colors and soca unity.\n\n` +
      `Our Colorful Heart Mosaic SG Lion Tee celebrates this royal energy. Features a vibrant Caribbean-inspired mosaic lion crest and bold 'Savage Life' typography on heavyweight garment-dyed combed cotton.\n\n` +
      `🦁 Colorful Heart Mosaic SG Lion Tee ($25.99)\n` +
      `🎁 Promo code: CARIBBEAN10 gives you 10% off at checkout.\n\n` +
      `🛍️ Shop this limited VIP release:\n` +
      `👉 ${SITE_URL}/shop\n\n` +
      `💬 QUESTION: Which cultural celebration has more energy: Junkanoo on Bay Street or Guyana Mashramani? Drop your flag 🇧🇸 or 🇬🇾 below!\n\n` +
      `—\n` +
      `Savage Gentlemen | Royalty of the Islands ⚡`,
    hashtags: [
      "#SavageGentlemen",
      "#SavGent",
      "#Junkanoo",
      "#BahamasCulture",
      "#GuyanaCarnival",
      "#Mashramani",
      "#CaribbeanFashion",
      "#LionTee",
      "#StreetwearDrop",
      "#ExplorePage",
      "#FYP"
    ],
    product: {
      id: "sg-lion-tee",
      title: "Colorful Heart Mosaic SG Lion T-Shirt",
      priceFormatted: "$25.99",
      shopUrl: `${SITE_URL}/shop`,
      imageUrl: "/generated-ads/sg_lion_tee_exact_product.png",
      videoUrl: "https://files.catbox.moe/y9n7px.mp4",
    },
    promoCode: "CARIBBEAN10",
    growthMultiplier: "Viral Junkanoo audio sync + Guyanese and Bahamian community pride.",
    targetPlatforms: ["instagram", "tiktok", "youtube", "facebook"]
  },
  {
    day: 7,
    title: "The Global Caribbean Diaspora & The Complete Savage Gentlemen Capsule",
    country: "Global Caribbean Diaspora",
    flag: "🌎 🌴",
    theme: "Eastern Parkway, Caribana, Notting Hill & Soca Passport VIP",
    hook: "From Brooklyn's Eastern Parkway to London's Notting Hill: The Caribbean spirit runs the world.",
    storyScript: "Wherever we go, the rhythm follows. Caribana in Toronto, Labor Day in NYC, Miami Carnival, and Notting Hill in London. Introducing the full Savage Gentlemen luxury wardrobe + Soca Passport VIP. Attend events, earn reward stamps, and unlock free VIP passes and merch.",
    caption: `👑 THE GLOBAL CARIBBEAN MOVEMENT 🌎 🌴\n\n` +
      `From Eastern Parkway in Brooklyn to Eglinton West in Toronto, from Ladbroke Grove in London to South Beach in Miami: The Caribbean diaspora has built the most infectious, dominant cultural movement on Earth.\n\n` +
      `Savage Gentlemen is the home for those who represent that luxury standard every day of the year. Hoodies, boxy soundclash tees, polarized shield shades, matte black barology sets, and the revolutionary Soca Passport.\n\n` +
      `✨ SOCA PASSPORT: Claim 100 free reward points today. Attend Caribbean events worldwide, earn digital stamps, and unlock free drinks, merch, and VIP passes.\n\n` +
      `🛍️ Explore the complete capsule:\n` +
      `👉 ${SITE_URL}/shop\n` +
      `🎟️ Claim your free Soca Passport: ${SITE_URL}/socapassport\n\n` +
      `💬 QUESTION: Where in the world are you representing your Caribbean roots from? Drop your city & home island flag below! Follow @savagegentlemen for daily Caribbean culture and VIP drops.\n\n` +
      `—\n` +
      `Savage Gentlemen | The Pulse of Caribbean Lifestyle ⚡`,
    hashtags: [
      "#SavageGentlemen",
      "#SavGent",
      "#SocaPassport",
      "#CaribbeanDiaspora",
      "#Caribana",
      "#NottingHillCarnival",
      "#MiamiCarnival",
      "#LaborDayCarnival",
      "#GlobalCaribbean",
      "#LuxuryStreetwear",
      "#FYP"
    ],
    product: {
      id: "sg-capsule-all",
      title: "Savage Gentlemen Luxury Capsule & Soca Passport",
      priceFormatted: "FREE PASSPORT + MERCH",
      shopUrl: `${SITE_URL}/shop`,
      imageUrl: "/mockups/sg_luxury_hoodie.jpg",
      videoUrl: "https://files.catbox.moe/bl4xrg.mp4",
    },
    promoCode: "CARIBBEAN10",
    growthMultiplier: "Universal diaspora unification + High saves for Soca Passport loyalty signup.",
    targetPlatforms: ["instagram", "tiktok", "youtube", "facebook"]
  }
];

export interface SevenDayStrategyState {
  currentActiveDay: number;
  isAutoProgressionEnabled: boolean;
  history: {
    day: number;
    postedAt: string;
    status: "success" | "simulated" | "failed";
    title: string;
    mediaUrl?: string;
    platforms: string[];
    results: any[];
  }[];
  lastExecutedAt?: string;
}

export class SevenDayStrategyService {
  private state: SevenDayStrategyState = {
    currentActiveDay: 1,
    isAutoProgressionEnabled: true,
    history: []
  };

  private schedulerTimer: NodeJS.Timeout | null = null;

  async init() {
    await this.loadState();
    this.startAutoScheduler();
  }

  startAutoScheduler() {
    if (this.schedulerTimer) return;
    console.log("[SevenDayStrategy] ⏰ Starting 7-Day Auto-Progression Scheduler (Daily check at 11:00 AM EST)...");
    
    // Check every 15 minutes
    const intervalMs = 15 * 60 * 1000;
    this.schedulerTimer = setInterval(() => {
      this.checkAndAutoPost().catch(err => {
        console.error("[SevenDayStrategy] Auto-post check error:", err);
      });
    }, intervalMs);

    // Initial check 10 seconds after server startup
    setTimeout(() => {
      this.checkAndAutoPost().catch(err => {
        console.error("[SevenDayStrategy] Initial auto-post check error:", err);
      });
    }, 10000);
  }

  getCurrentESTDate(): { dateStr: string; hour: number } {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find(p => p.type === "year")?.value || "";
    const month = parts.find(p => p.type === "month")?.value || "";
    const day = parts.find(p => p.type === "day")?.value || "";
    const hour = parseInt(parts.find(p => p.type === "hour")?.value || "0", 10);
    return { dateStr: `${year}-${month}-${day}`, hour };
  }

  async checkAndAutoPost() {
    await this.loadState();
    if (!this.state.isAutoProgressionEnabled) return;

    const est = this.getCurrentESTDate();
    // Only post after 11:00 AM EST
    if (est.hour < 11) return;

    // Check if we already posted today in EST
    const lastExecutedDate = this.state.lastExecutedAt 
      ? new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(this.state.lastExecutedAt))
      : "";
    const todayEstFormatted = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

    if (lastExecutedDate === todayEstFormatted) {
      // Already posted today
      return;
    }

    if (this.state.currentActiveDay <= 7) {
      console.log(`[SevenDayStrategy] ⏰ Auto-triggering Day ${this.state.currentActiveDay} broadcast for ${est.dateStr}...`);
      await this.executeDayPost(this.state.currentActiveDay);
    }
  }

  private async loadState() {
    try {
      const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, SETTINGS_KEY)).limit(1);
      if (rows.length > 0 && rows[0].value) {
        const parsed = JSON.parse(rows[0].value);
        this.state = {
          currentActiveDay: parsed.currentActiveDay || 1,
          isAutoProgressionEnabled: parsed.isAutoProgressionEnabled ?? true,
          history: Array.isArray(parsed.history) ? parsed.history : [],
          lastExecutedAt: parsed.lastExecutedAt
        };
      }
    } catch (err: any) {
      console.warn("[SevenDayStrategy] State load note:", err.message);
    }
  }

  private async saveState() {
    try {
      const payload = JSON.stringify(this.state);
      const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, SETTINGS_KEY)).limit(1);
      if (rows.length > 0) {
        await db.update(siteSettings).set({ value: payload, updatedAt: new Date() }).where(eq(siteSettings.key, SETTINGS_KEY));
      } else {
        await db.insert(siteSettings).values({ key: SETTINGS_KEY, value: payload });
      }
    } catch (err: any) {
      console.error("[SevenDayStrategy] Failed saving state:", err.message);
    }
  }

  async getCalendar() {
    await this.loadState();
    return {
      state: this.state,
      schedule: SEVEN_DAY_CARIBBEAN_STRATEGY.map(plan => {
        const historyItem = this.state.history.find(h => h.day === plan.day);
        return {
          ...plan,
          isCompleted: !!historyItem && historyItem.status === "success",
          postedAt: historyItem?.postedAt,
          isCurrent: this.state.currentActiveDay === plan.day
        };
      })
    };
  }

  async getDayPlan(dayNumber: number): Promise<StrategyDayPlan | undefined> {
    return SEVEN_DAY_CARIBBEAN_STRATEGY.find(p => p.day === dayNumber);
  }

  async executeDayPost(dayNumber: number, options?: { dryRun?: boolean }) {
    await this.loadState();
    const plan = await this.getDayPlan(dayNumber);
    if (!plan) {
      throw new Error(`Invalid strategy day: ${dayNumber}. Must be between 1 and 7.`);
    }

    console.log(`[SevenDayStrategy] 🚀 Executing Day ${dayNumber} Social Broadcast...`);
    console.log(`   - Theme: ${plan.theme} (${plan.country} ${plan.flag})`);
    console.log(`   - Product: ${plan.product.title} (${plan.product.priceFormatted})`);

    // 1. Resolve media URL (video if available, otherwise high-res product image)
    let mediaUrl = plan.product.videoUrl || plan.product.imageUrl;

    // Verify file on disk if relative path
    if (mediaUrl.startsWith("/")) {
      const candidatePublic = path.join(process.cwd(), "public", mediaUrl);
      const candidateRoot = path.join(process.cwd(), mediaUrl);
      if (!fs.existsSync(candidatePublic) && !fs.existsSync(candidateRoot)) {
        // Fallback to verified hoodie drop video
        const fallbackVideo = path.join(process.cwd(), "public", "generated-ads", "ad_savage_hoodie_drop_9x16_1787011882978.mp4");
        if (fs.existsSync(fallbackVideo)) {
          mediaUrl = "/generated-ads/ad_savage_hoodie_drop_9x16_1787011882978.mp4";
        }
      }
    }

    // 2. Dispatch via MultiPlatform Social Publisher
    const publishResponse = await publishToSocialMedia({
      videoUrl: mediaUrl,
      caption: plan.caption,
      title: `${plan.flag} ${plan.title}`,
      platforms: plan.targetPlatforms,
      productLink: plan.product.shopUrl,
      hashtags: plan.hashtags,
      isTestMode: !!options?.dryRun
    });

    const isSuccess = publishResponse.success || publishResponse.results.some(r => r.status === "success");
    const record = {
      day: dayNumber,
      postedAt: new Date().toISOString(),
      status: (isSuccess ? "success" : options?.dryRun ? "simulated" : "failed") as "success" | "simulated" | "failed",
      title: plan.title,
      mediaUrl,
      platforms: plan.targetPlatforms,
      results: publishResponse.results
    };

    // Update history (replace previous day entry if present)
    this.state.history = this.state.history.filter(h => h.day !== dayNumber);
    this.state.history.push(record);
    this.state.lastExecutedAt = new Date().toISOString();

    // Advance to next day if this day succeeded and auto-progression is on
    if (isSuccess && dayNumber === this.state.currentActiveDay && dayNumber < 7) {
      this.state.currentActiveDay = dayNumber + 1;
    }

    await this.saveState();

    return {
      success: isSuccess,
      day: dayNumber,
      plan,
      mediaUrl,
      results: publishResponse.results,
      nextDay: this.state.currentActiveDay
    };
  }

  async setActiveDay(dayNumber: number) {
    if (dayNumber >= 1 && dayNumber <= 7) {
      this.state.currentActiveDay = dayNumber;
      await this.saveState();
    }
    return this.getCalendar();
  }

  async toggleAutoProgression(enabled?: boolean) {
    this.state.isAutoProgressionEnabled = enabled ?? !this.state.isAutoProgressionEnabled;
    await this.saveState();
    return this.getCalendar();
  }
}

export const sevenDayStrategyService = new SevenDayStrategyService();
