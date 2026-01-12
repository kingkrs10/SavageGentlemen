
import { db } from "../lib/db";
import { users } from "../../shared/schema";
import { desc } from "drizzle-orm";

async function main() {
    console.log("Testing Database Connection...");
    try {
        const result = await db.select().from(users).limit(1);
        console.log("✅ Database connected successfully.");
        console.log("User count found:", result.length);
        if (result.length > 0) {
            console.log("Sample user:", result[0]);
        } else {
            console.log("No users found in table.");
        }
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        process.exit(1);
    }
    process.exit(0);
}

main();
