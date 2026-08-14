import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, Globe, MapPin, Award, Star, QrCode, LogOut, Sparkles, ShieldCheck, Crown, Zap, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import { Link, useLocation } from "wouter";
import type { PassportProfile, PassportStamp, PassportTier } from "@shared/schema";
import QRCodeLib from "qrcode";
import { useEffect, useState } from "react";
import { PassportMissions } from "@/components/passport/PassportMissions";
import { PassportAchievements } from "@/components/passport/PassportAchievements";
import { PassportMarketplace } from "@/components/passport/PassportMarketplace";
import { EventCheckIn } from "@/components/passport/EventCheckIn";
import SGFlyerLogoPng from "@/assets/SGFLYERLOGO.png";
import { useToast } from "@/hooks/use-toast";

interface PassportProfileWithQR extends PassportProfile {
  qrData?: string;
}

export default function Passport() {
  const { user, logout } = useUser();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: profile, isLoading: profileLoading } = useQuery<PassportProfileWithQR>({
    queryKey: ['/api/passport/profile'],
    enabled: !!user && !user.isGuest,
  });

  const { data: stamps = [], isLoading: stampsLoading } = useQuery<PassportStamp[]>({
    queryKey: ['/api/passport/stamps'],
    enabled: !!user && !user.isGuest,
  });

  const { data: tiers = [], isLoading: tiersLoading } = useQuery<PassportTier[]>({
    queryKey: ['/api/passport/tiers'],
  });

  useEffect(() => {
    const qrString = profile?.qrData || (user ? `SG-USER-${user.id}` : "SG-PASSPORT-DEMO");
    QRCodeLib.toDataURL(qrString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#E5A93C',
        light: '#0A0B10',
      },
    }).then((url) => {
      setQrCodeUrl(url);
    }).catch((err) => {
      console.error("Error generating QR code:", err);
    });
  }, [profile?.qrData, user]);

  const currentPoints = profile?.totalPoints || 3850;
  const currentTierName = profile?.currentTier || "ELITE";

  const handleClaimPerk = (perkName: string, cost: number) => {
    toast({
      title: "Reward Claimed!",
      description: `Successfully claimed ${perkName} for ${cost} credits. Check your ticket vault.`,
    });
  };

  const handleUpgradeBlackCard = () => {
    toast({
      title: "Soca Passport Black Card VIP",
      description: "Redirecting to Black Card VIP membership activation ($9.99/mo or $79/yr)...",
    });
  };

  return (
    <>
      <SEOHead
        title="Soca Passport 1.0 - Savage Gentlemen"
        description="Your global Caribbean loyalty passport. Collect country stamps, earn credits, and unlock VIP fete perks."
      />

      <div className="space-y-12 py-6 md:py-10 max-w-7xl mx-auto">
        {/* ── 1. HEADER WITH USER STATS & TIER BADGE ── */}
        <div className="glass-obsidian-strong border border-gold-500/30 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-gold-600 via-amber-400 to-yellow-300 flex items-center justify-center text-black font-bold shadow-lg shadow-gold-500/25">
                <Crown className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-gold-500/15 text-gold-300 border border-gold-500/30 text-[10px] font-mono uppercase font-bold tracking-widest mb-1">
                  <Sparkles className="w-3 h-3 text-gold-400" />
                  AUTHENTIC CARNIVAL LOYALTY PASSPORT
                </div>
                <h1 className="text-3xl md:text-5xl font-heading font-extrabold uppercase text-white tracking-tight">
                  SOCA <span className="gold-gradient-text">PASSPORT 1.0</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate("/socapassport/scanner")}
                className="bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-black font-bold uppercase tracking-wider text-xs px-5 py-6 rounded-2xl shadow-lg shadow-gold-500/20"
              >
                <QrCode className="w-4 h-4 mr-2" />
                SCAN EVENT QR CODE
              </Button>
            </div>
          </div>

          {/* Credit Ledger Slider */}
          <div className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-mono text-white/50 tracking-wider">STATUS LEVEL</span>
                <h3 className="text-lg font-bold text-gold-400 uppercase tracking-wide flex items-center gap-2">
                  <span>{currentTierName} TIER</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-gold-500/20 text-gold-300 font-mono">
                    3,850 CREDITS
                  </span>
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase font-mono text-white/50 tracking-wider">NEXT LEVEL</span>
                <p className="text-xs font-bold text-white/80">650 PTS TO DIAMOND CIRQUE</p>
              </div>
            </div>

            {/* Glowing Gold Progress Bar */}
            <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden border border-white/10 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-gold-600 via-amber-400 to-yellow-300 rounded-full shadow-[0_0_15px_rgba(229,169,60,0.5)] transition-all duration-1000"
                style={{ width: "78%" }}
              />
            </div>
          </div>
        </div>

        {/* ── 2. TWO-COLUMN PASSPORT BOOKLET & REDEMPTION HUB ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 3D Leather Passport Book */}
          <div className="lg:col-span-5 passport-leather rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-gold-500/40 relative">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gold-500/30">
              <div className="flex items-center gap-2.5">
                <img src={SGFlyerLogoPng} alt="SG" className="w-10 h-10 object-contain" />
                <div>
                  <h3 className="font-heading font-extrabold text-base tracking-widest text-gold-300 uppercase">
                    GLOBAL PASSPORT
                  </h3>
                  <span className="text-[10px] uppercase font-mono text-white/50">CARIBBEAN CIRQUE ID: SG-78402</span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-1 rounded bg-gold-500/20 text-gold-300 border border-gold-500/30">
                ACTIVE
              </span>
            </div>

            {/* Passport Stamps Grid */}
            <div className="mb-6">
              <h4 className="text-xs uppercase font-mono tracking-widest text-gold-400 font-bold mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                UNLOCKED COUNTRY STAMPS
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="passport-stamp-gold p-3.5 rounded-xl text-center">
                  <span className="text-2xl block mb-1">🇹🇹</span>
                  <span className="text-xs font-mono font-bold tracking-wider uppercase block text-gold-300">TRINIDAD</span>
                  <span className="text-[9px] text-white/70">CARNIVAL ROAD MARCH</span>
                </div>
                <div className="passport-stamp-gold p-3.5 rounded-xl text-center">
                  <span className="text-2xl block mb-1">🇧🇧</span>
                  <span className="text-xs font-mono font-bold tracking-wider uppercase block text-gold-300">BARBADOS</span>
                  <span className="text-[9px] text-white/70">CROP OVER FOREDAY</span>
                </div>
                <div className="passport-stamp-gold p-3.5 rounded-xl text-center">
                  <span className="text-2xl block mb-1">🇯🇲</span>
                  <span className="text-xs font-mono font-bold tracking-wider uppercase block text-gold-300">JAMAICA</span>
                  <span className="text-[9px] text-white/70">SUMFEST REGGAE</span>
                </div>
                <div className="passport-stamp-gold p-3.5 rounded-xl text-center">
                  <span className="text-2xl block mb-1">🇺🇸</span>
                  <span className="text-xs font-mono font-bold tracking-wider uppercase block text-gold-300">MIAMI</span>
                  <span className="text-[9px] text-white/70">CARNIVAL J'OUVERT</span>
                </div>
              </div>
            </div>

            {/* Personal Check-In QR Pass */}
            <div className="p-4 rounded-2xl bg-black/70 border border-gold-500/30 flex flex-col items-center text-center">
              <span className="text-[10px] uppercase font-mono text-gold-400 font-bold tracking-wider mb-2">
                PERSONAL MEMBER CHECK-IN PASS
              </span>
              {qrCodeUrl && (
                <div className="p-2 bg-black rounded-xl border border-gold-500/40 mb-2 shadow-inner">
                  <img src={qrCodeUrl} alt="Passport QR" className="w-36 h-36 object-contain" />
                </div>
              )}
              <p className="text-[11px] text-white/60">Present at door scanners to award stamps and atomic credits.</p>
            </div>
          </div>

          {/* Right: Black Card VIP Tier & Perk Marketplace */}
          <div className="lg:col-span-7 space-y-6">
            {/* Soca Passport Black Card Subscription Banner */}
            <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-r from-obsidian via-black to-obsidian border-2 border-gold-500/50 shadow-2xl overflow-hidden group">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gold-500/15 rounded-full blur-[100px] pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/40 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
                    <Crown className="w-3 h-3 text-gold-400" />
                    PREMIUM MEMBERSHIP CLUB
                  </div>
                  <h3 className="text-2xl font-heading font-extrabold uppercase text-white tracking-wide">
                    SOCA PASSPORT <span className="gold-gradient-text">BLACK CARD</span>
                  </h3>
                  <p className="text-xs text-white/70 mt-1 max-w-md">
                    Zero ticket service fees, 48-hour presale head-start, 2x credit earning on check-ins, and free access to exclusive DJ mixes.
                  </p>
                </div>

                <div className="text-left sm:text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-gold-400 font-mono">$9.99 <span className="text-xs text-white/60 font-normal">/ mo</span></div>
                  <span className="text-[10px] text-emerald-400 block mb-2 font-mono font-bold">OR $79 / YEAR (SAVE 34%)</span>
                  <Button
                    onClick={handleUpgradeBlackCard}
                    className="bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-black font-bold uppercase tracking-wider text-xs px-5 py-2 rounded-xl shadow-lg shadow-gold-500/20"
                  >
                    Activate Black Card
                  </Button>
                </div>
              </div>
            </div>

            {/* Redeemable VIP Perks Grid */}
            <div className="glass-obsidian-strong border border-gold-500/30 rounded-3xl p-6 md:p-8">
              <h3 className="text-xl font-bold uppercase tracking-wide text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold-400" />
                REDEEMABLE VIP PERKS & REWARDS
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl glass-obsidian border border-white/10 hover:border-gold-500/50 transition-all flex flex-col justify-between">
                  <div>
                    <div className="text-2xl mb-2">🎟️</div>
                    <span className="text-[10px] uppercase font-mono text-gold-400 font-bold block mb-1">500 CREDITS</span>
                    <h4 className="text-sm font-bold text-white mb-1">$10 Off Next Fete</h4>
                    <p className="text-xs text-white/60 mb-4">Instant discount applied at Stripe ticket checkout.</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleClaimPerk("$10 Off Fete Pass", 500)}
                    className="w-full bg-gold-500/20 hover:bg-gold-500 text-gold-300 hover:text-black font-bold uppercase tracking-wider text-xs py-1.5 rounded-xl border border-gold-500/30"
                  >
                    Claim Perk
                  </Button>
                </div>

                <div className="p-4 rounded-2xl glass-obsidian border border-white/10 hover:border-gold-500/50 transition-all flex flex-col justify-between">
                  <div>
                    <div className="text-2xl mb-2">👑</div>
                    <span className="text-[10px] uppercase font-mono text-gold-400 font-bold block mb-1">1,500 CREDITS</span>
                    <h4 className="text-sm font-bold text-white mb-1">Backstage VIP Wristband</h4>
                    <p className="text-xs text-white/60 mb-4">Dedicated bar access and artist pit wristband pass.</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleClaimPerk("Backstage VIP Wristband", 1500)}
                    className="w-full bg-gold-500/20 hover:bg-gold-500 text-gold-300 hover:text-black font-bold uppercase tracking-wider text-xs py-1.5 rounded-xl border border-gold-500/30"
                  >
                    Claim Perk
                  </Button>
                </div>

                <div className="p-4 rounded-2xl glass-obsidian border border-white/10 hover:border-gold-500/50 transition-all flex flex-col justify-between">
                  <div>
                    <div className="text-2xl mb-2">👕</div>
                    <span className="text-[10px] uppercase font-mono text-gold-400 font-bold block mb-1">2,000 CREDITS</span>
                    <h4 className="text-sm font-bold text-white mb-1">Official Merch Pass</h4>
                    <p className="text-xs text-white/60 mb-4">Free official Savage Gentlemen carnival cap or tee.</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleClaimPerk("Official Merch Pass", 2000)}
                    className="w-full bg-gold-500/20 hover:bg-gold-500 text-gold-300 hover:text-black font-bold uppercase tracking-wider text-xs py-1.5 rounded-xl border border-gold-500/30"
                  >
                    Claim Perk
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
