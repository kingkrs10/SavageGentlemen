import type { Express } from "express";
import { Router } from "express";
import { db } from "./db";
import { 
  eventCheckins, 
  eventReviews, 
  eventPhotos, 
  userFollows,
  users,
  events,
  insertEventCheckinSchema,
  insertEventReviewSchema,
  insertEventPhotoSchema,
  insertUserFollowSchema
} from "@shared/schema";
import { eq, desc, and, sql, count } from "drizzle-orm";
import { authenticateUser } from "./auth-middleware";

export const socialRouter = Router();

export function registerSocialRoutes(app: Express) {
  
  // Event Check-ins
  app.post("/api/events/:eventId/checkin", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const eventId = parseInt(req.params.eventId);
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const validatedData = insertEventCheckinSchema.parse({
        userId,
        eventId,
        location: req.body.location,
        isPublic: req.body.isPublic ?? true,
      });

      // Check if user already checked in
      const existingCheckin = await db.select()
        .from(eventCheckins)
        .where(and(
          eq(eventCheckins.userId, userId),
          eq(eventCheckins.eventId, eventId)
        ))
        .limit(1);

      if (existingCheckin.length > 0) {
        return res.status(400).json({ message: "Already checked in to this event" });
      }

      const [checkin] = await db.insert(eventCheckins)
        .values(validatedData)
        .returning();

      res.status(201).json(checkin);
    } catch (error) {
      console.error("Error creating checkin:", error);
      res.status(500).json({ message: "Failed to check in" });
    }
  });

  // Get event check-ins
  app.get("/api/events/:eventId/checkins", async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      
      const checkins = await db.select({
        id: eventCheckins.id,
        checkedInAt: eventCheckins.checkedInAt,
        location: eventCheckins.location,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatar: users.avatar,
        }
      })
      .from(eventCheckins)
      .leftJoin(users, eq(eventCheckins.userId, users.id))
      .where(and(
        eq(eventCheckins.eventId, eventId),
        eq(eventCheckins.isPublic, true)
      ))
      .orderBy(desc(eventCheckins.checkedInAt));

      res.json(checkins);
    } catch (error) {
      console.error("Error fetching checkins:", error);
      res.status(500).json({ message: "Failed to fetch check-ins" });
    }
  });

  // Event Reviews
  app.post("/api/events/:eventId/reviews", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const eventId = parseInt(req.params.eventId);
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const validatedData = insertEventReviewSchema.parse({
        userId,
        eventId,
        rating: req.body.rating,
        title: req.body.title,
        review: req.body.review,
      });

      // Check if user already reviewed this event
      const existingReview = await db.select()
        .from(eventReviews)
        .where(and(
          eq(eventReviews.userId, userId),
          eq(eventReviews.eventId, eventId)
        ))
        .limit(1);

      if (existingReview.length > 0) {
        // Update existing review
        const [review] = await db.update(eventReviews)
          .set({
            rating: validatedData.rating,
            title: validatedData.title,
            review: validatedData.review,
            updatedAt: new Date(),
          })
          .where(eq(eventReviews.id, existingReview[0].id))
          .returning();

        res.json(review);
      } else {
        // Create new review
        const [review] = await db.insert(eventReviews)
          .values(validatedData)
          .returning();

        res.status(201).json(review);
      }
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Get event reviews with pagination
  app.get("/api/events/:eventId/reviews", async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const reviews = await db.select({
        id: eventReviews.id,
        rating: eventReviews.rating,
        title: eventReviews.title,
        review: eventReviews.review,
        isVerifiedAttendee: eventReviews.isVerifiedAttendee,
        helpful: eventReviews.helpful,
        createdAt: eventReviews.createdAt,
        updatedAt: eventReviews.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatar: users.avatar,
        }
      })
      .from(eventReviews)
      .leftJoin(users, eq(eventReviews.userId, users.id))
      .where(eq(eventReviews.eventId, eventId))
      .orderBy(desc(eventReviews.createdAt))
      .limit(limit)
      .offset(offset);

      // Get average rating and total count
      const [stats] = await db.select({
        averageRating: sql<number>`AVG(${eventReviews.rating})::DECIMAL(3,2)`,
        totalReviews: count(eventReviews.id),
      })
      .from(eventReviews)
      .where(eq(eventReviews.eventId, eventId));

      res.json({
        reviews,
        stats: {
          averageRating: parseFloat(stats.averageRating?.toString() || "0"),
          totalReviews: stats.totalReviews,
        },
        pagination: {
          page,
          limit,
          hasMore: reviews.length === limit,
        }
      });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Event Photos
  app.post("/api/events/:eventId/photos", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const eventId = parseInt(req.params.eventId);
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const validatedData = insertEventPhotoSchema.parse({
        userId,
        eventId,
        photoUrl: req.body.photoUrl,
        caption: req.body.caption,
      });

      const [photo] = await db.insert(eventPhotos)
        .values(validatedData)
        .returning();

      res.status(201).json(photo);
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  // Get event photos
  app.get("/api/events/:eventId/photos", async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const photos = await db.select({
        id: eventPhotos.id,
        photoUrl: eventPhotos.photoUrl,
        caption: eventPhotos.caption,
        likes: eventPhotos.likes,
        createdAt: eventPhotos.createdAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatar: users.avatar,
        }
      })
      .from(eventPhotos)
      .leftJoin(users, eq(eventPhotos.userId, users.id))
      .where(and(
        eq(eventPhotos.eventId, eventId),
        eq(eventPhotos.isApproved, true)
      ))
      .orderBy(desc(eventPhotos.createdAt))
      .limit(limit)
      .offset(offset);

      res.json({
        photos,
        pagination: {
          page,
          limit,
          hasMore: photos.length === limit,
        }
      });
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // User Follow System
  app.post("/api/users/:userId/follow", authenticateUser, async (req: any, res) => {
    try {
      const followerId = req.user?.id;
      const followingId = parseInt(req.params.userId);
      
      if (!followerId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      const validatedData = insertUserFollowSchema.parse({
        followerId,
        followingId,
      });

      // Check if already following
      const existingFollow = await db.select()
        .from(userFollows)
        .where(and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId)
        ))
        .limit(1);

      if (existingFollow.length > 0) {
        return res.status(400).json({ message: "Already following this user" });
      }

      const [follow] = await db.insert(userFollows)
        .values(validatedData)
        .returning();

      res.status(201).json(follow);
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  // Unfollow user
  app.delete("/api/users/:userId/follow", authenticateUser, async (req: any, res) => {
    try {
      const followerId = req.user?.id;
      const followingId = parseInt(req.params.userId);
      
      if (!followerId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      await db.delete(userFollows)
        .where(and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId)
        ));

      res.status(204).send();
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  // Get user's followers/following
  app.get("/api/users/:userId/followers", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const followers = await db.select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatar: users.avatar,
        followedAt: userFollows.createdAt,
      })
      .from(userFollows)
      .leftJoin(users, eq(userFollows.followerId, users.id))
      .where(eq(userFollows.followingId, userId))
      .orderBy(desc(userFollows.createdAt));

      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.get("/api/users/:userId/following", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const following = await db.select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatar: users.avatar,
        followedAt: userFollows.createdAt,
      })
      .from(userFollows)
      .leftJoin(users, eq(userFollows.followingId, users.id))
      .where(eq(userFollows.followerId, userId))
      .orderBy(desc(userFollows.createdAt));

      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });
}