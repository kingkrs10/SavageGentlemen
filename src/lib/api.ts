
import { db } from "@/lib/db";
import { events, products, livestreams, posts, mediaUploads, sponsoredContent, eventAnalytics } from "@shared/schema";
import { eq, desc, and, gt, gte, lt, sql } from "drizzle-orm";

export async function getAllEvents() {
    try {
        return await db.select().from(events).orderBy(desc(events.date));
    } catch (error) {
        console.error("Error fetching all events:", error);
        return [];
    }
}

export async function getUpcomingEvents() {
    try {
        const allEvents = await db.select().from(events);
        const now = new Date();

        return allEvents.filter(event => {
            const eventDate = new Date(event.date);

            // If we have an end time, use that for comparison
            if (event.endTime) {
                const [hours, minutes] = event.endTime.split(':').map(Number);
                const eventEndDateTime = new Date(eventDate);
                eventEndDateTime.setHours(hours, minutes, 0, 0);
                return eventEndDateTime >= now;
            }

            // Falling back to 4 hours default duration if no end time or duration
            const eventStartDateTime = new Date(eventDate);
            if (event.time) {
                const [hours, minutes] = event.time.split(':').map(Number);
                eventStartDateTime.setHours(hours, minutes, 0, 0);
            }
            const eventEndDateTime = new Date(eventStartDateTime.getTime() + 4 * 60 * 60 * 1000);
            return eventEndDateTime >= now;
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
        console.error("Error fetching upcoming events:", error);
        return [];
    }
}

export async function getFeaturedEvents() {
    try {
        const upcoming = await getUpcomingEvents();
        return upcoming.filter(event => event.featured);
    } catch (error) {
        console.error("Error fetching featured events:", error);
        return [];
    }
}

export async function getAllProducts() {
    try {
        return await db.select().from(products).orderBy(desc(products.id));
    } catch (error) {
        console.error("Error fetching all products:", error);
        return [];
    }
}

export async function getFeaturedProducts() {
    try {
        // Try Drizzle select first
        return await db.select().from(products).where(eq(products.featured, true));
    } catch (error) {
        console.error("Error fetching featured products with ORM, falling back to raw SQL if needed:", error);
        // Fallback if schema mismatch (as noted in legacy code)
        try {
            const result = await db.execute(
                sql`SELECT * FROM products WHERE featured = true`
            );
            return result.rows.map(row => ({
                ...row,
                // Ensure fields match expected schema if needed
            })) as typeof products.$inferSelect[];
        } catch (e) {
            console.error("Fallback failed:", e);
            return [];
        }
    }
}

export async function getAllLivestreams() {
    try {
        return await db.select().from(livestreams).orderBy(desc(livestreams.createdAt));
    } catch (error) {
        console.error("Error fetching all livestreams:", error);
        return [];
    }
}

export async function getCurrentLivestream() {
    try {
        const streams = await db.select().from(livestreams).where(eq(livestreams.isLive, true));
        return streams[0];
    } catch (error) {
        console.error("Error fetching current livestream:", error);
        return undefined;
    }
}

export async function getLatestPosts() {
    try {
        return await db.select().from(posts).orderBy(desc(posts.createdAt)).limit(10);
    } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
}

export async function getActiveSponsoredContent() {
    try {
        const now = new Date();
        return await db.select().from(sponsoredContent).where(
            and(
                eq(sponsoredContent.isActive, true),
                sql`(${sponsoredContent.startDate} IS NULL OR ${sponsoredContent.startDate} <= ${now})`,
                sql`(${sponsoredContent.endDate} IS NULL OR ${sponsoredContent.endDate} >= ${now})`
            )
        ).orderBy(desc(sponsoredContent.priority), desc(sponsoredContent.createdAt));
    } catch (error) {
        console.error("Error fetching sponsored content:", error);
        return [];
    }
}

export async function getEventAnalyticsByEventId(eventId: number) {
    try {
        const results = await db.select().from(eventAnalytics).where(eq(eventAnalytics.eventId, eventId));
        return results[0];
    } catch (error) {
        console.error("Error fetching event analytics:", error);
        return undefined;
    }
}

export async function createEventAnalytic(data: any) {
    try {
        const [result] = await db.insert(eventAnalytics).values(data).returning();
        return result;
    } catch (error) {
        console.error("Error creating event analytic:", error);
        return undefined;
    }
}

export async function incrementEventViews(eventId: number) {
    try {
        const existing = await getEventAnalyticsByEventId(eventId);

        if (existing) {
            const [updated] = await db
                .update(eventAnalytics)
                .set({
                    views: (existing.views || 0) + 1,
                    updatedAt: new Date()
                })
                .where(eq(eventAnalytics.eventId, eventId))
                .returning();
            return updated;
        } else {
            return await createEventAnalytic({
                eventId,
                views: 1,
                ticketClicks: 0,
                ticketSales: 0
            });
        }
    } catch (error) {
        console.error("Error incrementing event views:", error);
        return undefined;
    }
}
