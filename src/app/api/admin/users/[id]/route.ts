import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { 
    users, orders, /* orderItems, */ ticketPurchases, 
    posts, /* comments, chatMessages, */
    /* aiAssistantConfigs, aiChatSessions, aiChatMessages, */
    eventCheckins, eventReviews, eventPhotos,
    userFollows, /* emailSubscribers, inventoryHistory, */
    /* passwordResetTokens, pageViews, userEvents, */
    ticketAddonPurchases, ticketScans, ticketRefunds, ticketTransfers
} from "@/shared/schema";
import { eq, or, inArray } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const adminUser = await getAuthenticatedUser(req as any);
        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const targetUserId = parseInt(params.id);
        const body = await req.json();
        const { role } = body;

        if (!role || !['user', 'admin', 'promoter', 'moderator'].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // Prevent admin from removing their own admin status accidentally
        if (adminUser.id === targetUserId && role !== 'admin') {
            return NextResponse.json({ error: "You cannot demote yourself." }, { status: 403 });
        }

        const updatedUser = await db.update(users)
            .set({ role, updatedAt: new Date() })
            .where(eq(users.id, targetUserId))
            .returning({
                id: users.id,
                role: users.role,
                username: users.username
            });

        return NextResponse.json(updatedUser[0]);
    } catch (error) {
        console.error("API Error (update user role):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const adminUser = await getAuthenticatedUser(req as any);
        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const targetUserId = parseInt(params.id);

        // Prevent admin from deleting themselves
        if (adminUser.id === targetUserId) {
            return NextResponse.json({ error: "You cannot delete your own account." }, { status: 403 });
        }

        // Manual Cascade Cleanup
        await db.transaction(async (tx) => {
            // 1. Social & Engagement
            // await tx.delete(comments).where(eq(comments.userId, targetUserId));
            await tx.delete(posts).where(eq(posts.userId, targetUserId));
            // await tx.delete(chatMessages).where(eq(chatMessages.userId, targetUserId));
            await tx.delete(eventCheckins).where(eq(eventCheckins.userId, targetUserId));
            await tx.delete(eventReviews).where(eq(eventReviews.userId, targetUserId));
            await tx.delete(eventPhotos).where(eq(eventPhotos.userId, targetUserId));
            await tx.delete(userFollows).where(
                or(
                    eq(userFollows.followerId, targetUserId),
                    eq(userFollows.followingId, targetUserId)
                )
            );

            // 2. AI Assistant Context
            // const activeSessions = await tx.select({ id: aiChatSessions.id })
            //     .from(aiChatSessions)
            //     .where(eq(aiChatSessions.userId, targetUserId));
            // 
            // if (activeSessions.length > 0) {
            //     const sessionIds = activeSessions.map(s => s.id);
            //     await tx.delete(aiChatMessages).where(inArray(aiChatMessages.sessionId, sessionIds));
            //     await tx.delete(aiChatSessions).where(eq(aiChatSessions.userId, targetUserId));
            // }
            // await tx.delete(aiAssistantConfigs).where(eq(aiAssistantConfigs.userId, targetUserId));

            // 3. Commerce & Tickets
            // Delete order items first
            const userOrders = await tx.select({ id: orders.id })
                .from(orders)
                .where(eq(orders.userId, targetUserId));
            
            if (userOrders.length > 0) {
                const orderIds = userOrders.map(o => o.id);
                // await tx.delete(orderItems).where(inArray(orderItems.orderId, orderIds));
            }

            // Delete ticket-related entries
            await tx.delete(ticketRefunds).where(eq(ticketRefunds.userId, targetUserId));
            await tx.delete(ticketTransfers).where(
                or(
                    eq(ticketTransfers.fromUserId, targetUserId),
                    eq(ticketTransfers.toUserId, targetUserId)
                )
            );
            
            const purchases = await tx.select({ id: ticketPurchases.id })
                .from(ticketPurchases)
                .where(eq(ticketPurchases.userId, targetUserId));
            
            if (purchases.length > 0) {
                const purchaseIds = purchases.map(p => p.id);
                await tx.delete(ticketAddonPurchases).where(inArray(ticketAddonPurchases.ticketPurchaseId, purchaseIds));
                await tx.delete(ticketPurchases).where(eq(ticketPurchases.userId, targetUserId));
            }

            await tx.delete(orders).where(eq(orders.userId, targetUserId));

            // 4. System & Marketing
            // await tx.delete(emailSubscribers).where(eq(emailSubscribers.userId, targetUserId));
            // await tx.delete(inventoryHistory).where(eq(inventoryHistory.userId, targetUserId));
            // await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, targetUserId));
            // await tx.delete(pageViews).where(eq(pageViews.userId, targetUserId));
            // await tx.delete(userEvents).where(eq(userEvents.userId, targetUserId));

            // 5. Finally, delete the user
            await tx.delete(users).where(eq(users.id, targetUserId));
        });

        return NextResponse.json({ success: true, message: "User and all associated data deleted successfully." });
    } catch (error) {
        console.error("API Error (delete user):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
