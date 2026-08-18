import { storage } from "../storage";
import { InsertArticle } from "@shared/schema";
import { cleanTitle, cleanCaption, isDuplicateStory } from "@shared/text-sanitizer";

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  category?: string;
  imageUrl?: string;
  sourceName?: string;
}

const CARIBBEAN_FEEDS = [
  {
    name: "Global Carnivalist",
    url: "https://globalcarnivalist.com/feed/",
    defaultCategory: "nightlife",
  },
  {
    name: "TriniJungleJuice Events & Reviews",
    url: "https://www.trinijunglejuice.com/home/feed/",
    defaultCategory: "nightlife",
  },
  {
    name: "LargeUp Caribbean Culture",
    url: "https://www.largeup.com/feed/",
    defaultCategory: "culture",
  },
  {
    name: "Dancehall & Reggae Daily",
    url: "https://dancehallmag.com/feed",
    defaultCategory: "music",
  },
  {
    name: "Soca News Global",
    url: "https://socanews.com/feed/",
    defaultCategory: "nightlife",
  },
  {
    name: "Caribbean Beat Magazine",
    url: "https://www.caribbean-beat.com/feed",
    defaultCategory: "style",
  },
];

// High-quality curated starter articles for immediate rich content
const SEED_ARTICLES: InsertArticle[] = [
  {
    slug: "carnival-2026-luxury-fete-guide",
    title: "The 2026 Luxury Fete & Mas Survival Blueprint: Trinidad, Miami, & Crop Over",
    summary: "From sunrise breakfast fetes to VIP catamaran cruises, here is the insider guide to conquering the world's most elite Carnival seasons in style.",
    category: "nightlife",
    featuredImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=800&fit=crop",
    sourceName: "Savage Gentlemen Editorial",
    sourceUrl: "https://savgent.com",
    author: "Kareem 'Selecta' Vance",
    tags: ["Carnival", "Nightlife", "Trinidad", "Crop Over", "VIP Guide"],
    readTime: "4 min read",
    isAiGenerated: true,
    isPublished: true,
    isFeatured: true,
    publishedAt: new Date(),
    content: `
# The High-Life Carnival Circuit: Beyond the Ordinary

Carnival is not merely a party; it is an endurance sport of euphoric proportions and exquisite cultural celebration. For those navigating the global circuit—from Port of Spain's legendary Queen's Park Savannah to Barbados' Spring Garden Highway—elevating your experience requires strategy, style, and insider knowledge.

---

### 1. The Elite Breakfast Fete Protocol
The signature sunrise cooler fete is where the day begins before the heat hits its peak. 
* **Wardrobe**: High-performance linen, polarized obsidian shades, and breathable custom swimwear.
* **Fuel**: Coconut water with Angostura bitters for hydration, paired with hot doubles and fresh bake & shark.
* **Pacing**: Arrive at 4:00 AM sharp to catch the golden hour riddim transitions.

---

### 2. Catamaran & Yacht Excursions
The mid-week cooldown calls for floating sound systems along hidden coves. The energy shifts from high-BPM power soca to hypnotic afro-fusion and deep dubplates.

> *"When the steelpan resonates across the open water at sunset, you understand why Caribbean nightlife is unrivaled across the globe."*

---

### 3. Savage Nightlife Essentials
* **Footwear**: Pristine sneakers with orthotic insoles—your feet will log 25,000+ steps per fete.
* **Hydration**: Always carry an insulated flask with iced mineral water between rum cocktails.
* **Music**: Lock in to the Savage Gentlemen bottom audio player for the official 2026 road mix playlist.
    `.trim(),
  },
  {
    slug: "evolution-of-caribbean-streetwear",
    title: "Caribbean Nocturne: How Island Heritage is Reshaping Global Luxury Streetwear",
    summary: "How bold tropical color blocking, tactical vests, and heavy-thread mesh are taking over runway fashion in London, Brooklyn, and Paris.",
    category: "style",
    featuredImage: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&h=800&fit=crop",
    sourceName: "Savage Gentlemen Fashion",
    sourceUrl: "https://savgent.com",
    author: "Zalika Fontaine",
    tags: ["Streetwear", "Fashion", "Luxury", "Caribbean Drip", "Style"],
    readTime: "5 min read",
    isAiGenerated: true,
    isPublished: true,
    isFeatured: true,
    publishedAt: new Date(),
    content: `
# From Kingston Dancehalls to Paris Runways

The aesthetic language of the Caribbean diaspora has stepped into high fashion's most coveted spotlights. What started on the sound system lawns of Kingston and the mas camps of Belmont is now influencing luxury fashion houses worldwide.

---

### The Three Pillars of Island Nocturne Style
1. **The Heavyweight Statement Hoodie**: Oversized boxy cuts in obsidian blacks and volcanic ambers, embossed with subtle metallic crests.
2. **Tactical & Functional Silhouettes**: Multi-pocket cargo vests designed for hands-free fete survival—carrying passports, hydration, and communication.
3. **Gold Accents & Signet Rings**: Handcrafted heirloom jewelry that pays homage to ancestral resilience and Caribbean royalty.

Check out our latest **Savage Gentlemen Streetwear collection** in the Shop tab for exclusive drops manufactured on premium organic cotton.
    `.trim(),
  },
  {
    slug: "art-of-aged-caribbean-rum",
    title: "Liquid Gold: The Connoisseur’s Guide to Vintage Single-Estate Caribbean Rums",
    summary: "Discover the nuanced tasting profiles of Barbadian pot-still rums, Jamaican high-ester funk, and Martinique's Agricole terroir.",
    category: "cocktails",
    featuredImage: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=1200&h=800&fit=crop",
    sourceName: "Savage Barology",
    sourceUrl: "https://savgent.com",
    author: "Devon 'Rum Boss' Clarke",
    tags: ["Rum", "Cocktails", "Spirits", "Luxury Drinks", "Barology"],
    readTime: "3 min read",
    isAiGenerated: true,
    isPublished: true,
    isFeatured: false,
    publishedAt: new Date(),
    content: `
# The High Art of Aged Cane Spirits

Move past standard mixing rums into the sophisticated world of aged Caribbean single-estate distillations. The combination of tropical aging (where 1 year in the tropics equals 3 years in Scotland) and copper pot distillation creates profiles of unparalleled depth.

---

### The Tasting Map:
* **Barbados (Mount Gay & Foursquare)**: Balanced, vanilla oak, toasted coconut, and dark plum with a velvet finish.
* **Jamaica (Hampden & Worthy Park)**: High ester, wild banana, fermented tropical fruit, and bold smoky undertones.
* **Martinique & Guadeloupe (Rhum Agricole)**: Fresh pressed sugar cane juice, grassy florals, lime zest, and mineral dryness.

### The Savage Old Fashioned Recipe
1. 2.0 oz 12-Year Aged Barbadian Rum
2. 0.25 oz Raw Demerara Syrup
3. 3 dashes Angostura Aromatic Bitters
4. 1 dash Orange Bitters
5. Expressed Orange Peel over clear crystal ice block.
    `.trim(),
  },
  {
    slug: "afrobeats-soca-sound-revolution",
    title: "The Global Bridge: How Afrobeats and Soca Are Merging into a New Festival Sound",
    summary: "Top producers from Lagos, Port of Spain, and London are crafting hybrid rhythms that dominate clubs from Accra to Toronto.",
    category: "music",
    featuredImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=800&fit=crop",
    sourceName: "Rhythm & Riddim Review",
    sourceUrl: "https://savgent.com",
    author: "Marcus Sterling",
    tags: ["Music", "Afrobeats", "Soca", "DJ Culture", "Soundclash"],
    readTime: "4 min read",
    isAiGenerated: true,
    isPublished: true,
    isFeatured: false,
    publishedAt: new Date(),
    content: `
# The Sonic Pan-African Renaissance

From Burna Boy sampling classic calypso riffs to Machel Montano teaming up with Wizkid and Major Lazer, the sonic boundaries between West Africa and the Caribbean have completely dissolved.

---

### The New Riddim Formula
Producers are taking the infectious, syncopated 120-130 BPM cadence of Groovy Soca and layering it over the lush log-drum baselines of Amapiano and the hypnotic percussion of Afrobeats.

* **DJs to Watch**: DJ Private Ryan, Walshy Fire, Juls, and DJ Tunez.
* **Must-Listen Blends**: Tap the audio player below to experience the latest exclusive mixes curated by Savage Gentlemen.
    `.trim(),
  },
];

// Lightweight native XML/RSS item parser
function parseRssXml(xmlText: string, sourceName: string, defaultCategory: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemBlock = match[1];

    const titleMatch = itemBlock.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || itemBlock.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = itemBlock.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i) || itemBlock.match(/<link>([\s\S]*?)<\/link>/i);
    const descMatch = itemBlock.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) || itemBlock.match(/<description>([\s\S]*?)<\/description>/i);
    const contentMatch = itemBlock.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/i);
    const pubDateMatch = itemBlock.match(/<pubDate>(.*?)<\/pubDate>/i);

    // Extract image from media:content, enclosure, media:thumbnail or img tag in description/content
    const mediaMatch = itemBlock.match(/<media:content[^>]*url=["']([^"']+)["']/i) || 
                       itemBlock.match(/<enclosure[^>]*url=["']([^"']+)["']/i) ||
                       itemBlock.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i) ||
                       itemBlock.match(/<img[^>]+src=["']([^"']+)["']/i);

    const rawTitle = titleMatch ? titleMatch[1] : "";
    const title = cleanTitle(rawTitle);
    const link = linkMatch ? linkMatch[1].trim() : "";
    
    let rawDesc = descMatch ? descMatch[1] : (contentMatch ? contentMatch[1] : "");
    let description = cleanCaption(rawDesc);
    if (description.length > 300) description = description.substring(0, 297) + "...";

    let imageUrl = mediaMatch ? mediaMatch[1] : undefined;

    if (title && link) {
      items.push({
        title,
        link,
        description,
        pubDate: pubDateMatch ? pubDateMatch[1] : undefined,
        category: defaultCategory,
        imageUrl,
        sourceName,
      });
    }
  }

  return items;
}

function slugify(text: string): string {
  return cleanTitle(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

export class MagazineBot {
  private isRunning: boolean = false;
  private timer: NodeJS.Timeout | null = null;

  async start(intervalHours: number = 6) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[MagazineBot] Initializing Autonomous Caribbean Culture Magazine Engine...");

    // 1. Seed initial luxury articles if database is empty
    await this.seedInitialArticlesIfEmpty();

    // 2. Run initial background sync
    this.syncFeeds().catch(err => console.error("[MagazineBot] Initial sync error:", err));

    // 3. Schedule recurring cron worker
    const intervalMs = intervalHours * 60 * 60 * 1000;
    this.timer = setInterval(() => {
      this.syncFeeds().catch(err => console.error("[MagazineBot] Scheduled sync error:", err));
    }, intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log("[MagazineBot] Engine stopped.");
  }

  async seedInitialArticlesIfEmpty() {
    try {
      const existing = await storage.getAllArticles({ limit: 1 });
      if (existing.length === 0) {
        console.log("[MagazineBot] Seeding initial luxury Caribbean editorial articles...");
        for (const seed of SEED_ARTICLES) {
          await storage.createArticle({
            ...seed,
            title: cleanTitle(seed.title),
            summary: cleanCaption(seed.summary),
          });
        }
        console.log(`[MagazineBot] Successfully seeded ${SEED_ARTICLES.length} initial articles.`);
      }
    } catch (err) {
      console.error("[MagazineBot] Error seeding initial articles:", err);
    }
  }

  async syncFeeds(): Promise<{ createdCount: number; errors: string[] }> {
    const errors: string[] = [];
    let createdCount = 0;

    // Load existing articles to check for duplicates and prevent repetitive story floods
    const existingArticles = await storage.getAllArticles({ limit: 300 });
    const existingTitles: string[] = existingArticles.map(a => cleanTitle(a.title));
    const existingUrls = new Set(existingArticles.map(a => a.sourceUrl).filter(Boolean));

    for (const feed of CARIBBEAN_FEEDS) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(feed.url, {
          signal: controller.signal,
          headers: { "User-Agent": "SavageGentlemenBot/1.0 (Culture Aggregator)" },
        });
        clearTimeout(timeout);

        if (!res.ok) {
          errors.push(`Feed ${feed.name} returned status ${res.status}`);
          continue;
        }

        const xml = await res.text();
        const items = parseRssXml(xml, feed.name, feed.defaultCategory);
        let ingestedForThisFeed = 0;

        for (const item of items) {
          // Limit to max 1-2 articles per feed per sync to maintain high diversity
          if (ingestedForThisFeed >= 1) break;

          const cleanedTitle = cleanTitle(item.title);
          const slug = slugify(cleanedTitle);

          // 1. Check exact slug or URL
          if (existingUrls.has(item.link)) continue;
          const existingBySlug = await storage.getArticleBySlug(slug);
          if (existingBySlug) continue;

          // 2. Check duplicate / near-duplicate similarity
          if (isDuplicateStory(cleanedTitle, existingTitles)) {
            console.log(`[MagazineBot] ⏭️ Skipping duplicate/near-duplicate story: "${cleanedTitle}"`);
            continue;
          }

          // Generate rich formatted editorial content
          const category = feed.defaultCategory || "nightlife";
          const fallbackImages = [
            "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=800&fit=crop",
            "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&h=800&fit=crop",
            "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=800&fit=crop",
            "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=1200&h=800&fit=crop"
          ];
          const randomImage = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
          const cleanedSummary = cleanCaption(item.description) || "The latest high-energy Caribbean nightlife, sound, and culture dispatch from Savage Gentlemen.";

          const newArticle: InsertArticle = {
            slug,
            title: cleanedTitle,
            summary: cleanedSummary,
            content: `
# ${cleanedTitle}

*Published by ${item.sourceName} | Curated for Savage Gentlemen Caribbean Nocturne*

${cleanedSummary}

---

### Savage Gentlemen Cultural Analysis
In the ever-evolving world of Caribbean music and nightlife culture, stories like this demonstrate the unstoppable global momentum of island soundscapes and community celebrations. Whether you are prepping for the next carnival road march or enjoying a weekend cooler fete, staying tapped into the pulse is essential.

### Key Takeaways
* **Cultural Impact**: Expanding the reach of Caribbean heritage across global diaspora hubs.
* **Nightlife Connection**: Keep an eye out for upcoming DJ sets and mix drops featuring this sound.
* **Style Note**: Match the vibe with our luxury streetwear drop in the official Savage Gentlemen shop.

[Read original source at ${item.sourceName}](${item.link})
            `.trim(),
            category,
            featuredImage: item.imageUrl || randomImage,
            sourceUrl: item.link,
            sourceName: item.sourceName,
            author: "Savage Editorial Bot",
            tags: ["Caribbean", category.toUpperCase(), "Nightlife", "Savage Culture"],
            readTime: "3 min read",
            isAiGenerated: true,
            isPublished: true,
            isFeatured: false,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          };

          await storage.createArticle(newArticle);
          existingTitles.push(cleanedTitle);
          existingUrls.add(item.link);
          createdCount++;
          ingestedForThisFeed++;
        }
      } catch (err: any) {
        errors.push(`Error crawling ${feed.name}: ${err.message}`);
      }
    }

    console.log(`[MagazineBot] Sync complete. Ingested ${createdCount} new articles.`);
    return { createdCount, errors };
  }
}

export const magazineBot = new MagazineBot();
