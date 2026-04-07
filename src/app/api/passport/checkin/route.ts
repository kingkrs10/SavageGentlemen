
import { NextRequest, NextResponse } from "next/server";
import { verifyPassportQR } from "@/lib/crypto-utils";
import { getEventByAccessCode, getPassportStampByUserAndEvent, getPassportProfile } from "@/lib/passport-api";
import { passportService } from "@/lib/passport-service";
import { z } from "zod";

const checkinSchema = z.object({
    qrData: z.string(),
    accessCode: z.string(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validated = checkinSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ message: "Invalid request body", errors: validated.error.format() }, { status: 400 });
        }

        const { qrData, accessCode } = validated.data;

        // 1. Verify QR signature
        const qrResult = verifyPassportQR(qrData);
        if (!qrResult) {
            return NextResponse.json({ message: "Invalid or expired QR code" }, { status: 400 });
        }

        const { userId } = qrResult;

        // 2. Validate access code and get event
        const event = await getEventByAccessCode(accessCode);
        if (!event) {
            return NextResponse.json({ message: "Invalid access code" }, { status: 404 });
        }

        // 3. Check if event has passport enabled
        if (!event.isSocaPassportEnabled) {
            return NextResponse.json({ message: "Soca Passport not enabled for this event" }, { status: 403 });
        }

        // 4. Get user's passport profile
        const profile = await getPassportProfile(userId);
        if (!profile) {
            return NextResponse.json({ message: "User does not have a Soca Passport" }, { status: 404 });
        }

        // 5. Check for duplicate stamps
        const existingStamp = await getPassportStampByUserAndEvent(userId, event.id);
        if (existingStamp) {
            return NextResponse.json({
                success: false,
                message: 'User already checked in for this event',
                alreadyStamped: true,
                stamp: existingStamp
            }, { status: 409 });
        }

        // 6. Award stamp and points using passport service
        const result = await passportService.awardStamp(userId, event.id, event);

        return NextResponse.json({
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
            }
        });

    } catch (error) {
        console.error("Error in passport check-in:", error);
        return NextResponse.json({ message: "Internal server error during check-in" }, { status: 500 });
    }
}
