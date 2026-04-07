import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { affiliates, users, affiliateClicks } from "@/shared/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const allAffiliates = await db.select({
            id: affiliates.id,
            referralCode: affiliates.referralCode,
            campaignName: affiliates.campaignName,
            commissionRate: affiliates.commissionRate,
            isActive: affiliates.isActive,
            createdAt: affiliates.createdAt,
            user: {
                id: users.id,
                username: users.username,
                displayName: users.displayName,
                email: users.email
            },
            clickCount: sql`count(${affiliateClicks.id})`.mapWith(Number)
        })
        .from(affiliates)
        .leftJoin(users, eq(affiliates.userId, users.id))
        .leftJoin(affiliateClicks, eq(affiliateClicks.affiliateId, affiliates.id))
        .groupBy(affiliates.id, users.id);

        return NextResponse.json(allAffiliates);
    } catch (error) {
        console.error("Error fetching affiliates for admin:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
