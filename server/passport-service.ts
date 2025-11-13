import { storage } from './storage';
import type { 
  PassportProfile, 
  InsertPassportProfile, 
  PassportStamp, 
  InsertPassportStamp,
  PassportTier,
  PassportReward,
  InsertPassportReward,
  Event
} from '@shared/schema';

interface ProfileCreationData {
  userId: number;
  handle: string;
}

interface StampAwardResult {
  stamp: PassportStamp;
  profile: PassportProfile;
  tierUpdated: boolean;
  previousTier?: string;
  newTier?: string;
  rewardsUnlocked: PassportReward[];
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
    let profile = await storage.getPassportProfile(userId);
    
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
      
      profile = await storage.createPassportProfile(profileData);
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
    
    while (await storage.getPassportProfileByHandle(handle)) {
      handle = `${baseHandle}_${counter}`;
      counter++;
    }
    
    return handle;
  }

  /**
   * Award a stamp to a user for attending an event
   * This is the core function called during ticket scanning
   */
  async awardStamp(
    userId: number, 
    eventId: number, 
    event: Event
  ): Promise<StampAwardResult> {
    // Check if stamp already exists (prevent duplicates)
    const existingStamp = await storage.getPassportStampByUserAndEvent(userId, eventId);
    if (existingStamp) {
      throw new Error('Stamp already awarded for this event');
    }

    // Ensure user has a passport profile
    let profile = await this.getOrCreateProfile(userId);

    // Determine points to award
    const pointsEarned = event.stampPointsDefault || 50;

    // Create the stamp record
    const stampData: InsertPassportStamp = {
      userId,
      eventId,
      countryCode: event.countryCode || 'US',
      carnivalCircuit: event.carnivalCircuit || undefined,
      pointsEarned,
      source: 'TICKET_SCAN'
    };

    const stamp = await storage.createPassportStamp(stampData);

    // Store previous values before updates
    const previousPoints = profile.totalPoints;
    const previousTier = profile.currentTier;
    
    // Update profile with points
    await storage.addPointsToProfile(userId, pointsEarned);

    // Update stamp count and country stats
    const stampCount = await this.getStampCountForUser(userId);
    const countries = await this.getUniqueCountriesCount(userId);

    await storage.updatePassportProfile(userId, {
      totalEvents: stampCount,
      totalCountries: countries
    });

    // Refetch profile to get all updates
    const updatedProfile = await storage.getPassportProfile(userId);
    if (updatedProfile) {
      profile = updatedProfile;
    }

    // Check for tier upgrade with fresh profile data
    const tierUpdate = await this.checkAndUpdateTier(userId, profile.totalPoints, previousTier);
    
    // Refetch profile again if tier was upgraded
    if (tierUpdate.upgraded) {
      const tierUpdatedProfile = await storage.getPassportProfile(userId);
      if (tierUpdatedProfile) {
        profile = tierUpdatedProfile;
      }
    }
    
    // Check for new rewards with current profile state
    const rewardsUnlocked = await this.checkAndUnlockRewards(userId, profile, tierUpdate.newTier);

    // Final refetch to ensure returned profile reflects all changes
    const finalProfile = await storage.getPassportProfile(userId);
    if (finalProfile) {
      profile = finalProfile;
    }

    return {
      stamp,
      profile,
      tierUpdated: tierUpdate.upgraded,
      previousTier: tierUpdate.previousTier,
      newTier: tierUpdate.newTier,
      rewardsUnlocked
    };
  }

  /**
   * Check if user qualifies for tier upgrade and apply it
   */
  private async checkAndUpdateTier(
    userId: number, 
    totalPoints: number,
    currentTier: string
  ): Promise<{ upgraded: boolean; previousTier: string; newTier: string }> {
    const tiers = await storage.getAllPassportTiers();
    
    // Sort tiers by points (ascending)
    const sortedTiers = tiers.sort((a, b) => a.minPoints - b.minPoints);
    
    // Find the highest tier user qualifies for
    let qualifiedTier = currentTier;
    for (const tier of sortedTiers) {
      if (totalPoints >= tier.minPoints) {
        qualifiedTier = tier.name;
      }
    }

    // Update if tier changed
    if (qualifiedTier !== currentTier) {
      await storage.updatePassportProfile(userId, {
        currentTier: qualifiedTier as 'BRONZE' | 'SILVER' | 'GOLD' | 'ELITE'
      });
      
      return {
        upgraded: true,
        previousTier: currentTier,
        newTier: qualifiedTier
      };
    }

    return {
      upgraded: false,
      previousTier: currentTier,
      newTier: currentTier
    };
  }

  /**
   * Check for and unlock new rewards based on tier or achievements
   */
  private async checkAndUnlockRewards(
    userId: number,
    profile: PassportProfile,
    newTier?: string
  ): Promise<PassportReward[]> {
    const unlockedRewards: PassportReward[] = [];

    // Tier-based rewards
    if (newTier) {
      const tierReward = await this.unlockTierReward(userId, newTier);
      if (tierReward) {
        unlockedRewards.push(tierReward);
      }
    }

    // Milestone-based rewards - check for milestones user just qualified for
    const milestones = [
      { stamps: 10, title: '10 Stamps Milestone', description: 'Attended 10 events!', code: 'MILE10' },
      { stamps: 25, title: '25 Stamps Milestone', description: 'Attended 25 events!', code: 'MILE25' },
      { stamps: 50, title: '50 Stamps Milestone', description: 'Attended 50 events!', code: 'MILE50' },
      { stamps: 100, title: '100 Stamps Milestone', description: 'Attended 100 events!', code: 'MILE100' }
    ];

    // Get existing rewards to check what milestones were already awarded
    const existingRewards = await storage.getPassportRewardsByUserId(userId);
    
    for (const milestone of milestones) {
      // Check if user meets or exceeds this milestone
      if (profile.totalEvents >= milestone.stamps) {
        // Check if this milestone reward was already awarded
        const alreadyHasMilestone = existingRewards.some(r => {
          const metadata = r.metadata as any;
          return metadata?.rewardCategory === 'MILESTONE' && 
                 metadata?.discountCode === milestone.code;
        });

        if (!alreadyHasMilestone) {
          const milestoneReward = await storage.createPassportReward({
            userId,
            rewardType: 'MERCH_DISCOUNT',
            metadata: {
              title: milestone.title,
              description: milestone.description,
              discountCode: milestone.code,
              discountPercentage: 10,
              rewardCategory: 'MILESTONE'
            },
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            status: 'AVAILABLE'
          });
          unlockedRewards.push(milestoneReward);
        }
      }
    }

    return unlockedRewards;
  }

  /**
   * Unlock tier-specific reward
   */
  private async unlockTierReward(userId: number, tierName: string): Promise<PassportReward | null> {
    const tierRewards: Record<string, { title: string; description: string; discount: number }> = {
      'SILVER': {
        title: 'Silver Tier Unlocked',
        description: 'Welcome to Silver! Enjoy 5% off all events',
        discount: 5
      },
      'GOLD': {
        title: 'Gold Tier Unlocked',
        description: 'Welcome to Gold! Enjoy 10% off all events',
        discount: 10
      },
      'ELITE': {
        title: 'Elite Tier Unlocked',
        description: 'Welcome to Elite! Enjoy 15% off all events + VIP perks',
        discount: 15
      }
    };

    const rewardConfig = tierRewards[tierName];
    if (!rewardConfig) {
      return null;
    }

    // Check if user already has this tier reward to prevent duplicates
    const existingRewards = await storage.getPassportRewardsByUserId(userId);
    const alreadyHasTierReward = existingRewards.some(r => {
      const metadata = r.metadata as any;
      return metadata?.rewardCategory === 'TIER_UPGRADE' && 
             metadata?.discountCode === `${tierName}_WELCOME`;
    });

    if (alreadyHasTierReward) {
      return null; // Don't create duplicate
    }

    const reward = await storage.createPassportReward({
      userId,
      rewardType: 'EARLY_ACCESS',
      metadata: {
        title: rewardConfig.title,
        description: rewardConfig.description,
        discountCode: `${tierName}_WELCOME`,
        discountPercentage: rewardConfig.discount,
        rewardCategory: 'TIER_UPGRADE'
      },
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      status: 'AVAILABLE'
    });

    return reward;
  }

  /**
   * Get total stamp count for a user
   */
  private async getStampCountForUser(userId: number): Promise<number> {
    const stamps = await storage.getPassportStampsByUserId(userId);
    return stamps.length;
  }

  /**
   * Get count of unique countries visited
   */
  private async getUniqueCountriesCount(userId: number): Promise<number> {
    const stamps = await storage.getPassportStampsByUserId(userId);
    const uniqueCountries = new Set(stamps.map(s => s.countryCode));
    return uniqueCountries.size;
  }

  /**
   * Get count of unique carnival circuits attended
   */
  private async getUniqueCarnivalsCount(userId: number): Promise<number> {
    const stamps = await storage.getPassportStampsByUserId(userId);
    const uniqueCarnivals = new Set(
      stamps
        .filter(s => s.carnivalCircuit)
        .map(s => s.carnivalCircuit)
    );
    return uniqueCarnivals.size;
  }

  /**
   * Get tier progress information for a user
   */
  async getTierProgress(userId: number): Promise<TierProgressInfo> {
    const profile = await storage.getPassportProfile(userId);
    if (!profile) {
      throw new Error('Passport profile not found');
    }

    const tiers = await storage.getAllPassportTiers();
    const currentTier = tiers.find(t => t.name === profile.currentTier);
    
    if (!currentTier) {
      throw new Error('Current tier not found');
    }

    // Find next tier
    const nextTier = tiers.find(t => t.minPoints > profile.totalPoints);
    
    let pointsToNextTier = 0;
    let progressPercentage = 100;

    if (nextTier) {
      pointsToNextTier = nextTier.minPoints - profile.totalPoints;
      const tierRange = nextTier.minPoints - currentTier.minPoints;
      const pointsInRange = profile.totalPoints - currentTier.minPoints;
      progressPercentage = Math.min(100, Math.round((pointsInRange / tierRange) * 100));
    }

    return {
      currentTier,
      nextTier,
      pointsToNextTier: nextTier ? pointsToNextTier : undefined,
      progressPercentage
    };
  }

  /**
   * Get passport statistics for a user
   */
  async getPassportStats(userId: number) {
    const profile = await storage.getPassportProfile(userId);
    if (!profile) {
      return null;
    }

    const stamps = await storage.getPassportStampsByUserId(userId);
    const rewards = await storage.getPassportRewardsByUserId(userId);
    const tierProgress = await this.getTierProgress(userId);

    // Group stamps by country
    const stampsByCountry: Record<string, number> = {};
    stamps.forEach(stamp => {
      stampsByCountry[stamp.countryCode] = (stampsByCountry[stamp.countryCode] || 0) + 1;
    });

    // Group stamps by carnival
    const stampsByCarnival: Record<string, number> = {};
    stamps.forEach(stamp => {
      if (stamp.carnivalCircuit) {
        stampsByCarnival[stamp.carnivalCircuit] = (stampsByCarnival[stamp.carnivalCircuit] || 0) + 1;
      }
    });

    return {
      profile,
      stamps,
      rewards,
      tierProgress,
      stampsByCountry,
      stampsByCarnival,
      totalPoints: profile.totalPoints,
      totalEvents: profile.totalEvents,
      totalCountries: profile.totalCountries,
      availableRewards: rewards.filter(r => r.status === 'AVAILABLE').length,
      redeemedRewards: rewards.filter(r => r.status === 'REDEEMED').length
    };
  }

  /**
   * Redeem a reward
   */
  async redeemReward(userId: number, rewardId: number): Promise<PassportReward> {
    const reward = await storage.getPassportReward(rewardId);
    
    if (!reward) {
      throw new Error('Reward not found');
    }

    if (reward.userId !== userId) {
      throw new Error('This reward does not belong to you');
    }

    if (reward.status !== 'AVAILABLE') {
      throw new Error('This reward is not available for redemption');
    }

    if (reward.expiresAt && new Date() > reward.expiresAt) {
      // Mark as expired
      await storage.updatePassportReward(rewardId, { status: 'EXPIRED' });
      throw new Error('This reward has expired');
    }

    const redeemedReward = await storage.redeemPassportReward(rewardId);
    
    if (!redeemedReward) {
      throw new Error('Failed to redeem reward');
    }

    return redeemedReward;
  }

  /**
   * Get promoter view of attendee stamps for an event
   * Shows all users who got stamps for this event
   * Only includes attendees with valid passport profiles
   */
  async getEventStampAttendees(eventId: number): Promise<Array<{
    stamp: PassportStamp;
    userHandle: string;
    userTier: string;
    userTotalPoints: number;
  }>> {
    const eventStamps = await storage.getPassportStampsByEventId(eventId);

    const attendees = await Promise.all(
      eventStamps.map(async (stamp) => {
        const profile = await storage.getPassportProfile(stamp.userId);
        // Only return if profile exists - filter out deleted/missing profiles
        if (!profile) {
          return null;
        }
        return {
          stamp,
          userHandle: profile.handle,
          userTier: profile.currentTier,
          userTotalPoints: profile.totalPoints
        };
      })
    );

    // Filter out null entries (missing profiles)
    return attendees.filter((a): a is NonNullable<typeof a> => a !== null);
  }
}

export const passportService = new PassportService();
