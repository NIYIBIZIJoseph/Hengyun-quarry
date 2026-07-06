// src/components/settings/OrganizationSettings.tsx
import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrashAlt, faSave, faTimes, 
  faBuilding, faGlobe, faUsers, faCheckCircle, 
  faExclamationTriangle, faMapMarkerAlt, faPhone, faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { ROLES } from "@/lib/roles";

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

interface Branch {
  id: number;
  name: string;
  location: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
}

interface Department {
  id: number;
  name: string;
  branch_id?: number;
  branch_name?: string;
}

interface GlobalSetting {
  key: string;
  value: string;
  description?: string;
}

export default function OrganizationSettings() {
  const { t } = useTranslation();
  const [globalSettings, setGlobalSettings] = useState<GlobalSetting[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', location: '', phone: '', email: '' });
  const [deptForm, setDeptForm] = useState({ name: '' });
  const [saving, setSaving] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);

  const userRole = typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('user') || '{}').role) : null;
  const canEdit = userRole === ROLES.SUPERADMIN;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [globalRes, branchesRes, deptsRes] = await Promise.all([
        fetch('/api/settings', { headers: getAuthHeaders() }),
        fetch('/api/branches', { headers: getAuthHeaders() }),
        fetch('/api/departments', { headers: getAuthHeaders() }),
      ]);
      if (!globalRes.ok) throw new Error('Failed to fetch global settings');
      if (!branchesRes.ok) throw new Error('Failed to fetch branches');
      if (!deptsRes.ok) throw new Error('Failed to fetch departments');
      setGlobalSettings(await globalRes.json());
      setBranches(await branchesRes.json());
      setDepartments(await deptsRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateGlobalSetting = async (key: string, value: string) => {
    if (!canEdit) return;
    setSavingGlobal(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        setGlobalSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
        setMessage(`${key} updated successfully`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        const err = await res.json();
        setError(err.error || t('updateFailed') || 'Update failed');
      }
    } catch (err) {
      setError(t('errorUpdatingSetting') || 'Error updating setting');
    } finally {
      setSavingGlobal(false);
    }
  };

  const getSettingValue = (key: string) => {
    return globalSettings.find(s => s.key === key)?.value || '';
  };

  const saveBranch = async () => {
    if (!branchForm.name.trim()) return;
    setSaving(true);
    try {
      const url = editingBranch ? `/api/branches/${editingBranch.id}` : '/api/branches';
      const method = editingBranch ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(branchForm),
      });
      if (res.ok) {
        setShowBranchForm(false);
        setEditingBranch(null);
        setBranchForm({ name: '', location: '', phone: '', email: '' });
        setMessage(editingBranch ? 'Branch updated successfully' : 'Branch added successfully');
        setTimeout(() => setMessage(''), 3000);
        fetchData();
      } else {
        const err = await res.json();
        setError(err.error || t('saveFailed') || 'Save failed');
      }
    } catch (err) {
      setError(t('errorSavingBranch') || 'Error saving branch');
    } finally {
      setSaving(false);
    }
  };

  const deleteBranch = async (id: number) => {
    if (!confirm(t('confirmDeleteBranch') || 'Delete this branch? It will be soft‑deleted.')) return;
    try {
      const res = await fetch(`/api/branches/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        setMessage('Branch deleted successfully');
        setTimeout(() => setMessage(''), 3000);
        fetchData();
      } else {
        const err = await res.json();
        setError(err.error || t('deleteFailed') || 'Delete failed');
      }
    } catch (err) {
      setError(t('errorDeletingBranch') || 'Error deleting branch');
    }
  };

  const saveDepartment = async () => {
    if (!deptForm.name.trim()) return;
    setSaving(true);
    try {
      const url = '/api/departments';
      const method = editingDept ? 'PUT' : 'POST';
      const body = editingDept ? { id: editingDept.id, name: deptForm.name } : { name: deptForm.name };
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowDeptForm(false);
        setEditingDept(null);
        setDeptForm({ name: '' });
        setMessage(editingDept ? 'Department updated successfully' : 'Department added successfully');
        setTimeout(() => setMessage(''), 3000);
        fetchData();
      } else {
        const err = await res.json();
        setError(err.error || t('saveFailed') || 'Save failed');
      }
    } catch (err) {
      setError(t('errorSavingDepartment') || 'Error saving department');
    } finally {
      setSaving(false);
    }
  };

  const deleteDepartment = async (id: number) => {
    if (!confirm(t('confirmDeleteDepartment') || 'Delete this department? Workers will lose department reference.')) return;
    try {
      const res = await fetch(`/api/departments?id=${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        setMessage('Department deleted successfully');
        setTimeout(() => setMessage(''), 3000);
        fetchData();
      } else {
        const err = await res.json();
        setError(err.error || t('deleteFailed') || 'Delete failed');
      }
    } catch (err) {
      setError(t('errorDeletingDepartment') || 'Error deleting department');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
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

      {/* Company Information */}
      <div style={{ 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: '12px',
        boxShadow: COLORS.shadow,
        marginBottom: '2rem',
        borderLeft: `3px solid ${COLORS.primary}`,
      }}>
        <h3 style={{ margin: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: COLORS.textPrimary }}>
          <FontAwesomeIcon icon={faBuilding} style={{ color: COLORS.primary }} /> {t('companyInformation') || 'Company Information'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', fontSize: '0.85rem', color: COLORS.textSecondary }}>
              <FontAwesomeIcon icon={faBuilding} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
              {t('companyName') || 'Company Name'}
            </label>
            {canEdit ? (
              <input
                type="text"
                value={getSettingValue('company_name')}
                onChange={(e) => updateGlobalSetting('company_name', e.target.value)}
                disabled={savingGlobal}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  opacity: savingGlobal ? 0.6 : 1,
                }}
              />
            ) : (
              <span style={{ fontSize: '0.9rem', color: COLORS.textPrimary }}>{getSettingValue('company_name')}</span>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', fontSize: '0.85rem', color: COLORS.textSecondary }}>
              <FontAwesomeIcon icon={faGlobe} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
              {t('taxRate') || 'Tax Rate (%)'}
            </label>
            {canEdit ? (
              <input
                type="number"
                step="0.1"
                value={getSettingValue('tax_rate')}
                onChange={(e) => updateGlobalSetting('tax_rate', e.target.value)}
                disabled={savingGlobal}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  opacity: savingGlobal ? 0.6 : 1,
                }}
              />
            ) : (
              <span style={{ fontSize: '0.9rem', color: COLORS.textPrimary }}>{getSettingValue('tax_rate')}%</span>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', fontSize: '0.85rem', color: COLORS.textSecondary }}>
              <FontAwesomeIcon icon={faGlobe} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
              {t('currency') || 'Currency'}
            </label>
            {canEdit ? (
              <input
                type="text"
                value={getSettingValue('currency')}
                onChange={(e) => updateGlobalSetting('currency', e.target.value)}
                disabled={savingGlobal}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  opacity: savingGlobal ? 0.6 : 1,
                }}
              />
            ) : (
              <span style={{ fontSize: '0.9rem', color: COLORS.textPrimary }}>{getSettingValue('currency')}</span>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', fontSize: '0.85rem', color: COLORS.textSecondary }}>
              <FontAwesomeIcon icon={faGlobe} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
              {t('defaultLanguage') || 'Default Language'}
            </label>
            {canEdit ? (
              <select
                value={getSettingValue('default_language')}
                onChange={(e) => updateGlobalSetting('default_language', e.target.value)}
                disabled={savingGlobal}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  background: 'white',
                  opacity: savingGlobal ? 0.6 : 1,
                }}
              >
                <option value="en">English</option>
                <option value="rw">Kinyarwanda</option>
                <option value="zh">中文</option>
              </select>
            ) : (
              <span style={{ fontSize: '0.9rem', color: COLORS.textPrimary }}>{getSettingValue('default_language')}</span>
            )}
          </div>
        </div>
        {savingGlobal && (
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: COLORS.textMuted, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FontAwesomeIcon icon={faSave} spin /> {t('saving') || 'Saving...'}
          </div>
        )}
      </div>

      {/* Branches Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: COLORS.textPrimary }}>
              <FontAwesomeIcon icon={faBuilding} style={{ color: COLORS.primary }} /> {t('branches') || 'Branches'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: COLORS.textMuted, margin: '0.15rem 0 0 0' }}>
              {branches.length} {t('branchesTotal') || 'branches total'}
            </p>
          </div>
          {canEdit && (
            <button
              onClick={() => { setEditingBranch(null); setBranchForm({ name: '', location: '', phone: '', email: '' }); setShowBranchForm(true); }}
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
              <FontAwesomeIcon icon={faPlus} /> {t('addBranch') || 'Add Branch'}
            </button>
          )}
        </div>

        {showBranchForm && (
          <div style={{ 
            background: 'white', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1rem', 
            border: `1px solid ${COLORS.border}`,
            boxShadow: COLORS.shadow,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder={t('branchName') || 'Branch Name'}
                value={branchForm.name}
                onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.border}`, borderRadius: '6px' }}
              />
              <input
                type="text"
                placeholder={t('location') || 'Location'}
                value={branchForm.location}
                onChange={e => setBranchForm({ ...branchForm, location: e.target.value })}
                style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.border}`, borderRadius: '6px' }}
              />
              <input
                type="text"
                placeholder={t('phone') || 'Phone'}
                value={branchForm.phone}
                onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })}
                style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.border}`, borderRadius: '6px' }}
              />
              <input
                type="email"
                placeholder={t('email') || 'Email'}
                value={branchForm.email}
                onChange={e => setBranchForm({ ...branchForm, email: e.target.value })}
                style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.border}`, borderRadius: '6px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowBranchForm(false); setEditingBranch(null); }}
                style={{
                  padding: '6px 16px',
                  background: COLORS.bgGray,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
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
                onClick={saveBranch}
                disabled={saving}
                style={{
                  padding: '6px 16px',
                  background: COLORS.primary,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  color: 'white',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  opacity: saving ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = COLORS.primary;
                  }
                }}
              >
                <FontAwesomeIcon icon={faSave} /> {saving ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
          {branches.map(branch => (
            <div
              key={branch.id}
              style={{
                background: 'white',
                padding: '1rem',
                borderRadius: '8px',
                border: `1px solid ${COLORS.border}`,
                transition: 'all 0.2s',
                boxShadow: COLORS.shadow,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.boxShadow = COLORS.shadowHover;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.boxShadow = COLORS.shadow;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: '600', color: COLORS.textPrimary }}>{branch.name}</div>
                  {branch.location && (
                    <div style={{ fontSize: '0.8rem', color: COLORS.textMuted, marginTop: '0.15rem' }}>
                      <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
                      {branch.location}
                    </div>
                  )}
                  {branch.phone && (
                    <div style={{ fontSize: '0.8rem', color: COLORS.textMuted }}>
                      <FontAwesomeIcon icon={faPhone} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
                      {branch.phone}
                    </div>
                  )}
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button
                      onClick={() => { setEditingBranch(branch); setBranchForm({ name: branch.name, location: branch.location || '', phone: branch.phone || '', email: branch.email || '' }); setShowBranchForm(true); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: COLORS.info,
                        cursor: 'pointer',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        transition: 'all 0.2s',
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
                      onClick={() => deleteBranch(branch.id)}
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
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Departments Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: COLORS.textPrimary }}>
              <FontAwesomeIcon icon={faUsers} style={{ color: COLORS.primary }} /> {t('departments') || 'Departments'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: COLORS.textMuted, margin: '0.15rem 0 0 0' }}>
              {departments.length} {t('departmentsTotal') || 'departments total'}
            </p>
          </div>
          {canEdit && (
            <button
              onClick={() => { setEditingDept(null); setDeptForm({ name: '' }); setShowDeptForm(true); }}
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
              <FontAwesomeIcon icon={faPlus} /> {t('addDepartment') || 'Add Department'}
            </button>
          )}
        </div>

        {showDeptForm && (
          <div style={{ 
            background: 'white', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1rem', 
            border: `1px solid ${COLORS.border}`,
            boxShadow: COLORS.shadow,
          }}>
            <input
              type="text"
              placeholder={t('departmentName') || 'Department Name'}
              value={deptForm.name}
              onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
              style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.border}`, borderRadius: '6px', marginBottom: '0.5rem' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowDeptForm(false); setEditingDept(null); }}
                style={{
                  padding: '6px 16px',
                  background: COLORS.bgGray,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
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
                onClick={saveDepartment}
                disabled={saving}
                style={{
                  padding: '6px 16px',
                  background: COLORS.primary,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  color: 'white',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  opacity: saving ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = COLORS.primary;
                  }
                }}
              >
                <FontAwesomeIcon icon={faSave} /> {saving ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
          {departments.map(dept => (
            <div
              key={dept.id}
              style={{
                background: 'white',
                padding: '1rem',
                borderRadius: '8px',
                border: `1px solid ${COLORS.border}`,
                transition: 'all 0.2s',
                boxShadow: COLORS.shadow,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.boxShadow = COLORS.shadowHover;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.boxShadow = COLORS.shadow;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{ fontWeight: '500', color: COLORS.textPrimary }}>{dept.name}</div>
                {dept.branch_name && (
                  <div style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                    <FontAwesomeIcon icon={faBuilding} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
                    {dept.branch_name}
                  </div>
                )}
              </div>
              {canEdit && (
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button
                    onClick={() => { setEditingDept(dept); setDeptForm({ name: dept.name }); setShowDeptForm(true); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: COLORS.info,
                      cursor: 'pointer',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '4px',
                      transition: 'all 0.2s',
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
                    onClick={() => deleteDepartment(dept.id)}
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
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
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