-- ============================================================================
-- HENG YUN ERP — Complete PostgreSQL Database Schema
-- Database: quarry_system
-- Target: PostgreSQL 15+
-- Generated from PROMPT.md specifications
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. AUTH & USER TABLES
-- ============================================================================

-- 1.1 roles
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 permissions
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 1.4 branches
CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location TEXT,
  phone VARCHAR(20),
  email VARCHAR(150),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by INT
);

-- 1.5 users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100),
  phone VARCHAR(20) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  email VARCHAR(150),
  role_id INT,
  branch_id INT,
  department VARCHAR(100),
  profile_image VARCHAR(255),
  employee_code VARCHAR(50),
  national_id VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  two_factor_backup_codes JSONB,
  force_password_reset BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by INT,
  deleted_at TIMESTAMPTZ,
  deleted_by INT,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- 1.6 user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  locale VARCHAR(10) DEFAULT 'en',
  theme VARCHAR(20) DEFAULT 'light',
  compact_mode BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 1.7 user_activity
CREATE TABLE IF NOT EXISTS user_activity (
  id SERIAL PRIMARY KEY,
  user_id INT,
  action VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- 2. AUTHENTICATION TABLES
-- ============================================================================

-- 2.1 otp_codes
CREATE TABLE IF NOT EXISTS otp_codes (
  phone VARCHAR(20) PRIMARY KEY,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 otp_attempts
CREATE TABLE IF NOT EXISTS otp_attempts (
  id BIGSERIAL PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  attempt_type VARCHAR(20) DEFAULT 'verify',
  success BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_attempts_identifier ON otp_attempts(identifier);
CREATE INDEX IF NOT EXISTS idx_otp_attempts_ip ON otp_attempts(ip_address);

-- 2.3 otp_store
CREATE TABLE IF NOT EXISTS otp_store (
  phone VARCHAR(20) PRIMARY KEY,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- ============================================================================
-- 3. PRODUCT TABLES
-- ============================================================================

-- 3.1 categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  short_description TEXT,
  price DECIMAL(12,2) DEFAULT 0,
  cost DECIMAL(12,2) DEFAULT 0,
  stock_quantity DECIMAL(12,2) DEFAULT 0,
  reorder_level DECIMAL(12,2) DEFAULT 20,
  category_id INT,
  unit VARCHAR(20) DEFAULT 'm³',
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  branch_id INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by INT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_products_branch ON products(branch_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- ============================================================================
-- 4. ORDER TABLES
-- ============================================================================

-- 4.1 orders
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50),
  client_name VARCHAR(100) NOT NULL,
  client_phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  total_amount DECIMAL(12,2) DEFAULT 0,
  delivery_location TEXT,
  delivery_date DATE,
  note TEXT,
  notes TEXT,
  admin_notes TEXT,
  assigned_worker_id INT,
  bargaining_requested BOOLEAN DEFAULT FALSE,
  branch_id INT,
  created_by INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  deleted_by INT,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_worker_id) REFERENCES workers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- 4.2 order_items
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================================
-- 5. HR TABLES
-- ============================================================================

-- 5.1 departments
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by INT
);

-- 5.2 workers
CREATE TABLE IF NOT EXISTS workers (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(150),
  position VARCHAR(100),
  department_id INT,
  branch_id INT,
  salary DECIMAL(12,2),
  hire_date DATE,
  join_date DATE,
  location TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'active',
  status_reason TEXT,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by INT,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_workers_branch ON workers(branch_id);
CREATE INDEX IF NOT EXISTS idx_workers_department ON workers(department_id);

-- 5.3 shifts
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.4 worker_shifts
CREATE TABLE IF NOT EXISTS worker_shifts (
  worker_id INT NOT NULL,
  shift_id INT NOT NULL,
  effective_from DATE DEFAULT CURRENT_DATE,
  PRIMARY KEY (worker_id, shift_id),
  FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
);

-- 5.5 attendance
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  worker_id INT,
  user_id INT,
  date DATE DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'present',
  is_late BOOLEAN DEFAULT FALSE,
  manual_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  branch_id INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by INT,
  FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_worker ON attendance(worker_id);
CREATE INDEX IF NOT EXISTS idx_attendance_branch ON attendance(branch_id);

-- 5.6 leave_requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  worker_id INT,
  leave_type VARCHAR(50) DEFAULT 'annual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  approved_by INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 5.7 performance_reviews
CREATE TABLE IF NOT EXISTS performance_reviews (
  id SERIAL PRIMARY KEY,
  worker_id INT,
  review_date DATE NOT NULL,
  reviewer VARCHAR(100),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
);

-- 5.8 salary_history
CREATE TABLE IF NOT EXISTS salary_history (
  id SERIAL PRIMARY KEY,
  worker_id INT,
  old_salary DECIMAL(12,2),
  new_salary DECIMAL(12,2) NOT NULL,
  effective_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
);

-- 5.9 worker_documents
CREATE TABLE IF NOT EXISTS worker_documents (
  id SERIAL PRIMARY KEY,
  worker_id INT,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200),
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
);

-- ============================================================================
-- 6. INVENTORY TABLES
-- ============================================================================

-- 6.1 inventory
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  branch_id INT NOT NULL,
  quantity DECIMAL(12,2) DEFAULT 0,
  low_stock_threshold DECIMAL(12,2) DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  UNIQUE (product_id, branch_id)
);

-- 6.2 stock_logs
CREATE TABLE IF NOT EXISTS stock_logs (
  id SERIAL PRIMARY KEY,
  product_id INT,
  changed_by INT,
  old_quantity DECIMAL(12,2) NOT NULL,
  new_quantity DECIMAL(12,2) NOT NULL,
  reason TEXT,
  movement_type VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 6.3 stock_movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  branch_id INT NOT NULL,
  quantity_change DECIMAL(12,2) NOT NULL,
  new_quantity DECIMAL(12,2) NOT NULL,
  reason VARCHAR(255),
  user_id INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- 7. SUPPORT TABLES
-- ============================================================================

-- 7.1 support_tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  ticket_number VARCHAR(50) NOT NULL UNIQUE,
  user_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'medium',
  category VARCHAR(50),
  assigned_to INT,
  order_id INT,
  product_id INT,
  branch_id INT,
  created_by INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by INT,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 7.2 support_replies
CREATE TABLE IF NOT EXISTS support_replies (
  id SERIAL PRIMARY KEY,
  ticket_id INT,
  user_id INT,
  sender_name VARCHAR(255),
  sender_role VARCHAR(50) DEFAULT 'Staff',
  message TEXT NOT NULL,
  is_staff BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 7.3 support_messages
CREATE TABLE IF NOT EXISTS support_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INT,
  sender_id INT,
  sender_name VARCHAR(100),
  sender_role VARCHAR(20),
  message TEXT NOT NULL,
  branch_id INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- 7.4 support_attachments
CREATE TABLE IF NOT EXISTS support_attachments (
  id SERIAL PRIMARY KEY,
  ticket_id INT,
  reply_id INT,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_id) REFERENCES support_replies(id) ON DELETE CASCADE
);

-- ============================================================================
-- 8. PUBLIC WEBSITE TABLES
-- ============================================================================

-- 8.1 faq_items
CREATE TABLE IF NOT EXISTS faq_items (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8.2 contact_messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  branch_id INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by INT,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- 8.3 team_members
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100) NOT NULL,
  bio TEXT,
  image_url VARCHAR(500),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8.4 public_orders (anonymous marketplace orders)
CREATE TABLE IF NOT EXISTS public_orders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  product_name VARCHAR(100),
  quantity VARCHAR(50),
  bargaining BOOLEAN DEFAULT FALSE,
  location TEXT,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. SYSTEM TABLES
-- ============================================================================

-- 9.1 system_settings
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  updated_by INT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 9.2 branch_settings
CREATE TABLE IF NOT EXISTS branch_settings (
  id SERIAL PRIMARY KEY,
  branch_id INT NOT NULL,
  key VARCHAR(100) NOT NULL,
  value TEXT,
  description TEXT,
  updated_by INT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (branch_id, key),
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 9.3 audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INT,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id INT,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- 9.4 notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  priority VARCHAR(20) DEFAULT 'medium',
  link VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- 9.5 knowledge_base
CREATE TABLE IF NOT EXISTS knowledge_base (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT,
  category VARCHAR(50),
  is_published BOOLEAN DEFAULT FALSE,
  created_by INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 9.6 activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INT,
  action VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type VARCHAR(50),
  entity_id INT,
  metadata JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- 9.7 role_dashboard_config
CREATE TABLE IF NOT EXISTS role_dashboard_config (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(100) NOT NULL UNIQUE,
  modules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_phone);
CREATE INDEX IF NOT EXISTS idx_faq_active ON faq_items(is_active);
CREATE INDEX IF NOT EXISTS idx_faq_order ON faq_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_team_active ON team_members(is_active);

-- ============================================================================
-- TRIGGER FUNCTION: updated_at auto-update
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at'
      AND table_schema = 'public'
      AND table_name NOT IN ('otp_codes', 'otp_attempts', 'otp_store')
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON %I;
       CREATE TRIGGER set_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW
         EXECUTE FUNCTION update_updated_at_column();',
      t, t
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION CHECKPOINT
-- ============================================================================

-- Insert migration tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(50) PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES ('001_full_schema')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
