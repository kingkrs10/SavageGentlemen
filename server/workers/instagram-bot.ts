import { Article } from "@shared/schema";
import { storage } from "../storage";
import { cleanTitle, cleanCaption } from "@shared/text-sanitizer";

export interface InstagramPostResult {
  success: boolean;
  postId?: string;
  simulated: boolean;
  caption: string;
  imageUrl?: string;
  error?: string;
}

export class InstagramBot {
  getAccessToken(): string | undefined {
    return (
      process.env.INSTAGRAM_ACCESS_TOKEN || 
      process.env.META_IG_ACCESS_TOKEN || 
      process.env.META_ACCESS_TOKEN || 
      process.env.FACEBOOK_PAGE_ACCESS_TOKEN
    );
  }

  getAccountId(): string | undefined {
    return (
      process.env.INSTAGRAM_ACCOUNT_ID || 
      process.env.META_IG_USER_ID || 
      process.env.META_ACCOUNT_ID || 
      process.env.INSTAGRAM_USER_ID
    );
  }

  getConfiguredWebhooks(extraWebhook?: string): string[] {
    const verifiedWorkingWebhook = "https://hook.us1.make.com/2txuakwgj4ajmd44l5lkip449r80ljfp";
    const candidates = [
      extraWebhook,
      process.env.INSTAGRAM_WEBHOOK_URL,
      process.env.MAKE_WEBHOOK_URL,
      process.env.SOCIAL_WEBHOOK_URL,
      process.env.MAKE_WEBHOOK_FALLBACK_URL,
      verifiedWorkingWebhook,
    ].filter(Boolean) as string[];

    // Exclude known broken / full queue webhooks
    const brokenWebhooks = [
      "https://hook.us1.make.com/2hhgb12q1xgjw7cm1f6uffpnflwm4mcp"
    ];

    const active = candidates.filter(url => !brokenWebhooks.includes(url));
    if (!active.includes(verifiedWorkingWebhook)) {
      active.push(verifiedWorkingWebhook);
    }

    return Array.from(new Set(active));
  }

  generateCaption(article: Article): string {
    const title = cleanTitle(article.title)
      .replace(/&#\d+;/g, "")
      .replace(/["'“”‘’]/g, "");
    let summary = cleanCaption(article.summary)
      .replace(/&#\d+;/g, "")
      .replace(/https?:\/\/\S+/gi, "")
      .replace(/#\w+/g, "")
      .replace(/Match the vibe with our luxury streetwear.*$/i, "")
      .replace(/Shop the collection.*$/i, "")
      .trim();

    const category = (article.category || "culture").toLowerCase();
    
    // Category-specific hashtags
    const categoryTagsMap: Record<string, string[]> = {
      music: ["#SocaMusic", "#Dancehall", "#SoundSystem", "#Afrobeats", "#CaribbeanMusic", "#DJCulture", "#ReggaeVibes"],
      nightlife: ["#CaribbeanNightlife", "#FeteLife", "#CarnivalVibes", "#VIPExperience", "#BottleService", "#NightclubLife"],
      culture: ["#CaribbeanCulture", "#Carnival2026", "#TriniCarnival", "#Masquerade", "#WestIndian", "#IslandVibes"],
      style: ["#CaribbeanStyle", "#LuxuryStreetwear", "#StreetwearFashion", "#Drip", "#UrbanLuxury", "#OOTD"],
      cocktails: ["#RumCulture", "#CaribbeanRum", "#CraftCocktails", "#IslandEats", "#Mixology", "#BarLife"],
    };

    const categoryTags = categoryTagsMap[category] || ["#CaribbeanCulture", "#IslandVibes", "#Carnival2026"];
    const brandTags = ["#SavageGentlemen", "#SavGent", "#SGGang", "#SocaPassport", "#CaribbeanExcellence"];
    const viralTags = ["#ReelsViral", "#ExplorePage", "#FYP", "#TrendingNow", "#CultureMovement"];

    const allHashtags = Array.from(new Set([...brandTags, ...categoryTags, ...viralTags])).join(" ");

    const siteUrl = process.env.SITE_URL || "https://www.savgent.com";

    return `🔥 NEW DISPATCH: ${title.toUpperCase()}\n\n` +
      `🌴 ${summary}\n\n` +
      `📖 Read the full story: Tap link in bio or visit ${siteUrl}/magazine/${article.slug}\n\n` +
      `—\n` +
      `Savage Gentlemen | The Pulse of Caribbean Lifestyle & Culture ⚡\n\n` +
      `${allHashtags}`;
  }

  async publishArticlePost(articleId: number, options?: { videoUrl?: string; engine?: string; forceSimulate?: boolean }): Promise<InstagramPostResult> {
    const article = await storage.getArticleById(articleId);
    if (!article) {
      return { success: false, simulated: false, caption: "", error: "Article not found" };
    }

    const caption = this.generateCaption(article);
    const imageUrl = article.featuredImage || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1080&h=1080&fit=crop";
    const mediaUrl = options?.videoUrl || imageUrl;
    const siteUrl = process.env.SITE_URL || "https://www.savgent.com";

    const [dbTokenRow, dbAccountRow, dbWebhookRow] = await Promise.all([
      storage.getSiteSetting("instagram_access_token").catch(() => undefined),
      storage.getSiteSetting("instagram_account_id").catch(() => undefined),
      storage.getSiteSetting("instagram_webhook_url").catch(() => undefined),
    ]);

    const configuredWebhooks = this.getConfiguredWebhooks(dbWebhookRow?.value);
    const accessToken = dbTokenRow?.value || this.getAccessToken();
    const accountId = dbAccountRow?.value || this.getAccountId();
    const dispatchErrors: string[] = [];

    // Channel 1: Broadcast across all configured social webhooks (Make.com / Universal)
    if (configuredWebhooks.length > 0 && !options?.forceSimulate) {
      try {
        console.log(`[InstagramBot] Publishing article "${article.title}" via ${configuredWebhooks.length} Webhook(s) (${options?.videoUrl ? "Video Reel" : "Image"})...`);
        const { uploadLocalVideoToPublicCDN } = await import("../services/social-publisher");
        const publicVideoUrl = await uploadLocalVideoToPublicCDN(mediaUrl);

        const payload = {
          videoUrl: publicVideoUrl,
          imageUrl: imageUrl,
          caption,
          title: article.title,
          platforms: ["instagram", "facebook", "youtube", "tiktok"],
          productLink: `${siteUrl}/magazine/${article.slug}`,
          engine: options?.engine || "standard",
          timestamp: new Date().toISOString()
        };

        const results = await Promise.all(
          configuredWebhooks.map(async (webhookUrl) => {
            try {
              const webhookRes = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              const responseText = await webhookRes.text().catch(() => "");
              if (webhookRes.ok) {
                console.log(`[InstagramBot] ✅ Webhook ${webhookUrl} response: ${webhookRes.status} ${webhookRes.statusText}`);
                return { success: true, url: webhookUrl };
              } else {
                console.error(`[InstagramBot] ⚠️ Webhook ${webhookUrl} returned error (${webhookRes.status}): ${responseText}`);
                return { success: false, url: webhookUrl, error: `HTTP ${webhookRes.status}: ${responseText}` };
              }
            } catch (err: any) {
              console.error(`[InstagramBot] Failed to send to ${webhookUrl}:`, err.message);
              return { success: false, url: webhookUrl, error: err.message };
            }
          })
        );

        const anyWebhookSucceeded = results.some(r => r.success);
        results.filter(r => !r.success).forEach(r => dispatchErrors.push(`Webhook (${r.url}): ${r.error}`));

        if (anyWebhookSucceeded) {
          const postId = `webhook_${Date.now()}`;
          await storage.updateArticle(articleId, {
            igPosted: true,
            igPostId: postId,
          });

          return {
            success: true,
            postId,
            simulated: false,
            caption,
            imageUrl
          };
        } else {
          console.warn(`[InstagramBot] All configured webhooks failed. Attempting fallback to direct Meta Graph API...`);
        }
      } catch (err: any) {
        console.error("[InstagramBot] Webhook dispatch exception:", err.message);
        dispatchErrors.push(`Webhook exception: ${err.message}`);
      }
    }

    // Channel 2: Direct Meta Graph API (Fallback if webhooks fail or aren't set)
    if (accessToken && accountId && !options?.forceSimulate) {
      try {
        console.log(`[InstagramBot] Attempting direct Meta Graph API publishing for "${article.title}"...`);
        
        // Step 1: Create media container
        const containerUrl = `https://graph.facebook.com/v19.0/${accountId}/media`;
        const containerRes = await fetch(containerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: imageUrl,
            caption: caption,
            access_token: accessToken,
          }),
        });

        const containerData = await containerRes.json();
        if (!containerRes.ok || !containerData.id) {
          throw new Error(containerData.error?.message || `Failed to create Instagram media container (HTTP ${containerRes.status})`);
        }

        const creationId = containerData.id;

        // Step 2: Publish media container
        const publishUrl = `https://graph.facebook.com/v19.0/${accountId}/media_publish`;
        const publishRes = await fetch(publishUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: accessToken,
          }),
        });

        const publishData = await publishRes.json();
        if (!publishRes.ok || !publishData.id) {
          throw new Error(publishData.error?.message || `Failed to publish media to Instagram (HTTP ${publishRes.status})`);
        }

        // Mark article as posted
        await storage.updateArticle(articleId, {
          igPosted: true,
          igPostId: publishData.id,
        });

        console.log(`[InstagramBot] Successfully published post ID via Meta API: ${publishData.id}`);
        return {
          success: true,
          postId: publishData.id,
          simulated: false,
          caption,
          imageUrl,
        };
      } catch (error: any) {
        console.error("[InstagramBot] Error publishing to Meta Graph API:", error.message);
        dispatchErrors.push(`Meta Graph API: ${error.message}`);
      }
    }

    // If real channels were configured but failed, report failure and DO NOT mark article as posted!
    if ((configuredWebhooks.length > 0 || (accessToken && accountId)) && !options?.forceSimulate) {
      const consolidatedError = dispatchErrors.join("; ") || "All publishing channels failed.";
      console.error(`[InstagramBot] ❌ Publishing failed for article ${articleId}: ${consolidatedError}`);
      return {
        success: false,
        simulated: false,
        caption,
        imageUrl,
        error: consolidatedError
      };
    }

    // Channel 3: Dry-run / Sandbox mode when NO credentials or webhooks are configured at all, or forced simulation
    console.log(`[InstagramBot] Simulated Instagram Post generated for "${article.title}" (Sandbox mode)`);
    await storage.updateArticle(articleId, {
      igPosted: true,
      igPostId: `simulated_ig_${Date.now()}`,
    });

    return {
      success: true,
      postId: `simulated_${Date.now()}`,
      simulated: true,
      caption,
      imageUrl,
    };
  }
}

export const instagramBot = new InstagramBot();
