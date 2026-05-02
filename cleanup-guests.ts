import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function query(sql: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

/** Check if a table exists in the public schema */
async function tableExists(tableName: string): Promise<boolean> {
  const res = await query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [tableName]
  );
  return res.rows[0].exists;
}

/** Safely delete rows from a table, skipping if the table doesn't exist */
async function safeDelete(tableName: string, column: string, value: any) {
  if (!(await tableExists(tableName))) {
    console.log(`  ⏭ Skipping "${tableName}" (table does not exist)`);
    return 0;
  }
  try {
    const res = await query(`DELETE FROM "${tableName}" WHERE "${column}" = $1`, [value]);
    if (res.rowCount && res.rowCount > 0) {
      console.log(`  🗑 Deleted ${res.rowCount} row(s) from "${tableName}"`);
    }
    return res.rowCount || 0;
  } catch (err: any) {
    // Column doesn't exist — skip silently
    if (err.code === '42703') {
      console.log(`  ⏭ Skipping "${tableName}" (column "${column}" does not exist)`);
      return 0;
    }
    console.error(`  ⚠️ Error deleting from "${tableName}":`, err.message);
    return 0;
  }
}

async function deleteGuestUser(userId: number, firebaseId: string | null) {
  console.log(`\n  Cascade deleting related data for user ${userId}...`);

  // 1. Auth & Security
  await safeDelete('password_reset_tokens', 'user_id', userId);

  // 2. Communications
  await safeDelete('email_subscribers', 'user_id', userId);

  // 3. AI Features
  await safeDelete('ai_assistant_configs', 'user_id', userId);
  await safeDelete('ai_chat_sessions', 'user_id', userId);

  // 4. Social & Passport
  await safeDelete('passport_social_shares', 'user_id', userId);
  await safeDelete('passport_stamps', 'user_id', userId);
  await safeDelete('passport_profiles', 'user_id', userId);
  await safeDelete('passport_memberships', 'user_id', userId);
  await safeDelete('passport_credit_transactions', 'created_by', userId);
  await safeDelete('passport_user_redemptions', 'redeemed_by', userId);
  await safeDelete('passport_qr_checkins', 'user_id', userId);

  // 5. Purchases & Orders
  await safeDelete('music_mix_purchases', 'user_id', userId);
  await safeDelete('ticket_scans', 'user_id', userId);

  // Ticket transfers (user can be sender or receiver)
  if (await tableExists('ticket_transfers')) {
    try {
      await query(`DELETE FROM "ticket_transfers" WHERE "from_user_id" = $1 OR "to_user_id" = $1`, [userId]);
    } catch (err: any) {
      console.log(`  ⏭ Skipping ticket_transfers: ${err.message}`);
    }
  }

  await safeDelete('ticket_refunds', 'user_id', userId);
  await safeDelete('ticket_purchases', 'user_id', userId);

  // Orders (delete items first, then orders)
  if (await tableExists('orders')) {
    try {
      const ordersRes = await query(`SELECT id FROM "orders" WHERE "user_id" = $1`, [userId]);
      const orderIds = ordersRes.rows.map((r: any) => r.id);
      if (orderIds.length > 0 && await tableExists('order_items')) {
        await query(`DELETE FROM "order_items" WHERE "order_id" = ANY($1)`, [orderIds]);
      }
      await query(`DELETE FROM "orders" WHERE "user_id" = $1`, [userId]);
    } catch (err: any) {
      console.log(`  ⏭ Skipping orders: ${err.message}`);
    }
  }

  // 6. Content
  await safeDelete('comments', 'user_id', userId);
  await safeDelete('chat_messages', 'user_id', userId);
  await safeDelete('posts', 'user_id', userId);
  await safeDelete('music_mixes', 'uploaded_by', userId);
  await safeDelete('sponsored_content', 'created_by', userId);
  await safeDelete('inventory_history', 'user_id', userId);

  // 7. Analytics
  await safeDelete('page_views', 'user_id', userId);
  await safeDelete('user_events', 'user_id', userId);
  await safeDelete('media_access_logs', 'user_id', userId);

  // 8. Affiliates (clicks reference affiliates, so delete clicks first)
  if (await tableExists('affiliates')) {
    try {
      const affRes = await query(`SELECT id FROM "affiliates" WHERE "user_id" = $1`, [userId]);
      const affIds = affRes.rows.map((r: any) => r.id);
      if (affIds.length > 0 && await tableExists('affiliate_clicks')) {
        await query(`DELETE FROM "affiliate_clicks" WHERE "affiliate_id" = ANY($1)`, [affIds]);
      }
      await query(`DELETE FROM "affiliates" WHERE "user_id" = $1`, [userId]);
    } catch (err: any) {
      console.log(`  ⏭ Skipping affiliates: ${err.message}`);
    }
  }

  // 9. Promoter
  await safeDelete('promoter_subscriptions', 'user_id', userId);
  await safeDelete('promoter_profiles', 'user_id', userId);

  // 10. Finally delete the user record
  await query(`DELETE FROM "users" WHERE "id" = $1`, [userId]);
  console.log(`  ✅ User ${userId} deleted from database.`);

  // 11. Delete from Firebase Auth
  if (firebaseId) {
    try {
      const admin = (await import('firebase-admin')).default;
      if (admin.apps.length === 0) {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (serviceAccountPath) {
          const fs = await import('fs');
          const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
          admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        }
      }
      if (admin.apps.length > 0) {
        await admin.auth().deleteUser(firebaseId);
        console.log(`  ✅ Firebase user ${firebaseId} deleted.`);
      }
    } catch (fbErr: any) {
      // auth/user-not-found is fine — already gone
      if (fbErr?.code === 'auth/user-not-found') {
        console.log(`  ℹ️ Firebase user ${firebaseId} already deleted.`);
      } else {
        console.error(`  ⚠️ Firebase delete failed for ${firebaseId}:`, fbErr.message);
      }
    }
  }
}

async function main() {
  console.log('=== CLEANING UP GUEST ACCOUNTS ===\n');

  try {
    // Find all guest accounts
    const res = await query(`SELECT id, username, email, firebase_id FROM "users" WHERE "is_guest" = true`);
    const guestUsers = res.rows;

    if (guestUsers.length === 0) {
      console.log('✅ No guest accounts found.');
      process.exit(0);
    }

    console.log(`Found ${guestUsers.length} guest accounts. Deleting...\n`);

    let successCount = 0;
    let failCount = 0;

    for (const user of guestUsers) {
      console.log(`Deleting guest: ID ${user.id} — ${user.email || user.username}...`);
      try {
        await deleteGuestUser(user.id, user.firebase_id);
        successCount++;
      } catch (err: any) {
        console.error(`❌ Failed to delete guest ID ${user.id}:`, err.message);
        failCount++;
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`✅ Successfully deleted: ${successCount}`);
    console.log(`❌ Failed to delete: ${failCount}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
