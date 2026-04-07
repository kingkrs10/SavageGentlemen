"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Calendar, Globe, MapPin, Award, Star, Lock, QrCode } from "lucide-react";
import Link from "next/link";
import QRCodeLib from "qrcode";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Local types based on legacy and new schema
interface TierPerks {
    description: string;
    perks: string[];
    discounts: string[];
}

interface PassportProfile {
    id: number;
    userId: number;
    handle: string;
    totalPoints: number;
    currentTier: string;
    totalEvents: number;
    totalCountries: number;
}

interface PassportTier {
    id: number;
    name: string;
    minPoints: number;
    perks: TierPerks;
}

interface PassportStamp {
    id: number;
    userId: number;
    eventId: number;
    countryCode: string;
    carnivalCircuit?: string;
    pointsEarned: number;
    source: string;
}

interface PassportReward {
    id: number;
    rewardType: string;
    metadata: {
        title: string;
        description: string;
        tierRequired: string;
        pointsCost: number | null;
    };
    status: string;
}

export default function PassportPage() {
    const { user, isLoading: userLoading } = useUser();
    const router = useRouter();
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

    useEffect(() => {
        if (!userLoading && !user) {
            router.push("/login?redirect=/socapassport");
        }
    }, [user, userLoading, router]);

    const { data: profileData, isLoading: profileLoading } = useQuery<{
        profile: PassportProfile;
        progress: any;
        qrData: string;
    }>({
        queryKey: ['/api/passport/profile'],
        enabled: !!user
    });

    const { data: stampsData, isLoading: stampsLoading } = useQuery<{ stamps: PassportStamp[] }>({
        queryKey: ['/api/passport/stamps'],
        enabled: !!user
    });
    const stamps = stampsData?.stamps || [];

    const { data: tiersData, isLoading: tiersLoading } = useQuery<{ tiers: PassportTier[] }>({
        queryKey: ['/api/passport/leaderboard'], // Using leaderboard as a proxy if tiers endpoint missing, or we can fetch direct
    });
    const tiers = tiersData?.tiers || [
        { name: 'BRONZE', minPoints: 0, perks: { description: 'Entry level membership', perks: ['Basic stamps'], discounts: [] }, id: 1 },
        { name: 'SILVER', minPoints: 500, perks: { description: 'Frequent traveler', perks: ['Priority stamps'], discounts: ['5% Merch'] }, id: 2 },
        { name: 'GOLD', minPoints: 2000, perks: { description: 'Carnival hopper', perks: ['VIP stamps'], discounts: ['10% Merch'] }, id: 3 },
        { name: 'ELITE', minPoints: 5000, perks: { description: 'Soca Legend', perks: ['Legendary stamps', 'Meet & Greet'], discounts: ['20% Merch'] }, id: 4 },
    ];

    const { data: rewardsData, isLoading: rewardsLoading } = useQuery<{ rewards: PassportReward[] }>({
        queryKey: ['/api/passport/rewards'],
        enabled: !!user
    });
    const rewards = rewardsData?.rewards || [];

    const profile = profileData?.profile;
    const qrData = profileData?.qrData;
    const progress = profileData?.progress;

    // Generate QR code when profile data is available
    useEffect(() => {
        if (qrData) {
            QRCodeLib.toDataURL(qrData, {
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
    }, [qrData]);

    if (userLoading || (!user && userLoading)) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    }

    if (!user) return null;

    const currentTier = tiers.find(t => t.name === profile?.currentTier) || tiers[0];
    const nextTier = tiers.find(t => t.minPoints > (profile?.totalPoints || 0));
    const progressToNext = progress?.percentageToNext || 0;

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
        <div className="min-h-screen bg-black text-white px-4 py-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-heading uppercase tracking-widest mb-2 text-primary">Soca Passport</h1>
                    <p className="text-lg text-white/60 tracking-widest uppercase">Your Caribbean Carnival Journey</p>
                </div>

                {/* Tier Status Card */}
                <Card className="bg-gray-900 border-white/10">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl text-white">Current Status</CardTitle>
                                <CardDescription className="text-white/40">Track your tier progress and unlock rewards</CardDescription>
                            </div>
                            {profileLoading ? (
                                <Skeleton className="h-8 w-24 bg-white/5" />
                            ) : (
                                <Badge className={`${getTierBadgeColor(profile?.currentTier || 'BRONZE')} text-lg px-4 py-2 border-0`}>
                                    <Trophy className="w-4 h-4 mr-2" />
                                    {profile?.currentTier}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {profileLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-6 w-full bg-white/5" />
                                <Skeleton className="h-4 w-3/4 bg-white/5" />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{profile?.totalPoints || 0} points</span>
                                    {nextTier ? (
                                        <span className="text-white/40">
                                            {nextTier.minPoints - (profile?.totalPoints || 0)} points to {nextTier.name}
                                        </span>
                                    ) : (
                                        <span className="text-primary font-semibold">Max Tier Achieved! 🎉</span>
                                    )}
                                </div>
                                <Progress value={progressToNext} className="h-2 bg-white/5 [&>div]:bg-primary" />

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                                    <div className="text-center p-3 bg-black/40 rounded-none border border-white/5">
                                        <Calendar className="w-5 h-5 mx-auto mb-1 text-primary" />
                                        <div className="text-2xl font-bold">{profile?.totalEvents || 0}</div>
                                        <div className="text-[10px] text-white/40 uppercase tracking-widest">Events</div>
                                    </div>
                                    <div className="text-center p-3 bg-black/40 rounded-none border border-white/5">
                                        <Globe className="w-5 h-5 mx-auto mb-1 text-primary" />
                                        <div className="text-2xl font-bold">{profile?.totalCountries || 0}</div>
                                        <div className="text-[10px] text-white/40 uppercase tracking-widest">Countries</div>
                                    </div>
                                    <div className="text-center p-3 bg-black/40 rounded-none border border-white/5">
                                        <MapPin className="w-5 h-5 mx-auto mb-1 text-primary" />
                                        <div className="text-2xl font-bold">{stamps.filter((s, i, arr) => arr.findIndex(x => x.carnivalCircuit === s.carnivalCircuit) === i).length}</div>
                                        <div className="text-[10px] text-white/40 uppercase tracking-widest">Circuits</div>
                                    </div>
                                    <div className="text-center p-3 bg-black/40 rounded-none border border-white/5">
                                        <Star className="w-5 h-5 mx-auto mb-1 text-primary" />
                                        <div className="text-2xl font-bold">{profile?.totalPoints || 0}</div>
                                        <div className="text-[10px] text-white/40 uppercase tracking-widest">Points</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Check-In QR Code */}
                {qrData && (
                    <Card className="bg-gray-900 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <QrCode className="w-5 h-5 text-primary" />
                                <CardTitle className="text-white font-heading uppercase tracking-widest">Event Check-In Code</CardTitle>
                            </div>
                            <CardDescription className="text-white/40">
                                Show this QR code at passport-enabled events to collect your stamp
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center gap-6">
                                {qrCodeUrl ? (
                                    <div className="bg-white p-4 rounded-none shadow-[0_0_20px_rgba(255,107,0,0.3)]">
                                        <img
                                            src={qrCodeUrl}
                                            alt="Passport Check-In QR Code"
                                            className="w-56 h-56"
                                        />
                                    </div>
                                ) : (
                                    <Skeleton className="w-56 h-56 bg-white/5" />
                                )}
                                <div className="text-center space-y-3 max-w-md">
                                    <p className="text-xs text-white/40 leading-relaxed uppercase tracking-widest">
                                        Present this code at the event entrance for scanning. A new code is generated every 24 hours for security.
                                    </p>
                                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-primary/20 text-primary">
                                        Valid for 24 hours
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Stamps Timeline */}
                    <Card className="bg-gray-900 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white">Event Stamps</CardTitle>
                            <CardDescription className="text-white/40">Your carnival journey timeline</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {stampsLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full bg-white/5" />)}
                                </div>
                            ) : stamps.length === 0 ? (
                                <div className="text-center py-8 text-white/20">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-xs uppercase tracking-widest">No stamps yet. Attend passport-enabled events to start collecting!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {stamps.map((stamp) => (
                                        <div
                                            key={stamp.id}
                                            className="flex items-center gap-4 p-3 bg-black/40 rounded-none border border-white/5"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-white">Event #{stamp.eventId}</div>
                                                <div className="text-[10px] text-white/40 flex items-center gap-2 uppercase tracking-tighter">
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
                                                <div className="text-[10px] text-white/40 uppercase tracking-widest">points</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Available Rewards */}
                    <Card className="bg-gray-900 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white">Available Rewards</CardTitle>
                            <CardDescription className="text-white/40">Redeem your points for exclusive perks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {rewardsLoading ? (
                                <div className="space-y-3">
                                    {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full bg-white/5" />)}
                                </div>
                            ) : rewards.length === 0 ? (
                                <div className="text-center py-8 text-white/20">
                                    <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-xs uppercase tracking-widest">No rewards available at the moment. Check back soon!</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {rewards.map((reward) => {
                                        const canClaim = profile?.currentTier === reward.metadata.tierRequired;

                                        return (
                                            <div
                                                key={reward.id}
                                                className={`p-4 border rounded-none ${canClaim ? 'bg-primary/5 border-primary/20' : 'bg-black/20 border-white/5 opacity-40'}`}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-semibold text-white">{reward.metadata.title}</h4>
                                                        <p className="text-xs text-white/40">{reward.metadata.description}</p>
                                                    </div>
                                                    {!canClaim && <Lock className="w-4 h-4 text-white/20" />}
                                                </div>
                                                <div className="flex items-center justify-between mt-3">
                                                    <Badge variant={canClaim ? "default" : "secondary"} className="text-[10px] uppercase tracking-widest border-0">
                                                        {reward.metadata.tierRequired} Required
                                                    </Badge>
                                                    {reward.metadata.pointsCost && (
                                                        <span className="text-sm font-bold text-primary">{reward.metadata.pointsCost} pts</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* All Tiers Overview */}
                <Card className="bg-gray-900 border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white font-heading uppercase tracking-widest">Tier System</CardTitle>
                        <CardDescription className="text-white/40 uppercase text-xs tracking-tighter">See what you can unlock as you progress</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {tiersLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full bg-white/5" />)}
                                </div>
                            ) : (
                                tiers.map((tier) => {
                                    const isCurrentTier = tier.name === profile?.currentTier;
                                    const isUnlocked = (profile?.totalPoints || 0) >= tier.minPoints;

                                    return (
                                        <div
                                            key={tier.id}
                                            className={`p-4 border-2 rounded-none ${isCurrentTier ? 'border-primary bg-primary/5' :
                                                    isUnlocked ? 'border-white/10 bg-black/40' :
                                                        'border-white/5 bg-black/5 opacity-40'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <Trophy className={`w-6 h-6 ${getTierColor(tier.name)}`} />
                                                    <div>
                                                        <h4 className={`font-bold text-lg ${getTierColor(tier.name)} uppercase tracking-widest`}>
                                                            {tier.name}
                                                            {isCurrentTier && <Badge className="ml-2 bg-primary text-white text-[8px] border-0">Current</Badge>}
                                                        </h4>
                                                        <p className="text-[10px] text-white/40 uppercase tracking-widest">{tier.minPoints} points required</p>
                                                    </div>
                                                </div>
                                                {!isUnlocked && <Lock className="w-5 h-5 text-white/20" />}
                                            </div>
                                            <p className="text-sm mb-2 text-white/70">{tier.perks.description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {tier.perks.perks.map((perk, i) => (
                                                    <span key={i} className="text-[9px] uppercase tracking-tighter bg-white/5 px-2 py-1 rounded-none border border-white/5 text-white/40">
                                                        {perk}
                                                    </span>
                                                ))}
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
