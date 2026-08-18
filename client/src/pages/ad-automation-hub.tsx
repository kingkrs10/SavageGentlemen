import { useState, useEffect, useRef } from "react";
import { 
  Film, 
  Sparkles, 
  Share2, 
  Play, 
  Pause, 
  Download, 
  RefreshCw, 
  Check, 
  ExternalLink, 
  Layers, 
  Video, 
  ShoppingBag, 
  Calendar, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  SlidersHorizontal,
  Flame,
  Globe,
  Radio,
  Zap,
  Ticket,
  Music,
  Crown,
  LayoutTemplate,
  MonitorPlay,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEOHead from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CatalogItem {
  id: string;
  type: "merch" | "event" | "passport" | "media" | "promoter";
  title: string;
  category: string;
  priceFormatted: string;
  description: string;
  imageUrl: string;
  suggestedHook: string;
  suggestedCaption: string;
  productLink: string;
  defaultPlacement?: string;
}

interface ViralHookCategory {
  category: string;
  label: string;
  hooks: string[];
}

interface GeneratedVideo {
  videoUrl: string;
  filePath: string;
  duration: number;
  width: number;
  height: number;
  aspectRatio: string;
  stylePreset: string;
  title: string;
  createdAt: string;
}

interface PublishResult {
  platform: string;
  status: string;
  postId?: string;
  postUrl?: string;
  message?: string;
  error?: string;
}

export default function AdAutomationHub() {
  const [catalog, setCatalog] = useState<{
    merch: CatalogItem[];
    events: CatalogItem[];
    passport: CatalogItem[];
    media: CatalogItem[];
    promoter: CatalogItem[];
    viralHooks: ViralHookCategory[];
  }>({
    merch: [],
    events: [],
    passport: [],
    media: [],
    promoter: [],
    viralHooks: []
  });

  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [activeCatalogTab, setActiveCatalogTab] = useState<string>("merch");
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");
  const [stylePreset, setStylePreset] = useState<"dark-luxury" | "caribbean-energy" | "streetwear-bold" | "fete-fomo">("dark-luxury");
  const [targetPlacement, setTargetPlacement] = useState<string>("header_ticker");
  
  const [customCaption, setCustomCaption] = useState("");
  const [customCta, setCustomCta] = useState("SHOP NOW • SAVAGEGENTLEMEN.COM");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [history, setHistory] = useState<GeneratedVideo[]>([]);
  
  // Platform distribution selection
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, boolean>>({
    instagram: true,
    facebook: true,
    youtube: true,
    tiktok: true,
  });

  const [publishResults, setPublishResults] = useState<PublishResult[] | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Load catalog on mount
  useEffect(() => {
    fetchCatalog();
    fetchHistory();
  }, []);

  const fetchCatalog = async () => {
    try {
      const res = await apiRequest("GET", "/api/ad-automation/catalog");
      if (res.ok) {
        const data = await res.json();
        setCatalog(data);
        if (data.merch && data.merch.length > 0) {
          selectItem(data.merch[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load catalog:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await apiRequest("GET", "/api/ad-automation/history");
      if (res.ok) {
        const data = await res.json();
        if (data.videos) setHistory(data.videos);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const selectItem = (item: CatalogItem) => {
    setSelectedItem(item);
    setCustomCaption(`${item.suggestedHook}\n\n${item.suggestedCaption}\n\n#SavageGentlemen #CaribbeanCulture #LuxuryStreetwear`);
    
    let defaultCta = "SHOP NOW • SAVAGEGENTLEMEN.COM";
    if (item.type === "event") defaultCta = "GET TICKETS • SAVAGEGENTLEMEN.COM";
    if (item.type === "passport") defaultCta = "CLAIM 100 FREE POINTS";
    if (item.type === "media") defaultCta = "UNLOCK HQ STEMS ($1.99)";
    if (item.type === "promoter") defaultCta = "START 90-DAY TRIAL";
    
    setCustomCta(defaultCta);
    if (item.defaultPlacement) setTargetPlacement(item.defaultPlacement);
    setPublishResults(null);
  };

  const applyViralHook = (hook: string) => {
    if (!selectedItem) return;
    setCustomCaption(`${hook}\n\n${selectedItem.description}\n\n👉 Experience it at: ${selectedItem.productLink}\n\n#SavageGentlemen #CaribbeanCulture #Carnival2026 #VIP`);
    toast({
      title: "🔥 Viral Hook Applied",
      description: "Updated caption with high-converting hook formula.",
    });
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }));
  };

  const handleGenerateVideo = async () => {
    if (!selectedItem) return;
    setIsGenerating(true);
    setPublishResults(null);

    toast({
      title: `Compiling ${aspectRatio} Video Ad...`,
      description: `Rendering high-res media, ${stylePreset} theme, and rhythmic audio pulse via FFmpeg.`,
    });

    try {
      const res = await apiRequest("POST", "/api/ad-automation/generate", {
        id: selectedItem.id,
        title: selectedItem.title,
        category: selectedItem.category,
        priceFormatted: selectedItem.priceFormatted,
        description: selectedItem.description,
        imageUrl: selectedItem.imageUrl,
        ctaText: customCta,
        stylePreset: stylePreset,
        aspectRatio: aspectRatio,
        durationSeconds: 12,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Generation failed");
      }

      const videoData: GeneratedVideo = await res.json();
      setGeneratedVideo(videoData);
      setHistory((prev) => [videoData, ...prev]);

      toast({
        title: `✨ ${aspectRatio} Video Ad Ready!`,
        description: `Lossless MP4 created for ${selectedItem.title}.`,
      });
    } catch (err: any) {
      console.error("Ad generation error:", err);
      toast({
        title: "Render Error",
        description: err.message || "Failed to generate video ad.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeployToSite = async () => {
    if (!selectedItem) return;
    setIsDeploying(true);

    try {
      const res = await apiRequest("POST", "/api/ad-automation/deploy-to-site", {
        title: selectedItem.title,
        description: selectedItem.description,
        placement: targetPlacement,
        linkUrl: selectedItem.productLink,
        ctaText: customCta,
        imageUrl: selectedItem.imageUrl,
        price: selectedItem.priceFormatted,
        type: selectedItem.type === "event" ? "event" : selectedItem.type === "merch" ? "product" : "banner",
        priority: 100,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to deploy ad");
      }

      const data = await res.json();
      toast({
        title: "🚀 Live on SavageGentlemen Site!",
        description: `Ad is now active in the [${targetPlacement}] placement slot.`,
      });
    } catch (err: any) {
      toast({
        title: "Deployment Error",
        description: err.message || "Failed to deploy ad to website.",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handlePublishAll = async () => {
    if (!generatedVideo && !selectedItem) return;
    const targetPlatforms = Object.keys(selectedPlatforms).filter((p) => selectedPlatforms[p]) as any[];

    if (targetPlatforms.length === 0) {
      toast({
        title: "No Platforms Selected",
        description: "Please choose at least one social media channel.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    const videoUrl = generatedVideo?.videoUrl || "/generated-ads/sample_ad.mp4";

    try {
      const res = await apiRequest("POST", "/api/ad-automation/publish", {
        videoUrl,
        caption: customCaption,
        platforms: targetPlatforms,
        title: selectedItem?.title,
        productLink: selectedItem?.productLink,
        hashtags: ["#SavageGentlemen", "#LuxuryStreetwear", "#CaribbeanCulture", "#CarnivalVibes"],
        isTestMode: false,
      });

      const data = await res.json();
      setPublishResults(data.results || []);

      toast({
        title: "🚀 Broadcast Dispatched!",
        description: `Dispatched to ${targetPlatforms.length} social platforms.`,
      });
    } catch (err: any) {
      toast({
        title: "Publishing Error",
        description: err.message || "Failed to broadcast to social platforms.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Savage Ad Studio AI - High Traffic Viral Ads & Creative Hub"
        description="Autonomous viral video ad generation, live site banner deployment, and omnichannel social media distribution for Savage Gentlemen."
      />

      <div className="space-y-10 py-6 md:py-10 max-w-7xl mx-auto px-4">
        {/* ── HERO BANNER ── */}
        <div className="glass-obsidian-strong border border-gold-500/30 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-gold-500 to-yellow-300 flex items-center justify-center text-black font-bold shadow-lg shadow-gold-500/25">
                <Flame className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-gold-500/15 text-gold-300 border border-gold-500/30 text-[10px] font-mono uppercase font-bold tracking-widest mb-1">
                  <Sparkles className="w-3 h-3 text-gold-400" />
                  HIGH-TRAFFIC VIRAL AD ENGINE
                </div>
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
                  Savage Ad Studio AI
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Generate High-Converting Video Ads, Deploy Live Website Banners, and Broadcast Across Instagram Reels, TikTok & Shorts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Ad Network Active
              </Badge>
            </div>
          </div>

          {/* ── MAIN STUDIO GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
            
            {/* ── LEFT COLUMN: CAMPAIGN CONTROLS (7 COLS) ── */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* 1. Product / Campaign Pillar Selector */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gold-400 uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" /> 1. Select Campaign Pillar
                  </h2>
                  <span className="text-[11px] font-mono text-gray-400">
                    {selectedItem ? selectedItem.category : "Choose an offer"}
                  </span>
                </div>

                <Tabs value={activeCatalogTab} onValueChange={setActiveCatalogTab} className="w-full">
                  <TabsList className="bg-white/5 border border-white/10 w-full grid grid-cols-5 mb-4 text-xs">
                    <TabsTrigger value="merch" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black font-semibold text-[11px]">
                      Merch ({catalog.merch.length})
                    </TabsTrigger>
                    <TabsTrigger value="events" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black font-semibold text-[11px]">
                      Events ({catalog.events.length})
                    </TabsTrigger>
                    <TabsTrigger value="passport" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black font-semibold text-[11px]">
                      Passport ({catalog.passport.length})
                    </TabsTrigger>
                    <TabsTrigger value="media" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black font-semibold text-[11px]">
                      Mixes ({catalog.media.length})
                    </TabsTrigger>
                    <TabsTrigger value="promoter" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black font-semibold text-[11px]">
                      Promoter ({catalog.promoter.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab Contents */}
                  {["merch", "events", "passport", "media", "promoter"].map((tabKey) => {
                    const items = (catalog as any)[tabKey] as CatalogItem[];
                    return (
                      <TabsContent key={tabKey} value={tabKey} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                          {items && items.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => selectItem(item)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                                selectedItem?.id === item.id
                                  ? "bg-gold-500/15 border-gold-500 text-white shadow-md shadow-gold-500/10"
                                  : "bg-white/5 border-white/10 hover:border-white/20 text-gray-300"
                              }`}
                            >
                              <img src={item.imageUrl} alt={item.title} className="w-12 h-12 object-cover rounded-lg shrink-0 border border-white/10" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold truncate text-white">{item.title}</p>
                                <p className="text-[11px] text-gold-400 font-mono">{item.priceFormatted}</p>
                              </div>
                              {selectedItem?.id === item.id && <Check className="w-4 h-4 text-gold-400 shrink-0" />}
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>

              {/* 2. Viral Hooks Matrix Library */}
              <div className="bg-black/40 border border-gold-500/20 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gold-400 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" /> 2. High-Converting Viral Hooks Matrix
                  </h2>
                  <span className="text-[10px] text-amber-400/80 font-mono">1-Click Apply</span>
                </div>
                <p className="text-xs text-gray-400">
                  Select a tested hook formula to grab attention in the first 2 seconds:
                </p>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {catalog.viralHooks && catalog.viralHooks.map((cat, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400/70">{cat.label}</span>
                      <div className="grid grid-cols-1 gap-1.5">
                        {cat.hooks.map((hk, hIdx) => (
                          <button
                            key={hIdx}
                            type="button"
                            onClick={() => applyViralHook(hk)}
                            className="text-left text-xs p-2 rounded-lg bg-white/5 hover:bg-gold-500/10 border border-white/10 hover:border-gold-500/40 text-gray-200 transition-all flex items-center justify-between group"
                          >
                            <span className="truncate mr-2 font-medium">{hk}</span>
                            <Copy className="w-3 h-3 text-gold-400 opacity-0 group-hover:opacity-100 shrink-0 transition" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Visual Styling & Aspect Ratio */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gold-400 uppercase tracking-wider flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" /> 3. Video Format & Aesthetic Style
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAspectRatio("9:16")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      aspectRatio === "9:16"
                        ? "bg-gold-500/20 border-gold-500 text-gold-300 shadow-sm"
                        : "bg-white/5 border-white/10 text-gray-400"
                    }`}
                  >
                    <p className="text-xs font-bold">9:16 Vertical Reel</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">TikTok, Reels, Shorts (1080x1920)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAspectRatio("16:9")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      aspectRatio === "16:9"
                        ? "bg-gold-500/20 border-gold-500 text-gold-300 shadow-sm"
                        : "bg-white/5 border-white/10 text-gray-400"
                    }`}
                  >
                    <p className="text-xs font-bold">16:9 Landscape Banner</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">YouTube, Web Video (1920x1080)</p>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "dark-luxury", label: "Dark Luxury", color: "text-amber-400" },
                    { id: "caribbean-energy", label: "Caribbean Heat", color: "text-emerald-400" },
                    { id: "streetwear-bold", label: "Streetwear Bold", color: "text-yellow-400" },
                    { id: "fete-fomo", label: "Fete FOMO", color: "text-rose-400" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setStylePreset(preset.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        stylePreset === preset.id
                          ? "bg-gold-500/20 border-gold-500 text-gold-300"
                          : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      <p className={`text-xs font-bold ${preset.color}`}>{preset.label}</p>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Call to Action (CTA Button Text)</label>
                  <Input
                    value={customCta}
                    onChange={(e) => setCustomCta(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs"
                    placeholder="SHOP NOW • SAVAGEGENTLEMEN.COM"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Post Caption & Tags</label>
                  <Textarea
                    value={customCaption}
                    onChange={(e) => setCustomCaption(e.target.value)}
                    rows={3}
                    className="bg-white/5 border-white/10 text-white text-xs"
                    placeholder="Enter post caption..."
                  />
                </div>

                {/* Render Button */}
                <Button
                  onClick={handleGenerateVideo}
                  disabled={isGenerating || !selectedItem}
                  className="w-full bg-gradient-to-r from-amber-500 via-gold-500 to-yellow-400 text-black font-bold hover:brightness-110 shadow-lg shadow-gold-500/20 py-6 text-sm"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Rendering {aspectRatio} Video Ad (FFmpeg)...
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5 mr-2" />
                      Generate {aspectRatio} Video Ad ({aspectRatio === "9:16" ? "1080x1920" : "1920x1080"})
                    </>
                  )}
                </Button>
              </div>

              {/* 4. Instant 1-Click Deploy to Savage Gentlemen Website */}
              <div className="bg-gradient-to-br from-gold-950/40 via-obsidian-card to-obsidian border border-gold-500/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gold-300 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gold-400" /> 4. 1-Click Deploy to Live Website Ad Spaces
                  </h2>
                  <Badge className="bg-gold-500/20 text-gold-300 border-gold-500/30 text-[10px]">
                    Site-Wide Network
                  </Badge>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Publish this creative straight into one of your website's active ad slots with live impression and click tracking:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "header_ticker", label: "Top Header Ticker", desc: "All Pages" },
                    { id: "article_inline", label: "Article In-Line", desc: "Magazine" },
                    { id: "article_sidebar", label: "Article Sidebar", desc: "Reading View" },
                    { id: "shop_feed", label: "Shop Grid Card", desc: "Store Feed" },
                    { id: "audio_player", label: "Audio Companion", desc: "Live Player" },
                  ].map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setTargetPlacement(slot.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        targetPlacement === slot.id
                          ? "bg-gold-500/30 border-gold-400 text-white shadow-md shadow-gold-500/10"
                          : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      <p className="text-xs font-bold text-white">{slot.label}</p>
                      <p className="text-[10px] text-gold-400/80">{slot.desc}</p>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleDeployToSite}
                  disabled={isDeploying || !selectedItem}
                  className="w-full bg-gold-500 hover:bg-gold-400 text-obsidian font-bold py-5 shadow-lg shadow-gold-500/25 text-sm gap-2"
                >
                  {isDeploying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Activating on Live Site...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Deploy Creative to [{targetPlacement.toUpperCase()}]
                    </>
                  )}
                </Button>
              </div>

              {/* 5. Omnichannel Social Media Broadcast */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gold-400 uppercase tracking-wider flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> 5. Omnichannel Social Broadcast
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "instagram", label: "Instagram Reels", icon: "📸" },
                    { id: "facebook", label: "Facebook Reels", icon: "📘" },
                    { id: "youtube", label: "YouTube Shorts", icon: "▶️" },
                    { id: "tiktok", label: "TikTok Video", icon: "🎵" },
                  ].map((p) => (
                    <div
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${
                        selectedPlatforms[p.id]
                          ? "bg-amber-500/20 border-amber-500 text-white shadow-sm"
                          : "bg-white/5 border-white/10 text-gray-500 opacity-60"
                      }`}
                    >
                      <span className="text-xl block mb-1">{p.icon}</span>
                      <p className="text-xs font-semibold">{p.label}</p>
                      <p className="text-[10px] text-amber-400 font-mono mt-0.5">
                        {selectedPlatforms[p.id] ? "CONNECTED" : "OFF"}
                      </p>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handlePublishAll}
                  disabled={isPublishing || (!generatedVideo && !selectedItem)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-5 shadow-lg shadow-emerald-500/20"
                >
                  {isPublishing ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Broadcasting to Social Channels...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Broadcast Video Ad to Selected Channels
                    </>
                  )}
                </Button>

                {/* Broadcast Results */}
                {publishResults && (
                  <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <p className="text-xs font-bold text-white uppercase tracking-wider mb-2">Publishing Status Report</p>
                    {publishResults.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                        <span className="capitalize text-gray-300 font-medium">{r.platform}</span>
                        <div className="flex items-center gap-2">
                          <Badge className={r.status === "success" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}>
                            {r.status.toUpperCase()}
                          </Badge>
                          {r.postUrl && (
                            <a href={r.postUrl} target="_blank" rel="noreferrer" className="text-gold-400 hover:underline inline-flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN: LIVE AD PREVIEW STAGE (5 COLS) ── */}
            <div className="lg:col-span-5 flex flex-col items-center space-y-6">
              
              {/* Preview Container */}
              <div className={`w-full ${aspectRatio === "9:16" ? "max-w-[320px]" : "max-w-full"} bg-black/80 rounded-[36px] border-4 border-gold-500/40 p-2 shadow-2xl relative overflow-hidden transition-all duration-500`}>
                
                {/* Mobile camera notch if vertical */}
                {aspectRatio === "9:16" && (
                  <div className="w-28 h-3.5 bg-black rounded-full mx-auto mb-2 border border-white/10 z-20 relative" />
                )}

                {/* Video / Mockup Display */}
                <div className={`${aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-[16/9]"} w-full bg-gradient-to-b from-neutral-950 via-neutral-900 to-black rounded-[28px] overflow-hidden relative flex flex-col items-center justify-center border border-white/10`}>
                  {generatedVideo ? (
                    <video
                      ref={videoRef}
                      src={generatedVideo.videoUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : selectedItem ? (
                    <div className="w-full h-full p-4 flex flex-col justify-between items-center text-center relative">
                      {/* Top badge mockup */}
                      <div className="w-full pt-3">
                        <span className="text-[9px] font-mono tracking-widest text-gold-400 uppercase bg-black/70 px-2.5 py-1 rounded-full border border-gold-500/30">
                          ★ SAVAGE GENTLEMEN ★
                        </span>
                      </div>

                      {/* Center Media Photo */}
                      <div className="w-full px-2 my-auto">
                        <img
                          src={selectedItem.imageUrl}
                          alt={selectedItem.title}
                          className={`${aspectRatio === "9:16" ? "w-44 h-44" : "w-48 h-32"} object-cover rounded-2xl mx-auto shadow-2xl border border-gold-500/20`}
                        />
                      </div>

                      {/* Bottom Info Mockup */}
                      <div className="w-full space-y-2 pb-3">
                        <p className="text-xs font-bold text-white line-clamp-2 px-2">
                          {selectedItem.title}
                        </p>
                        <div className="inline-block bg-gold-500 text-black font-bold text-xs px-3 py-1 rounded-full shadow-md">
                          {selectedItem.priceFormatted}
                        </div>
                        <div className="text-[10px] text-amber-400 font-mono tracking-wider bg-black/80 py-1.5 px-3 rounded-lg border border-gold-500/20">
                          {customCta}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-gray-500">
                      <Film className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                      <p className="text-xs">Select a campaign pillar to preview</p>
                    </div>
                  )}
                </div>

                {/* Mobile home indicator */}
                {aspectRatio === "9:16" && (
                  <div className="w-24 h-1 bg-white/30 rounded-full mx-auto mt-3 mb-1" />
                )}
              </div>

              {/* Download MP4 Button */}
              {generatedVideo && (
                <div className="w-full max-w-[320px]">
                  <a
                    href={generatedVideo.videoUrl}
                    download
                    className="w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-3 rounded-xl border border-white/15 transition-all shadow-md"
                  >
                    <Download className="w-4 h-4 text-gold-400" /> Download Video Ad ({generatedVideo.width}x{generatedVideo.height})
                  </a>
                </div>
              )}

              {/* History of Generated Creatives */}
              {history.length > 0 && (
                <div className="w-full max-w-[320px] bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MonitorPlay className="w-3.5 h-3.5 text-gold-400" /> Generated Creatives Library
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {history.map((vid, idx) => (
                      <div
                        key={idx}
                        onClick={() => setGeneratedVideo(vid)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer flex items-center justify-between text-xs transition"
                      >
                        <span className="truncate text-gray-300 text-[11px] max-w-[180px]">{vid.title}</span>
                        <Badge className="bg-gold-500/20 text-gold-300 text-[9px]">
                          {vid.aspectRatio || "9:16"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
