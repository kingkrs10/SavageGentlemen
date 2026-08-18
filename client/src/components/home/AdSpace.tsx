import { useState, useEffect } from "react";
import { ExternalLink, X, Sparkles, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export interface AdData {
  id: number | string;
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  ctaText?: string;
  logoUrl?: string;
  type?: "standard" | "banner" | "product" | "video" | "event";
  placement?: "header_ticker" | "article_inline" | "article_sidebar" | "shop_feed" | "audio_player";
  price?: string;
}

interface AdSpaceProps {
  placement?: "header_ticker" | "article_inline" | "article_sidebar" | "shop_feed" | "audio_player";
  className?: string;
}

const FALLBACK_ADS: Record<string, AdData> = {
  header_ticker: {
    id: "fallback-ticker",
    title: "Carnival Planner | The Premier Caribbean Fete & Luxury Travel Concierge",
    description: "Bespoke itineraries, VIP costume packages, and luxury fete access for Trinidad, Barbados & Jamaica.",
    linkUrl: "https://www.carnival-planner.com",
    ctaText: "Plan Your Carnival",
    backgroundColor: "bg-gradient-to-r from-gold-950/80 via-obsidian to-gold-950/80",
    textColor: "text-gold-200",
    placement: "header_ticker",
  },
  article_inline: {
    id: "fallback-inline",
    title: "Carnival Planner: Unforgettable Bespoke Caribbean Escapes",
    description: "Elevate your carnival experience with all-inclusive VIP fete schedules, premium hotel accommodations, and costume concierge.",
    imageUrl: "/images/carnival-planner-ad.jpg",
    linkUrl: "https://www.carnival-planner.com",
    ctaText: "Book at Carnival Planner",
    backgroundColor: "bg-obsidian-card",
    textColor: "text-white",
    placement: "article_inline",
  },
  article_sidebar: {
    id: "fallback-sidebar",
    title: "Carnival Planner Concierge",
    description: "Custom fete itineraries & luxury carnival masquerader packages.",
    imageUrl: "/images/carnival-planner-vertical.jpg",
    linkUrl: "https://www.carnival-planner.com",
    ctaText: "Explore Packages",
    placement: "article_sidebar",
  },
  shop_feed: {
    id: "fallback-shop",
    title: "Carnival Planner VIP Masquerade Package",
    description: "All-inclusive fete tickets, costume pickup, and luxury concierge service.",
    imageUrl: "/images/carnival-planner-ad.jpg",
    linkUrl: "https://www.carnival-planner.com",
    ctaText: "View Packages",
    price: "VIP Concierge",
    placement: "shop_feed",
  },
  audio_player: {
    id: "fallback-player",
    title: "Carnival Planner | Official Fete Itinerary Partner",
    description: "Official Sponsor",
    linkUrl: "https://www.carnival-planner.com",
    ctaText: "Visit Carnival Planner",
    placement: "audio_player",
  },
};

export const AdSpace = ({ placement = "header_ticker", className }: AdSpaceProps) => {
  const [dismissed, setDismissed] = useState(false);

  // Fetch active sponsored content from API
  const { data: ads = [] } = useQuery<AdData[]>({
    queryKey: [`/api/ads/active?placement=${placement}`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/ads/active?placement=${placement}`);
        return await res.json();
      } catch {
        return [];
      }
    },
  });

  const activeAd = ads.length > 0 ? ads[0] : FALLBACK_ADS[placement];

  // Track impression once
  useEffect(() => {
    if (activeAd && typeof activeAd.id === "number") {
      apiRequest("POST", `/api/ads/${activeAd.id}/view`).catch(() => {});
    }
  }, [activeAd?.id]);

  const handleAdClick = () => {
    if (activeAd && typeof activeAd.id === "number") {
      apiRequest("POST", `/api/ads/${activeAd.id}/click`).catch(() => {});
    }
  };

  if (dismissed || !activeAd) return null;

  // 1. TOP HEADER TICKER BANNER
  if (placement === "header_ticker") {
    return (
      <div className={cn("relative w-full bg-gradient-to-r from-obsidian-dark via-gold-950/40 to-obsidian-dark border-y border-gold-500/25 px-4 py-2 text-xs backdrop-blur-md z-40 transition-all", className)}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400 font-mono text-[10px] font-bold uppercase tracking-widest border border-gold-500/40 shrink-0">
              <Sparkles className="w-3 h-3 text-gold-400 animate-pulse" />
              Sponsor
            </span>
            <p className="text-white/90 font-medium truncate">
              {activeAd.title}
              {activeAd.description && (
                <span className="hidden md:inline text-white/50 ml-2">— {activeAd.description}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={activeAd.linkUrl || "#"}
              target={activeAd.linkUrl?.startsWith("http") ? "_blank" : "_self"}
              rel="noopener noreferrer"
              onClick={handleAdClick}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 border border-gold-500/40 font-semibold text-[11px] transition-all"
            >
              {activeAd.ctaText || "Learn More"}
              <ArrowRight className="w-3 h-3" />
            </a>
            <button
              onClick={() => setDismissed(true)}
              className="text-white/40 hover:text-white transition-colors"
              aria-label="Dismiss announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. INLINE EDITORIAL ARTICLE BANNER
  if (placement === "article_inline") {
    return (
      <div className={cn("my-8 p-6 rounded-2xl border border-gold-500/20 bg-gradient-to-br from-obsidian-card via-obsidian to-obsidian-card shadow-xl overflow-hidden relative group", className)}>
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400/70 border border-gold-500/20 px-2 py-0.5 rounded-full bg-gold-500/10">
            Sponsored Feature
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          {activeAd.imageUrl && (
            <div className="w-full md:w-48 h-36 rounded-xl overflow-hidden shrink-0 border border-white/10">
              <img
                src={activeAd.imageUrl}
                alt={activeAd.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          <div className="flex-1 space-y-2 text-left">
            <h4 className="text-lg font-bold text-white group-hover:text-gold-300 transition-colors">
              {activeAd.title}
            </h4>
            <p className="text-sm text-white/70 leading-relaxed">
              {activeAd.description}
            </p>
            <div className="pt-2">
              <a
                href={activeAd.linkUrl || "#"}
                target={activeAd.linkUrl?.startsWith("http") ? "_blank" : "_self"}
                rel="noopener noreferrer"
                onClick={handleAdClick}
              >
                <Button size="sm" className="bg-gold-500 hover:bg-gold-400 text-obsidian font-bold text-xs gap-1.5 shadow-md">
                  {activeAd.ctaText || "Check It Out"}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. ARTICLE SIDEBAR CARD
  if (placement === "article_sidebar") {
    return (
      <div className={cn("rounded-2xl border border-gold-500/20 bg-obsidian-card p-4 space-y-4 text-center relative overflow-hidden", className)}>
        <span className="text-[9px] font-mono uppercase tracking-widest text-gold-400/70 block">
          Official Partner
        </span>
        {activeAd.imageUrl && (
          <div className="w-full h-40 rounded-xl overflow-hidden border border-white/10">
            <img src={activeAd.imageUrl} alt={activeAd.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="space-y-1">
          <h5 className="font-bold text-sm text-white">{activeAd.title}</h5>
          <p className="text-xs text-white/60">{activeAd.description}</p>
        </div>
        <a
          href={activeAd.linkUrl || "#"}
          target={activeAd.linkUrl?.startsWith("http") ? "_blank" : "_self"}
          rel="noopener noreferrer"
          onClick={handleAdClick}
          className="block w-full"
        >
          <Button size="sm" variant="outline" className="w-full border-gold-500/40 text-gold-300 hover:bg-gold-500/10 text-xs">
            {activeAd.ctaText || "Learn More"}
          </Button>
        </a>
      </div>
    );
  }

  // 4. SHOP FEED SPONSORED PRODUCT CARD
  if (placement === "shop_feed") {
    return (
      <div className={cn("rounded-2xl border border-gold-500/30 bg-gradient-to-b from-obsidian-card to-obsidian p-4 flex flex-col justify-between relative group hover:border-gold-500/60 transition-all", className)}>
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2 py-0.5 rounded-full bg-gold-500 text-obsidian text-[10px] font-mono font-bold uppercase tracking-wider shadow">
            Featured Partner
          </span>
        </div>
        {activeAd.imageUrl && (
          <div className="w-full h-64 rounded-xl overflow-hidden bg-white/5 mb-4">
            <img src={activeAd.imageUrl} alt={activeAd.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        )}
        <div className="space-y-2 text-left">
          <h4 className="font-bold text-white text-base group-hover:text-gold-300 transition-colors">{activeAd.title}</h4>
          <p className="text-xs text-white/60 line-clamp-2">{activeAd.description}</p>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-mono font-bold text-gold-400">{activeAd.price || "Partner Deal"}</span>
            <a
              href={activeAd.linkUrl || "#"}
              target={activeAd.linkUrl?.startsWith("http") ? "_blank" : "_self"}
              rel="noopener noreferrer"
              onClick={handleAdClick}
            >
              <Button size="sm" className="bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 border border-gold-500/40 text-xs">
                {activeAd.ctaText || "View Deal"}
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 5. AUDIO PLAYER COMPANION BADGE
  return (
    <div className={cn("inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-xs text-gold-300", className)}>
      <span className="text-[9px] font-mono uppercase tracking-widest text-gold-400 font-bold">Partner:</span>
      <a
        href={activeAd.linkUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleAdClick}
        className="hover:underline font-medium text-white text-xs truncate max-w-[140px]"
      >
        {activeAd.title}
      </a>
    </div>
  );
};

export default AdSpace;