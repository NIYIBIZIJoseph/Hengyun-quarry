import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrashAlt,
  faSave,
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

  const [newRoleName, setNewRoleName] = useState('');
  const [showAddRole, setShowAddRole] = useState(false);

  // -------------------------
  // USER ROLE
  // -------------------------
  let userRole = '';

  if (typeof window !== 'undefined') {
    try {
      const user = JSON.parse(
        localStorage.getItem('user') || '{}'
      );

      userRole = String(user.role || '').toLowerCase();
    } catch {
      userRole = '';
    }
  }

  const canEdit = userRole === 'superadmin';

  // -------------------------
  // MODULE TRANSLATIONS
  // -------------------------
  const getTranslatedModule = (
    module: string
  ): string => {
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
  const getTranslatedPermission = (
    permName: string
  ): string => {
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
  // DESCRIPTION TRANSLATIONS
  // -------------------------
  const getTranslatedDescription = (
    description: string
  ): string => {
    const descMap: Record<string, string> = {
      'Access admin controls (maintenance, cache, system info)':
        t('perm_admin_controls_desc'),

      'Override attendance':
        t('perm_attendance_override_desc'),

      'View attendance':
        t('perm_attendance_view_desc'),

      'Create new branches':
        t('perm_branch_create_desc'),

      'Delete branches':
        t('perm_branch_delete_desc'),

      'Edit branches':
        t('perm_branch_edit_desc'),

      'View branches':
        t('perm_branch_view_desc'),

      'Create departments':
        t('perm_department_create_desc'),

      'Delete departments':
        t('perm_department_delete_desc'),

      'Edit departments':
        t('perm_department_edit_desc'),

      'View departments':
        t('perm_department_view_desc'),

      'Create new roles':
        t('perm_roles_create_desc'),

      'Delete roles':
        t('perm_roles_delete_desc'),

      'Create workers':
        t('perm_worker_create_desc'),

      'Delete workers':
        t('perm_worker_delete_desc'),

      'Manage worker documents':
        t('perm_worker_documents_desc'),

      'Edit workers':
        t('perm_worker_edit_desc'),

      'Manage worker leave requests':
        t('perm_worker_leave_desc'),

      'View workers':
        t('perm_worker_view_desc'),
    };

    return descMap[description] || description;
  };

  // -------------------------
  // ROLE TRANSLATIONS
  // -------------------------
  const getTranslatedRole = (
    roleName: string
  ): string => {
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

    return (
      roleMap[roleName.toLowerCase()] || roleName
    );
  };

  // -------------------------
  // FETCH DATA
  // -------------------------
  const fetchData = async () => {
    setLoading(true);

    try {
      const [rolesRes, permsRes] =
        await Promise.all([
          fetch('/api/roles', {
            headers: getAuthHeaders(),
          }),

          fetch('/api/permissions', {
            headers: getAuthHeaders(),
          }),
        ]);

      if (!rolesRes.ok) {
        throw new Error(
          `Roles API error: ${rolesRes.status}`
        );
      }

      if (!permsRes.ok) {
        throw new Error(
          `Permissions API error: ${permsRes.status}`
        );
      }

      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();

      const rolesList =
        rolesData.roles ||
        (Array.isArray(rolesData)
          ? rolesData
          : []);

      const permsList = Array.isArray(permsData)
        ? permsData
        : permsData.data || [];

      setRoles(rolesList);
      setAllPermissions(permsList);

      if (rolesList.length > 0 && !selectedRoleId) {
        setSelectedRoleId(rolesList[0].id);

        setSelectedPerms(
          rolesList[0].permissions || []
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        t('failedToLoadRoles') ||
          'Failed to load roles and permissions'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const role = roles.find(
      (r) => r.id === selectedRoleId
    );

    if (role) {
      setSelectedPerms(role.permissions || []);
    }
  }, [selectedRoleId, roles]);

  // -------------------------
  // TOGGLE PERMISSION
  // -------------------------
  const handlePermissionToggle = (
    permId: number
  ) => {
    if (!canEdit) return;

    setSelectedPerms((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId]
    );
  };

  // -------------------------
  // SAVE
  // -------------------------
  const savePermissions = async () => {
    if (!selectedRoleId || !canEdit) return;

    setSaving(true);

    try {
      const res = await fetch(
        `/api/roles/${selectedRoleId}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            permissionIds: selectedPerms,
          }),
        }
      );

      if (res.ok) {
        alert(
          t('permissionsUpdated') ||
            'Permissions updated'
        );

        fetchData();
      } else {
        const err = await res.json();

        alert(
          err.error ||
            t('updateFailed') ||
            'Update failed'
        );
      }
    } catch {
      alert(
        t('errorUpdatingPermissions') ||
          'Error updating permissions'
      );
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
        body: JSON.stringify({
          name: newRoleName.trim(),
        }),
      });

      if (res.ok) {
        setShowAddRole(false);
        setNewRoleName('');

        fetchData();
      } else {
        const err = await res.json();

        alert(
          err.error ||
            t('failedToCreateRole') ||
            'Failed to create role'
        );
      }
    } catch {
      alert(
        t('errorCreatingRole') ||
          'Error creating role'
      );
    }
  };

  // -------------------------
  // DELETE ROLE
  // -------------------------
  const deleteRole = async (
    roleId: number
  ) => {
    if (
      !confirm(
        t('confirmDeleteRole') ||
          'Delete this role?'
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/roles/${roleId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );

      if (res.ok) {
        if (selectedRoleId === roleId) {
          setSelectedRoleId(null);
        }

        fetchData();
      } else {
        const err = await res.json();

        alert(
          err.error ||
            t('deleteFailed') ||
            'Delete failed'
        );
      }
    } catch {
      alert(
        t('errorDeletingRole') ||
          'Error deleting role'
      );
    }
  };

  // -------------------------
  // STATES
  // -------------------------
  if (loading) {
    return (
      <div>
        {t('loadingRoles') || 'Loading roles...'}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: '#dc2626' }}>
        {error}
      </div>
    );
  }

  // -------------------------
  // GROUP PERMISSIONS
  // -------------------------
  const groupedPermissions =
    allPermissions.reduce(
      (acc, perm) => {
        const module =
          perm.name.split(':')[0];

        if (!acc[module]) {
          acc[module] = [];
        }

        acc[module].push(perm);

        return acc;
      },
      {} as Record<string, Permission[]>
    );

  return <div>Roles Permissions Component</div>;
}