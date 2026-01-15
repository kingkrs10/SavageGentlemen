
import { db } from "../src/lib/db";
import { users } from "../src/shared/schema";
import { sql } from "drizzle-orm";

async function verifyConnection() {
    try {
        console.log("Testing database connection...");

        // 1. Test raw connection
        console.log("Step 1: Raw query test 'SELECT 1'"); // Simple ping
        const result = await db.execute(sql`SELECT 1 as connected`);
        console.log("✅ Connection successful:", result.rows);

        // 2. Test schema query
        console.log("Step 2: Querying 'users' table");
        const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
        console.log("✅ Users table exists. Count:", userCount[0].count);

        process.exit(0);
    } catch (error: any) {
        console.error("❌ Database verification failed:");
        console.error(error);
        console.error("Message:", error.message);
        if (error.code) console.error("Code:", error.code); // PG error codes
        process.exit(1);
    }
}

verifyConnection();
