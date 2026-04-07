import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ads } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/lib/auth-server";

// GET single ad
export const GET = withAdmin(async (
    req: NextRequest,
    user: any, // The user from withAdmin
) => {
    try {
        const urlId = req.nextUrl.pathname.split('/').pop();
        if (!urlId) {
            return NextResponse.json({ error: "No ad ID provided" }, { status: 400 });
        }
        const adId = parseInt(urlId, 10);

        if (isNaN(adId)) {
            return NextResponse.json({ error: "Invalid ad ID" }, { status: 400 });
        }

        const adRes = await db.select().from(ads).where(eq(ads.id, adId));

        if (!adRes || adRes.length === 0) {
            return NextResponse.json({ error: "Ad not found" }, { status: 404 });
        }

        return NextResponse.json(adRes[0]);
    } catch (error: any) {
        console.error("Error fetching ad:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch ad" }, { status: 500 });
    }
});

// PUT / PATCH update ad
export const PUT = withAdmin(async (
    req: NextRequest,
    user: any,
) => {
    try {
        const urlId = req.nextUrl.pathname.split('/').pop();
        if (!urlId) {
            return NextResponse.json({ error: "No ad ID provided" }, { status: 400 });
        }
        const adId = parseInt(urlId, 10);

        if (isNaN(adId)) {
            return NextResponse.json({ error: "Invalid ad ID" }, { status: 400 });
        }

        const body = await req.json();

        // Don't update id or createdAt
        const { id, createdAt, updatedAt, ...updateData } = body;

        updateData.updatedAt = new Date();

        const updatedAd = await db.update(ads)
            .set(updateData)
            .where(eq(ads.id, adId))
            .returning();

        if (!updatedAd || updatedAd.length === 0) {
            return NextResponse.json({ error: "Ad not found" }, { status: 404 });
        }

        return NextResponse.json(updatedAd[0]);
    } catch (error: any) {
        console.error("Error updating ad:", error);
        return NextResponse.json({ error: error.message || "Failed to update ad" }, { status: 500 });
    }
});

// DELETE ad
export const DELETE = withAdmin(async (
    req: NextRequest,
    user: any,
) => {
    try {
        const urlId = req.nextUrl.pathname.split('/').pop();
        if (!urlId) {
            return NextResponse.json({ error: "No ad ID provided" }, { status: 400 });
        }
        const adId = parseInt(urlId, 10);

        if (isNaN(adId)) {
            return NextResponse.json({ error: "Invalid ad ID" }, { status: 400 });
        }

        await db.delete(ads).where(eq(ads.id, adId));

        return NextResponse.json({ success: true, message: "Ad deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting ad:", error);
        return NextResponse.json({ error: error.message || "Failed to delete ad" }, { status: 500 });
    }
});
