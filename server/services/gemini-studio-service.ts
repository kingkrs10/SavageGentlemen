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
  private model: string = "gemini-3.8-flash";

  private getApiKey(): string {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || this.apiKey || "";
  }

  /** FreeLLMAPI sidecar URL (port 3001 by default) */
  private getFreeLLMApiUrl(): string {
    return process.env.FREELLMAPI_URL || "";
  }

  private getFreeLLMApiKey(): string {
    return process.env.FREELLMAPI_API_KEY || "";
  }

  isAvailable(): boolean {
    return !!this.getApiKey() || !!this.getFreeLLMApiUrl();
  }

  /**
   * Build the shared system + user prompt pair used by both direct Gemini and FreeLLMAPI paths
   */
  private buildPrompts(options: {
    topic: string;
    category?: string;
    summary?: string;
    style?: "2d_anime" | "cinematic_luxury" | "soundclash" | "carnival_fete";
  }): { systemPrompt: string; userPrompt: string } {
    const style = options.style || "2d_anime";
    const category = options.category || "soca";
    const siteUrl = process.env.SITE_URL || "https://www.savgent.com";

    const systemPrompt = `You are the lead creative director and viral scriptwriter for "Savage Gentlemen", the premier modern Caribbean luxury lifestyle, streetwear, and sound system culture platform.
Website: ${siteUrl}

Your job is to generate a high-converting, 15-second viral video reel package for Instagram Reels, YouTube Shorts, and TikTok focused on Soca, Caribbean Carnivals, and Island Culture.

REGIONAL CARNIVAL & SOCA SCOPE:
- Cover all major Caribbean Carnivals & Soca seasons: Trinidad Carnival, Barbados Crop Over, St. Lucia Carnival (Dennery Segment / Lucian Soca), Grenada Spicemas (Jab Jab), St. Vincent Vincy Mas, Antigua Carnival, Jamaica Carnival, Toronto Caribana, Miami Carnival, Notting Hill Carnival, and Bahamas Junkanoo.
- Incorporate genuine Soca subgenres: Groovy Soca, Power Soca, J'ouvert, Ragga Soca, Bouyon, Chutney Soca, and Steelband/Pan.

STYLE & NATURAL VOICEOVER GUIDELINES:
- Visual Style: ${style === "2d_anime" ? "2D Anime / Cartoon Motion Graphics / Neon Island Aesthetics" : "High-Cinematic 4K Luxury / Soundclash Stage Lights"}
- Voice Persona: Charismatic, confident Caribbean cultural insider. Unapologetic luxury, warm, high-energy, authoritative.
- NATURAL HUMAN DELIVERY (CRITICAL - NO ROBOTIC SYNTAX):
  * Write strictly for the EAR, never for the eye. It must sound like a real person talking directly to you with natural enthusiasm.
  * Breath & Rhythm Punctuation: Use commas (,) and em-dashes (—) deliberately so the neural voice model takes natural, human-like breaths and pauses.
  * Spoken Contractions: ALWAYS use natural contractions ("it's", "you're", "don't", "there's", "we've", "can't"). Never use stiff robotic phrasing like "it is" or "do not".
  * Punchy Cadence: Keep clauses short (5-8 words per phrase). Give it a natural island cadence and bounce.
  * No AI/Robotic Clichés: Never say "In this video", "Welcome back", "Furthermore", "As we delve into", or spell out links/symbols.
- Duration & Word Count: Exactly 35 to 45 spoken words (15 seconds total). Unhurried, effortless, conversational pacing.
- 3-Second Spoken Hook: An irresistible opening spoken line that instantly halts scrolling.
- Clear CTA: Natural invitation to tap the link in bio or visit ${siteUrl}.

OUTPUT FORMAT: Return STRICT JSON ONLY (no markdown fences, no extra text) matching this schema:
{
  "title": "Short punchy video title (under 60 chars)",
  "hook": "The opening 3-second spoken sentence",
  "script": "The complete 15-second natural spoken voiceover script with breath punctuation (35-45 words)",
  "brollKeywords": ["relevant Caribbean carnival broll keyword1", "soca keyword2", "keyword3", "keyword4", "keyword5"],
  "visualStyle": "${style}",
  "caption": "Full viral caption formatted with emojis, summary, and call to action pointing to ${siteUrl}",
  "hashtags": ["#SavageGentlemen", "#SavGent", "#SGGang", "#SocaMusic", "#Soca2026", "#Carnival2026", "#CropOver", "#Spicemas", "#LucianCarnival", "#VincyMas", "#ReelsViral", "#FYP"]
}`;

    const userPrompt = `Generate a viral Soca video reel package for:
Topic: "${options.topic}"
Category: "${category}"
Summary Context: "${options.summary || options.topic}"
Style Preset: "${style}"`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Fallback: call FreeLLMAPI's OpenAI-compatible /v1/chat/completions endpoint.
   * FreeLLMAPI routes across 34+ free providers with automatic failover.
   */
  private async callViaFreeLLMAPI(systemPrompt: string, userPrompt: string): Promise<ViralScriptResult> {
    const baseUrl = this.getFreeLLMApiUrl();
    const apiKey = this.getFreeLLMApiKey();
    if (!baseUrl) {
      throw new Error("FREELLMAPI_URL is not configured — cannot failover");
    }

    const url = `${baseUrl}/v1/chat/completions`;
    console.log("[GeminiStudio] Failing over to FreeLLMAPI at", baseUrl);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: "auto",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        top_p: 0.95,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`FreeLLMAPI Error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from FreeLLMAPI");
    }

    try {
      return JSON.parse(content) as ViralScriptResult;
    } catch {
      const cleaned = content.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
      return JSON.parse(cleaned) as ViralScriptResult;
    }
  }

  /**
   * Calls Google AI Studio Gemini to generate high-retention viral Caribbean scripts.
   * Falls back to FreeLLMAPI on 429/5xx errors for automatic multi-provider failover.
   */
  async generateViralCaribbeanScript(options: {
    topic: string;
    category?: string;
    summary?: string;
    style?: "2d_anime" | "cinematic_luxury" | "soundclash" | "carnival_fete";
    targetDurationSeconds?: number;
  }): Promise<ViralScriptResult> {
    const apiKey = this.getApiKey();
    const { systemPrompt, userPrompt } = this.buildPrompts(options);

    // --- Primary path: direct Gemini API ---
    if (apiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`;

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
          const status = response.status;
          // Failover on rate-limit or server errors
          if (status === 429 || status >= 500) {
            console.warn(`[GeminiStudio] Gemini API returned ${status}, attempting FreeLLMAPI failover...`);
            return await this.callViaFreeLLMAPI(systemPrompt, userPrompt);
          }
          throw new Error(`Google AI Studio Error (${status}): ${errText}`);
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
      } catch (err: any) {
        // Network errors or unexpected failures → try FreeLLMAPI
        if (this.getFreeLLMApiUrl()) {
          console.warn(`[GeminiStudio] Gemini direct failed: ${err.message}. Trying FreeLLMAPI...`);
          return await this.callViaFreeLLMAPI(systemPrompt, userPrompt);
        }
        throw err;
      }
    }

    // --- No Gemini key: use FreeLLMAPI as primary ---
    if (this.getFreeLLMApiUrl()) {
      return await this.callViaFreeLLMAPI(systemPrompt, userPrompt);
    }

    throw new Error("No LLM provider configured: set GEMINI_API_KEY or FREELLMAPI_URL");
  }
}

export const geminiStudioService = new GeminiStudioService();
