# Neon Piano Hero

A futuristic, gamified piano learning web application designed for kids!

## Features
- **Synthesized Audio:** Built entirely with the Web Audio API (no external sound files required).
- **Gamification:** Play notes to score points. Every 50 points triggers a "Boss Battle" where you must play a specific 5-note sequence to advance.
- **Visuals:** Pressing keys creates colorful paint splatters.
- **Engineering Mode:** Toggle the "Look Inside" switch to change the sound waveform to a square wave and visualize the sound frequencies as animated waves!
- **PWA Ready:** Can be installed directly to a mobile device's home screen.

## How to Run

Since the application uses standard web technologies, there are no heavy frameworks to install.

### Option 1: Live Server (Recommended)
1. Navigate to this directory in your terminal:
   ```bash
   cd /Users/sg/.gemini/antigravity/scratch/piano-learning-app
   ```
2. Start a simple Python HTTP server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open your browser and go to `http://localhost:8000`.

### Option 2: Direct File Open
You can simply open the `index.html` file in your preferred modern browser, although Service Workers (PWA functionality) might require a secure context (localhost or HTTPS) to function fully.

## How to play
- Click, touch, or use your keyboard to play the piano!
- **Keyboard Controls:** 
  - `A` to `K` for white keys (C4 to C5).
  - `W`, `E`, `T`, `Y`, `U` for black keys (C#4 to A#4).
- Turn on "Look Inside" to see the sound waves.
