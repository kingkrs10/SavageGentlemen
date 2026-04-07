
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/shared/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const results: any = {};

        // 1. Check Table Existence
        try {
            const tableCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);
            results.tableExists = tableCheck.rows[0];
        } catch (e: any) {
            results.tableExists = { error: e.message };
        }

        // 2. Check Columns in Real DB
        try {
            const columnsCheck = await db.execute(sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users';
      `);
            results.actualColumns = columnsCheck.rows.map((r: any) => r.column_name);
        } catch (e: any) {
            results.actualColumns = { error: e.message };
        }

        // 3. Attempt Drizzle Query (Select * equivalent)
        try {
            const userCheck = await db.select().from(users).limit(1);
            results.drizzleQuery = { success: true, rows: userCheck.length };
        } catch (e: any) {
            results.drizzleQuery = {
                success: false,
                error: e.message,
                code: e.code,
                detail: e.detail
            };
        }

        // 4. List Expected Columns (from Code)
        // We manually list what we think we are asking for based on the error query
        results.expectedColumnsInQuery = [
            "id", "username", "display_name", "email", "password",
            "avatar", "bio", "location", "website", "role",
            "is_guest", "firebase_uid", "created_at", "updated_at"
        ];

        // Determine Missing Columns
        if (Array.isArray(results.actualColumns)) {
            results.missingColumns = results.expectedColumnsInQuery.filter(
                (col: string) => !results.actualColumns.includes(col)
            );
        }

        return NextResponse.json({
            status: results.missingColumns?.length ? 'mismatch' : 'analysis_complete',
            summary: results.missingColumns?.length
                ? `CRITICAL: The database is missing columns: ${results.missingColumns.join(', ')}`
                : "Database structure seems correct.",
            details: results
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
