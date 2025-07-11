import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  VerifiedIcon,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BrandLoader from "@/components/ui/BrandLoader";

interface Review {
  id: number;
  rating: number;
  title?: string;
  review?: string;
  isVerifiedAttendee: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    displayName?: string;
    avatar?: string;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

interface EventReviewsProps {
  eventId: number;
  eventTitle: string;
}

const EventReviews = ({ eventId, eventTitle }: EventReviewsProps) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: "",
    review: ""
  });
  const [hoveredRating, setHoveredRating] = useState(0);

  // Fetch reviews
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: [`/api/events/${eventId}/reviews`],
  });

  const reviews = reviewsData?.reviews || [];
  const stats = reviewsData?.stats || { averageRating: 0, totalReviews: 0 };

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      return await apiRequest("POST", `/api/events/${eventId}/reviews`, reviewData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/reviews`] });
      setNewReview({ rating: 0, title: "", review: "" });
      setShowReviewForm(false);
      toast({
        title: "Review submitted",
        description: "Your review has been posted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit review",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitReview = () => {
    if (newReview.rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    submitReviewMutation.mutate(newReview);
  };

  const renderStars = (rating: number, interactive = false, size = "w-5 h-5") => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`${size} cursor-${interactive ? 'pointer' : 'default'} ${
          i < (interactive ? (hoveredRating || newReview.rating) : rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
        onClick={interactive ? () => setNewReview({ ...newReview, rating: i + 1 }) : undefined}
        onMouseEnter={interactive ? () => setHoveredRating(i + 1) : undefined}
        onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
      />
    ));
  };

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <BrandLoader />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Reviews & Ratings
          </div>
          {currentUser && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReviewForm(!showReviewForm)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Write Review
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Rating Summary */}
        {stats.totalReviews > 0 && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {renderStars(Math.round(stats.averageRating))}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">
                  Based on {stats.totalReviews} verified reviews
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && currentUser && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Write a Review for {eventTitle}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Rating *</label>
                  <div className="flex items-center gap-1 mt-1">
                    {renderStars(0, true, "w-8 h-8")}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Review Title (Optional)</label>
                  <Input
                    placeholder="Summarize your experience..."
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Your Review (Optional)</label>
                  <Textarea
                    placeholder="Tell others about your experience at this event..."
                    value={newReview.review}
                    onChange={(e) => setNewReview({ ...newReview, review: e.target.value })}
                    className="mt-1"
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmitReview}
                    disabled={submitReviewMutation.isPending || newReview.rating === 0}
                  >
                    {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {reviews.length === 0 && !showReviewForm && (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share your experience at this event!
            </p>
            {currentUser ? (
              <Button
                onClick={() => setShowReviewForm(true)}
                className="mx-auto"
              >
                <Star className="h-4 w-4 mr-2" />
                Write the First Review
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sign in to write a review and share your experience
              </p>
            )}
          </div>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {displayedReviews.map((review: Review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.user.avatar} />
                    <AvatarFallback>
                      {(review.user.displayName || review.user.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {review.user.displayName || review.user.username}
                      </span>
                      {review.isVerifiedAttendee && (
                        <Badge variant="secondary" className="text-xs">
                          <VerifiedIcon className="h-3 w-3 mr-1" />
                          Verified Attendee
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mb-2">
                      {renderStars(review.rating, false, "w-4 h-4")}
                    </div>

                    {review.title && (
                      <h4 className="font-medium mb-2">{review.title}</h4>
                    )}

                    {review.review && (
                      <p className="text-sm text-muted-foreground mb-3">{review.review}</p>
                    )}

                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Helpful ({review.helpful})
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {reviews.length > 3 && (
              <Button
                variant="outline"
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="w-full"
              >
                {showAllReviews ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show All {reviews.length} Reviews
                  </>
                )}
              </Button>
            )}
          </div>
        ) : null}

        {/* Login prompt for non-authenticated users */}
        {!currentUser && (
          <div className="mt-4 p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Sign in to write a review and share your experience
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventReviews;