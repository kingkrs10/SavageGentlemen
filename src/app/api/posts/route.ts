
import { NextResponse } from "next/server";
import { getLatestPosts } from "@/lib/api";

export async function GET() {
    try {
        const posts = await getLatestPosts();
        return NextResponse.json(posts);
    } catch (error) {
        console.error("API Error (posts):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
