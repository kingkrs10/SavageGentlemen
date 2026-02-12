import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, Globe, MapPin, Award, Star, QrCode, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import type { PassportProfile, PassportStamp, PassportTier } from "@shared/schema";
import QRCodeLib from "qrcode";
import { useEffect, useState } from "react";
import { PassportMissions } from "@/components/passport/PassportMissions";
import { PassportAchievements } from "@/components/passport/PassportAchievements";
import { PassportMarketplace } from "@/components/passport/PassportMarketplace";
import { EventCheckIn } from "@/components/passport/EventCheckIn";
import { AdColumn } from "@/components/layout/AdColumn";
import PassportHeroImg from "@/assets/passport-hero.png";
import carnivalVideo from "@assets/Caribbean_Nightlife_Loop_Animation_1763081047699.mp4";

// API response includes dynamically generated qrData
interface PassportProfileWithQR extends PassportProfile {
  qrData?: string;
}

export default function Passport() {
  const { user, logout } = useUser();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  const { data: profile, isLoading: profileLoading } = useQuery<PassportProfileWithQR>({
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

  const currentTier = tiers.find(t => t.name === (profile?.currentTier || 'BRONZE'));
  const nextTier = tiers.find(t => t.minPoints > (profile?.totalPoints || 0));
  const progressToNext = nextTier
    ? ((profile?.totalPoints || 0) - (currentTier?.minPoints || 0)) / (nextTier.minPoints - (currentTier?.minPoints || 0)) * 100
    : 0;

  // New vibrant theme colors
  const getTierBorderColor = (tierName: string) => {
    switch (tierName) {
      case 'GOLD': return 'border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.4)]';
      case 'ELITE': return 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.4)]';
      case 'SILVER': return 'border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.4)]';
      default: return 'border-pink-500/50';
    }
  };

  const getTierBadgeColor = (tierName: string) => {
    switch (tierName) {
      case 'GOLD': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500';
      case 'ELITE': return 'bg-purple-500/10 text-purple-400 border-purple-500';
      case 'SILVER': return 'bg-cyan-400/10 text-cyan-400 border-cyan-400';
      default: return 'bg-pink-500/10 text-pink-500 border-pink-500';
    }
  };

  const nextTierData = tiers.find(t => t.minPoints > (profile?.totalPoints || 0));

  // Guest user check
  const isGuest = !user || user.isGuest;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2c3e50] to-[#34495e] text-white selection:bg-pink-500 selection:text-white relative overflow-hidden">
      <Helmet>
        <title>My Passport - Savage Gentlemen</title>
        <meta name="description" content="View your Soca Passport status, stamps, and rewards." />
      </Helmet>

      {/* Unified Video Background - Matching Socapassport Landing Page */}
      <div className="fixed inset-0 overflow-hidden z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-20"
        >
          <source src={carnivalVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#2c3e50]/90 via-[#34495e]/50 to-[#2c3e50]/95" />
      </div>

      {/* Hyper-Realistic Lighting Layers - Matching Socapassport Landing Page */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(230,126,34,0.15),transparent_50%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(52,152,219,0.12),transparent_55%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(230,126,34,0.1),transparent_40%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_60%,rgba(52,152,219,0.08),transparent_45%)] pointer-events-none z-0" />

      {/* Main Content Layout with Ad Columns */}
      <div className="relative z-10 flex justify-center gap-6 px-2 py-6 max-w-[1600px] mx-auto">

        {/* Left Ad Column */}
        <AdColumn position="left" />

        {/* Center Content */}
        <div className="flex-1 max-w-6xl space-y-8 min-w-0">

          {/* Hero Section */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black">
            {/* Vibrant Gradient Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-black to-cyan-900/30" />

            {/* Sign Out Button - Top Right */}
            {!isGuest && (
              <div className="absolute top-4 right-4 z-20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    window.location.href = '/socapassport/auth';
                  }}
                  className="text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">
              <div className="flex-1 text-center md:text-left space-y-4">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 filter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                  SOCA<br />PASSPORT
                </h1>
                <p className="text-xl text-gray-300 font-light tracking-wide max-w-md">
                  Your digital identity for the Caribbean Carnival experience. Collect, earn, and redeem.
                </p>
              </div>
              <div className="flex-1 flex justify-center transform hover:scale-105 transition-transform duration-700">
                <img src={PassportHeroImg} alt="Soca Passport Visual" className="w-full max-w-md object-contain drop-shadow-[0_0_50px_rgba(244,114,182,0.3)]" />
              </div>
            </div>
          </div>

          <Tabs defaultValue="checkin" className="space-y-8">
            <TabsList className="grid w-full grid-cols-5 p-1.5 bg-neutral-900/90 border border-white/10 rounded-full backdrop-blur-md sticky top-4 z-40 shadow-xl max-w-3xl mx-auto">
              <TabsTrigger value="checkin" className="rounded-full py-2.5 text-sm font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-900/80 data-[state=active]:to-cyan-900/80 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/20 transition-all duration-300">Check In</TabsTrigger>
              <TabsTrigger value="overview" className="rounded-full py-2.5 text-sm font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-900/80 data-[state=active]:to-purple-900/80 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/20 transition-all duration-300">Overview</TabsTrigger>
              <TabsTrigger value="missions" className="rounded-full py-2.5 text-sm font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-900/80 data-[state=active]:to-pink-900/80 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-pink-500/20 transition-all duration-300">Missions</TabsTrigger>
              <TabsTrigger value="achievements" className="rounded-full py-2.5 text-sm font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-900/80 data-[state=active]:to-orange-900/80 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/20 transition-all duration-300">Badges</TabsTrigger>
              <TabsTrigger value="marketplace" className="rounded-full py-2.5 text-sm font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-900/80 data-[state=active]:to-teal-900/80 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/20 transition-all duration-300">Rewards</TabsTrigger>
            </TabsList>

            {/* Check In Tab */}
            <TabsContent value="checkin" className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
              {isGuest ? (
                <Card className="bg-black/60 backdrop-blur-2xl border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/30 text-center py-12">
                  <CardContent>
                    <p className="text-gray-300 mb-4">Sign in to check in at events and earn stamps.</p>
                    <Link href="/socapassport/auth">
                      <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold px-8">
                        Sign In to Check In
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <EventCheckIn />
              )}
            </TabsContent>

            <TabsContent value="overview" className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
              {/* Tier Status Card */}
              <div className={`rounded-3xl border bg-neutral-900/50 backdrop-blur-sm p-1 ${getTierBorderColor(profile?.currentTier || 'BRONZE')}`}>
                <div className="p-6 md:p-8 bg-black/40 rounded-[22px]">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div>
                      <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Current Status</h2>
                      <p className="text-gray-400">Track your tier progress and unlock rewards</p>
                    </div>
                    {profileLoading ? (
                      <Skeleton className="h-10 w-32 bg-neutral-800" />
                    ) : (
                      <Badge className={`${getTierBadgeColor(profile?.currentTier || 'BRONZE')} text-xl px-6 py-2 rounded-full border-2 shadow-lg`}>
                        <Trophy className="w-5 h-5 mr-2" />
                        {profile?.currentTier || 'BRONZE'}
                      </Badge>
                    )}
                  </div>

                  {profileLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full bg-neutral-800" />
                      <Skeleton className="h-4 w-3/4 bg-neutral-800" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="font-medium text-cyan-300">{profile?.totalPoints || 0} points</span>
                        {nextTierData ? (
                          <span className="text-gray-400">
                            {nextTierData.minPoints - (profile?.totalPoints || 0)} points to <span className="text-white font-bold">{nextTierData.name}</span>
                          </span>
                        ) : (
                          <span className="text-yellow-400 font-bold glow">Max Tier Achieved! 🎉</span>
                        )}
                      </div>
                      <Progress value={progressToNext} className="h-4 mb-8 bg-neutral-800" indicatorClassName="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { icon: Calendar, label: "Events", value: profile?.totalEvents || 0, color: "text-cyan-400" },
                          { icon: Globe, label: "Countries", value: profile?.totalCountries || 0, color: "text-pink-400" },
                          { icon: MapPin, label: "Circuits", value: stamps.filter((s, i, arr) => arr.findIndex(x => x.carnivalCircuit === s.carnivalCircuit) === i).length, color: "text-purple-400" },
                          { icon: Star, label: "Total Points", value: profile?.totalPoints || 0, color: "text-yellow-400" },
                        ].map((stat, i) => (
                          <div key={i} className="text-center p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                            <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                            <div className="text-3xl font-bold tracking-tight text-white mb-1">{stat.value}</div>
                            <div className="text-xs font-medium uppercase tracking-wider text-gray-500">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Check-In QR Code */}
              {profile?.qrData && (
                <Card className="border border-white/10 bg-gradient-to-br from-neutral-900 to-black overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-cyan-500/20 transition-all duration-700"></div>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <QrCode className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Event Check-In</CardTitle>
                        <CardDescription className="text-gray-400">Scan this code at entry</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center gap-6">
                      {qrCodeUrl ? (
                        <div className="bg-white p-4 rounded-3xl shadow-[0_0_40px_rgba(34,211,238,0.2)] transform hover:scale-105 transition-transform duration-300">
                          <img
                            src={qrCodeUrl}
                            alt="Passport Check-In QR Code"
                            className="w-64 h-64 mix-blend-multiply"
                          />
                        </div>
                      ) : (
                        <Skeleton className="w-64 h-64 rounded-3xl bg-neutral-800" />
                      )}
                      <div className="text-center space-y-2">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                          Live Code
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tier Perks */}
              {currentTier && (
                <Card className="border border-white/10 bg-neutral-900/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-400" />
                      {currentTier.name} Benefits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentTier.perks.perks.map((perk: string, i: number) => (
                        <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                          <span className="text-sm text-gray-300">{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Stamp Collection */}
              <div>
                <div className="flex items-center justify-between mb-6 px-1">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight text-white">Stamp Collection</h3>
                    <p className="text-sm text-gray-400">Digital souvenirs from your journey</p>
                  </div>
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/5">{stamps.length} Collected</Badge>
                </div>

                {stampsLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="aspect-square rounded-2xl bg-neutral-800" />)}
                  </div>
                ) : stamps.length === 0 ? (
                  <Card className="border-dashed border-white/10 bg-transparent">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Calendar className="w-10 h-10 opacity-30" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-300 mb-1">No Stamps Yet</h4>
                      <p className="max-w-sm mx-auto text-gray-500">Attend passport-enabled events to start collecting your digital souvenirs!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {stamps.map((stamp) => (
                      <div
                        key={stamp.id}
                        className="group relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 shadow-xl"
                      >
                        {/* Stamp Image */}
                        <div className="absolute inset-0">
                          {(stamp as any).stampImageUrl ? (
                            <img
                              src={(stamp as any).stampImageUrl}
                              alt="Event Stamp"
                              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-gray-700">
                              <MapPin className="w-12 h-12" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                        </div>

                        {/* Overlay Content */}
                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-1">
                            {stamp.countryCode}
                          </div>
                          <div className="font-bold text-sm leading-tight text-white mb-2 line-clamp-2 shadow-black drop-shadow-md">
                            {(stamp as any).eventTitle || `Event #${stamp.eventId}`}
                          </div>
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-pink-500 text-white border-0 font-bold">
                            +{stamp.pointsEarned} PTS
                          </Badge>
                        </div>

                        {/* Border Glow on Hover */}
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-cyan-400/50 rounded-2xl transition-colors duration-300 pointer-events-none" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="missions" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500 delay-100">
              <PassportMissions />
            </TabsContent>

            <TabsContent value="achievements" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500 delay-100">
              <PassportAchievements />
            </TabsContent>

            <TabsContent value="marketplace" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500 delay-100">
              <PassportMarketplace />
            </TabsContent>

          </Tabs>

          {/* Guest Mode CTA */}
          {!user && (
            <div className="mt-12 mb-8 p-8 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 to-purple-950/30 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-3 text-white">Start Your Collection</h3>
                <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                  Sign in to start collecting stamps, earning points, and unlocking exclusive rewards.
                </p>
                <Link href="/socapassport/auth">
                  <a className="inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-black transition-all duration-200 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full hover:from-cyan-300 hover:to-cyan-400 hover:scale-105 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                    Sign In / Join Now
                  </a>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Ad Column */}
        <AdColumn position="right" />
      </div>
    </div>
  );
}
