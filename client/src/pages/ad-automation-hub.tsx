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
  Radio
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
  type: "merch" | "event";
  title: string;
  category: string;
  priceFormatted: string;
  description: string;
  imageUrl: string;
  suggestedHook: string;
  suggestedCaption: string;
  productLink: string;
}

interface GeneratedVideo {
  videoUrl: string;
  filePath: string;
  duration: number;
  width: number;
  height: number;
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
  const [catalog, setCatalog] = useState<{ merch: CatalogItem[]; events: CatalogItem[] }>({ merch: [], events: [] });
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [history, setHistory] = useState<GeneratedVideo[]>([]);
  const [customCaption, setCustomCaption] = useState("");
  const [customCta, setCustomCta] = useState("SHOP NOW • SAVAGEGENTLEMEN.COM");
  const [stylePreset, setStylePreset] = useState<"dark-luxury" | "caribbean-energy" | "streetwear-bold">("dark-luxury");
  
  // Platform distribution selection
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, boolean>>({
    instagram: true,
    facebook: true,
    youtube: true,
    tiktok: true,
  });

  const [publishResults, setPublishResults] = useState<PublishResult[] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
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
    setCustomCaption(`${item.suggestedHook}\n\n${item.suggestedCaption}`);
    setCustomCta(item.type === "event" ? "GET TICKETS • SAVAGEGENTLEMEN.COM" : "SHOP NOW • SAVAGEGENTLEMEN.COM");
    setPublishResults(null);
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
      title: "Compiling 9:16 Video Ad...",
      description: "Processing high-res visuals, gold badges, and beat drops via FFmpeg.",
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
        durationSeconds: 15,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Generation failed");
      }

      const videoData: GeneratedVideo = await res.json();
      setGeneratedVideo(videoData);
      setHistory((prev) => [videoData, ...prev]);

      toast({
        title: "✨ 9:16 Video Ad Ready!",
        description: `Lossless 1080x1920 MP4 created for ${selectedItem.title}.`,
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
        hashtags: ["#SavageGentlemen", "#LuxuryStreetwear", "#CarnivalVibes", "#ExclusiveDrop"],
        isTestMode: false,
      });

      const data = await res.json();
      setPublishResults(data.results || []);

      toast({
        title: "🚀 Broadcast Triggered!",
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
        title="Savage Ad Studio AI - Automated 9:16 Video Ads & Social Publisher"
        description="Autonomous e-commerce video ad creation and 1-click social media distribution to Instagram Reels, Facebook, YouTube Shorts, and TikTok."
      />

      <div className="space-y-10 py-6 md:py-10 max-w-7xl mx-auto px-4">
        {/* ── HEADER ── */}
        <div className="glass-obsidian-strong border border-gold-500/30 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-gold-500 to-yellow-300 flex items-center justify-center text-black font-bold shadow-lg shadow-gold-500/25">
                <Film className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-gold-500/15 text-gold-300 border border-gold-500/30 text-[10px] font-mono uppercase font-bold tracking-widest mb-1">
                  <Sparkles className="w-3 h-3 text-gold-400" />
                  AUTONOMOUS MARKETING ENGINE
                </div>
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
                  Savage Ad Studio AI
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Transform Shop Merchandise & Events into 9:16 Video Ads and Auto-Publish to Instagram, Facebook, YouTube & TikTok.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Multi-Channel Gateway Active
              </Badge>
            </div>
          </div>

          {/* ── MAIN STUDIO GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
            
            {/* ── LEFT COLUMN: PRODUCT SELECTION & CONTROLS (7 COLS) ── */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Product / Event Selector */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" /> 1. Select Product or Event
                </h2>

                <Tabs defaultValue="merch" className="w-full">
                  <TabsList className="bg-white/5 border border-white/10 w-full grid grid-cols-2 mb-4">
                    <TabsTrigger value="merch" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black font-semibold">
                      Shop Merch Catalog ({catalog.merch.length})
                    </TabsTrigger>
                    <TabsTrigger value="events" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black font-semibold">
                      Live Events ({catalog.events.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="merch" className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                      {catalog.merch.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => selectItem(item)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                            selectedItem?.id === item.id
                              ? "bg-gold-500/15 border-gold-500 text-white shadow-md shadow-gold-500/10"
                              : "bg-white/5 border-white/10 hover:border-white/20 text-gray-300"
                          }`}
                        >
                          <img src={item.imageUrl} alt={item.title} className="w-12 h-12 object-cover rounded-lg" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate text-white">{item.title}</p>
                            <p className="text-[11px] text-gold-400 font-mono">{item.priceFormatted}</p>
                          </div>
                          {selectedItem?.id === item.id && <Check className="w-4 h-4 text-gold-400 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="events" className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                      {catalog.events.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => selectItem(item)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                            selectedItem?.id === item.id
                              ? "bg-gold-500/15 border-gold-500 text-white shadow-md shadow-gold-500/10"
                              : "bg-white/5 border-white/10 hover:border-white/20 text-gray-300"
                          }`}
                        >
                          <img src={item.imageUrl} alt={item.title} className="w-12 h-12 object-cover rounded-lg" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate text-white">{item.title}</p>
                            <p className="text-[11px] text-gold-400 font-mono">{item.priceFormatted}</p>
                          </div>
                          {selectedItem?.id === item.id && <Check className="w-4 h-4 text-gold-400 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Video Customization Options */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gold-400 uppercase tracking-wider flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" /> 2. Customize Visual Style & Copy
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "dark-luxury", label: "Dark Luxury", desc: "Gold Accents & Deep Bass" },
                    { id: "caribbean-energy", label: "Caribbean Heat", desc: "High-Energy Soca Rhythm" },
                    { id: "streetwear-bold", label: "Streetwear Bold", desc: "Clean Minimal Urban" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setStylePreset(preset.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        stylePreset === preset.id
                          ? "bg-gold-500/20 border-gold-500 text-gold-300"
                          : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      <p className="text-xs font-bold">{preset.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{preset.desc}</p>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Call to Action (CTA Banner)</label>
                  <Input
                    value={customCta}
                    onChange={(e) => setCustomCta(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs"
                    placeholder="SHOP NOW • SAVAGEGENTLEMEN.COM"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Caption & Hashtags (Cross-Platform)</label>
                  <Textarea
                    value={customCaption}
                    onChange={(e) => setCustomCaption(e.target.value)}
                    rows={3}
                    className="bg-white/5 border-white/10 text-white text-xs"
                    placeholder="Enter post caption..."
                  />
                </div>

                <Button
                  onClick={handleGenerateVideo}
                  disabled={isGenerating || !selectedItem}
                  className="w-full bg-gradient-to-r from-amber-500 via-gold-500 to-yellow-400 text-black font-bold hover:brightness-110 shadow-lg shadow-gold-500/20 py-6"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Rendering 9:16 Vertical Video (FFmpeg)...
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5 mr-2" />
                      Generate 9:16 Video Ad (1080x1920)
                    </>
                  )}
                </Button>
              </div>

              {/* Omnichannel Social Publishing Bar */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gold-400 uppercase tracking-wider flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> 3. Multi-Platform Auto-Post
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
                      Broadcast to All Selected Channels
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

            {/* ── RIGHT COLUMN: 9:16 VIDEO PREVIEW (5 COLS) ── */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-[320px] bg-black/80 rounded-[40px] border-4 border-gold-500/40 p-2 shadow-2xl relative overflow-hidden">
                {/* Mobile camera notch */}
                <div className="w-32 h-4 bg-black rounded-full mx-auto mb-2 border border-white/10 z-20 relative" />

                {/* 9:16 Aspect Ratio Container */}
                <div className="aspect-[9/16] w-full bg-gradient-to-b from-neutral-950 via-neutral-900 to-black rounded-[32px] overflow-hidden relative flex flex-col items-center justify-center border border-white/10">
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
                      {/* Top luxury badge mockup */}
                      <div className="w-full pt-4">
                        <span className="text-[9px] font-mono tracking-widest text-gold-400 uppercase bg-black/70 px-2 py-0.5 rounded-full border border-gold-500/30">
                          ★ SAVAGE GENTLEMEN ★
                        </span>
                      </div>

                      {/* Product Center Photo */}
                      <div className="w-full px-2 my-auto">
                        <img
                          src={selectedItem.imageUrl}
                          alt={selectedItem.title}
                          className="w-48 h-48 object-cover rounded-2xl mx-auto shadow-2xl border border-gold-500/20"
                        />
                      </div>

                      {/* Bottom Info Mockup */}
                      <div className="w-full space-y-2 pb-4">
                        <p className="text-sm font-bold text-white line-clamp-2 px-2">
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
                      <p className="text-xs">Select a product to preview ad</p>
                    </div>
                  )}
                </div>

                {/* Mobile home indicator */}
                <div className="w-24 h-1 bg-white/30 rounded-full mx-auto mt-3 mb-1" />
              </div>

              {/* Download & File Info */}
              {generatedVideo && (
                <div className="mt-4 flex items-center gap-3 w-full max-w-[320px]">
                  <a
                    href={generatedVideo.videoUrl}
                    download
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2.5 rounded-xl border border-white/15 transition-all"
                  >
                    <Download className="w-4 h-4 text-gold-400" /> Download MP4 (1080x1920)
                  </a>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
