
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function main() {
    console.log("Checking Direct DB Connection...");
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error("❌ DATABASE_URL is missing from .env.local");
        process.exit(1);
    }

    console.log(`URL found (starts with): ${connectionString.substring(0, 10)}...`);

    const pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 5000,
    });

    try {
        const client = await pool.connect();
        console.log("✅ Successfully connected to Postgres!");

        const res = await client.query('SELECT NOW() as now, count(*) as count FROM users');
        console.log("Query Result:", res.rows[0]);

        client.release();
    } catch (err) {
        console.error("❌ Connection Failed:", err.message);
    } finally {
        await pool.end();
    }
}

main();
