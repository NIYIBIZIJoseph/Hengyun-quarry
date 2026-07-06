// src/pages/dashboard/admin/users.tsx
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders, getUserRoleFromToken } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faTrashAlt, 
  faPlus, 
  faUserShield, 
  faUsers,
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faSearch,
  faFilter,
  faTimes,
  faSave,
  faUser,
  faPhone,
  faBuilding,
  faCalendarAlt
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

interface User {
  id: number;
  phone: string;
  full_name: string;
  role: string;
  role_id: number;
  status: string;
  branch_id: number | null;
  branch_name: string;
  created_at: string;
}

interface Role {
  id: number;
  name: string;
}

interface Branch {
  id: number;
  name: string;
}

// ========== KPI CARD ==========
function KpiCard({ label, value, icon, color = COLORS.primary }: { label: string; value: string | number; icon: any; color?: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        background: 'white',
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        boxShadow: isHovered ? COLORS.shadowHover : COLORS.shadow,
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        borderLeft: `3px solid ${color}`,
        cursor: 'default',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FontAwesomeIcon icon={icon} style={{ color, fontSize: '0.8rem' }} />
        <span style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, marginTop: '0.25rem' }}>
        {value}
      </div>
    </div>
  );
}

// ========== STATUS BADGE ==========
function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  
  if (status === 'active') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.2rem 0.6rem',
        borderRadius: '12px',
        fontSize: '0.7rem',
        fontWeight: '500',
        background: '#d1fae5',
        color: '#065f46',
      }}>
        <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '0.4rem' }} />
        {t('active') || 'Active'}
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      padding: '0.2rem 0.6rem',
      borderRadius: '12px',
      fontSize: '0.7rem',
      fontWeight: '500',
      background: '#fee2e2',
      color: '#991b1b',
    }}>
      <FontAwesomeIcon icon={faTimesCircle} style={{ fontSize: '0.4rem' }} />
      {t('suspended') || 'Suspended'}
    </span>
  );
}

// ========== ROLE BADGE ==========
function RoleBadge({ role }: { role: string }) {
  const roleColors: Record<string, { bg: string; color: string }> = {
    superadmin: { bg: '#fef3c7', color: '#92400e' },
    admin: { bg: '#dbeafe', color: '#1e40af' },
    supervisor: { bg: '#d1fae5', color: '#065f46' },
    service_provider: { bg: '#ede9fe', color: '#5b21b6' },
  };
  
  const colors = roleColors[role.toLowerCase()] || { bg: '#f3f4f6', color: '#6b7280' };
  
  return (
    <span style={{
      padding: '0.2rem 0.6rem',
      borderRadius: '12px',
      fontSize: '0.7rem',
      fontWeight: '500',
      background: colors.bg,
      color: colors.color,
    }}>
      {role}
    </span>
  );
}

// ========== USER ROW ==========
function UserRow({ 
  user, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  isSuperAdmin 
}: { 
  user: User; 
  onEdit: (user: User) => void; 
  onDelete: (id: number) => void; 
  onToggleStatus: (id: number, status: string) => void;
  isSuperAdmin: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

  return (
    <tr
      style={{
        borderBottom: `1px solid ${COLORS.border}`,
        backgroundColor: isHovered ? COLORS.bgGray : 'transparent',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td style={{ padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: `${COLORS.primary}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.primary,
          }}>
            <FontAwesomeIcon icon={faUser} style={{ fontSize: '0.8rem' }} />
          </div>
          <div>
            <div style={{ fontWeight: '500', fontSize: '0.85rem', color: COLORS.textPrimary }}>
              {user.full_name}
            </div>
          </div>
        </div>
      </td>
      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>
        <FontAwesomeIcon icon={faPhone} style={{ marginRight: '0.3rem', color: COLORS.primary, fontSize: '0.7rem' }} />
        {user.phone}
      </td>
      <td style={{ padding: '0.75rem 1rem' }}>
        <RoleBadge role={user.role} />
      </td>
      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>
        {user.branch_name || '-'}
      </td>
      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
        <StatusBadge status={user.status} />
      </td>
      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: COLORS.textMuted }}>
        <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '0.3rem', fontSize: '0.7rem' }} />
        {new Date(user.created_at).toLocaleDateString()}
      </td>
      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
        {isSuperAdmin && (
          <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
            <button
              onClick={() => onToggleStatus(user.id, user.status)}
              style={{
                background: user.status === 'active' ? COLORS.success : COLORS.primary,
                border: 'none',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                cursor: 'pointer',
                color: 'white',
                fontSize: '0.7rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {user.status === 'active' ? (t('suspend') || 'Suspend') : (t('activate') || 'Activate')}
            </button>
            <button
              onClick={() => onEdit(user)}
              style={{
                background: 'transparent',
                border: 'none',
                color: COLORS.info,
                cursor: 'pointer',
                padding: '0.2rem 0.4rem',
                borderRadius: '4px',
                transition: 'all 0.2s',
                fontSize: '0.8rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${COLORS.info}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button
              onClick={() => onDelete(user.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: COLORS.danger,
                cursor: 'pointer',
                padding: '0.2rem 0.4rem',
                borderRadius: '4px',
                transition: 'all 0.2s',
                fontSize: '0.8rem',
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
          </div>
        )}
      </td>
    </tr>
  );
}

// ========== MAIN COMPONENT ==========
export default function UserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    phone: '',
    password: '',
    full_name: '',
    role: '',
    branch_id: '',
    status: 'active',
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const userRole = getUserRoleFromToken();
  const isSuperAdmin = userRole === ROLES.SUPERADMIN;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { headers: getAuthHeaders() });
      const data = await res.json();
      const userList = Array.isArray(data) ? data : (data.users || []);
      setUsers(userList);
      setFilteredUsers(userList);
    } catch (err) {
      console.error(err);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches', { headers: getAuthHeaders() });
      const data = await res.json();
      setBranches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setBranches([]);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles', { headers: getAuthHeaders() });
      const data = await res.json();
      const rolesList = data.roles || (Array.isArray(data) ? data : []);
      setRoles(rolesList);
    } catch (err) {
      console.error(err);
      setRoles([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBranches();
    fetchRoles();
  }, []);

  useEffect(() => {
    let result = [...users];
    if (search) {
      result = result.filter(u => 
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.phone.includes(search)
      );
    }
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(u => u.status === statusFilter);
    }
    setFilteredUsers(result);
  }, [search, roleFilter, statusFilter, users]);

  const openAddModal = () => {
    setEditingUser(null);
    setForm({ phone: '', password: '', full_name: '', role: '', branch_id: '', status: 'active' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setForm({
      phone: user.phone,
      password: '',
      full_name: user.full_name,
      role: user.role,
      branch_id: user.branch_id?.toString() || '',
      status: user.status,
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      const payload = editingUser
        ? {
            status: form.status,
            role: form.role,
            branch_id: form.branch_id ? Number(form.branch_id) : null,
          }
        : {
            phone: form.phone,
            password: form.password,
            full_name: form.full_name,
            role: form.role,
            branch_id: form.branch_id ? Number(form.branch_id) : null,
          };
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed');
      setMessage(editingUser ? (t('userUpdated') || 'User updated') : (t('userCreated') || 'User created'));
      fetchUsers();
      setShowModal(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDeleteUser') || 'Delete this user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        setMessage(t('userDeleted') || 'User deleted');
        setTimeout(() => setMessage(''), 3000);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setMessage(`User ${newStatus === 'active' ? 'activated' : 'suspended'}`);
        setTimeout(() => setMessage(''), 3000);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeCount = users.filter(u => u.status === 'active').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
              <FontAwesomeIcon icon={faUserShield} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
              {t('userManagement') || 'User Management'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0.15rem 0 0 0' }}>
              {t('manageUsers') || 'Manage system users and their permissions'}
            </p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={openAddModal}
              style={{
                background: COLORS.primary,
                border: 'none',
                padding: '0.5rem 1.25rem',
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
              <FontAwesomeIcon icon={faPlus} /> {t('addUser') || 'Add User'}
            </button>
          )}
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

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <KpiCard
            label={t('totalUsers') || 'Total Users'}
            value={users.length}
            icon={faUsers}
            color={COLORS.primary}
          />
          <KpiCard
            label={t('active') || 'Active'}
            value={activeCount}
            icon={faCheckCircle}
            color={COLORS.success}
          />
          <KpiCard
            label={t('suspended') || 'Suspended'}
            value={suspendedCount}
            icon={faTimesCircle}
            color={suspendedCount > 0 ? COLORS.danger : COLORS.textMuted}
          />
        </div>

        {/* Search and Filters */}
        <div style={{
          background: 'white',
          padding: '1rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          boxShadow: COLORS.shadow,
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
            <input
              type="text"
              placeholder={t('searchUsers') || 'Search by name or phone...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.85rem',
                background: COLORS.bgGray,
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
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              fontSize: '0.85rem',
              background: COLORS.bgGray,
              minWidth: '130px',
            }}
          >
            <option value="all">{t('allRoles') || 'All Roles'}</option>
            {roles.map(role => (
              <option key={role.id} value={role.name}>{role.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              fontSize: '0.85rem',
              background: COLORS.bgGray,
              minWidth: '130px',
            }}
          >
            <option value="all">{t('allStatus') || 'All Status'}</option>
            <option value="active">{t('active') || 'Active'}</option>
            <option value="suspended">{t('suspended') || 'Suspended'}</option>
          </select>
          {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setRoleFilter('all');
                setStatusFilter('all');
              }}
              style={{
                padding: '0.4rem 1rem',
                background: COLORS.bgGray,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.danger;
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = COLORS.danger;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.bgGray;
                e.currentTarget.style.color = COLORS.textPrimary;
                e.currentTarget.style.borderColor = COLORS.border;
              }}
            >
              <FontAwesomeIcon icon={faTimes} style={{ fontSize: '0.7rem' }} />
              {t('clearFilters') || 'Clear Filters'}
            </button>
          )}
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'white',
            borderRadius: '12px',
            boxShadow: COLORS.shadow,
          }}>
            <FontAwesomeIcon icon={faUsers} style={{ fontSize: '3rem', color: COLORS.textMuted, marginBottom: '1rem' }} />
            <h3 style={{ color: COLORS.textSecondary, fontSize: '1rem' }}>{t('noUsersFound') || 'No users found'}</h3>
            <p style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>
              {t('tryAdjustingFilters') || 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', boxShadow: COLORS.shadow }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: COLORS.bgGray, borderBottom: `1px solid ${COLORS.border}` }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('name') || 'Name'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('phone') || 'Phone'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('role') || 'Role'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('branch') || 'Branch'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('status') || 'Status'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('created') || 'Created'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('actions') || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onToggleStatus={toggleStatus}
                    isSuperAdmin={isSuperAdmin}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
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
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '16px',
              width: '500px',
              maxWidth: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: COLORS.shadowHover,
              animation: 'slideUp 0.3s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: COLORS.textPrimary }}>
                <FontAwesomeIcon icon={editingUser ? faEdit : faPlus} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
                {editingUser ? (t('editUser') || 'Edit User') : (t('addUser') || 'Add User')}
              </h2>
              <button
                onClick={() => setShowModal(false)}
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

            <form onSubmit={handleSubmit}>
              {!editingUser && (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                      {t('fullName') || 'Full Name'} *
                    </label>
                    <input
                      type="text"
                      placeholder={t('fullName') || 'Full Name'}
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '8px',
                        fontSize: '0.9rem',
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
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                      {t('phoneNumber') || 'Phone Number'} *
                    </label>
                    <input
                      type="tel"
                      placeholder={t('phoneNumber') || 'Phone Number'}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '8px',
                        fontSize: '0.9rem',
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
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                      {t('password') || 'Password'} *
                    </label>
                    <input
                      type="password"
                      placeholder={t('password') || 'Password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      minLength={6}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '8px',
                        fontSize: '0.9rem',
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
                  </div>
                </>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                  {t('role') || 'Role'} *
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    background: 'white',
                  }}
                >
                  <option value="">{t('selectRole') || 'Select Role'}</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>

              {isSuperAdmin && branches.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                    <FontAwesomeIcon icon={faBuilding} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
                    {t('branchOptional') || 'Branch (optional)'}
                  </label>
                  <select
                    value={form.branch_id}
                    onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      background: 'white',
                    }}
                  >
                    <option value="">{t('defaultBranch') || "Default (user's own branch)"}</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {editingUser && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                    {t('status') || 'Status'}
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      background: 'white',
                    }}
                  >
                    <option value="active">{t('active') || 'Active'}</option>
                    <option value="suspended">{t('suspended') || 'Suspended'}</option>
                  </select>
                </div>
              )}

              {error && (
                <div style={{
                  color: COLORS.danger,
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  padding: '0.5rem 0.75rem',
                  background: '#fee2e2',
                  borderRadius: '8px',
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
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
                  <FontAwesomeIcon icon={faSave} />
                  {editingUser ? (t('update') || 'Update') : (t('create') || 'Create')}
                </button>
              </div>
            </form>
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
    </DashboardLayout>
  );
}