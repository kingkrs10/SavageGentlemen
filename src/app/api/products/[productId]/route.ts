import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, insertProductSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function GET(req: Request, { params }: { params: { productId: string } }) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const productId = parseInt(resolvedParams.productId);
        if (isNaN(productId)) {
            return NextResponse.json({ error: "Invalid Product ID" }, { status: 400 });
        }

        const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);

        if (!product || product.length === 0) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json(product[0]);
    } catch (error) {
        console.error("API Error (get product):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { productId: string } }) {
    try {
        const user = await getAuthenticatedUser(req as any);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await Promise.resolve(params);
        const productId = parseInt(resolvedParams.productId);
        if (isNaN(productId)) {
            return NextResponse.json({ error: "Invalid Product ID" }, { status: 400 });
        }

        const body = await req.json();

        // Use partial schema for updates
        const updateSchema = insertProductSchema.partial();
        const validatedData = updateSchema.parse(body);

        const updatedProduct = await db
            .update(products)
            .set({ ...validatedData, updatedAt: new Date() })
            .where(eq(products.id, productId))
            .returning();

        return NextResponse.json(updatedProduct[0]);
    } catch (error) {
        console.error("API Error (update product):", error);
        return NextResponse.json({ error: "Invalid data or server error" }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: { productId: string } }) {
    try {
        const user = await getAuthenticatedUser(req as any);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await Promise.resolve(params);
        const productId = parseInt(resolvedParams.productId);
        if (isNaN(productId)) {
            return NextResponse.json({ error: "Invalid Product ID" }, { status: 400 });
        }

        await db.delete(products).where(eq(products.id, productId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("API Error (delete product):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
