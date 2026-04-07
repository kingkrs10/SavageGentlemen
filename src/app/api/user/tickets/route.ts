import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { getUserTickets } from "@/lib/ticketing-api";

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const tickets = await getUserTickets(user.id);
        return NextResponse.json({ tickets });
    } catch (error) {
        console.error("Error in GET /api/user/tickets:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
