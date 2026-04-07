
import { NextResponse } from "next/server";
import { getCurrentLivestream } from "@/lib/api";

export async function GET() {
    try {
        const livestream = await getCurrentLivestream();
        return NextResponse.json(livestream || null);
    } catch (error) {
        console.error("API Error (current livestream):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
