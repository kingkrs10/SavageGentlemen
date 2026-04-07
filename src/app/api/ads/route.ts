import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ads } from "@/shared/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        // Only fetch ads where isActive is true
        const activeAds = await db.select()
            .from(ads)
            .where(eq(ads.isActive, true))
            .orderBy(desc(ads.createdAt));

        return NextResponse.json(activeAds);
    } catch (error: any) {
        console.error("Error fetching active ads:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch ads" }, { status: 500 });
    }
}
