import { useState, useRef } from "react";
import { 
  Sparkles, 
  Download, 
  Share2, 
  Megaphone, 
  Layers, 
  Image as ImageIcon, 
  Flame, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink,
  Sliders,
  Send,
  Zap,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { toPng } from "html-to-image";
import SGFlyerLogoPng from "@/assets/SGFLYERLOGO.png";

interface AdCreativeStudioProps {
  products?: any[];
  articles?: any[];
  onAdCreated?: () => void;
}

const TEMPLATES = [
  { id: "midnight-gold", name: "Midnight Gold Luxe", bg: "from-black via-[#0d0f14] to-black", border: "border-[#d4af37]/40", badge: "bg-[#d4af37] text-black font-bold" },
  { id: "cyber-nocturne", name: "Cyber Nocturne", bg: "from-[#0a0512] via-[#1a0b2e] to-black", border: "border-red-500/40", badge: "bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold" },
  { id: "carnival-fire", name: "Carnival Fire Energy", bg: "from-[#1a0800] via-[#2d1202] to-black", border: "border-amber-500/40", badge: "bg-amber-500 text-black font-bold" },
  { id: "minimal-streetwear", name: "Minimal Streetwear", bg: "from-[#111] via-[#161616] to-[#0a0a0a]", border: "border-white/20", badge: "bg-white text-black font-bold" },
];

export default function AdCreativeStudio({ products = [], articles = [], onAdCreated }: AdCreativeStudioProps) {
  const { toast } = useToast();
  const adPreviewRef = useRef<HTMLDivElement>(null);

  // Studio Form State
  const [selectedFormat, setSelectedFormat] = useState<"1:1" | "9:16" | "16:9">("1:1");
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
  const [title, setTitle] = useState("SAVAGE LAKERS HOODIE");
  const [subtitle, setSubtitle] = useState("Limited Edition Caribbean Nocturne Streetwear");
  const [tagline, setTagline] = useState("OFFICIAL SG MERCH DROP");
  const [priceTag, setPriceTag] = useState("$62.03");
  const [ctaText, setCtaText] = useState("SHOP THE DROP · SAVGENT.COM");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&fit=crop");
  const [targetUrl, setTargetUrl] = useState("https://savagegentlemen.onrender.com/shop");
  const [discountCode, setDiscountCode] = useState("CARNIVAL26");
  const [isExporting, setIsExporting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [autoPilot, setAutoPilot] = useState(true);

  const activeTemplate = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];

  // Preset Merch Selector
  const handleSelectProduct = (productId: string) => {
    const product = products.find(p => String(p.id) === productId);
    if (product) {
      setTitle(product.title.toUpperCase());
      setSubtitle(product.description?.slice(0, 70) || "Official Savage Gentlemen Print-On-Demand Merch");
      setTagline("EXCLUSIVE STREETWEAR DROP");
      setPriceTag(`$${(product.price || 50).toFixed(2)}`);
      setImageUrl(product.image || product.featuredImage || imageUrl);
      setTargetUrl(`https://savagegentlemen.onrender.com/shop`);
      toast({
        title: "Product Loaded into Studio",
        description: `Now generating high-res ad creative for ${product.title}`,
      });
    }
  };

  // Preset Article Selector
  const handleSelectArticle = (articleId: string) => {
    const article = articles.find(a => String(a.id) === articleId);
    if (article) {
      setTitle(article.title.toUpperCase());
      setSubtitle(article.summary?.slice(0, 80) || "Latest Caribbean Music & Carnival Scene Dispatch");
      setTagline("MAGAZINE EXCLUSIVE");
      setPriceTag("READ FREE");
      setImageUrl(article.featuredImage || imageUrl);
      setTargetUrl(`https://savagegentlemen.onrender.com/magazine/${article.slug}`);
      toast({
        title: "Article Loaded into Studio",
        description: `Now generating high-res editorial ad for ${article.title}`,
      });
    }
  };

  // Generate High-Res Image Download
  const handleDownload = async () => {
    if (!adPreviewRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(adPreviewRef.current, {
        quality: 0.98,
        pixelRatio: 2.5, // Crisp 2.5x retina resolution
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `SG_AD_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${selectedFormat}.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: "Ad Creative Downloaded!",
        description: "High-resolution graphic saved ready for Instagram, Facebook, and TikTok.",
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Failed to render image",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Push Directly to In-Site Ad Banners
  const handlePushToSiteAds = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: subtitle,
          imageUrl,
          linkUrl: targetUrl,
          type: "banner",
          placement: selectedFormat === "16:9" ? "header_ticker" : "feed_native",
          priority: 5,
          active: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to deploy ad to live site");

      toast({
        title: "Deployed to Live Site Banners!",
        description: "Your ad creative is now actively rotating on the Savage Gentlemen platform.",
      });
      if (onAdCreated) onAdCreated();
    } catch (err: any) {
      toast({
        title: "Deployment Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Copy Viral Social Caption
  const getSocialCaption = () => {
    return `🔥 NEW DROP: ${title}\n\n` +
      `${subtitle}\n\n` +
      `🏷️ Price: ${priceTag} ${discountCode ? `(Use code ${discountCode} for VIP discount)` : ''}\n` +
      `🛒 Shop online: ${targetUrl}\n\n` +
      `🍸 Savage Gentlemen | Caribbean Nocturne & Luxury Streetwear\n\n` +
      `#SavageGentlemen #CaribbeanLuxury #Carnival2026 #StreetwearDrop #SocaVibes #IslandNightlife #OfficialMerch`;
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(getSocialCaption());
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
    toast({
      title: "Caption & Hashtags Copied!",
      description: "Ready to paste into Instagram, TikTok, or Twitter.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Studio Header & Auto-Pilot Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-[#12141a] via-[#1a1c24] to-[#0a0a0d] border border-[#d4af37]/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#d4af37] animate-pulse" />
            <h2 className="text-xl font-bold tracking-wide text-white font-serif">
              Autonomous Ad & Creative Studio
            </h2>
            <Badge className="bg-[#d4af37] text-black font-semibold text-xs">100% Free & Unlimited</Badge>
          </div>
          <p className="text-sm text-gray-400">
            Generate high-resolution 1080p luxury ad graphics, story reels, and social creatives for your Printify merch and articles.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-black/50 p-2.5 rounded-lg border border-white/10">
          <div className="text-right">
            <p className="text-xs font-semibold text-white">Auto-Pilot Ad Sync</p>
            <p className="text-[11px] text-gray-400">Auto-rotates top items to in-site ads</p>
          </div>
          <Switch 
            checked={autoPilot} 
            onCheckedChange={(val) => {
              setAutoPilot(val);
              toast({
                title: val ? "Auto-Pilot Activated" : "Auto-Pilot Paused",
                description: val ? "New Printify items will automatically populate site ad slots." : "Manual publishing only.",
              });
            }} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls & Customizer */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-[#0e1015] border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#d4af37]" /> Creative Controls
              </CardTitle>
              <CardDescription>Select a source or customize ad text and imagery.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Preset Selector */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-400">Printify Merch Drop</Label>
                  <Select onValueChange={handleSelectProduct}>
                    <SelectTrigger className="mt-1 bg-black/60 border-white/10 text-xs h-9">
                      <SelectValue placeholder="Select Merch Item..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.title} (${(p.price || 50).toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-400">Magazine Article</Label>
                  <Select onValueChange={handleSelectArticle}>
                    <SelectTrigger className="mt-1 bg-black/60 border-white/10 text-xs h-9">
                      <SelectValue placeholder="Select Article..." />
                    </SelectTrigger>
                    <SelectContent>
                      {articles.slice(0, 10).map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.title?.slice(0, 25)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Aspect Ratio Tabs */}
              <div>
                <Label className="text-xs text-gray-400">Ad Dimension / Format</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <Button 
                    type="button" 
                    variant={selectedFormat === "1:1" ? "default" : "outline"} 
                    className={`h-8 text-xs ${selectedFormat === "1:1" ? "bg-[#d4af37] text-black hover:bg-[#c5a030]" : "border-white/10"}`}
                    onClick={() => setSelectedFormat("1:1")}
                  >
                    1:1 Square (IG Feed)
                  </Button>
                  <Button 
                    type="button" 
                    variant={selectedFormat === "9:16" ? "default" : "outline"} 
                    className={`h-8 text-xs ${selectedFormat === "9:16" ? "bg-[#d4af37] text-black hover:bg-[#c5a030]" : "border-white/10"}`}
                    onClick={() => setSelectedFormat("9:16")}
                  >
                    9:16 Story / Reel
                  </Button>
                  <Button 
                    type="button" 
                    variant={selectedFormat === "16:9" ? "default" : "outline"} 
                    className={`h-8 text-xs ${selectedFormat === "16:9" ? "bg-[#d4af37] text-black hover:bg-[#c5a030]" : "border-white/10"}`}
                    onClick={() => setSelectedFormat("16:9")}
                  >
                    16:9 Web Banner
                  </Button>
                </div>
              </div>

              {/* Theme Template Selection */}
              <div>
                <Label className="text-xs text-gray-400">Luxury Brand Theme</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      className={`p-2 rounded-lg border text-left text-xs transition-all ${
                        selectedTemplate === tmpl.id
                          ? "border-[#d4af37] bg-[#d4af37]/10 text-white font-medium shadow-md shadow-[#d4af37]/10"
                          : "border-white/10 bg-black/40 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Fields */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-400">Top Badge / Pill</Label>
                    <Input 
                      value={tagline} 
                      onChange={(e) => setTagline(e.target.value)} 
                      className="h-8 text-xs bg-black/60 border-white/10 mt-1" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Price / Offer Tag</Label>
                    <Input 
                      value={priceTag} 
                      onChange={(e) => setPriceTag(e.target.value)} 
                      className="h-8 text-xs bg-black/60 border-white/10 mt-1" 
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-400">Main Headline</Label>
                  <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="h-8 text-xs bg-black/60 border-white/10 mt-1 uppercase" 
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-400">Subtitle / Hook</Label>
                  <Input 
                    value={subtitle} 
                    onChange={(e) => setSubtitle(e.target.value)} 
                    className="h-8 text-xs bg-black/60 border-white/10 mt-1" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-400">Button CTA</Label>
                    <Input 
                      value={ctaText} 
                      onChange={(e) => setCtaText(e.target.value)} 
                      className="h-8 text-xs bg-black/60 border-white/10 mt-1" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Promo Code</Label>
                    <Input 
                      value={discountCode} 
                      onChange={(e) => setDiscountCode(e.target.value)} 
                      className="h-8 text-xs bg-black/60 border-white/10 mt-1" 
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-400">Product / Featured Image URL</Label>
                  <Input 
                    value={imageUrl} 
                    onChange={(e) => setImageUrl(e.target.value)} 
                    className="h-8 text-xs bg-black/60 border-white/10 mt-1" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Canvas Preview & Export Panel */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="bg-[#0e1015] border-white/10">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Live Ad Canvas Preview</CardTitle>
                <CardDescription>Pixel-perfect composite rendering ready for export.</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs border-[#d4af37]/40 text-[#d4af37]">
                {selectedFormat === "1:1" ? "1080 x 1080 px" : selectedFormat === "9:16" ? "1080 x 1920 px" : "1200 x 675 px"}
              </Badge>
            </CardHeader>

            <CardContent className="flex flex-col items-center">
              {/* The Actual Ad DOM Element that gets converted to high-res PNG */}
              <div 
                ref={adPreviewRef}
                className={`relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 flex flex-col justify-between p-6 border ${activeTemplate.border} bg-gradient-to-br ${activeTemplate.bg}`}
                style={{
                  width: selectedFormat === "1:1" ? "420px" : selectedFormat === "9:16" ? "320px" : "100%",
                  height: selectedFormat === "1:1" ? "420px" : selectedFormat === "9:16" ? "560px" : "240px",
                  maxHeight: "600px",
                }}
              >
                {/* Background Ambient Glow & Watermark */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
                
                {/* Header Row: Logo Watermark & Top Badge */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src={SGFlyerLogoPng} 
                      alt="Savage Gentlemen" 
                      className="h-9 w-9 object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" 
                    />
                    <span className="font-serif tracking-widest text-xs font-black text-[#d4af37] uppercase">
                      Savage Gentlemen
                    </span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase shadow-md ${activeTemplate.badge}`}>
                    {tagline}
                  </span>
                </div>

                {/* Center Content: Product Image & Floating Price Pill */}
                <div className="relative z-10 my-auto flex flex-col items-center justify-center">
                  <div className="relative group">
                    <img 
                      src={imageUrl} 
                      alt={title} 
                      crossOrigin="anonymous"
                      className={`object-contain transition-transform duration-500 drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] ${
                        selectedFormat === "9:16" ? "max-h-56 max-w-[240px]" : selectedFormat === "16:9" ? "max-h-28" : "max-h-48 max-w-[260px]"
                      }`}
                    />
                    {priceTag && (
                      <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-lg bg-black/90 border border-[#d4af37] shadow-xl flex items-center gap-1.5 backdrop-blur-md">
                        <Tag className="h-3 w-3 text-[#d4af37]" />
                        <span className="font-bold text-xs text-[#d4af37]">{priceTag}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Content: Titles, Subtitle & Call to Action */}
                <div className="relative z-10 space-y-2 mt-auto">
                  <div>
                    <h3 className="font-extrabold text-white tracking-wide text-lg sm:text-xl font-sans uppercase leading-tight drop-shadow-md">
                      {title}
                    </h3>
                    <p className="text-gray-300 text-xs line-clamp-2 mt-0.5 font-light">
                      {subtitle}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <div className="px-3 py-1.5 rounded-md bg-[#d4af37] text-black font-bold text-[11px] tracking-wider uppercase shadow-lg shadow-[#d4af37]/20 flex items-center gap-1.5">
                      <Zap className="h-3 w-3 fill-black" />
                      {ctaText}
                    </div>

                    {discountCode && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        CODE: <span className="text-[#d4af37] font-bold">{discountCode}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2 mt-6">
                <Button 
                  onClick={handleDownload} 
                  disabled={isExporting}
                  className="bg-[#d4af37] hover:bg-[#c5a030] text-black font-bold h-10 text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/20"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? "Rendering 4K..." : "Download High-Res PNG"}
                </Button>

                <Button 
                  onClick={handlePushToSiteAds} 
                  disabled={isPublishing}
                  variant="outline"
                  className="border-white/20 hover:border-white/40 text-white font-medium h-10 text-xs flex items-center justify-center gap-2 bg-black/40"
                >
                  <Megaphone className="h-4 w-4 text-[#d4af37]" />
                  {isPublishing ? "Deploying..." : "Push to Live Site Ads"}
                </Button>

                <Button 
                  onClick={handleCopyCaption} 
                  variant="outline"
                  className="border-white/20 hover:border-white/40 text-white font-medium h-10 text-xs flex items-center justify-center gap-2 bg-black/40"
                >
                  {copiedCaption ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-[#d4af37]" />}
                  {copiedCaption ? "Copied to Clipboard!" : "Copy Social Caption"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
