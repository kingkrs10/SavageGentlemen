import { Router, Request, Response } from 'express';
import { storage } from './storage';
import { asyncHandler, AppError } from './middleware/error-handler';
import { insertPromoterSchema } from '@shared/schema';
import { authenticateUser } from './auth-middleware';
import { z } from 'zod';

const router = Router();

/**
 * POST /api/promoters/register
 * Register a new promoter (external event creator)
 * Public endpoint - no authentication required
 */
router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = insertPromoterSchema.parse(req.body);
    
    const userId = req.user?.id || null;
    
    const promoter = await storage.createPromoter({
      ...validatedData,
      userId,
    });
    
    res.status(201).json({
      success: true,
      message: "Application submitted successfully. We'll contact you shortly.",
      promoter: {
        id: promoter.id,
        email: promoter.email,
        status: promoter.status,
      },
    });
  })
);

/**
 * GET /api/promoters/me
 * Get current user's promoter profile
 * Requires authentication
 */
router.get(
  '/me',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('User must be logged in', 401, 'UNAUTHORIZED');
    }

    const promoter = await storage.getPromoterByUserId(req.user.id);
    if (!promoter) {
      return res.status(404).json({ message: 'No promoter profile found' });
    }

    res.json(promoter);
  })
);

export { router as promotersRouter };
