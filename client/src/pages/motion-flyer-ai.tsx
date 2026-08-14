import { useState, useRef } from "react";
import { 
  Sparkles, 
  Upload, 
  Film, 
  Layers, 
  Zap, 
  Download, 
  Play, 
  Pause, 
  Sliders, 
  Music, 
  Flame, 
  Crown, 
  RefreshCw, 
  Check, 
  ChevronRight,
  Eye,
  Share2,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEOHead from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import SGFlyerLogoPng from "@/assets/SGFLYERLOGO.png";

export default function MotionFlyerAi() {
  const [selectedFile, setSelectedFile] = useState<string | null>(SGFlyerLogoPng);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [isRendered, setIsRendered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedVfx, setSelectedVfx] = useState("gold-embers");
  const [selectedAudio, setSelectedAudio] = useState("soca-energy-drop");
  const [selectedFormat, setSelectedFormat] = useState("9:16");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedFile(url);
      setIsRendered(false);
      toast({
        title: "Flyer Uploaded",
        description: `Loaded ${file.name}. Ready for AI Layer Separation.`,
      });
    }
  };

  const handleGenerateMotion = () => {
    setIsProcessing(true);
    setIsRendered(false);

    setProcessingStep("Phase 1: Segmenting DJ portrait, artist text, and background layers...");
    setTimeout(() => {
      setProcessingStep("Phase 2: Generating 3D parallax depth map & particle emitters...");
    }, 1400);

    setTimeout(() => {
      setProcessingStep("Phase 3: Synchronizing bass drops & audio waveform pulses...");
    }, 2800);

    setTimeout(() => {
      setIsProcessing(false);
      setIsRendered(true);
      toast({
        title: "Motion Teaser Ready!",
        description: "Your 4K TikTok/Reel motion flyer preview is compiled and playing.",
      });
    }, 4200);
  };

  const handlePurchaseRender = () => {
    toast({
      title: "Rendering High-Res 4K Video ($9)",
      description: "Processing lossless 60fps MP4 export. Your download link will be ready in 60 seconds.",
    });
  };

  return (
    <>
      <SEOHead
        title="Carnival Motion Flyer AI - Static Poster to TikTok/Reels Video"
        description="Turn static Caribbean fete flyers and festival posters into animated 4K motion videos with particle VFX and beat-synced drops."
      />

      <div className="space-y-10 py-6 md:py-10 max-w-6xl mx-auto">
        {/* ── 1. HEADER ── */}
        <div className="glass-obsidian-strong border border-gold-500/30 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-gold-500 to-yellow-300 flex items-center justify-center text-black font-bold shadow-lg shadow-gold-500/25">
                <Film className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-gold-500/15 text-gold-300 border border-gold-500/30 text-[10px] font-mono uppercase font-bold tracking-widest mb-1">
                  <Sparkles className="w-3 h-3 text-gold-400" />
                  AUTONOMOUS MOTION GRAPHIC GENERATOR
                </div>
                <h1 className="text-3xl md:text-5xl font-heading font-extrabold uppercase text-white tracking-tight">
                  CARNIVAL <span className="gold-gradient-text">MOTION FLYER AI</span>
                </h1>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/60 border border-gold-500/30 font-mono text-xs text-gold-300">
              <Crown className="w-4 h-4 text-gold-400" />
              <span>Instant Reel Export: <strong>$9 / Flyer</strong></span>
            </div>
          </div>

          <p className="text-sm md:text-base text-white/70 mt-6 leading-relaxed max-w-3xl">
            Static flyers get scrolled past. <strong>Carnival Motion Flyer AI</strong> automatically cuts out DJ headshots, isolates typography headers, adds dynamic gold embers and laser light sweeps, and syncs high-energy Soca bass drops for viral TikToks and Instagram Reels.
          </p>
        </div>

        {/* ── 2. TWO-COLUMN WORKBENCH: CONTROLS & LIVE PREVIEW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Creator Controls */}
          <div className="lg:col-span-7 space-y-6">
            {/* Upload Zone */}
            <div className="glass-obsidian-strong border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
              <h3 className="text-base font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-gold-400" />
                Step 1: Upload Static Event Poster
              </h3>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-gold-500/40 hover:border-gold-400 rounded-2xl bg-black/40 text-center cursor-pointer transition-all hover:bg-gold-500/5 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-white mb-1">Click to Upload Event Flyer or Poster</p>
                <p className="text-xs text-white/50">Supports JPG, PNG, WEBP, PSD (Max 25MB)</p>
              </div>
            </div>

            {/* VFX & Audio Style Presets */}
            <div className="glass-obsidian-strong border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-gold-400" />
                  Step 2: Particle & Motion VFX Preset
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: "gold-embers", name: "Gold Embers", icon: "✨" },
                    { id: "cyan-laser", name: "Cyber Laser", icon: "⚡" },
                    { id: "carnival-smoke", name: "CO2 Jet Blast", icon: "💨" },
                    { id: "confetti-drop", name: "Road Confetti", icon: "🎉" },
                    { id: "bass-pulse", name: "Sub-Bass Shimmer", icon: "🔊" },
                    { id: "glitch-matrix", name: "The Void Glitch", icon: "👾" },
                  ].map((vfx) => (
                    <button
                      key={vfx.id}
                      onClick={() => setSelectedVfx(vfx.id)}
                      className={`p-3 rounded-xl border text-left transition-all text-xs font-bold ${
                        selectedVfx === vfx.id
                          ? "bg-gold-500/20 border-gold-400 text-gold-300 shadow-md shadow-gold-500/20"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-base block mb-1">{vfx.icon}</span>
                      {vfx.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Soundtrack Drop */}
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                  <Music className="w-4 h-4 text-gold-400" />
                  Step 3: Background Audio Drop
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "soca-energy-drop", name: "135 BPM Power Soca Drop", duration: "0:15 Teaser" },
                    { id: "groove-riddim", name: "Groovy Soca Sunset Chords", duration: "0:15 Teaser" },
                    { id: "dancehall-horn", name: "Club Airhorn & 808 Refix", duration: "0:15 Teaser" },
                    { id: "custom-upload", name: "Custom Voiceover / DJ Drop", duration: "Upload MP3" },
                  ].map((audio) => (
                    <button
                      key={audio.id}
                      onClick={() => setSelectedAudio(audio.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                        selectedAudio === audio.id
                          ? "bg-gold-500/20 border-gold-400 text-gold-300"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block">{audio.name}</span>
                        <span className="text-[10px] text-white/50 font-mono">{audio.duration}</span>
                      </div>
                      {selectedAudio === audio.id && <Check className="w-4 h-4 text-gold-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Trigger */}
              <Button
                onClick={handleGenerateMotion}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-gold-500 via-amber-500 to-yellow-400 hover:from-gold-400 hover:to-yellow-300 text-black font-bold uppercase tracking-widest text-xs py-6 rounded-2xl shadow-xl shadow-gold-500/25"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    GENERATING MOTION LAYERS...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    GENERATE MOTION TEASER PREVIEW
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column: Live Motion Teaser Preview Player */}
          <div className="lg:col-span-5 space-y-6 sticky top-24">
            <div className="glass-obsidian-strong border-2 border-gold-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-4 pb-3 border-b border-white/10">
                <span className="text-[10px] uppercase font-mono tracking-widest text-gold-400 font-bold flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" />
                  LIVE MOTION SIMULATOR
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isRendered ? "60 FPS 4K" : "AWAITING RENDER"}
                </span>
              </div>

              {/* Simulated 9:16 Video Player Container */}
              <div className="relative w-full max-w-[280px] aspect-[9/16] rounded-2xl overflow-hidden bg-black border-2 border-gold-500/50 shadow-2xl flex items-center justify-center group">
                {selectedFile && (
                  <img
                    src={selectedFile}
                    alt="Motion Poster"
                    className={`w-full h-full object-cover transition-transform duration-1000 ${
                      isRendered ? "scale-105 filter brightness-110 contrast-110" : ""
                    }`}
                  />
                )}

                {/* Animated Particles & Glow Overlay when Rendered */}
                {isRendered && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                    
                    {/* Simulated Gold Ember VFX */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(229,169,60,0.25),transparent_70%)] animate-pulse pointer-events-none" />
                    
                    {/* Light Sweep Scanline */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold-400/20 to-transparent animate-shimmer pointer-events-none" />

                    {/* Bottom Waveform Badge */}
                    <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl glass-obsidian-strong border border-gold-500/40 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-mono text-gold-400 font-bold uppercase block">CARNIVAL BASS DROP</span>
                        <span className="text-[10px] text-white font-bold">135 BPM • Gold Embers</span>
                      </div>
                      <div className="flex gap-0.5 items-end h-4">
                        <span className="w-1 bg-gold-400 rounded-full h-3 animate-pulse" />
                        <span className="w-1 bg-gold-300 rounded-full h-4 animate-pulse delay-75" />
                        <span className="w-1 bg-gold-400 rounded-full h-2 animate-pulse delay-150" />
                        <span className="w-1 bg-gold-200 rounded-full h-3.5 animate-pulse delay-100" />
                      </div>
                    </div>
                  </>
                )}

                {/* Processing Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                    <div className="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-400 text-gold-300 flex items-center justify-center animate-spin">
                      <Layers className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-mono text-gold-300 font-bold uppercase">{processingStep}</p>
                  </div>
                )}
              </div>

              {/* Render & Download Actions */}
              <div className="w-full mt-6 space-y-3">
                <Button
                  onClick={handlePurchaseRender}
                  className="w-full bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 text-black font-bold uppercase tracking-wider text-xs py-5 rounded-xl shadow-lg shadow-gold-500/25"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Render & Download 4K Video ($9)
                </Button>

                <p className="text-[11px] text-white/50 text-center">
                  Delivered as uncompressed 60fps MP4 ready for Instagram Reels, TikTok & YouTube Shorts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
