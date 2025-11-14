import { Router, Request, Response } from 'express';
import { passportService } from './passport-service';
import { storage } from './storage';
import { asyncHandler, AppError, AuthenticationError } from './middleware/error-handler';
import { authenticateUser } from './auth-middleware';
import { z } from 'zod';
import { generatePassportQR, verifyPassportQR } from './utils/crypto';

const router = Router();

/**
 * GET /api/passport/profile
 * Get user's passport profile (or create if doesn't exist)
 * Includes cryptographic QR code for check-in
 * Requires authentication
 */
router.get(
  '/profile',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError('User must be logged in to view passport');
    }

    const profile = await passportService.getOrCreateProfile(req.user.id, req.user.username || 'User');
    
    // Generate secure QR code for check-in
    const qrData = generatePassportQR(req.user.id);
    
    res.json({
      ...profile,
      qrData // Add QR code to response
    });
  })
);

/**
 * GET /api/passport/stamps
 * Get user's stamp history
 * Requires authentication
 */
router.get(
  '/stamps',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError('User must be logged in to view stamps');
    }

    const stamps = await storage.getPassportStampsByUserId(req.user.id);
    res.json(stamps);
  })
);

/**
 * GET /api/passport/rewards
 * Get user's rewards (available and redeemed)
 * Requires authentication
 */
router.get(
  '/rewards',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError('User must be logged in to view rewards');
    }

    const rewards = await storage.getPassportRewardsByUserId(req.user.id);
    res.json(rewards);
  })
);

/**
 * POST /api/passport/rewards/:id/redeem
 * Redeem a reward
 * Requires authentication
 */
router.post(
  '/rewards/:id/redeem',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError('User must be logged in to redeem rewards');
    }

    const rewardId = parseInt(req.params.id);
    if (isNaN(rewardId)) {
      throw new AppError('Invalid reward ID', 400, 'INVALID_REWARD_ID');
    }

    const reward = await storage.getPassportReward(rewardId);
    if (!reward) {
      throw new AppError('Reward not found', 404, 'REWARD_NOT_FOUND');
    }

    if (reward.userId !== req.user.id) {
      throw new AuthenticationError('Cannot redeem another user\'s reward');
    }

    const redeemedReward = await passportService.redeemReward(req.user.id, rewardId);
    res.json(redeemedReward);
  })
);

/**
 * GET /api/passport/tiers
 * Get all available tiers and their requirements
 * Public endpoint - tiers are visible to encourage sign-ups
 */
router.get(
  '/tiers',
  asyncHandler(async (req: Request, res: Response) => {
    const tiers = await passportService.getAllTiers();
    res.json(tiers);
  })
);

/**
 * GET /api/passport/leaderboard
 * Get top passport holders by points
 * Public endpoint - leaderboard is visible to encourage competition
 */
router.get(
  '/leaderboard',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const leaderboard = await passportService.getLeaderboard(limit);
    res.json(leaderboard);
  })
);

/**
 * GET /api/passport/stats
 * Get user's detailed passport statistics
 * Requires authentication
 */
router.get(
  '/stats',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError('User must be logged in to view stats');
    }

    const stats = await passportService.getUserStats(req.user.id);
    res.json(stats);
  })
);

/**
 * GET /api/passport/events/:eventId/attendees
 * Get list of attendees who received stamps for this event
 * Admin only
 */
router.get(
  '/events/:eventId/attendees',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError('User must be logged in');
    }

    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      throw new AppError('Invalid event ID', 400, 'INVALID_EVENT_ID');
    }

    // Check if user is admin
    const event = await storage.getEvent(eventId);
    if (!event) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    if (!isAdmin) {
      throw new AppError('Only admins can view attendee stamps', 403, 'FORBIDDEN');
    }

    const attendees = await passportService.getEventStampAttendees(eventId);
    res.json(attendees);
  })
);

/**
 * GET /api/passport/missions
 * Get all available missions
 * Public endpoint - missions are global challenges visible to all to encourage engagement
 */
router.get(
  '/missions',
  asyncHandler(async (req: Request, res: Response) => {
    const missions = await passportService.getAllMissions();
    res.json(missions);
  })
);

/**
 * GET /api/passport/missions/:missionId
 * Get specific mission by ID
 * Public endpoint - missions are global challenges visible to all
 */
router.get(
  '/missions/:missionId',
  asyncHandler(async (req: Request, res: Response) => {
    const missionId = parseInt(req.params.missionId);
    if (isNaN(missionId)) {
      throw new AppError('Invalid mission ID', 400, 'INVALID_MISSION_ID');
    }

    const mission = await storage.getPassportMission(missionId);
    if (!mission) {
      throw new AppError('Mission not found', 404, 'MISSION_NOT_FOUND');
    }

    res.json(mission);
  })
);

/**
 * GET /api/passport/landing-info
 * Get stats for the public landing page
 * Public endpoint - no authentication required
 */
router.get(
  '/landing-info',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await storage.getPassportLandingStats();
    res.json(stats);
  })
);

/**
 * POST /api/passport/profile
 * Create a new passport profile for the authenticated user
 * Requires authentication
 */
router.post(
  '/profile',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError('User must be logged in to create passport');
    }

    const profile = await passportService.getOrCreateProfile(req.user.id, req.user.username || 'User');
    res.json(profile);
  })
);

/**
 * GET /api/passport/checkin/:accessCode
 * Fetch event details for check-in scanner page
 * Public endpoint - no authentication required
 */
router.get(
  '/checkin/:accessCode',
  asyncHandler(async (req: Request, res: Response) => {
    const { accessCode } = req.params;

    const event = await storage.getEventByAccessCode(accessCode);
    if (!event) {
      throw new AppError('Invalid access code', 404, 'INVALID_ACCESS_CODE');
    }

    if (!event.isSocaPassportEnabled) {
      throw new AppError('Soca Passport not enabled for this event', 403, 'PASSPORT_NOT_ENABLED');
    }

    // Return safe subset of event data for public scanner
    res.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        location: event.location,
        stampPointsDefault: event.stampPointsDefault,
        countryCode: event.countryCode,
        carnivalCircuit: event.carnivalCircuit,
      }
    });
  })
);

/**
 * POST /api/passport/checkin
 * Check in a user by scanning their passport QR code
 * Public endpoint - no authentication required (for promoters)
 */
router.post(
  '/checkin',
  asyncHandler(async (req: Request, res: Response) => {
    const checkinSchema = z.object({
      qrData: z.string(),
      accessCode: z.string(),
    });

    const { qrData, accessCode } = checkinSchema.parse(req.body);

    // Step 1: Verify QR signature
    const qrResult = verifyPassportQR(qrData);
    if (!qrResult) {
      throw new AppError('Invalid or expired QR code', 400, 'INVALID_QR_CODE');
    }

    const { userId } = qrResult;

    // Step 2: Validate access code and get event
    const event = await storage.getEventByAccessCode(accessCode);
    if (!event) {
      throw new AppError('Invalid access code', 404, 'INVALID_ACCESS_CODE');
    }

    // Step 3: Check if event has passport enabled
    if (!event.isSocaPassportEnabled) {
      throw new AppError('Soca Passport not enabled for this event', 403, 'PASSPORT_NOT_ENABLED');
    }

    // Step 4: Get user's passport profile
    const profile = await storage.getPassportProfile(userId);
    if (!profile) {
      throw new AppError('User does not have a Soca Passport', 404, 'NO_PASSPORT_PROFILE');
    }

    // Step 5: Check for duplicate stamps
    const existingStamp = await storage.getPassportStampByUserAndEvent(userId, event.id);
    if (existingStamp) {
      return res.status(409).json({ 
        success: false, 
        message: 'User already checked in for this event',
        alreadyStamped: true,
        stamp: existingStamp
      });
    }

    // Step 6: Award stamp and points using passport service
    const result = await passportService.awardStamp(userId, event.id, event);

    res.json({
      success: true,
      message: `✓ Stamp awarded! ${result.stamp.pointsEarned} points earned`,
      stamp: result.stamp,
      user: {
        handle: result.profile.handle,
        totalPoints: result.profile.totalPoints,
        currentTier: result.profile.currentTier,
      },
      event: {
        title: event.title,
        date: event.date,
        location: event.location,
      },
      pointsAwarded: result.stamp.pointsEarned,
      tierUpdated: result.tierUpdated,
      previousTier: result.previousTier,
      newTier: result.newTier,
    });
  })
);

export { router as passportRouter };
