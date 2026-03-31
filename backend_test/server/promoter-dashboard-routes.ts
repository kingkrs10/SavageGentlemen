import { Router, Request, Response } from 'express';
import { db } from './db';
import { events, passportQrCheckins, users, passportCreditTransactions } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { asyncHandler, AppError } from './middleware/error-handler';
import { z } from 'zod';

const router = Router();

/**
 * GET /api/passport/promoter/dashboard/:accessCode
 * Get dashboard stats for a promoter's event using the access code
 * Public access (protected by access code knowledge)
 */
router.get(
    '/dashboard/:accessCode',
    asyncHandler(async (req: Request, res: Response) => {
        const { accessCode } = req.params;

        if (!accessCode) {
            throw new AppError('Access code is required', 400, 'MISSING_ACCESS_CODE');
        }

        // 1. Find the event
        const event = await db.query.events.findFirst({
            where: eq(events.accessCode, accessCode),
        });

        if (!event) {
            // Return 404 but generic message to avoid enumeration
            throw new AppError('Invalid access code or event not found', 404, 'EVENT_NOT_FOUND');
        }

        if (!event.isSocaPassportEnabled) {
            throw new AppError('Soca Passport is not enabled for this event', 403, 'PASSPORT_NOT_ENABLED');
        }

        // 2. Get check-in stats
        // Total check-ins
        const [{ count: totalCheckins }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(passportQrCheckins)
            .where(eq(passportQrCheckins.eventId, event.id));

        // Today's check-ins
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [{ count: todayCheckins }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(passportQrCheckins)
            .where(
                and(
                    eq(passportQrCheckins.eventId, event.id),
                    sql`${passportQrCheckins.checkedInAt} >= ${today.toISOString()}`
                )
            );

        // Total credits awarded
        const [{ sum: totalCredits }] = await db
            .select({ sum: sql<number>`sum(${passportQrCheckins.creditsEarned})::int` })
            .from(passportQrCheckins)
            .where(eq(passportQrCheckins.eventId, event.id));

        // 3. Get recent check-ins with user details
        const recentCheckins = await db
            .select({
                id: passportQrCheckins.id,
                displayName: users.displayName,
                username: users.username,
                checkedInAt: passportQrCheckins.checkedInAt,
                creditsEarned: passportQrCheckins.creditsEarned,
                checkinMethod: passportQrCheckins.checkinMethod,
            })
            .from(passportQrCheckins)
            .leftJoin(users, eq(passportQrCheckins.userId, users.id))
            .where(eq(passportQrCheckins.eventId, event.id))
            .orderBy(desc(passportQrCheckins.checkedInAt))
            .limit(50); // Limit to last 50 check-ins

        res.json({
            event: {
                id: event.id,
                title: event.title,
                date: event.date,
                location: event.location,
                accessCode: event.accessCode,
                stampPointsDefault: event.stampPointsDefault,
                countryCode: event.countryCode,
                carnivalCircuit: event.carnivalCircuit,
                imageUrl: event.imageUrl,
            },
            stats: {
                totalCheckins: totalCheckins || 0,
                todayCheckins: todayCheckins || 0,
                totalCreditsAwarded: totalCredits || 0,
            },
            checkins: recentCheckins.map(c => ({
                id: c.id,
                displayName: c.displayName || c.username || 'Unknown User',
                checkedInAt: c.checkedInAt,
                creditsEarned: c.creditsEarned,
                checkinMethod: c.checkinMethod,
            })),
        });
    })
);

export { router as promoterDashboardRouter };
