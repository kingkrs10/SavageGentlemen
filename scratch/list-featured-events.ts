
import { db } from '../server/db';
import { events } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function listFeaturedEvents() {
  try {
    const featuredEvents = await db
      .select()
      .from(events)
      .where(eq(events.featured, true));
    
    console.log(JSON.stringify(featuredEvents, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

listFeaturedEvents();
