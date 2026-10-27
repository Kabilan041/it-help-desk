/**
 * Database Connection Module for Paramount Textile Mills (P) Ltd IT Help Desk
 * Uses 'pg' connection pool configured via environment variables.
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || '127.0.0.1',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'it_helpdesk_db',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  max: parseInt(process.env.PG_MAX_POOL || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB Error] Unexpected idle client error:', err.message);
});

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('[DB Query]', { text: text.substring(0, 80), duration: `${duration}ms`, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('[DB Query Error]', { text: text.substring(0, 100), error: error.message });
    throw error;
  }
}

async function getClient() {
  const client = await pool.connect();
  return client;
}

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() AS current_time, current_database() AS db_name');
    console.log(`[DB Connected] Successfully connected to PostgreSQL: ${res.rows[0].db_name} at ${res.rows[0].current_time}`);
    return true;
  } catch (err) {
    console.error(`[DB Connection Failed] ${err.message}`);
    return false;
  }
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection
};
