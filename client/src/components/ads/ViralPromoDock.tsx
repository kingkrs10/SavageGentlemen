import { useState, useEffect } from "react";
import { Sparkles, Flame, X, ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

interface PromoOffer {
  id: string;
  badge: string;
  headline: string;
  subtext: string;
  ctaText: string;
  ctaLink: string;
}

const VIRAL_OFFERS: PromoOffer[] = [
  {
    id: "carnival_planner_sponsor",
    badge: "OFFICIAL SPONSOR",
    headline: "Carnival Planner: Luxury Fete & Travel Concierge",
    subtext: "Bespoke itineraries, VIP costumes & fete packages • www.carnival-planner.com",
    ctaText: "Plan Trip",
    ctaLink: "https://www.carnival-planner.com",
  },
  {
    id: "hoodie_drop",
    badge: "LIMITED STREETWEAR DROP",
    headline: "Heavyweight 480GSM French Terry Hoodie",
    subtext: "Handcrafted luxury fit with gold embroidery • Free US Shipping",
    ctaText: "Claim Drop",
    ctaLink: "/shop",
  },
  {
    id: "soca_passport",
    badge: "CARIBBEAN VIP REWARDS",
    headline: "Soca Passport: Get Paid To Party",
    subtext: "Earn digital stamps for free VIP tickets & bar tabs • 100 Bonus Pts",
    ctaText: "Join Free",
    ctaLink: "/socapassport/dashboard",
  },
  {
    id: "soca_noir_tickets",
    badge: "SIGNATURE EVENT",
    headline: "Soca Noir 2026: Obsidian & Gold Masquerade",
    subtext: "Secret Brooklyn warehouse • Tier 1 VIP passes closing soon",
    ctaText: "Get VIP Passes",
    ctaLink: "/events",
  },
];

export function ViralPromoDock() {
  const [activeOfferIndex, setActiveOfferIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay appearance slightly for natural entrance
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem("sg_viral_promo_dismissed");
      if (!dismissed) {
        setIsVisible(true);
      }
    }, 2000);

    // Rotate offers every 8 seconds
    const rotateInterval = setInterval(() => {
      setActiveOfferIndex((prev) => (prev + 1) % VIRAL_OFFERS.length);
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearInterval(rotateInterval);
    };
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("sg_viral_promo_dismissed", "true");
  };

  if (isDismissed || !isVisible) return null;

  const currentOffer = VIRAL_OFFERS[activeOfferIndex];

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative group">
        {/* Ambient Gold Glow Backdrop */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 via-gold-500 to-yellow-400 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500 pointer-events-none" />

        <div className="relative glass-obsidian-strong border border-gold-500/30 rounded-2xl p-3 md:p-4 shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-3 md:gap-4">
          
          {/* Pulse Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-gold-500/30 border border-gold-500/40 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-gold-400 animate-pulse" />
          </div>

          {/* Text Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase font-bold tracking-widest text-gold-400">
                <Sparkles className="w-2.5 h-2.5 text-gold-400" />
                {currentOffer.badge}
              </span>
            </div>
            <h4 className="text-xs md:text-sm font-bold text-white truncate">
              {currentOffer.headline}
            </h4>
            <p className="text-[10px] md:text-xs text-gray-300/80 truncate hidden sm:block">
              {currentOffer.subtext}
            </p>
          </div>

          {/* Action CTA */}
          <div className="flex items-center gap-2 shrink-0">
            {currentOffer.ctaLink.startsWith("http") ? (
              <a
                href={currentOffer.ctaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-obsidian font-bold text-xs md:text-sm shadow-md transition hover:scale-105 active:scale-95"
              >
                <span>{currentOffer.ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            ) : (
              <Link href={currentOffer.ctaLink}>
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-obsidian font-bold text-xs md:text-sm shadow-md transition hover:scale-105 active:scale-95"
                >
                  <span>{currentOffer.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            )}

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              aria-label="Dismiss offer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ViralPromoDock;
