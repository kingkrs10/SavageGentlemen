import fs from 'fs';
import path from 'path';

// Generate a 128 BPM high-energy electronic dance track as a standard PCM WAV file (16-bit 44.1kHz Stereo)
const sampleRate = 44100;
const bpm = 128;
const beatDuration = 60 / bpm; // 0.46875s
const bars = 8; // 32 beats = 15 seconds loop
const totalDuration = (32 * 60) / bpm;
const totalSamples = Math.floor(sampleRate * totalDuration);

const left = new Float32Array(totalSamples);
const right = new Float32Array(totalSamples);

// Synth chord frequencies (Hz) - Minor energetic progression
// Am -> F -> C -> G
const chordProgressions = [
  // Am: A3, C4, E4, A4
  [220.00, 261.63, 329.63, 440.00, 880.00],
  // F: F3, A3, C4, F4
  [174.61, 220.00, 261.63, 349.23, 698.46],
  // C: C3, E3, G3, C4
  [130.81, 164.81, 196.00, 261.63, 523.25, 1046.50],
  // G: G3, B3, D4, G4
  [196.00, 246.94, 293.66, 392.00, 783.99, 1567.98]
];

// Noise generator for hi-hats and snares
function whiteNoise() {
  return (Math.random() * 2 - 1);
}

for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;
  const currentBeat = t / beatDuration;
  const beatIndex = Math.floor(currentBeat);
  const beatFraction = currentBeat - beatIndex;
  const barIndex = Math.floor(currentBeat / 4) % 8;
  const chord = chordProgressions[Math.floor(barIndex / 2) % 4];

  let sampleL = 0;
  let sampleR = 0;

  // 1. Kick Drum (4-on-the-floor): 20Hz - 120Hz punchy sub sweep
  const kickTime = beatFraction * beatDuration;
  if (kickTime < 0.35) {
    const kickFreq = 48 + 120 * Math.exp(-kickTime * 35);
    const kickEnv = Math.exp(-kickTime * 9);
    const kickOsc = Math.sin(2 * Math.PI * kickFreq * kickTime) + 0.25 * Math.sin(2 * Math.PI * (kickFreq * 0.5) * kickTime);
    const kickDist = Math.tanh(kickOsc * 2.2) * kickEnv * 0.9;
    sampleL += kickDist;
    sampleR += kickDist;
  }

  // 2. Offbeat Hi-Hat (Every 0.5 beat): Crisp metallic high frequencies (4kHz - 12kHz)
  const hatBeatFraction = (currentBeat + 0.5) % 1.0;
  const hatTime = hatBeatFraction * beatDuration;
  if (hatTime < 0.12) {
    const hatEnv = Math.exp(-hatTime * 30);
    // Bandpassed metallic noise
    const metallic = (Math.sin(2 * Math.PI * 6500 * t) + Math.sin(2 * Math.PI * 9200 * t) + whiteNoise() * 1.5);
    const hat = metallic * hatEnv * 0.25;
    sampleL += hat * 0.8;
    sampleR += hat * 1.2;
  }

  // 3. Snare / Clap on beats 2 and 4 (beatIndex % 2 === 1)
  if (beatIndex % 2 === 1) {
    const snareTime = beatFraction * beatDuration;
    if (snareTime < 0.25) {
      const snareEnv = Math.exp(-snareTime * 15);
      const tone = Math.sin(2 * Math.PI * 210 * snareTime) * Math.exp(-snareTime * 25);
      const noise = whiteNoise() * 0.8;
      const snare = (tone * 0.5 + noise * 0.5) * snareEnv * 0.55;
      sampleL += snare * 0.9;
      sampleR += snare * 0.9;
    }
  }

  // 4. Sub-Bassline (40Hz - 90Hz): Driving 16th note rolling bass
  const sixteenth = (currentBeat * 4) % 1.0;
  const bassTime = sixteenth * (beatDuration / 4);
  const bassEnv = Math.exp(-bassTime * 10);
  const rootFreq = chord[0] / 2; // Deep bass note (43Hz - 110Hz)
  const bassOsc = Math.sin(2 * Math.PI * rootFreq * t) + 0.4 * Math.sin(2 * Math.PI * rootFreq * 2 * t);
  const bassDist = Math.tanh(bassOsc * 1.8) * bassEnv * 0.45;
  sampleL += bassDist;
  sampleR += bassDist;

  // 5. High-Energy Mid/High Synth Lead & Arpeggio (400Hz - 2000Hz)
  // 16th-note arpeggiator driving geometric Chladni modal changes!
  const arpIndex = Math.floor(currentBeat * 4) % chord.length;
  const arpFreq = chord[arpIndex] * (arpIndex % 2 === 0 ? 2 : 1.5);
  const arpTime = (currentBeat * 4 % 1.0) * (beatDuration / 4);
  const arpEnv = Math.exp(-arpTime * 8);
  // Sawtooth-like rich harmonics
  let synth = 0;
  for (let h = 1; h <= 5; h++) {
    synth += (1 / h) * Math.sin(2 * Math.PI * arpFreq * h * t + (h * 0.3));
  }
  synth = Math.tanh(synth * 1.2) * arpEnv * 0.25;

  // Stereo pan modulation on synth
  const pan = Math.sin(2 * Math.PI * 0.5 * t);
  sampleL += synth * (1 - pan * 0.3);
  sampleR += synth * (1 + pan * 0.3);

  // 6. Resonance Sweep (Pad layer in 500Hz - 1200Hz)
  const padFreq = chord[1];
  const padOsc = (Math.sin(2 * Math.PI * padFreq * t) + Math.sin(2 * Math.PI * (padFreq * 1.005) * t)) * 0.12;
  sampleL += padOsc;
  sampleR += padOsc;

  // Master Limiter / Soft clipper
  left[i] = Math.tanh(sampleL * 0.95);
  right[i] = Math.tanh(sampleR * 0.95);
}

// Encode to WAV format
function createWavBuffer(sampleRate, leftChannel, rightChannel) {
  const numChannels = 2;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = leftChannel.length * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF identifier
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < leftChannel.length; i++) {
    // Clamp to -1.0 .. 1.0
    const sL = Math.max(-1, Math.min(1, leftChannel[i]));
    const sR = Math.max(-1, Math.min(1, rightChannel[i]));
    const valL = sL < 0 ? sL * 0x8000 : sL * 0x7FFF;
    const valR = sR < 0 ? sR * 0x8000 : sR * 0x7FFF;
    buffer.writeInt16LE(Math.floor(valL), offset);
    offset += 2;
    buffer.writeInt16LE(Math.floor(valR), offset);
    offset += 2;
  }

  return buffer;
}

const wavBuffer = createWavBuffer(sampleRate, left, right);

// Ensure target directories exist
const sampleDirs = [
  path.resolve('./public/samples'),
  path.resolve('./samples')
];

for (const dir of sampleDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const targetFiles = [
  './public/samples/dance-anthem.wav',
  './public/samples/dance-anthem.mp3',
  './public/samples/chladni-dance.wav',
  './samples/dance-anthem.wav',
  './samples/dance-anthem.mp3'
];

for (const f of targetFiles) {
  fs.writeFileSync(f, wavBuffer);
  console.log(`Generated sample file: ${f} (${(wavBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

console.log('High-energy dance sample audio generated successfully!');
