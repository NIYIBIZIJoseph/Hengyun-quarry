import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders, getUserRoleFromToken } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faPlus, faUserShield } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { ROLES } from '@/lib/roles';

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

export default function UserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
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

  const userRole = getUserRoleFromToken();
  const isSuperAdmin = userRole === ROLES.SUPERADMIN;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { headers: getAuthHeaders() });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
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
      // Handle both response formats
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
      await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      superadmin: '#f59e0b',
      admin: '#3b82f6',
      supervisor: '#10b981',
      service_provider: '#8b5cf6',
    };
    return (
      <span style={{ background: roleColors[role] || '#6b7280', color: 'white', padding: '4px 8px', borderRadius: '20px', fontSize: '0.75rem' }}>
        {role}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>{t('loadingUsers') || 'Loading users...'}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FontAwesomeIcon icon={faUserShield} /> {t('userManagement') || 'User Management'}
          </h1>
          {isSuperAdmin && (
            <button onClick={openAddModal} style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FontAwesomeIcon icon={faPlus} /> {t('addUser') || 'Add User'}
            </button>
          )}
        </div>

        {message && <div style={{ marginBottom: '1rem', padding: '12px', background: '#d1fae5', borderRadius: '8px', color: '#065f46' }}>{message}</div>}
        {error && <div style={{ marginBottom: '1rem', padding: '12px', background: '#fee2e2', borderRadius: '8px', color: '#dc2626' }}>{error}</div>}

        <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f3f4f6' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t('name') || 'Name'}</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t('phone') || 'Phone'}</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t('role') || 'Role'}</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t('branch') || 'Branch'}</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>{t('status') || 'Status'}</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t('created') || 'Created'}</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>{t('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{user.full_name}</td>
                  <td style={{ padding: '12px' }}>{user.phone}</td>
                  <td style={{ padding: '12px' }}>{getRoleBadge(user.role)}</td>
                  <td style={{ padding: '12px' }}>{user.branch_name || '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      onClick={() => toggleStatus(user.id, user.status)}
                      disabled={!isSuperAdmin}
                      style={{
                        background: user.status === 'active' ? '#10b981' : '#f59e0b',
                        color: 'white',
                        border: 'none',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        cursor: isSuperAdmin ? 'pointer' : 'default',
                        opacity: isSuperAdmin ? 1 : 0.7,
                      }}
                    >
                      {user.status === 'active' ? (t('active') || 'Active') : (t('suspended') || 'Suspended')}
                    </button>
                  </td>
                  <td style={{ padding: '12px' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {isSuperAdmin && (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => openEditModal(user)}
                          style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
                          title={t('edit') || 'Edit'}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          style={{ background: '#dc2626', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
                          title={t('delete') || 'Delete'}
                        >
                          <FontAwesomeIcon icon={faTrashAlt} />
                        </button>
                      </div>
                    )}
                   </td>
                 </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    {t('noUsersFound') || 'No users found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '500px', maxWidth: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>
              {editingUser ? (t('editUser') || 'Edit User') : (t('addUser') || 'Add User')}
            </h2>
            <form onSubmit={handleSubmit}>
              {!editingUser && (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '4px' }}>{t('fullName') || 'Full Name'}</label>
                    <input
                      type="text"
                      placeholder={t('fullName') || 'Full Name'}
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '4px' }}>{t('phoneNumber') || 'Phone Number'}</label>
                    <input
                      type="tel"
                      placeholder={t('phoneNumber') || 'Phone Number'}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '4px' }}>{t('password') || 'Password'}</label>
                    <input
                      type="password"
                      placeholder={t('password') || 'Password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }}
                    />
                  </div>
                </>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>{t('role') || 'Role'}</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }}
                >
                  <option value="">{t('selectRole') || 'Select Role'}</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>

              {isSuperAdmin && branches.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '4px' }}>{t('branchOptional') || 'Branch (optional)'}</label>
                  <select
                    value={form.branch_id}
                    onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }}
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
                  <label style={{ display: 'block', marginBottom: '4px' }}>{t('status') || 'Status'}</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }}
                  >
                    <option value="active">{t('active') || 'Active'}</option>
                    <option value="suspended">{t('suspended') || 'Suspended'}</option>
                  </select>
                </div>
              )}

              {error && <div style={{ color: '#dc2626', marginBottom: '1rem', padding: '8px', background: '#fee2e2', borderRadius: '6px' }}>{error}</div>}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ background: '#e5e7eb', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  style={{ background: '#f59e0b', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  {editingUser ? (t('update') || 'Update') : (t('create') || 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}