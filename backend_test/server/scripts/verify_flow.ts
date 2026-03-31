
import 'dotenv/config';
import { db } from '../db';
import { adminPassportService } from '../admin-passport-service';
import { promoters, events, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function verifyFlow() {
    try {
        console.log('Starting verification flow...');

        // 1. Create a dummy user for the promoter
        const email = `promoter${Date.now()}@test.com`;
        const [user] = await db.insert(users).values({
            username: `promoter${Date.now()}`,
            password: 'password123', // Dummy
            email: email,
            role: 'promoter'
        }).returning();

        console.log(`Created dummy user: ${user.id} (${email})`);

        // 2. Create a pending promoter application
        const [promoter] = await db.insert(promoters).values({
            userId: user.id,
            name: "Test Promoter Agency",
            email: email,
            organization: "Test Org",
            locationCity: "Test City",
            locationCountry: "US",
            status: "PENDING"
        }).returning();

        console.log(`Created pending promoter: ${promoter.id}`);

        // 3. Approve the promoter
        console.log('Approving promoter...');
        const updatedPromoter = await adminPassportService.updatePromoterStatus(promoter.id, 'APPROVED');

        // 4. Verify status
        if (updatedPromoter?.status !== 'APPROVED') {
            throw new Error('Promoter status update failed');
        }
        console.log('Promoter status updated to APPROVED');

        // 5. Check for created event
        const event = await db.query.events.findFirst({
            where: eq(events.organizerEmail, email)
        });

        if (!event) {
            throw new Error('Event was NOT created!');
        }

        console.log('SUCCESS: Event created!');
        console.log(`Event ID: ${event.id}`);
        console.log(`Title: ${event.title}`);
        console.log(`Access Code: ${event.accessCode}`);

        if (event.accessCode && event.accessCode.startsWith('PRO-')) {
            console.log('Access code format correct.');
        } else {
            console.error('Access code format incorrect:', event.accessCode);
        }

        // Clean up? Maybe leave it for inspection.
        process.exit(0);
    } catch (error) {
        console.error('Verification FAILED:', error);
        process.exit(1);
    }
}

verifyFlow();
