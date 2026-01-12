"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    User as UserIcon,
    Calendar,
    MapPin,
    Star,
    Camera,
    Ticket,
    Settings,
    Heart
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { formatEventPrice } from "@/lib/currency";
import Link from "next/link";
import BrandLoader from "@/components/ui/BrandLoader";

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

export default function ProfilePage() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState("attendance");

    // Get user profile data
    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: [`/api/users/${user?.id}/profile`],
        enabled: !!user?.id,
    });

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
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <UserIcon className="mx-auto h-12 w-12 text-zinc-600" />
                            <h3 className="mt-2 text-lg font-medium text-white">Not signed in</h3>
                            <p className="mt-1 text-sm text-zinc-400">Please sign in to view your profile</p>
                            <Button className="mt-6 w-full bg-primary hover:bg-primary/90" asChild>
                                <Link href="/login">Sign In</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const userProfile = profile || user;

    const displayName = userProfile?.displayName || userProfile?.username || 'User';
    const username = userProfile?.username || 'user';
    const avatar = userProfile?.avatar;
    const role = userProfile?.role || 'user';
    const bio = userProfile?.bio;
    const location = userProfile?.location;
    const createdAt = userProfile?.createdAt;
    const followStatsData = followStats || { followers: 0, following: 0 };
    const attendanceData = Array.isArray(attendance) ? attendance : [];
    const reviewsData = Array.isArray(reviews) ? reviews : [];
    const photosData = Array.isArray(photos) ? photos : [];
    const ticketsData = Array.isArray(tickets) ? (Array.isArray(tickets) ? tickets : (tickets as any).tickets || []) : [];

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Profile Header */}
                <Card className="mb-8 bg-zinc-900/40 border-zinc-800 backdrop-blur-xl">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-shrink-0 flex justify-center md:block">
                                <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-2 ring-primary/20">
                                    <AvatarImage
                                        src={avatar}
                                        alt={displayName}
                                    />
                                    <AvatarFallback className="text-2xl bg-zinc-800">
                                        {displayName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                                            {displayName}
                                        </h1>
                                        <p className="text-zinc-400">@{username}</p>
                                        {role !== 'user' && (
                                            <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary border-primary/20">
                                                {role}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-4 md:mt-0 justify-center md:justify-end">
                                        <Button variant="outline" size="sm" className="border-zinc-800 hover:bg-zinc-800" asChild>
                                            <Link href="/settings">
                                                <Settings className="h-4 w-4 mr-2" />
                                                Settings
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                                {bio && (
                                    <p className="text-sm text-zinc-400 mb-4 max-w-2xl">{bio}</p>
                                )}

                                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-zinc-500">
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
                                <div className="flex flex-wrap justify-center md:justify-start gap-8 mt-6 pt-6 border-t border-zinc-800/50">
                                    <div className="text-center md:text-left">
                                        <div className="font-bold text-xl text-white">{followStatsData.followers}</div>
                                        <div className="text-xs uppercase tracking-wider text-zinc-500">Followers</div>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <div className="font-bold text-xl text-white">{followStatsData.following}</div>
                                        <div className="text-xs uppercase tracking-wider text-zinc-500">Following</div>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <div className="font-bold text-xl text-white">{attendanceData.length}</div>
                                        <div className="text-xs uppercase tracking-wider text-zinc-500">Events Attended</div>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <div className="font-bold text-xl text-white">{ticketsData.length}</div>
                                        <div className="text-xs uppercase tracking-wider text-zinc-500">Total Tickets</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Profile Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-zinc-900/50 p-1 border border-zinc-800 h-12">
                        <TabsTrigger value="attendance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Calendar className="h-4 w-4 mr-2 hidden sm:inline" />
                            Events
                        </TabsTrigger>
                        <TabsTrigger value="reviews" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Star className="h-4 w-4 mr-2 hidden sm:inline" />
                            Reviews
                        </TabsTrigger>
                        <TabsTrigger value="photos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Camera className="h-4 w-4 mr-2 hidden sm:inline" />
                            Photos
                        </TabsTrigger>
                        <TabsTrigger value="tickets" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Ticket className="h-4 w-4 mr-2 hidden sm:inline" />
                            Tickets
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="attendance" className="mt-8 space-y-4">
                        <Card className="bg-zinc-900/40 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    Attendance History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {attendanceLoading ? (
                                    <div className="flex justify-center py-12">
                                        <BrandLoader />
                                    </div>
                                ) : attendanceData.length > 0 ? (
                                    <div className="grid gap-4">
                                        {attendanceData.map((item: EventAttendance) => (
                                            <div key={item.id} className="flex items-center gap-4 p-4 bg-zinc-900/60 border border-zinc-800/50 rounded-xl hover:border-zinc-700 transition-colors">
                                                <div className="h-16 w-16 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.event.imageUrl ? (
                                                        <img
                                                            src={item.event.imageUrl}
                                                            alt={item.event.title}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-zinc-600">
                                                            <Calendar className="h-8 w-8" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold truncate">{item.event.title}</h3>
                                                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {item.event.location}
                                                    </p>
                                                    <p className="text-xs text-zinc-400 mt-1">
                                                        Attended: {formatDate(item.checkedInAt)}
                                                    </p>
                                                </div>

                                                <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary" asChild>
                                                    <Link href={`/events/${item.event.id}`}>Details</Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl">
                                        <Calendar className="mx-auto h-12 w-12 text-zinc-800 mb-3" />
                                        <h3 className="text-sm font-medium text-white uppercase tracking-widest">No events yet</h3>
                                        <p className="mt-1 text-xs text-zinc-500">Events you attend will appear here.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="reviews" className="mt-8">
                        <Card className="bg-zinc-900/40 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Star className="h-5 w-5 text-primary" />
                                    Your Reviews
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {reviewsLoading ? (
                                    <div className="flex justify-center py-12">
                                        <BrandLoader />
                                    </div>
                                ) : reviewsData.length > 0 ? (
                                    <div className="grid gap-4">
                                        {reviewsData.map((review: EventReview) => (
                                            <div key={review.id} className="p-4 bg-zinc-900/60 border border-zinc-800/50 rounded-xl">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="font-semibold">{review.event.title}</h3>
                                                        <div className="flex items-center gap-0.5 mt-1.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`h-3 w-3 ${i < review.rating ? 'fill-primary text-primary' : 'text-zinc-700'
                                                                        }`}
                                                                />
                                                            ))}
                                                            <span className="text-[10px] text-zinc-500 ml-2 uppercase tracking-tight">
                                                                {formatDate(review.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {review.title && (
                                                    <h4 className="font-medium text-sm mb-1">{review.title}</h4>
                                                )}

                                                {review.review && (
                                                    <p className="text-sm text-zinc-400 leading-relaxed">{review.review}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl">
                                        <Star className="mx-auto h-12 w-12 text-zinc-800 mb-3" />
                                        <h3 className="text-sm font-medium text-white uppercase tracking-widest">No reviews yet</h3>
                                        <p className="mt-1 text-xs text-zinc-500">Rate events you've attended to help others.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="photos" className="mt-8">
                        <Card className="bg-zinc-900/40 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Camera className="h-5 w-5 text-primary" />
                                    Your Gallery
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {photosLoading ? (
                                    <div className="flex justify-center py-12">
                                        <BrandLoader />
                                    </div>
                                ) : photosData.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {photosData.map((photo: EventPhoto) => (
                                            <div key={photo.id} className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-zinc-800 border border-zinc-800">
                                                <img
                                                    src={photo.photoUrl}
                                                    alt={photo.caption || "Event photo"}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                                                    <div className="p-3 w-full">
                                                        <p className="text-[10px] uppercase tracking-widest text-primary font-bold">{photo.event.title}</p>
                                                        {photo.caption && (
                                                            <p className="text-xs text-white line-clamp-1 mt-0.5">{photo.caption}</p>
                                                        )}
                                                        <div className="flex items-center gap-1 mt-1 text-zinc-300">
                                                            <Heart className="h-3 w-3 fill-current" />
                                                            <span className="text-xs">{photo.likes}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl">
                                        <Camera className="mx-auto h-12 w-12 text-zinc-800 mb-3" />
                                        <h3 className="text-sm font-medium text-white uppercase tracking-widest">No photos yet</h3>
                                        <p className="mt-1 text-xs text-zinc-500">Upload photos from events to build your gallery.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="tickets" className="mt-8">
                        <Card className="bg-zinc-900/40 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Ticket className="h-5 w-5 text-primary" />
                                    Your Tickets
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {ticketsData.length > 0 ? (
                                    <div className="grid gap-4">
                                        {ticketsData.map((ticket: any) => (
                                            <div key={ticket.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-zinc-900/60 border border-zinc-800/50 rounded-xl">
                                                <div className="h-16 w-16 bg-zinc-800/50 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                                                    <Ticket className="h-8 w-8" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold truncate">{ticket.event?.title || 'Event'}</h3>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        <Badge variant="outline" className="text-[10px] py-0 border-zinc-700 text-zinc-400 font-normal">
                                                            {ticket.ticketType || 'Standard'}
                                                        </Badge>
                                                        <Badge
                                                            variant={ticket.status === 'valid' ? 'default' : 'secondary'}
                                                            className={`text-[10px] py-0 font-bold ${ticket.status === 'valid' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-zinc-800 text-zinc-500'
                                                                }`}
                                                        >
                                                            {ticket.status?.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-wide">
                                                        Purchased {formatDate(ticket.purchaseDate)}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 pt-4 sm:pt-0 border-t sm:border-0 border-zinc-800/50">
                                                    <div className="text-right">
                                                        <p className="font-bold text-lg">
                                                            {formatEventPrice({
                                                                price: ticket.price,
                                                                location: ticket.event?.location || ''
                                                            })}
                                                        </p>
                                                    </div>
                                                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold" asChild>
                                                        <Link href="/my-tickets">View All</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl">
                                        <Ticket className="mx-auto h-12 w-12 text-zinc-800 mb-3" />
                                        <h3 className="text-sm font-medium text-white uppercase tracking-widest">No tickets yet</h3>
                                        <p className="mt-1 text-xs text-zinc-500 mb-6">You haven't purchased any tickets yet.</p>
                                        <Button variant="outline" className="border-primary text-primary hover:bg-primary/10" asChild>
                                            <Link href="/events">Find Events</Link>
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
}
