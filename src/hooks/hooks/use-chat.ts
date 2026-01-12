import { useState, useEffect, useCallback, useRef } from "react";
import { User, ChatMessage } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface UseChatOptions {
  user: User | null;
  livestreamId?: number;
}

export const useChat = ({ user, livestreamId }: UseChatOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
    };

    socket.onclose = () => {
      setIsConnected(false);
      setTimeout(() => {
        setIsConnecting(true);
      }, 5000); // Try to reconnect after 5 seconds
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Connection Error",
        description: "Could not connect to chat server. Please try again later.",
        variant: "destructive",
      });
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chat-message") {
          setMessages((prev) => [...prev, data.message]);
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [toast]);

  // Send message function
  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        toast({
          title: "Connection Error",
          description: "Not connected to chat server. Please try again later.",
          variant: "destructive",
        });
        return false;
      }

      if (!user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to send messages.",
          variant: "destructive",
        });
        return false;
      }

      try {
        socketRef.current.send(
          JSON.stringify({
            type: "chat-message",
            userId: user.id,
            livestreamId,
            content,
          })
        );
        return true;
      } catch (err) {
        console.error("Error sending message:", err);
        toast({
          title: "Message Failed",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, livestreamId, toast]
  );

  return {
    messages,
    isConnecting,
    isConnected,
    sendMessage,
  };
};
