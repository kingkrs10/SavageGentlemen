import { Article } from "@shared/schema";
import { storage } from "../storage";
import { cleanTitle, cleanCaption } from "@shared/text-sanitizer";

export interface InstagramPostResult {
  success: boolean;
  postId?: string;
  permalink?: string;
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

  /**
   * Polls the Meta Graph API container status until FINISHED or error.
   * This is required because Meta processes media asynchronously.
   */
  async waitForMediaContainer(
    accountId: string,
    creationId: string,
    accessToken: string,
    maxWaitMs: number = 30000,
    intervalMs: number = 2000
  ): Promise<{ ready: boolean; error?: string }> {
    const startTime = Date.now();
    console.log(`[InstagramBot] Waiting for media container ${creationId} processing...`);

    while (Date.now() - startTime < maxWaitMs) {
      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${creationId}?fields=status_code,status&access_token=${accessToken}`
        );
        const data: any = await res.json();
        const statusCode = data.status_code;
        console.log(`[InstagramBot] Container ${creationId} status: ${statusCode || "UNKNOWN"}`);

        if (statusCode === "FINISHED") {
          return { ready: true };
        }
        if (statusCode === "ERROR" || statusCode === "EXPIRED") {
          return {
            ready: false,
            error: data.status || data.error?.message || `Container processing error: ${statusCode}`,
          };
        }
      } catch (err: any) {
        console.warn(`[InstagramBot] Container status check warning: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    return { ready: false, error: "Timed out waiting for Instagram media container to finish processing" };
  }

  /**
   * Direct Meta Graph API publishing for images and Reels.
   */
  async publishDirectToMeta(
    accountId: string,
    accessToken: string,
    mediaUrl: string,
    caption: string,
    isVideo: boolean = false
  ): Promise<{ success: boolean; postId?: string; permalink?: string; error?: string }> {
    try {
      // Step 1: Create media container
      const containerUrl = `https://graph.facebook.com/v19.0/${accountId}/media`;
      const containerBody: any = {
        caption: caption,
        access_token: accessToken,
      };

      if (isVideo) {
        containerBody.media_type = "REELS";
        containerBody.video_url = mediaUrl;
      } else {
        containerBody.image_url = mediaUrl;
      }

      console.log(`[InstagramBot] Creating ${isVideo ? "REELS" : "IMAGE"} container on Instagram account ${accountId}...`);
      let containerRes = await fetch(containerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(containerBody),
      });

      let containerData: any = await containerRes.json();

      // Fallback for image errors (e.g. hotlink-protected remote RSS images)
      if ((!containerRes.ok || !containerData.id) && !isVideo) {
        const fallbackImage = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1080&h=1080&fit=crop";
        console.warn(`[InstagramBot] Initial image container creation failed (${containerData.error?.message}). Retrying with high-res brand fallback image...`);
        containerBody.image_url = fallbackImage;
        containerRes = await fetch(containerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(containerBody),
        });
        containerData = await containerRes.json();
      }

      if (!containerRes.ok || !containerData.id) {
        return {
          success: false,
          error: containerData.error?.message || `Failed to create Instagram media container (HTTP ${containerRes.status})`,
        };
      }

      const creationId = containerData.id;

      // Step 2: Poll container until FINISHED
      const pollResult = await this.waitForMediaContainer(
        accountId,
        creationId,
        accessToken,
        isVideo ? 60000 : 30000,
        2000
      );

      if (!pollResult.ready) {
        return {
          success: false,
          error: pollResult.error || "Media container was not ready for publishing",
        };
      }

      // Step 3: Publish media container
      console.log(`[InstagramBot] Publishing container ${creationId} to Instagram feed...`);
      const publishUrl = `https://graph.facebook.com/v19.0/${accountId}/media_publish`;
      const publishRes = await fetch(publishUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: accessToken,
        }),
      });

      const publishData: any = await publishRes.json();
      if (!publishRes.ok || !publishData.id) {
        return {
          success: false,
          error: publishData.error?.message || `Failed to publish media to Instagram (HTTP ${publishRes.status})`,
        };
      }

      const publishedPostId = publishData.id;

      // Step 4: Fetch verified live permalink
      let permalink = `https://www.instagram.com/savagegentlemen_`;
      try {
        const permalinkRes = await fetch(
          `https://graph.facebook.com/v19.0/${publishedPostId}?fields=permalink,shortcode&access_token=${accessToken}`
        );
        const permalinkData: any = await permalinkRes.json();
        if (permalinkData.permalink) {
          permalink = permalinkData.permalink;
        }
      } catch (permErr: any) {
        console.warn(`[InstagramBot] Note: could not fetch permalink for ${publishedPostId}: ${permErr.message}`);
      }

      console.log(`[InstagramBot] ✅ Successfully published live Instagram post: ${publishedPostId} (${permalink})`);
      return {
        success: true,
        postId: publishedPostId,
        permalink,
      };
    } catch (err: any) {
      console.error("[InstagramBot] Exception in publishDirectToMeta:", err.message);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Broadcasts to external multi-platform webhooks (Make.com, etc.) in the background.
   */
  async broadcastToWebhooks(webhookUrls: string[], payload: any): Promise<void> {
    if (!webhookUrls || webhookUrls.length === 0) return;
    console.log(`[InstagramBot] Secondary broadcast: Dispatching to ${webhookUrls.length} webhook(s)...`);
    await Promise.allSettled(
      webhookUrls.map(async (url) => {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          console.log(`[InstagramBot] Secondary webhook ${url} status: ${res.status}`);
        } catch (err: any) {
          console.warn(`[InstagramBot] Secondary webhook ${url} note: ${err.message}`);
        }
      })
    );
  }

  async publishArticlePost(articleId: number, options?: { videoUrl?: string; engine?: string; forceSimulate?: boolean }): Promise<InstagramPostResult> {
    const article = await storage.getArticleById(articleId);
    if (!article) {
      return { success: false, simulated: false, caption: "", error: "Article not found" };
    }

    const caption = this.generateCaption(article);
    const siteUrl = process.env.SITE_URL || "https://www.savgent.com";
    
    // Resolve clean public image URL
    let imageUrl = article.featuredImage || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1080&h=1080&fit=crop";
    if (imageUrl.startsWith("/")) {
      imageUrl = `${siteUrl}${imageUrl}`;
    }

    const isVideo = Boolean(options?.videoUrl);
    let mediaUrl = imageUrl;
    if (isVideo && options?.videoUrl) {
      const { uploadLocalVideoToPublicCDN } = await import("../services/social-publisher");
      mediaUrl = await uploadLocalVideoToPublicCDN(options.videoUrl);
    }

    const [dbTokenRow, dbAccountRow, dbWebhookRow] = await Promise.all([
      storage.getSiteSetting("instagram_access_token").catch(() => undefined),
      storage.getSiteSetting("instagram_account_id").catch(() => undefined),
      storage.getSiteSetting("instagram_webhook_url").catch(() => undefined),
    ]);

    const accessToken = dbTokenRow?.value || this.getAccessToken();
    const accountId = dbAccountRow?.value || this.getAccountId() || "17841464129958917";
    const configuredWebhooks = this.getConfiguredWebhooks(dbWebhookRow?.value);
    const dispatchErrors: string[] = [];

    // =========================================================================
    // CHANNEL 1 (PRIMARY): Direct Meta Graph API Posting to @savagegentlemen_
    // =========================================================================
    if (accessToken && accountId && !options?.forceSimulate) {
      console.log(`[InstagramBot] 🚀 Primary Channel: Initiating Direct Meta Graph API post for "${article.title}"...`);
      const directResult = await this.publishDirectToMeta(
        accountId,
        accessToken,
        mediaUrl,
        caption,
        isVideo
      );

      if (directResult.success && directResult.postId) {
        // Save verified live post permalink to database
        const savedReference = directResult.permalink || directResult.postId;
        await storage.updateArticle(articleId, {
          igPosted: true,
          igPostId: savedReference,
        });

        // Non-blocking secondary broadcast to Make.com for Facebook / YouTube / TikTok
        if (configuredWebhooks.length > 0) {
          const webhookPayload = {
            videoUrl: isVideo ? mediaUrl : undefined,
            imageUrl: !isVideo ? imageUrl : undefined,
            caption,
            title: article.title,
            platforms: ["facebook", "youtube", "tiktok"],
            productLink: `${siteUrl}/magazine/${article.slug}`,
            engine: options?.engine || "standard",
            instagramPostId: directResult.postId,
            instagramPermalink: directResult.permalink,
            timestamp: new Date().toISOString(),
          };
          this.broadcastToWebhooks(configuredWebhooks, webhookPayload).catch((e) =>
            console.warn(`[InstagramBot] Background webhook broadcast note: ${e.message}`)
          );
        }

        return {
          success: true,
          postId: directResult.postId,
          permalink: directResult.permalink,
          simulated: false,
          caption,
          imageUrl: isVideo ? mediaUrl : imageUrl,
        };
      } else {
        const directErrMsg = directResult.error || "Meta Graph API publishing failed";
        console.error(`[InstagramBot] ❌ Direct Meta Graph API failed: ${directErrMsg}`);
        dispatchErrors.push(`Direct Meta Graph: ${directErrMsg}`);
      }
    }

    // =========================================================================
    // CHANNEL 2 (FALLBACK): Multi-platform Webhook Broadcast (Make.com)
    // =========================================================================
    if (configuredWebhooks.length > 0 && !options?.forceSimulate) {
      console.log(`[InstagramBot] ⚠️ Attempting Fallback Channel: Multi-platform Webhook Broadcast...`);
      try {
        const payload = {
          videoUrl: isVideo ? mediaUrl : undefined,
          imageUrl: !isVideo ? imageUrl : undefined,
          caption,
          title: article.title,
          platforms: ["instagram", "facebook", "youtube", "tiktok"],
          productLink: `${siteUrl}/magazine/${article.slug}`,
          engine: options?.engine || "standard",
          timestamp: new Date().toISOString(),
        };

        const webhookResults = await Promise.all(
          configuredWebhooks.map(async (webhookUrl) => {
            try {
              const res = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              const text = await res.text().catch(() => "");
              if (res.ok) {
                return { success: true, url: webhookUrl };
              } else {
                return { success: false, url: webhookUrl, error: `HTTP ${res.status}: ${text}` };
              }
            } catch (err: any) {
              return { success: false, url: webhookUrl, error: err.message };
            }
          })
        );

        const anySucceeded = webhookResults.some((r) => r.success);
        if (anySucceeded) {
          const fakePostId = `webhook_${Date.now()}`;
          await storage.updateArticle(articleId, {
            igPosted: true,
            igPostId: fakePostId,
          });

          return {
            success: true,
            postId: fakePostId,
            simulated: false,
            caption,
            imageUrl: isVideo ? mediaUrl : imageUrl,
          };
        } else {
          webhookResults
            .filter((r) => !r.success)
            .forEach((r) => dispatchErrors.push(`Webhook (${r.url}): ${r.error}`));
        }
      } catch (webhookErr: any) {
        dispatchErrors.push(`Webhook dispatch error: ${webhookErr.message}`);
      }
    }

    // If real credentials or webhooks existed but failed, DO NOT mark article as posted!
    if ((configuredWebhooks.length > 0 || (accessToken && accountId)) && !options?.forceSimulate) {
      const consolidatedError = dispatchErrors.join("; ") || "All publishing channels failed.";
      console.error(`[InstagramBot] ❌ Publishing failed for article ${articleId}: ${consolidatedError}`);
      return {
        success: false,
        simulated: false,
        caption,
        imageUrl: isVideo ? mediaUrl : imageUrl,
        error: consolidatedError,
      };
    }

    // =========================================================================
    // CHANNEL 3: Sandbox Simulation Mode (when no real credentials exist)
    // =========================================================================
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
      imageUrl: isVideo ? mediaUrl : imageUrl,
    };
  }
}

export const instagramBot = new InstagramBot();
