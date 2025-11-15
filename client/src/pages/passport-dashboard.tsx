import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, TrendingUp, Trophy, Ticket, Gift, Star } from "lucide-react";
import { Helmet } from "react-helmet";

interface CreditTransaction {
  id: number;
  amount: number;
  transactionType: 'EARN' | 'SPEND';
  reason: string;
  description: string;
  createdAt: string;
}

interface Achievement {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  creditBonus: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

interface TierInfo {
  current: string;
  next?: string;
  creditsToNext?: number;
  progressPercentage: number;
}

const TIER_THRESHOLDS = {
  BRONZE: { min: 0, max: 499, color: 'bg-amber-700' },
  SILVER: { min: 500, max: 1499, color: 'bg-gray-400' },
  GOLD: { min: 1500, max: 3499, color: 'bg-yellow-500' },
  ELITE: { min: 3500, max: Infinity, color: 'bg-purple-600' }
};

function getTierInfo(credits: number): TierInfo {
  if (credits < 500) {
    return {
      current: 'BRONZE',
      next: 'SILVER',
      creditsToNext: 500 - credits,
      progressPercentage: (credits / 500) * 100
    };
  } else if (credits < 1500) {
    return {
      current: 'SILVER',
      next: 'GOLD',
      creditsToNext: 1500 - credits,
      progressPercentage: ((credits - 500) / 1000) * 100
    };
  } else if (credits < 3500) {
    return {
      current: 'GOLD',
      next: 'ELITE',
      creditsToNext: 3500 - credits,
      progressPercentage: ((credits - 1500) / 2000) * 100
    };
  } else {
    return {
      current: 'ELITE',
      progressPercentage: 100
    };
  }
}

export default function PassportDashboard() {
  const { user } = useUser();

  const { data: creditsData, isLoading: creditsLoading, error: creditsError } = useQuery({
    queryKey: ['/api/passport/credits'],
    enabled: !!user
  });

  const { data: achievementsData, isLoading: achievementsLoading, error: achievementsError } = useQuery({
    queryKey: ['/api/passport/achievements'],
    enabled: !!user
  });

  const balance = creditsData?.balance || 0;
  const transactions = creditsData?.transactions || [];
  const achievements = achievementsData?.achievements || [];
  const totalUnlocked = achievementsData?.totalUnlocked || 0;

  const tierInfo = getTierInfo(balance);
  const tierColor = TIER_THRESHOLDS[tierInfo.current as keyof typeof TIER_THRESHOLDS]?.color || 'bg-gray-500';

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please log in to view your Soca Passport dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error states
  if (creditsError || achievementsError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-center text-destructive font-semibold">
              Failed to load passport data
            </p>
            <p className="text-center text-muted-foreground text-sm mt-2">
              {(creditsError as Error)?.message || (achievementsError as Error)?.message || 'Please try refreshing the page'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Passport Dashboard | Savage Gentlemen</title>
        <meta name="description" content="View your Soca Passport credits, achievements, tier status, and transaction history" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Soca Passport Dashboard</h1>
          <Badge className={`${tierColor} text-white text-lg px-4 py-2`}>
            {tierInfo.current}
          </Badge>
        </div>

        {/* Credits Balance Card */}
        <Card data-testid="card-credits-balance">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Fête Credits</CardTitle>
                <CardDescription>Use credits to unlock exclusive perks</CardDescription>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {creditsLoading ? (
              <Skeleton className="h-16 w-32" />
            ) : (
              <div className="space-y-4">
                <div className="text-5xl font-bold" data-testid="text-credit-balance">
                  {balance.toLocaleString()}
                </div>

                {/* Tier Progress */}
                {tierInfo.next && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Progress to {tierInfo.next}</span>
                      <span>{tierInfo.creditsToNext} credits to go</span>
                    </div>
                    <Progress value={tierInfo.progressPercentage} className="h-2" />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements Grid */}
        <Card data-testid="card-achievements">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>
                  {totalUnlocked} of {achievements.length} unlocked
                </CardDescription>
              </div>
              <Award className="h-6 w-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {achievementsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.slice(0, 6).map((achievement: Achievement) => (
                  <div
                    key={achievement.id}
                    data-testid={`achievement-${achievement.slug}`}
                    className={`p-4 rounded-lg border ${achievement.isUnlocked ? 'bg-primary/10 border-primary' : 'bg-muted/50 border-muted'}`}
                  >
                    <div className="flex items-start gap-3">
                      <Trophy className={`h-5 w-5 mt-1 ${achievement.isUnlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1">
                        <div className="font-semibold">{achievement.name}</div>
                        <div className="text-sm text-muted-foreground">{achievement.description}</div>
                        {achievement.isUnlocked && (
                          <Badge variant="secondary" className="mt-2">
                            +{achievement.creditBonus} credits
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card data-testid="card-transactions">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest credit transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {creditsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No transactions yet. Check in at your first event to earn credits!
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx: CreditTransaction) => (
                  <div
                    key={tx.id}
                    data-testid={`transaction-${tx.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {tx.transactionType === 'EARN' ? (
                        <Star className="h-5 w-5 text-green-600" />
                      ) : (
                        <Gift className="h-5 w-5 text-blue-600" />
                      )}
                      <div>
                        <div className="font-medium">{tx.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className={`font-bold ${tx.transactionType === 'EARN' ? 'text-green-600' : 'text-blue-600'}`}>
                      {tx.transactionType === 'EARN' ? '+' : '-'}{tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
