
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const start = Date.now();
        // Use raw SQL to test connection
        await db.execute(sql`SELECT 1`);
        const duration = Date.now() - start;

        return NextResponse.json({
            status: 'healthy',
            message: 'Database connection successful',
            duration: `${duration}ms`,
            env: {
                node_env: process.env.NODE_ENV,
                has_db_url: !!process.env.DATABASE_URL
            }
        });
    } catch (error: any) {
        console.error('Database health check failed:', error);

        // Extract nested cause if it exists (common in Drizzle)
        const cause = error.cause || undefined;

        return NextResponse.json({
            status: 'unhealthy',
            message: error.message,
            code: error.code,
            cause: cause ? {
                message: cause.message,
                code: cause.code,
                detail: cause.detail,
                hint: cause.hint
            } : undefined,
            full_error: process.env.NODE_ENV === 'development' ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : undefined
        }, { status: 500 });
    }
}
