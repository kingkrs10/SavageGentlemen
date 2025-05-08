import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Heart, MessageSquare, Share } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatTimeAgo } from "@/lib/utils";
import { Post, User, Comment as CommentType } from "@/lib/types";

interface PostCardProps {
  post: Post;
  currentUser: User | null;
}

interface Comment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    displayName: string;
    avatar: string;
  };
}

const PostCard = ({ post, currentUser }: PostCardProps) => {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['/api/posts/' + post.id + '/comments'],
    enabled: showComments,
  });
  
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentUser) throw new Error("You must be logged in to comment");
      
      const res = await apiRequest("POST", "/api/comments", {
        postId: post.id,
        userId: currentUser.id,
        content
      });
      return res.json();
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ['/api/posts/' + post.id + '/comments'] });
    },
  });
  
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() && !commentMutation.isPending) {
      commentMutation.mutate(commentText);
    }
  };
  
  const toggleComments = () => {
    setShowComments(!showComments);
  };
  
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg p-4">
      <div className="flex items-center mb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={post.user?.avatar} alt={post.user?.displayName} />
          <AvatarFallback>{post.user?.displayName?.charAt(0) || '?'}</AvatarFallback>
        </Avatar>
        <div className="ml-3">
          <p className="font-semibold">{post.user?.displayName || 'Anonymous'}</p>
          <p className="text-xs text-gray-400">{formatTimeAgo(post.createdAt)}</p>
        </div>
      </div>
      
      <p className="mb-3">{post.content}</p>
      
      {post.mediaUrl && (
        <img 
          src={post.mediaUrl} 
          alt="Post media" 
          className="w-full h-64 object-cover rounded-lg mb-3" 
        />
      )}
      
      <div className="flex justify-between">
        <div className="flex space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center text-sm text-gray-300 hover:text-primary"
          >
            <Heart className="w-4 h-4 mr-1" />
            <span>{post.likes}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center text-sm text-gray-300 hover:text-primary"
            onClick={toggleComments}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            <span>{post.comments}</span>
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          className="flex items-center text-sm text-gray-300 hover:text-primary"
        >
          <Share className="w-4 h-4 mr-1" />
          <span>Share</span>
        </Button>
      </div>
      
      {showComments && (
        <div className="mt-4 pt-3 border-t border-gray-800">
          <h4 className="text-sm font-semibold mb-2">Comments</h4>
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.user?.avatar} alt={comment.user?.displayName} />
                  <AvatarFallback>{comment.user?.displayName?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="bg-gray-800 rounded-lg p-2 flex-1">
                  <p className="text-xs font-semibold">{comment.user?.displayName || 'Anonymous'}</p>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
          
          {currentUser && (
            <form onSubmit={handleSubmitComment} className="flex items-center mt-3 gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
                <AvatarFallback>{currentUser?.displayName?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <Input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon"
                className="text-primary hover:text-red-400"
                disabled={commentMutation.isPending || !commentText.trim()}
              >
                <Share className="w-4 h-4 rotate-90" />
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
