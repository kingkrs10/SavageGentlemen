/**
 * AudioProcessor.ts
 * 
 * High-performance Web Audio API engine tailored for Cymatics & Chladni plate resonance.
 * Features:
 * - Ultra-low latency FFT spectral analysis (smoothingTimeConstant: 0.18 for millisecond-accurate beat sync)
 * - Multi-Band Beat & Transient Separation:
 *    - 1. Kick / Sub-Bass (20-90Hz): Instantaneous solar rosette flare & shockwave pulse
 *    - 2. Snare / Clap / Rim (200-1200Hz): Instantaneous cell body flash & spoke snap
 *    - 3. Hi-Hat / Shaker (5k-16kHz): 16th-note micro-tick serration & spark shimmer
 *    - 4. Melodic Pitch Tracker: Dominant frequency (Hz) locking harmonic spoke symmetry M
 * - Multi-source support:
 *    - Auto-load & stream tracks from /samples (Hero, Speechless, Sugar Waist, Dance Anthem)
 *    - HTML5 AudioElement / MediaElementSource with zero-latency streaming & hardware sync
 *    - Drag-and-drop & file upload
 *    - Generative 128 BPM Dance Synth
 *    - Live Microphone stream
 */

export interface AudioBands {
  // 1. Kick / Sub-Bass (20Hz - 90Hz)
  subBass: number;           // 0..1 normalized sub level
  bass: number;              // 0..1 normalized bass level
  kickPunch: number;         // 0..1 sharp transient spike (decays in ~75ms)
  isKick: boolean;           // True on exact kick transient frame

  // 2. Snare / Clap (200Hz - 1200Hz)
  snareSnap: number;         // 0..1 sharp mid transient spike
  isSnare: boolean;          // True on exact snare/clap frame

  // 3. Hi-Hat / Shaker (5kHz - 16kHz)
  hihatTick: number;         // 0..1 16th-note high transient tick
  isHihat: boolean;          // True on exact hi-hat frame

  // 4. Melodic Pitch & Harmonic Tracking (200Hz - 2500Hz)
  dominantFreqHz: number;    // Peak frequency in Hz
  pitchNoteName: string;     // Note name / frequency label
  midLow: number;            // 400Hz - 900Hz
  midHigh: number;           // 900Hz - 2000Hz
  midCentroid: number;       // Spectral center of mass (0..1)
  harmonicComplexity: number;// Harmonic dispersion (0..1)
  spokeCount: number;        // Dynamic spoke symmetry (16, 20, 24, 32, 48, 64)

  // 5. Highs & Master
  presence: number;          // 2k - 6kHz
  brilliance: number;        // 6k - 16kHz
  volume: number;            // RMS volume
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
}

export type AudioSourceType = 'sample' | 'upload' | 'synth' | 'mic';

export interface SampleTrackInfo {
  title: string;
  artist?: string;
  path: string;
}

export const AVAILABLE_SAMPLES: SampleTrackInfo[] = [
  {
    title: 'Hero (Heroes Riddim)',
    artist: 'Gbmnutron x Tano',
    path: '/samples/Gbmnutron x Tano - Hero (Heroes Riddim)  Official Audio.mp3'
  },
  {
    title: 'Dance Anthem (128 BPM Club Edit)',
    artist: 'Savage Resonance',
    path: '/samples/dance-anthem.mp3'
  },
  {
    title: '05 Speechless',
    artist: 'Soca & Dancehall',
    path: '/samples/05 Speechless.mp3'
  },
  {
    title: 'Sugar Waist (No Drums)',
    artist: 'Kerwin Du Bois x Yung Bredda',
    path: '/samples/TT_2024_-_Kerwin_Du_Bois_x_Yung_Bredda_-_Sugar_Waist_(No_Drums).mp3'
  }
];

// Note frequencies map
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function freqToNoteName(freq: number): string {
  if (freq < 40) return "Sub";
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  const note = NOTE_NAMES[midi % 12];
  const oct = Math.floor(midi / 12) - 1;
  return `${note}${oct} (${Math.round(freq)}Hz)`;
}

export class AudioProcessor {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  
  // HTML5 Audio Element
  private audioElement: HTMLAudioElement | null = null;
  private mediaElementSource: MediaElementAudioSourceNode | null = null;

  // Buffer source fallback
  private audioBuffer: AudioBuffer | null = null;
  private bufferSource: AudioBufferSourceNode | null = null;

  // Microphone stream
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;

  // Synthesizer nodes
  private synthInterval: number | null = null;
  private isSynthRunning: boolean = false;
  private synthGain: GainNode | null = null;

  // Playback state
  public isPlaying: boolean = false;
  public isLoaded: boolean = false;
  public currentTrackName: string = 'Gbmnutron x Tano - Hero (Heroes Riddim)';
  public currentTrackPath: string = '/samples/Gbmnutron x Tano - Hero (Heroes Riddim)  Official Audio.mp3';
  public sourceType: AudioSourceType = 'sample';
  public duration: number = 0;
  public playbackStartTime: number = 0;
  public pausedAt: number = 0;
  public volumeLevel: number = 0.9;

  // Multi-Band Transient Detectors
  private prevFreqData: Uint8Array = new Uint8Array(1024);
  
  // Kick tracker (20-90Hz)
  private kickHistory: number[] = [];
  private lastKickTime: number = 0;
  private kickDecay: number = 0;

  // Snare tracker (200-1200Hz)
  private lastSnareTime: number = 0;
  private snareDecay: number = 0;

  // Hi-Hat tracker (5k-16kHz)
  private lastHihatTime: number = 0;
  private hihatDecay: number = 0;

  // FFT Arrays
  private freqData: Uint8Array = new Uint8Array(1024);
  private timeData: Uint8Array = new Uint8Array(1024);

  // Callbacks
  public onStateChange?: (isPlaying: boolean, trackName: string) => void;
  public onTimeUpdate?: (currentTime: number, duration: number) => void;
  public onError?: (err: string) => void;

  constructor() {}

  public async initContext(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      // Fast 0.18 smoothing for millisecond-accurate transient response
      this.analyser.smoothingTimeConstant = 0.18;
      
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.volumeLevel, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);

      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.prevFreqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.frequencyBinCount);
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    return this.ctx;
  }

  private getOrCreateAudioElement(): HTMLAudioElement {
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.preload = 'auto';

      this.audioElement.addEventListener('timeupdate', () => {
        if (this.audioElement && this.onTimeUpdate) {
          this.duration = this.audioElement.duration || this.duration;
          this.onTimeUpdate(this.audioElement.currentTime, this.audioElement.duration || 0);
        }
      });

      this.audioElement.addEventListener('ended', () => {
        this.isPlaying = false;
        if (this.onStateChange) this.onStateChange(false, this.currentTrackName);
      });

      this.audioElement.addEventListener('loadedmetadata', () => {
        if (this.audioElement) {
          this.duration = this.audioElement.duration;
          this.isLoaded = true;
          if (this.onTimeUpdate) {
            this.onTimeUpdate(0, this.audioElement.duration);
          }
        }
      });
    }

    return this.audioElement;
  }

  private connectAudioElementToGraph(): void {
    if (!this.ctx || !this.analyser || !this.gainNode) return;
    const audio = this.getOrCreateAudioElement();

    if (!this.mediaElementSource) {
      try {
        this.mediaElementSource = this.ctx.createMediaElementSource(audio);
        this.mediaElementSource.connect(this.analyser);
        this.analyser.connect(this.gainNode);
      } catch (err) {
        console.warn('MediaElementSource already connected:', err);
      }
    }
  }

  public async loadSampleTrack(trackPath: string, trackTitle?: string): Promise<boolean> {
    try {
      await this.initContext();
      this.stop();

      this.sourceType = 'sample';
      this.currentTrackPath = trackPath;
      this.currentTrackName = trackTitle || trackPath.split('/').pop()?.replace(/\.[^/.]+$/, "") || 'Sample Track';

      const audio = this.getOrCreateAudioElement();
      this.connectAudioElementToGraph();

      const encodedPath = encodeURI(trackPath);
      audio.src = encodedPath;
      audio.volume = 1.0;

      await audio.load();
      this.isLoaded = true;

      if (this.onStateChange) {
        this.onStateChange(this.isPlaying, this.currentTrackName);
      }
      return true;
    } catch (err) {
      console.warn('Error loading via audio element, trying buffer fallback:', err);
      return this.loadSampleTrackAsBuffer(trackPath, trackTitle);
    }
  }

  private async loadSampleTrackAsBuffer(trackPath: string, trackTitle?: string): Promise<boolean> {
    try {
      const res = await fetch(encodeURI(trackPath));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      if (!this.ctx) await this.initContext();
      if (!this.ctx) return false;

      this.audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.duration = this.audioBuffer.duration;
      this.isLoaded = true;
      this.currentTrackName = trackTitle || trackPath.split('/').pop()?.replace(/\.[^/.]+$/, "") || 'Sample Track';

      if (this.onStateChange) {
        this.onStateChange(this.isPlaying, this.currentTrackName);
      }
      return true;
    } catch (err) {
      console.error('Buffer sample fallback failed:', err);
      this.startDanceSynthesizer();
      return true;
    }
  }

  public async loadDefaultSample(preferredPath?: string): Promise<boolean> {
    const defaultTrack = preferredPath 
      ? { path: preferredPath, title: preferredPath.split('/').pop() || 'Default Track' }
      : AVAILABLE_SAMPLES[0];

    return this.loadSampleTrack(defaultTrack.path, defaultTrack.title);
  }

  public async loadAudioFile(file: File): Promise<boolean> {
    try {
      await this.initContext();
      this.stop();

      this.sourceType = 'upload';
      this.currentTrackName = file.name.replace(/\.[^/.]+$/, "");

      const audio = this.getOrCreateAudioElement();
      this.connectAudioElementToGraph();

      const objectUrl = URL.createObjectURL(file);
      audio.src = objectUrl;

      await audio.load();
      this.isLoaded = true;

      await this.play();
      return true;
    } catch (err) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        if (!this.ctx) throw new Error('AudioContext missing');
        this.audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.duration = this.audioBuffer.duration;
        this.isLoaded = true;
        await this.play();
        return true;
      } catch (decodeErr) {
        console.error('Failed to load audio file:', decodeErr);
        if (this.onError) this.onError(`Could not decode audio file: ${(decodeErr as Error).message}`);
        return false;
      }
    }
  }

  public async play(): Promise<void> {
    await this.initContext();
    if (!this.ctx || !this.analyser || !this.gainNode) return;

    if (this.sourceType === 'synth') {
      this.startDanceSynthesizer();
      this.isPlaying = true;
      if (this.onStateChange) this.onStateChange(true, this.currentTrackName);
      return;
    }

    if (this.audioElement && this.audioElement.src) {
      try {
        this.connectAudioElementToGraph();
        await this.audioElement.play();
        this.isPlaying = true;
        if (this.onStateChange) this.onStateChange(true, this.currentTrackName);
        return;
      } catch (err) {
        console.warn('audioElement.play() rejected:', err);
      }
    }

    if (this.audioBuffer) {
      if (this.bufferSource) {
        try { this.bufferSource.stop(); this.bufferSource.disconnect(); } catch {}
      }
      this.bufferSource = this.ctx.createBufferSource();
      this.bufferSource.buffer = this.audioBuffer;
      this.bufferSource.loop = true;
      this.bufferSource.connect(this.analyser);
      this.analyser.connect(this.gainNode);

      const offset = this.pausedAt % (this.audioBuffer.duration || 1);
      this.playbackStartTime = this.ctx.currentTime - offset;
      this.bufferSource.start(0, offset);
      this.isPlaying = true;
      if (this.onStateChange) this.onStateChange(true, this.currentTrackName);
      return;
    }

    await this.loadDefaultSample();
    await this.play();
  }

  public pause(): void {
    if (this.sourceType === 'synth') {
      this.stopDanceSynthesizer();
    } else if (this.audioElement) {
      this.audioElement.pause();
    } else if (this.bufferSource && this.ctx) {
      this.pausedAt = this.ctx.currentTime - this.playbackStartTime;
      try { this.bufferSource.stop(); this.bufferSource.disconnect(); } catch {}
      this.bufferSource = null;
    }

    this.isPlaying = false;
    if (this.onStateChange) {
      this.onStateChange(false, this.currentTrackName);
    }
  }

  public togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public seek(seconds: number): void {
    if (this.audioElement && this.audioElement.duration) {
      this.audioElement.currentTime = Math.max(0, Math.min(seconds, this.audioElement.duration));
    } else if (this.audioBuffer) {
      this.pausedAt = Math.max(0, Math.min(seconds, this.duration));
      if (this.isPlaying) {
        this.play();
      }
    }
  }

  public setVolume(vol: number): void {
    this.volumeLevel = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volumeLevel, this.ctx.currentTime);
    }
    if (this.synthGain && this.ctx) {
      this.synthGain.gain.setValueAtTime(this.volumeLevel * 0.75, this.ctx.currentTime);
    }
  }

  public async enableMicrophone(): Promise<boolean> {
    try {
      await this.initContext();
      this.stop();

      this.sourceType = 'mic';
      this.currentTrackName = 'Live Microphone Input';

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.micStream = stream;

      if (!this.ctx || !this.analyser) return false;
      this.micSource = this.ctx.createMediaStreamSource(stream);
      this.micSource.connect(this.analyser);

      this.isPlaying = true;
      this.isLoaded = true;
      if (this.onStateChange) this.onStateChange(true, this.currentTrackName);
      return true;
    } catch (err) {
      console.error('Microphone access denied:', err);
      if (this.onError) this.onError(`Microphone access failed: ${(err as Error).message}`);
      return false;
    }
  }

  public async startDanceSynthesizer(): Promise<void> {
    await this.initContext();
    this.stop();

    this.sourceType = 'synth';
    this.currentTrackName = 'Generative 128 BPM Dance Engine';
    this.isLoaded = true;
    this.isPlaying = true;
    this.isSynthRunning = true;

    if (!this.ctx || !this.analyser || !this.gainNode) return;

    this.synthGain = this.ctx.createGain();
    this.synthGain.gain.setValueAtTime(this.volumeLevel * 0.8, this.ctx.currentTime);
    this.synthGain.connect(this.analyser);
    this.analyser.connect(this.gainNode);

    const bpm = 128;
    const stepDuration = 60 / bpm / 4;
    let step = 0;

    const chords = [
      [220.00, 261.63, 329.63, 440.00, 880.00],
      [174.61, 220.00, 261.63, 349.23, 698.46],
      [130.81, 164.81, 196.00, 261.63, 523.25],
      [196.00, 246.94, 293.66, 392.00, 783.99]
    ];

    const playStep = () => {
      if (!this.isSynthRunning || !this.ctx || !this.synthGain) return;
      const now = this.ctx.currentTime;
      const currentChord = chords[Math.floor((step / 16) % 4)];

      // 1. Kick on every beat
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(150, now);
        kickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
        kickOsc.frequency.exponentialRampToValueAtTime(28, now + 0.28);

        kickGain.gain.setValueAtTime(1.0, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        kickOsc.connect(kickGain);
        kickGain.connect(this.synthGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.35);
      }

      // 2. Offbeat Hi-Hat
      if (step % 4 === 2) {
        const bufferSize = this.ctx.sampleRate * 0.08;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.018));
        }
        const hatSource = this.ctx.createBufferSource();
        hatSource.buffer = buffer;
        const hatFilter = this.ctx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(7500, now);

        const hatGain = this.ctx.createGain();
        hatGain.gain.setValueAtTime(0.35, now);
        hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        hatSource.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(this.synthGain);
        hatSource.start(now);
        hatSource.stop(now + 0.09);
      }

      // 3. Snare/Clap on steps 4 and 12
      if (step % 8 === 4) {
        const snareNoise = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.16, this.ctx.sampleRate);
        const data = snareNoise.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.035));
        }
        const noiseSrc = this.ctx.createBufferSource();
        noiseSrc.buffer = snareNoise;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        noiseSrc.connect(noiseGain);
        noiseGain.connect(this.synthGain);
        noiseSrc.start(now);
        noiseSrc.stop(now + 0.18);
      }

      // 4. Energetic Lead Arp
      const noteIdx = step % currentChord.length;
      const leadFreq = currentChord[noteIdx] * (step % 2 === 0 ? 2 : 1.5);
      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();
      leadOsc.type = 'sawtooth';
      leadOsc.frequency.setValueAtTime(leadFreq, now);

      const leadFilter = this.ctx.createBiquadFilter();
      leadFilter.type = 'bandpass';
      leadFilter.frequency.setValueAtTime(leadFreq, now);
      leadFilter.Q.setValueAtTime(3.5, now);

      leadGain.gain.setValueAtTime(0.3, now);
      leadGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.85);

      leadOsc.connect(leadFilter);
      leadFilter.connect(leadGain);
      leadGain.connect(this.synthGain);
      leadOsc.start(now);
      leadOsc.stop(now + stepDuration);

      step = (step + 1) % 64;
    };

    this.synthInterval = window.setInterval(playStep, stepDuration * 1000);
    if (this.onStateChange) this.onStateChange(true, this.currentTrackName);
  }

  private stopDanceSynthesizer(): void {
    this.isSynthRunning = false;
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.synthGain) {
      try { this.synthGain.disconnect(); } catch {}
      this.synthGain = null;
    }
  }

  public stop(): void {
    this.stopDanceSynthesizer();

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }

    if (this.bufferSource) {
      try { this.bufferSource.stop(); this.bufferSource.disconnect(); } catch {}
      this.bufferSource = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      try { this.micSource.disconnect(); } catch {}
      this.micSource = null;
    }

    this.isPlaying = false;
    this.pausedAt = 0;
    if (this.onStateChange) this.onStateChange(false, this.currentTrackName);
  }

  /**
   * Multi-Band Beat & Transient Separation
   * Extracts distinct per-beat impulses for Kick, Snare, Hi-Hat, and Dominant Note Pitch
   */
  public getAudioBands(): AudioBands {
    if (!this.analyser || !this.isPlaying) {
      return {
        subBass: 0,
        bass: 0,
        kickPunch: 0,
        isKick: false,
        snareSnap: 0,
        isSnare: false,
        hihatTick: 0,
        isHihat: false,
        dominantFreqHz: 432,
        pitchNoteName: '432Hz (A4)',
        midLow: 0,
        midHigh: 0,
        midCentroid: 0.5,
        harmonicComplexity: 0.2,
        spokeCount: 24,
        presence: 0,
        brilliance: 0,
        volume: 0,
        frequencyData: this.freqData,
        timeDomainData: this.timeData
      };
    }

    this.analyser.getByteFrequencyData(this.freqData);
    this.analyser.getByteTimeDomainData(this.timeData);

    const sampleRate = this.ctx ? this.ctx.sampleRate : 44100;
    const binHz = (sampleRate / 2) / this.analyser.frequencyBinCount; // ~21.53 Hz per bin

    const getAverageInRange = (minHz: number, maxHz: number): number => {
      const minBin = Math.max(0, Math.floor(minHz / binHz));
      const maxBin = Math.min(1023, Math.ceil(maxHz / binHz));
      if (maxBin <= minBin) return this.freqData[minBin] / 255;
      let sum = 0;
      for (let b = minBin; b <= maxBin; b++) {
        sum += this.freqData[b];
      }
      return (sum / (maxBin - minBin + 1)) / 255;
    };

    const now = performance.now();

    // 1. KICK / SUB-BASS (20Hz - 90Hz, Bins 1..4)
    const subBass = getAverageInRange(20, 70);
    const bass = getAverageInRange(70, 140);
    const lowComb = subBass * 0.75 + bass * 0.25;

    let subFlux = 0;
    for (let b = 1; b <= 4; b++) {
      const diff = (this.freqData[b] - this.prevFreqData[b]) / 255;
      if (diff > 0) subFlux += diff * diff;
    }

    this.kickHistory.push(lowComb);
    if (this.kickHistory.length > 16) this.kickHistory.shift();
    const avgKick = this.kickHistory.reduce((a, b) => a + b, 0) / this.kickHistory.length;

    let isKick = false;
    if ((lowComb > 0.26 || subFlux > 0.035) && lowComb > avgKick * 1.22 && (now - this.lastKickTime) > 85) {
      isKick = true;
      this.lastKickTime = now;
      this.kickDecay = 1.0;
    } else {
      this.kickDecay *= 0.80; // Fast ~75ms decay
    }

    // 2. SNARE / CLAP / RIM (200Hz - 1200Hz, Bins 10..55)
    let snareFlux = 0;
    for (let b = 10; b <= 55; b++) {
      const diff = (this.freqData[b] - this.prevFreqData[b]) / 255;
      if (diff > 0) snareFlux += diff * diff;
    }
    const snareEnergy = getAverageInRange(200, 1200);

    let isSnare = false;
    if (snareFlux > 0.08 && snareEnergy > 0.22 && (now - this.lastSnareTime) > 90) {
      isSnare = true;
      this.lastSnareTime = now;
      this.snareDecay = 1.0;
    } else {
      this.snareDecay *= 0.78;
    }

    // 3. HI-HAT / SHAKER (5kHz - 16kHz, Bins 230..740)
    let hihatFlux = 0;
    for (let b = 230; b <= 740; b += 4) {
      const diff = (this.freqData[b] - this.prevFreqData[b]) / 255;
      if (diff > 0) hihatFlux += diff * diff;
    }
    const hihatEnergy = getAverageInRange(5000, 15000);

    let isHihat = false;
    if (hihatFlux > 0.03 && hihatEnergy > 0.15 && (now - this.lastHihatTime) > 50) {
      isHihat = true;
      this.lastHihatTime = now;
      this.hihatDecay = 1.0;
    } else {
      this.hihatDecay *= 0.75;
    }

    // Update previous frame
    this.prevFreqData.set(this.freqData);

    // 4. MELODIC PITCH & DOMINANT FREQUENCY TRACKER (150Hz - 2500Hz)
    const minMelodyBin = Math.floor(150 / binHz);
    const maxMelodyBin = Math.ceil(2500 / binHz);
    let maxVal = 0;
    let dominantBin = minMelodyBin;
    let weightedSum = 0;
    let totalMidWeight = 0;

    for (let b = minMelodyBin; b <= maxMelodyBin; b++) {
      const val = this.freqData[b];
      weightedSum += b * val;
      totalMidWeight += val;
      if (val > maxVal) {
        maxVal = val;
        dominantBin = b;
      }
    }

    const dominantFreqHz = dominantBin * binHz;
    const pitchNoteName = freqToNoteName(dominantFreqHz);
    const midCentroid = totalMidWeight > 0 
      ? (weightedSum / totalMidWeight - minMelodyBin) / (maxMelodyBin - minMelodyBin) 
      : 0.5;

    // Harmonic Spoke Quantization (16, 20, 24, 32, 48, 64)
    let spokeCount = 24;
    if (dominantFreqHz < 250) spokeCount = 16;
    else if (dominantFreqHz < 400) spokeCount = 20;
    else if (dominantFreqHz < 550) spokeCount = 24; // 432Hz harmonic sweet spot
    else if (dominantFreqHz < 900) spokeCount = 32;
    else if (dominantFreqHz < 1500) spokeCount = 48;
    else spokeCount = 64;

    const midLow = getAverageInRange(400, 950);
    const midHigh = getAverageInRange(950, 2200);
    const presence = getAverageInRange(2000, 6500);
    const brilliance = getAverageInRange(6500, 16000);

    // RMS Volume
    let rmsSum = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const v = (this.timeData[i] - 128) / 128;
      rmsSum += v * v;
    }
    const volume = Math.sqrt(rmsSum / this.timeData.length);

    return {
      subBass,
      bass,
      kickPunch: this.kickDecay,
      isKick,
      snareSnap: this.snareDecay,
      isSnare,
      hihatTick: this.hihatDecay,
      isHihat,
      dominantFreqHz: Math.round(dominantFreqHz),
      pitchNoteName,
      midLow,
      midHigh,
      midCentroid: Math.max(0, Math.min(1, midCentroid)),
      harmonicComplexity: Math.min(1.0, (midLow + midHigh) * 0.7),
      spokeCount,
      presence,
      brilliance,
      volume,
      frequencyData: this.freqData,
      timeDomainData: this.timeData
    };
  }

  public getCurrentTime(): number {
    if (this.audioElement && this.sourceType !== 'synth' && this.sourceType !== 'mic') {
      return this.audioElement.currentTime;
    }
    if (!this.ctx || !this.audioBuffer || this.sourceType === 'synth' || this.sourceType === 'mic') return 0;
    if (!this.isPlaying) return this.pausedAt;
    return (this.ctx.currentTime - this.playbackStartTime) % (this.duration || 1);
  }
}
