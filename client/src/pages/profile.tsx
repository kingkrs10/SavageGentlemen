import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Calendar, 
  MapPin, 
  Star, 
  Camera, 
  Users, 
  Ticket, 
  Trophy,
  Settings,
  Heart,
  MessageSquare,
  DollarSign,
  Copy,
  CheckCircle2
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { formatEventPrice } from "@/lib/currency";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import BrandLoader from "@/components/ui/BrandLoader";

interface UserProfile {
  id: number;
  username: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  role: string;
  createdAt: string;
}

interface EventAttendance {
  id: number;
  event: {
    id: number;
    title: string;
    date: string;
    location: string;
    imageUrl?: string;
  };
  checkedInAt: string;
}

interface EventReview {
  id: number;
  rating: number;
  title?: string;
  review?: string;
  createdAt: string;
  event: {
    id: number;
    title: string;
    imageUrl?: string;
  };
}

interface EventPhoto {
  id: number;
  photoUrl: string;
  caption?: string;
  likes: number;
  createdAt: string;
  event: {
    id: number;
    title: string;
  };
}

interface FollowStats {
  followers: number;
  following: number;
}

const ProfilePage = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("attendance");
  const queryClient = useQueryClient();

  console.log('ProfilePage - user:', user);

  // Get user profile data
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: [`/api/users/${user?.id}/profile`],
    enabled: !!user?.id,
  });

  console.log('Profile query - enabled:', !!user?.id, 'loading:', profileLoading, 'data:', profile, 'error:', profileError);

  // Get event attendance history
  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/attendance`],
    enabled: !!user?.id,
  });

  // Get user's event reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/reviews`],
    enabled: !!user?.id,
  });

  // Get user's event photos
  const { data: photos, isLoading: photosLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/photos`],
    enabled: !!user?.id,
  });

  // Get follow statistics
  const { data: followStats } = useQuery({
    queryKey: [`/api/users/${user?.id}/follow-stats`],
    enabled: !!user?.id,
  });

  // Get user's tickets
  const { data: tickets } = useQuery({
    queryKey: [`/api/users/${user?.id}/tickets`],
    enabled: !!user?.id,
  });

  // Get user's affiliate program status
  const { data: affiliateData, refetch: refetchAffiliate, isLoading: affiliateLoading } = useQuery<any>({
    queryKey: [`/api/users/${user?.id}/affiliate`],
    enabled: !!user?.id,
  });

  const [copied, setCopied] = useState(false);

  const joinAffiliate = async () => {
    if (!user?.id) return;
    try {
      await apiRequest('POST', `/api/users/${user.id}/affiliate`);
      refetchAffiliate();
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BrandLoader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Not signed in</h3>
              <p className="mt-1 text-sm text-gray-500">Please sign in to view your profile</p>
              <Button className="mt-4" asChild>
                <Link href="/auth">Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userProfile = profile || user || {};
  
  // Safely access properties with fallbacks
  const displayName = (userProfile as any)?.displayName || (userProfile as any)?.username || 'User';
  const username = (userProfile as any)?.username || 'user';
  const avatar = (userProfile as any)?.avatar;
  const role = (userProfile as any)?.role || 'user';
  const bio = (userProfile as any)?.bio;
  const location = (userProfile as any)?.location;
  const createdAt = (userProfile as any)?.createdAt;
  const followStatsData = followStats || { followers: 0, following: 0 };
  const attendanceData = Array.isArray(attendance) ? attendance : [];
  const reviewsData = Array.isArray(reviews) ? reviews : [];
  const photosData = Array.isArray(photos) ? photos : [];
  const ticketsData = Array.isArray(tickets) ? tickets : [];

  return (
    <div className="min-h-screen bg-obsidian text-white py-8 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
      <div>
        {/* Profile Header */}
        <div className="glass-obsidian-strong border border-gold-500/30 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-2xl mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-2 ring-gold-500/50 shadow-xl">
                <AvatarImage 
                  src={avatar} 
                  alt={displayName} 
                />
                <AvatarFallback className="text-2xl bg-gradient-to-tr from-gold-600 to-amber-400 text-obsidian font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-white">
                    {displayName}
                  </h1>
                  <p className="text-gold-400 font-mono text-sm">@{username}</p>
                  {role !== 'user' && (
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-gold-500/20 text-gold-300 border border-gold-500/40">
                      {role}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4 md:mt-0">
                  <Button variant="outline" size="sm" asChild className="border-gold-500/30 text-gold-300 hover:bg-gold-500/10 rounded-xl text-xs font-mono">
                    <Link href="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                </div>
              </div>

              {bio && (
                <p className="text-sm text-gray-300 mb-4">{bio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-400">
                {location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-gold-400" />
                    {location}
                  </div>
                )}
                {createdAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-gold-400" />
                    Joined {formatDate(createdAt)}
                  </div>
                )}
              </div>

              {/* Social Stats */}
              <div className="flex gap-6 mt-6 pt-4 border-t border-white/10">
                <div className="text-center">
                  <div className="font-heading font-bold text-lg text-white">{followStatsData.followers}</div>
                  <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-heading font-bold text-lg text-white">{followStatsData.following}</div>
                  <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">Following</div>
                </div>
                <div className="text-center">
                  <div className="font-heading font-bold text-lg text-gold-400">{attendanceData.length}</div>
                  <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">Events Attended</div>
                </div>
                <div className="text-center">
                  <div className="font-heading font-bold text-lg text-amber-400">{ticketsData.length}</div>
                  <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">Total Tickets</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap w-full md:w-auto bg-white/5 border border-white/10 p-1.5 gap-1.5 rounded-2xl backdrop-blur-md mb-6">
            <TabsTrigger 
              value="attendance"
              className="rounded-xl px-5 py-2 text-xs font-mono font-bold tracking-wider text-gray-300 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold-500 data-[state=active]:to-amber-400 data-[state=active]:text-obsidian data-[state=active]:shadow-lg data-[state=active]:shadow-gold-500/20"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger 
              value="reviews"
              className="rounded-xl px-5 py-2 text-xs font-mono font-bold tracking-wider text-gray-300 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold-500 data-[state=active]:to-amber-400 data-[state=active]:text-obsidian data-[state=active]:shadow-lg data-[state=active]:shadow-gold-500/20"
            >
              <Star className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger 
              value="photos"
              className="rounded-xl px-5 py-2 text-xs font-mono font-bold tracking-wider text-gray-300 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold-500 data-[state=active]:to-amber-400 data-[state=active]:text-obsidian data-[state=active]:shadow-lg data-[state=active]:shadow-gold-500/20"
            >
              <Camera className="h-4 w-4 mr-2" />
              Photos
            </TabsTrigger>
            <TabsTrigger 
              value="tickets"
              className="rounded-xl px-5 py-2 text-xs font-mono font-bold tracking-wider text-gray-300 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold-500 data-[state=active]:to-amber-400 data-[state=active]:text-obsidian data-[state=active]:shadow-lg data-[state=active]:shadow-gold-500/20"
            >
              <Ticket className="h-4 w-4 mr-2" />
              Tickets
            </TabsTrigger>
            <TabsTrigger 
              value="affiliate"
              className="rounded-xl px-5 py-2 text-xs font-mono font-bold tracking-wider text-gray-300 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold-500 data-[state=active]:to-amber-400 data-[state=active]:text-obsidian data-[state=active]:shadow-lg data-[state=active]:shadow-gold-500/20"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Affiliate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Attendance History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <div className="text-center py-8">
                    <BrandLoader />
                  </div>
                ) : attendanceData.length > 0 ? (
                  <div className="grid gap-4">
                    {attendanceData.map((item: EventAttendance) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                          {item.event.imageUrl ? (
                            <img 
                              src={item.event.imageUrl} 
                              alt={item.event.title}
                              className="h-full w-full object-cover rounded-lg"
                            />
                          ) : (
                            <Calendar className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.event.title}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.event.location}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Attended: {formatDate(item.checkedInAt)}
                          </p>
                        </div>

                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/events/${item.event.id}`}>View Event</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No events attended yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Check in to events to see your attendance history</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Event Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="text-center py-8">
                    <BrandLoader />
                  </div>
                ) : reviewsData.length > 0 ? (
                  <div className="grid gap-4">
                    {reviewsData.map((review: EventReview) => (
                      <div key={review.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{review.event.title}</h3>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="text-sm text-muted-foreground ml-2">
                                {formatDate(review.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {review.title && (
                          <h4 className="font-medium mb-2">{review.title}</h4>
                        )}
                        
                        {review.review && (
                          <p className="text-sm text-muted-foreground">{review.review}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Rate and review events you've attended</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Event Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {photosLoading ? (
                  <div className="text-center py-8">
                    <BrandLoader />
                  </div>
                ) : photosData.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photosData.map((photo: EventPhoto) => (
                      <div key={photo.id} className="group relative">
                        <img
                          src={photo.photoUrl}
                          alt={photo.caption || "Event photo"}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-end">
                          <div className="p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-xs font-medium">{photo.event.title}</p>
                            {photo.caption && (
                              <p className="text-xs">{photo.caption}</p>
                            )}
                            <div className="flex items-center gap-1 mt-1">
                              <Heart className="h-3 w-3" />
                              <span className="text-xs">{photo.likes}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No photos yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Share your event photos with the community</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  My Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ticketsData.length > 0 ? (
                  <div className="grid gap-4">
                    {ticketsData.map((ticket: any) => (
                      <div key={ticket.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                          <Ticket className="h-8 w-8 text-muted-foreground" />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold">{ticket.event?.title || 'Event'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {ticket.ticketType || 'General Admission'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Purchased: {formatDate(ticket.purchaseDate)}
                          </p>
                          <Badge 
                            variant={ticket.status === 'valid' ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {ticket.status}
                          </Badge>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold">
                            {formatEventPrice({ 
                              price: ticket.price, 
                              location: ticket.event?.location || '' 
                            })}
                          </p>
                          <Button variant="outline" size="sm" className="mt-2">
                            View Ticket
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Ticket className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Purchase tickets to upcoming events</p>
                    <Button className="mt-4" asChild>
                      <Link href="/events">Browse Events</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="affiliate" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Affiliate Program
                </CardTitle>
              </CardHeader>
              <CardContent>
                {affiliateLoading ? (
                  <div className="text-center py-8">
                    <BrandLoader />
                  </div>
                ) : affiliateData?.affiliate ? (
                  <div className="space-y-6">
                    <div className="p-6 border rounded-lg">
                      <h3 className="font-semibold text-lg mb-2">Your Referral Link</h3>
                      <p className="text-sm text-muted-foreground mb-4">Share this link to earn commission on Soca Noir Rosé purchases.</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-3 bg-muted border rounded-lg text-primary text-sm break-all">
                          {window.location.origin}/ref/{affiliateData.affiliate.referralCode}
                        </code>
                        <Button 
                          variant="secondary" 
                          onClick={() => copyToClipboard(`${window.location.origin}/ref/${affiliateData.affiliate.referralCode}`)}
                          className="shrink-0"
                        >
                          {copied ? <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
                          {copied ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <div className="text-2xl font-bold">{affiliateData.clicks || 0}</div>
                          <div className="text-sm text-muted-foreground">Total Clicks</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <div className="text-2xl font-bold">{affiliateData.conversions || 0}</div>
                          <div className="text-sm text-muted-foreground">Conversions</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <div className="text-2xl font-bold">${affiliateData.revenue || 0}</div>
                          <div className="text-sm text-muted-foreground">Revenue</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium">Join the Affiliate Program</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Earn commission by referring customers to Soca Noir Rosé.</p>
                    <Button onClick={joinAffiliate} className="mt-4">
                      Generate Referral Link
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;