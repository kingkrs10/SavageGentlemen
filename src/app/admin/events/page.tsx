"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Eye, Ticket, RefreshCcw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Event {
    id: number;
    title: string;
    date: string;
    location: string;
    price: number | null;
    category?: string;
    featured?: boolean;
}

export default function AdminEventsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: events, isLoading, error, refetch, isRefetching } = useQuery<Event[]>({
        queryKey: ["/api/events"],
        queryFn: () => apiRequest("GET", "/api/events").then(res => res.json()),
        retry: 2, // Retry twice before showing error
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/events/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/events"] });
            toast({ title: "Event deleted", description: "The event has been permanently removed." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete event.", variant: "destructive" });
        }
    });

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this event?")) {
            deleteMutation.mutate(id);
        }
    };

    const formatPrice = (event: Event) => {
        if (event.price === null || event.price === undefined) return "Free";
        if (event.price === 0) return "Free";
        return `$${event.price}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-heading text-white tracking-wide uppercase">Events</h1>
                    <p className="text-gray-400">Manage your upcoming and past events.</p>
                </div>
                <Link href="/admin/events/new">
                    <Button className="bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Event
                    </Button>
                </Link>
            </div>

            {/* Error State with Retry */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
                    <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
                    <h3 className="text-white font-semibold mb-1">Error Loading Events</h3>
                    <p className="text-white/50 text-sm mb-4">
                        {(error as Error)?.message || "Something went wrong while fetching events."}
                    </p>
                    <Button
                        onClick={() => refetch()}
                        disabled={isRefetching}
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                        <RefreshCcw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
                        {isRefetching ? "Retrying..." : "Retry"}
                    </Button>
                </div>
            )}

            {!error && (
                <div className="bg-gray-900 border border-white/10 rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-black/40">
                            <TableRow className="border-white/10 hover:bg-transparent">
                                <TableHead className="text-white/60 uppercase text-xs tracking-wider">ID</TableHead>
                                <TableHead className="text-white/60 uppercase text-xs tracking-wider">Title</TableHead>
                                <TableHead className="text-white/60 uppercase text-xs tracking-wider">Date</TableHead>
                                <TableHead className="text-white/60 uppercase text-xs tracking-wider">Location</TableHead>
                                <TableHead className="text-white/60 uppercase text-xs tracking-wider">Price</TableHead>
                                <TableHead className="text-white/60 uppercase text-xs tracking-wider">Status</TableHead>
                                <TableHead className="text-right text-white/60 uppercase text-xs tracking-wider">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <>
                                    {[1, 2, 3].map((i) => (
                                        <TableRow key={i} className="border-white/10">
                                            <TableCell colSpan={7} className="py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-4 bg-white/5 rounded w-8 animate-pulse" />
                                                    <div className="h-4 bg-white/5 rounded w-40 animate-pulse" />
                                                    <div className="h-4 bg-white/5 rounded w-24 animate-pulse" />
                                                    <div className="h-4 bg-white/5 rounded w-28 animate-pulse" />
                                                    <div className="h-4 bg-white/5 rounded w-14 animate-pulse" />
                                                    <div className="h-4 bg-white/5 rounded w-16 animate-pulse" />
                                                    <div className="flex-1" />
                                                    <div className="flex gap-1">
                                                        <div className="h-8 w-8 bg-white/5 rounded animate-pulse" />
                                                        <div className="h-8 w-8 bg-white/5 rounded animate-pulse" />
                                                        <div className="h-8 w-8 bg-white/5 rounded animate-pulse" />
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </>
                            ) : events?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-16">
                                        <Ticket className="h-10 w-10 text-white/10 mx-auto mb-3" />
                                        <p className="text-white/40 font-medium mb-1">No events found</p>
                                        <p className="text-white/25 text-sm mb-4">Create your first event to get started.</p>
                                        <Link href="/admin/events/new">
                                            <Button size="sm" className="bg-primary/80 text-white hover:bg-primary">
                                                <Plus className="h-3.5 w-3.5 mr-1" /> Create Event
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                events?.map((event) => {
                                    const isPast = new Date(event.date) < new Date();
                                    return (
                                        <TableRow key={event.id} className="border-white/10 hover:bg-white/5 transition-colors">
                                            <TableCell className="font-mono text-white/40">#{event.id}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-medium">{event.title}</span>
                                                    {event.featured && (
                                                        <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                                            Featured
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-white/70">
                                                {format(new Date(event.date), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell className="text-white/70 truncate max-w-[150px]">{event.location}</TableCell>
                                            <TableCell>
                                                <span className="text-white/70 font-mono text-sm">
                                                    {formatPrice(event)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${isPast ? "bg-gray-800 text-gray-400" : "bg-green-500/20 text-green-500"
                                                    }`}>
                                                    {isPast ? "Past" : "Upcoming"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right space-x-1">
                                                <Link href={`/events`} target="_blank">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/admin/events/${event.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                    onClick={() => handleDelete(event.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
