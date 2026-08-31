const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.llizggrehojvloltegve:%23shravan123456789%40@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function verify() {
  try {
    const db = await pool.query('SELECT current_database(), current_user, version()');
    console.log('1. Connected to Supabase DB:', db.rows[0].current_database);
    
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('2. Live Public Tables in Supabase:', tables.rows.map(r => r.table_name));
    
    const users = await pool.query('SELECT username, email, role, account_status FROM users');
    console.log('3. Registered Users in Supabase:', users.rows);
  } catch (err) {
    console.error('Supabase Query Error:', err.message);
  } finally {
    await pool.end();
  }
}

verify();
