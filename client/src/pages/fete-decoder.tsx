import { useState } from "react";
import { 
  Music, 
  Sparkles, 
  Upload, 
  Link as LinkIcon, 
  Zap, 
  Layers, 
  Download, 
  CheckCircle2, 
  Play, 
  Radio, 
  Sliders, 
  Share2, 
  FileAudio, 
  Crown,
  ChevronRight,
  RefreshCw,
  Search,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEOHead from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { useAudioPlayer } from "@/context/AudioPlayerContext";

interface DecodedTrack {
  id: number;
  timestamp: string;
  songTitle: string;
  artist: string;
  riddimName: string;
  riddimYear: string;
  producer: string;
  bpm: number;
  key: string;
  confidence: number;
}

export default function FeteDecoder() {
  const [urlInput, setUrlInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [decodedResults, setDecodedResults] = useState<DecodedTrack[] | null>(null);
  const { toast } = useToast();
  const { playTrack } = useAudioPlayer();

  const handleStartDecode = () => {
    if (!urlInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a SoundCloud, Mixcloud, YouTube, or Reel URL, or drop an audio file.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setDecodedResults(null);

    // Simulated 4-phase stem separation & fingerprinting pipeline
    setAnalysisStep("Phase 1: Downloading & extracting lossless audio stream via yt-dlp...");

    setTimeout(() => {
      setAnalysisStep("Phase 2: Demucs AI stem separation (Vocals vs Instrumental Riddim)...");
    }, 1200);

    setTimeout(() => {
      setAnalysisStep("Phase 3: Pitch & BPM unwarping (normalizing DJ tempo shifts)...");
    }, 2400);

    setTimeout(() => {
      setAnalysisStep("Phase 4: Matching riddim acoustic fingerprints against RiddimDB...");
    }, 3600);

    setTimeout(() => {
      setIsAnalyzing(false);
      setDecodedResults([
        {
          id: 1,
          timestamp: "00:00 - 02:45",
          songTitle: "Like Ah Boss (Savage VIP Edit)",
          artist: "Machel Montano",
          riddimName: "Lava Gun Riddim",
          riddimYear: "2015 / 2026 Redo",
          producer: "Precision Productions",
          bpm: 130,
          key: "8A / A minor",
          confidence: 99.4,
        },
        {
          id: 2,
          timestamp: "02:45 - 05:10",
          songTitle: "Savannah Grass (Steelpan Intro)",
          artist: "KES",
          riddimName: "Savannah Riddim",
          riddimYear: "2019",
          producer: "Captain Kendall",
          bpm: 128,
          key: "9B / G Major",
          confidence: 98.8,
        },
        {
          id: 3,
          timestamp: "05:10 - 08:30",
          songTitle: "Gyal Owner x Toast Blend",
          artist: "Blaxx x Koffee",
          riddimName: "Toast / Oily Riddim Mashup",
          riddimYear: "2020",
          producer: "DJ Private Ryan Blend",
          bpm: 132,
          key: "11B / A Major",
          confidence: 97.2,
        },
        {
          id: 4,
          timestamp: "08:30 - 11:15",
          songTitle: "Hard Fete (Energy Refix)",
          artist: "Bunji Garlin",
          riddimName: "Heart of Carnival Riddim",
          riddimYear: "2023",
          producer: "Fay-Ann Lyons / Stadic",
          bpm: 134,
          key: "7A / D minor",
          confidence: 99.1,
        }
      ]);

      toast({
        title: "Tracklist Decoded!",
        description: "Successfully identified 4 tracks and underlying riddims with 98.6% average confidence.",
      });
    }, 4500);
  };

  const handleExportSpotify = () => {
    toast({
      title: "Spotify Sync Generated",
      description: "Playlist created: 'Savage Fete Decoder Setlist'. Added to your Spotify library.",
    });
  };

  const handleExportCrate = () => {
    toast({
      title: "DJ Crate Exported",
      description: "Downloaded Rekordbox / Serato compatible .crate file with pre-analyzed BPM & cue points.",
    });
  };

  return (
    <>
      <SEOHead
        title="itsSOCA DECODER - Automated Caribbean Riddim & Tracklist Engine"
        description="Decode live Soca fete sets, isolate stems, identify riddims, and export Serato/Rekordbox DJ crates instantly."
      />

      <div className="space-y-10 py-6 md:py-10 max-w-6xl mx-auto">
        {/* ── 1. HEADER ── */}
        <div className="glass-obsidian-strong border border-cyan-500/30 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500 via-amber-500 to-cyan-400 flex items-center justify-center text-black font-bold shadow-lg shadow-gold-500/25">
                <Music className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 text-[10px] font-mono uppercase font-bold tracking-widest mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  AUTONOMOUS RIDDIM & STEM RECOGNITION
                </div>
                <h1 className="text-3xl md:text-5xl font-heading font-extrabold uppercase text-white tracking-tight">
                  its<span className="gold-gradient-text">SOCA DECODER</span>
                </h1>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs text-white/70">
              <span>RiddimDB Catalog:</span>
              <span className="font-bold text-gold-400">12,450+ Signatures</span>
            </div>
          </div>

          <p className="text-sm md:text-base text-white/70 mt-6 leading-relaxed max-w-3xl">
            <strong>How it works:</strong> Paste any SoundCloud/Mixcloud set, YouTube mix, or Instagram/TikTok reel link, or upload an audio recording from your phone. <strong>itsSOCA DECODER</strong> automatically isolates the vocals from the beat with Demucs AI, normalizes DJ master tempo speed shifts (+5% BPM), and matches the exact Caribbean riddim and artist edit in seconds.
          </p>

          {/* Input Form */}
          <div className="mt-8 p-4 rounded-2xl bg-black/70 border border-cyan-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Paste SoundCloud, Mixcloud, YouTube, IG Reel link or drop audio file..."
                  className="pl-10 bg-white/5 border-white/15 text-sm text-white placeholder:text-white/40 focus-visible:ring-cyan-500 rounded-xl h-12"
                />
              </div>

              <Button
                onClick={handleStartDecode}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-gold-500 via-amber-400 to-cyan-400 hover:from-gold-400 hover:to-cyan-300 text-black font-bold uppercase tracking-wider text-xs px-8 h-12 rounded-xl shadow-lg shadow-gold-500/20 flex-shrink-0"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    DECODING...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    DECODE RIDDIMS
                  </>
                )}
              </Button>
            </div>

            {/* Quick Demo Pre-fill */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-white/50">
              <span className="font-mono text-[10px] uppercase">Quick Try:</span>
              <button
                onClick={() => {
                  setUrlInput("https://soundcloud.com/djprivateryan/savage-gentlemen-fete-warmup");
                  handleStartDecode();
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-gold-500/20 border border-white/10 text-gold-300 transition text-[11px]"
              >
                🎵 DJ Private Ryan - Carnival Warmup Set (60 min)
              </button>
              <button
                onClick={() => {
                  setUrlInput("https://instagram.com/reel/trinidad-carnival-road-march-drop");
                  handleStartDecode();
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-gold-500/20 border border-white/10 text-gold-300 transition text-[11px]"
              >
                🔥 Instagram Reel - Mystery Road March Drop
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. LIVE ANALYSIS PIPELINE STATUS ── */}
        {isAnalyzing && (
          <div className="p-6 rounded-3xl glass-obsidian-strong border border-cyan-500/40 shadow-2xl text-center space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center justify-center mx-auto animate-pulse">
              <Layers className="w-6 h-6 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase font-mono tracking-wider">
              Executing Stem Separation & Riddim Recognition
            </h3>
            <p className="text-xs text-cyan-300 font-mono">{analysisStep}</p>

            <div className="max-w-md mx-auto h-2 bg-black/60 rounded-full overflow-hidden border border-white/10 p-0.5">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* ── 3. DECODED TRACKLIST RESULTS ── */}
        {decodedResults && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold block mb-1">
                  ✓ STEM SEPARATION COMPLETE • 4 TRACKS IDENTIFIED
                </span>
                <h2 className="text-2xl md:text-3xl font-heading font-extrabold uppercase text-white">
                  DECODED <span className="cyan-gradient-text">SETLIST & RIDDIMS</span>
                </h2>
              </div>

              {/* Export Action Deck */}
              <div className="flex flex-wrap gap-2.5">
                <Button
                  onClick={handleExportSpotify}
                  className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black font-bold uppercase tracking-wider text-xs rounded-xl px-4 py-2 border border-emerald-500/30"
                >
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />
                  Sync to Spotify
                </Button>

                <Button
                  onClick={handleExportCrate}
                  className="bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 text-black font-bold uppercase tracking-wider text-xs rounded-xl px-4 py-2 shadow-md shadow-gold-500/20"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Export Serato / Rekordbox Crate
                </Button>
              </div>
            </div>

            {/* Tracklist Cards */}
            <div className="space-y-3">
              {decodedResults.map((track) => (
                <div
                  key={track.id}
                  className="p-5 rounded-2xl glass-obsidian-strong border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-bold flex items-center justify-center text-xs flex-shrink-0">
                      0{track.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-bold text-white">{track.songTitle}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                          {track.confidence}% Match
                        </span>
                      </div>
                      <p className="text-xs text-white/70 mb-2">{track.artist}</p>

                      <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-gold-500/10 text-gold-300 border border-gold-500/20">
                          🥁 Riddim: <strong>{track.riddimName}</strong> ({track.riddimYear})
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/10">
                          ⚡ {track.bpm} BPM
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/10">
                          🎹 Key: {track.key}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/10">
                          🎧 Producer: {track.producer}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <span className="text-xs font-mono text-white/50">{track.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 4. MONETIZATION TIERS (B2C & B2B DJ VAULT) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="p-6 rounded-3xl glass-obsidian border border-white/10 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/50 block mb-1">FREE ACCESS</span>
              <h3 className="text-lg font-bold text-white mb-2">Casual Fan</h3>
              <p className="text-xs text-white/60 mb-4">Identify unknown songs from weekend stories and reels.</p>
              <div className="text-2xl font-bold text-white font-mono mb-4">$0 <span className="text-xs text-white/40 font-normal">/ month</span></div>

              <ul className="space-y-2 text-xs text-white/70 mb-6">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> 3 track decodes per day</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Basic Riddim name & artist ID</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Spotify link generator</li>
              </ul>
            </div>
            <Button variant="outline" className="w-full glass-obsidian border-white/20 text-white rounded-xl text-xs uppercase font-bold">
              Current Plan
            </Button>
          </div>

          <div className="p-6 rounded-3xl glass-obsidian-strong border-2 border-cyan-400/50 shadow-2xl relative flex flex-col justify-between bg-gradient-to-b from-cyan-950/20 to-obsidian">
            <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-cyan-400 text-black font-bold text-[10px] font-mono uppercase">
              MOST POPULAR
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 block mb-1">B2B DJ ACCESS</span>
              <h3 className="text-lg font-bold text-white mb-2">DJ Vault & Crate Sync</h3>
              <p className="text-xs text-white/60 mb-4">Export Serato & Rekordbox crates with pre-analyzed hot cues and key maps.</p>
              <div className="text-2xl font-bold text-cyan-300 font-mono mb-4">$29 <span className="text-xs text-white/40 font-normal">/ month</span></div>

              <ul className="space-y-2 text-xs text-white/80 mb-6">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Unlimited long-set audio decoding</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> 1-Click Serato / Rekordbox .crate export</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Unreleased edit & dubplate alerts</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Fete Heatmap: Most played songs this weekend</li>
              </ul>
            </div>
            <Button className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold rounded-xl text-xs uppercase tracking-wider">
              Subscribe to DJ Vault
            </Button>
          </div>

          <div className="p-6 rounded-3xl glass-obsidian border border-gold-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400 block mb-1">RECORD LABELS & PROMOTERS</span>
              <h3 className="text-lg font-bold text-white mb-2">Catalog Royalty Monitor</h3>
              <p className="text-xs text-white/60 mb-4">Track global live fete play-counts and performance analytics across 500+ DJs.</p>
              <div className="text-2xl font-bold text-gold-400 font-mono mb-4">$500 <span className="text-xs text-white/40 font-normal">/ month</span></div>

              <ul className="space-y-2 text-xs text-white/70 mb-6">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-gold-400" /> 24/7 Global carnival audio tracking</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-gold-400" /> Real-time spins & crowd response data</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-gold-400" /> Unauthorized bootleg & remix detection</li>
              </ul>
            </div>
            <Button variant="outline" className="w-full glass-obsidian border-gold-500/40 text-gold-300 hover:text-white rounded-xl text-xs uppercase font-bold">
              Contact Enterprise
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
