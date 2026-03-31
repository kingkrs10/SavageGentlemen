import { db } from "./server/db";
import { DatabaseStorage } from "./server/storage";
import dotenv from "dotenv";

dotenv.config();

const storage = new DatabaseStorage();

async function run() {
    console.log("Starting getAllEvents test...");
    try {
        const events = await storage.getAllEvents();
        console.log(`Success! Retrieved ${events.length} events.`);
    } catch (error) {
        console.error("Test failed with error:");
        console.error(error);
    } finally {
        process.exit(0);
    }
}

run();
