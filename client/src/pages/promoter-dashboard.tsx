import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Calendar, MapPin, Trophy, ArrowLeft, Clock, Activity } from "lucide-react";
import { Helmet } from "react-helmet";

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
    };
    checkins: CheckinData[];
}

export default function PromoterDashboard() {
    const { code } = useParams<{ code: string }>();
    const [, setLocation] = useLocation();

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
