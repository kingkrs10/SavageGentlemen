import type { Event as BaseEvent, Ticket } from "@shared/schema";

// Extend the Event type to include tickets
export interface EventWithTickets extends BaseEvent {
  tickets?: Ticket[];
}

// Re-export all types from the shared schema for convenience
export * from "@shared/schema";
export type Event = EventWithTickets;