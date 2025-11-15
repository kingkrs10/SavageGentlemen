import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Helmet } from "react-helmet";
import { Trophy, MapPin, Calendar, Award } from "lucide-react";

const TIER_COLORS: Record<string, string> = {
  BRONZE: 'bg-amber-700',
  SILVER: 'bg-gray-400',
  GOLD: 'bg-yellow-500',
  ELITE: 'bg-purple-600'
};

export default function PassportPublicProfile() {
  const params = useParams();
  const username = params.username?.replace('@', '');

  const { data: profile, isLoading, error } = useQuery({
    queryKey: [`/api/passport/profile/${username}`],
    enabled: !!username
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-center text-destructive font-semibold">
              Profile not found
            </p>
            <p className="text-center text-muted-foreground text-sm mt-2">
              @{username} does not have a Soca Passport profile
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profileData = profile as any;

  return (
    <>
      <Helmet>
        <title>{profileData.displayName}'s Passport | Savage Gentlemen</title>
        <meta name="description" content={`${profileData.displayName} has attended ${profileData.totalEvents} events and earned ${profileData.totalCredits} Fête Credits`} />
        <meta property="og:title" content={`${profileData.displayName}'s Soca Passport`} />
        <meta property="og:description" content={`${profileData.totalEvents} events • ${profileData.totalCountries} countries • ${profileData.achievementsUnlocked} achievements`} />
        <meta property="og:image" content={profileData.avatar || '/default-avatar.png'} />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Profile Header */}
        <Card data-testid="card-profile-header">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="h-24 w-24" data-testid="img-avatar">
                <AvatarImage src={profileData.avatar} alt={profileData.displayName} />
                <AvatarFallback>{profileData.displayName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-2">
                  <h1 className="text-3xl font-bold" data-testid="text-display-name">{profileData.displayName}</h1>
                  <Badge className={`${TIER_COLORS[profileData.tier]} text-white`} data-testid="badge-tier">
                    {profileData.tier}
                  </Badge>
                </div>
                <p className="text-muted-foreground" data-testid="text-username">@{profileData.username}</p>
                <div className="flex flex-wrap gap-4 mt-4 justify-center sm:justify-start">
                  <div className="text-center">
                    <div className="text-2xl font-bold" data-testid="text-total-credits">{profileData.totalCredits.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Fête Credits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" data-testid="text-total-events">{profileData.totalEvents}</div>
                    <div className="text-sm text-muted-foreground">Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" data-testid="text-total-countries">{profileData.totalCountries}</div>
                    <div className="text-sm text-muted-foreground">Countries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" data-testid="text-achievements-unlocked">{profileData.achievementsUnlocked}/{profileData.totalAchievements}</div>
                    <div className="text-sm text-muted-foreground">Achievements</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card data-testid="card-achievements">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>{profileData.achievementsUnlocked} unlocked</CardDescription>
              </div>
              <Award className="h-6 w-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {profileData.achievements.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No achievements unlocked yet
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profileData.achievements.map((achievement: any) => (
                  <div
                    key={achievement.slug}
                    data-testid={`achievement-${achievement.slug}`}
                    className="p-4 rounded-lg border bg-primary/10 border-primary"
                  >
                    <div className="flex items-start gap-3">
                      <Trophy className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <div className="font-semibold">{achievement.name}</div>
                        <div className="text-sm text-muted-foreground">{achievement.description}</div>
                        <Badge variant="secondary" className="mt-2">
                          +{achievement.creditBonus} credits
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Countries Visited */}
        {profileData.countries.length > 0 && (
          <Card data-testid="card-countries">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Countries Visited</CardTitle>
                  <CardDescription>{profileData.totalCountries} countries</CardDescription>
                </div>
                <MapPin className="h-6 w-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profileData.countries.map((country: string) => (
                  <Badge key={country} variant="outline" data-testid={`badge-country-${country}`}>
                    {country}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Member Since */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Member since {new Date(profileData.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
