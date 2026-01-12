
import { NextRequest, NextResponse } from "next/server";
import { getAllMediaCollections } from "@/lib/media-api";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthenticatedUser(req);
        const searchParams = req.nextUrl.searchParams;

        // Non-admins can only see public collections
        const isAdmin = user?.role === 'admin';
        const visibility = isAdmin ? undefined : 'public';
        const isActive = isAdmin ? undefined : true;

        const collections = await getAllMediaCollections({ visibility, isActive });

        return NextResponse.json(collections);
    } catch (error) {
        console.error("Error fetching media collections:", error);
        return NextResponse.json({ message: "Failed to fetch media collections" }, { status: 500 });
    }
}
