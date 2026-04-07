
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        return NextResponse.json({ status: 'error', message: 'DATABASE_URL is missing' }, { status: 500 });
    }

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }, // Explicitly permissive SSL
        connectionTimeoutMillis: 5000,
    });

    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT 1 as connected');
            return NextResponse.json({
                status: 'success',
                message: 'Pure PG connection successful',
                rows: result.rows
            });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error("Pure PG connection failed:", error);
        return NextResponse.json({
            status: 'error',
            message: error.message,
            code: error.code,
            detail: error.detail,
            ssl_setting: 'rejectUnauthorized: false'
        }, { status: 500 });
    } finally {
        await pool.end();
    }
}
