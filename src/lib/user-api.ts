import { db } from "@/lib/db";
import {
    users,
    eventCheckins,
    eventReviews,
    eventPhotos,
    userFollows,
    events,
    ticketPurchases
} from "@shared/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";

export async function getUserProfile(userId: number) {
    const [user] = await db.select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatar: users.avatar,
        bio: users.bio,
        location: users.location,
        website: users.website,
        role: users.role,
        createdAt: users.createdAt,
    })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    return user;
}

export async function getUserAttendance(userId: number) {
    return await db.select({
        id: eventCheckins.id,
        checkedInAt: eventCheckins.checkedInAt,
        event: {
            id: events.id,
            title: events.title,
            date: events.date,
            location: events.location,
            imageUrl: events.imageUrl,
        }
    })
        .from(eventCheckins)
        .leftJoin(events, eq(eventCheckins.eventId, events.id))
        .where(eq(eventCheckins.userId, userId))
        .orderBy(desc(eventCheckins.checkedInAt));
}

export async function getUserReviews(userId: number) {
    return await db.select({
        id: eventReviews.id,
        rating: eventReviews.rating,
        title: eventReviews.title,
        review: eventReviews.review,
        createdAt: eventReviews.createdAt,
        event: {
            id: events.id,
            title: events.title,
            imageUrl: events.imageUrl,
        }
    })
        .from(eventReviews)
        .leftJoin(events, eq(eventReviews.eventId, events.id))
        .where(eq(eventReviews.userId, userId))
        .orderBy(desc(eventReviews.createdAt));
}

export async function getUserPhotos(userId: number) {
    return await db.select({
        id: eventPhotos.id,
        photoUrl: eventPhotos.photoUrl,
        caption: eventPhotos.caption,
        likes: eventPhotos.likes,
        createdAt: eventPhotos.createdAt,
        event: {
            id: events.id,
            title: events.title,
        }
    })
        .from(eventPhotos)
        .leftJoin(events, eq(eventPhotos.eventId, events.id))
        .where(and(
            eq(eventPhotos.userId, userId),
            eq(eventPhotos.isApproved, true)
        ))
        .orderBy(desc(eventPhotos.createdAt));
}

export async function getUserFollowStats(userId: number) {
    const [followerCount] = await db.select({ value: count() })
        .from(userFollows)
        .where(eq(userFollows.followingId, userId));

    const [followingCount] = await db.select({ value: count() })
        .from(userFollows)
        .where(eq(userFollows.followerId, userId));

    return {
        followers: Number(followerCount.value),
        following: Number(followingCount.value),
    };
}
