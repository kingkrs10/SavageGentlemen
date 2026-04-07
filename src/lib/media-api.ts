
import { db } from "@/lib/db";
import {
    mediaCollections,
    mediaAssets,
    users
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type {
    MediaCollection,
    InsertMediaCollection,
    MediaAsset,
    InsertMediaAsset
} from "@shared/schema";

// --- Media Collection operations ---

export async function getMediaCollection(id: number): Promise<MediaCollection | undefined> {
    const [collection] = await db
        .select()
        .from(mediaCollections)
        .where(eq(mediaCollections.id, id));
    return collection;
}

export async function getMediaCollectionBySlug(slug: string): Promise<MediaCollection | undefined> {
    const [collection] = await db
        .select()
        .from(mediaCollections)
        .where(eq(mediaCollections.slug, slug));
    return collection;
}

export async function getAllMediaCollections(options?: { visibility?: string; isActive?: boolean }): Promise<MediaCollection[]> {
    let query = db.select().from(mediaCollections);

    const conditions = [];
    if (options?.isActive !== undefined) {
        conditions.push(eq(mediaCollections.isActive, options.isActive));
    }
    if (options?.visibility) {
        conditions.push(eq(mediaCollections.visibility, options.visibility));
    }

    if (conditions.length > 0) {
        return await query.where(and(...conditions)).orderBy(mediaCollections.displayOrder);
    }

    return await query.orderBy(mediaCollections.displayOrder);
}

// --- Media Asset operations ---

export async function getMediaAssetsByCollectionId(collectionId: number, options?: { isPublished?: boolean; limit?: number; offset?: number }): Promise<MediaAsset[]> {
    const conditions = [eq(mediaAssets.collectionId, collectionId)];

    if (options?.isPublished !== undefined) {
        conditions.push(eq(mediaAssets.isPublished, options.isPublished));
    }

    let query = db.select().from(mediaAssets).where(and(...conditions)).orderBy(mediaAssets.displayOrder).$dynamic();

    if (options?.limit) {
        query = query.limit(options.limit);
    }
    if (options?.offset) {
        query = query.offset(options.offset);
    }

    return await query;
}

export async function getMediaAsset(id: number): Promise<MediaAsset | undefined> {
    const [asset] = await db
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.id, id));
    return asset;
}
