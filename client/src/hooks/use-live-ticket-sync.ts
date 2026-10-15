import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import { API_ROUTES } from "@/lib/constants";

interface UseLiveTicketSyncOptions {
  eventId?: number | null;
  onTicketUpdate?: (data: any) => void;
  enabled?: boolean;
}

export function useLiveTicketSync({
  eventId,
  onTicketUpdate,
  enabled = true,
}: UseLiveTicketSyncOptions = {}) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let isCleanedUp = false;

    const connect = () => {
      if (isCleanedUp) return;

      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          // Connected to live ticketing websocket
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "ticket-inventory-update") {
              // If eventId is specified and matches, or if global
              const matchesEvent = !eventId || !data.eventId || Number(data.eventId) === Number(eventId);
              if (matchesEvent) {
                const targetId = data.eventId || eventId;
                if (targetId) {
                  queryClient.invalidateQueries({ queryKey: [API_ROUTES.EVENTS, Number(targetId)] });
                  queryClient.invalidateQueries({ queryKey: [API_ROUTES.EVENTS, String(targetId)] });
                }
                queryClient.invalidateQueries({ queryKey: [API_ROUTES.EVENTS] });
                queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
                if (targetId) {
                  queryClient.invalidateQueries({ queryKey: [`/api/admin/tickets/event/${targetId}`] });
                }

                if (onTicketUpdate) {
                  onTicketUpdate(data);
                }
              }
            }
          } catch {
            // Ignore parse errors
          }
        };

        socket.onclose = () => {
          if (!isCleanedUp) {
            reconnectTimeout = setTimeout(connect, 5000);
          }
        };

        socket.onerror = () => {
          // Silent fallback to polling
        };
      } catch (err) {
        console.debug("Live ticket sync WebSocket not available, relying on polling:", err);
      }
    };

    connect();

    return () => {
      isCleanedUp = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {}
      }
    };
  }, [eventId, enabled, onTicketUpdate]);
}
