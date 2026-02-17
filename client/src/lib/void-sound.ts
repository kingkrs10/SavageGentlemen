/**
 * Void Sound — Soothing frequency generator using Web Audio API
 * Uses Solfeggio frequencies (174 Hz + 285 Hz) for a warm binaural effect
 */

let audioContext: AudioContext | null = null;
let oscillator1: OscillatorNode | null = null;
let oscillator2: OscillatorNode | null = null;
let gainNode: GainNode | null = null;

export function playVoidSound(): void {
    try {
        // Create audio context
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);

        // Primary oscillator — 174 Hz (Solfeggio frequency for pain relief/relaxation)
        oscillator1 = audioContext.createOscillator();
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(174, audioContext.currentTime);

        // Secondary oscillator — 285 Hz (Solfeggio frequency for healing)
        oscillator2 = audioContext.createOscillator();
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(285, audioContext.currentTime);

        // Create individual gain nodes for mixing
        const gain1 = audioContext.createGain();
        gain1.gain.setValueAtTime(0.3, audioContext.currentTime);

        const gain2 = audioContext.createGain();
        gain2.gain.setValueAtTime(0.15, audioContext.currentTime);

        // Connect oscillators through individual gains to master gain
        oscillator1.connect(gain1);
        gain1.connect(gainNode);

        oscillator2.connect(gain2);
        gain2.connect(gainNode);

        gainNode.connect(audioContext.destination);

        // Start oscillators
        oscillator1.start();
        oscillator2.start();

        // Fade in over 1 second
        gainNode.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 1);

        // Gentle frequency sweep for ethereal effect
        oscillator1.frequency.linearRampToValueAtTime(180, audioContext.currentTime + 3);
        oscillator2.frequency.linearRampToValueAtTime(290, audioContext.currentTime + 3);
    } catch (e) {
        console.warn('Could not play void sound:', e);
    }
}

export function stopVoidSound(): void {
    try {
        if (gainNode && audioContext) {
            // Fade out over 1.5 seconds
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.5);

            // Clean up after fade out
            setTimeout(() => {
                oscillator1?.stop();
                oscillator2?.stop();
                audioContext?.close();
                oscillator1 = null;
                oscillator2 = null;
                gainNode = null;
                audioContext = null;
            }, 2000);
        }
    } catch (e) {
        console.warn('Could not stop void sound:', e);
    }
}
