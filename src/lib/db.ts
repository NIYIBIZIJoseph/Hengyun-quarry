import { Pool } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // ONLY enable SSL in production environments
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false,
});

export default pool;