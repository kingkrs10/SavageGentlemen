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
  MessageSquare
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <Avatar className="h-24 w-24 md:h-32 md:w-32">
                  <AvatarImage 
                    src={avatar} 
                    alt={displayName} 
                  />
                  <AvatarFallback className="text-2xl">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                      {displayName}
                    </h1>
                    <p className="text-muted-foreground">@{username}</p>
                    {role !== 'user' && (
                      <Badge variant="secondary" className="mt-1">
                        {role}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4 md:mt-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                    </Button>
                  </div>
                </div>

                {bio && (
                  <p className="text-sm text-muted-foreground mb-4">{bio}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {location}
                    </div>
                  )}
                  {createdAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {formatDate(createdAt)}
                    </div>
                  )}
                </div>

                {/* Social Stats */}
                <div className="flex gap-6 mt-4">
                  <div className="text-center">
                    <div className="font-bold text-lg">{followStatsData.followers}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{followStatsData.following}</div>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{attendanceData.length}</div>
                    <div className="text-sm text-muted-foreground">Events Attended</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{ticketsData.length}</div>
                    <div className="text-sm text-muted-foreground">Total Tickets</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="attendance">
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <Star className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="photos">
              <Camera className="h-4 w-4 mr-2" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="tickets">
              <Ticket className="h-4 w-4 mr-2" />
              Tickets
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
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;