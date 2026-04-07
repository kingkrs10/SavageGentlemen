"use client";

import { EventForm } from "@/components/admin/EventForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function EditEventPage({ params }: { params: { id: string } }) {
    const eventId = params.id;

    const { data: event, isLoading, error } = useQuery({
        queryKey: [`/api/events/${eventId}`],
        queryFn: () => apiRequest("GET", `/api/events/${eventId}`).then(res => res.json())
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="text-center py-20">
                <h1 className="text-2xl text-white font-bold mb-4">Event Not Found</h1>
                <Link href="/admin/events">
                    <Button variant="outline">Back to Events</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/events">
                    <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-heading text-white tracking-wide uppercase">Edit Event</h1>
                    <p className="text-gray-400">Update event details.</p>
                </div>
            </div>

            <EventForm initialData={event} isEditing />
        </div>
    );
}
