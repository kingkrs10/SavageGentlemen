import crypto from 'crypto';

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'dev-secret-key-change-in-production';

/**
 * Generate HMAC-SHA256 signature for passport QR codes
 * @param data - Data to sign (e.g., "userId:timestamp")
 * @returns Base64 encoded signature
 */
export function generateHMACSignature(data: string): string {
  const hmac = crypto.createHmac('sha256', TOKEN_SECRET);
  hmac.update(data);
  return hmac.digest('base64url'); // URL-safe base64
}

/**
 * Verify HMAC-SHA256 signature
 * @param data - Original data that was signed
 * @param signature - Signature to verify
 * @returns True if signature is valid
 */
export function verifyHMACSignature(data: string, signature: string): boolean {
  const expectedSignature = generateHMACSignature(data);
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

/**
 * Generate cryptographic passport QR code data
 * @param userId - User ID
 * @returns QR code data string in format: userId:timestamp:signature
 */
export function generatePassportQR(userId: number): string {
  const timestamp = Date.now();
  const data = `${userId}:${timestamp}`;
  const signature = generateHMACSignature(data);
  return `${data}:${signature}`;
}

/**
 * Verify and parse passport QR code
 * @param qrData - QR code string to verify
 * @returns Parsed data if valid, null if invalid
 */
export function verifyPassportQR(qrData: string): { userId: number; timestamp: number } | null {
  try {
    const parts = qrData.split(':');
    if (parts.length !== 3) {
      return null;
    }

    const [userIdStr, timestampStr, signature] = parts;
    const userId = parseInt(userIdStr, 10);
    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(userId) || isNaN(timestamp)) {
      return null;
    }

    // Verify signature
    const data = `${userId}:${timestamp}`;
    if (!verifyHMACSignature(data, signature)) {
      return null;
    }

    // Enforce QR expiry: QR codes are valid for 24 hours
    // This prevents replay attacks with old QR screenshots
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (Date.now() - timestamp > maxAge) {
      console.warn(`QR code expired for user ${userId}. Age: ${(Date.now() - timestamp) / 1000 / 60} minutes`);
      return null; // Reject expired QR codes
    }

    return { userId, timestamp };
  } catch (error) {
    console.error('Error verifying passport QR:', error);
    return null;
  }
}

/**
 * Generate random access code for event check-in
 * @param eventId - Event ID
 * @returns Access code string (e.g., "EVT-123-ABC456")
 */
export function generateAccessCode(eventId: number): string {
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `EVT-${eventId}-${randomBytes}`;
}
