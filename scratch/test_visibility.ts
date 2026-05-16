
import { DatabaseStorage } from "../server/storage";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  const storage = new DatabaseStorage();
  try {
    const featured = await storage.getFeaturedEvents();
    console.log("Featured events count:", featured.length);
    featured.forEach(e => {
      console.log(`- ${e.title} (ID: ${e.id}, Date: ${e.date}, Featured: ${e.featured}, Time: ${e.time})`);
    });

    const upcoming = await storage.getUpcomingEvents();
    console.log("Upcoming events count:", upcoming.length);
    upcoming.forEach(e => {
      console.log(`- ${e.title} (ID: ${e.id}, Date: ${e.date}, Featured: ${e.featured}, Time: ${e.time})`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

test();
