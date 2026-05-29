import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrashAlt,
  faSave,
  faTimes,
  faKey,
} from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/hooks/useTranslation';
import { ROLES } from '@/lib/roles';

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

  // -------------------------
  // USER ROLE
  // -------------------------
  let userRole = '';

  if (typeof window !== 'undefined') {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      userRole = String(user.role || '').toLowerCase();
    } catch {
      userRole = '';
    }
  }

  const canEdit = userRole === 'superadmin';

  // -------------------------
  // MODULE TRANSLATIONS
  // -------------------------
  const getTranslatedModule = (module: string): string => {
    const moduleMap: Record<string, string> = {
      admin: t('module_admin'),
      analytics: t('module_analytics'),
      attendance: t('module_attendance'),
      audit: t('module_audit'),
      branch: t('module_branch'),
      dashboard: t('module_dashboard'),
      department: t('module_department'),
      faq: t('module_faq'),
      finance: t('module_finance'),
      inventory: t('module_inventory'),
      order: t('module_order'),
      product: t('module_product'),
      recycle: t('module_recycle'),
      roles: t('module_roles'),
      security: t('module_security'),
      settings: t('module_settings'),
      support: t('module_support'),
      user: t('module_user'),
      worker: t('module_worker'),
    };
    return moduleMap[module] || module;
  };

  // -------------------------
  // PERMISSION TRANSLATIONS
  // -------------------------
  const getTranslatedPermission = (permName: string): string => {
    const permMap: Record<string, string> = {
      'admin:controls': t('perm_admin_controls'),
      'analytics:view': t('perm_analytics_view'),
      'attendance:mark': t('perm_attendance_mark'),
      'attendance:override': t('perm_attendance_override'),
      'attendance:view': t('perm_attendance_view'),
      'audit:view': t('perm_audit_view'),
      'branch:create': t('perm_branch_create'),
      'branch:delete': t('perm_branch_delete'),
      'branch:edit': t('perm_branch_edit'),
      'branch:switch': t('perm_branch_switch'),
      'branch:view': t('perm_branch_view'),
      'dashboard:view': t('perm_dashboard_view'),
      'department:create': t('perm_department_create'),
      'department:delete': t('perm_department_delete'),
      'department:edit': t('perm_department_edit'),
      'department:view': t('perm_department_view'),
      'faq:manage': t('perm_faq_manage'),
      'finance:view': t('perm_finance_view'),
      'inventory:adjust': t('perm_inventory_adjust'),
      'inventory:transfer': t('perm_inventory_transfer'),
      'inventory:view': t('perm_inventory_view'),
      'order:create': t('perm_order_create'),
      'order:delete': t('perm_order_delete'),
      'order:edit': t('perm_order_edit'),
      'order:view': t('perm_order_view'),
      'product:create': t('perm_product_create'),
      'product:delete': t('perm_product_delete'),
      'product:edit': t('perm_product_edit'),
      'product:view': t('perm_product_view'),
      'recycle:view': t('perm_recycle_view'),
      'roles:create': t('perm_roles_create'),
      'roles:delete': t('perm_roles_delete'),
      'roles:edit': t('perm_roles_edit'),
      'roles:view': t('perm_roles_view'),
      'security:view': t('perm_security_view'),
      'settings:edit': t('perm_settings_edit'),
      'settings:view': t('perm_settings_view'),
      'support:create': t('perm_support_create'),
      'support:manage': t('perm_support_manage'),
      'support:reply': t('perm_support_reply'),
      'support:view': t('perm_support_view'),
      'user:create': t('perm_user_create'),
      'user:delete': t('perm_user_delete'),
      'user:edit': t('perm_user_edit'),
      'user:suspend': t('perm_user_suspend'),
      'user:view': t('perm_user_view'),
      'worker:create': t('perm_worker_create'),
      'worker:delete': t('perm_worker_delete'),
      'worker:documents': t('perm_worker_documents'),
      'worker:edit': t('perm_worker_edit'),
      'worker:leave': t('perm_worker_leave'),
      'worker:view': t('perm_worker_view'),
    };
    return permMap[permName] || permName;
  };

  // -------------------------
  // ROLE TRANSLATIONS
  // -------------------------
  const getTranslatedRole = (roleName: string): string => {
    const roleMap: Record<string, string> = {
      superadmin: t('role_superadmin'),
      admin: t('role_admin'),
      supervisor: t('role_supervisor'),
      service_provider: t('role_service_provider'),
      maintenance: t('role_maintenance'),
      crusherman: t('role_crusherman'),
      operator: t('role_operator'),
      cardriver: t('role_cardriver'),
      day_worker: t('role_day_worker'),
    };
    return roleMap[roleName.toLowerCase()] || roleName;
  };

  // -------------------------
  // FETCH DATA
  // -------------------------
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

  // -------------------------
  // TOGGLE PERMISSION
  // -------------------------
  const handlePermissionToggle = (permId: number) => {
    if (!canEdit) return;
    setSelectedPerms((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  // -------------------------
  // SAVE
  // -------------------------
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
        setMessage(t('permissionsUpdated') || 'Permissions updated');
        setTimeout(() => setMessage(''), 3000);
        fetchData();
      } else {
        throw new Error('Update failed');
      }
    } catch {
      alert(t('errorUpdatingPermissions') || 'Error updating permissions');
    } finally {
      setSaving(false);
    }
  };

  // -------------------------
  // ADD ROLE
  // -------------------------
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
        fetchData();
      } else {
        throw new Error('Failed to create role');
      }
    } catch {
      alert(t('errorCreatingRole') || 'Error creating role');
    }
  };

  // -------------------------
  // DELETE ROLE
  // -------------------------
  const deleteRole = async (roleId: number) => {
    if (!confirm(t('confirmDeleteRole') || 'Delete this role?')) return;
    try {
      const res = await fetch(`/api/roles/${roleId}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        if (selectedRoleId === roleId) setSelectedRoleId(null);
        fetchData();
      } else {
        throw new Error('Delete failed');
      }
    } catch {
      alert(t('errorDeletingRole') || 'Error deleting role');
    }
  };

  // -------------------------
  // GROUP PERMISSIONS
  // -------------------------
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const module = perm.name.split(':')[0];
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // -------------------------
  // STATES
  // -------------------------
  if (loading) {
    return <div style={{ padding: '1rem', textAlign: 'center' }}>{t('loadingRoles') || 'Loading roles...'}</div>;
  }

  if (error) {
    return <div style={{ color: '#dc2626', padding: '1rem' }}>{error}</div>;
  }

  // -------------------------
  // RENDER UI (FULL COMPLETE)
  // -------------------------
  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FontAwesomeIcon icon={faKey} /> {t('rolesAndPermissions') || 'Roles & Permissions'}
        </h3>
        {canEdit && (
          <button onClick={() => setShowAddRole(true)} style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FontAwesomeIcon icon={faPlus} /> {t('addRole') || 'Add Role'}
          </button>
        )}
      </div>

      {message && <div style={{ marginBottom: '1rem', padding: '8px', background: '#d1fae5', borderRadius: '6px' }}>{message}</div>}

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* Roles List */}
        <div style={{ width: '250px', background: '#f9fafb', borderRadius: '8px', padding: '1rem' }}>
          <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>{t('roles') || 'Roles'}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {roles.map((role) => (
              <div
                key={role.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px',
                  background: selectedRoleId === role.id ? '#fef3c7' : 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: selectedRoleId === role.id ? '1px solid #f59e0b' : '1px solid #e5e7eb',
                }}
                onClick={() => setSelectedRoleId(role.id)}
              >
                <span style={{ fontWeight: selectedRoleId === role.id ? 'bold' : 'normal' }}>{getTranslatedRole(role.name)}</span>
                {canEdit && role.name !== 'superadmin' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRole(role.id);
                    }}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                  >
                    <FontAwesomeIcon icon={faTrashAlt} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Permissions */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0 }}>
              {t('permissions') || 'Permissions'} for {selectedRoleId ? getTranslatedRole(roles.find((r) => r.id === selectedRoleId)?.name || '') : ''}
            </h4>
            {canEdit && selectedRoleId && (
              <button
                onClick={savePermissions}
                disabled={saving}
                style={{ background: '#f59e0b', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <FontAwesomeIcon icon={faSave} /> {saving ? (t('saving') || 'Saving...') : (t('savePermissions') || 'Save Permissions')}
              </button>
            )}
          </div>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {Object.entries(groupedPermissions).map(([module, perms]) => (
              <div key={module} style={{ marginBottom: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ background: '#f3f4f6', padding: '8px 12px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                  {getTranslatedModule(module)}
                </div>
                <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  {perms.map((perm) => (
                    <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: canEdit ? 'pointer' : 'default', opacity: canEdit ? 1 : 0.6 }}>
                      <input
                        type="checkbox"
                        checked={selectedPerms.includes(perm.id)}
                        onChange={() => handlePermissionToggle(perm.id)}
                        disabled={!canEdit}
                      />
                      <span style={{ fontSize: '0.85rem' }}>{getTranslatedPermission(perm.name)}</span>
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
          }}
        >
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '400px' }}>
            <h3 style={{ marginTop: 0 }}>{t('addRole') || 'Add Role'}</h3>
            <input
              type="text"
              placeholder={t('roleName') || 'Role name'}
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '6px' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddRole(false);
                  setNewRoleName('');
                }}
                style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                <FontAwesomeIcon icon={faTimes} /> {t('cancel') || 'Cancel'}
              </button>
              <button onClick={addRole} style={{ padding: '8px 16px', background: '#f59e0b', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faSave} /> {t('create') || 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}