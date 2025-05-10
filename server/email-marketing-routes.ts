import { Router, Request, Response } from "express";
import { db } from "./db";
import { 
  emailLists, 
  emailSubscribers, 
  emailListSubscribers, 
  emailCampaigns,
  insertEmailListSchema, 
  insertEmailSubscriberSchema,
  insertEmailCampaignSchema,
  type EmailList,
  type EmailSubscriber
} from "@shared/schema";
import { sendEmail } from "./email";
import { eq, and, like, sql } from "drizzle-orm";
import { z } from "zod";
import multer from "multer";
import fs from "fs";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify";
import path from "path";

export const emailMarketingRouter = Router();

// Configure multer for CSV file uploads
const upload = multer({ 
  dest: "uploads/", 
  fileFilter: (req, file, cb) => {
    // Accept only CSV files
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Common error handler for Zod validation
const handleZodError = (err: unknown, res: Response) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors,
    });
  }
  console.error("Error:", err);
  return res.status(500).json({ message: "Server error" });
};

/**
 * Get all email lists
 */
emailMarketingRouter.get("/lists", async (req: Request, res: Response) => {
  try {
    const lists = await db.select().from(emailLists).orderBy(emailLists.name);
    res.json(lists);
  } catch (error) {
    console.error("Error fetching email lists:", error);
    res.status(500).json({ message: "Failed to fetch email lists" });
  }
});

/**
 * Create new email list
 */
emailMarketingRouter.post("/lists", async (req: Request, res: Response) => {
  try {
    const validatedData = insertEmailListSchema.parse(req.body);
    const [newList] = await db.insert(emailLists).values(validatedData).returning();
    res.status(201).json(newList);
  } catch (error) {
    handleZodError(error, res);
  }
});

/**
 * Get list by ID
 */
emailMarketingRouter.get("/lists/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [list] = await db.select().from(emailLists).where(eq(emailLists.id, Number(id)));
    if (!list) {
      return res.status(404).json({ message: "Email list not found" });
    }
    res.json(list);
  } catch (error) {
    console.error("Error fetching email list:", error);
    res.status(500).json({ message: "Failed to fetch email list" });
  }
});

/**
 * Update list
 */
emailMarketingRouter.put("/lists/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const validatedData = insertEmailListSchema.parse(req.body);
    const [updatedList] = await db
      .update(emailLists)
      .set(validatedData)
      .where(eq(emailLists.id, Number(id)))
      .returning();
    
    if (!updatedList) {
      return res.status(404).json({ message: "Email list not found" });
    }
    
    res.json(updatedList);
  } catch (error) {
    handleZodError(error, res);
  }
});

/**
 * Delete list
 */
emailMarketingRouter.delete("/lists/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // First delete all list-subscriber relations
    await db
      .delete(emailListSubscribers)
      .where(eq(emailListSubscribers.listId, Number(id)));
    
    // Then delete the list
    const [deletedList] = await db
      .delete(emailLists)
      .where(eq(emailLists.id, Number(id)))
      .returning();
    
    if (!deletedList) {
      return res.status(404).json({ message: "Email list not found" });
    }
    
    res.json({ message: "Email list deleted successfully" });
  } catch (error) {
    console.error("Error deleting email list:", error);
    res.status(500).json({ message: "Failed to delete email list" });
  }
});

/**
 * Get subscribers
 */
emailMarketingRouter.get("/subscribers", async (req: Request, res: Response) => {
  const { search, status, page = "1", limit = "50" } = req.query;
  
  try {
    let query = db.select().from(emailSubscribers);
    
    // Apply filters
    if (search) {
      query = query.where(
        sql`${emailSubscribers.email} ILIKE ${'%' + search + '%'} OR 
            ${emailSubscribers.firstName} ILIKE ${'%' + search + '%'} OR 
            ${emailSubscribers.lastName} ILIKE ${'%' + search + '%'}`
      );
    }
    
    if (status) {
      query = query.where(eq(emailSubscribers.status, status as string));
    }
    
    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    
    const subscribers = await query
      .limit(limitNum)
      .offset(offset)
      .orderBy(emailSubscribers.email);
    
    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailSubscribers);
    
    res.json({
      subscribers,
      pagination: {
        total: Number(count),
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(Number(count) / limitNum)
      }
    });
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    res.status(500).json({ message: "Failed to fetch subscribers" });
  }
});

/**
 * Create new subscriber
 */
emailMarketingRouter.post("/subscribers", async (req: Request, res: Response) => {
  try {
    const validatedData = insertEmailSubscriberSchema.parse(req.body);
    
    // Check if subscriber already exists
    const [existingSubscriber] = await db
      .select()
      .from(emailSubscribers)
      .where(eq(emailSubscribers.email, validatedData.email));
    
    if (existingSubscriber) {
      return res.status(409).json({ 
        message: "Email already exists", 
        subscriber: existingSubscriber 
      });
    }
    
    // Create new subscriber
    const [newSubscriber] = await db
      .insert(emailSubscribers)
      .values({
        ...validatedData,
        source: validatedData.source || 'manual',
      })
      .returning();
    
    // Add to list if listId is provided
    if (req.body.listId) {
      await db.insert(emailListSubscribers).values({
        listId: Number(req.body.listId),
        subscriberId: newSubscriber.id,
      });
    }
    
    res.status(201).json(newSubscriber);
  } catch (error) {
    handleZodError(error, res);
  }
});

/**
 * Update subscriber
 */
emailMarketingRouter.put("/subscribers/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const validatedData = insertEmailSubscriberSchema.partial().parse(req.body);
    
    // Check if email is being changed and already exists
    if (validatedData.email) {
      const [existingSubscriber] = await db
        .select()
        .from(emailSubscribers)
        .where(
          and(
            eq(emailSubscribers.email, validatedData.email),
            sql`${emailSubscribers.id} != ${Number(id)}`
          )
        );
      
      if (existingSubscriber) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }
    
    // Update subscriber
    const [updatedSubscriber] = await db
      .update(emailSubscribers)
      .set(validatedData)
      .where(eq(emailSubscribers.id, Number(id)))
      .returning();
    
    if (!updatedSubscriber) {
      return res.status(404).json({ message: "Subscriber not found" });
    }
    
    res.json(updatedSubscriber);
  } catch (error) {
    handleZodError(error, res);
  }
});

/**
 * Delete subscriber
 */
emailMarketingRouter.delete("/subscribers/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // First delete all list-subscriber relations
    await db
      .delete(emailListSubscribers)
      .where(eq(emailListSubscribers.subscriberId, Number(id)));
    
    // Then delete the subscriber
    const [deletedSubscriber] = await db
      .delete(emailSubscribers)
      .where(eq(emailSubscribers.id, Number(id)))
      .returning();
    
    if (!deletedSubscriber) {
      return res.status(404).json({ message: "Subscriber not found" });
    }
    
    res.json({ message: "Subscriber deleted successfully" });
  } catch (error) {
    console.error("Error deleting subscriber:", error);
    res.status(500).json({ message: "Failed to delete subscriber" });
  }
});

/**
 * Import subscribers from CSV
 */
emailMarketingRouter.post(
  "/subscribers/import", 
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const listId = req.body.listId ? Number(req.body.listId) : null;
      const filePath = req.file.path;
      
      // Process CSV file
      const results: any[] = [];
      const parser = fs
        .createReadStream(filePath)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        }));
      
      for await (const record of parser) {
        // Normalize CSV column names
        const subscriber = {
          email: record.email || record.Email || record.EMAIL,
          firstName: record.firstName || record.first_name || record.FirstName || record["First Name"],
          lastName: record.lastName || record.last_name || record.LastName || record["Last Name"],
          status: 'active',
          source: 'import',
        };
        
        // Validate email
        if (!subscriber.email || !subscriber.email.includes('@')) {
          results.push({
            email: subscriber.email,
            status: 'error',
            message: 'Invalid email format'
          });
          continue;
        }
        
        try {
          // Check if subscriber already exists
          const [existingSubscriber] = await db
            .select()
            .from(emailSubscribers)
            .where(eq(emailSubscribers.email, subscriber.email));
          
          if (existingSubscriber) {
            results.push({
              email: subscriber.email,
              status: 'skipped',
              message: 'Email already exists'
            });
            
            // If list ID provided, add existing subscriber to list
            if (listId) {
              const [existingRelation] = await db
                .select()
                .from(emailListSubscribers)
                .where(
                  and(
                    eq(emailListSubscribers.listId, listId),
                    eq(emailListSubscribers.subscriberId, existingSubscriber.id)
                  )
                );
                
              if (!existingRelation) {
                await db.insert(emailListSubscribers).values({
                  listId,
                  subscriberId: existingSubscriber.id,
                });
              }
            }
            
            continue;
          }
          
          // Create new subscriber
          const [newSubscriber] = await db
            .insert(emailSubscribers)
            .values(subscriber)
            .returning();
          
          // Add to list if provided
          if (listId) {
            await db.insert(emailListSubscribers).values({
              listId,
              subscriberId: newSubscriber.id,
            });
          }
          
          results.push({
            email: subscriber.email,
            status: 'imported',
            message: 'Successfully imported'
          });
        } catch (error) {
          console.error(`Error importing subscriber ${subscriber.email}:`, error);
          results.push({
            email: subscriber.email,
            status: 'error',
            message: 'Database error'
          });
        }
      }
      
      // Clean up the temporary file
      fs.unlinkSync(filePath);
      
      // Send results summary
      const summary = {
        total: results.length,
        imported: results.filter(r => r.status === 'imported').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        errors: results.filter(r => r.status === 'error').length,
        details: results
      };
      
      res.status(200).json(summary);
    } catch (error) {
      console.error("Error importing subscribers:", error);
      res.status(500).json({ message: "Failed to import subscribers" });
    }
  }
);

/**
 * Export subscribers to CSV
 */
emailMarketingRouter.get("/subscribers/export", async (req: Request, res: Response) => {
  const { listId, status } = req.query;
  
  try {
    let subscribers: EmailSubscriber[] = [];
    
    if (listId) {
      // Get subscribers from a specific list
      const listSubscribers = await db
        .select({
          subscriber: emailSubscribers
        })
        .from(emailListSubscribers)
        .innerJoin(
          emailSubscribers,
          eq(emailListSubscribers.subscriberId, emailSubscribers.id)
        )
        .where(eq(emailListSubscribers.listId, Number(listId)))
        .orderBy(emailSubscribers.email);
      
      subscribers = listSubscribers.map(row => row.subscriber);
    } else {
      // Get all subscribers
      let query = db.select().from(emailSubscribers);
      
      // Apply status filter if provided
      if (status) {
        query = query.where(eq(emailSubscribers.status, status as string));
      }
      
      subscribers = await query.orderBy(emailSubscribers.email);
    }
    
    // Generate CSV
    const csvFields = ["email", "firstName", "lastName", "status", "source", "createdAt"];
    const csvData = subscribers.map(sub => ({
      email: sub.email,
      firstName: sub.firstName || "",
      lastName: sub.lastName || "",
      status: sub.status,
      source: sub.source || "",
      createdAt: sub.createdAt ? new Date(sub.createdAt).toISOString() : ""
    }));
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="subscribers-${Date.now()}.csv"`);
    
    // Stream the CSV data to the response
    const stringifier = stringify({ header: true, columns: csvFields });
    
    // Stream stringifier directly to response
    stringifier.pipe(res);
    
    // Write data to the stringifier
    csvData.forEach(row => stringifier.write(row));
    stringifier.end();
  } catch (error) {
    console.error("Error exporting subscribers:", error);
    res.status(500).json({ message: "Failed to export subscribers" });
  }
});

/**
 * Add subscriber to list
 */
emailMarketingRouter.post(
  "/lists/:listId/subscribers/:subscriberId", 
  async (req: Request, res: Response) => {
    const { listId, subscriberId } = req.params;
    
    try {
      // Check if list exists
      const [list] = await db
        .select()
        .from(emailLists)
        .where(eq(emailLists.id, Number(listId)));
      
      if (!list) {
        return res.status(404).json({ message: "List not found" });
      }
      
      // Check if subscriber exists
      const [subscriber] = await db
        .select()
        .from(emailSubscribers)
        .where(eq(emailSubscribers.id, Number(subscriberId)));
      
      if (!subscriber) {
        return res.status(404).json({ message: "Subscriber not found" });
      }
      
      // Check if already on the list
      const [existingRelation] = await db
        .select()
        .from(emailListSubscribers)
        .where(
          and(
            eq(emailListSubscribers.listId, Number(listId)),
            eq(emailListSubscribers.subscriberId, Number(subscriberId))
          )
        );
      
      if (existingRelation) {
        return res.status(409).json({ message: "Subscriber already on list" });
      }
      
      // Add subscriber to list
      const [newRelation] = await db
        .insert(emailListSubscribers)
        .values({
          listId: Number(listId),
          subscriberId: Number(subscriberId),
        })
        .returning();
      
      res.status(201).json({
        message: "Subscriber added to list",
        list,
        subscriber,
      });
    } catch (error) {
      console.error("Error adding subscriber to list:", error);
      res.status(500).json({ message: "Failed to add subscriber to list" });
    }
  }
);

/**
 * Remove subscriber from list
 */
emailMarketingRouter.delete(
  "/lists/:listId/subscribers/:subscriberId", 
  async (req: Request, res: Response) => {
    const { listId, subscriberId } = req.params;
    
    try {
      // Delete the relation
      const [deletedRelation] = await db
        .delete(emailListSubscribers)
        .where(
          and(
            eq(emailListSubscribers.listId, Number(listId)),
            eq(emailListSubscribers.subscriberId, Number(subscriberId))
          )
        )
        .returning();
      
      if (!deletedRelation) {
        return res.status(404).json({ message: "Subscriber not on list" });
      }
      
      res.json({ message: "Subscriber removed from list" });
    } catch (error) {
      console.error("Error removing subscriber from list:", error);
      res.status(500).json({ message: "Failed to remove subscriber from list" });
    }
  }
);

/**
 * Get subscribers for a list
 */
emailMarketingRouter.get(
  "/lists/:listId/subscribers", 
  async (req: Request, res: Response) => {
    const { listId } = req.params;
    const { page = "1", limit = "50" } = req.query;
    
    try {
      // Check if list exists
      const [list] = await db
        .select()
        .from(emailLists)
        .where(eq(emailLists.id, Number(listId)));
      
      if (!list) {
        return res.status(404).json({ message: "List not found" });
      }
      
      // Get subscribers with pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      const listSubscribers = await db
        .select({
          subscriber: emailSubscribers
        })
        .from(emailListSubscribers)
        .innerJoin(
          emailSubscribers,
          eq(emailListSubscribers.subscriberId, emailSubscribers.id)
        )
        .where(eq(emailListSubscribers.listId, Number(listId)))
        .orderBy(emailSubscribers.email)
        .limit(limitNum)
        .offset(offset);
      
      const subscribers = listSubscribers.map(row => row.subscriber);
      
      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(emailListSubscribers)
        .where(eq(emailListSubscribers.listId, Number(listId)));
      
      res.json({
        list,
        subscribers,
        pagination: {
          total: Number(count),
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(Number(count) / limitNum)
        }
      });
    } catch (error) {
      console.error("Error fetching list subscribers:", error);
      res.status(500).json({ message: "Failed to fetch list subscribers" });
    }
  }
);

/**
 * Send campaign or test email
 */
emailMarketingRouter.post("/campaigns/send", async (req: Request, res: Response) => {
  try {
    const { campaignId, testEmails, isTest = false } = req.body;
    
    if (!campaignId && !testEmails) {
      return res.status(400).json({ 
        message: "Either campaignId or testEmails are required" 
      });
    }
    
    // Get campaign data
    const [campaign] = await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.id, Number(campaignId)));
    
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    
    // If test email, send to test recipients only
    if (isTest && testEmails && testEmails.length > 0) {
      const testResults = [];
      
      for (const email of testEmails) {
        const success = await sendEmail({
          to: email,
          subject: `[TEST] ${campaign.subject}`,
          html: campaign.content,
        });
        
        testResults.push({
          email,
          success,
          message: success ? "Email sent successfully" : "Failed to send email"
        });
      }
      
      return res.status(200).json({
        message: "Test emails processed",
        results: testResults
      });
    }
    
    // If not a test, send to actual list subscribers
    // Get the list of subscribers
    const listSubscribers = await db
      .select({
        subscriber: emailSubscribers
      })
      .from(emailListSubscribers)
      .innerJoin(
        emailSubscribers,
        eq(emailListSubscribers.subscriberId, emailSubscribers.id)
      )
      .where(
        and(
          eq(emailListSubscribers.listId, campaign.listId),
          eq(emailSubscribers.status, "active")
        )
      );
    
    const subscribers = listSubscribers.map(row => row.subscriber);
    
    if (subscribers.length === 0) {
      return res.status(200).json({
        message: "No active subscribers found in the list"
      });
    }
    
    // Here we would implement a proper email sending queue
    // For now, we'll return the list of subscribers that would receive the campaign
    
    // Update campaign status
    await db
      .update(emailCampaigns)
      .set({
        status: "sent",
        sentAt: new Date(),
      })
      .where(eq(emailCampaigns.id, campaign.id));
    
    return res.status(200).json({
      message: `Campaign would be sent to ${subscribers.length} subscribers`,
      campaign,
      subscriberCount: subscribers.length
    });
  } catch (error) {
    console.error("Error sending campaign:", error);
    res.status(500).json({ message: "Failed to send campaign" });
  }
});

/**
 * Create a directory for uploaded files if it doesn't exist
 */
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}