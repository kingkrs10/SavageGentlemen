
import * as crypto from "crypto";
import { User } from "./types";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Secret key for HMAC token signing
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'CHANGE_THIS_IN_PRODUCTION_INTERNAL_DEFAULT_SECRET';

/**
 * Generates a secure HMAC-signed login token for a user.
 * Format: payload.signature (where payload is base64url encoded userId:username:timestamp)
 */
export const generateSecureLoginToken = (user: User): string => {
  const payload = `${user.id}:${user.username}:${Date.now()}`;
  const payloadBase64 = Buffer.from(payload).toString('base64url');

  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
};

/**
 * Validates a secure HMAC-signed login token.
 * Returns the User object if valid, otherwise null.
 */
export const validateSecureLoginToken = async (token: string): Promise<User | null> => {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) {
      return null;
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payload)
      .digest('base64url');

    if (expectedSignature !== signature) {
      return null;
    }

    // Decode payload
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    const [userId, username, timestamp] = decoded.split(':');

    if (!userId || !username || !timestamp) {
      return null;
    }

    // Check token age (24 hour expiry)
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000;

    if (tokenAge >= maxAge) {
      return null;
    }

    // Verify user exists and username matches in the database
    const [user] = await db.select().from(users).where(eq(users.id, parseInt(userId)));
    if (!user || user.username !== username) {
      return null;
    }

    return user as User;
  } catch (error) {
    console.error("Secure token validation error:", error);
    return null;
  }
};