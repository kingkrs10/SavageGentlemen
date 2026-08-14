import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Compass,
  Search,
  Sparkles,
  Flame,
  Clock,
  Heart,
  Share2,
  ArrowUpRight,
  Music,
  Wine,
  Shirt,
  Volume2,
  Calendar,
  Eye,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import SEOHead from "@/components/SEOHead";
import { AdSpace } from "@/components/home/AdSpace";
import { useToast } from "@/hooks/use-toast";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import SGFlyerLogoPng from "@/assets/SGFLYERLOGO.png";

interface Article {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  featuredImage?: string;
  author?: string;
  tags?: string[];
  readTime?: string;
  views: number;
  likes: number;
  isFeatured: boolean;
  publishedAt: string;
}

const CATEGORIES = [
  { id: "all", label: "All Stories", icon: Sparkles },
  { id: "nightlife", label: "Nightlife & Fetes", icon: Flame },
  { id: "music", label: "Sound & Riddims", icon: Music },
  { id: "style", label: "Style & Drip", icon: Shirt },
  { id: "cocktails", label: "Rum & Barology", icon: Wine },
  { id: "culture", label: "Culture & Diaspora", icon: Compass },
];

export default function Magazine() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { playTrack } = useAudioPlayer();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: [`/api/magazine/articles?category=${selectedCategory}`],
    queryFn: async () => {
      const url = selectedCategory === "all"
        ? "/api/magazine/articles"
        : `/api/magazine/articles?category=${selectedCategory}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch articles");
      return res.json();
    },
  });

  const featuredArticle = articles.find(a => a.isFeatured) || articles[0];
  const gridArticles = articles.filter(a => a.id !== featuredArticle?.id);

  const filteredArticles = gridArticles.filter(article => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(q) ||
      article.summary.toLowerCase().includes(q) ||
      article.category.toLowerCase().includes(q) ||
      article.tags?.some(t => t.toLowerCase().includes(q))
    );
  });

  const handlePlaySoundtrack = () => {
    playTrack({
      id: "savgent-oct-25",
      title: "Savage Gentlemen Caribbean Nocturne Vol. 1",
      artist: "Savage Gentlemen Curated Sound",
      src: "/attached_assets/savgent-oct-25-mix.m4v",
      artwork: SGFlyerLogoPng,
      price: 199,
    });
    toast({
      title: "Audio Dock Active",
      description: "Now streaming official Caribbean Nocturne soundtrack.",
    });
  };

  return (
    <div className="min-h-screen space-y-12 pb-24 text-white">
      <SEOHead
        title="Savage Magazine | Caribbean Nightlife, Sound, Rum & High Style"
        description="The premier digital editorial for luxury Caribbean nightlife, sound system culture, aged rums, and diaspora fashion."
      />

      {/* Top Header Sponsor Ticker */}
      <AdSpace placement="header_ticker" />

      {/* ── 1. MAGAZINE HERO BANNER ── */}
      <section className="relative pt-6 pb-2">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gold-500/20 pb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-mono font-bold uppercase tracking-widest mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                The Nocturne Dispatch
              </div>
              <h1 className="font-heading text-4xl md:text-6xl font-bold gold-gradient-text uppercase tracking-tight">
                Savage Magazine
              </h1>
              <p className="text-white/60 text-sm md:text-base max-w-2xl mt-2 font-light">
                High-octane dispatches from the global Caribbean nightlife circuit: sound system evolutions, luxury fete itineraries, vintage pot-still rums, and runway streetwear.
              </p>
            </div>

            {/* Quick Soundtrack Audio Pill */}
            <Button
              onClick={handlePlaySoundtrack}
              className="bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/40 text-gold-300 font-mono text-xs uppercase tracking-wider gap-2 shrink-0 h-11 px-5 shadow-[0_0_20px_rgba(229,169,60,0.15)]"
            >
              <Volume2 className="w-4 h-4 text-gold-400 animate-bounce" />
              Stream Magazine Soundtrack
            </Button>
          </div>
        </div>
      </section>

      {/* ── 2. FEATURED COVER STORY (HERO) ── */}
      {featuredArticle && !searchQuery && (
        <section className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden border border-gold-500/30 bg-obsidian-card shadow-2xl group">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
              {/* Featured Image */}
              <div className="lg:col-span-7 relative h-72 lg:h-full overflow-hidden bg-obsidian-dark">
                <img
                  src={featuredArticle.featuredImage || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=800&fit=crop"}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent lg:hidden" />
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-gold-500 text-obsidian font-mono uppercase font-bold text-xs px-3 py-1 shadow-lg">
                    Cover Story
                  </Badge>
                </div>
              </div>

              {/* Story Content */}
              <div className="lg:col-span-5 p-6 md:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs font-mono text-white/50">
                    <span className="text-gold-400 uppercase tracking-widest font-semibold">{featuredArticle.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {featuredArticle.readTime || "4 min read"}</span>
                  </div>

                  <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-white group-hover:text-gold-300 transition-colors leading-tight">
                    {featuredArticle.title}
                  </h2>

                  <p className="text-white/70 text-sm md:text-base leading-relaxed line-clamp-4">
                    {featuredArticle.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-xs font-bold text-gold-400">
                      SG
                    </div>
                    <span className="text-xs text-white/70 font-medium">{featuredArticle.author || "Savage Editorial"}</span>
                  </div>

                  <Link href={`/magazine/${featuredArticle.slug}`}>
                    <Button className="bg-gold-500 hover:bg-gold-400 text-obsidian font-bold gap-2 text-xs uppercase tracking-wider shadow-lg">
                      Read Full Story
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. CATEGORY FILTERS & SEARCH BAR ── */}
      <section className="container mx-auto px-4 sticky top-16 md:top-20 z-30 py-3 backdrop-blur-xl bg-obsidian-dark/80 border-y border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-mono font-semibold uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-gold-500 text-obsidian shadow-md font-bold"
                      : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-obsidian" : "text-gold-400"}`} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search stories, riddims, style..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-obsidian-card/90 border-white/15 text-xs text-white placeholder:text-white/40 rounded-full h-9 focus:border-gold-500"
            />
          </div>
        </div>
      </section>

      {/* ── 4. ARTICLES GRID & NATIVE ADS ── */}
      <section className="container mx-auto px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="rounded-2xl border border-white/10 bg-obsidian-card p-4 space-y-4">
                <Skeleton className="w-full h-48 rounded-xl bg-white/5" />
                <Skeleton className="w-1/3 h-4 bg-white/5" />
                <Skeleton className="w-full h-6 bg-white/5" />
                <Skeleton className="w-2/3 h-4 bg-white/5" />
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-20 text-center space-y-4 border border-white/10 rounded-2xl bg-obsidian-card">
            <Compass className="w-12 h-12 text-gold-400/50 mx-auto" />
            <h3 className="text-xl font-bold text-white">No Stories Found</h3>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              No articles match your selected filter or query. The autonomous magazine bot runs every 6 hours to fetch fresh dispatches.
            </p>
            <Button
              onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}
              variant="outline"
              className="border-gold-500/40 text-gold-300"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredArticles.map((article, index) => (
                <div
                  key={article.id}
                  className="rounded-2xl border border-gold-500/15 bg-obsidian-card hover:border-gold-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-lg"
                >
                  {/* Article Thumbnail */}
                  <div className="relative w-full h-52 overflow-hidden bg-obsidian-dark">
                    <img
                      src={article.featuredImage || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=500&fit=crop"}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full bg-obsidian/85 backdrop-blur-md border border-gold-500/30 text-[10px] font-mono font-bold uppercase tracking-wider text-gold-300">
                        {article.category}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-white/40">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readTime || "3 min read"}</span>
                        <span>•</span>
                        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                      </div>

                      <h3 className="font-heading text-lg font-bold text-white group-hover:text-gold-300 transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h3>

                      <p className="text-xs text-white/60 line-clamp-3 leading-relaxed">
                        {article.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[11px] text-white/40 font-medium">
                        By {article.author || "Savage Editorial"}
                      </span>

                      <Link href={`/magazine/${article.slug}`}>
                        <span className="text-xs font-mono font-bold text-gold-400 group-hover:text-gold-300 inline-flex items-center gap-1">
                          Read Story <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Native In-Feed Sponsor Ad Placement */}
            <AdSpace placement="article_inline" />
          </div>
        )}
      </section>
    </div>
  );
}
