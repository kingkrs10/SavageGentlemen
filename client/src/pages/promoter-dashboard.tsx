import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Calendar, MapPin, Trophy, ArrowLeft, Clock, Activity, Search, ExternalLink } from "lucide-react";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";

interface EventData {
    id: number;
    title: string;
    date: string | null;
    location: string | null;
    accessCode: string;
    stampPointsDefault: number;
    countryCode: string | null;
    carnivalCircuit: string | null;
    imageUrl: string | null;
}

interface CheckinData {
    id: number;
    displayName: string;
    checkedInAt: string;
    creditsEarned: number;
    checkinMethod: string;
}

interface DashboardResponse {
    event: EventData;
    stats: {
        totalCheckins: number;
        todayCheckins: number;
        totalCreditsAwarded: number;
        referralSales: Array<{
            promoterId: number;
            promoterName: string;
            referralCode: string;
            orderCount: number;
            totalRevenue: number;
            ticketCount: number;
        }>;
    };
    myPromoter?: {
        id: number;
        referralCode: string;
        name: string;
    } | null;
    checkins: CheckinData[];
}

export default function PromoterDashboard() {
    const { code } = useParams<{ code: string }>();
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    // Fetch dashboard data
    const { data, isLoading, error } = useQuery<DashboardResponse>({
        queryKey: [`/api/passport/promoter/dashboard/${code}`],
        enabled: !!code,
        retry: false,
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "TBA";
        return new Date(dateStr).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const getMethodLabel = (method: string) => {
        switch (method) {
            case "CODE_ENTRY":
                return "Event Code";
            case "GEO_CHECKIN":
                return "GPS Location";
            case "QR_SCAN":
                return "QR Scan";
            default:
                return method;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full mx-auto" />
                    <p className="text-gray-300">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
                <Helmet>
                    <title>Invalid Access Code - Soca Passport</title>
                </Helmet>
                <Card className="max-w-md w-full bg-black/60 backdrop-blur-xl border-red-500/50">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl text-red-400">Access Denied</CardTitle>
                        <CardDescription className="text-gray-300">
                            This event does not have Soca Passport enabled or the access code is invalid.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            variant="outline"
                            onClick={() => setLocation("/passport-promoters")}
                            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Promoter Portal
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { event, stats, checkins } = data;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
            <Helmet>
                <title>{event.title} - Promoter Dashboard | Soca Passport</title>
            </Helmet>

            <div className="container mx-auto p-4 md:p-8 max-w-6xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLocation("/passport-promoters")}
                        className="text-gray-400 hover:text-white hover:bg-white/10"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white">{event.title}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-gray-300 mt-2">
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {formatDate(event.date)}
                            </span>
                            {event.location && (
                                <span className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {event.location}
                                </span>
                            )}
                            <Badge variant="outline" className="border-green-500/50 text-green-400">
                                Code: {event.accessCode}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Referral Link Section */}
                {data?.myPromoter?.referralCode && (
                    <Card className="mb-8 bg-gradient-to-r from-green-900/40 to-emerald-900/40 backdrop-blur-xl border-green-500/30 overflow-hidden shadow-lg shadow-green-500/10">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-green-400" />
                                <CardTitle className="text-lg text-green-200 uppercase tracking-wider font-black">My Referral Program</CardTitle>
                            </div>
                            <CardDescription className="text-gray-300">
                                Share your personal link to track ticket sales and earn rewards.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="flex-1 px-4 py-3 rounded-lg bg-black/40 border border-green-500/20 font-mono text-green-400 text-sm flex items-center justify-between">
                                    <span className="truncate">{window.location.origin}/events?ref={data.myPromoter.referralCode}</span>
                                    <code className="ml-2 px-2 py-1 bg-green-500/20 rounded text-xs select-all">
                                        {data.myPromoter.referralCode}
                                    </code>
                                </div>
                                <Button 
                                    className="bg-green-500 hover:bg-green-600 text-black font-bold uppercase"
                                    onClick={() => {
                                        const link = `${window.location.origin}/events?ref=${data.myPromoter?.referralCode}`;
                                        navigator.clipboard.writeText(link);
                                        toast({
                                            title: "Link Copied!",
                                            description: "Your referral link is ready to share.",
                                        });
                                    }}
                                >
                                    Copy Link
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-black/60 backdrop-blur-xl border-2 border-green-500/30 shadow-lg shadow-green-500/10">
                        <CardHeader className="pb-3">
                            <CardDescription className="text-gray-400 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Total Check-ins
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-5xl font-black text-white">{stats.totalCheckins}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/60 backdrop-blur-xl border-2 border-purple-500/30 shadow-lg shadow-purple-500/10">
                        <CardHeader className="pb-3">
                            <CardDescription className="text-gray-400 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Today's Check-ins
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-5xl font-black text-white">{stats.todayCheckins}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/60 backdrop-blur-xl border-2 border-orange-500/30 shadow-lg shadow-orange-500/10">
                        <CardHeader className="pb-3">
                            <CardDescription className="text-gray-400 flex items-center gap-2">
                                <Trophy className="w-4 h-4" />
                                Credits Awarded
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-5xl font-black text-white">{stats.totalCreditsAwarded.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Referral Stats (New) */}
                {stats.referralSales && stats.referralSales.length > 0 && (
                    <Card className="bg-black/60 backdrop-blur-xl border-2 border-blue-500/30 mb-8 overflow-hidden shadow-lg shadow-blue-500/10">
                        <CardHeader className="bg-blue-500/10 border-b border-blue-500/20">
                            <CardTitle className="text-xl text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-400" />
                                Referral Performance
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                                Tracking sales attributed to specific promoters via referral codes
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-gray-700 bg-black/40 hover:bg-black/40">
                                            <TableHead className="text-gray-300">Promoter</TableHead>
                                            <TableHead className="text-gray-300">Code</TableHead>
                                            <TableHead className="text-gray-300 text-right">Orders</TableHead>
                                            <TableHead className="text-gray-300 text-right">Tickets</TableHead>
                                            <TableHead className="text-gray-300 text-right">Revenue</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stats.referralSales.map((sale) => (
                                            <TableRow key={sale.promoterId} className={`border-gray-700 hover:bg-white/5 ${sale.promoterId === data.myPromoter?.id ? "bg-green-500/10" : ""}`}>
                                                <TableCell className="font-bold text-white">
                                                    {sale.promoterName} {sale.promoterId === data.myPromoter?.id && "(Me)"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 font-mono">
                                                        {sale.referralCode}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-gray-300">{sale.orderCount}</TableCell>
                                                <TableCell className="text-right text-gray-300">{sale.ticketCount}</TableCell>
                                                <TableCell className="text-right font-black text-green-400">
                                                    ${(sale.totalRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Attendee List */}
                <Card className="bg-black/60 backdrop-blur-xl border-2 border-gray-700/50">
                    <CardHeader>
                        <CardTitle className="text-xl text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-green-400" />
                            Attendee Check-ins
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            {checkins.length === 0
                                ? "No check-ins yet. Share your event code to get started!"
                                : `Showing ${checkins.length} check-in${checkins.length === 1 ? "" : "s"}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {checkins.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                <p className="text-lg">Waiting for attendees to check in...</p>
                                <p className="text-sm mt-2">
                                    Share your event code <span className="text-green-400 font-bold">{event.accessCode}</span> with attendees
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-gray-700">
                                            <TableHead className="text-gray-300">Attendee</TableHead>
                                            <TableHead className="text-gray-300">
                                                <Clock className="w-4 h-4 inline-block mr-1" />
                                                Time
                                            </TableHead>
                                            <TableHead className="text-gray-300">Method</TableHead>
                                            <TableHead className="text-gray-300 text-right">Credits</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {checkins.map((checkin) => (
                                            <TableRow key={checkin.id} className="border-gray-700 hover:bg-white/5">
                                                <TableCell className="font-medium text-white">
                                                    {checkin.displayName}
                                                </TableCell>
                                                <TableCell className="text-gray-300">
                                                    {formatTime(checkin.checkedInAt)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            checkin.checkinMethod === "CODE_ENTRY"
                                                                ? "border-blue-500/50 text-blue-400"
                                                                : checkin.checkinMethod === "GEO_CHECKIN"
                                                                    ? "border-purple-500/50 text-purple-400"
                                                                    : "border-green-500/50 text-green-400"
                                                        }
                                                    >
                                                        {getMethodLabel(checkin.checkinMethod)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="text-green-400 font-bold">+{checkin.creditsEarned}</span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
