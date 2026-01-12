
import { NextResponse } from "next/server";
import { getActiveSponsoredContent } from "@/lib/api";

export async function GET() {
    try {
        const content = await getActiveSponsoredContent();
        return NextResponse.json(content);
    } catch (error) {
        console.error("API Error (sponsored content):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
