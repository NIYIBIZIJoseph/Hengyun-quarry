// scripts/add-recycle-permissions.js
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// ✅ Parse .env.local manually
function parseEnvFile(filePath) {
  const envVars = {};
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          // Remove quotes if present
          envVars[key.trim()] = value.replace(/^['"]|['"]$/g, '');
        }
      }
    }
  } catch (error) {
    console.log('⚠️  Could not read .env.local file:', error.message);
  }
  return envVars;
}

// ✅ Load environment
const envPath = path.resolve(__dirname, '../.env.local');
console.log('📂 Loading .env.local from:', envPath);

const envVars = parseEnvFile(envPath);

// ✅ Use DATABASE_URL
const databaseUrl = envVars.DATABASE_URL || envVars.DATABASE_URL;

if (!databaseUrl) {
  console.error('\n❌ ERROR: DATABASE_URL not found in .env.local!');
  console.log('Please make sure your .env.local contains:');
  console.log('  DATABASE_URL=postgres://postgres:password@localhost:5432/quarry_system');
  process.exit(1);
}

console.log('📋 Database URL found:', databaseUrl.replace(/:[^:@]*@/, ':****@'));

// ✅ Create connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  max: 5,
  // Add timeout for connection issues
  connectionTimeoutMillis: 5000,
});

async function addRecyclePermissions() {
  let client;
  try {
    console.log('🔌 Connecting to database...');
    client = await pool.connect();
    console.log('✅ Connected to database successfully!');

    await client.query('BEGIN');

    console.log('\n🔄 Adding recycle permissions...');

    // ✅ 1. Check if permissions table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'permissions'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('⚠️  Permissions table does not exist!');
      console.log('Please run migrations first.');
      await client.query('ROLLBACK');
      return;
    }

    // ✅ 2. Check if permissions already exist
    const existingPerms = await client.query(
      `SELECT name FROM permissions WHERE name LIKE 'recycle:%'`
    );
    const existingNames = existingPerms.rows.map(row => row.name);
    console.log(`📋 Existing recycle permissions: ${existingNames.join(', ') || 'none'}`);

    // ✅ 3. Insert the new permissions
    const recyclePermissions = [
      { name: 'recycle:view', description: 'View items in recycle bin' },
      { name: 'recycle:restore', description: 'Restore items from recycle bin' },
      { name: 'recycle:delete', description: 'Permanently delete items from recycle bin' },
      { name: 'recycle:bulk-delete', description: 'Bulk delete items from recycle bin' },
    ];

    const permissionIds = [];

    for (const perm of recyclePermissions) {
      // Check if permission already exists
      const checkResult = await client.query(
        `SELECT id FROM permissions WHERE name = $1`,
        [perm.name]
      );

      let id;
      if (checkResult.rows.length > 0) {
        // Update existing
        await client.query(
          `UPDATE permissions SET description = $1 WHERE name = $2`,
          [perm.description, perm.name]
        );
        id = checkResult.rows[0].id;
        console.log(`✅ Updated permission: ${perm.name}`);
      } else {
        // Insert new
        const result = await client.query(
          `INSERT INTO permissions (name, description) 
           VALUES ($1, $2) 
           RETURNING id`,
          [perm.name, perm.description]
        );
        id = result.rows[0].id;
        console.log(`✅ Added permission: ${perm.name}`);
      }

      permissionIds.push({
        id: id,
        name: perm.name
      });
    }

    // ✅ 4. Get roles
    const rolesResult = await client.query(
      `SELECT id, name FROM roles WHERE name IN ('SUPERADMIN', 'ADMIN', 'MANAGER')`
    );

    console.log(`\n📋 Found roles: ${rolesResult.rows.map(r => r.name).join(', ')}`);

    if (rolesResult.rows.length === 0) {
      console.log('⚠️  No roles found! Please create roles first.');
      await client.query('ROLLBACK');
      return;
    }

    // ✅ 5. Assign permissions to roles
    for (const role of rolesResult.rows) {
      let permsToAssign = [];

      if (role.name === 'SUPERADMIN') {
        // SUPERADMIN gets ALL recycle permissions
        permsToAssign = permissionIds.map(p => p.id);
      } else if (role.name === 'ADMIN') {
        // ADMIN gets view, restore, delete (but not bulk-delete)
        permsToAssign = permissionIds
          .filter(p => p.name !== 'recycle:bulk-delete')
          .map(p => p.id);
      } else if (role.name === 'MANAGER') {
        // MANAGER gets view and restore only
        permsToAssign = permissionIds
          .filter(p => p.name === 'recycle:view' || p.name === 'recycle:restore')
          .map(p => p.id);
      }

      let assignedCount = 0;
      for (const permId of permsToAssign) {
        try {
          const result = await client.query(
            `INSERT INTO role_permissions (role_id, permission_id) 
             VALUES ($1, $2) 
             ON CONFLICT (role_id, permission_id) DO NOTHING
             RETURNING id`,
            [role.id, permId]
          );
          if (result.rows.length > 0) {
            assignedCount++;
          }
        } catch (err) {
          // If table doesn't have conflict constraint, try without
          if (err.code === '42P01' || err.message.includes('does not exist')) {
            console.log('⚠️  role_permissions table might not have UNIQUE constraint');
            await client.query(
              `INSERT INTO role_permissions (role_id, permission_id) 
               VALUES ($1, $2)`,
              [role.id, permId]
            );
            assignedCount++;
          } else {
            throw err;
          }
        }
      }
      console.log(`✅ Assigned ${assignedCount} recycle permissions to ${role.name}`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Recycle permissions added successfully!');

    // ✅ 6. Show summary
    console.log('\n📊 Permission Summary:');
    const summary = await client.query(`
      SELECT p.name, COUNT(rp.role_id) as role_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE p.name LIKE 'recycle:%'
      GROUP BY p.name
      ORDER BY p.name
    `);
    if (summary.rows.length === 0) {
      console.log('  No recycle permissions found.');
    } else {
      summary.rows.forEach(row => {
        console.log(`  ${row.name}: ${row.role_count} role(s)`);
      });
    }

    // ✅ 7. Show which users have these permissions
    console.log('\n👤 Users with recycle permissions:');
    const users = await client.query(`
      SELECT DISTINCT u.id, u.full_name, r.name as role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'SUPERADMIN' 
         OR r.name = 'ADMIN'
      LIMIT 10
    `);
    if (users.rows.length > 0) {
      users.rows.forEach(user => {
        console.log(`  ${user.full_name} (${user.role})`);
      });
    } else {
      console.log('  No users found with recycle permissions');
    }

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('\n❌ Error adding permissions:', error.message);
    if (error.code) {
      console.error(`  Code: ${error.code}`);
    }
    if (error.detail) {
      console.error(`  Detail: ${error.detail}`);
    }
    if (error.stack) {
      console.error(`  Stack: ${error.stack}`);
    }
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the script
addRecyclePermissions();