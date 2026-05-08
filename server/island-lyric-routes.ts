/**
 * IslandLyric.bot — Express API Routes
 * 
 * POST /api/island-lyric/create-checkout  — Upload files + create Stripe checkout
 * POST /api/island-lyric/stripe-webhook   — Handle payment confirmation
 * GET  /api/island-lyric/job-status/:id   — Poll job progress
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Stripe from 'stripe';
import { createJob, getJob, updateJob, findJobByStripeSession } from './island-lyric-store';
import { generateLyricVideo } from './island-lyric-generator';

const router = express.Router();

// ──────────────────────────────────────────
// Multer config for MP3 + TXT uploads
// ──────────────────────────────────────────
const lyricUploadDir = path.join(process.cwd(), 'uploads', 'lyric-jobs');
if (!fs.existsSync(lyricUploadDir)) {
  fs.mkdirSync(lyricUploadDir, { recursive: true });
}

const lyricStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Only generate jobId once per request (multer calls this per file)
    if (!(req as any)._lyricJobId) {
      const jobId = crypto.randomUUID();
      const jobDir = path.join(lyricUploadDir, jobId);
      fs.mkdirSync(jobDir, { recursive: true });
      (req as any)._lyricJobId = jobId;
      (req as any)._lyricJobDir = jobDir;
    }
    cb(null, (req as any)._lyricJobDir);
  },
  filename: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      cb(null, 'audio' + path.extname(file.originalname));
    } else if (file.fieldname === 'lyrics') {
      cb(null, 'lyrics.txt');
    } else {
      cb(null, file.originalname);
    }
  },
});

const lyricUpload = multer({
  storage: lyricStorage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max for MP3
    files: 2,
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      if (!file.originalname.match(/\.(mp3|m4a|wav|aac)$/i)) {
        return cb(new Error('Audio must be MP3, M4A, WAV, or AAC'));
      }
    } else if (file.fieldname === 'lyrics') {
      if (!file.originalname.match(/\.(txt)$/i)) {
        return cb(new Error('Lyrics must be a .txt file'));
      }
      if (file.size > 500 * 1024) {
        return cb(new Error('Lyrics file must be under 500KB'));
      }
    }
    cb(null, true);
  },
});

// ──────────────────────────────────────────
// Stripe setup
// ──────────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

let cachedPriceId: string | null = process.env.ISLAND_LYRIC_STRIPE_PRICE_ID || null;

async function getOrCreateStripePriceId(): Promise<string> {
  if (cachedPriceId) return cachedPriceId;

  console.log('[IslandLyric] Creating Stripe product + price...');
  const product = await stripe.products.create({
    name: 'IslandLyric.bot — Lyric Video',
    description: 'HD Soca/Dancehall lyric video with B-roll backgrounds, synced lyrics, and watermark.',
    metadata: { app: 'island-lyric-bot' },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 1500, // $15.00
    currency: 'usd',
  });

  cachedPriceId = price.id;
  console.log(`[IslandLyric] ✅ Stripe Price ID: ${price.id} (add ISLAND_LYRIC_STRIPE_PRICE_ID to .env)`);
  return price.id;
}

// ──────────────────────────────────────────
// POST /create-checkout
// ──────────────────────────────────────────
router.post(
  '/create-checkout',
  lyricUpload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'lyrics', maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const email = req.body.email;
      const songName = req.body.songName || 'Untitled';
      const rightsConfirmed = req.body.rightsConfirmed === 'true';

      // Validation
      if (!files?.audio?.[0] || !files?.lyrics?.[0]) {
        return res.status(400).json({ error: 'Both audio (MP3) and lyrics (TXT) files are required.' });
      }
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }
      if (!rightsConfirmed) {
        return res.status(400).json({ error: 'You must confirm that you own the rights to this song.' });
      }

      const jobId = (req as any)._lyricJobId;
      const audioPath = files.audio[0].path;
      const lyricsPath = files.lyrics[0].path;

      // Create job in store
      const job = createJob({
        id: jobId,
        email,
        songName,
        audioPath,
        lyricsPath,
      });

      // Create Stripe Checkout Session
      const priceId = await getOrCreateStripePriceId();

      const baseUrl = process.env.NODE_ENV === 'production'
        ? 'https://www.savgent.com'
        : `http://localhost:${process.env.PORT || 5001}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        customer_email: email,
        success_url: `${baseUrl}/apps/island-lyric-bot?jobId=${jobId}&status=success`,
        cancel_url: `${baseUrl}/apps/island-lyric-bot?status=cancelled`,
        metadata: {
          jobId,
          email,
          songName,
          app: 'island-lyric-bot',
        },
      });

      // Store stripe session ID on the job
      updateJob(jobId, { stripeSessionId: session.id });

      console.log(`[IslandLyric] Checkout created: ${session.id} for job ${jobId}`);
      return res.json({ checkoutUrl: session.url, jobId });

    } catch (error: any) {
      const errorDetail = error?.message || String(error);
      console.error('[IslandLyric] create-checkout error:', errorDetail);
      console.error('[IslandLyric] Full error:', error);
      return res.status(500).json({
        error: `Failed to create checkout session: ${errorDetail}`,
      });
    }
  }
);

// ──────────────────────────────────────────
// POST /stripe-webhook
// ──────────────────────────────────────────
router.post(
  '/stripe-webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const webhookSecret = process.env.ISLAND_LYRIC_STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;

    try {
      if (webhookSecret) {
        const sig = req.headers['stripe-signature'] as string;
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // Dev mode — no signature verification
        event = JSON.parse(req.body.toString());
        console.warn('[IslandLyric] ⚠️ Webhook signature not verified (no secret configured)');
      }
    } catch (error) {
      console.error('[IslandLyric] Webhook signature verification failed:', error);
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (metadata?.app !== 'island-lyric-bot') {
        // Not our webhook — ignore
        return res.json({ received: true, handled: false });
      }

      const jobId = metadata.jobId;
      const job = getJob(jobId);

      if (!job) {
        console.error(`[IslandLyric] Webhook: job ${jobId} not found in store`);
        return res.status(200).json({ received: true, error: 'Job not found' });
      }

      console.log(`[IslandLyric] Payment confirmed for job ${jobId}`);
      updateJob(jobId, { status: 'paid' });

      // Fire and forget — start video generation asynchronously
      generateLyricVideo(jobId).catch(err => {
        console.error(`[IslandLyric] Background generation failed for ${jobId}:`, err);
      });
    }

    return res.json({ received: true });
  }
);

// ──────────────────────────────────────────
// GET /job-status/:jobId
// ──────────────────────────────────────────
router.get('/job-status/:jobId', (req: Request, res: Response) => {
  const job = getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  return res.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    videoUrl: job.status === 'complete' ? job.videoUrl : undefined,
    error: job.status === 'failed' ? job.error : undefined,
  });
});

// ──────────────────────────────────────────
// POST /dev-trigger/:jobId — DEV ONLY
// Skip Stripe, directly trigger render for an existing upload
// ──────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev-trigger/:jobId', async (req: Request, res: Response) => {
    const jobId = req.params.jobId;
    const jobDir = path.join(lyricUploadDir, jobId);

    // Check if files exist on disk
    const audioPath = path.join(jobDir, 'audio.mp3');
    const lyricsPath = path.join(jobDir, 'lyrics.txt');

    if (!fs.existsSync(audioPath) || !fs.existsSync(lyricsPath)) {
      return res.status(404).json({ error: `Job files not found in ${jobDir}` });
    }

    // Create job in memory if it doesn't exist
    let job = getJob(jobId);
    if (!job) {
      job = createJob({
        id: jobId,
        email: req.body.email || 'dev@test.com',
        songName: req.body.songName || 'Dev Test',
        audioPath,
        lyricsPath,
      });
    }

    // Set status to paid and trigger render
    updateJob(jobId, { status: 'paid' });
    console.log(`[IslandLyric] 🧪 DEV TRIGGER: Starting render for job ${jobId}`);

    // Fire and forget
    generateLyricVideo(jobId).catch(err => {
      console.error(`[IslandLyric] DEV render failed for ${jobId}:`, err);
    });

    return res.json({
      message: 'Render triggered',
      jobId,
      statusUrl: `/api/island-lyric/job-status/${jobId}`,
    });
  });

  console.log('[IslandLyric] 🧪 Dev trigger endpoint enabled: POST /api/island-lyric/dev-trigger/:jobId');
}

export const islandLyricRouter = router;
