/**
 * IslandLyric.bot — Landing Page & Upload UI
 * 
 * Caribbean-themed lyric video generator.
 * Handles file upload, Stripe checkout, and real-time job status polling.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { Music, Upload, FileText, Mail, CheckCircle2, Loader2, AlertCircle, ArrowLeft, Sparkles, Zap, Clock, Download } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

type JobStatus = 'idle' | 'uploading' | 'checkout' | 'processing' | 'rendering' | 'complete' | 'failed';

interface JobState {
  status: JobStatus;
  progress: number;
  videoUrl?: string;
  error?: string;
}

const STATUS_LABELS: Record<string, string> = {
  idle: 'Ready',
  uploading: 'Uploading files...',
  checkout: 'Redirecting to payment...',
  pending: 'Waiting for payment...',
  paid: 'Payment confirmed!',
  processing: 'Analyzing your song...',
  rendering: 'Rendering your video...',
  uploading_video: 'Finalizing...',
  complete: 'Your video is ready!',
  failed: 'Something went wrong',
};

export default function IslandLyricBot() {
  const [, navigate] = useLocation();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [songName, setSongName] = useState('');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [jobState, setJobState] = useState<JobState>({ status: 'idle', progress: 0 });
  const [jobId, setJobId] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check URL params for returning from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlJobId = params.get('jobId');
    const status = params.get('status');

    if (urlJobId && status === 'success') {
      setJobId(urlJobId);
      setJobState({ status: 'processing', progress: 5 });
    } else if (status === 'cancelled') {
      setJobState({ status: 'idle', progress: 0 });
    }
  }, []);

  // Poll job status when we have a jobId
  useEffect(() => {
    if (!jobId || jobState.status === 'complete' || jobState.status === 'failed' || jobState.status === 'idle') {
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/island-lyric/job-status/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();

        setJobState({
          status: data.status === 'uploading' ? 'rendering' : data.status,
          progress: data.progress || 0,
          videoUrl: data.videoUrl,
          error: data.error,
        });

        if (data.status === 'complete' || data.status === 'failed') {
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch {
        // Silent retry on next interval
      }
    };

    poll(); // Immediate first check
    pollingRef.current = setInterval(poll, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [jobId, jobState.status]);

  const handleSubmit = useCallback(async () => {
    if (!audioFile || !lyricsFile || !email || !rightsConfirmed) return;

    setJobState({ status: 'uploading', progress: 0 });

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('lyrics', lyricsFile);
      formData.append('email', email);
      formData.append('songName', songName || audioFile.name.replace(/\.[^.]+$/, ''));
      formData.append('rightsConfirmed', 'true');

      const res = await fetch('/api/island-lyric/create-checkout', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const { checkoutUrl, jobId: newJobId } = await res.json();
      setJobId(newJobId);
      setJobState({ status: 'checkout', progress: 0 });

      // Redirect to Stripe
      window.location.href = checkoutUrl;
    } catch (error) {
      setJobState({
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Something went wrong',
      });
    }
  }, [audioFile, lyricsFile, email, songName, rightsConfirmed]);

  const isFormValid = audioFile && lyricsFile && email.includes('@') && rightsConfirmed;
  const isProcessing = ['uploading', 'checkout', 'processing', 'rendering'].includes(jobState.status);

  return (
    <>
      <SEOHead
        title="IslandLyric.bot — Soca & Dancehall Lyric Video Generator"
        description="Generate a professional HD lyric video for your Soca or Dancehall track in minutes. Upload your song + lyrics, pay $15, get your video delivered to your inbox."
      />

      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a00 0%, #0d1a06 30%, #0a0f1a 60%, #0a0a0a 100%)' }}>
        {/* Ambient glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-[120px]" style={{ background: 'radial-gradient(circle, #FFD700 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-15 blur-[120px]" style={{ background: 'radial-gradient(circle, #00A86B 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 md:py-16">

          {/* Back button */}
          <button
            onClick={() => navigate('/apps')}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Apps
          </button>

          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/5 text-xs uppercase tracking-[0.2em] text-yellow-400/80 mb-6 backdrop-blur-md">
              <Music className="w-3.5 h-3.5" />
              Lyric Video Generator
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
              Island<span className="text-yellow-400">Lyric</span><span className="text-white/40">.bot</span>
            </h1>

            <p className="text-lg md:text-xl text-white/60 max-w-xl mx-auto leading-relaxed mb-8">
              Upload your Soca or Dancehall track + lyrics.
              <br />
              Get a <span className="text-yellow-400 font-semibold">professional HD lyric video</span> in minutes.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {[
                { icon: <Zap className="w-3.5 h-3.5" />, text: '$15 flat' },
                { icon: <Clock className="w-3.5 h-3.5" />, text: 'Ready in minutes' },
                { icon: <Sparkles className="w-3.5 h-3.5" />, text: 'HD quality' },
              ].map((pill, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs">
                  {pill.icon}
                  {pill.text}
                </div>
              ))}
            </div>
          </div>

          {/* ── Upload Form OR Status Tracker ── */}
          {jobState.status === 'complete' ? (
            /* ── SUCCESS STATE ── */
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 backdrop-blur-md p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Your Video is Ready!</h2>
              <p className="text-white/60 mb-6">Check your email for the download link, or download directly below.</p>
              {jobState.videoUrl && (
                <a
                  href={jobState.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-black text-lg transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}
                >
                  <Download className="w-5 h-5" />
                  Download Video
                </a>
              )}
              <button
                onClick={() => { setJobState({ status: 'idle', progress: 0 }); setJobId(null); setAudioFile(null); setLyricsFile(null); }}
                className="block mx-auto mt-4 text-white/40 hover:text-white/70 text-sm transition-colors"
              >
                Create another video
              </button>
            </div>
          ) : isProcessing ? (
            /* ── PROCESSING STATE ── */
            <div className="rounded-2xl border border-yellow-500/15 bg-white/[0.03] backdrop-blur-md p-8">
              <div className="text-center mb-6">
                <Loader2 className="w-12 h-12 text-yellow-400 mx-auto mb-4 animate-spin" />
                <h2 className="text-xl font-bold text-white mb-1">
                  {STATUS_LABELS[jobState.status] || 'Working...'}
                </h2>
                <p className="text-white/40 text-sm">Don't close this tab. We'll also email you when it's done.</p>
              </div>

              {/* Progress bar */}
              <div className="relative w-full h-3 bg-white/5 rounded-full overflow-hidden mb-2">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${jobState.progress}%`,
                    background: 'linear-gradient(90deg, #FFD700, #00A86B)',
                  }}
                />
              </div>
              <p className="text-right text-white/30 text-xs">{jobState.progress}%</p>
            </div>
          ) : jobState.status === 'failed' ? (
            /* ── ERROR STATE ── */
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-md p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
              <p className="text-white/50 mb-4">{jobState.error || 'Video generation failed. A refund will be processed.'}</p>
              <button
                onClick={() => { setJobState({ status: 'idle', progress: 0 }); setJobId(null); }}
                className="px-6 py-2 rounded-full bg-white/10 text-white hover:bg-white/15 transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          ) : (
            /* ── UPLOAD FORM ── */
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 md:p-8">
              <div className="space-y-6">

                {/* Audio Upload */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    <Music className="w-4 h-4 inline mr-1.5 text-yellow-400" />
                    Your Song (MP3)
                  </label>
                  <label className={`flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all
                    ${audioFile ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'}`}>
                    <input
                      type="file"
                      accept=".mp3,.m4a,.wav,.aac"
                      className="hidden"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    />
                    {audioFile ? (
                      <div className="text-center">
                        <CheckCircle2 className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                        <p className="text-white/80 text-sm font-medium">{audioFile.name}</p>
                        <p className="text-white/30 text-xs">{(audioFile.size / 1024 / 1024).toFixed(1)}MB</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-white/30 mx-auto mb-1" />
                        <p className="text-white/40 text-sm">Drop your MP3 here or click to browse</p>
                        <p className="text-white/20 text-xs mt-1">Max 15MB • MP3, M4A, WAV, AAC</p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Lyrics Upload */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    <FileText className="w-4 h-4 inline mr-1.5 text-green-400" />
                    Lyrics (TXT file)
                  </label>
                  <label className={`flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all
                    ${lyricsFile ? 'border-green-500/40 bg-green-500/5' : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'}`}>
                    <input
                      type="file"
                      accept=".txt"
                      className="hidden"
                      onChange={(e) => setLyricsFile(e.target.files?.[0] || null)}
                    />
                    {lyricsFile ? (
                      <div className="text-center">
                        <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-1" />
                        <p className="text-white/80 text-sm font-medium">{lyricsFile.name}</p>
                        <p className="text-white/30 text-xs">{(lyricsFile.size / 1024).toFixed(0)}KB</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-white/30 mx-auto mb-1" />
                        <p className="text-white/40 text-sm">Drop your lyrics .txt here or click to browse</p>
                        <p className="text-white/20 text-xs mt-1">One line per lyric line • Plain text</p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Song Name */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Song Name <span className="text-white/30">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={songName}
                    onChange={(e) => setSongName(e.target.value)}
                    placeholder="e.g. Soca Anthem 2026"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-500/40 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    <Mail className="w-4 h-4 inline mr-1.5 text-blue-400" />
                    Email (for video delivery)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-500/40 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                  />
                </div>

                {/* Rights Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={rightsConfirmed}
                      onChange={(e) => setRightsConfirmed(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                      ${rightsConfirmed ? 'bg-yellow-500 border-yellow-500' : 'border-white/20 group-hover:border-white/40'}`}>
                      {rightsConfirmed && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                    </div>
                  </div>
                  <span className="text-white/50 text-sm leading-relaxed">
                    I confirm that I own the rights to this song and lyrics, and I authorize IslandLyric.bot to create a lyric video from them.
                  </span>
                </label>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid}
                  className={`w-full py-4 rounded-2xl font-bold text-lg tracking-wide transition-all duration-300 
                    ${isFormValid
                      ? 'text-black hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-500/20 active:scale-[0.98] cursor-pointer'
                      : 'text-white/30 bg-white/5 cursor-not-allowed'
                    }`}
                  style={isFormValid ? { background: 'linear-gradient(135deg, #FFD700, #FFA500)' } : undefined}
                >
                  🎶 Generate Lyric Video — $15
                </button>

                <p className="text-center text-white/20 text-xs">
                  Secure payment via Stripe • HD 720p video delivered to your inbox
                </p>
              </div>
            </div>
          )}

          {/* How It Works */}
          <div className="mt-16 mb-8">
            <h2 className="text-center text-white/40 text-xs uppercase tracking-[0.3em] mb-8">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: '01', title: 'Upload', desc: 'Drop your MP3 + lyrics .txt file', icon: <Upload className="w-5 h-5" /> },
                { step: '02', title: 'Pay $15', desc: 'Secure one-time payment via Stripe', icon: <Zap className="w-5 h-5" /> },
                { step: '03', title: 'Get Video', desc: 'HD lyric video delivered to your email', icon: <Download className="w-5 h-5" /> },
              ].map((item, i) => (
                <div key={i} className="text-center p-6 rounded-xl border border-white/5 bg-white/[0.02]">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-3 text-yellow-400">
                    {item.icon}
                  </div>
                  <p className="text-yellow-400/60 text-xs font-mono mb-1">{item.step}</p>
                  <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                  <p className="text-white/40 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-white/20 text-xs pb-8">
            <p>IslandLyric.bot by <a href="/home" className="text-yellow-400/40 hover:text-yellow-400/70 transition-colors">Savage Gentlemen</a></p>
          </div>
        </div>
      </div>
    </>
  );
}
