
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Schema for updating user profile
const updateProfileSchema = z.object({
    displayName: z.string().min(1, "Display name is required").optional(),
    bio: z.string().optional(),
    location: z.string().optional(),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
    avatar: z.string().optional(),
});

export const PUT = withAuth(async (req: NextRequest, user: any) => {
    try {
        const body = await req.json();
        const validatedData = updateProfileSchema.parse(body);

        // Remove undefined fields
        const updateData = Object.fromEntries(
            Object.entries(validatedData).filter(([_, v]) => v !== undefined)
        );

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: "No data to update" }, { status: 400 });
        }

        // Add updated timestamp
        const dataToUpdate = {
            ...updateData,
            updatedAt: new Date()
        };

        const [updatedUser] = await db
            .update(users)
            .set(dataToUpdate)
            .where(eq(users.id, user.id))
            .returning();

        // Remove password from response
        const { password, ...safeUser } = updatedUser;

        return NextResponse.json(safeUser);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
        }
        console.error("Error updating user profile:", error);
        return NextResponse.json({ message: "Failed to update profile" }, { status: 500 });
    }
});
