import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  Ticket, 
  Sparkles, 
  Play, 
  ChevronRight, 
  Compass, 
  Zap, 
  Flame, 
  Blocks,
  ArrowUpRight,
  ShieldCheck,
  Music,
  Bell,
  Mail,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import SEOHead from "@/components/SEOHead";
import { API_ROUTES } from "@/lib/constants";
import { Event } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import SGFlyerLogoPng from "@/assets/SGFLYERLOGO.png";
import BrandVideo from "@/assets/videos/brand-video.mp4";
import EventCard from "@/components/home/EventCard";
import { AdSpace } from "@/components/home/AdSpace";

const Home = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { playTrack } = useAudioPlayer();
  const [notifyEmail, setNotifyEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch real live events from backend
  const { data: featuredEvents, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: [API_ROUTES.EVENTS_FEATURED],
  });

  const nextUpcomingEvent = featuredEvents && featuredEvents.length > 0 ? featuredEvents[0] : null;

  // Fetch latest magazine stories
  const { data: latestArticles = [] } = useQuery<any[]>({
    queryKey: ["/api/magazine/articles?limit=3"],
    queryFn: () => fetch("/api/magazine/articles?limit=3").then(res => res.json()).catch(() => []),
  });

  // Fetch featured streetwear drops
  const { data: merchDrops = [] } = useQuery<any[]>({
    queryKey: ["/api/merch/catalog"],
    queryFn: () => fetch("/api/merch/catalog").then(res => res.json()).catch(() => []),
  });

  // Fetch active site background video setting
  const { data: videoConfig } = useQuery<{
    videoUrl?: string;
    posterUrl?: string;
    opacity?: number;
    contrast?: number;
    brightness?: number;
    isDefault?: boolean;
  }>({
    queryKey: ["/api/settings/background-video"],
    queryFn: () => fetch("/api/settings/background-video").then(res => res.json()).catch(() => null),
  });

  // Real-time countdown timer to next event or next carnival season
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // If next live event has a valid date, count down to it; otherwise count down to next Carnival season
    const targetTime = nextUpcomingEvent?.date 
      ? new Date(nextUpcomingEvent.date).getTime() 
      : new Date("2026-10-24T20:00:00").getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextUpcomingEvent]);

  const handleGetTicket = (eventId: number) => {
    navigate(`/events/${eventId}`);
  };

  const handlePlaySampleMix = () => {
    playTrack({
      id: "savgent-anthem",
      title: "Caribbean Nocturne Official Mix",
      artist: "DJ Private Ryan x Savage Gentlemen",
      src: "/attached_assets/savgent-oct-25-mix.m4v",
      artwork: SGFlyerLogoPng,
      price: 199,
    });
    toast({
      title: "Audio Stream Active",
      description: "Streaming Caribbean Nocturne audio preview in the bottom dock.",
    });
  };

  const handleSubscribeAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail || !notifyEmail.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    setIsSubscribed(true);
    toast({
      title: "VIP Presale Alert Activated",
      description: "You'll be the first to receive 48-hour presale access and pass discounts.",
    });
  };

  return (
    <div className="mx-auto space-y-16 md:space-y-24">
      <SEOHead
        title="Savage Gentlemen | Luxury Caribbean Experience & Soca Passport"
        description="Experience high-octane Caribbean nightlife, fete ticketing, Soca Passport rewards, and autonomous AI music engines."
      />

      {/* ── 1. READY PLAYER ONE CYBER-BEACHBAR HERO STAGE ── */}
      <section className="relative w-full min-h-[90vh] md:min-h-screen rounded-3xl overflow-hidden border border-gold-500/20 shadow-2xl bg-obsidian flex flex-col justify-between p-6 md:p-12">
        {/* Background Cinematic Video with Obsidian & Amber Gradient */}
        <div className="absolute inset-0 z-0">
          <video
            key={videoConfig?.videoUrl || "default-brand-video"}
            className="w-full h-full object-cover transition-opacity duration-700"
            style={{
              opacity: videoConfig?.opacity ?? 0.45,
              filter: `brightness(${videoConfig?.brightness ?? 90}%) contrast(${videoConfig?.contrast ?? 125}%)`,
            }}
            autoPlay
            muted
            loop
            playsInline
            poster={videoConfig?.posterUrl || undefined}
          >
            <source src={videoConfig?.videoUrl || BrandVideo} type="video/mp4" />
          </video>
          {/* Cyber Gradients & Radial Warm Glows */}
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/70 to-transparent" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gold-500/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        </div>

        {/* Top Floating Status Ribbon */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass-obsidian-strong border border-gold-500/30 text-xs font-mono text-gold-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold tracking-widest uppercase">
              {nextUpcomingEvent ? `UPCOMING: ${nextUpcomingEvent.title}` : "CARNIVAL SEASON 2026 SCHEDULE DROPPING"}
            </span>
          </div>

          {/* Quick Reality Switch Pill */}
          <Link
            href="/apps"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(0,242,254,0.15)] group"
          >
            <Blocks className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
            <span>ENTER THE VOID // APPS MATRIX</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Center Hero Content & Countdown */}
        <div className="relative z-10 my-auto py-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 mb-4">
            <img src={SGFlyerLogoPng} alt="SG" className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(229,169,60,0.5)]" />
            <span className="text-xs uppercase tracking-[0.3em] text-gold-400 font-bold font-mono">
              Luxury Caribbean Lifestyle & Culture
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-heading font-extrabold uppercase tracking-tight text-white mb-6 leading-none">
            SAVAGE <span className="gold-gradient-text">GENTLEMEN</span>
          </h1>

          <p className="text-lg md:text-2xl text-white/80 max-w-2xl leading-relaxed mb-8 font-light tracking-wide">
            Where global carnival energy meets high-end luxury fetes, digital passport rewards, and autonomous nightlife technology.
          </p>

          {/* Live Countdown Clock */}
          <div className="inline-flex flex-wrap items-center gap-3 p-3 rounded-2xl glass-obsidian border border-gold-500/30 mb-8 backdrop-blur-xl">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 font-mono">
              <span className="text-xl md:text-2xl font-bold text-gold-400">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/50">DAYS</span>
            </div>
            <span className="text-gold-400 font-bold">:</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 font-mono">
              <span className="text-xl md:text-2xl font-bold text-gold-400">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/50">HRS</span>
            </div>
            <span className="text-gold-400 font-bold">:</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 font-mono">
              <span className="text-xl md:text-2xl font-bold text-gold-400">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/50">MIN</span>
            </div>
            <span className="text-gold-400 font-bold">:</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 font-mono">
              <span className="text-xl md:text-2xl font-bold text-gold-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/50">SEC</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/events')}
              className="bg-gradient-to-r from-gold-500 via-amber-500 to-yellow-500 hover:from-gold-400 hover:to-yellow-400 text-black font-bold uppercase tracking-widest text-sm px-8 py-6 rounded-2xl shadow-xl shadow-gold-500/25 hover:scale-105 transition-all"
            >
              <Ticket className="w-5 h-5 mr-2" />
              EXPLORE EVENTS & TICKETS
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/passport')}
              className="glass-obsidian hover:bg-gold-500/15 border-gold-500/40 text-gold-300 hover:text-white font-bold uppercase tracking-widest text-sm px-8 py-6 rounded-2xl backdrop-blur-xl hover:scale-105 transition-all"
            >
              <Compass className="w-5 h-5 mr-2 text-gold-400" />
              SOCA PASSPORT 1.0
            </Button>

            <Button
              size="lg"
              variant="ghost"
              onClick={handlePlaySampleMix}
              className="text-white/80 hover:text-gold-300 hover:bg-white/5 font-semibold text-xs tracking-wider uppercase px-4 py-6 rounded-2xl"
            >
              <Play className="w-4 h-4 mr-2 fill-current text-gold-400" />
              PREVIEW SOUNDTRACK
            </Button>
          </div>
        </div>

        {/* Bottom Floating Quick-Pass Deck */}
        <div className="relative z-10 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl glass-obsidian border border-gold-500/30 hover:border-gold-500/60 transition-all flex items-center justify-between group">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-gold-400 font-bold">SAVAGE MAGAZINE</span>
              <h3 className="text-sm font-bold text-white group-hover:text-gold-300 transition-colors">CULTURE DISPATCHES</h3>
              <p className="text-xs text-white/50">Nightlife, Rum & Sound Riddims</p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/magazine')}
              className="bg-gold-500/20 hover:bg-gold-500 text-gold-300 hover:text-black font-bold text-xs uppercase tracking-wider rounded-xl px-3 py-1.5"
            >
              Read Stories
            </Button>
          </div>

          <div className="p-4 rounded-2xl glass-obsidian border border-gold-500/30 hover:border-gold-500/60 transition-all flex items-center justify-between group">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-gold-400 font-bold">LUXURY STREETWEAR</span>
              <h3 className="text-sm font-bold text-white group-hover:text-gold-300 transition-colors">OFFICIAL MERCH STORE</h3>
              <p className="text-xs text-white/50">Heavyweight Hoodies & Barware</p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/shop')}
              className="bg-gold-500/20 hover:bg-gold-500 text-gold-300 hover:text-black font-bold text-xs uppercase tracking-wider rounded-xl px-3 py-1.5"
            >
              Shop Drops
            </Button>
          </div>

          <div className="hidden lg:flex p-4 rounded-2xl glass-obsidian border border-cyan-500/30 hover:border-cyan-500/60 transition-all items-center justify-between group">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold">AUDIO ENGINE</span>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">itsSOCA DECODER</h3>
              <p className="text-xs text-white/50">Isolate Stems & DJ Crates</p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/apps/itssoca-decoder')}
              className="bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black font-bold text-xs uppercase tracking-wider rounded-xl px-3 py-1.5"
            >
              Open Decoder
            </Button>
          </div>
        </div>
      </section>

      {/* Top Header Sponsor Ticker */}
      <AdSpace placement="header_ticker" />

      {/* ── 2. LATEST SAVAGE MAGAZINE DISPATCHES ── */}
      {latestArticles.length > 0 && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 text-xs font-mono font-bold uppercase tracking-widest mb-2">
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                AUTONOMOUS DIGITAL EDITORIAL
              </div>
              <h2 className="text-3xl md:text-5xl font-heading font-extrabold uppercase tracking-tight text-white">
                SAVAGE <span className="gold-gradient-text">MAGAZINE</span>
              </h2>
            </div>
            <Link href="/magazine">
              <Button variant="outline" className="glass-obsidian border-gold-500/30 text-gold-300 hover:text-white rounded-xl uppercase text-xs tracking-wider font-bold">
                Read All Dispatches
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestArticles.map((art: any) => (
              <Link key={art.id} href={`/magazine/${art.slug}`}>
                <div className="h-full rounded-2xl border border-gold-500/15 bg-obsidian-card hover:border-gold-500/40 transition-all p-5 flex flex-col justify-between group cursor-pointer shadow-lg space-y-4">
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-obsidian-dark">
                    <img
                      src={art.featuredImage || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=500&fit=crop"}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-full bg-obsidian/85 text-[10px] font-mono font-bold uppercase tracking-wider text-gold-300 border border-gold-500/30">
                        {art.category}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-heading text-lg font-bold text-white group-hover:text-gold-300 transition-colors line-clamp-2">
                      {art.title}
                    </h3>
                    <p className="text-xs text-white/60 line-clamp-2">
                      {art.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono text-gold-400">
                    <span>{art.readTime || "3 min read"}</span>
                    <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Read Story &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. FEATURED STREETWEAR DROPS (PRINT-ON-DEMAND) ── */}
      {merchDrops.length > 0 && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 text-xs font-mono font-bold uppercase tracking-widest mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
                OFFICIAL STREETWEAR DROPS
              </div>
              <h2 className="text-3xl md:text-5xl font-heading font-extrabold uppercase tracking-tight text-white">
                SAVAGE <span className="gold-gradient-text">DROPS</span>
              </h2>
            </div>
            <Link href="/shop">
              <Button variant="outline" className="glass-obsidian border-gold-500/30 text-gold-300 hover:text-white rounded-xl uppercase text-xs tracking-wider font-bold">
                View Full Catalog
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {merchDrops.slice(0, 3).map((item: any) => (
              <div
                key={item.id}
                className="rounded-2xl border border-gold-500/15 bg-obsidian-card hover:border-gold-500/40 transition-all p-5 flex flex-col justify-between group shadow-lg space-y-4"
              >
                <div className="relative w-full h-64 rounded-xl overflow-hidden bg-obsidian-dark">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-2 right-2 bg-obsidian/90 px-3 py-1 rounded-full border border-gold-500/30 font-mono text-sm font-bold text-gold-400">
                    ${(item.price / 100).toFixed(2)}
                  </div>
                </div>

                <div>
                  <h3 className="font-heading text-lg font-bold text-white group-hover:text-gold-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-white/60 line-clamp-2 mt-1">
                    {item.description}
                  </p>
                </div>

                <Link href="/shop">
                  <Button className="w-full bg-gold-500/20 hover:bg-gold-500 text-gold-300 hover:text-obsidian border border-gold-500/40 text-xs font-bold uppercase tracking-wider">
                    View & Order Drop
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* In-Feed Native Sponsor Ad */}
      <AdSpace placement="article_inline" />

      {/* ── 2. FEATURED EVENTS SHOWCASE (LIVE DB DRIVEN) ── */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 text-xs font-mono font-bold uppercase tracking-widest mb-2">
              <Flame className="w-3.5 h-3.5 text-gold-400" />
              UPCOMING FETES & EXPERIENCES
            </div>
            <h2 className="text-3xl md:text-5xl font-heading font-extrabold uppercase tracking-tight text-white">
              LIVE <span className="gold-gradient-text">SCHEDULE</span>
            </h2>
          </div>
          <Link href="/events">
            <Button variant="outline" className="glass-obsidian border-gold-500/30 text-gold-300 hover:text-white rounded-xl uppercase text-xs tracking-wider font-bold">
              View Complete Schedule
              <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>

        {eventsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-96 rounded-2xl glass-obsidian animate-pulse p-4 space-y-4">
                <Skeleton className="h-56 w-full rounded-xl bg-white/5" />
                <Skeleton className="h-6 w-3/4 bg-white/10" />
                <Skeleton className="h-4 w-1/2 bg-white/5" />
              </div>
            ))}
          </div>
        ) : featuredEvents && featuredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <EventCard key={event.id} event={event} onGetTicket={handleGetTicket} />
            ))}
          </div>
        ) : (
          /* Live Empty State with VIP Early Access Drop Form */
          <div className="glass-obsidian-strong border-2 border-gold-500/30 rounded-3xl p-8 md:p-12 text-center max-w-3xl mx-auto shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-gold-500/15 border border-gold-500/30 text-gold-400 flex items-center justify-center mx-auto mb-5">
              <Bell className="w-8 h-8 animate-pulse" />
            </div>

            <span className="text-[10px] uppercase font-mono tracking-widest text-gold-400 font-bold block mb-2">
              SCHEDULE ANNOUNCEMENT IMMINENT
            </span>
            <h3 className="text-2xl md:text-3xl font-heading font-extrabold uppercase text-white mb-3">
              CARNIVAL SEASON 2026 SCHEDULE DROPPING
            </h3>
            <p className="text-sm text-white/70 max-w-xl mx-auto mb-6 leading-relaxed">
              We are finalizing the official dates for our next luxury Caribbean night, boat ride, and gala series. Join the VIP notification list to get 48-hour early presale access and instant loyalty credits.
            </p>

            {isSubscribed ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs">
                <CheckCircle2 className="w-4 h-4" />
                You're on the VIP list! Presale notifications will be dispatched to {notifyEmail}.
              </div>
            ) : (
              <form onSubmit={handleSubscribeAlert} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="Enter your email for presale alerts..."
                  className="bg-white/5 border-white/15 text-sm text-white placeholder:text-white/40 rounded-xl h-11"
                />
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 text-black font-bold uppercase tracking-wider text-xs px-6 h-11 rounded-xl shadow-lg shadow-gold-500/20 flex-shrink-0"
                >
                  Get Notified
                </Button>
              </form>
            )}
          </div>
        )}
      </section>

      {/* ── 3. SOCA PASSPORT 1.0 SPOTLIGHT ── */}
      <section className="relative rounded-3xl overflow-hidden border border-gold-500/30 bg-gradient-to-br from-obsidian via-obsidian-light to-obsidian p-8 md:p-14 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/15 text-gold-400 border border-gold-500/30 text-xs font-mono font-bold uppercase tracking-widest">
              <Compass className="w-3.5 h-3.5 text-gold-400" />
              GLOBAL CARNIVAL LOYALTY SYSTEM
            </div>

            <h2 className="text-4xl md:text-5xl font-heading font-extrabold uppercase text-white leading-tight">
              YOUR <span className="gold-gradient-text">SOCA PASSPORT</span> IS WAITING
            </h2>

            <p className="text-white/70 text-base md:text-lg leading-relaxed">
              Every fete unlocks your journey. Check-in at events to collect authentic gold-debossed country stamps, rack up credits on the atomic ledger, and claim instant VIP discounts, merch passes, and backstage wristbands.
            </p>

            {/* Passport Tier Progress Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl glass-obsidian border border-white/10 text-center">
                <span className="text-[10px] text-white/50 font-mono uppercase block">BRONZE</span>
                <span className="text-xs font-bold text-white">0-499 pts</span>
              </div>
              <div className="p-3 rounded-xl glass-obsidian border border-white/10 text-center">
                <span className="text-[10px] text-white/50 font-mono uppercase block">SILVER</span>
                <span className="text-xs font-bold text-white">500-1,499 pts</span>
              </div>
              <div className="p-3 rounded-xl glass-obsidian border border-gold-500/40 text-center">
                <span className="text-[10px] text-gold-400 font-mono uppercase block">GOLD</span>
                <span className="text-xs font-bold text-gold-300">1,500-3,499 pts</span>
              </div>
              <div className="p-3 rounded-xl glass-obsidian border border-amber-400 text-center bg-gold-500/10">
                <span className="text-[10px] text-amber-300 font-mono uppercase block font-bold">ELITE VIP</span>
                <span className="text-xs font-bold text-amber-300">3,500+ pts</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => navigate('/passport')}
                className="bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-black font-bold uppercase tracking-widest text-sm px-8 py-6 rounded-2xl shadow-xl shadow-gold-500/20"
              >
                OPEN PASSPORT DASHBOARD
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/passport-promoters')}
                className="glass-obsidian border-white/20 text-white hover:text-gold-300 rounded-2xl uppercase tracking-widest text-sm px-6 py-6"
              >
                PROMOTER PARTNER TIER
              </Button>
            </div>
          </div>

          {/* 3D Visual Passport Card Showcase */}
          <div className="relative flex justify-center">
            <div className="w-full max-w-sm passport-leather rounded-2xl p-6 shadow-2xl relative overflow-hidden transform lg:rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gold-500/30">
                <div className="flex items-center gap-2">
                  <img src={SGFlyerLogoPng} alt="SG" className="w-8 h-8 object-contain" />
                  <span className="font-heading font-bold text-sm tracking-widest text-gold-300 uppercase">SOCA PASSPORT</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/40">
                  OFFICIAL PASS
                </span>
              </div>

              {/* Stamps Preview */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="passport-stamp-gold p-3 rounded-xl text-center">
                  <span className="text-xl block mb-0.5">🇹🇹</span>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase block">TRINIDAD</span>
                  <span className="text-[9px] text-white/60">CARNIVAL '26</span>
                </div>
                <div className="passport-stamp-gold p-3 rounded-xl text-center">
                  <span className="text-xl block mb-0.5">🇧🇧</span>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase block">BARBADOS</span>
                  <span className="text-[9px] text-white/60">CROP OVER</span>
                </div>
                <div className="passport-stamp-gold p-3 rounded-xl text-center">
                  <span className="text-xl block mb-0.5">🇯🇲</span>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase block">JAMAICA</span>
                  <span className="text-[9px] text-white/60">SUMFEST</span>
                </div>
                <div className="passport-stamp-gold p-3 rounded-xl text-center">
                  <span className="text-xl block mb-0.5">🇺🇸</span>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase block">MIAMI</span>
                  <span className="text-[9px] text-white/60">CARNIVAL</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-gold-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono text-white/50 uppercase block">CURRENT BALANCE</span>
                  <span className="text-lg font-bold text-gold-400">3,850 CREDITS</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">ELITE STATUS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. THE VOID // CREATOR AI STUDIO & APPS (WITH FETEID DECODER) ── */}
      <section className="relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-obsidian via-obsidian-dark to-obsidian p-8 md:p-12 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold uppercase tracking-widest mb-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              AUTONOMOUS CREATOR LAB
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-extrabold uppercase text-white">
              THE VOID // <span className="cyan-gradient-text">APPS MATRIX</span>
            </h2>
            <p className="text-white/60 text-sm mt-1">Autonomous audio decoders, AI motion flyers, and interactive engines built for Caribbean nightlife.</p>
          </div>
          <Link href="/apps">
            <Button className="bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black font-bold uppercase tracking-wider text-xs rounded-xl px-5 py-2.5 border border-cyan-400/40">
              Explore All Apps
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            onClick={() => navigate('/apps/itssoca-decoder')}
            className="p-5 rounded-2xl glass-obsidian border border-cyan-500/40 hover:border-cyan-400 transition-all cursor-pointer group bg-gradient-to-b from-cyan-950/20 to-obsidian"
          >
            <div className="text-3xl mb-3">🎧</div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">itsSOCA DECODER</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">Riddim AI</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed mb-4">Stem separation, riddim matching & 1-click Serato / Rekordbox crate sync.</p>
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              Launch Decoder &rarr;
            </span>
          </div>

          <div
            onClick={() => navigate('/apps/language-sensei')}
            className="p-5 rounded-2xl glass-obsidian border border-red-500/30 hover:border-red-400 transition-all cursor-pointer group"
          >
            <div className="text-3xl mb-3">⛩️</div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-sm font-bold text-white group-hover:text-red-300 transition-colors">Language Sensei</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">AI Tutor</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed mb-4">3-layer conversational Japanese learning with kanji and romaji translation.</p>
            <span className="text-xs font-bold text-red-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              Start Lesson &rarr;
            </span>
          </div>

          <div
            onClick={() => navigate('/apps/savage-physics')}
            className="p-5 rounded-2xl glass-obsidian border border-emerald-500/30 hover:border-emerald-400 transition-all cursor-pointer group"
          >
            <div className="text-3xl mb-3">⚛️</div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Savage Physics</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">Sandbox</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed mb-4">Interactive antigravity physics playground. Type burdens and blast them away.</p>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              Engage Sandbox &rarr;
            </span>
          </div>

          <div
            onClick={() => window.open("https://survival-map-36664345587.us-central1.run.app/", "_blank")}
            className="p-5 rounded-2xl glass-obsidian border border-teal-500/30 hover:border-teal-400 transition-all cursor-pointer group"
          >
            <div className="text-3xl mb-3">🗺️</div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">Survival Map</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">PDF Tool</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed mb-4">Personalized emergency preparedness maps and printable survival guides.</p>
            <span className="text-xs font-bold text-teal-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              Generate Map &rarr;
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
