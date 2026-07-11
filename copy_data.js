const { Client } = require('pg');

// Local database config
const localConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'dj35mnit',
  database: 'quarry_system',
};

// Neon connection string from environment
const neonUrl = process.env.DATABASE_URL;
if (!neonUrl) {
  console.error('❌ Please set DATABASE_URL environment variable to your Neon URL');
  process.exit(1);
}

// All tables to copy (excluding schema_migrations)
const tables = [
  'activity_logs', 'attendance', 'audit_logs', 'branch_settings', 'branches',
  'categories', 'contact_messages', 'departments', 'faq_items', 'inventory',
  'knowledge_base', 'leave_requests', 'notifications', 'order_items', 'orders',
  'otp_attempts', 'otp_codes', 'otp_store', 'performance_reviews', 'permissions',
  'products', 'public_orders', 'role_dashboard_config', 'role_permissions', 'roles',
  'salary_history', 'shifts', 'stock_logs', 'stock_movements',
  'support_attachments', 'support_messages', 'support_replies', 'support_tickets',
  'system_settings', 'team_members', 'user_activity', 'user_preferences',
  'users', 'worker_documents', 'worker_shifts', 'workers'
];

async function copyData() {
  const localClient = new Client(localConfig);
  const neonClient = new Client({ connectionString: neonUrl });

  console.log('🔄 Connecting to databases...');
  await localClient.connect();
  await neonClient.connect();
  console.log('✅ Connected.');

  for (const table of tables) {
    console.log(`📋 Copying table: ${table}...`);

    const res = await localClient.query(`SELECT * FROM "${table}"`);
    const rows = res.rows;

    if (rows.length === 0) {
      console.log(`   ⏩ Table "${table}" is empty, skipping.`);
      continue;
    }

    const columns = Object.keys(rows[0]);
    const placeholders = columns.map((_, i) => `$${i+1}`).join(', ');
    const colsQuoted = columns.map(c => `"${c}"`).join(', ');
    const insertQuery = `INSERT INTO "${table}" (${colsQuoted}) VALUES (${placeholders})`;

    let inserted = 0;
    let skipped = 0;
    for (const row of rows) {
      const values = columns.map(col => row[col]);
      try {
        await neonClient.query(insertQuery, values);
        inserted++;
      } catch (err) {
        // If it's a duplicate key error, skip; otherwise log.
        if (err.code === '23505') { // unique violation
          skipped++;
        } else {
          console.error(`   ❌ Error on ${table}: ${err.message}`);
        }
      }
    }
    console.log(`   ✅ Inserted ${inserted}, skipped ${skipped} (duplicates).`);
  }

  console.log('🎉 Data copy completed!');
  await localClient.end();
  await neonClient.end();
}

copyData().catch(err => {
  console.error('💥 Fatal error:', err.message);
  process.exit(1);
});