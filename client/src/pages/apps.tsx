import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Blocks, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Bot, 
  Film, 
  Radio, 
  Sliders, 
  Flame, 
  ArrowLeft, 
  ExternalLink,
  Cpu,
  CheckCircle2,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";

interface CreatorBot {
  id: string;
  name: string;
  category: string;
  icon: string;
  priceTag: string;
  priceAmount: number;
  description: string;
  status: "ACTIVE" | "AUTONOMOUS" | "BETA";
  features: string[];
  path?: string;
  externalUrl?: string;
  accent: "yellow" | "cyan" | "gold" | "red" | "emerald";
}

const creatorBots: CreatorBot[] = [
  {
    id: "itssoca-decoder",
    name: "itsSOCA DECODER",
    category: "AI Audio & Riddim Recognition",
    icon: "🎧",
    priceTag: "Free / $29 mo",
    priceAmount: 29,
    description: "Decode live fete sets, isolate stems, identify obscure riddims & vocal blends, and export 1-click Serato/Rekordbox DJ crates with BPM & key maps.",
    status: "AUTONOMOUS",
    features: ["Demucs AI Stem Separation", "RiddimDB Acoustic Fingerprinting", "Rekordbox & Serato .crate Export"],
    path: "/apps/itssoca-decoder",
    accent: "cyan",
  },
  {
    id: "motion-flyer-ai",
    name: "Carnival Motion Flyer AI",
    category: "Motion Graphic Generator",
    icon: "✨",
    priceTag: "$9 / flyer",
    priceAmount: 9,
    description: "Turns static event posters into animated Instagram Reels and TikTok motion video teasers with beat-synced particle glows.",
    status: "AUTONOMOUS",
    features: ["DJ Photo & Lineup Layer Separation", "Custom Particle & Smoke VFX", "Audio Snippet Integration"],
    path: "/apps/motion-flyer-ai",
    accent: "gold",
  },
  {
    id: "language-sensei",
    name: "Language Sensei",
    category: "AI Conversational Tutor",
    icon: "⛩️",
    priceTag: "Free Beta",
    priceAmount: 0,
    description: "Learn Japanese through interactive AI dialogue. Messages display across three synchronized layers: Kanji, Romaji, and English.",
    status: "ACTIVE",
    features: ["Real-time Pronunciation Guides", "Contextual Vocabulary Feedback", "Adaptive Difficulty Tiers"],
    path: "/apps/language-sensei",
    accent: "red",
  },
  {
    id: "savage-physics",
    name: "Savage Physics",
    category: "Interactive Simulation",
    icon: "⚛️",
    priceTag: "Free Sandbox",
    priceAmount: 0,
    description: "Interactive Matter.js antigravity particle sandbox. Type burdens or stresses, fling them in zero gravity, and trigger SAVAGE ENGAGE.",
    status: "ACTIVE",
    features: ["Zero-G Matter.js Physics Engine", "Custom Gravity Fields & Repulsors", "Haptic Blast Visuals"],
    path: "/apps/savage-physics",
    accent: "emerald",
  },
  {
    id: "survival-map",
    name: "Survival Map Generator",
    category: "Emergency Preparedness",
    icon: "🗺️",
    priceTag: "Cloud Engine",
    priceAmount: 0,
    description: "Personalized emergency survival mapping engine for any location. Generates high-res printable PDF maps and gear manifests.",
    status: "ACTIVE",
    features: ["Topographic Elevation Contour", "Water & Resource Waypoint Marking", "Printable Emergency PDF Export"],
    externalUrl: "https://survival-map-36664345587.us-central1.run.app/",
    accent: "cyan",
  },
  {
    id: "dj-stem-master",
    name: "DJ Mix Stem Master",
    category: "Audio Processing Lab",
    icon: "🎛️",
    priceTag: "$4.99 / stem pack",
    priceAmount: 4.99,
    description: "AI-powered music stem isolator. Extracts drums, basslines, vocals, and synth riddims from Caribbean mixes for DJs and remixers.",
    status: "BETA",
    features: ["4-Channel Stem Isolation", "Lossless 320kbps WAV Export", "Automatic BPM & Key Detection"],
    path: "/media",
    accent: "cyan",
  },
];

export default function Apps() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleLaunchApp = (bot: CreatorBot) => {
    if (bot.externalUrl) {
      window.open(bot.externalUrl, "_blank", "noopener,noreferrer");
    } else if (bot.path) {
      navigate(bot.path);
    }
  };

  return (
    <>
      <SEOHead
        title="The Void // Apps Matrix & Creator AI Studio"
        description="Autonomous AI bots, IslandLyric.bot video generator, language learning, and interactive tools crafted by Savage Gentlemen."
      />

      <div className="relative min-h-screen py-6 md:py-12 space-y-12">
        {/* Cyber-Matrix Background Ambient Effect */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[160px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-[160px]" />
        </div>

        {/* ── 1. HOLODECK MATRIX HEADER & REALITY SWITCH ── */}
        <div className="relative z-10 glass-obsidian-strong border border-cyan-500/30 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-black font-bold shadow-lg shadow-cyan-500/25">
                <Cpu className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 text-[10px] font-mono uppercase font-bold tracking-widest mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  THE VOID // REALITY MATRIX ACTIVE
                </div>
                <h1 className="text-3xl md:text-5xl font-heading font-extrabold uppercase text-white tracking-tight">
                  CREATOR <span className="cyan-gradient-text">AI STUDIO</span>
                </h1>
              </div>
            </div>

            {/* Return to Main Stage Reality Button */}
            <Button
              onClick={() => navigate("/")}
              className="glass-obsidian border-gold-500/40 text-gold-300 hover:text-black hover:bg-gold-400 font-bold uppercase tracking-widest text-xs rounded-2xl px-6 py-6 transition-all duration-300 shadow-lg shadow-gold-500/10 flex items-center gap-2 self-stretch md:self-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              RETURN TO MAIN STAGE
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono">
              <span className="text-[10px] text-white/50 uppercase block">ACTIVE AI BOTS</span>
              <span className="text-sm font-bold text-cyan-300">6 AUTONOMOUS</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono">
              <span className="text-[10px] text-white/50 uppercase block">AVERAGE DELIVERY</span>
              <span className="text-sm font-bold text-white">&lt; 5 MINUTES</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono">
              <span className="text-[10px] text-white/50 uppercase block">VIDEO RENDERS</span>
              <span className="text-sm font-bold text-gold-400">4K ULTRA HD</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono">
              <span className="text-[10px] text-white/50 uppercase block">PASSPORT PERKS</span>
              <span className="text-sm font-bold text-emerald-400">DISCOUNTS APPLIED</span>
            </div>
          </div>
        </div>

        {/* ── 2. AUTONOMOUS CREATOR BOTS GRID ── */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creatorBots.map((bot) => (
            <div
              key={bot.id}
              onClick={() => handleLaunchApp(bot)}
              className="group relative rounded-3xl glass-obsidian-strong border border-white/10 hover:border-cyan-400/50 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/10 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Top Badge & Icon */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="text-4xl p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                    {bot.icon}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold">
                      {bot.priceTag}
                    </span>
                    <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-400 font-bold mt-1">
                      {bot.status}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 block mb-1">
                  {bot.category}
                </span>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  {bot.name}
                </h3>
                <p className="text-xs text-white/60 leading-relaxed mb-5">
                  {bot.description}
                </p>

                {/* Features List */}
                <ul className="space-y-2 mb-6 pt-4 border-t border-white/10">
                  {bot.features.map((feat, idx) => (
                    <li key={idx} className="text-xs text-white/70 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLaunchApp(bot);
                }}
                className="w-full bg-cyan-500/15 hover:bg-cyan-400 hover:text-black text-cyan-300 font-bold uppercase tracking-wider text-xs py-5 rounded-xl border border-cyan-400/30 transition-all flex items-center justify-center gap-2 group-hover:bg-cyan-400 group-hover:text-black"
              >
                <span>Launch {bot.name}</span>
                {bot.externalUrl ? <ExternalLink className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
