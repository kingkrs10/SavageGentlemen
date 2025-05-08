import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { API_ROUTES } from "@/lib/constants";
import { Camera, Image, Video, BarChart4, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import PostCard from "@/components/community/PostCard";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Post, User } from "@/lib/types";

const Community = () => {
  const [postContent, setPostContent] = useState("");
  const { toast } = useToast();
  
  // Get current user from localStorage
  const userString = localStorage.getItem("user");
  const currentUser: User | null = userString ? JSON.parse(userString) : null;
  
  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: [API_ROUTES.POSTS],
  });
  
  const postMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentUser) throw new Error("You must be logged in to post");
      
      const res = await apiRequest("POST", API_ROUTES.POSTS, {
        userId: currentUser.id,
        content
      });
      return res.json();
    },
    onSuccess: () => {
      setPostContent("");
      queryClient.invalidateQueries({ queryKey: [API_ROUTES.POSTS] });
      toast({
        title: "Post Created",
        description: "Your post has been shared with the community"
      });
    },
    onError: (error) => {
      toast({
        title: "Post Failed",
        description: error instanceof Error ? error.message : "Failed to create post",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!postContent.trim() || postMutation.isPending) {
      return;
    }
    
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to post",
        variant: "destructive",
      });
      return;
    }
    
    postMutation.mutate(postContent);
  };
  
  const handleMedia = (type: string) => {
    toast({
      title: "Feature Coming Soon",
      description: `The ${type} upload feature will be available soon`
    });
  };
  
  return (
    <div>
      {/* Create Post */}
      <div className="mb-6">
        <Card className="bg-gray-900">
          <CardContent className="p-4">
            <div className="flex gap-3 items-center">
              <Avatar className="w-10 h-10">
                {currentUser?.avatar ? (
                  <AvatarImage src={currentUser.avatar} alt={currentUser.displayName} />
                ) : (
                  <AvatarFallback>{currentUser?.displayName?.charAt(0) || "G"}</AvatarFallback>
                )}
              </Avatar>
              <form className="flex-1" onSubmit={handleSubmitPost}>
                <Textarea
                  placeholder={currentUser ? "Share your carnival vibes..." : "Login to share your thoughts..."}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  disabled={!currentUser || postMutation.isPending}
                />
                <div className="flex justify-between mt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex items-center text-sm text-gray-300 hover:text-primary"
                    onClick={() => handleMedia("photo")}
                  >
                    <Image className="w-4 h-4 mr-1" /> Photo
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex items-center text-sm text-gray-300 hover:text-primary"
                    onClick={() => handleMedia("video")}
                  >
                    <Video className="w-4 h-4 mr-1" /> Video
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex items-center text-sm text-gray-300 hover:text-primary"
                    onClick={() => handleMedia("poll")}
                  >
                    <BarChart4 className="w-4 h-4 mr-1" /> Poll
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex items-center text-sm text-gray-300 hover:text-primary"
                    onClick={() => handleMedia("location")}
                  >
                    <MapPin className="w-4 h-4 mr-1" /> Check In
                  </Button>
                </div>
                {postContent.trim() && (
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="submit"
                      className="bg-primary text-white hover:bg-red-800"
                      disabled={postMutation.isPending}
                    >
                      {postMutation.isPending ? "Posting..." : "Post"}
                    </Button>
                  </div>
                )}
              </form>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="bg-primary text-white p-2 rounded-full hover:bg-red-800 transition"
                onClick={() => handleMedia("camera")}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Community Feed */}
      <div className="space-y-6">
        {isLoading ? (
          <>
            <Skeleton className="w-full h-[300px] rounded-xl" />
            <Skeleton className="w-full h-[300px] rounded-xl" />
          </>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} currentUser={currentUser} />
          ))
        ) : (
          <div className="text-center py-12 bg-gray-900 rounded-xl">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
            <p className="text-gray-400 mb-4">
              Be the first to share your Savage Gentlemen experience!
            </p>
            {!currentUser && (
              <Button 
                onClick={() => toast({
                  title: "Login Required",
                  description: "Please login to create posts",
                })}
              >
                Login to Post
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;
