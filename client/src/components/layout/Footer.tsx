import React, { useState } from "react";
import { Link } from "wouter";
import {
  Compass,
  Ticket,
  ShoppingBag,
  Sparkles,
  Music,
  Radio,
  Blocks,
  ShieldCheck,
  Send,
  CheckCircle2,
  Instagram,
  Youtube,
  Zap,
  Flame,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import LogoImage from "@/assets/SGFLYERLOGO.png";

export const Footer = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubscribed(true);
    toast({
      title: "VIP Society Welcome",
      description: "You're locked in for 48-hour priority presale drops and private fete invites.",
    });
  };

  return (
    <footer className="relative mt-24 border-t border-gold-500/20 bg-gradient-to-b from-obsidian-card via-obsidian to-black text-white overflow-hidden pb-32 md:pb-16">
      {/* Top Ambient Glow Line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-gold-400 to-transparent opacity-60" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 pt-16">
        {/* Top VIP Society Banner */}
        <div className="relative mb-16 rounded-3xl p-8 md:p-12 glass-obsidian-strong border border-gold-500/30 overflow-hidden shadow-2xl">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-gold-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-xs font-mono font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                PRIVATE SOCIETY & PRESALE ACCESS
              </div>
              <h3 className="text-2xl md:text-4xl font-heading font-extrabold uppercase tracking-tight text-white leading-tight">
                JOIN THE <span className="gold-gradient-text">SAVAGE SOCIETY</span>
              </h3>
              <p className="text-white/70 text-sm md:text-base max-w-xl font-light">
                Receive 48-hour early presale codes, exclusive password-gated secret fete locations, and instant Soca Passport loyalty bonus credits.
              </p>
            </div>

            <div className="lg:col-span-5">
              {isSubscribed ? (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                  <span>Welcome to the Society! Priority dispatches will arrive at <strong>{email}</strong>.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your VIP email..."
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-12 rounded-xl focus-visible:ring-gold-500"
                    required
                  />
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-black font-bold uppercase tracking-wider text-xs px-6 h-12 rounded-xl shadow-lg shadow-gold-500/20 shrink-0"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Lock In
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Main Footer Directory Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 pb-16 border-b border-white/10">
          {/* Brand Info & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <img
                src={LogoImage}
                alt="Savage Gentlemen"
                className="w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(229,169,60,0.5)] group-hover:scale-105 transition-transform"
              />
              <div>
                <span className="font-heading text-xl font-bold tracking-widest gold-gradient-text uppercase leading-none block">
                  Savage Gentlemen
                </span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-white/50 font-mono mt-0.5 block">
                  Caribbean Nocturne
                </span>
              </div>
            </Link>

            <p className="text-white/60 text-xs md:text-sm font-light leading-relaxed max-w-sm">
              Where global carnival culture converges with high-end luxury fetes, debossed Soca Passport rewards, and autonomous nightlife intelligence.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-mono text-gold-400/80">
              <span className="px-2.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-gold-400" />
                Stripe Encrypted
              </span>
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-cyan-400" />
                Neon Postgres
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
                🇹🇹 🇯🇲 🇧🇧 🇬🇾 🇺🇸
              </span>
            </div>
          </div>

          {/* Column 1: Fetes & Experiences */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono tracking-widest text-gold-400 font-bold flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5" />
              FETES & TICKETS
            </h4>
            <ul className="space-y-2 text-xs text-white/60">
              <li>
                <Link href="/events" className="hover:text-gold-300 transition-colors">
                  Upcoming Fete Calendar
                </Link>
              </li>
              <li>
                <Link href="/my-tickets" className="hover:text-gold-300 transition-colors">
                  My Ticket Vault
                </Link>
              </li>
              <li>
                <Link href="/passport" className="hover:text-gold-300 transition-colors flex items-center gap-1">
                  <span>Soca Passport 1.0</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-gold-500/20 text-gold-400 font-mono">NEW</span>
                </Link>
              </li>
              <li>
                <Link href="/guyana2027" className="hover:text-gold-300 transition-colors flex items-center gap-1">
                  <span>🇬🇾 Guyana '27 Hub</span>
                </Link>
              </li>
              <li>
                <Link href="/passport-promoters" className="hover:text-gold-300 transition-colors">
                  Promoter Partner Tier
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Editorial & Media */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono tracking-widest text-gold-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              MAGAZINE & SOUND
            </h4>
            <ul className="space-y-2 text-xs text-white/60">
              <li>
                <Link href="/magazine" className="hover:text-gold-300 transition-colors">
                  Savage Magazine Dispatches
                </Link>
              </li>
              <li>
                <Link href="/media" className="hover:text-gold-300 transition-colors">
                  Curated DJ Mixes
                </Link>
              </li>
              <li>
                <Link href="/live" className="hover:text-gold-300 transition-colors">
                  Live Broadcast Lounge
                </Link>
              </li>
              <li>
                <Link href="/magazine" className="hover:text-gold-300 transition-colors">
                  Rum & Barology Guide
                </Link>
              </li>
              <li>
                <Link href="/magazine" className="hover:text-gold-300 transition-colors">
                  Sound System Riddims
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Streetwear Drops */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono tracking-widest text-gold-400 font-bold flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />
              OFFICIAL DROPS
            </h4>
            <ul className="space-y-2 text-xs text-white/60">
              <li>
                <Link href="/shop" className="hover:text-gold-300 transition-colors">
                  All Streetwear Drops
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-gold-300 transition-colors">
                  Heavyweight French Terry
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-gold-300 transition-colors">
                  Graphic Tees & Headwear
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-gold-300 transition-colors">
                  Barware & Nightlife Gear
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-gold-300 transition-colors">
                  Shipping & Return Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: The Void Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold flex items-center gap-1.5">
              <Blocks className="w-3.5 h-3.5" />
              THE VOID // APPS
            </h4>
            <ul className="space-y-2 text-xs text-white/60">
              <li>
                <Link href="/apps/itssoca-decoder" className="hover:text-cyan-300 transition-colors flex items-center gap-1">
                  <span>itsSOCA Stem Decoder</span>
                  <span className="text-[9px] px-1 rounded bg-cyan-500/20 text-cyan-300 font-mono">AI</span>
                </Link>
              </li>
              <li>
                <Link href="/apps/language-sensei" className="hover:text-cyan-300 transition-colors">
                  Language Sensei Tutor
                </Link>
              </li>
              <li>
                <Link href="/apps/savage-physics" className="hover:text-cyan-300 transition-colors">
                  Savage Physics Sandbox
                </Link>
              </li>
              <li>
                <a
                  href="https://www.carnival-planner.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
                >
                  <span>Carnival Planner VIP</span>
                  <ArrowUpRight className="w-3 h-3 text-cyan-400" />
                </a>
              </li>
              <li>
                <Link href="/apps" className="hover:text-cyan-300 transition-colors">
                  All Autonomous Apps
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits & Legal Links */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50 font-light">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Savage Gentlemen LLC.</span>
            <span>•</span>
            <span className="text-gold-400/80">All Rights Reserved.</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4 text-white/70">
            <a
              href="https://instagram.com/savagegentlemen"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold-400 transition-colors flex items-center gap-1"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
              <span className="text-[11px] font-mono">@savagegentlemen</span>
            </a>
            <span>•</span>
            <Link href="/live" className="hover:text-gold-400 transition-colors flex items-center gap-1">
              <Radio className="w-4 h-4 text-gold-400" />
              <span className="text-[11px] font-mono">Live Stream</span>
            </Link>
          </div>

          {/* Legal / Admin Access */}
          <div className="flex items-center gap-4 text-[11px] font-mono text-white/40">
            <Link href="/events" className="hover:text-white transition-colors">
              Ticketing Terms
            </Link>
            <span>•</span>
            <Link href="/passport" className="hover:text-white transition-colors">
              Passport Privacy
            </Link>
            <span>•</span>
            <Link href="/admin" className="hover:text-gold-400 transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
