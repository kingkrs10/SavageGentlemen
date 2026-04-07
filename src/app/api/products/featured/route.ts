
import { NextResponse } from "next/server";
import { getFeaturedProducts } from "@/lib/api";

export async function GET() {
    try {
        const products = await getFeaturedProducts();
        return NextResponse.json(products);
    } catch (error) {
        console.error("API Error (featured products):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
