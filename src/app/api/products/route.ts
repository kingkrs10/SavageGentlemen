
import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/api";
import { db } from "@/lib/db";
import { products, insertProductSchema } from "@shared/schema";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function GET() {
    try {
        const allProducts = await getAllProducts();
        return NextResponse.json(allProducts);
    } catch (error) {
        console.error("API Error (products):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await getAuthenticatedUser(req as any);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Validate input
        const validatedData = insertProductSchema.parse(body);

        const newProduct = await db.insert(products).values(validatedData).returning();

        return NextResponse.json(newProduct[0], { status: 201 });
    } catch (error) {
        console.error("API Error (create product):", error);
        return NextResponse.json({ error: "Invalid data or server error" }, { status: 400 });
    }
}
