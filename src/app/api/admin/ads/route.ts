import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ads } from "@/shared/schema";
import { desc } from "drizzle-orm";
import { withAdmin } from "@/lib/auth-server";

// GET all ads for admin
export const GET = withAdmin(async (req, user) => {
    try {
        const allAds = await db.select().from(ads).orderBy(desc(ads.createdAt));
        return NextResponse.json(allAds);
    } catch (error: any) {
        console.error("Error fetching ads:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch ads" }, { status: 500 });
    }
});

// POST new ad
export const POST = withAdmin(async (req, user) => {
    try {
        const body = await req.json();
        const { title, imageUrl, targetUrl, isActive } = body;

        if (!title || !imageUrl || !targetUrl) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newAd = await db.insert(ads).values({
            title,
            imageUrl,
            targetUrl,
            isActive: isActive ?? true,
        }).returning();

        return NextResponse.json(newAd[0], { status: 201 });
    } catch (error: any) {
        console.error("Error creating ad:", error);
        return NextResponse.json({ error: error.message || "Failed to create ad" }, { status: 500 });
    }
});
