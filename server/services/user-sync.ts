import { admin } from "../firebase";
import { storage } from "../storage";
import crypto from "crypto";

export interface SyncStats {
  totalFirebaseUsers: number;
  syncedNewUsers: number;
  updatedExistingUsers: number;
  skippedUsers: number;
  errors: string[];
}

/**
 * Synchronize all historical and current users from Firebase Auth into PostgreSQL database.
 * Ensures no past users are missing from ticket databases, passport ledgers, or admin dashboards.
 */
export async function syncUsersFromFirebase(): Promise<SyncStats> {
  const stats: SyncStats = {
    totalFirebaseUsers: 0,
    syncedNewUsers: 0,
    updatedExistingUsers: 0,
    skippedUsers: 0,
    errors: [],
  };

  try {
    if (!admin.apps.length || !admin.auth) {
      console.log("[UserSync] Firebase Admin not initialized; skipping historical user sync.");
      return stats;
    }

    console.log("[UserSync] 🔄 Starting historical user synchronization from Firebase Auth...");

    let nextPageToken: string | undefined = undefined;

    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      stats.totalFirebaseUsers += listUsersResult.users.length;

      for (const userRecord of listUsersResult.users) {
        try {
          const email = userRecord.email?.toLowerCase().trim();
          const firebaseId = userRecord.uid;
          const displayName = userRecord.displayName || email?.split("@")[0] || `user_${firebaseId.slice(0, 8)}`;
          const avatar = userRecord.photoURL || null;

          // 1. Check if user already exists by firebaseId
          let existingUser = await storage.getUserByFirebaseId(firebaseId);

          // 2. If not found by firebaseId, check by email
          if (!existingUser && email) {
            existingUser = await storage.getUserByEmail(email);
          }

          if (existingUser) {
            // Update firebaseId if it was missing
            if (!existingUser.firebaseId || existingUser.firebaseId !== firebaseId) {
              await storage.updateUser(existingUser.id, {
                firebaseId,
                displayName: existingUser.displayName || displayName,
                avatar: existingUser.avatar || avatar || undefined,
              });
              stats.updatedExistingUsers++;
            } else {
              stats.skippedUsers++;
            }
          } else {
            // Create clean username from email or displayName
            let username = (userRecord.displayName || email?.split("@")[0] || `user_${firebaseId.slice(0, 6)}`)
              .toLowerCase()
              .replace(/[^a-z0-9_-]/g, "_")
              .slice(0, 18);

            // Ensure username uniqueness
            const existingWithUsername = await storage.getUserByUsername(username);
            if (existingWithUsername) {
              username = `${username.slice(0, 12)}_${Math.floor(1000 + Math.random() * 9000)}`;
            }

            // Create new database user record
            const randomSecretPassword = crypto.randomBytes(24).toString("hex");
            const newUser = await storage.createUser({
              username,
              password: randomSecretPassword,
              email: email || `${firebaseId}@firebase.savgent.com`,
              displayName,
              avatar: avatar || undefined,
              firebaseId,
              role: "user",
              isGuest: false,
            });

            // Provision Soca Passport profile if not exists
            try {
              const passport = await storage.getPassportProfileByUserId(newUser.id);
              if (!passport) {
                await storage.createPassportProfile({
                  userId: newUser.id,
                  totalPoints: 100, // Starter carnival points
                  currentTier: "BRONZE",
                });
              }
            } catch (err) {
              console.warn(`[UserSync] Could not provision passport for user ${newUser.id}:`, err);
            }

            stats.syncedNewUsers++;
            console.log(`[UserSync] ✅ Synced user: ${displayName} (${email || firebaseId}) -> DB ID: ${newUser.id}`);
          }
        } catch (userErr: any) {
          const errMsg = `Error syncing user ${userRecord.uid}: ${userErr.message}`;
          console.error(`[UserSync] ❌ ${errMsg}`);
          stats.errors.push(errMsg);
        }
      }

      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(
      `[UserSync] 🏁 Sync complete! Total: ${stats.totalFirebaseUsers} | New: ${stats.syncedNewUsers} | Updated: ${stats.updatedExistingUsers} | Unchanged: ${stats.skippedUsers}`
    );
  } catch (error: any) {
    console.error("[UserSync] Fatal error during user synchronization:", error);
    stats.errors.push(error.message);
  }

  return stats;
}
