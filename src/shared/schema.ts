import { z } from "zod";

export const insertEventSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    date: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
    time: z.string().min(1, "Time is required"),
    location: z.string().min(1, "Location is required"),
    price: z.coerce.number().min(0),
    currency: z.string().default("USD"),
    imageUrl: z.string().optional().nullable(),
    category: z.string().min(1, "Category is required"),
    featured: z.boolean().default(false).optional(),
    organizerName: z.string().min(1, "Organizer name is required").default("Savage Gentlemen"),
    isSocaPassportEnabled: z.boolean().default(false).optional(),
});

export const insertProductSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    price: z.coerce.number().min(0),
    imageUrl: z.string().optional().nullable(),
    category: z.string().min(1, "Category is required"),
    featured: z.boolean().default(false).optional(),
    inStock: z.boolean().default(true).optional(),
    stockLevel: z.coerce.number().default(0).optional(),
    trackInventory: z.boolean().default(true).optional(),
    lowStockThreshold: z.coerce.number().default(5).optional(),
    sku: z.string().optional().nullable(),
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
