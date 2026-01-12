import { getAllEvents } from "@/lib/api";
import EventCard from "@/components/home/EventCard";

export default async function EventsPage() {
    const events = await getAllEvents();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-heading uppercase tracking-wide mb-8 text-center text-white">All Events</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.length > 0 ? (
                    events.map((event) => (
                        <div key={event.id}>
                            <EventCard event={event} />
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-20 text-gray-400">
                        <p className="text-xl">No events found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
