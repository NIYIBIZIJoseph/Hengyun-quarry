const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env.local without dotenv dependency
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
      }
    }
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:dj35mnit@localhost:5432/quarry_system',
});

async function runMigrations() {
  const args = process.argv.slice(2);
  const seedMode = args.includes('--seed');
  const freshMode = args.includes('--fresh');

  const client = await pool.connect();

  try {
    if (freshMode) {
      console.log('Dropping all tables...');
      await client.query(`
        DO $$ DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
        END $$;
      `);
      console.log('All tables dropped.');
    }

    const migrationSQL = fs.readFileSync(
      path.resolve(__dirname, 'migration.sql'),
      'utf8'
    );

    console.log('Running migration...');
    await client.query(migrationSQL);
    console.log('Migration complete.');

    if (seedMode) {
      const seedSQL = fs.readFileSync(
        path.resolve(__dirname, 'seed.sql'),
        'utf8'
      );
      console.log('Running seed...');
      await client.query(seedSQL);
      console.log('Seed complete.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
