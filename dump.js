const { Client } = require('pg');
const fs = require('fs');

const localConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'dj35mnit',
  database: 'quarry_system',
};

async function dump() {
  const client = new Client(localConfig);
  await client.connect();

  // Get all table names in public schema
  const tablesResult = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
  );
  const tables = tablesResult.rows.map(r => r.tablename);

  let sql = '';
  
  // Disable triggers and foreign keys temporarily
  sql += 'BEGIN;\n';
  sql += 'SET session_replication_role = replica;\n\n';

  for (const table of tables) {
    console.log(`Processing ${table}...`);
    
    // Get column info
    const columnsResult = await client.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name='${table}' AND table_schema='public'
       ORDER BY ordinal_position`
    );
    const columns = columnsResult.rows.map(c => c.column_name);
    const quotedColumns = columns.map(c => `"${c}"`).join(', ');

    // Get data
    const dataResult = await client.query(`SELECT * FROM "${table}"`);
    
    if (dataResult.rows.length === 0) {
      // Only create table, no inserts
      const createStmt = await client.query(
        `SELECT pg_get_tabledef('${table}') as def`
      );
      sql += createStmt.rows[0].def + ';\n\n';
      continue;
    }

    // Create table (simplified: we'll rely on the fact that the table exists locally,
    // we can get the CREATE TABLE definition via pg_get_tabledef)
    const createDef = await client.query(
      `SELECT pg_get_tabledef('${table}') as def`
    );
    sql += createDef.rows[0].def + ';\n\n';

    // Generate INSERT statements
    const placeholders = columns.map((_, i) => `$${i+1}`).join(', ');
    for (const row of dataResult.rows) {
      const values = columns.map(col => row[col]);
      const escaped = values.map(val => {
        if (val === null) return 'NULL';
        if (typeof val === 'boolean') return val ? 'true' : 'false';
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          // Escape single quotes
          return `'${val.replace(/'/g, "''")}'`;
        }
        if (val instanceof Date) {
          return `'${val.toISOString()}'`;
        }
        return `'${String(val).replace(/'/g, "''")}'`;
      });
      sql += `INSERT INTO "${table}" (${quotedColumns}) VALUES (${escaped.join(', ')});\n`;
    }
    sql += '\n';
  }

  // Restore triggers
  sql += 'SET session_replication_role = DEFAULT;\n';
  sql += 'COMMIT;\n';

  await client.end();
  fs.writeFileSync('backup.sql', sql);
  console.log('✅ backup.sql created successfully!');
}

dump().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});