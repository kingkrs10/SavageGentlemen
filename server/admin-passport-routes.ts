import { Router, Request, Response } from 'express';
import { adminPassportService } from './admin-passport-service';
import { asyncHandler, AppError } from './middleware/error-handler';
import { authenticateUser, requireAdmin } from './auth-middleware';
import { z } from 'zod';

const router = Router();

// All routes require admin authentication
router.use(authenticateUser, requireAdmin);

/**
 * GET /api/admin/passport/profiles
 * Get all passport profiles with pagination and filtering
 */
router.get(
  '/profiles',
  asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      limit: z.coerce.number().min(1).max(100).optional().default(50),
      offset: z.coerce.number().min(0).optional().default(0),
      search: z.string().optional(),
      tierFilter: z.string().optional(),
    });

    const params = schema.parse(req.query);

    const result = await adminPassportService.getAllPassportProfiles(params);
    res.json(result);
  })
);

/**
 * GET /api/admin/passport/profiles/:userId
 * Get detailed passport profile for a specific user
 */
router.get(
  '/profiles/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      throw new AppError('Invalid user ID', 400, 'INVALID_USER_ID');
    }

    const profile = await adminPassportService.getPassportProfileDetails(userId);
    if (!profile) {
      throw new AppError('Passport profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    res.json(profile);
  })
);

/**
 * PATCH /api/admin/passport/profiles/:userId
 * Update passport profile (admin only)
 */
router.patch(
  '/profiles/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      throw new AppError('Invalid user ID', 400, 'INVALID_USER_ID');
    }

    const schema = z.object({
      totalPoints: z.number().min(0).optional(),
      currentTier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'ELITE']).optional(),
      stampsCollected: z.number().min(0).optional(),
      bio: z.string().max(500).optional(),
      countryCode: z.string().length(2).optional(),
    });

    const data = schema.parse(req.body);

    const profile = await adminPassportService.updatePassportProfile(userId, data);
    if (!profile) {
      throw new AppError('Failed to update passport profile', 500, 'UPDATE_FAILED');
    }

    console.log(`ADMIN: ${req.user?.username} updated passport profile for user ${userId}`, data);
    res.json(profile);
  })
);

/**
 * GET /api/admin/passport/analytics
 * Get passport analytics and statistics
 */
router.get(
  '/analytics',
  asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    });

    const params = schema.parse(req.query);

    const options: { startDate?: Date; endDate?: Date } = {};
    if (params.startDate) {
      options.startDate = new Date(params.startDate);
    }
    if (params.endDate) {
      options.endDate = new Date(params.endDate);
    }

    const analytics = await adminPassportService.getPassportAnalytics(options);
    res.json(analytics);
  })
);

export { router as adminPassportRouter };
