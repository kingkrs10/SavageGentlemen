import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode, MapPin, Ticket, Check, Loader2, Navigation, PartyPopper } from "lucide-react";

interface ActiveEvent {
    id: number;
    title: string;
    date: string;
    location: string;
    imageUrl?: string;
    stampPoints: number;
    isPremium: boolean;
    hasVenueCoordinates: boolean;
    alreadyCheckedIn: boolean;
}

interface CheckInResult {
    success: boolean;
    message: string;
    pointsAwarded?: number;
    newTotal?: number;
    currentTier?: string;
    stamp?: any;
    event?: {
        title: string;
        date: string;
        location: string;
    };
}

export function EventCheckIn() {
    const { toast } = useToast();
    const [eventCode, setEventCode] = useState("");
    const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
    const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<ActiveEvent | null>(null);
    const [checkInSuccess, setCheckInSuccess] = useState<CheckInResult | null>(null);

    // Fetch active events for geo check-in
    const { data: activeEventsData, refetch: refetchEvents } = useQuery({
        queryKey: ['/api/passport/active-events'],
    });

    const activeEvents: ActiveEvent[] = activeEventsData?.events || [];

    // Code check-in mutation
    const codeCheckInMutation = useMutation({
        mutationFn: async (code: string) => {
            const res = await apiRequest("POST", "/api/passport/checkin/code", { code });
            return res.json();
        },
        onSuccess: (data: CheckInResult) => {
            if (data.success) {
                setCheckInSuccess(data);
                setEventCode("");
                refetchEvents();
                toast({
                    title: "🎉 Checked In!",
                    description: `+${data.pointsAwarded} points earned at ${data.event?.title}`,
                });
            }
        },
        onError: (error: Error) => {
            toast({
                title: "Check-in Failed",
                description: error.message || "Invalid or expired event code",
                variant: "destructive",
            });
        },
    });

    // Location check-in mutation
    const locationCheckInMutation = useMutation({
        mutationFn: async ({ eventId, latitude, longitude }: { eventId: number; latitude: number; longitude: number }) => {
            const res = await apiRequest("POST", "/api/passport/checkin/location", { eventId, latitude, longitude });
            return res.json();
        },
        onSuccess: (data: CheckInResult) => {
            if (data.success) {
                setCheckInSuccess(data);
                setSelectedEvent(null);
                setIsLocationDialogOpen(false);
                refetchEvents();
                toast({
                    title: "📍 Location Verified!",
                    description: `+${data.pointsAwarded} points earned at ${data.event?.title}`,
                });
            }
        },
        onError: (error: Error) => {
            toast({
                title: "Location Check-in Failed",
                description: error.message || "Could not verify your location",
                variant: "destructive",
            });
        },
    });

    const handleCodeSubmit = () => {
        if (eventCode.trim()) {
            codeCheckInMutation.mutate(eventCode.trim());
        }
    };

    const handleLocationCheckIn = (event: ActiveEvent) => {
        setSelectedEvent(event);

        if (!navigator.geolocation) {
            toast({
                title: "Geolocation Not Supported",
                description: "Your browser doesn't support location services",
                variant: "destructive",
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                locationCheckInMutation.mutate({
                    eventId: event.id,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                toast({
                    title: "Location Access Denied",
                    description: "Please enable location services to check in",
                    variant: "destructive",
                });
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Success state
    if (checkInSuccess) {
        return (
            <Card className="bg-black/60 backdrop-blur-2xl border-2 border-green-500/50 shadow-2xl shadow-green-500/30">
                <CardContent className="pt-8 pb-8 text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 blur-2xl opacity-30 animate-pulse" />
                        <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-full w-fit mx-auto shadow-lg shadow-green-500/50">
                            <PartyPopper className="h-12 w-12 text-white" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-3xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            Check-In Complete!
                        </h3>
                        <p className="text-gray-300 text-lg">{checkInSuccess.event?.title}</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-green-500/20">
                        <p className="text-5xl font-black text-green-400">+{checkInSuccess.pointsAwarded}</p>
                        <p className="text-gray-400 text-sm mt-1">points earned</p>
                    </div>

                    <div className="flex justify-center gap-4 text-sm">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{checkInSuccess.newTotal}</p>
                            <p className="text-gray-400">Total Points</p>
                        </div>
                        <div className="w-px bg-white/10" />
                        <div className="text-center">
                            <p className="text-2xl font-bold text-cyan-400">{checkInSuccess.currentTier}</p>
                            <p className="text-gray-400">Current Tier</p>
                        </div>
                    </div>

                    <Button
                        onClick={() => setCheckInSuccess(null)}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold"
                    >
                        Check In to Another Event
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Code Entry Card */}
            <Card className="bg-black/60 backdrop-blur-2xl border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/30">
                <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-4 rounded-2xl shadow-lg shadow-cyan-500/50">
                            <Ticket className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        Enter Event Code
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                        Enter the code displayed at the event to claim your stamp
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-3">
                        <Input
                            placeholder="e.g. CARNIVAL2026"
                            value={eventCode}
                            onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                            className="bg-white/5 border-gray-600 text-white placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/50 text-lg uppercase"
                            disabled={codeCheckInMutation.isPending}
                        />
                        <Button
                            onClick={handleCodeSubmit}
                            disabled={!eventCode.trim() || codeCheckInMutation.isPending}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-6 shadow-lg shadow-cyan-500/30"
                        >
                            {codeCheckInMutation.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-5 h-5 mr-2" />
                                    Check In
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Location Check-In Card */}
            {activeEvents.length > 0 && (
                <Card className="bg-black/60 backdrop-blur-2xl border-2 border-purple-500/50 shadow-2xl shadow-purple-500/30">
                    <CardHeader className="text-center pb-4">
                        <div className="flex justify-center mb-4">
                            <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-2xl shadow-lg shadow-purple-500/50">
                                <MapPin className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Check In at Venue
                        </CardTitle>
                        <CardDescription className="text-gray-300">
                            Use your location to check in at an active event
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {activeEvents.map((event) => (
                            <div
                                key={event.id}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${event.alreadyCheckedIn
                                        ? "bg-green-500/10 border-green-500/30"
                                        : "bg-white/5 border-white/10 hover:border-purple-500/50"
                                    }`}
                            >
                                <div className="flex-1">
                                    <h4 className="font-bold text-white">{event.title}</h4>
                                    <p className="text-sm text-gray-400">{event.location}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                                            +{event.stampPoints} pts
                                        </span>
                                        {event.isPremium && (
                                            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">
                                                Premium
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {event.alreadyCheckedIn ? (
                                    <div className="flex items-center gap-2 text-green-400">
                                        <Check className="w-5 h-5" />
                                        <span className="text-sm font-medium">Checked In</span>
                                    </div>
                                ) : event.hasVenueCoordinates ? (
                                    <Button
                                        onClick={() => handleLocationCheckIn(event)}
                                        disabled={locationCheckInMutation.isPending && selectedEvent?.id === event.id}
                                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/30"
                                        size="sm"
                                    >
                                        {locationCheckInMutation.isPending && selectedEvent?.id === event.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Navigation className="w-4 h-4 mr-2" />
                                                Check In
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <span className="text-xs text-gray-500">Use code entry</span>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* No active events message */}
            {activeEvents.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No events currently active for location check-in.</p>
                    <p className="text-sm mt-1">Use the code entry above to check in.</p>
                </div>
            )}
        </div>
    );
}
