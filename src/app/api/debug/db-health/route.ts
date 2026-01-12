
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@shared/schema";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const dbUrl = process.env.DATABASE_URL;
        console.log("Debug DB: Checking URL...");

        if (!dbUrl) {
            return NextResponse.json({
                status: "error",
                message: "DATABASE_URL is missing from environment variables."
            }, { status: 500 });
        }

        console.log("Debug DB: URL found (starts with):", dbUrl.substring(0, 10));

        // Set a timeout for the query
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Query timed out after 3s")), 3000)
        );

        const result: any = await Promise.race([
            db.select().from(users).limit(1),
            timeoutPromise
        ]);

        return NextResponse.json({
            status: "ok",
            message: "Database connected successfully",
            userCount: result.length,
            sample: result
        });
    } catch (error: any) {
        console.error("Debug DB Error:", error);
        return NextResponse.json({
            status: "error",
            message: error.message,
            stack: error.stack,
            envCheck: {
                hasDbUrl: !!process.env.DATABASE_URL
            }
        }, { status: 500 });
    }
}
