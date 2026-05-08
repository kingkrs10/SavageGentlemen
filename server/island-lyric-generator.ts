/**
 * IslandLyric.bot — Video Generation Engine
 * 
 * Pipeline:
 * 1. Get audio duration via ffprobe
 * 2. Parse lyrics TXT into lines
 * 3. Fetch background photos from Pexels API
 * 4. Generate video with ffmpeg: photo slideshow + drawtext lyrics + audio
 * 5. Serve video and send email
 * 
 * Optimized for Render.com free tier (512MB RAM):
 * - Uses ffmpeg drawtext filter (no canvas dependency)
 * - 720p @ 24fps with ultrafast preset
 * - Single ffmpeg process, single thread
 * - Aggressive temp file cleanup
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { updateJob, getJob } from './island-lyric-store';
import { sendLyricVideoEmail, sendLyricErrorEmail } from './island-lyric-email';

// Paths to ffmpeg/ffprobe binaries
// Prefer system-installed (Homebrew) over npm static binaries
// because macOS Gatekeeper blocks unsigned npm binaries
import { execSync as execSyncImport } from 'child_process';

function findBinary(name: string, npmFallback: () => string): string {
  // Try system binary first
  try {
    const systemPath = execSyncImport(`which ${name}`, { encoding: 'utf-8', timeout: 3000 }).trim();
    if (systemPath) {
      console.log(`[IslandLyric] Using system ${name}: ${systemPath}`);
      return systemPath;
    }
  } catch { /* not found in PATH */ }

  // Try npm static binary
  try {
    const npmPath = npmFallback();
    if (npmPath && fs.existsSync(npmPath)) {
      console.log(`[IslandLyric] Using npm ${name}: ${npmPath}`);
      return npmPath;
    }
  } catch { /* npm package not installed */ }

  // Last resort: bare command name
  console.warn(`[IslandLyric] ⚠️ ${name} not found, using bare command`);
  return name;
}

const ffmpegPath = findBinary('ffmpeg', () => require('ffmpeg-static'));
const ffprobePath = findBinary('ffprobe', () => require('ffprobe-static').path);

const RENDER_WIDTH = 1280;
const RENDER_HEIGHT = 720;
const RENDER_FPS = 24;
const MAX_RENDER_TIME_MS = 10 * 60 * 1000; // 10 minutes max

// ──────────────────────────────────────────
// Step 1: Audio duration via ffprobe
// ──────────────────────────────────────────
export function getAudioDuration(audioPath: string): number {
  try {
    const result = execSyncImport(
      `"${ffprobePath}" -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`,
      { encoding: 'utf-8', timeout: 15000 }
    );
    const duration = parseFloat(result.trim());
    if (isNaN(duration) || duration <= 0) {
      throw new Error('Invalid audio duration');
    }
    console.log(`[IslandLyric] Audio duration: ${duration.toFixed(1)}s`);
    return duration;
  } catch (error) {
    console.error('[IslandLyric] ffprobe error:', error);
    throw new Error('Failed to read audio file. Ensure it is a valid MP3.');
  }
}

// ──────────────────────────────────────────
// Step 2: Parse lyrics
// ──────────────────────────────────────────
export function parseLyrics(lyricsPath: string): string[] {
  const raw = fs.readFileSync(lyricsPath, 'utf-8');
  const lines = raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    throw new Error('Lyrics file is empty.');
  }
  console.log(`[IslandLyric] Parsed ${lines.length} lyric lines`);
  return lines;
}

// ──────────────────────────────────────────
// Step 3: Fetch Pexels background photos
// ──────────────────────────────────────────
interface PexelsPhoto {
  src: { landscape: string };
}

async function fetchPexelsPhotos(query: string, count: number): Promise<string[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.warn('[IslandLyric] No PEXELS_API_KEY — using solid color backgrounds');
    return [];
  }

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape&size=medium`;
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
    });

    if (!res.ok) {
      console.error(`[IslandLyric] Pexels API error: ${res.status}`);
      return [];
    }

    const data = await res.json() as { photos: PexelsPhoto[] };
    return data.photos.map(p => p.src.landscape);
  } catch (error) {
    console.error('[IslandLyric] Pexels fetch error:', error);
    return [];
  }
}

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────
// Step 4: Generate a solid color fallback background
// ──────────────────────────────────────────
function generateFallbackBackground(destPath: string, colorIndex: number): void {
  // Caribbean-themed colors
  const colors = [
    '0a0a0a', '1a0a00', '001a0a', '0a001a', '1a1a00',
    '0a1a1a', '1a0a1a', '0d1a0a', '1a0d0a', '0a0d1a'
  ];
  const color = colors[colorIndex % colors.length];

  execSyncImport(
    `"${ffmpegPath}" -f lavfi -i color=c=0x${color}:s=${RENDER_WIDTH}x${RENDER_HEIGHT}:d=1 -frames:v 1 -y "${destPath}"`,
    { timeout: 10000, stdio: 'pipe' }
  );
}

// ──────────────────────────────────────────
// Step 5: Build ffmpeg drawtext filter chain
// ──────────────────────────────────────────
function escapeDrawtext(text: string): string {
  // Escape special characters for ffmpeg drawtext
  return text
    .replace(/\\/g, '\\\\\\\\')
    .replace(/'/g, "'\\\\\\''")
    .replace(/:/g, '\\\\:')
    .replace(/%/g, '%%')
    .replace(/\[/g, '\\\\[')
    .replace(/\]/g, '\\\\]')
    .replace(/;/g, '\\\\;')
    .replace(/,/g, '\\\\,');
}

function buildDrawtextFilters(
  lines: string[],
  duration: number,
  fontFile: string
): string {
  const lineDuration = duration / lines.length;
  const filters: string[] = [];

  // Scale + crop background to exact dimensions
  filters.push(`scale=${RENDER_WIDTH}:${RENDER_HEIGHT}:force_original_aspect_ratio=increase`);
  filters.push(`crop=${RENDER_WIDTH}:${RENDER_HEIGHT}`);

  // Semi-transparent dark overlay for text readability
  filters.push(`drawbox=x=0:y=${RENDER_HEIGHT * 0.35}:w=${RENDER_WIDTH}:h=${RENDER_HEIGHT * 0.3}:color=black@0.55:t=fill`);

  // Lyric lines — one drawtext per line with enable timing
  for (let i = 0; i < lines.length; i++) {
    const startTime = i * lineDuration;
    const endTime = (i + 1) * lineDuration;
    const escaped = escapeDrawtext(lines[i]);

    // Main lyric text
    // Escape for ffmpeg filter: backslashes, colons, and spaces need escaping
    const escapedFontFile = fontFile
      .replace(/\\/g, '\\\\\\\\')
      .replace(/[:]/g, '\\\\:')
      .replace(/ /g, '\\\\ ');

    const fontOpts = escapedFontFile
      ? `fontfile=${escapedFontFile}`
      : `font='Arial'`;

    filters.push(
      `drawtext=${fontOpts}:text='${escaped}'` +
      `:fontsize=42:fontcolor=white:borderw=3:bordercolor=black` +
      `:x=(w-text_w)/2:y=(h-text_h)/2` +
      `:enable='between(t\\,${startTime.toFixed(3)}\\,${endTime.toFixed(3)})'`
    );
  }

  // Permanent watermark — bottom right
  const escapedWmFont = fontFile
    .replace(/\\/g, '\\\\\\\\')
    .replace(/[:]/g, '\\\\:')
    .replace(/ /g, '\\\\ ');

  const wmFontOpts = escapedWmFont
    ? `fontfile=${escapedWmFont}`
    : `font='Arial'`;

  filters.push(
    `drawtext=${wmFontOpts}:text='IslandLyric.bot'` +
    `:fontsize=18:fontcolor=white@0.45:borderw=1:bordercolor=black@0.3` +
    `:x=w-text_w-20:y=h-30`
  );

  return filters.join(',');
}

// ──────────────────────────────────────────
// Step 6: Build concat file for photo slideshow
// ──────────────────────────────────────────
function buildConcatFile(bgPaths: string[], duration: number, concatPath: string): void {
  const perImage = duration / bgPaths.length;
  let content = '';
  for (const p of bgPaths) {
    content += `file '${p}'\n`;
    content += `duration ${perImage.toFixed(3)}\n`;
  }
  // Repeat last image (ffmpeg concat requirement)
  content += `file '${bgPaths[bgPaths.length - 1]}'\n`;
  fs.writeFileSync(concatPath, content);
}

// ──────────────────────────────────────────
// Step 7: Run ffmpeg render
// ──────────────────────────────────────────
function renderWithFfmpeg(
  concatPath: string,
  audioPath: string,
  outputPath: string,
  filterChain: string,
  timeoutMs: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-f', 'concat', '-safe', '0', '-i', concatPath,
      '-i', audioPath,
      '-vf', filterChain,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'ultrafast',
      '-crf', '28',
      '-r', String(RENDER_FPS),
      '-c:a', 'aac',
      '-b:a', '192k',
      '-threads', '1',
      '-shortest',
      '-movflags', '+faststart',
      '-y',
      outputPath,
    ];

    console.log(`[IslandLyric] Starting ffmpeg render...`);
    const fullCmd = `"${ffmpegPath}" ${args.map(a => a.includes(' ') || a.includes(':') || a.includes(',') ? `'${a}'` : a).join(' ')}`;
    console.log(`[IslandLyric] DEBUG COMMAND (copy-paste to test): \n${fullCmd}\n`);
    const proc = spawn(ffmpegPath, args, { stdio: ['pipe', 'pipe', 'pipe'] });

    let stderr = '';
    proc.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      console.error('[IslandLyric] Render timeout — killing ffmpeg');
      proc.kill('SIGKILL');
      reject(new Error('Render exceeded maximum time limit'));
    }, timeoutMs);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        const stats = fs.statSync(outputPath);
        console.log(`[IslandLyric] Render complete: ${(stats.size / 1024 / 1024).toFixed(1)}MB`);
        resolve();
      } else {
        // Write full stderr to a file for easier debugging
        try {
          fs.writeFileSync(path.join(path.dirname(outputPath), 'render-error.log'), stderr);
        } catch { /* log is best-effort */ }
        
        // Log stderr for debugging
        console.error('[IslandLyric] ffmpeg stderr (last 2000 chars):', stderr.slice(-2000));
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// ──────────────────────────────────────────
// Main Pipeline
// ──────────────────────────────────────────
export async function generateLyricVideo(jobId: string): Promise<void> {
  const job = getJob(jobId);
  if (!job || !job.audioPath || !job.lyricsPath) {
    console.error(`[IslandLyric] Job ${jobId} not found or missing files`);
    return;
  }

  const jobDir = path.dirname(job.audioPath);
  const bgDir = path.join(jobDir, 'backgrounds');
  fs.mkdirSync(bgDir, { recursive: true });

  try {
    // Step 1: Get audio duration
    updateJob(jobId, { status: 'processing', progress: 5 });
    const duration = getAudioDuration(job.audioPath);

    // Step 2: Parse lyrics
    updateJob(jobId, { progress: 10 });
    const lines = parseLyrics(job.lyricsPath);

    // Step 3: Fetch background images from Pexels
    updateJob(jobId, { progress: 15 });
    const photoUrls = await fetchPexelsPhotos(
      'caribbean carnival soca dancehall festival colorful',
      Math.min(lines.length, 10)
    );

    // Download backgrounds (or generate fallbacks)
    updateJob(jobId, { progress: 20 });
    const bgPaths: string[] = [];
    const bgCount = Math.min(lines.length, 10);

    for (let i = 0; i < bgCount; i++) {
      const bgPath = path.join(bgDir, `bg_${i}.png`);
      let downloaded = false;

      if (i < photoUrls.length) {
        downloaded = await downloadImage(photoUrls[i], bgPath);
      }

      if (!downloaded) {
        generateFallbackBackground(bgPath, i);
      }
      bgPaths.push(bgPath);
    }

    // If we have fewer backgrounds than needed, cycle them
    while (bgPaths.length < 2) {
      const fallbackPath = path.join(bgDir, `bg_fallback_${bgPaths.length}.png`);
      generateFallbackBackground(fallbackPath, bgPaths.length);
      bgPaths.push(fallbackPath);
    }

    // Step 4: Build concat file for slideshow
    updateJob(jobId, { progress: 30 });
    const concatPath = path.join(jobDir, 'concat.txt');
    buildConcatFile(bgPaths, duration, concatPath);

    // Step 5: Detect font file
    const fontCandidates = [
      // macOS fonts
      '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
      '/System/Library/Fonts/Helvetica.ttc',
      '/Library/Fonts/Arial Bold.ttf',
      '/System/Library/Fonts/SFNSDisplay.ttf',
      '/System/Library/Fonts/SFNS.ttf',
      // Linux fonts (Render.com / Docker)
      '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
      '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
    ];
    const fontFile = fontCandidates.find(f => fs.existsSync(f)) || '';
    console.log(`[IslandLyric] Font: ${fontFile || 'using ffmpeg default'}`);

    // Step 6: Build drawtext filter chain
    const filterChain = buildDrawtextFilters(lines, duration, fontFile);

    // Step 7: Render video
    updateJob(jobId, { status: 'rendering', progress: 40 });
    const outputPath = path.join(jobDir, 'output.mp4');
    await renderWithFfmpeg(concatPath, job.audioPath, outputPath, filterChain, MAX_RENDER_TIME_MS);

    updateJob(jobId, { progress: 85 });

    // Step 8: Move to public-accessible location
    updateJob(jobId, { status: 'uploading', progress: 90 });
    const publicDir = path.join(process.cwd(), 'uploads', 'lyric-videos');
    fs.mkdirSync(publicDir, { recursive: true });
    const publicPath = path.join(publicDir, `${jobId}.mp4`);
    fs.copyFileSync(outputPath, publicPath);

    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://www.savgent.com'
      : `http://localhost:${process.env.PORT || 5001}`;
    const videoUrl = `${baseUrl}/uploads/lyric-videos/${jobId}.mp4`;

    // Step 9: Send email
    updateJob(jobId, { progress: 95 });
    await sendLyricVideoEmail(job.email, job.songName, videoUrl);

    // Step 10: Cleanup temp files (keep final video)
    try {
      fs.rmSync(bgDir, { recursive: true, force: true });
      fs.unlinkSync(concatPath);
      fs.unlinkSync(outputPath);
      // Keep audio and lyrics for potential re-render
    } catch { /* cleanup is best-effort */ }

    updateJob(jobId, { status: 'complete', progress: 100, videoUrl });
    console.log(`[IslandLyric] ✅ Job ${jobId} complete! Video: ${videoUrl}`);

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[IslandLyric] ❌ Job ${jobId} failed:`, errorMsg);
    updateJob(jobId, { status: 'failed', error: errorMsg });

    // Send error email
    try {
      await sendLyricErrorEmail(job.email, job.songName);
    } catch { /* email is best-effort */ }

    // Cleanup temp files on failure (keep original audio + lyrics for retry)
    try {
      const bgDir = path.join(jobDir, 'backgrounds');
      if (fs.existsSync(bgDir)) fs.rmSync(bgDir, { recursive: true, force: true });
      const concatPath = path.join(jobDir, 'concat.txt');
      if (fs.existsSync(concatPath)) fs.unlinkSync(concatPath);
      const outputPath = path.join(jobDir, 'output.mp4');
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch { /* cleanup is best-effort */ }
  }
}
