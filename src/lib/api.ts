
import { db } from "@/lib/db";
import {
    events, products, livestreams, posts, mediaUploads, sponsoredContent,
    eventAnalytics, tickets, ticketAddons
} from "@shared/schema";
import { eq, desc, and, gt, gte, lt, sql } from "drizzle-orm";

// ============================================================
// EVENTS
// ============================================================
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

export async function getEventById(eventId: number) {
    try {
        const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
        if (!event) return null;

        // Fetch associated ticket tiers and addons
        const eventTickets = await getTicketsByEventId(eventId);
        const eventAddons = await getAddonsByEventId(eventId);

        return {
            ...event,
            tickets: eventTickets,
            addons: eventAddons,
        };
    } catch (error) {
        console.error("Error fetching event by ID:", error);
        return null;
    }
}

// ============================================================
// TICKET TIERS
// ============================================================
export async function getTicketsByEventId(eventId: number) {
    try {
        return await db.select().from(tickets)
            .where(eq(tickets.eventId, eventId))
            .orderBy(tickets.price);
    } catch (error) {
        console.error("Error fetching tickets for event:", error);
        return [];
    }
}

export async function getTicketById(ticketId: number) {
    try {
        const [ticket] = await db.select().from(tickets)
            .where(eq(tickets.id, ticketId))
            .limit(1);
        return ticket || null;
    } catch (error) {
        console.error("Error fetching ticket:", error);
        return null;
    }
}

export async function createTicketTier(data: any) {
    try {
        const [ticket] = await db.insert(tickets).values({
            ...data,
            remainingQuantity: data.remainingQuantity ?? data.quantity,
        }).returning();
        return ticket;
    } catch (error) {
        console.error("Error creating ticket tier:", error);
        throw error;
    }
}

export async function updateTicketTier(ticketId: number, data: any) {
    try {
        const [ticket] = await db.update(tickets)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(tickets.id, ticketId))
            .returning();
        return ticket;
    } catch (error) {
        console.error("Error updating ticket tier:", error);
        throw error;
    }
}

export async function deleteTicketTier(ticketId: number) {
    try {
        await db.delete(tickets).where(eq(tickets.id, ticketId));
        return true;
    } catch (error) {
        console.error("Error deleting ticket tier:", error);
        throw error;
    }
}

// ============================================================
// ADD-ONS / BOTTLE SERVICE
// ============================================================
export async function getAddonsByEventId(eventId: number) {
    try {
        return await db.select().from(ticketAddons)
            .where(eq(ticketAddons.eventId, eventId))
            .orderBy(ticketAddons.category, ticketAddons.name);
    } catch (error) {
        console.error("Error fetching addons for event:", error);
        return [];
    }
}

export async function getAddonById(addonId: number) {
    try {
        const [addon] = await db.select().from(ticketAddons)
            .where(eq(ticketAddons.id, addonId))
            .limit(1);
        return addon || null;
    } catch (error) {
        console.error("Error fetching addon:", error);
        return null;
    }
}

export async function createAddon(data: any) {
    try {
        const [addon] = await db.insert(ticketAddons).values(data).returning();
        return addon;
    } catch (error) {
        console.error("Error creating addon:", error);
        throw error;
    }
}

export async function updateAddon(addonId: number, data: any) {
    try {
        const [addon] = await db.update(ticketAddons)
            .set(data)
            .where(eq(ticketAddons.id, addonId))
            .returning();
        return addon;
    } catch (error) {
        console.error("Error updating addon:", error);
        throw error;
    }
}

export async function deleteAddon(addonId: number) {
    try {
        await db.delete(ticketAddons).where(eq(ticketAddons.id, addonId));
        return true;
    } catch (error) {
        console.error("Error deleting addon:", error);
        throw error;
    }
}

// ============================================================
// PRODUCTS
// ============================================================
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
        return await db.select().from(products).where(eq(products.featured, true));
    } catch (error) {
        console.error("Error fetching featured products:", error);
        try {
            const result = await db.execute(
                sql`SELECT * FROM products WHERE featured = true`
            );
            return result.rows as typeof products.$inferSelect[];
        } catch (e) {
            console.error("Fallback failed:", e);
            return [];
        }
    }
}

// ============================================================
// LIVESTREAMS
// ============================================================
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

// ============================================================
// POSTS
// ============================================================
export async function getLatestPosts() {
    try {
        return await db.select().from(posts).orderBy(desc(posts.createdAt)).limit(10);
    } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
}

// ============================================================
// SPONSORED CONTENT
// ============================================================
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

// ============================================================
// ANALYTICS
// ============================================================
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
