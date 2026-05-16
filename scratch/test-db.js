import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const res = await pool.query('SELECT * FROM events');
    console.log("Events:", res.rows);

    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', ['shaunteljunk@gmail.com']);
    console.log("User:", userRes.rows);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    pool.end();
  }
}

main();
