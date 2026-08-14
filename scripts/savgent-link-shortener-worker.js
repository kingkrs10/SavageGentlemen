/**
 * SavGent Free Permanent Link Shortener (Cloudflare Worker)
 * 
 * Instructions:
 * 1. Create a free account on Cloudflare (https://dash.cloudflare.com)
 * 2. Go to Workers & Pages -> Create Worker
 * 3. Paste this code into the Cloudflare Worker editor and click "Save and Deploy".
 * 4. Your shortener will be instantly live on your free *.workers.dev domain (or custom domain).
 */

const REDIRECT_MAP = {
  // Base redirects
  "/": "https://savgent.is-a.dev",
  "/tickets": "https://savgent.is-a.dev/events",
  "/passport": "https://savgent.is-a.dev/passport",
  "/media": "https://savgent.is-a.dev/media",
  "/bot": "https://savgent.is-a.dev/island-lyric-bot",
  "/sensei": "https://savgent.is-a.dev/apps-language-sensei",
  "/vip": "https://savgent.is-a.dev/passport-promoters",
};

const DEFAULT_TARGET = "https://savgent.is-a.dev";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname.toLowerCase().replace(/\/$/, "");

    // Check mapping
    const targetUrl = REDIRECT_MAP[pathname || "/"] || `${DEFAULT_TARGET}${url.pathname}${url.search}`;

    return Response.redirect(targetUrl, 302);
  },
};
