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
const uploadsDir = path.join(process.cwd(), "uploads");

// Create uploads directory if it doesn't exist
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("Created uploads directory at:", uploadsDir);
  }
} catch (error) {
  console.error("Error creating uploads directory:", error);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname) || '.csv';
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept more file types that might be interpreted as CSV
    const acceptableTypes = [
      'text/csv', 
      'application/csv',
      'application/vnd.ms-excel',
      'text/plain'
    ];
    
    const acceptableSuffixes = ['.csv', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (acceptableTypes.includes(file.mimetype) || acceptableSuffixes.includes(fileExtension)) {
      console.log("Accepting file:", file.originalname, file.mimetype);
      cb(null, true);
    } else {
      console.log("Rejecting file:", file.originalname, file.mimetype);
      cb(new Error('Only CSV files are allowed'), false);
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
  const { search, status, listId, page = "1", limit = "50" } = req.query;
  
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
    
    // Filter by list membership
    if (listId) {
      // Join with email_list_subscribers to filter by list
      query = db
        .select({
          id: emailSubscribers.id,
          email: emailSubscribers.email,
          firstName: emailSubscribers.firstName,
          lastName: emailSubscribers.lastName,
          status: emailSubscribers.status,
          source: emailSubscribers.source,
          createdAt: emailSubscribers.createdAt,
          updatedAt: emailSubscribers.updatedAt
        })
        .from(emailSubscribers)
        .innerJoin(
          emailListSubscribers,
          eq(emailSubscribers.id, emailListSubscribers.subscriberId)
        )
        .where(eq(emailListSubscribers.listId, Number(listId)));
        
      // Apply other filters to the joined query
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
    let countQuery;
    
    if (listId) {
      // If filtering by list, count only subscribers in that list
      countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(emailSubscribers)
        .innerJoin(
          emailListSubscribers,
          eq(emailSubscribers.id, emailListSubscribers.subscriberId)
        )
        .where(eq(emailListSubscribers.listId, Number(listId)));
        
      // Apply other filters to the count query
      if (search) {
        countQuery = countQuery.where(
          sql`${emailSubscribers.email} ILIKE ${'%' + search + '%'} OR 
              ${emailSubscribers.firstName} ILIKE ${'%' + search + '%'} OR 
              ${emailSubscribers.lastName} ILIKE ${'%' + search + '%'}`
        );
      }
      
      if (status) {
        countQuery = countQuery.where(eq(emailSubscribers.status, status as string));
      }
    } else {
      // Standard count query without list filter
      countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(emailSubscribers);
        
      // Apply basic filters
      if (search) {
        countQuery = countQuery.where(
          sql`${emailSubscribers.email} ILIKE ${'%' + search + '%'} OR 
              ${emailSubscribers.firstName} ILIKE ${'%' + search + '%'} OR 
              ${emailSubscribers.lastName} ILIKE ${'%' + search + '%'}`
        );
      }
      
      if (status) {
        countQuery = countQuery.where(eq(emailSubscribers.status, status as string));
      }
    }
    
    const [{ count }] = await countQuery;
    
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
      console.log("CSV Import request received:", {
        body: req.body,
        file: req.file ? {
          originalname: req.file.originalname,
          path: req.file.path,
          size: req.file.size
        } : "No file"
      });
      
      if (!req.file) {
        return res.status(400).json({ 
          message: "No file uploaded", 
          error: "Make sure you've selected a valid CSV file and the form includes 'file' field"
        });
      }
      
      const listId = req.body.listId ? Number(req.body.listId) : null;
      const filePath = req.file.path;
      
      // Verify file exists
      if (!fs.existsSync(filePath)) {
        return res.status(500).json({ 
          message: "File upload failed",
          error: "The file was received but could not be saved. Check server permissions."
        });
      }
      
      // Process CSV file with more forgiving options
      const results: any[] = [];
      const parser = fs
        .createReadStream(filePath)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
          skip_records_with_error: true,
          relax_quotes: true,
          relax_column_count: true,
          bom: true // Handle BOM explicitly
        }));
      
      try {
        // Get a preview of the headers if available
        let csvHeaders: string[] = [];
        
        // Handle each record from the CSV
        for await (const record of parser) {
          // Skip empty records or invalid types
          if (!record || typeof record !== 'object') {
            console.log("Skipping invalid record:", record);
            continue;
          }
          
          // Get the headers from the first record
          if (results.length === 0) {
            csvHeaders = Object.keys(record);
            console.log("CSV Headers:", csvHeaders);
            
            // Detect format and log information about it
            const isEventTicketFormat = csvHeaders.some(header => 
              header.includes('Event') || 
              header.includes('Ticket') || 
              header.includes('Code') || 
              header.includes('Entitlement')
            );
            
            if (isEventTicketFormat) {
              console.log("Detected event ticket CSV format, will look for attendee/buyer email fields");
            }
          }
          
          // Log record for debugging (but only the first few to avoid console spam)
          if (results.length < 2) {
            console.log("Processing CSV record:", record);
          }
          
          // Safely extract values with multiple possible column names
          const getField = (fieldNames: string[]): string => {
            for (const name of fieldNames) {
              const value = record[name];
              if (value !== undefined && value !== null && value !== '') {
                return String(value).trim();
              }
            }
            return '';
          };
          
          // Try to find any email in the record by checking common buyer fields
          let email = '';
          
          // First try standard email fields
          email = getField(['email', 'Email', 'EMAIL', 'e-mail', 'E-mail', 'E-Mail']);
          
          // If no email found, try to look for buyer email or attendee email fields
          if (!email) {
            email = getField([
              'Buyer email', 'buyer email', 'BuyerEmail', 'buyerEmail', 
              'Attendee email', 'attendee email', 'AttendeeEmail', 'attendeeEmail',
              'Customer email', 'customer email', 'CustomerEmail', 'customerEmail'
            ]);
          }
          
          // Extract first name, both standard format and from buyer info
          const firstName = getField([
            'firstName', 'first_name', 'FirstName', 'First Name', 'firstname', 'FIRSTNAME',
            'Buyer first name', 'buyer first name', 'BuyerFirstName', 'buyerFirstName',
            'Attendee first name', 'attendee first name'
          ]);
          
          // Extract last name, both standard format and from buyer info
          const lastName = getField([
            'lastName', 'last_name', 'LastName', 'Last Name', 'lastname', 'LASTNAME',
            'Buyer last name', 'buyer last name', 'BuyerLastName', 'buyerLastName',
            'Attendee last name', 'attendee last name'
          ]);
            
          // If we have a buyer name but no email, we can't create a subscriber
          if (!email && (firstName || lastName)) {
            console.log("Found name but no email:", { firstName, lastName });
          }
          
          // Build the subscriber object
          const subscriber = {
            email,
            firstName,
            lastName,
            status: 'active',
            source: getField(['source', 'Source']) || 'import',
          };
          
          // Log to help identify available fields in the CSV
          if (results.length < 3) {
            console.log("CSV Record Keys:", Object.keys(record));
          }
          
          // Validate email
          if (!subscriber.email || !subscriber.email.includes('@')) {
            results.push({
              email: subscriber.email || '[empty]',
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
      } catch (parseError) {
        console.error("CSV parsing error:", parseError);
        results.push({
          email: 'CSV parsing error',
          status: 'error',
          message: parseError instanceof Error ? parseError.message : 'Failed to parse CSV file'
        });
      }
      
      try {
        // Clean up the temporary file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupError) {
        console.error("Error cleaning up temp file:", cleanupError);
        // Non-fatal error, continue
      }
      
      // Analyze the results to provide better feedback
      const errors = results.filter(r => r.status === 'error');
      const imported = results.filter(r => r.status === 'imported').length;
      const skipped = results.filter(r => r.status === 'skipped').length;
      
      let errorSummary = '';
      let suggestedFix = '';
      
      // Check if all errors are the same type (like missing email)
      if (errors.length > 0) {
        // Count error types
        const errorTypes: Record<string, number> = {};
        errors.forEach(error => {
          if (error.message) {
            errorTypes[error.message] = (errorTypes[error.message] || 0) + 1;
          }
        });
        
        // Find most common error
        let mostCommonError = '';
        let maxCount = 0;
        
        for (const [errorMessage, count] of Object.entries(errorTypes)) {
          if (count > maxCount) {
            mostCommonError = errorMessage;
            maxCount = count;
          }
        }
        
        if (mostCommonError && maxCount > errors.length * 0.7) { // If 70% of errors are the same type
          errorSummary = `Most errors (${maxCount} of ${errors.length}) are: ${mostCommonError}`;
          
          // Suggest a fix based on the error type
          if (mostCommonError.includes('email')) {
            suggestedFix = 'Try downloading our Event Attendees template to see the expected format. Look for "Buyer email" or similar column in your CSV.';
          }
        }
      }
      
      // Send results summary with enhanced feedback
      const summary = {
        total: results.length,
        imported,
        skipped,
        errors: errors.length,
        errorSummary: errorSummary || undefined,
        suggestedFix: suggestedFix || undefined,
        details: results
      };
      
      console.log("CSV import summary:", summary);
      res.status(200).json(summary);
    } catch (error) {
      console.error("Error importing subscribers:", error);
      res.status(500).json({ 
        message: "Failed to import subscribers",
        error: error instanceof Error ? error.message : String(error)
      });
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
    
    if (!campaignId) {
      return res.status(400).json({ 
        message: "Campaign ID is required" 
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
    
    // If it's already sent and not a test, don't send again
    if (campaign.status === 'sent' && !isTest) {
      return res.status(400).json({ 
        message: "Campaign has already been sent" 
      });
    }
    
    // Ensure the campaign has a list associated with it
    if (!campaign.listId && !isTest) {
      return res.status(400).json({ 
        message: "Campaign must be associated with an email list" 
      });
    }
    
    // If test email, send to test recipients only
    if (isTest && testEmails && testEmails.length > 0) {
      const testResults = [];
      
      for (const email of testEmails) {
        // Add personalization in test emails
        const personalizedContent = campaign.content
          .replace(/{{email}}/g, email)
          .replace(/{{firstName}}/g, 'Test')
          .replace(/{{lastName}}/g, 'User');
        
        const success = await sendEmail({
          to: email,
          subject: `[TEST] ${campaign.subject}`,
          html: personalizedContent,
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
    
    // Create email campaign stats record if it doesn't exist
    const [existingStats] = await db
      .select()
      .from(emailCampaignStats)
      .where(eq(emailCampaignStats.campaignId, campaign.id));
    
    if (!existingStats) {
      await db
        .insert(emailCampaignStats)
        .values({
          campaignId: campaign.id
        });
    }
    
    // Process sending emails to subscribers in batches
    const batchSize = 50; // SendGrid recommends not sending too many emails at once
    const results = {
      successCount: 0,
      failureCount: 0,
      totalCount: subscribers.length
    };
    
    // Process in batches to avoid overwhelming the server or email service
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      // Process each subscriber in the batch
      const batchPromises = batch.map(async (subscriber) => {
        try {
          // Apply simple personalization
          let personalizedContent = campaign.content;
          
          // Replace placeholders with subscriber data
          if (subscriber.email) {
            personalizedContent = personalizedContent.replace(/{{email}}/g, subscriber.email);
          }
          
          if (subscriber.firstName) {
            personalizedContent = personalizedContent.replace(/{{firstName}}/g, subscriber.firstName);
          } else {
            personalizedContent = personalizedContent.replace(/{{firstName}}/g, '');
          }
          
          if (subscriber.lastName) {
            personalizedContent = personalizedContent.replace(/{{lastName}}/g, subscriber.lastName);
          } else {
            personalizedContent = personalizedContent.replace(/{{lastName}}/g, '');
          }
          
          // Send personalized email
          const success = await sendEmail({
            to: subscriber.email,
            subject: campaign.subject,
            html: personalizedContent,
          });
          
          if (success) {
            results.successCount++;
          } else {
            results.failureCount++;
          }
          
          return success;
        } catch (error) {
          console.error(`Error sending to ${subscriber.email}:`, error);
          results.failureCount++;
          return false;
        }
      });
      
      // Wait for the batch to finish before processing the next one
      await Promise.all(batchPromises);
    }
    
    // Update campaign status
    await db
      .update(emailCampaigns)
      .set({
        status: "sent",
        sentAt: new Date(),
      })
      .where(eq(emailCampaigns.id, campaign.id));
    
    // Update campaign stats
    await db
      .update(emailCampaignStats)
      .set({
        sent: results.totalCount,
        delivered: results.successCount,
        bounced: results.failureCount
      })
      .where(eq(emailCampaignStats.campaignId, campaign.id));
    
    return res.status(200).json({
      message: `Campaign sent to ${subscribers.length} subscribers`,
      campaign: {
        ...campaign,
        status: "sent",
        sentAt: new Date()
      },
      stats: results
    });
  } catch (error) {
    console.error("Error sending campaign:", error);
    res.status(500).json({ message: "Failed to send campaign" });
  }
});

/**
 * Get all campaigns
 */
emailMarketingRouter.get("/campaigns", async (req: Request, res: Response) => {
  try {
    const campaigns = await db
      .select({
        campaign: emailCampaigns,
        listName: emailLists.name
      })
      .from(emailCampaigns)
      .leftJoin(emailLists, eq(emailCampaigns.listId, emailLists.id))
      .orderBy(emailCampaigns.createdAt);
    
    res.json(campaigns.map(row => ({
      ...row.campaign,
      listName: row.listName
    })));
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
});

/**
 * Create new campaign
 */
emailMarketingRouter.post("/campaigns", async (req: Request, res: Response) => {
  try {
    const validatedData = insertEmailCampaignSchema.parse(req.body);
    
    // If listId is provided, validate it exists
    if (validatedData.listId) {
      const [list] = await db
        .select()
        .from(emailLists)
        .where(eq(emailLists.id, validatedData.listId));
      
      if (!list) {
        return res.status(400).json({ message: "Selected email list does not exist" });
      }
    }
    
    const [newCampaign] = await db
      .insert(emailCampaigns)
      .values(validatedData)
      .returning();
    
    res.status(201).json(newCampaign);
  } catch (error) {
    handleZodError(error, res);
  }
});

/**
 * Get campaign by ID
 */
emailMarketingRouter.get("/campaigns/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const [campaign] = await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.id, Number(id)));
    
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    
    res.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    res.status(500).json({ message: "Failed to fetch campaign" });
  }
});

/**
 * Update campaign
 */
emailMarketingRouter.put("/campaigns/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // First check if the campaign exists
    const [existingCampaign] = await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.id, Number(id)));
    
    if (!existingCampaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    
    // Don't allow updating campaigns that are already sent
    if (existingCampaign.status === 'sent') {
      return res.status(400).json({ 
        message: "Cannot update a campaign that has already been sent" 
      });
    }
    
    const validatedData = insertEmailCampaignSchema.parse(req.body);
    
    // If listId is provided, validate it exists
    if (validatedData.listId) {
      const [list] = await db
        .select()
        .from(emailLists)
        .where(eq(emailLists.id, validatedData.listId));
      
      if (!list) {
        return res.status(400).json({ message: "Selected email list does not exist" });
      }
    }
    
    const [updatedCampaign] = await db
      .update(emailCampaigns)
      .set(validatedData)
      .where(eq(emailCampaigns.id, Number(id)))
      .returning();
    
    res.json(updatedCampaign);
  } catch (error) {
    handleZodError(error, res);
  }
});

/**
 * Delete campaign
 */
emailMarketingRouter.delete("/campaigns/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // First check if the campaign exists
    const [existingCampaign] = await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.id, Number(id)));
    
    if (!existingCampaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    
    // Don't allow deleting campaigns that are already sent
    if (existingCampaign.status === 'sent') {
      return res.status(400).json({ 
        message: "Cannot delete a campaign that has already been sent" 
      });
    }
    
    await db
      .delete(emailCampaigns)
      .where(eq(emailCampaigns.id, Number(id)));
    
    res.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({ message: "Failed to delete campaign" });
  }
});

/**
 * Create a directory for uploaded files if it doesn't exist
 */
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}