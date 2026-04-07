
import 'dotenv/config';
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function run() {
    console.log("Inspecting passport_achievement_definitions...");
    try {
        // Check columns
        const cols = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'passport_achievement_definitions';
        `);
        console.log("Columns:", cols.rows);

        // Check indexes
        const indexes = await db.execute(sql`
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'passport_achievement_definitions';
        `);
        console.log("Indexes:", indexes.rows);

        // Check data for duplicates
        // We use a safe select * assuming the table isn't huge
        const data = await db.execute(sql`SELECT * FROM passport_achievement_definitions`);
        console.log("Data Sample (first 5):", data.rows.slice(0, 5));

        // Check strictly for bad category data if column exists
        const hasCategory = cols.rows.some((c: any) => c.column_name === 'category');
        if (hasCategory) {
            const dupes = await db.execute(sql`
                SELECT category, COUNT(*) 
                FROM passport_achievement_definitions 
                GROUP BY category 
                HAVING COUNT(*) > 1
             `);
            console.log("Duplicate Categories:", dupes.rows);
        }

    } catch (e) {
        console.error("Error inspecting DB:", e);
    }
    process.exit(0);
}

run();
