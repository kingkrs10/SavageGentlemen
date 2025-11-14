import { storage } from './storage';
import { db } from './db';
import { passportProfiles, passportStamps, passportRewards, passportMemberships, promoters, users } from '@shared/schema';
import { eq, desc, sql, and, gte, count } from 'drizzle-orm';
import { PassportProfile, PassportStamp, PassportReward, PassportMembership, Promoter } from '@shared/schema';

interface PassportProfileWithUser {
  id: number;
  userId: number;
  handle: string;
  totalPoints: number;
  currentTier: string;
  totalEvents: number;
  totalCountries: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  username: string;
  email: string;
}

interface PassportProfileDetails {
  profile: PassportProfile;
  stamps: PassportStamp[];
  rewards: PassportReward[];
  membership: PassportMembership | null;
  user: {
    username: string;
    email: string;
    avatar: string | null;
  };
}

interface PassportAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalStamps: number;
  totalRewards: number;
  pendingRewards: number;
  tierDistribution: Record<string, number>;
  recentActivity: Array<{ date: string; stampsIssued: number }>;
}

interface PromoterWithUser extends Promoter {
  username?: string;
  email?: string;
}

/**
 * Admin Passport Service
 * Handles admin-only passport management operations
 * Composes existing storage methods for complex queries
 */
export class AdminPassportService {
  /**
   * Get all passport profiles with pagination and filtering
   */
  async getAllPassportProfiles(options: {
    limit?: number;
    offset?: number;
    search?: string;
    tierFilter?: string;
  } = {}): Promise<{ profiles: PassportProfileWithUser[]; total: number }> {
    const { limit = 50, offset = 0, search, tierFilter } = options;

    try {
      let query = db
        .select({
          id: passportProfiles.id,
          userId: passportProfiles.userId,
          handle: passportProfiles.handle,
          totalPoints: passportProfiles.totalPoints,
          currentTier: passportProfiles.currentTier,
          totalEvents: passportProfiles.totalEvents,
          totalCountries: passportProfiles.totalCountries,
          createdAt: passportProfiles.createdAt,
          updatedAt: passportProfiles.updatedAt,
          username: users.username,
          email: users.email,
        })
        .from(passportProfiles)
        .innerJoin(users, eq(passportProfiles.userId, users.id))
        .orderBy(desc(passportProfiles.totalPoints));

      // Apply filters
      const conditions = [];
      if (tierFilter) {
        conditions.push(eq(passportProfiles.currentTier, tierFilter));
      }
      if (search) {
        // Search by username, handle, or email
        conditions.push(
          sql`(${users.username} ILIKE ${'%' + search + '%'} OR ${passportProfiles.handle} ILIKE ${'%' + search + '%'} OR ${users.email} ILIKE ${'%' + search + '%'})`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const profiles = await query.limit(limit).offset(offset);

      // Get total count
      let countQuery = db
        .select({ count: sql<number>`count(*)::int` })
        .from(passportProfiles)
        .innerJoin(users, eq(passportProfiles.userId, users.id));
      
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions)) as any;
      }
      
      const [{ count: total }] = await countQuery;

      return {
        profiles,
        total: total || 0,
      };
    } catch (error) {
      console.error('Error fetching all passport profiles:', error);
      throw error;
    }
  }

  /**
   * Get detailed passport profile for a specific user
   */
  async getPassportProfileDetails(userId: number): Promise<PassportProfileDetails | null> {
    try {
      const profile = await storage.getPassportProfile(userId);
      if (!profile) {
        return null;
      }

      const [stamps, rewards, membership, user] = await Promise.all([
        storage.getPassportStampsByUserId(userId),
        storage.getPassportRewardsByUserId(userId),
        storage.getPassportMembershipByUserId(userId),
        storage.getUser(userId),
      ]);

      if (!user) {
        return null;
      }

      return {
        profile,
        stamps,
        rewards,
        membership: membership || null,
        user: {
          username: user.username,
          email: user.email,
          avatar: user.avatar || null,
        },
      };
    } catch (error) {
      console.error('Error fetching passport profile details:', error);
      throw error;
    }
  }

  /**
   * Admin update passport profile
   */
  async updatePassportProfile(
    userId: number,
    data: {
      totalPoints?: number;
      currentTier?: string;
      stampsCollected?: number;
      bio?: string;
      countryCode?: string;
    }
  ): Promise<PassportProfile | null> {
    try {
      return await storage.updatePassportProfile(userId, data);
    } catch (error) {
      console.error('Error updating passport profile:', error);
      throw error;
    }
  }

  /**
   * Get passport analytics with optional date range
   */
  async getPassportAnalytics(options: {
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<PassportAnalytics> {
    const { startDate, endDate } = options;

    try {
      // Total users with passports
      const [{ count: totalUsers }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(passportProfiles);

      // Active users (users with points > 0)
      const [{ count: activeUsers }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(passportProfiles)
        .where(sql`${passportProfiles.totalPoints} > 0`);

      // Total stamps
      let stampQuery = db.select({ count: sql<number>`count(*)::int` }).from(passportStamps);
      if (startDate && endDate) {
        stampQuery = stampQuery.where(
          and(
            gte(passportStamps.awardedAt, startDate),
            sql`${passportStamps.awardedAt} <= ${endDate}`
          )
        ) as any;
      }
      const [{ count: totalStamps }] = await stampQuery;

      // Total rewards
      const [{ count: totalRewards }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(passportRewards);

      // Pending rewards
      const [{ count: pendingRewards }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(passportRewards)
        .where(eq(passportRewards.status, 'AVAILABLE'));

      // Tier distribution
      const tierDistributionResults = await db
        .select({
          tier: passportProfiles.currentTier,
          count: sql<number>`count(*)::int`,
        })
        .from(passportProfiles)
        .groupBy(passportProfiles.currentTier);

      const tierDistribution: Record<string, number> = {};
      for (const result of tierDistributionResults) {
        tierDistribution[result.tier] = result.count;
      }

      // Recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentActivityResults = await db
        .select({
          date: sql<string>`DATE(${passportStamps.awardedAt})`.as('date'),
          count: sql<number>`count(*)::int`.as('count'),
        })
        .from(passportStamps)
        .where(gte(passportStamps.awardedAt, thirtyDaysAgo))
        .groupBy(sql`DATE(${passportStamps.awardedAt})`)
        .orderBy(sql`DATE(${passportStamps.awardedAt})`);

      const recentActivity = recentActivityResults.map((result) => ({
        date: result.date,
        stampsIssued: result.count,
      }));

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalStamps: totalStamps || 0,
        totalRewards: totalRewards || 0,
        pendingRewards: pendingRewards || 0,
        tierDistribution,
        recentActivity,
      };
    } catch (error) {
      console.error('Error fetching passport analytics:', error);
      throw error;
    }
  }

  /**
   * Get all promoter applications with optional status filter
   */
  async getAllPromoters(options: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ promoters: PromoterWithUser[]; total: number }> {
    const { status, limit = 50, offset = 0 } = options;

    try {
      let query = db
        .select({
          id: promoters.id,
          userId: promoters.userId,
          name: promoters.name,
          email: promoters.email,
          organization: promoters.organization,
          locationCity: promoters.locationCity,
          locationCountry: promoters.locationCountry,
          websiteOrSocial: promoters.websiteOrSocial,
          eventTypes: promoters.eventTypes,
          status: promoters.status,
          createdAt: promoters.createdAt,
          username: users.username,
          userEmail: users.email,
        })
        .from(promoters)
        .leftJoin(users, eq(promoters.userId, users.id))
        .orderBy(desc(promoters.createdAt));

      if (status) {
        query = query.where(eq(promoters.status, status)) as any;
      }

      const results = await query.limit(limit).offset(offset);

      // Get total count
      const [{ count: total }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(promoters)
        .where(status ? eq(promoters.status, status) : undefined);

      const promotersWithUser: PromoterWithUser[] = results.map((r) => ({
        id: r.id,
        userId: r.userId,
        name: r.name,
        email: r.email,
        organization: r.organization || undefined,
        locationCity: r.locationCity || undefined,
        locationCountry: r.locationCountry || undefined,
        websiteOrSocial: r.websiteOrSocial || undefined,
        eventTypes: r.eventTypes || undefined,
        status: r.status,
        createdAt: r.createdAt,
        username: r.username || undefined,
      }));

      return {
        promoters: promotersWithUser,
        total: total || 0,
      };
    } catch (error) {
      console.error('Error fetching promoters:', error);
      throw error;
    }
  }

  /**
   * Update promoter status (approve/reject)
   */
  async updatePromoterStatus(id: number, status: string): Promise<Promoter | null> {
    try {
      const [promoter] = await db
        .update(promoters)
        .set({ status, updatedAt: new Date() })
        .where(eq(promoters.id, id))
        .returning();

      return promoter || null;
    } catch (error) {
      console.error('Error updating promoter status:', error);
      throw error;
    }
  }
}

export const adminPassportService = new AdminPassportService();
