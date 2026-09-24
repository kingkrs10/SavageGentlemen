import React, { useState } from "react";
import { useAudioPlayer, Track } from "@/context/AudioPlayerContext";
import { Play, Pause, Volume2, VolumeX, Music, Sparkles, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import SGFlyerLogoPng from "@assets/SGFLYERLOGO.png";

export const GlobalAudioPlayer = () => {
  const { currentTrack, isPlaying, progress, togglePlay, seek, volume, setVolume, closePlayer, playTrack } = useAudioPlayer();
  const [isDismissed, setIsDismissed] = useState(false);
  const [, navigate] = useLocation();

  // Query published mixes - only show when mixes are available
  const { data: mixes = [] } = useQuery<any[]>({
    queryKey: ['/api/music/mixes'],
    queryFn: () => fetch('/api/music/mixes').then(r => r.ok ? r.json() : []).catch(() => []),
    staleTime: 30000,
  });

  // Only show when there are mixes available, and user has not dismissed it
  if (!mixes || mixes.length === 0 || isDismissed) {
    return null;
  }

  // Active track is either the currently playing/selected track, or the first available mix
  const activeTrack: Track = currentTrack || {
    id: mixes[0].id,
    title: mixes[0].title,
    artist: mixes[0].artist || mixes[0].description || "Savage Gentlemen Audio",
    src: mixes[0].previewUrl || mixes[0].fileUrl || `/api/music/mixes/${mixes[0].id}/preview`,
    artwork: mixes[0].artworkUrl || SGFlyerLogoPng,
    price: mixes[0].priceInCents || 199,
    duration: mixes[0].durationSeconds,
  };

  const handlePlayToggle = () => {
    if (!currentTrack) {
      playTrack(activeTrack);
    } else {
      togglePlay();
    }
  };

  const handleClose = () => {
    setIsDismissed(true);
    closePlayer();
  };

  const formattedPrice = activeTrack.price ? `$${(activeTrack.price / 100).toFixed(2)}` : "$1.99";

  return (
    <div
      className={`fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl transition-all duration-500 ease-out`}
    >
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-gold-600 via-amber-500 to-yellow-600 rounded-2xl blur-md opacity-30 group-hover:opacity-60 transition duration-500 pointer-events-none" />

      <div className="relative glass-obsidian-strong border border-gold-500/30 rounded-2xl p-3 md:px-6 md:py-3 shadow-2xl backdrop-blur-2xl">
        {/* Progress Bar Top Edge */}
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-white/10 rounded-t-2xl cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            seek(pos * 100);
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-gold-500 to-amber-300 rounded-t-2xl relative transition-all duration-100"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 md:gap-6 pt-1">
          {/* Track Info & Equalizer */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-obsidian-light flex-shrink-0 border border-gold-500/20 shadow-inner flex items-center justify-center">
              {activeTrack.artwork ? (
                <img src={activeTrack.artwork} alt={activeTrack.title} className="w-full h-full object-cover" />
              ) : (
                <Music className="w-5 h-5 text-gold-400" />
              )}
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                  <span className="audio-bar h-3" />
                  <span className="audio-bar h-4" />
                  <span className="audio-bar h-2" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-gold-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-gold-400 animate-pulse" />
                  LIVE PREVIEW
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-300 border border-gold-500/20 font-mono">
                  {formattedPrice} HQ STEMS
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-[320px] md:max-w-md">
                {activeTrack.title}
              </h4>
              <p className="text-xs text-white/50 truncate hidden sm:block">
                {activeTrack.artist || "Savage Gentlemen Audio"}
              </p>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={handlePlayToggle}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-black font-bold shadow-lg shadow-gold-500/20 hover:scale-105 transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
            </Button>

            {/* Quick Unlock / Monetization Button */}
            <Button
              size="sm"
              onClick={() => navigate("/media")}
              className="hidden md:flex items-center gap-1.5 bg-white/10 hover:bg-gold-500/20 text-white hover:text-gold-300 border border-gold-500/30 hover:border-gold-500 text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-xl transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-gold-400" />
              Unlock Full Mix ({formattedPrice})
            </Button>

            {/* Volume Control on Desktop */}
            <div className="hidden lg:flex items-center gap-2 w-28">
              <button
                onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
                className="text-white/60 hover:text-gold-400 transition"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <Slider
                value={[volume * 100]}
                min={0}
                max={100}
                step={1}
                onValueChange={(val) => setVolume(val[0] / 100)}
                className="w-20"
              />
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="text-white/40 hover:text-white p-1 transition"
              aria-label="Close Player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
