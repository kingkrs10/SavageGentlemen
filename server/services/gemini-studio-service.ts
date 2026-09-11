import fetch from "node-fetch";

export interface ViralScriptResult {
  title: string;
  hook: string;
  script: string;
  brollKeywords: string[];
  visualStyle: string;
  caption: string;
  hashtags: string[];
}

export class GeminiStudioService {
  private apiKey: string;
  private model: string = "gemini-3.6-flash";

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "";
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Calls Google AI Studio Gemini 2.5 to generate high-retention viral Caribbean scripts
   */
  async generateViralCaribbeanScript(options: {
    topic: string;
    category?: string;
    summary?: string;
    style?: "2d_anime" | "cinematic_luxury" | "soundclash" | "carnival_fete";
    targetDurationSeconds?: number;
  }): Promise<ViralScriptResult> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in environment");
    }

    const style = options.style || "2d_anime";
    const category = options.category || "culture";
    const siteUrl = process.env.SITE_URL || "https://savagegentlemen.onrender.com";

    const systemPrompt = `You are the lead creative director and viral scriptwriter for "Savage Gentlemen", the premier modern Caribbean luxury lifestyle, streetwear, and sound system culture platform.
Website: ${siteUrl}

Your job is to generate a high-converting, 15-second viral video reel package for Instagram Reels, YouTube Shorts, and TikTok.

STYLE GUIDELINES:
- Visual Style: ${style === "2d_anime" ? "2D Anime / Cartoon Motion Graphics / Neon Island Aesthetics" : "High-Cinematic 4K Luxury / Soundclash Stage Lights"}
- Voice: Unapologetically Caribbean, confident, luxury, high-energy, cultural authority (mix of Caribbean rhythm and global luxury streetwear tone).
- Duration: Exactly 35 to 45 spoken words (15 seconds total).
- 3-Second Hook: Impossible to scroll past.
- Retention Beats: Fast, punchy imagery and cultural references (fetes, sound systems, heavyweight streetwear, Carnival 2026).
- Clear CTA: Directs viewers to ${siteUrl}/shop or ${siteUrl}/magazine.

OUTPUT FORMAT: Return STRICT JSON ONLY (no markdown fences, no extra text) matching this schema:
{
  "title": "Short punchy video title (under 60 chars)",
  "hook": "The opening 3-second spoken sentence",
  "script": "The complete 15-second spoken voiceover script (35-45 words)",
  "brollKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "visualStyle": "${style}",
  "caption": "Full viral caption formatted with emojis, summary, and call to action",
  "hashtags": ["#SavageGentlemen", "#SavGent", "#SGGang", "#SocaPassport", "#CaribbeanCulture", "#Carnival2026", "#ReelsViral", "#FYP"]
}`;

    const userPrompt = `Generate a viral video reel package for:
Topic: "${options.topic}"
Category: "${category}"
Summary Context: "${options.summary || options.topic}"
Style Preset: "${style}"`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          topP: 0.95,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google AI Studio Error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error("Empty response received from Google AI Studio Gemini API");
    }

    try {
      const parsed: ViralScriptResult = JSON.parse(candidateText);
      return parsed;
    } catch (parseErr) {
      const cleaned = candidateText.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
      return JSON.parse(cleaned);
    }
  }
}

export const geminiStudioService = new GeminiStudioService();
