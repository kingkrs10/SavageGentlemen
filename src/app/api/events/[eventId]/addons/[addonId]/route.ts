import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { updateAddon, deleteAddon, getAddonById } from "@/lib/api";
import { insertTicketAddonSchema } from "@shared/schema";

export async function PUT(req: NextRequest, props: { params: Promise<{ eventId: string; addonId: string }> }) {
    try {
        const params = await props.params;
        const user = await getAuthenticatedUser(req as any);
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const addonId = parseInt(params.addonId);
        if (isNaN(addonId)) {
            return NextResponse.json({ error: "Invalid addon ID" }, { status: 400 });
        }

        const existing = await getAddonById(addonId);
        if (!existing) {
            return NextResponse.json({ error: "Addon not found" }, { status: 404 });
        }

        const body = await req.json();
        const updateSchema = insertTicketAddonSchema.partial();
        const validated = updateSchema.parse(body);

        const updated = await updateAddon(addonId, validated);
        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Error updating addon:", error);
        if (error?.issues) {
            return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update addon" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ eventId: string; addonId: string }> }) {
    try {
        const params = await props.params;
        const user = await getAuthenticatedUser(req as any);
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const addonId = parseInt(params.addonId);
        if (isNaN(addonId)) {
            return NextResponse.json({ error: "Invalid addon ID" }, { status: 400 });
        }

        await deleteAddon(addonId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting addon:", error);
        return NextResponse.json({ error: "Failed to delete addon" }, { status: 500 });
    }
}
