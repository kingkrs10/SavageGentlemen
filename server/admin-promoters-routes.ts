import { Router, Request, Response } from 'express';
import { adminPassportService } from './admin-passport-service';
import { asyncHandler, AppError } from './middleware/error-handler';
import { authenticateUser, requireAdmin } from './auth-middleware';
import { z } from 'zod';

const router = Router();

// All routes require admin authentication
router.use(authenticateUser, requireAdmin);

/**
 * GET /api/admin/promoters
 * Get all promoter applications with optional status filter
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
      limit: z.coerce.number().min(1).max(100).optional().default(50),
      offset: z.coerce.number().min(0).optional().default(0),
    });

    const params = schema.parse(req.query);

    const result = await adminPassportService.getAllPromoters(params);
    res.json(result);
  })
);

/**
 * PATCH /api/admin/promoters/:id/status
 * Update promoter application status (approve/reject)
 */
router.patch(
  '/:id/status',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError('Invalid promoter ID', 400, 'INVALID_PROMOTER_ID');
    }

    const schema = z.object({
      status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
    });

    const { status } = schema.parse(req.body);

    const promoter = await adminPassportService.updatePromoterStatus(id, status);
    if (!promoter) {
      throw new AppError('Promoter not found', 404, 'PROMOTER_NOT_FOUND');
    }

    console.log(`ADMIN: ${req.user?.username} updated promoter ${id} status to ${status}`);
    res.json(promoter);
  })
);

export { router as adminPromotersRouter };
