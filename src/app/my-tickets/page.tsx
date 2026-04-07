"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import TicketQRCode from "@/components/TicketQRCode";
import { Loader2, Calendar, MapPin, Download, Ticket as TicketIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { saveAs } from "file-saver";

interface TicketPurchase {
    id: number;
    userId: number;
    ticketId: number;
    eventId: number;
    orderId: number;
    purchaseDate: string;
    status: string;
    qrCodeData: string;
    ticketType: string;
    price: number;
    attendeeEmail?: string;
    attendeeName?: string;
    scanned: boolean;
    firstScanAt?: string;
    lastScanAt?: string;
    scanCount: number;
    event?: {
        title: string;
        date: string;
        location: string;
    };
}

export default function MyTicketsPage() {
    const { user, isAuthenticated, isLoading: userLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [selectedTicket, setSelectedTicket] = useState<TicketPurchase | null>(null);

    useEffect(() => {
        if (!userLoading && !user) {
            router.push("/login?redirect=/my-tickets");
        }
    }, [user, userLoading, router]);

    const {
        data: ticketsData,
        isLoading: ticketsLoading,
        error
    } = useQuery<{ tickets: TicketPurchase[] }>({
        queryKey: ["/api/user/tickets"],
        enabled: !!user,
    });
    const tickets = ticketsData?.tickets || [];

    if (userLoading) {
        return (
            <div className="container mx-auto flex flex-col items-center justify-center min-h-[50vh] text-white">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg uppercase tracking-widest">Loading account...</p>
            </div>
        );
    }

    if (!user) return null;

    if (ticketsLoading) {
        return (
            <div className="container mx-auto flex flex-col items-center justify-center min-h-[50vh] text-white">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg uppercase tracking-widest">Finding your tickets...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-20 text-center text-white">
                <h1 className="text-3xl font-heading uppercase mb-6">Oops!</h1>
                <p className="text-white/60 mb-8">Error loading tickets. Please try again later.</p>
                <Link href="/">
                    <Button className="btn-modern gradient-primary text-white border-0">Go Back Home</Button>
                </Link>
            </div>
        );
    }

    const upcomingTickets = tickets.filter(
        ticket =>
            ticket.status === "valid" &&
            new Date(ticket.event?.date as string) >= new Date()
    );

    const pastTickets = tickets.filter(
        ticket =>
            new Date(ticket.event?.date as string) < new Date()
    );

    const handleAddToCalendar = (ticket: TicketPurchase) => {
        if (!ticket.event) {
            toast({
                title: "Error",
                description: "Event details not available",
                variant: "destructive"
            });
            return;
        }

        const eventDate = new Date(ticket.event.date);
        const year = eventDate.getFullYear();
        const month = eventDate.getMonth() + 1;
        const day = eventDate.getDate();
        const hours = eventDate.getHours();
        const minutes = eventDate.getMinutes();

        import('ics').then(icsModule => {
            const event: any = {
                start: [year, month, day, hours, minutes],
                duration: { hours: 3 },
                title: ticket.event!.title,
                description: `Your ${ticket.ticketType} ticket for ${ticket.event!.title}`,
                location: ticket.event!.location,
                status: 'CONFIRMED',
                busyStatus: 'BUSY',
            };

            icsModule.createEvent(event, (error: any, value: any) => {
                if (error) {
                    toast({
                        title: "Error",
                        description: "Failed to create calendar event",
                        variant: "destructive"
                    });
                    return;
                }

                const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
                saveAs(blob, `${ticket.event?.title.replace(/\s+/g, '-').toLowerCase()}.ics`);

                toast({
                    title: "Success!",
                    description: "Event saved to your calendar",
                });
            });
        }).catch(error => {
            console.error("Error importing ics library:", error);
            toast({
                title: "Error",
                description: "Failed to load calendar module",
                variant: "destructive"
            });
        });
    };

    const cn = (...args: any[]) => args.filter(Boolean).join(" ");

    const renderTicket = (ticket: TicketPurchase) => {
        const eventDate = ticket.event?.date ? new Date(ticket.event.date) : null;

        return (
            <Card key={ticket.id} className="mb-6 overflow-hidden bg-gray-900 border-white/10 group">
                <CardHeader className="pb-2 relative">
                    <div className="absolute top-4 right-4">
                        <Badge
                            className={cn(
                                "border-0 text-[10px] tracking-widest",
                                ticket.status === "valid" ? "bg-primary text-white" :
                                    ticket.status === "used" ? "bg-white/10 text-white/40" :
                                        "bg-red-500 text-white"
                            )}
                        >
                            {ticket.status.toUpperCase()}
                            {ticket.scanned && " (SCANNED)"}
                        </Badge>
                    </div>
                    <CardTitle className="text-xl md:text-2xl text-white font-heading tracking-widest">{ticket.event?.title}</CardTitle>
                    <CardDescription className="text-white/40 uppercase text-xs tracking-tighter">
                        {ticket.ticketType} Ticket
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            {eventDate && (
                                <div className="flex items-center text-white/70">
                                    <Calendar className="h-5 w-5 mr-3 text-primary" />
                                    <p className="text-sm">{format(eventDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}</p>
                                </div>
                            )}
                            {ticket.event?.location && (
                                <div className="flex items-center text-white/70">
                                    <MapPin className="h-5 w-5 mr-3 text-primary" />
                                    <p className="text-sm">{ticket.event.location}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <p className="text-[10px] uppercase text-white/40 tracking-widest">Price</p>
                                    <p className="text-white font-bold">${(ticket.price / 100).toFixed(2)}</p>
                                </div>
                                {ticket.attendeeName && (
                                    <div>
                                        <p className="text-[10px] uppercase text-white/40 tracking-widest">Attendee</p>
                                        <p className="text-white font-bold truncate">{ticket.attendeeName}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] uppercase text-white/40 tracking-widest">Purchased</p>
                                    <p className="text-white/70 text-sm">{format(new Date(ticket.purchaseDate), "MMM d, yyyy")}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    className="bg-black/40 border-white/10 text-white hover:bg-white/5 uppercase text-[10px] tracking-widest px-4"
                                    onClick={() => handleAddToCalendar(ticket)}
                                >
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Calendar
                                </Button>
                                <Button
                                    variant="outline"
                                    className="bg-black/40 border-white/10 text-white hover:bg-white/5 uppercase text-[10px] tracking-widest px-4"
                                    onClick={() => setSelectedTicket(ticket)}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Full View
                                </Button>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center bg-black/40 p-6 border border-white/5">
                            <div className="bg-white p-3 rounded-none shadow-[0_0_15px_rgba(255,107,0,0.2)]">
                                <TicketQRCode
                                    data={ticket.qrCodeData}
                                    orderId={ticket.orderId.toString()}
                                    eventName={ticket.event?.title}
                                    ticketName={ticket.ticketType}
                                    holderName={user?.displayName || undefined}
                                />
                            </div>
                            <p className="text-[10px] mt-4 text-center text-white/30 uppercase tracking-[0.2em]">
                                Present for scanning at entrance
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="min-h-screen bg-black text-white px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-heading uppercase tracking-widest mb-12 text-center text-primary">My Tickets</h1>

                {tickets.length === 0 ? (
                    <div className="text-center py-20 bg-gray-900 border border-white/10 rounded-xl p-12">
                        <TicketIcon className="w-20 h-20 text-white/10 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold mb-4">No tickets yet</h2>
                        <p className="text-white/40 mb-10 max-w-md mx-auto">Explore upcoming events and secure your spot at the most exclusive carnival experiences.</p>
                        <Link href="/events">
                            <Button className="btn-modern gradient-primary text-white border-0 px-8 py-6 uppercase tracking-widest font-bold">
                                Browse Events
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <Tabs defaultValue="upcoming" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-gray-900 border border-white/10 p-1 mb-8">
                            <TabsTrigger value="upcoming" className="data-[state=active]:bg-primary data-[state=active]:text-white uppercase text-xs tracking-widest py-3">
                                Upcoming ({upcomingTickets.length})
                            </TabsTrigger>
                            <TabsTrigger value="past" className="data-[state=active]:bg-primary data-[state=active]:text-white uppercase text-xs tracking-widest py-3">
                                Past ({pastTickets.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="upcoming" className="mt-0">
                            {upcomingTickets.length === 0 ? (
                                <div className="text-center py-12 bg-black/40 border border-white/5 p-8">
                                    <p className="mb-6 text-white/40 uppercase tracking-widest text-sm">No upcoming experiences found</p>
                                    <Link href="/events">
                                        <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 uppercase text-xs tracking-widest py-6 px-8">
                                            Find Events
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {upcomingTickets.map(renderTicket)}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="past" className="mt-0">
                            {pastTickets.length === 0 ? (
                                <div className="text-center py-12 bg-black/40 border border-white/5 p-8">
                                    <p className="text-white/40 uppercase tracking-widest text-sm text-center">No past records</p>
                                </div>
                            ) : (
                                <div className="opacity-70 grayscale-[0.5] transition-all hover:grayscale-0">
                                    {pastTickets.map(renderTicket)}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}

                {selectedTicket && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                        <div className="bg-gray-900 border border-white/10 rounded-none max-w-md w-full p-8 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                            <h3 className="text-2xl font-heading text-primary uppercase tracking-widest mb-2">{selectedTicket.event?.title}</h3>
                            <p className="text-xs text-white/40 uppercase tracking-widest mb-8">{selectedTicket.attendeeName || "Attendee"}'s {selectedTicket.ticketType} Ticket</p>

                            <div className="mb-8 flex justify-center">
                                <div className="bg-white p-6 rounded-none shadow-[0_0_30px_rgba(255,107,0,0.3)]">
                                    <TicketQRCode
                                        data={selectedTicket.qrCodeData}
                                        orderId={selectedTicket.orderId.toString()}
                                        size={280}
                                    />
                                </div>
                            </div>

                            <div className="text-center mb-10 space-y-2">
                                <p className="text-white font-bold text-lg">{selectedTicket.event?.title}</p>
                                {selectedTicket.event?.date && (
                                    <p className="text-sm text-white/70">{format(new Date(selectedTicket.event.date), "EEEE, MMMM d, yyyy")}</p>
                                )}
                                <p className="text-sm text-white/50">{selectedTicket.event?.location}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    variant="outline"
                                    className="bg-black/40 border-white/10 text-white hover:bg-white/5 uppercase text-xs tracking-widest py-6"
                                    onClick={() => setSelectedTicket(null)}
                                >
                                    Close
                                </Button>
                                <Button
                                    className="btn-modern gradient-primary text-white border-0 py-6 uppercase text-xs tracking-widest font-bold"
                                    onClick={() => {
                                        const canvas = document.querySelector('canvas');
                                        if (canvas) {
                                            const image = canvas.toDataURL("image/png");
                                            const link = document.createElement('a');
                                            link.href = image;
                                            link.download = `${selectedTicket.event?.title.replace(/\s+/g, '-').toLowerCase()}-ticket.png`;
                                            link.click();
                                        }
                                    }}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
