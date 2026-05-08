/**
 * IslandLyric.bot — In-Memory Job Store
 * Tracks lyric video generation jobs with status and progress.
 * Jobs auto-expire after 24 hours.
 */

export interface LyricJob {
  id: string;
  email: string;
  songName: string;
  status: 'pending' | 'paid' | 'processing' | 'rendering' | 'uploading' | 'complete' | 'failed';
  progress: number;
  videoUrl?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
  stripeSessionId?: string;
  audioPath?: string;
  lyricsPath?: string;
}

const jobs = new Map<string, LyricJob>();

// Auto-cleanup jobs older than 24 hours every hour
setInterval(() => {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  for (const [id, job] of jobs) {
    if (now - job.createdAt > ONE_DAY) {
      jobs.delete(id);
    }
  }
}, 60 * 60 * 1000);

export function createJob(data: {
  id: string;
  email: string;
  songName: string;
  audioPath?: string;
  lyricsPath?: string;
}): LyricJob {
  const job: LyricJob = {
    ...data,
    status: 'pending',
    progress: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  jobs.set(data.id, job);
  console.log(`[IslandLyric] Job created: ${data.id} for ${data.email}`);
  return job;
}

export function getJob(id: string): LyricJob | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, updates: Partial<LyricJob>): LyricJob | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;
  
  Object.assign(job, updates, { updatedAt: Date.now() });
  jobs.set(id, job);
  
  if (updates.status) {
    console.log(`[IslandLyric] Job ${id}: ${updates.status} (${job.progress}%)`);
  }
  return job;
}

export function findJobByStripeSession(sessionId: string): LyricJob | undefined {
  for (const job of jobs.values()) {
    if (job.stripeSessionId === sessionId) return job;
  }
  return undefined;
}
