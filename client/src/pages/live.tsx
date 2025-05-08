import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_ROUTES } from "@/lib/constants";
import { Livestream, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Expand, Share, Send } from "lucide-react";
import ChatMessage from "@/components/community/ChatMessage";
import { useChat } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MultiPlatformPlayer from "@/components/stream/MultiPlatformPlayer";

const Live = () => {
  const [chatMessage, setChatMessage] = useState("");
  const { toast } = useToast();
  
  // Get current user from localStorage
  const userString = localStorage.getItem("user");
  const currentUser: User | null = userString ? JSON.parse(userString) : null;
  
  // Get current livestream
  const { data: currentLivestream, isLoading: liveLoading } = useQuery<Livestream>({
    queryKey: [API_ROUTES.LIVESTREAMS_CURRENT],
  });
  
  // Get upcoming livestreams
  const { data: upcomingLivestreams, isLoading: upcomingLoading } = useQuery<Livestream[]>({
    queryKey: [API_ROUTES.LIVESTREAMS_UPCOMING],
  });
  
  // Chat functionality using the custom hook
  const { messages, isConnected, sendMessage } = useChat({
    user: currentUser,
    livestreamId: currentLivestream?.id,
  });
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatMessage.trim() || !isConnected) {
      return;
    }
    
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to chat",
        variant: "destructive",
      });
      return;
    }
    
    const success = sendMessage(chatMessage.trim());
    if (success) {
      setChatMessage("");
    }
  };
  
  const handleShareStream = () => {
    // In a real app, this would open a sharing dialog
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Stream link copied to clipboard"
    });
  };
  
  const handleFullscreen = () => {
    // In a real app, this would expand the video player
    toast({
      title: "Fullscreen",
      description: "Fullscreen mode not available in this preview"
    });
  };
  
  const handleRemind = (livestreamId: number) => {
    toast({
      title: "Reminder Set",
      description: "We'll notify you when this stream starts"
    });
  };
  
  return (
    <div>
      {/* Current Live Stream */}
      <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg mb-6">
        {liveLoading ? (
          <Skeleton className="w-full h-56" />
        ) : currentLivestream ? (
          <div className="relative">
            {/* Multi-platform video player */}
            <div className="relative">
              <MultiPlatformPlayer livestream={currentLivestream} />
              
              <div className="bg-gradient-to-t from-black to-transparent p-4 relative -mt-16">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-white text-xl font-bold">{currentLivestream.title}</h3>
                    <p className="text-sm text-gray-200">
                      {currentLivestream.hostName} • {currentLivestream.viewerCount || 156} watching
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="bg-primary text-white p-2 rounded-full hover:bg-red-800 transition"
                      onClick={handleShareStream}
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="bg-white text-primary p-2 rounded-full hover:bg-gray-200 transition"
                      onClick={handleFullscreen}
                    >
                      <Expand className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Live Chat */}
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-3">Live Chat</h3>
              <div className="h-32 overflow-y-auto bg-gray-800 rounded-lg p-3 mb-3">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <ChatMessage 
                      key={message.id} 
                      message={message} 
                      isCurrentUser={message.userId === currentUser?.id}
                    />
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <p>No messages yet. Be the first to chat!</p>
                  </div>
                )}
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input 
                  type="text" 
                  placeholder="Send a message..." 
                  className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  disabled={!isConnected || !currentUser}
                />
                <Button
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-800 transition"
                  disabled={!isConnected || !chatMessage.trim() || !currentUser}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 h-56 flex items-center justify-center">
            <div className="text-center p-6">
              <p className="text-2xl font-bold mb-2">No Live Streams Right Now</p>
              <p className="text-gray-400 mb-4">Check back later or watch our upcoming streams</p>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Livestreams */}
      <section>
        <h2 className="text-2xl font-heading mb-4">Upcoming Live Events</h2>
        
        <div className="space-y-4">
          {upcomingLoading ? (
            <>
              <Skeleton className="w-full h-20" />
              <Skeleton className="w-full h-20" />
              <Skeleton className="w-full h-20" />
            </>
          ) : upcomingLivestreams && upcomingLivestreams.length > 0 ? (
            upcomingLivestreams.map((livestream) => (
              <div key={livestream.id} className="bg-gray-900 rounded-xl overflow-hidden shadow-lg flex">
                <img 
                  src={livestream.thumbnailUrl} 
                  alt={livestream.title} 
                  className="w-24 h-24 object-cover"
                />
                <div className="p-3 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{livestream.title}</h3>
                      <p className="text-xs text-gray-400">
                        {new Date(livestream.streamDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full hover:bg-gray-700 transition"
                      onClick={() => handleRemind(livestream.id)}
                    >
                      Remind Me
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No upcoming livestreams scheduled.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Live;
