// src/components/settings/RolesPermissions.tsx
import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrashAlt,
  faSave,
  faTimes,
  faKey,
  faShieldAlt,
  faUsers,
  faCheckCircle,
  faExclamationTriangle,
  faRecycle,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { ROLES } from '@/lib/roles';

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  success: "#10b981",
  danger: "#ef4444",
  info: "#3b82f6",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  bgGray: "#f9fafb",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowHover: "0 8px 25px rgba(0,0,0,0.08)",
};

interface Role {
  id: number;
  name: string;
  permissions: number[];
}

interface Permission {
  id: number;
  name: string;
  description: string;
}

export default function RolesPermissions() {
  const { t } = useTranslation();

  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [newRoleName, setNewRoleName] = useState('');
  const [showAddRole, setShowAddRole] = useState(false);

  const userRole = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || '{}').role
    : null;

  const canEdit = userRole === ROLES.SUPERADMIN;

  const getTranslatedModule = (module: string): string => {
    const moduleMap: Record<string, string> = {
      admin: 'Admin',
      analytics: 'Analytics',
      attendance: 'Attendance',
      audit: 'Audit',
      branch: 'Branch',
      dashboard: 'Dashboard',
      department: 'Department',
      faq: 'FAQ',
      finance: 'Finance',
      inventory: 'Inventory',
      order: 'Orders',
      product: 'Products',
      recycle: 'Recycle Bin',  // ✅ Added
      roles: 'Roles',
      security: 'Security',
      settings: 'Settings',
      support: 'Support',
      user: 'Users',
      worker: 'Workers',
    };
    return moduleMap[module] || module;
  };

  const getTranslatedPermission = (permName: string): string => {
    const permMap: Record<string, string> = {
      // ===== ADMIN =====
      'admin:controls': 'Admin Controls',
      
      // ===== ANALYTICS =====
      'analytics:view': 'View Analytics',
      
      // ===== ATTENDANCE =====
      'attendance:mark': 'Mark Attendance',
      'attendance:override': 'Override Attendance',
      'attendance:view': 'View Attendance',
      'attendance:export': 'Export Attendance',
      
      // ===== AUDIT =====
      'audit:view': 'View Audit Logs',
      'audit:export': 'Export Audit Logs',
      
      // ===== BRANCH =====
      'branch:create': 'Create Branch',
      'branch:delete': 'Delete Branch',
      'branch:edit': 'Edit Branch',
      'branch:switch': 'Switch Branch',
      'branch:view': 'View Branch',
      
      // ===== DASHBOARD =====
      'dashboard:view': 'View Dashboard',
      'dashboard:stats': 'View Dashboard Stats',
      
      // ===== DEPARTMENT =====
      'department:create': 'Create Department',
      'department:delete': 'Delete Department',
      'department:edit': 'Edit Department',
      'department:view': 'View Department',
      
      // ===== FAQ =====
      'faq:manage': 'Manage FAQ',
      
      // ===== FINANCE =====
      'finance:view': 'View Finance',
      
      // ===== INVENTORY =====
      'inventory:adjust': 'Adjust Inventory',
      'inventory:transfer': 'Transfer Inventory',
      'inventory:view': 'View Inventory',
      'inventory:manage': 'Manage Inventory',
      
      // ===== ORDERS =====
      'order:create': 'Create Orders',
      'order:delete': 'Delete Orders',
      'order:edit': 'Edit Orders',
      'order:view': 'View Orders',
      'order:export': 'Export Orders',
      
      // ===== PRODUCTS =====
      'product:create': 'Create Products',
      'product:delete': 'Delete Products',
      'product:edit': 'Edit Products',
      'product:view': 'View Products',
      
      // ===== RECYCLE BIN ===== ✅ NEW
      'recycle:view': 'View Recycle Bin',
      'recycle:restore': 'Restore Items',
      'recycle:delete': 'Permanently Delete Items',
      'recycle:bulk-delete': 'Bulk Delete Items',
      
      // ===== ROLES =====
      'roles:create': 'Create Roles',
      'roles:delete': 'Delete Roles',
      'roles:edit': 'Edit Roles',
      'roles:view': 'View Roles',
      
      // ===== SECURITY =====
      'security:view': 'View Security',
      
      // ===== SETTINGS =====
      'settings:edit': 'Edit Settings',
      'settings:view': 'View Settings',
      
      // ===== SUPPORT =====
      'support:create': 'Create Support Tickets',
      'support:manage': 'Manage Support',
      'support:reply': 'Reply to Support',
      'support:view': 'View Support',
      'support:delete': 'Delete Support Tickets',
      'support:resolve': 'Resolve Support Tickets',
      
      // ===== USERS =====
      'user:create': 'Create Users',
      'user:delete': 'Delete Users',
      'user:edit': 'Edit Users',
      'user:suspend': 'Suspend Users',
      'user:view': 'View Users',
      
      // ===== WORKERS =====
      'worker:create': 'Create Workers',
      'worker:delete': 'Delete Workers',
      'worker:documents': 'Manage Worker Documents',
      'worker:edit': 'Edit Workers',
      'worker:leave': 'Manage Worker Leave',
      'worker:view': 'View Workers',
      'worker:export': 'Export Workers',
    };
    return permMap[permName] || permName;
  };

  const getTranslatedRole = (roleName: string): string => {
    const roleMap: Record<string, string> = {
      superadmin: 'Super Admin',
      admin: 'Admin',
      supervisor: 'Supervisor',
      service_provider: 'Service Provider',
      maintenance: 'Maintenance',
      crusherman: 'Crusherman',
      operator: 'Operator',
      cardriver: 'Car Driver',
      day_worker: 'Day Worker',
    };
    return roleMap[roleName.toLowerCase()] || roleName;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/roles', { headers: getAuthHeaders() }),
        fetch('/api/permissions', { headers: getAuthHeaders() }),
      ]);
      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();
      const rolesList = rolesData.roles || (Array.isArray(rolesData) ? rolesData : []);
      const permsList = Array.isArray(permsData) ? permsData : permsData.data || [];
      setRoles(rolesList);
      setAllPermissions(permsList);
      if (rolesList.length > 0 && !selectedRoleId) {
        setSelectedRoleId(rolesList[0].id);
        setSelectedPerms(rolesList[0].permissions || []);
      }
    } catch (err) {
      console.error(err);
      setError(t('failedToLoadRoles') || 'Failed to load roles and permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const role = roles.find((r) => r.id === selectedRoleId);
    if (role) {
      setSelectedPerms(role.permissions || []);
    }
  }, [selectedRoleId, roles]);

  const handlePermissionToggle = (permId: number) => {
    if (!canEdit) return;
    setSelectedPerms((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const savePermissions = async () => {
    if (!selectedRoleId || !canEdit) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/roles/${selectedRoleId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ permissionIds: selectedPerms }),
      });
      if (res.ok) {
        setMessage(t('permissionsUpdated') || 'Permissions updated successfully');
        setTimeout(() => setMessage(''), 3000);
        fetchData();
      } else {
        throw new Error('Update failed');
      }
    } catch {
      setError(t('errorUpdatingPermissions') || 'Error updating permissions');
    } finally {
      setSaving(false);
    }
  };

  const addRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newRoleName.trim() }),
      });
      if (res.ok) {
        setShowAddRole(false);
        setNewRoleName('');
        setMessage('Role created successfully');
        setTimeout(() => setMessage(''), 3000);
        fetchData();
      } else {
        throw new Error('Failed to create role');
      }
    } catch {
      setError(t('errorCreatingRole') || 'Error creating role');
    }
  };

  const deleteRole = async (roleId: number) => {
    if (!confirm(t('confirmDeleteRole') || 'Delete this role?')) return;
    try {
      const res = await fetch(`/api/roles/${roleId}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        if (selectedRoleId === roleId) setSelectedRoleId(null);
        setMessage('Role deleted successfully');
        setTimeout(() => setMessage(''), 3000);
        fetchData();
      } else {
        throw new Error('Delete failed');
      }
    } catch {
      setError(t('errorDeletingRole') || 'Error deleting role');
    }
  };

  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const module = perm.name.split(':')[0];
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: COLORS.danger, padding: '1rem', background: '#fee2e2', borderRadius: '8px' }}>
        <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: COLORS.textPrimary, margin: 0 }}>
              <FontAwesomeIcon icon={faShieldAlt} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
              {t('rolesAndPermissions') || 'Roles & Permissions'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: COLORS.textMuted, margin: '0.15rem 0 0 0' }}>
              {t('rolesPermDesc') || 'Define user roles and granular access permissions.'}
            </p>
          </div>
          {canEdit && (
            <button
              onClick={() => setShowAddRole(true)}
              style={{
                padding: '0.5rem 1.25rem',
                background: COLORS.primary,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.primary;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <FontAwesomeIcon icon={faPlus} /> {t('addRole') || 'Add Role'}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div style={{ marginBottom: '1rem', padding: '12px 16px', background: '#d1fae5', borderRadius: '8px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: `3px solid ${COLORS.success}` }}>
          <FontAwesomeIcon icon={faCheckCircle} /> {message}
        </div>
      )}
      {error && (
        <div style={{ marginBottom: '1rem', padding: '12px 16px', background: '#fee2e2', borderRadius: '8px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: `3px solid ${COLORS.danger}` }}>
          <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
        </div>
      )}

      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        padding: '1.5rem',
        boxShadow: COLORS.shadow,
        display: 'flex',
        gap: '1.5rem',
        flexWrap: 'wrap',
      }}>
        {/* Roles List */}
        <div style={{ 
          width: '280px',
          background: COLORS.bgGray,
          borderRadius: '8px',
          padding: '1rem',
          flexShrink: 0,
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '1rem', color: COLORS.textPrimary }}>
            <FontAwesomeIcon icon={faUsers} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
            {t('roles') || 'Roles'}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {roles.map((role) => (
              <div
                key={role.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: selectedRoleId === role.id ? '#fef3c7' : 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: selectedRoleId === role.id ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                  transition: 'all 0.2s',
                }}
                onClick={() => setSelectedRoleId(role.id)}
                onMouseEnter={(e) => {
                  if (selectedRoleId !== role.id) {
                    e.currentTarget.style.borderColor = COLORS.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedRoleId !== role.id) {
                    e.currentTarget.style.borderColor = COLORS.border;
                  }
                }}
              >
                <span style={{ 
                  fontWeight: selectedRoleId === role.id ? '600' : '400',
                  color: selectedRoleId === role.id ? COLORS.primary : COLORS.textPrimary,
                }}>
                  <FontAwesomeIcon 
                    icon={selectedRoleId === role.id ? faCheckCircle : faUsers} 
                    style={{ 
                      marginRight: '0.5rem',
                      color: selectedRoleId === role.id ? COLORS.primary : COLORS.textMuted,
                    }} 
                  />
                  {getTranslatedRole(role.name)}
                </span>
                {canEdit && role.name !== 'superadmin' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRole(role.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: COLORS.danger,
                      cursor: 'pointer',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '4px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${COLORS.danger}15`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <FontAwesomeIcon icon={faTrashAlt} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Permissions */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            <h4 style={{ margin: 0, color: COLORS.textPrimary }}>
              <FontAwesomeIcon icon={faKey} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
              {t('permissions') || 'Permissions'} 
              {selectedRoleId && (
                <span style={{ 
                  color: COLORS.primary, 
                  fontWeight: '600',
                  fontSize: '0.85rem',
                }}>
                  — {getTranslatedRole(roles.find((r) => r.id === selectedRoleId)?.name || '')}
                </span>
              )}
            </h4>
            {canEdit && selectedRoleId && (
              <button
                onClick={savePermissions}
                disabled={saving}
                style={{
                  padding: '0.4rem 1.25rem',
                  background: COLORS.primary,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  color: 'white',
                  fontWeight: '500',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s',
                  opacity: saving ? 0.6 : 1,
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = COLORS.primary;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <FontAwesomeIcon icon={faSave} />
                {saving ? (t('saving') || 'Saving...') : (t('savePermissions') || 'Save Permissions')}
              </button>
            )}
          </div>

          {!canEdit && (
            <div style={{
              padding: '12px 16px',
              background: '#fef3c7',
              borderRadius: '8px',
              marginBottom: '1rem',
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              borderLeft: `3px solid ${COLORS.primary}`,
            }}>
              <FontAwesomeIcon icon={faExclamationTriangle} />
              You have read-only access to these settings. Contact a Super Admin to make changes.
            </div>
          )}

          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {Object.entries(groupedPermissions).map(([module, perms]) => (
              <div 
                key={module} 
                style={{ 
                  marginBottom: '1rem', 
                  border: `1px solid ${COLORS.border}`, 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                }}
              >
                <div style={{ 
                  background: COLORS.bgGray, 
                  padding: '8px 12px', 
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  color: COLORS.textSecondary,
                  borderBottom: `1px solid ${COLORS.border}`,
                }}>
                  <FontAwesomeIcon 
                    icon={module === 'recycle' ? faRecycle : faKey} 
                    style={{ color: COLORS.primary, marginRight: '0.5rem' }} 
                  />
                  {getTranslatedModule(module)}
                </div>
                <div style={{ 
                  padding: '12px', 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                  gap: '0.5rem' 
                }}>
                  {perms.map((perm) => (
                    <label 
                      key={perm.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        cursor: canEdit ? 'pointer' : 'default',
                        opacity: canEdit ? 1 : 0.6,
                        padding: '4px 6px',
                        borderRadius: '4px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (canEdit) {
                          e.currentTarget.style.backgroundColor = COLORS.bgGray;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPerms.includes(perm.id)}
                        onChange={() => handlePermissionToggle(perm.id)}
                        disabled={!canEdit}
                        style={{ accentColor: COLORS.primary }}
                      />
                      <span style={{ fontSize: '0.85rem', color: COLORS.textPrimary }}>
                        {getTranslatedPermission(perm.name)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Role Modal */}
      {showAddRole && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowAddRole(false)}
        >
          <div 
            style={{ 
              background: 'white', 
              padding: '24px', 
              borderRadius: '16px', 
              width: '450px',
              maxWidth: '90%',
              boxShadow: COLORS.shadowHover,
              animation: 'slideUp 0.3s ease',
            }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: COLORS.textPrimary }}>
                <FontAwesomeIcon icon={faPlus} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
                {t('addRole') || 'Add Role'}
              </h3>
              <button
                onClick={() => setShowAddRole(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: COLORS.textMuted,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.textPrimary;
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = COLORS.textMuted;
                  e.currentTarget.style.transform = 'rotate(0)';
                }}
              >
                ×
              </button>
            </div>
            <input
              type="text"
              placeholder={t('roleName') || 'Role name'}
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.9rem',
                marginBottom: '1rem',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.primary}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowAddRole(false); setNewRoleName(''); }}
                style={{
                  padding: '8px 16px',
                  background: COLORS.bgGray,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: COLORS.textSecondary,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.border;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.bgGray;
                }}
              >
                <FontAwesomeIcon icon={faTimes} /> {t('cancel') || 'Cancel'}
              </button>
              <button
                onClick={addRole}
                style={{
                  padding: '8px 16px',
                  background: COLORS.primary,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'white',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.primary;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <FontAwesomeIcon icon={faSave} /> {t('create') || 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid ${COLORS.border};
          border-top-color: ${COLORS.primary};
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}