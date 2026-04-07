"use client";

import { EventForm } from "@/components/admin/EventForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewEventPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/events">
                    <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-heading text-white tracking-wide uppercase">Create Event</h1>
                    <p className="text-gray-400">Add a new event to the calendar.</p>
                </div>
            </div>

            <EventForm />
        </div>
    );
}
