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
  private accessToken: string | undefined;
  private accountId: string | undefined;

  constructor() {
    this.accessToken = 
      process.env.INSTAGRAM_ACCESS_TOKEN || 
      process.env.META_IG_ACCESS_TOKEN || 
      process.env.META_ACCESS_TOKEN || 
      process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    this.accountId = 
      process.env.INSTAGRAM_ACCOUNT_ID || 
      process.env.META_IG_USER_ID || 
      process.env.META_ACCOUNT_ID || 
      process.env.INSTAGRAM_USER_ID;
  }

  generateCaption(article: Article): string {
    const title = cleanTitle(article.title);
    const summary = cleanCaption(article.summary);

    return `NEW DISPATCH: ${title.toUpperCase()}\n\n` +
      `${summary}\n\n` +
      `Read the full editorial & listen to the curated soundtrack at savgent.com/magazine/${article.slug}\n\n` +
      `Savage Gentlemen | The Pulse of Caribbean Lifestyle & Culture`;
  }

  async publishArticlePost(articleId: number, options?: { videoUrl?: string; engine?: string }): Promise<InstagramPostResult> {
    const article = await storage.getArticleById(articleId);
    if (!article) {
      return { success: false, simulated: false, caption: "", error: "Article not found" };
    }

    const caption = this.generateCaption(article);
    const imageUrl = article.featuredImage || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1080&h=1080&fit=crop";
    const mediaUrl = options?.videoUrl || imageUrl;

    // If Make.com / Social Webhook is configured, dispatch live via Webhook
    const socialWebhookUrl = process.env.MAKE_WEBHOOK_URL || process.env.SOCIAL_WEBHOOK_URL;
    if (socialWebhookUrl) {
      try {
        console.log(`[InstagramBot] Publishing article "${article.title}" via Social Webhook (${options?.videoUrl ? "Video Reel" : "Image"})...`);
        const webhookRes = await fetch(socialWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl: mediaUrl.startsWith("http") ? mediaUrl : `https://savagegentlemen.com${mediaUrl}`,
            imageUrl: imageUrl,
            caption,
            title: article.title,
            platforms: ["instagram", "facebook", "youtube", "tiktok"],
            productLink: `https://savagegentlemen.com/magazine/${article.slug}`,
            engine: options?.engine || "standard",
            timestamp: new Date().toISOString()
          }),
        });

        if (webhookRes.ok) {
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
        }
      } catch (err: any) {
        console.error("[InstagramBot] Webhook dispatch error:", err.message);
      }
    }

    // If Meta Graph API credentials are configured, execute real publish
    if (this.accessToken && this.accountId) {
      try {
        console.log(`[InstagramBot] Publishing article "${article.title}" to Instagram...`);
        
        // Step 1: Create media container
        const containerUrl = `https://graph.facebook.com/v19.0/${this.accountId}/media`;
        const containerRes = await fetch(containerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: imageUrl,
            caption: caption,
            access_token: this.accessToken,
          }),
        });

        const containerData = await containerRes.json();
        if (!containerRes.ok || !containerData.id) {
          throw new Error(containerData.error?.message || "Failed to create Instagram container");
        }

        const creationId = containerData.id;

        // Step 2: Publish media container
        const publishUrl = `https://graph.facebook.com/v19.0/${this.accountId}/media_publish`;
        const publishRes = await fetch(publishUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: this.accessToken,
          }),
        });

        const publishData = await publishRes.json();
        if (!publishRes.ok || !publishData.id) {
          throw new Error(publishData.error?.message || "Failed to publish media to Instagram");
        }

        // Mark article as posted
        await storage.updateArticle(articleId, {
          igPosted: true,
          igPostId: publishData.id,
        });

        console.log(`[InstagramBot] Successfully published post ID: ${publishData.id}`);
        return {
          success: true,
          postId: publishData.id,
          simulated: false,
          caption,
          imageUrl,
        };
      } catch (error: any) {
        console.error("[InstagramBot] Error publishing to Instagram API:", error);
        return {
          success: false,
          simulated: false,
          caption,
          imageUrl,
          error: error.message,
        };
      }
    }

    // Dry-run / Sandbox mode when API keys aren't set yet
    console.log(`[InstagramBot] Simulated Instagram Post generated for "${article.title}" (Meta API credentials not set in .env)`);
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
