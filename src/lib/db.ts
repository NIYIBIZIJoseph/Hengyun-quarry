import { Pool } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  maxUses: 7500,
});

// Keep connection alive
let keepAliveInterval: NodeJS.Timeout | null = null;
if (isProduction) {
  keepAliveInterval = setInterval(() => {
    pool.query('SELECT 1').catch(() => {});
  }, 25000);
}

// Clean up on process exit
process.on('exit', () => {
  if (keepAliveInterval) clearInterval(keepAliveInterval);
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

export default pool;