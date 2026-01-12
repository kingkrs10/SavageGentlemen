
import * as passportApi from "./passport-api";
import { db } from "./db";
import {
    passportQrCheckins,
    passportStamps,
    passportCreditTransactions,
    passportProfiles
} from "@shared/schema";
import type {
    PassportProfile,
    InsertPassportProfile,
    PassportStamp,
    PassportTier,
    PassportReward,
    Event
} from "@shared/schema";
import { eq, and, count, countDistinct, sql } from "drizzle-orm";

interface StampAwardResult {
    stamp: PassportStamp;
    profile: PassportProfile;
    tierUpdated: boolean;
    previousTier?: string;
    newTier?: string;
    rewardsUnlocked: PassportReward[];
    achievementsUnlocked?: any[];
    creditsAwarded?: number;
    creditTransaction?: any;
}

interface TierProgressInfo {
    currentTier: PassportTier;
    nextTier?: PassportTier;
    pointsToNextTier?: number;
    progressPercentage: number;
}

export class PassportService {
    /**
     * Initialize or get existing passport profile for a user
     */
    async getOrCreateProfile(userId: number, handle?: string): Promise<PassportProfile> {
        let profile = await passportApi.getPassportProfile(userId);

        if (!profile) {
            // Generate unique handle if not provided
            const finalHandle = handle || await this.generateUniqueHandle(userId);

            const profileData: InsertPassportProfile = {
                userId,
                handle: finalHandle,
                totalPoints: 0,
                currentTier: 'BRONZE',
                totalEvents: 0,
                totalCountries: 0
            };

            profile = await passportApi.createPassportProfile(profileData);

            await passportApi.createPassportMembership({
                userId,
                tier: 'FREE',
                status: 'ACTIVE',
                metadataJson: {}
            });
        }

        return profile;
    }

    /**
     * Generate a unique passport handle for a user
     */
    private async generateUniqueHandle(userId: number): Promise<string> {
        const baseHandle = `carnival_${userId}`;
        let handle = baseHandle;
        let counter = 1;

        while (await passportApi.getPassportProfileByHandle(handle)) {
            handle = `${baseHandle}_${counter}`;
            counter++;
        }

        return handle;
    }

    /**
     * Award a stamp to a user for attending an event
     */
    async awardStamp(
        userId: number,
        eventId: number,
        event: Event
    ): Promise<StampAwardResult> {
        // Ensure user has a passport profile
        let profile = await this.getOrCreateProfile(userId);
        const previousTier = profile.currentTier;

        // Calculate credits to award based on event type
        const creditsToAward = this.computeStampCredits(event);

        // === ATOMIC TRANSACTION: checkin + stamp + credit + profile update ===
        const { stamp, checkin, creditTransaction } = await db.transaction(async (tx) => {
            // 1. Check for existing check-in
            const existing = await tx.query.passportQrCheckins.findFirst({
                where: (checkins, { and, eq }) => and(
                    eq(checkins.userId, userId),
                    eq(checkins.eventId, eventId)
                )
            });

            if (existing) {
                throw new Error('User already checked in for this event');
            }

            // 2. Create QR check-in record
            const [checkin] = await tx.insert(passportQrCheckins).values({
                userId,
                eventId,
                creditsEarned: creditsToAward,
                isPremium: event.isPremiumPassport || false,
                accessCode: event.accessCode || undefined,
                checkinMethod: 'QR_SCAN',
                metadata: {}
            }).returning();

            // 3. Create passport stamp
            const [stamp] = await tx.insert(passportStamps).values({
                userId,
                eventId,
                countryCode: event.countryCode || 'US',
                carnivalCircuit: event.carnivalCircuit || undefined,
                pointsEarned: creditsToAward,
                source: 'TICKET_SCAN'
            }).returning();

            // 4. Create credit transaction ledger entry
            const [creditTransaction] = await tx.insert(passportCreditTransactions).values({
                userId,
                delta: creditsToAward,
                sourceType: 'CHECK_IN',
                memo: `Event check-in: ${event.title}`,
                sourceId: stamp.id,
                balanceAfter: profile.totalPoints + creditsToAward
            }).returning();

            // 5. Compute stats
            const [stampStats] = await tx.select({
                totalEvents: count(),
                totalCountries: countDistinct(passportStamps.countryCode)
            })
                .from(passportStamps)
                .where(eq(passportStamps.userId, userId));

            // 6. Update profile
            await tx.update(passportProfiles)
                .set({
                    totalPoints: sql`total_points + ${creditsToAward}`,
                    totalEvents: stampStats.totalEvents || 0,
                    totalCountries: stampStats.totalCountries || 0,
                    updatedAt: new Date()
                })
                .where(eq(passportProfiles.userId, userId));

            return { stamp, checkin, creditTransaction };
        });

        // Refetch profile
        const updatedProfile = await passportApi.getPassportProfile(userId);
        if (updatedProfile) profile = updatedProfile;

        // Check for tier upgrade
        const tierUpdate = await this.checkAndUpdateTier(userId, profile.totalPoints, previousTier);
        if (tierUpdate.upgraded) {
            const reRefetched = await passportApi.getPassportProfile(userId);
            if (reRefetched) profile = reRefetched;
        }

        // Unlock achievements
        const achievementsUnlocked = await this.checkAndUnlockAchievements(userId);

        // Tier-based rewards
        const rewardsUnlocked = await this.checkAndUnlockRewards(userId, profile, tierUpdate.newTier);

        return {
            stamp,
            profile,
            tierUpdated: tierUpdate.upgraded,
            previousTier: tierUpdate.previousTier,
            newTier: tierUpdate.newTier,
            rewardsUnlocked,
            achievementsUnlocked,
            creditsAwarded: creditsToAward,
            creditTransaction
        };
    }

    private computeStampCredits(event: Event): number {
        if (event.stampPointsDefault && event.stampPointsDefault > 0) {
            return event.stampPointsDefault;
        }
        if (event.isPremiumPassport) {
            return 75;
        }
        return 50;
    }

    private async checkAndUpdateTier(
        userId: number,
        totalPoints: number,
        currentTier: string
    ): Promise<{ upgraded: boolean; previousTier: string; newTier: string }> {
        const tiers = await passportApi.getAllPassportTiers();
        const sortedTiers = tiers.sort((a, b) => a.minPoints - b.minPoints);

        let qualifiedTier = currentTier;
        for (const tier of sortedTiers) {
            if (totalPoints >= tier.minPoints) {
                qualifiedTier = tier.name;
            }
        }

        if (qualifiedTier !== currentTier) {
            await passportApi.updatePassportProfile(userId, {
                currentTier: qualifiedTier as any
            });

            return {
                upgraded: true,
                previousTier: currentTier,
                newTier: qualifiedTier
            };
        }

        return { upgraded: false, previousTier: currentTier, newTier: currentTier };
    }

    private async checkAndUnlockAchievements(userId: number): Promise<any[]> {
        const profile = await passportApi.getPassportProfile(userId);
        if (!profile) return [];

        const allAchievements = await passportApi.getAllAchievementDefinitions();
        const userAchievements = await passportApi.getUserAchievements(userId);
        const unlockedIds = new Set(userAchievements.map(a => a.achievementId));

        const newlyUnlocked: any[] = [];

        for (const achievement of allAchievements) {
            if (unlockedIds.has(achievement.id) && !achievement.isRepeatable) continue;

            const criteria = achievement.criteria as any;
            let shouldUnlock = false;

            if (criteria.eventsAttended && profile.totalEvents >= criteria.eventsAttended) shouldUnlock = true;
            if (criteria.countriesVisited && profile.totalCountries >= criteria.countriesVisited) shouldUnlock = true;
            if (criteria.creditsEarned && profile.totalPoints >= criteria.creditsEarned) shouldUnlock = true;

            if (shouldUnlock) {
                try {
                    const unlocked = await passportApi.unlockUserAchievement(userId, achievement.id);
                    if (achievement.creditBonus && achievement.creditBonus > 0) {
                        await passportApi.awardCredits(userId, achievement.creditBonus, 'BONUS', achievement.id, `Achievement: ${achievement.name}`);
                    }
                    newlyUnlocked.push(unlocked);
                } catch (e) {
                    // Skip
                }
            }
        }
        return newlyUnlocked;
    }

    private async checkAndUnlockRewards(
        userId: number,
        profile: PassportProfile,
        newTier?: string
    ): Promise<PassportReward[]> {
        const unlockedRewards: PassportReward[] = [];
        if (newTier) {
            const tierReward = await this.unlockTierReward(userId, newTier);
            if (tierReward) unlockedRewards.push(tierReward);
        }

        // Milestone logic
        const milestones = [
            { stamps: 10, title: '10 Stamps Milestone', code: 'MILE10' },
            { stamps: 25, title: '25 Stamps Milestone', code: 'MILE25' },
            { stamps: 50, title: '50 Stamps Milestone', code: 'MILE50' },
            { stamps: 100, title: '100 Stamps Milestone', code: 'MILE100' }
        ];

        const existingRewards = await passportApi.getPassportRewardsByUserId(userId);

        for (const milestone of milestones) {
            if (profile.totalEvents >= milestone.stamps) {
                const alreadyHas = existingRewards.some(r => (r.metadata as any)?.discountCode === milestone.code);
                if (!alreadyHas) {
                    const reward = await passportApi.createPassportReward({
                        userId,
                        rewardType: 'MERCH_DISCOUNT',
                        metadata: {
                            title: milestone.title,
                            discountCode: milestone.code,
                            rewardCategory: 'MILESTONE'
                        },
                        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                        status: 'AVAILABLE'
                    });
                    unlockedRewards.push(reward);
                }
            }
        }
        return unlockedRewards;
    }

    private async unlockTierReward(userId: number, tierName: string): Promise<PassportReward | null> {
        const tierRewards: Record<string, any> = {
            'SILVER': { title: 'Silver Tier Unlocked', discount: 5 },
            'GOLD': { title: 'Gold Tier Unlocked', discount: 10 },
            'ELITE': { title: 'Elite Tier Unlocked', discount: 15 }
        };

        const config = tierRewards[tierName];
        if (!config) return null;

        const existingRewards = await passportApi.getPassportRewardsByUserId(userId);
        const alreadyHas = existingRewards.some(r => (r.metadata as any)?.discountCode === `${tierName}_WELCOME`);
        if (alreadyHas) return null;

        return await passportApi.createPassportReward({
            userId,
            rewardType: 'EARLY_ACCESS',
            metadata: {
                title: config.title,
                discountCode: `${tierName}_WELCOME`,
                discountPercentage: config.discount,
                rewardCategory: 'TIER_UPGRADE'
            },
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            status: 'AVAILABLE'
        });
    }

    async getTierProgress(userId: number): Promise<TierProgressInfo> {
        const profile = await passportApi.getPassportProfile(userId);
        if (!profile) throw new Error('Passport profile not found');

        const tiers = await passportApi.getAllPassportTiers();
        const currentTier = tiers.find(t => t.name === profile.currentTier);
        if (!currentTier) throw new Error('Current tier not found');

        const nextTier = tiers.find(t => t.minPoints > profile.totalPoints);
        let pointsToNextTier = 0;
        let progressPercentage = 100;

        if (nextTier) {
            pointsToNextTier = nextTier.minPoints - profile.totalPoints;
            const range = nextTier.minPoints - currentTier.minPoints;
            const pointsInRange = profile.totalPoints - currentTier.minPoints;
            progressPercentage = range > 0 ? Math.min(100, Math.round((pointsInRange / range) * 100)) : 100;
        }

        return {
            currentTier,
            nextTier,
            pointsToNextTier: nextTier ? pointsToNextTier : undefined,
            progressPercentage
        };
    }

    async getLeaderboard(limit: number = 50) {
        const allProfiles = await passportApi.getAllPassportProfiles();
        return allProfiles
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, limit)
            .map((p, i) => ({
                handle: p.handle,
                currentTier: p.currentTier,
                totalPoints: p.totalPoints,
                totalEvents: p.totalEvents,
                totalCountries: p.totalCountries,
                rank: i + 1
            }));
    }
}

export const passportService = new PassportService();
