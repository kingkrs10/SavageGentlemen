import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useRoute, useLocation } from "wouter";
import {
  ArrowLeft,
  Clock,
  Heart,
  Share2,
  Volume2,
  Sparkles,
  Bookmark,
  Check,
  Calendar,
  Eye,
  ExternalLink,
  Flame,
  Twitter,
  Instagram
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import SEOHead from "@/components/SEOHead";
import { AdSpace } from "@/components/home/AdSpace";
import { useToast } from "@/hooks/use-toast";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import SGFlyerLogoPng from "@/assets/SGFLYERLOGO.png";
import { cleanTitle, cleanCaption } from "@shared/text-sanitizer";

interface Article {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  featuredImage?: string;
  sourceUrl?: string;
  sourceName?: string;
  author?: string;
  tags?: string[];
  readTime?: string;
  views: number;
  likes: number;
  isFeatured: boolean;
  publishedAt: string;
}

export default function ArticleDetail() {
  const [, params] = useRoute("/magazine/:slug");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { playTrack } = useAudioPlayer();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const slug = params?.slug;

  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: [`/api/magazine/articles/${slug}`],
    queryFn: async () => {
      if (!slug) throw new Error("Missing slug");
      const res = await fetch(`/api/magazine/articles/${slug}`);
      if (!res.ok) throw new Error("Article not found");
      return res.json();
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (article) {
      setLikeCount(article.likes || 0);
    }
  }, [article]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!article) return;
      await fetch(`/api/magazine/articles/${article.id}/like`, { method: "POST" });
    },
    onSuccess: () => {
      setLiked(true);
      setLikeCount(prev => prev + 1);
      toast({ title: "Story Liked", description: "Thanks for supporting Savage Gentlemen culture." });
    },
  });

  const handleCopyShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({ title: "Link Copied", description: "Share this story on your social channels." });
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePlaySoundtrack = () => {
    playTrack({
      id: `article-${article?.id || "stream"}`,
      title: `${article?.title || "Caribbean Nocturne"} Sound Mix`,
      artist: "Savage Gentlemen Curated Sound",
      src: "/attached_assets/savgent-oct-25-mix.m4v",
      artwork: article?.featuredImage || SGFlyerLogoPng,
      price: 199,
    });
    toast({
      title: "Audio Dock Active",
      description: "Now streaming official companion mix while reading.",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl space-y-6">
        <Skeleton className="w-32 h-6 bg-white/5 rounded-full" />
        <Skeleton className="w-full h-12 bg-white/5 rounded-xl" />
        <Skeleton className="w-full h-96 bg-white/5 rounded-3xl" />
        <Skeleton className="w-full h-40 bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Story Not Found</h2>
        <p className="text-white/60 text-sm">This editorial dispatch may have been moved or updated.</p>
        <Button onClick={() => navigate("/magazine")} className="bg-gold-500 text-obsidian font-bold">
          Back to Magazine
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 text-white">
      <SEOHead
        title={`${cleanTitle(article.title)} | Savage Magazine`}
        description={cleanCaption(article.summary)}
      />

      {/* Top Header Sponsor Ticker */}
      <AdSpace placement="header_ticker" />

      {/* ── 1. ARTICLE HEADER & HERO ── */}
      <article className="container mx-auto px-4 max-w-5xl pt-8 space-y-8">
        {/* Navigation & Controls Bar */}
        <div className="flex items-center justify-between gap-4">
          <Link href="/magazine">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white gap-2 font-mono text-xs">
              <ArrowLeft className="w-4 h-4" />
              Back to Magazine
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePlaySoundtrack}
              size="sm"
              className="bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 border border-gold-500/40 text-xs font-mono gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5 text-gold-400" />
              Play Mix
            </Button>
            <Button
              onClick={handleCopyShare}
              variant="outline"
              size="sm"
              className="border-white/15 text-white/80 hover:text-white text-xs gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Share"}
            </Button>
          </div>
        </div>

        {/* Title & Metadata */}
        <div className="space-y-4 text-left">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-gold-500 text-obsidian font-mono uppercase font-bold text-xs px-3 py-1">
              {article.category}
            </Badge>
            <span className="text-xs font-mono text-white/50 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {article.readTime || "4 min read"}
            </span>
            <span className="text-xs font-mono text-white/50">•</span>
            <span className="text-xs font-mono text-white/50 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {new Date(article.publishedAt).toLocaleDateString()}
            </span>
          </div>

          <h1 className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            {cleanTitle(article.title)}
          </h1>

          <p className="text-white/70 text-lg md:text-xl font-light leading-relaxed border-l-2 border-gold-500/40 pl-4">
            {cleanCaption(article.summary)}
          </p>

          {/* Author Badge */}
          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center font-bold text-gold-400">
              SG
            </div>
            <div>
              <span className="text-sm font-semibold text-white block">{article.author || "Savage Editorial"}</span>
              <span className="text-xs text-white/50">Caribbean Nocturne Culture Bureau</span>
            </div>
          </div>
        </div>

        {/* Featured Banner Image */}
        {article.featuredImage && (
          <div className="relative w-full h-[400px] md:h-[550px] rounded-3xl overflow-hidden border border-gold-500/20 shadow-2xl">
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full h-full object-cover filter brightness-95"
            />
          </div>
        )}

        {/* ── 2. EDITORIAL BODY CONTENT & SIDEBAR ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-6">
          {/* Main Article Text */}
          <div className="lg:col-span-8 space-y-8 text-left">
            <div className="prose prose-invert prose-gold max-w-none text-white/80 leading-relaxed text-base md:text-lg space-y-6">
              {article.content.split("\n\n").map((paragraph, idx) => {
                if (paragraph.startsWith("# ")) {
                  return (
                    <h2 key={idx} className="font-heading text-2xl md:text-3xl font-bold text-white pt-4 pb-2 border-b border-white/10">
                      {paragraph.replace("# ", "")}
                    </h2>
                  );
                }
                if (paragraph.startsWith("### ")) {
                  return (
                    <h3 key={idx} className="font-heading text-xl md:text-2xl font-bold text-gold-300 pt-3">
                      {paragraph.replace("### ", "")}
                    </h3>
                  );
                }
                if (paragraph.startsWith("> ")) {
                  return (
                    <blockquote key={idx} className="border-l-4 border-gold-500 pl-4 py-2 my-4 italic text-gold-200 bg-gold-500/5 rounded-r-xl">
                      {paragraph.replace("> ", "")}
                    </blockquote>
                  );
                }
                return (
                  <p key={idx} className="leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* In-Article Sponsor Ad Placement */}
            <AdSpace placement="article_inline" />

            {/* Article Action Footer */}
            <div className="p-6 rounded-2xl border border-white/10 bg-obsidian-card flex flex-wrap items-center justify-between gap-4 mt-12">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => likeMutation.mutate()}
                  variant="outline"
                  size="sm"
                  className={`border-gold-500/40 gap-2 text-xs font-mono font-bold ${
                    liked ? "bg-red-500/20 text-red-400 border-red-500/40" : "text-gold-300 hover:bg-gold-500/10"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${liked ? "fill-red-400 text-red-400" : "text-gold-400"}`} />
                  {likeCount} Likes
                </Button>

                <Button
                  onClick={handleCopyShare}
                  variant="outline"
                  size="sm"
                  className="border-white/15 text-white/80 hover:text-white text-xs gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share Story
                </Button>
              </div>

              {article.sourceUrl && (
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-white/40 hover:text-gold-400 inline-flex items-center gap-1 transition-colors"
                >
                  Original Source: {article.sourceName || "Web"} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Sidebar Sponsor Ad */}
            <AdSpace placement="article_sidebar" />

            {/* Streetwear Shop Promo Card */}
            <div className="rounded-2xl border border-gold-500/30 bg-gradient-to-b from-obsidian-card to-obsidian p-5 space-y-4 text-left shadow-xl">
              <span className="px-2 py-0.5 rounded-full bg-gold-500 text-obsidian text-[10px] font-mono font-bold uppercase tracking-wider">
                Official Drop
              </span>
              <h4 className="font-heading text-lg font-bold text-white">Savage Nocturne Streetwear</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                480 GSM Heavyweight French Terry hoodies, soundclash graphic tees, and embroidered dad hats. Manufactured on demand with zero waste.
              </p>
              <Link href="/shop">
                <Button className="w-full bg-gold-500 hover:bg-gold-400 text-obsidian font-bold text-xs uppercase tracking-wider">
                  Shop Streetwear Collection
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
