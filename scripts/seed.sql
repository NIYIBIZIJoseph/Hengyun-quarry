-- ============================================================================
-- HENG YUN ERP — Seed Data
-- Database: quarry_system
-- ============================================================================

-- ============================================================================
-- 1. ROLES
-- ============================================================================
INSERT INTO roles (name, description) VALUES
  ('superadmin', 'Super Administrator — full system access'),
  ('admin', 'Administrator — branch-level management'),
  ('supervisor', 'Supervisor — daily operations oversight'),
  ('service_provider', 'Service Provider — limited service access')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. PERMISSIONS (RBAC — fully DB-driven, no hardcoding)
-- ============================================================================
INSERT INTO permissions (name, description) VALUES
  -- User management
  ('users:view', 'View user list and details'),
  ('users:create', 'Create new users'),
  ('users:edit', 'Edit existing users'),
  ('users:delete', 'Delete/disable users'),

  -- Role management
  ('roles:view', 'View roles and their permissions'),
  ('roles:manage', 'Create/edit/delete roles and assign permissions'),

  -- Product management
  ('product:view', 'View product catalog'),
  ('product:create', 'Create new products'),
  ('product:edit', 'Edit existing products'),
  ('product:delete', 'Delete products'),

  -- Order management
  ('order:view', 'View orders'),
  ('order:create', 'Create new orders'),
  ('order:edit', 'Edit existing orders'),
  ('order:delete', 'Delete/void orders'),
  ('order:approve', 'Approve/reject orders'),

  -- Worker management
  ('worker:view', 'View worker list and details'),
  ('worker:create', 'Add new workers'),
  ('worker:edit', 'Edit worker information'),
  ('worker:delete', 'Remove/archive workers'),

  -- Attendance management
  ('attendance:view', 'View attendance records'),
  ('attendance:mark', 'Mark attendance'),
  ('attendance:override', 'Override attendance records'),
  ('attendance:export', 'Export attendance reports'),

  -- Inventory management
  ('inventory:view', 'View inventory levels'),
  ('inventory:adjust', 'Adjust stock quantities'),
  ('inventory:manage', 'Configure inventory settings'),

  -- Support management
  ('support:view', 'View support tickets'),
  ('support:respond', 'Respond to tickets'),
  ('support:manage', 'Manage ticket assignments and categories'),

  -- FAQ management
  ('faq:view', 'View FAQ items'),
  ('faq:manage', 'Create/edit/delete FAQ items'),

  -- Analytics
  ('analytics:view', 'View operational analytics'),
  ('analytics:financial', 'View financial analytics'),
  ('analytics:export', 'Export analytics reports'),

  -- Team management
  ('team:view', 'View team members'),
  ('team:manage', 'Manage team members'),

  -- Settings
  ('settings:view', 'View system settings'),
  ('settings:manage', 'Modify system settings'),
  ('settings:security', 'Manage security settings'),

  -- Audit
  ('audit:view', 'View audit logs'),
  ('audit:export', 'Export audit logs'),

  -- Branch management
  ('branch:view', 'View branch list'),
  ('branch:manage', 'Manage branches and settings'),

  -- Department management
  ('department:view', 'View departments'),
  ('department:manage', 'Manage departments'),

  -- Notifications
  ('notification:view', 'View notifications'),
  ('notification:send', 'Send notifications'),
  ('notification:manage', 'Configure notification settings'),

  -- Reports
  ('report:view', 'View reports'),
  ('report:generate', 'Generate custom reports'),

  -- Contact messages
  ('contact:view', 'View contact form submissions'),
  ('contact:respond', 'Respond to contact messages'),

  -- Knowledge base
  ('knowledge:view', 'View knowledge base articles'),
  ('knowledge:manage', 'Create/edit/delete knowledge base articles'),

  -- Leave management
  ('leave:view', 'View leave requests'),
  ('leave:approve', 'Approve/reject leave requests'),

  -- Performance reviews
  ('performance:view', 'View performance reviews'),
  ('performance:manage', 'Create/edit performance reviews'),

  -- Salary
  ('salary:view', 'View salary information'),
  ('salary:manage', 'Manage salary data'),

  -- Stock
  ('stock:view', 'View stock movements'),
  ('stock:manage', 'Manage stock adjustments'),

  -- Dashboard
  ('dashboard:view', 'Access main dashboard'),
  ('dashboard:customize', 'Customize dashboard layout'),

  -- System
  ('system:maintenance', 'Toggle maintenance mode'),
  ('system:backup', 'Perform system backup'),
  ('system:clear-cache', 'Clear system cache')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. ROLE-PERMISSION ASSIGNMENTS
-- ============================================================================

-- Superadmin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'superadmin'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Admin: most permissions (except system-level)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
  AND p.name NOT IN (
    'roles:manage',
    'system:maintenance',
    'system:backup',
    'system:clear-cache',
    'audit:export',
    'settings:security'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Supervisor: operational permissions only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'supervisor'
  AND p.name IN (
    'product:view', 'product:edit',
    'order:view', 'order:create', 'order:edit',
    'worker:view',
    'attendance:view', 'attendance:mark',
    'inventory:view', 'inventory:adjust',
    'support:view', 'support:respond',
    'dashboard:view',
    'notification:view',
    'report:view'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Service Provider: minimal access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'service_provider'
  AND p.name IN (
    'order:view', 'order:create',
    'support:view', 'support:respond',
    'dashboard:view',
    'notification:view'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- ============================================================================
-- 4. BRAANCHES
-- ============================================================================
INSERT INTO branches (name, location, phone, email, is_active) VALUES
  ('Main Branch — Kigali', 'KG 123 St, Kigali, Rwanda', '+250 786 592 766', 'info@hengyun.rw', TRUE),
  ('Eastern Branch — Rwamagana', 'RW 45 Ave, Rwamagana, Rwanda', '+250 788 123 456', 'eastern@hengyun.rw', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. CATEGORIES
-- ============================================================================
INSERT INTO categories (name, description) VALUES
  ('sand', 'Sand products for construction'),
  ('quarry', 'Quarry and aggregate products'),
  ('stone', 'Natural stone products'),
  ('gravel', 'Gravel and crushed stone'),
  ('fill', 'Fill materials and earth products')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. DEPARTMENTS
-- ============================================================================
INSERT INTO departments (name, description) VALUES
  ('Operations', 'Quarry operations and extraction'),
  ('Sales', 'Sales and customer relations'),
  ('Logistics', 'Transportation and delivery'),
  ('Administration', 'Administrative support'),
  ('Finance', 'Financial management'),
  ('Maintenance', 'Equipment and facility maintenance'),
  ('Quality Control', 'Product quality assurance')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. DEFAULT SHIFTS
-- ============================================================================
INSERT INTO shifts (name, start_time, end_time) VALUES
  ('Morning', '06:00', '14:00'),
  ('Afternoon', '14:00', '22:00'),
  ('Night', '22:00', '06:00'),
  ('General', '08:00', '17:00')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. DEFAULT SETTINGS
-- ============================================================================
INSERT INTO system_settings (key, value, description) VALUES
  ('company_name', 'HENG YUN ERP', 'Company display name'),
  ('company_phone', '+250 786 592 766', 'Company phone number'),
  ('company_email', 'info@hengyun.rw', 'Company email address'),
  ('company_address', 'KG 123 St, Kigali, Rwanda', 'Company physical address'),
  ('whatsapp_number', '250786592766', 'WhatsApp business number'),
  ('currency', 'RWF', 'Default currency'),
  ('currency_symbol', 'FRW', 'Currency symbol'),
  ('timezone', 'Africa/Kigali', 'System timezone'),
  ('date_format', 'YYYY-MM-DD', 'Date display format'),
  ('maintenance_mode', 'false', 'System maintenance mode'),
  ('items_per_page', '20', 'Default pagination count'),
  ('session_timeout', '3600', 'Session timeout in seconds'),
  ('password_min_length', '8', 'Minimum password length'),
  ('max_login_attempts', '5', 'Maximum login attempts before lockout'),
  ('otp_expiry_seconds', '300', 'OTP code expiry in seconds'),
  ('low_stock_alert', 'true', 'Enable low stock alerts'),
  ('auto_absent_marking', 'true', 'Auto-mark absent workers'),
  ('attendance_cutoff_time', '09:00', 'Late arrival cutoff time'),
  ('enable_2fa', 'true', 'Enable two-factor authentication'),
  ('default_language', 'en', 'Default system language'),
  ('supported_languages', 'en,rw,zh', 'Comma-separated supported languages')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 9. SYSTEM MAINTENANCE FUNCTIONS
-- ============================================================================

-- Refresh role_permissions materialized convenience (for quick lookups)
CREATE OR REPLACE VIEW v_user_permissions AS
SELECT
  u.id AS user_id,
  u.full_name,
  r.name AS role_name,
  COALESCE(jsonb_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL), '[]'::jsonb) AS permissions
FROM users u
JOIN roles r ON r.id = u.role_id
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.full_name, r.name;

-- ============================================================================
-- END OF SEED
-- ============================================================================
