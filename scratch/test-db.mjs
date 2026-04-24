import pg from 'pg';
import 'dotenv/config';
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
async function test() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('DB Connection Success:', res.rows[0]);
  } catch (err) {
    console.error('DB Connection Failed:', err);
  } finally {
    await pool.end();
  }
}
test();
