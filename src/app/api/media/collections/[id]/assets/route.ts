
import { NextRequest, NextResponse } from "next/server";
import { getMediaAssetsByCollectionId, getMediaCollection } from "@/lib/media-api";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthenticatedUser(req);
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const id = parseInt(pathParts[pathParts.length - 2]); // /api/media/collections/[id]/assets

        if (isNaN(id)) {
            return NextResponse.json({ message: "Invalid collection ID" }, { status: 400 });
        }

        // Check collection existence and visibility
        const collection = await getMediaCollection(id);
        if (!collection) {
            return NextResponse.json({ message: "Collection not found" }, { status: 404 });
        }
        if (collection.visibility === 'admin_only' && user?.role !== 'admin') {
            return NextResponse.json({ message: "Access denied" }, { status: 403 });
        }

        const searchParams = req.nextUrl.searchParams;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

        // Non-admins only see published assets
        const isPublished = user?.role === 'admin' ? undefined : true;

        const assets = await getMediaAssetsByCollectionId(id, { isPublished, limit, offset });

        return NextResponse.json(assets);
    } catch (error) {
        console.error("Error fetching media assets:", error);
        return NextResponse.json({ message: "Failed to fetch media assets" }, { status: 500 });
    }
}
