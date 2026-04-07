
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-server";
import { passportService } from "@/lib/passport-service";
import { generatePassportQR } from "@/lib/crypto-utils";

export const GET = withAuth(async (req: NextRequest, user) => {
    try {
        const profile = await passportService.getOrCreateProfile(user.id);
        const progress = await passportService.getTierProgress(user.id);
        const qrData = generatePassportQR(user.id);

        return NextResponse.json({
            profile,
            progress,
            qrData, // For generating QR code on client
            success: true
        });
    } catch (error) {
        console.error("Error fetching passport profile:", error);
        return NextResponse.json({ message: "Failed to fetch passport profile" }, { status: 500 });
    }
});
