
import { NextRequest, NextResponse } from "next/server";
import { getMediaCollectionBySlug } from "@/lib/media-api";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthenticatedUser(req);
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const slug = pathParts[pathParts.length - 1]; // /api/media/collections/slug/[slug]

        if (!slug) {
            return NextResponse.json({ message: "Slug is required" }, { status: 400 });
        }

        const collection = await getMediaCollectionBySlug(slug);
        if (!collection) {
            return NextResponse.json({ message: "Collection not found" }, { status: 404 });
        }

        // Visibility check
        if (collection.visibility === 'admin_only' && user?.role !== 'admin') {
            return NextResponse.json({ message: "Access denied" }, { status: 403 });
        }

        return NextResponse.json(collection);
    } catch (error) {
        console.error("Error fetching media collection by slug:", error);
        return NextResponse.json({ message: "Failed to fetch media collection" }, { status: 500 });
    }
}
