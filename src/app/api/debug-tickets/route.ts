
import { NextRequest, NextResponse } from "next/server";
import { getUserTickets } from "@/lib/ticketing-api";
import { db } from "@/lib/db";
import { users } from "@shared/schema";
import fs from 'fs';

export async function GET(req: NextRequest) {
    try {
        console.log("Debug endpoint hit");
        // Fetch first user to test with
        const allUsers = await db.select().from(users).limit(1);
        if (allUsers.length === 0) {
            return NextResponse.json({ message: "No users in DB to test with" }, { status: 404 });
        }
        const userId = allUsers[0].id;
        console.log("Testing with userId:", userId);

        const tickets = await getUserTickets(userId);
        fs.writeFileSync('debug_success.txt', JSON.stringify({ userId, count: tickets.length, tickets: tickets.slice(0, 2) }, null, 2));

        return NextResponse.json({
            success: true,
            userId,
            ticketCount: tickets.length,
            tickets
        });
    } catch (error: any) {
        console.error("Debug Error:", error);
        fs.writeFileSync('debug_error.txt', String(error) + '\n' + (error.stack || ''));
        return NextResponse.json({
            success: false,
            message: error.message,
            stack: error.stack,
            error: String(error)
        }, { status: 500 });
    }
}
