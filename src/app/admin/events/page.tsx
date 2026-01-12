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
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Event {
    id: number;
    title: string;
    date: string;
    location: string;
    price: number | null;
}

export default function AdminEventsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: events, isLoading } = useQuery<Event[]>({
        queryKey: ["/api/events"],
        queryFn: () => apiRequest("GET", "/api/events").then(res => res.json())
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

            <div className="bg-gray-900 border border-white/10 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-black/40">
                        <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">ID</TableHead>
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">Title</TableHead>
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">Date</TableHead>
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">Location</TableHead>
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">Status</TableHead>
                            <TableHead className="text-right text-white/60 uppercase text-xs tracking-wider">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-white/40">Loading events...</TableCell>
                            </TableRow>
                        ) : events?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-white/40">No events found.</TableCell>
                            </TableRow>
                        ) : (
                            events?.map((event) => {
                                const isPast = new Date(event.date) < new Date();
                                return (
                                    <TableRow key={event.id} className="border-white/10 hover:bg-white/5 transition-colors">
                                        <TableCell className="font-mono text-white/40">#{event.id}</TableCell>
                                        <TableCell className="text-white font-medium">{event.title}</TableCell>
                                        <TableCell className="text-white/70">
                                            {format(new Date(event.date), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-white/70 truncate max-w-[150px]">{event.location}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${isPast ? "bg-gray-800 text-gray-400" : "bg-green-500/20 text-green-500"
                                                }`}>
                                                {isPast ? "Past" : "Upcoming"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {/* Preview Link */}
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
        </div>
    );
}
