
import 'dotenv/config';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function createAdmin() {
    try {
        const hashedPassword = await hashPassword('password123');

        // Check if user exists
        const [existing] = await db.select().from(users).where(eq(users.username, 'admin_demo'));

        if (existing) {
            await db.update(users).set({
                role: 'admin',
                password: hashedPassword
            }).where(eq(users.id, existing.id));
            console.log('Updated admin_demo user');
        } else {
            await db.insert(users).values({
                username: 'admin_demo',
                password: hashedPassword,
                role: 'admin',
                email: 'admin_demo@test.com',
                displayName: 'Admin Demo'
            });
            console.log('Created admin_demo user');
        }

        console.log('Credentials: admin_demo / password123');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

createAdmin();
