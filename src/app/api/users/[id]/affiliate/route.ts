import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { affiliates } from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userId = parseInt(id);

        if (isNaN(userId)) {
            return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
        }

        const affiliateResult = await db.select()
          .from(affiliates)
          .where(eq(affiliates.userId, userId))
          .limit(1);

        if (affiliateResult.length > 0) {
            return NextResponse.json({ affiliate: affiliateResult[0] });
        }

        return NextResponse.json({ affiliate: null });

    } catch (error) {
        console.error("Error in GET /api/users/[id]/affiliate:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userId = parseInt(id);

        if (isNaN(userId)) {
            return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
        }
        
        // check if exists
        const existing = await db.select().from(affiliates).where(eq(affiliates.userId, userId)).limit(1);
        if (existing.length > 0) {
            return NextResponse.json({ affiliate: existing[0] });
        }

        // create new
        const referralCode = "SN-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const [newAffiliate] = await db.insert(affiliates).values({
            userId,
            referralCode,
            campaignName: "Soca Noir Rose"
        }).returning();

        return NextResponse.json({ affiliate: newAffiliate });

    } catch (error) {
        console.error("Error in POST /api/users/[id]/affiliate:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
