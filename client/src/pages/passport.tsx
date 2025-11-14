import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Calendar, Globe, MapPin, Award, Star, Lock, QrCode } from "lucide-react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import type { PassportProfile, PassportStamp, PassportTier, PassportReward } from "@shared/schema";
import QRCodeLib from "qrcode";
import { useEffect, useState } from "react";

// API response includes dynamically generated qrData
interface PassportProfileWithQR extends PassportProfile {
  qrData?: string;
}

export default function Passport() {
  const { user } = useUser();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  const { data: profile, isLoading: profileLoading} = useQuery<PassportProfileWithQR>({
    queryKey: ['/api/passport/profile'],
    enabled: !!user
  });

  const { data: stamps = [], isLoading: stampsLoading } = useQuery<PassportStamp[]>({
    queryKey: ['/api/passport/stamps'],
    enabled: !!user
  });

  const { data: tiers = [], isLoading: tiersLoading } = useQuery<PassportTier[]>({
    queryKey: ['/api/passport/tiers']
  });

  const { data: rewards = [], isLoading: rewardsLoading } = useQuery<PassportReward[]>({
    queryKey: ['/api/passport/rewards'],
    enabled: !!user
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/passport/stats'],
    enabled: !!user
  });

  // Generate QR code when profile data is available
  useEffect(() => {
    if (profile?.qrData) {
      QRCodeLib.toDataURL(profile.qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(url => {
        setQrCodeUrl(url);
      }).catch(err => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [profile?.qrData]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 px-4 py-8">
        <Helmet>
          <title>Soca Passport - Savage Gentlemen</title>
          <meta name="description" content="Join the Soca Passport loyalty program to earn rewards, track your carnival journey, and unlock exclusive perks." />
        </Helmet>
        
        <div className="max-w-4xl mx-auto text-center py-16">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-4">Soca Passport</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Track your carnival journey, earn rewards, and unlock exclusive perks.
          </p>
          <Link href="/">
            <a 
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
              data-testid="button-sign-in"
            >
              Sign in to view your passport
            </a>
          </Link>
        </div>
      </div>
    );
  }

  const currentTier = tiers.find(t => t.name === profile?.currentTier);
  const nextTier = tiers.find(t => t.minPoints > (profile?.totalPoints || 0));
  const progressToNext = nextTier 
    ? ((profile?.totalPoints || 0) - (currentTier?.minPoints || 0)) / (nextTier.minPoints - (currentTier?.minPoints || 0)) * 100
    : 100;

  const getTierColor = (tierName: string) => {
    switch (tierName) {
      case 'BRONZE': return 'text-amber-700 dark:text-amber-400';
      case 'SILVER': return 'text-slate-400 dark:text-slate-300';
      case 'GOLD': return 'text-yellow-500 dark:text-yellow-400';
      case 'ELITE': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-muted-foreground';
    }
  };

  const getTierBadgeColor = (tierName: string) => {
    switch (tierName) {
      case 'BRONZE': return 'bg-amber-100 text-amber-900 dark:bg-amber-900/20 dark:text-amber-400';
      case 'SILVER': return 'bg-slate-200 text-slate-900 dark:bg-slate-800/50 dark:text-slate-300';
      case 'GOLD': return 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'ELITE': return 'bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 px-4 py-8">
      <Helmet>
        <title>My Passport - Savage Gentlemen</title>
        <meta name="description" content="View your Soca Passport status, stamps, and rewards." />
      </Helmet>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Soca Passport</h1>
          <p className="text-lg text-muted-foreground">Your Caribbean Carnival Journey</p>
        </div>

        {/* Tier Status Card */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Current Status</CardTitle>
                <CardDescription>Track your tier progress and unlock rewards</CardDescription>
              </div>
              {profileLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <Badge className={`${getTierBadgeColor(profile?.currentTier || 'BRONZE')} text-lg px-4 py-2`}>
                  <Trophy className="w-4 h-4 mr-2" />
                  {profile?.currentTier}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {profileLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{profile?.totalPoints || 0} points</span>
                  {nextTier ? (
                    <span className="text-muted-foreground">
                      {nextTier.minPoints - (profile?.totalPoints || 0)} points to {nextTier.name}
                    </span>
                  ) : (
                    <span className="text-primary font-semibold">Max Tier Achieved! 🎉</span>
                  )}
                </div>
                <Progress value={progressToNext} className="h-3" data-testid="progress-tier" />
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="text-center p-3 bg-secondary/50 rounded-lg" data-testid="stat-stamps">
                    <Calendar className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <div className="text-2xl font-bold">{profile?.totalEvents || 0}</div>
                    <div className="text-xs text-muted-foreground">Events</div>
                  </div>
                  <div className="text-center p-3 bg-secondary/50 rounded-lg" data-testid="stat-countries">
                    <Globe className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <div className="text-2xl font-bold">{profile?.totalCountries || 0}</div>
                    <div className="text-xs text-muted-foreground">Countries</div>
                  </div>
                  <div className="text-center p-3 bg-secondary/50 rounded-lg" data-testid="stat-circuits">
                    <MapPin className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <div className="text-2xl font-bold">{stamps.filter((s, i, arr) => arr.findIndex(x => x.carnivalCircuit === s.carnivalCircuit) === i).length}</div>
                    <div className="text-xs text-muted-foreground">Circuits</div>
                  </div>
                  <div className="text-center p-3 bg-secondary/50 rounded-lg" data-testid="stat-points">
                    <Star className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <div className="text-2xl font-bold">{profile?.totalPoints || 0}</div>
                    <div className="text-xs text-muted-foreground">Points</div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Check-In QR Code */}
        {profile?.qrData && (
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background" data-testid="card-qr-code">
            <CardHeader>
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                <CardTitle>Event Check-In Code</CardTitle>
              </div>
              <CardDescription>
                Show this QR code at passport-enabled events to collect your stamp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                {qrCodeUrl ? (
                  <div className="bg-white p-4 rounded-xl shadow-lg">
                    <img 
                      src={qrCodeUrl} 
                      alt="Passport Check-In QR Code" 
                      className="w-64 h-64"
                      data-testid="img-qr-code"
                    />
                  </div>
                ) : (
                  <Skeleton className="w-64 h-64" />
                )}
                <div className="text-center space-y-2 max-w-md">
                  <p className="text-sm text-muted-foreground">
                    Present this code at the event entrance for scanning. A new code is generated every 24 hours for security.
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Valid for 24 hours
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tier Perks */}
        {currentTier && (
          <Card data-testid="card-tier-perks">
            <CardHeader>
              <CardTitle>Your {currentTier.name} Benefits</CardTitle>
              <CardDescription>{currentTier.perks.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentTier.perks.perks.map((perk: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <Award className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Stamps Timeline */}
        <Card data-testid="card-stamps">
          <CardHeader>
            <CardTitle>Event Stamps</CardTitle>
            <CardDescription>Your carnival journey timeline</CardDescription>
          </CardHeader>
          <CardContent>
            {stampsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : stamps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No stamps yet. Attend passport-enabled events to start collecting!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stamps.map((stamp) => (
                  <div 
                    key={stamp.id} 
                    className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg border"
                    data-testid={`stamp-${stamp.id}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Event #{stamp.eventId}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Globe className="w-3 h-3" />
                        {stamp.countryCode}
                        {stamp.carnivalCircuit && (
                          <>
                            <span>•</span>
                            <span>{stamp.carnivalCircuit}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">+{stamp.pointsEarned}</div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Rewards */}
        <Card data-testid="card-rewards">
          <CardHeader>
            <CardTitle>Available Rewards</CardTitle>
            <CardDescription>Redeem your points for exclusive perks</CardDescription>
          </CardHeader>
          <CardContent>
            {rewardsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : rewards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No rewards available at the moment. Check back soon!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {rewards.map((reward) => {
                  const canClaim = profile?.currentTier === reward.metadata.tierRequired || 
                    (profile?.currentTier && tiers.findIndex(t => t.name === profile.currentTier) >= tiers.findIndex(t => t.name === reward.metadata.tierRequired));
                  
                  return (
                    <div 
                      key={reward.id}
                      className={`p-4 border rounded-lg ${canClaim ? 'bg-primary/5 border-primary/30' : 'bg-secondary/20 border-secondary opacity-60'}`}
                      data-testid={`reward-${reward.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{reward.metadata.title}</h4>
                          <p className="text-sm text-muted-foreground">{reward.metadata.description}</p>
                        </div>
                        {!canClaim && <Lock className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <Badge variant={canClaim ? "default" : "secondary"}>
                          {reward.metadata.tierRequired} Required
                        </Badge>
                        {reward.metadata.pointsCost && (
                          <span className="text-sm font-semibold">{reward.metadata.pointsCost} pts</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Tiers Overview */}
        <Card data-testid="card-all-tiers">
          <CardHeader>
            <CardTitle>Tier System</CardTitle>
            <CardDescription>See what you can unlock as you progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tiersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
              ) : (
                tiers.map((tier) => {
                  const isCurrentTier = tier.name === profile?.currentTier;
                  const isUnlocked = (profile?.totalPoints || 0) >= tier.minPoints;
                  
                  return (
                    <div 
                      key={tier.id}
                      className={`p-4 border-2 rounded-lg ${
                        isCurrentTier ? 'border-primary bg-primary/5' : 
                        isUnlocked ? 'border-secondary bg-secondary/20' : 
                        'border-secondary/30 bg-secondary/5 opacity-60'
                      }`}
                      data-testid={`tier-${tier.name}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Trophy className={`w-6 h-6 ${getTierColor(tier.name)}`} />
                          <div>
                            <h4 className={`font-bold text-lg ${getTierColor(tier.name)}`}>
                              {tier.name}
                              {isCurrentTier && <Badge variant="default" className="ml-2">Current</Badge>}
                            </h4>
                            <p className="text-sm text-muted-foreground">{tier.minPoints} points required</p>
                          </div>
                        </div>
                        {!isUnlocked && <Lock className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <p className="text-sm mb-2">{tier.perks.description}</p>
                      <div className="text-xs text-muted-foreground">
                        {tier.perks.perks?.length || 0} perks • {tier.perks.discounts?.length || 0} discounts
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
