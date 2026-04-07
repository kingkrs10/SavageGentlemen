
import { db } from "@/lib/db";
import {
    passportProfiles,
    passportStamps,
    passportTiers,
    passportRewards,
    passportMissions,
    passportAchievementDefinitions,
    passportUserAchievements,
    passportCreditTransactions,
    passportMemberships,
    passportRedemptionOffers,
    passportUserRedemptions,
    users,
    events
} from "@shared/schema";
import { eq, and, desc, sql, gt, lte, gte } from "drizzle-orm";
import type {
    PassportProfile,
    InsertPassportProfile,
    PassportStamp,
    InsertPassportStamp,
    PassportTier,
    PassportReward,
    InsertPassportReward,
    PassportAchievementDefinition,
    PassportUserAchievement,
    PassportCreditTransaction,
    InsertPassportCreditTransaction,
    PassportMembership,
    InsertPassportMembership,
    PassportRedemptionOffer,
    PassportUserRedemption,
    Event
} from "@shared/schema";

// --- Passport Profile operations ---

export async function getPassportProfile(userId: number): Promise<PassportProfile | undefined> {
    const [profile] = await db
        .select()
        .from(passportProfiles)
        .where(eq(passportProfiles.userId, userId));
    return profile;
}

export async function getPassportProfileByHandle(handle: string): Promise<PassportProfile | undefined> {
    const [profile] = await db
        .select()
        .from(passportProfiles)
        .where(eq(passportProfiles.handle, handle));
    return profile;
}

export async function createPassportProfile(profileData: InsertPassportProfile): Promise<PassportProfile> {
    const [profile] = await db
        .insert(passportProfiles)
        .values({
            ...profileData,
            createdAt: new Date(),
            updatedAt: new Date()
        } as any)
        .returning();
    return profile;
}

export async function updatePassportProfile(userId: number, data: Partial<InsertPassportProfile>): Promise<PassportProfile | undefined> {
    const [profile] = await db
        .update(passportProfiles)
        .set({
            ...data,
            updatedAt: new Date()
        } as any)
        .where(eq(passportProfiles.userId, userId))
        .returning();
    return profile;
}

// --- Passport Stamp operations ---

export async function getPassportStampsByUserId(userId: number, limit?: number): Promise<PassportStamp[]> {
    let query = db
        .select()
        .from(passportStamps)
        .where(eq(passportStamps.userId, userId))
        .orderBy(desc(passportStamps.createdAt));

    if (limit) {
        return await query.limit(limit);
    }

    return await query;
}

export async function getPassportStampByUserAndEvent(userId: number, eventId: number): Promise<PassportStamp | undefined> {
    const [stamp] = await db
        .select()
        .from(passportStamps)
        .where(and(
            eq(passportStamps.userId, userId),
            eq(passportStamps.eventId, eventId)
        ));
    return stamp;
}

export async function getPassportStampsByEventId(eventId: number): Promise<PassportStamp[]> {
    return await db
        .select()
        .from(passportStamps)
        .where(eq(passportStamps.eventId, eventId))
        .orderBy(desc(passportStamps.createdAt));
}

export async function createPassportStamp(stampData: InsertPassportStamp): Promise<PassportStamp> {
    const [stamp] = await db
        .insert(passportStamps)
        .values(stampData as any)
        .returning();
    return stamp;
}

// --- Passport Tier operations ---

export async function getAllPassportTiers(): Promise<PassportTier[]> {
    return await db
        .select()
        .from(passportTiers)
        .orderBy(passportTiers.minPoints);
}

// --- Passport Reward operations ---

export async function getPassportReward(id: number): Promise<PassportReward | undefined> {
    const [reward] = await db
        .select()
        .from(passportRewards)
        .where(eq(passportRewards.id, id));
    return reward;
}

export async function getPassportRewardsByUserId(userId: number, status?: string): Promise<PassportReward[]> {
    const conditions = [eq(passportRewards.userId, userId)];

    if (status) {
        conditions.push(eq(passportRewards.status, status));
    }

    return await db
        .select()
        .from(passportRewards)
        .where(and(...conditions))
        .orderBy(desc(passportRewards.createdAt));
}

export async function createPassportReward(rewardData: InsertPassportReward): Promise<PassportReward> {
    const [reward] = await db
        .insert(passportRewards)
        .values(rewardData as any)
        .returning();
    return reward;
}

export async function updatePassportReward(id: number, data: Partial<InsertPassportReward>): Promise<PassportReward | undefined> {
    const [reward] = await db
        .update(passportRewards)
        .set(data as any)
        .where(eq(passportRewards.id, id))
        .returning();
    return reward;
}

export async function redeemPassportReward(id: number): Promise<PassportReward | undefined> {
    const [reward] = await db
        .update(passportRewards)
        .set({
            status: 'REDEEMED',
        })
        .where(eq(passportRewards.id, id))
        .returning();
    return reward;
}

// --- Passport Mission operations ---

export async function getAllPassportMissions(isActive?: boolean): Promise<any[]> {
    const conditions = [];

    if (isActive === true) {
        const now = new Date();
        conditions.push(and(
            lte(passportMissions.activeFrom, now),
            gte(passportMissions.activeTo, now)
        ));
    }

    let query = db.select().from(passportMissions);

    if (conditions.length > 0) {
        return await query.where(and(...conditions)).orderBy(desc(passportMissions.createdAt));
    }

    return await query.orderBy(desc(passportMissions.createdAt));
}

// --- Achievement operations ---

export async function getAllAchievementDefinitions(): Promise<PassportAchievementDefinition[]> {
    return await db.select().from(passportAchievementDefinitions).orderBy(passportAchievementDefinitions.id);
}

export async function getUserAchievements(userId: number): Promise<PassportUserAchievement[]> {
    return await db
        .select()
        .from(passportUserAchievements)
        .where(eq(passportUserAchievements.userId, userId));
}

export async function unlockUserAchievement(userId: number, achievementId: number): Promise<PassportUserAchievement> {
    const [unlocked] = await db
        .insert(passportUserAchievements)
        .values({
            userId,
            achievementId,
            unlockedAt: new Date(),
            isUnlocked: true
        } as any)
        .returning();
    return unlocked;
}

// --- Credit operations ---

export async function createPassportCreditTransaction(data: InsertPassportCreditTransaction): Promise<PassportCreditTransaction> {
    const [transaction] = await db
        .insert(passportCreditTransactions)
        .values({
            ...data,
            createdAt: new Date()
        } as any)
        .returning();
    return transaction;
}

export async function awardCredits(
    userId: number,
    amount: number,
    type: 'EARN' | 'SPEND' | 'BONUS',
    relatedId?: number,
    description?: string
): Promise<PassportCreditTransaction> {
    return await createPassportCreditTransaction({
        userId,
        delta: amount,
        sourceType: type as any,
        memo: description || 'Credits awarded',
        sourceId: relatedId,
        balanceAfter: 0 // TODO: Calculate actual balance
    });
}

// --- Membership operations ---

export async function createPassportMembership(data: InsertPassportMembership): Promise<PassportMembership> {
    const [membership] = await db
        .insert(passportMemberships)
        .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        } as any)
        .returning();
    return membership;
}

// --- Summary stats ---

export async function getAllPassportProfiles(): Promise<PassportProfile[]> {
    return await db.select().from(passportProfiles);
}

// --- Event operations needed for Passport ---

export async function getEventByAccessCode(accessCode: string): Promise<Event | undefined> {
    const [event] = await db
        .select()
        .from(events)
        .where(eq(events.accessCode, accessCode));
    return event;
}
