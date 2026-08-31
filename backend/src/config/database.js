const { Pool } = require('pg');
const env = require('./env');
const { mockQuery } = require('./mockDb');

let pool = null;
let useMock = false;

try {
  pool = new Pool({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 10000,
    max: 5,
    ssl: env.DATABASE_URL && (env.DATABASE_URL.includes('supabase.co') || env.DATABASE_URL.includes('pooler.supabase.com')) ? { rejectUnauthorized: false } : false
  });

  pool.on('error', (err) => {
    console.warn('[Database] PostgreSQL pool note:', err.message);
  });
} catch (err) {
  console.warn('[Database] Failed to initialize PostgreSQL pool:', err.message);
  useMock = true;
}

// Test initial connection
(async () => {
  if (pool) {
    try {
      const client = await pool.connect();
      const dbInfo = await client.query('SELECT current_database(), current_user');
      client.release();
      useMock = false;
      console.log(`✓ Connected to live PostgreSQL database (${dbInfo.rows[0].current_database}) successfully!`);
    } catch (err) {
      console.log('ℹ PostgreSQL pool connecting:', err.message);
    }
  }
})();

const query = async (text, params) => {
  if (pool) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.warn('[Database Query Fallback]:', err.message);
      return mockQuery(text, params);
    }
  }
  return mockQuery(text, params);
};

module.exports = {
  pool: {
    end: async () => {
      if (pool) {
        try { await pool.end(); } catch (_) {}
      }
    },
    query,
  },
  query,
  getClient: async () => {
    if (useMock || !pool) {
      return {
        query,
        release: () => {},
      };
    }
    try {
      return await pool.connect();
    } catch (err) {
      useMock = true;
      return {
        query,
        release: () => {},
      };
    }
  },
};
