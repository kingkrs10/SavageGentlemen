import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'wouter';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Upload, 
  Radio, 
  Mic, 
  Music, 
  Maximize2, 
  Minimize2, 
  Camera, 
  Sliders, 
  Zap, 
  Sparkles, 
  Activity, 
  ArrowLeft,
  Flame,
  ChevronDown,
  Disc
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { AudioProcessor, AudioBands, AudioSourceType, AVAILABLE_SAMPLES, SampleTrackInfo } from '@/lib/cymatics/AudioProcessor';
import { CymaticsEngine, PlateMode, VisualizerConfig, DEFAULT_CONFIG } from '@/lib/cymatics/CymaticsEngine';

export default function CymaticsVisualizer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const cymaticsEngineRef = useRef<CymaticsEngine | null>(null);

  // UI State
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState('Gbmnutron x Tano - Hero (Heroes Riddim)');
  const [sourceType, setSourceType] = useState<AudioSourceType>('sample');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTrackDropdown, setShowTrackDropdown] = useState(false);
  const [hasUserStarted, setHasUserStarted] = useState(false);
  const [activePreset, setActivePreset] = useState<'top' | 'isometric' | 'macro' | 'orbit'>('top');
  const [plateMode, setPlateMode] = useState<PlateMode>('flower');

  // Real-time Beat-Specific HUD Metrics
  const [hudMetrics, setHudMetrics] = useState({
    subBass: 0,
    kickPunch: 0,
    isKick: false,
    snareSnap: 0,
    isSnare: false,
    hihatTick: 0,
    isHihat: false,
    dominantFreqHz: 432,
    pitchNoteName: '432Hz (A4)',
    spokeCount: 24
  });

  // Config State
  const [config, setConfig] = useState<VisualizerConfig>({ ...DEFAULT_CONFIG, cameraPreset: 'top' });

  useEffect(() => {
    if (!containerRef.current) return;

    const processor = new AudioProcessor();
    audioProcessorRef.current = processor;

    processor.onStateChange = (playing, name) => {
      setIsPlaying(playing);
      setTrackName(name);
      setSourceType(processor.sourceType);
    };

    processor.onTimeUpdate = (current, dur) => {
      setCurrentTime(current);
      if (dur > 0) setDuration(dur);
    };

    const engine = new CymaticsEngine(containerRef.current, config);
    cymaticsEngineRef.current = engine;

    engine.start(() => {
      return processor.getAudioBands();
    });

    const hudInterval = setInterval(() => {
      if (!audioProcessorRef.current) return;
      const bands = audioProcessorRef.current.getAudioBands();
      setHudMetrics({
        subBass: Math.round(bands.subBass * 100),
        kickPunch: Math.round(bands.kickPunch * 100),
        isKick: bands.isKick,
        snareSnap: Math.round(bands.snareSnap * 100),
        isSnare: bands.isSnare,
        hihatTick: Math.round(bands.hihatTick * 100),
        isHihat: bands.isHihat,
        dominantFreqHz: bands.dominantFreqHz,
        pitchNoteName: bands.pitchNoteName,
        spokeCount: bands.spokeCount
      });
    }, 35);

    return () => {
      clearInterval(hudInterval);
      processor.stop();
      engine.destroy();
    };
  }, []);

  const handleStartExperience = async (track?: SampleTrackInfo) => {
    setHasUserStarted(true);
    if (!audioProcessorRef.current) return;
    const target = track || AVAILABLE_SAMPLES[0];
    await audioProcessorRef.current.loadSampleTrack(target.path, target.title);
    await audioProcessorRef.current.play();
  };

  const handleSelectTrack = async (track: SampleTrackInfo) => {
    setShowTrackDropdown(false);
    setHasUserStarted(true);
    if (!audioProcessorRef.current) return;
    await audioProcessorRef.current.loadSampleTrack(track.path, track.title);
    await audioProcessorRef.current.play();
  };

  const togglePlay = async () => {
    if (!hasUserStarted) {
      handleStartExperience();
      return;
    }
    if (audioProcessorRef.current) {
      audioProcessorRef.current.togglePlay();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioProcessorRef.current) {
      audioProcessorRef.current.seek(val);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioProcessorRef.current) {
      audioProcessorRef.current.setVolume(val);
    }
  };

  const toggleMute = () => {
    if (!audioProcessorRef.current) return;
    if (isMuted) {
      audioProcessorRef.current.setVolume(volume || 0.9);
      setIsMuted(false);
    } else {
      audioProcessorRef.current.setVolume(0);
      setIsMuted(true);
    }
  };

  const handleStartSynth = async () => {
    setHasUserStarted(true);
    if (!audioProcessorRef.current) return;
    await audioProcessorRef.current.startDanceSynthesizer();
  };

  const handleStartMic = async () => {
    setHasUserStarted(true);
    if (!audioProcessorRef.current) return;
    await audioProcessorRef.current.enableMicrophone();
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !audioProcessorRef.current) return;
    setHasUserStarted(true);
    await audioProcessorRef.current.loadAudioFile(file);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const changePlateMode = (mode: PlateMode) => {
    setPlateMode(mode);
    const updated = { ...config, plateMode: mode };
    setConfig(updated);
    if (cymaticsEngineRef.current) {
      cymaticsEngineRef.current.updateConfig(updated);
    }
  };

  const changeCameraPreset = (preset: 'top' | 'isometric' | 'macro' | 'orbit') => {
    setActivePreset(preset);
    const updated = { ...config, cameraPreset: preset };
    setConfig(updated);
    if (cymaticsEngineRef.current) {
      cymaticsEngineRef.current.applyCameraPreset(preset);
    }
  };

  const updateConfigValue = <K extends keyof VisualizerConfig>(key: K, value: VisualizerConfig[K]) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    if (cymaticsEngineRef.current) {
      cymaticsEngineRef.current.updateConfig(updated);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      className="relative w-screen h-screen bg-black overflow-hidden font-sans select-none text-white"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <SEOHead 
        title="432Hz CymaScope 3D Audio Visualizer | Beat-Synced Chladni Physics"
        description="High-definition 3D CymaScope & Chladni standing wave resonance simulation locked to every musical beat."
      />

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileInputChange} 
        accept="audio/*" 
        className="hidden" 
      />

      {/* 3D Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Drag & Drop Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-50 bg-black/85 border-4 border-dashed border-amber-500 flex flex-col items-center justify-center pointer-events-none backdrop-blur-md animate-pulse">
          <Upload className="w-20 h-20 text-amber-400 mb-4 animate-bounce" />
          <h2 className="text-3xl font-black tracking-wider text-amber-300">DROP AUDIO FILE TO RESONATE</h2>
          <p className="text-amber-200/80 mt-2 font-mono">Supports MP3, WAV, OGG, FLAC</p>
        </div>
      )}

      {/* Start Experience Modal */}
      {!hasUserStarted && (
        <div className="absolute inset-0 z-40 bg-black/92 flex flex-col items-center justify-center p-6 backdrop-blur-lg">
          <div className="max-w-xl w-full bg-neutral-950/90 border border-amber-500/40 rounded-2xl p-8 shadow-[0_0_90px_rgba(255,100,0,0.4)] text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 via-orange-500 to-yellow-400 flex items-center justify-center mb-6 shadow-[0_0_35px_rgba(255,140,0,0.85)] animate-pulse">
              <Flame className="w-8 h-8 text-black" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-widest bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent mb-3">
              432Hz CYMASCOPE 3D
            </h1>
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed mb-6 font-light">
              Authentic <strong className="text-amber-400 font-semibold">CymaScope Standing Wave Resonance</strong> calibrated for precise beat-by-beat sync. 
              Kick transients trigger core solar eruptions, snares flash radial spoke cells, and hi-hats ignite outer teeth serrations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-6">
              <button
                onClick={() => handleStartExperience(AVAILABLE_SAMPLES[0])}
                className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-black font-bold uppercase tracking-wider hover:opacity-95 transition-all shadow-[0_0_30px_rgba(255,140,0,0.7)] transform hover:scale-[1.02]"
              >
                <Play className="w-5 h-5 fill-current" />
                Play Hero (Heroes Riddim)
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-neutral-900 border border-amber-500/30 hover:border-amber-400 text-amber-300 font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-all transform hover:scale-[1.02]"
              >
                <Upload className="w-5 h-5" />
                Upload Audio File
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-neutral-400">
              <button onClick={handleStartSynth} className="hover:text-amber-400 flex items-center gap-1.5 transition-colors">
                <Radio className="w-4 h-4 text-amber-500" /> Generative Synth
              </button>
              <button onClick={handleStartMic} className="hover:text-amber-400 flex items-center gap-1.5 transition-colors">
                <Mic className="w-4 h-4 text-red-500" /> Live Microphone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR / NAVIGATION */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 py-4 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto relative">
          <Link href="/apps" className="p-2 rounded-xl bg-black/70 border border-white/10 hover:border-amber-500/50 hover:bg-black/90 backdrop-blur-md transition-all text-neutral-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div 
            onClick={() => setShowTrackDropdown(!showTrackDropdown)}
            className="bg-black/70 border border-white/10 hover:border-amber-500/40 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 cursor-pointer transition-all shadow-lg"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-amber-500 font-bold flex items-center gap-1.5">
                432Hz CYMASCOPE <span className="text-neutral-400 font-mono text-[9px]">BEAT-SYNCED</span>
              </div>
              <div className="text-sm font-semibold text-white truncate max-w-[160px] sm:max-w-[300px]">
                {trackName}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-400 ml-1" />
          </div>

          {showTrackDropdown && (
            <div className="absolute top-14 left-12 w-80 bg-neutral-950/95 border border-amber-500/30 rounded-2xl p-2 shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-1">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-neutral-500 border-b border-white/10">
                /SAMPLES PLAYLIST
              </div>
              {AVAILABLE_SAMPLES.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectTrack(s)}
                  className="text-left px-3 py-2 rounded-xl hover:bg-amber-500/20 text-xs text-neutral-200 hover:text-amber-300 transition-all flex flex-col"
                >
                  <span className="font-semibold text-white">{s.title}</span>
                  {s.artist && <span className="text-[10px] text-neutral-400">{s.artist}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="hidden md:flex items-center bg-black/70 border border-white/10 backdrop-blur-md rounded-xl p-1 gap-1">
            <button
              onClick={() => handleStartExperience(AVAILABLE_SAMPLES[0])}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                sourceType === 'sample' 
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-black font-bold shadow-[0_0_15px_rgba(255,120,0,0.6)]' 
                  : 'text-neutral-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Music className="w-3.5 h-3.5" /> Sample
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                sourceType === 'upload' 
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-black font-bold shadow-[0_0_15px_rgba(255,120,0,0.6)]' 
                  : 'text-neutral-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Upload
            </button>

            <button
              onClick={handleStartSynth}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                sourceType === 'synth' 
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-black font-bold shadow-[0_0_15px_rgba(255,120,0,0.6)]' 
                  : 'text-neutral-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Radio className="w-3.5 h-3.5" /> Synth
            </button>

            <button
              onClick={handleStartMic}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                sourceType === 'mic' 
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-black font-bold shadow-[0_0_15px_rgba(255,120,0,0.6)]' 
                  : 'text-neutral-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Mic className="w-3.5 h-3.5" /> Mic
            </button>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-xl bg-black/70 border backdrop-blur-md transition-all ${
              showSettings 
                ? 'border-amber-500 bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(255,160,0,0.3)]' 
                : 'border-white/10 text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
            title="Settings"
          >
            <Sliders className="w-5 h-5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-black/70 border border-white/10 hover:border-white/30 text-neutral-300 hover:text-white backdrop-blur-md transition-all"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MULTI-BEAT HUD (Left Side) */}
      <div className="absolute top-20 left-4 sm:left-6 z-20 pointer-events-none hidden sm:flex flex-col gap-2.5 max-w-[240px]">
        {/* 1. Kick Drum Sub-Bass (20-90Hz) */}
        <div className="bg-black/80 border border-white/10 backdrop-blur-md rounded-xl p-3 shadow-lg">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-red-500" /> Kick Drum (20-90Hz)
            </span>
            <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${hudMetrics.isKick ? 'bg-red-600 text-white animate-ping' : 'bg-neutral-800 text-neutral-400'}`}>
              {hudMetrics.isKick ? 'KICK HIT!' : 'PULSE'}
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden mb-1">
            <div 
              className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 transition-all duration-75"
              style={{ width: `${hudMetrics.subBass}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-neutral-400">
            <span>Level: {hudMetrics.subBass}%</span>
            <span className="text-amber-400">Core Flare</span>
          </div>
        </div>

        {/* 2. Snare / Clap / Mid Transient (200-1200Hz) */}
        <div className="bg-black/80 border border-white/10 backdrop-blur-md rounded-xl p-3 shadow-lg">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-amber-500" /> Snare / Clap (200-1.2k)
            </span>
            <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${hudMetrics.isSnare ? 'bg-amber-500 text-black font-bold animate-pulse' : 'bg-neutral-800 text-neutral-400'}`}>
              {hudMetrics.isSnare ? 'SNARE SNAP!' : 'CELLS'}
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden mb-1">
            <div 
              className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-75"
              style={{ width: `${hudMetrics.snareSnap}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-neutral-400">
            <span>Snap: {hudMetrics.snareSnap}%</span>
            <span className="text-yellow-300">Spoke Flash</span>
          </div>
        </div>

        {/* 3. Hi-Hat / 16th Note Ticks (5k-16kHz) */}
        <div className="bg-black/80 border border-white/10 backdrop-blur-md rounded-xl p-3 shadow-lg">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-yellow-400" /> Hi-Hats (5k-16kHz)
            </span>
            <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${hudMetrics.isHihat ? 'bg-yellow-400 text-black font-bold' : 'bg-neutral-800 text-neutral-400'}`}>
              {hudMetrics.isHihat ? '16TH TICK' : 'SHIMMER'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-300 transition-all duration-75"
              style={{ width: `${hudMetrics.hihatTick}%` }}
            />
          </div>
        </div>

        {/* 4. Active Pitch & Spoke Symmetry Tracker */}
        <div className="bg-black/80 border border-white/10 backdrop-blur-md rounded-xl p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
              <Disc className="w-3 h-3 text-amber-400" /> Pitch & Spoke Symmetry
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between font-mono">
            <span className="text-xs font-bold text-amber-400">{hudMetrics.pitchNoteName}</span>
            <span className="text-xs font-bold text-yellow-300">{hudMetrics.spokeCount} Spokes</span>
          </div>
        </div>
      </div>

      {/* SETTINGS DRAWER */}
      {showSettings && (
        <aside className="absolute top-20 right-4 sm:right-6 z-30 w-80 max-h-[calc(100vh-140px)] overflow-y-auto bg-black/90 border border-amber-500/30 backdrop-blur-xl rounded-2xl p-5 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Sliders className="w-4 h-4" /> Simulation Settings
            </h3>
            <button onClick={() => setShowSettings(false)} className="text-neutral-400 hover:text-white">✕</button>
          </div>

          <div>
            <div className="flex justify-between text-neutral-400 mb-1">
              <span>Kick Transient Sensitivity</span>
              <span className="font-mono text-amber-400">{config.kickSensitivity.toFixed(1)}x</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="2.5" 
              step="0.1" 
              value={config.kickSensitivity}
              onChange={(e) => updateConfigValue('kickSensitivity', parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-neutral-400 mb-1">
              <span>Harmonic Mode Complexity</span>
              <span className="font-mono text-amber-400">{config.harmonicSensitivity.toFixed(1)}x</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="2.5" 
              step="0.1" 
              value={config.harmonicSensitivity}
              onChange={(e) => updateConfigValue('harmonicSensitivity', parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <label className="flex items-center justify-between text-neutral-300 cursor-pointer">
              <span>Auto-Rotate Orbital Cam</span>
              <input 
                type="checkbox" 
                checked={config.autoRotate}
                onChange={(e) => updateConfigValue('autoRotate', e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
            </label>
          </div>
        </aside>
      )}

      {/* BOTTOM CONTROL DOCK */}
      <footer className="absolute bottom-4 sm:bottom-6 left-4 right-4 sm:left-6 sm:right-6 z-30 flex flex-col items-center pointer-events-none">
        <div className="max-w-4xl w-full bg-black/85 border border-white/15 backdrop-blur-xl rounded-2xl p-4 sm:px-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] pointer-events-auto flex flex-col gap-3.5">
          
          {/* Progress / Scrubber */}
          {duration > 0 && sourceType !== 'synth' && sourceType !== 'mic' && (
            <div className="flex items-center gap-3 w-full">
              <span className="text-[11px] font-mono text-neutral-400 w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <input 
                type="range" 
                min="0" 
                max={duration || 100} 
                step="0.1" 
                value={currentTime} 
                onChange={handleSeek}
                className="flex-1 accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] font-mono text-neutral-400 w-10">
                {formatTime(duration)}
              </span>
            </div>
          )}

          {/* Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Play/Pause & Volume */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-black flex items-center justify-center hover:opacity-95 transition-all shadow-[0_0_25px_rgba(255,140,0,0.6)] transform hover:scale-105 active:scale-95"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <div className="flex items-center gap-2 group">
                <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={isMuted ? 0 : volume} 
                  onChange={handleVolumeChange}
                  className="w-20 sm:w-24 accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Geometry Modes */}
            <div className="flex items-center bg-neutral-900/90 border border-white/10 rounded-xl p-1 gap-1 text-xs">
              <button
                onClick={() => changePlateMode('flower')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  plateMode === 'flower' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
                title="432Hz CymaScope Standing Wave"
              >
                CymaScope
              </button>

              <button
                onClick={() => changePlateMode('radial')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  plateMode === 'radial' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
                title="Bessel Radial Harmonics"
              >
                Radial
              </button>

              <button
                onClick={() => changePlateMode('hexagonal')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  plateMode === 'hexagonal' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
                title="Hexagonal Nodal Geometry"
              >
                Hex
              </button>
            </div>

            {/* Camera Presets */}
            <div className="flex items-center bg-neutral-900/90 border border-white/10 rounded-xl p-1 gap-1 text-xs">
              <button
                onClick={() => changeCameraPreset('top')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  activePreset === 'top' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
                title="Top-Down View (Reference Image Angle)"
              >
                2D Top
              </button>

              <button
                onClick={() => changeCameraPreset('isometric')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  activePreset === 'isometric' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
                title="3D Isometric View"
              >
                <Camera className="w-3.5 h-3.5" /> 3D
              </button>

              <button
                onClick={() => changeCameraPreset('macro')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  activePreset === 'macro' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
                title="Close-Up Macro View"
              >
                Macro
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
