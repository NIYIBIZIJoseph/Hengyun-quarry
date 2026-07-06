// src/components/settings/TeamManagementSettings.tsx - Full updated file

import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, faPlus, faEdit, faTrashAlt, faTimes,
  faUser, faUsers, faImage, faSort, faCheckCircle,
  faExclamationTriangle, faCamera
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

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

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

export default function TeamManagementSettings() {
  const { t } = useTranslation();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({ name: '', role: '', bio: '', image_url: '', sort_order: 0, is_active: true });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    const res = await fetch('/api/team-members', { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      setMembers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) setForm({ ...form, image_url: data.url });
      else alert(data.message || t('uploadFailed') || 'Upload failed');
    } catch (err) {
      alert(t('networkError') || 'Network error');
    } finally {
      setUploading(false);
    }
  };

  const saveMember = async () => {
    if (!form.name || !form.role) {
      setError(t('nameAndRoleRequired') || 'Name and role are required');
      return;
    }
    setSaving(true);
    setError('');
    const url = editing ? `/api/team-members/${editing.id}` : '/api/team-members';
    const method = editing ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMessage(editing ? t('memberUpdated') || 'Member updated' : t('memberAdded') || 'Member added');
        setEditing(null);
        setForm({ name: '', role: '', bio: '', image_url: '', sort_order: 0, is_active: true });
        setShowForm(false);
        fetchMembers();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || t('saveFailed') || 'Save failed');
      }
    } catch (err) {
      setError(t('networkError') || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (id: number) => {
    if (!confirm(t('confirmDeleteTeamMember') || 'Delete this team member?')) return;
    const res = await fetch(`/api/team-members/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (res.ok) {
      setMessage(t('memberDeleted') || 'Member deleted');
      setTimeout(() => setMessage(''), 3000);
      fetchMembers();
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
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: COLORS.textPrimary, margin: 0 }}>
              <FontAwesomeIcon icon={faUsers} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
              {t('teamManagement') || 'Team Management'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: COLORS.textMuted, margin: '0.15rem 0 0 0' }}>
              {members.length} {t('members') || 'members'} {t('onTeam') || 'on team'}
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setForm({ name: '', role: '', bio: '', image_url: '', sort_order: 0, is_active: true });
              setShowForm(!showForm);
              setError('');
            }}
            style={{
              padding: '0.5rem 1.25rem',
              background: showForm ? COLORS.danger : COLORS.primary,
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
              boxShadow: showForm ? '0 2px 8px rgba(239, 68, 68, 0.3)' : '0 2px 8px rgba(245, 158, 11, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <FontAwesomeIcon icon={showForm ? faTimes : faPlus} />
            {showForm ? (t('cancel') || 'Cancel') : (t('addMember') || 'Add Member')}
          </button>
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

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '12px', 
          marginBottom: '1.5rem',
          boxShadow: COLORS.shadow,
          borderLeft: `3px solid ${COLORS.primary}`,
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: COLORS.textPrimary }}>
            {editing ? t('editMember') || 'Edit Member' : t('addNewMember') || 'Add New Member'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                {t('name') || 'Name'} *
              </label>
              <input
                type="text"
                placeholder={t('name') || 'Name'}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                {t('role') || 'Role'} *
              </label>
              <input
                type="text"
                placeholder={t('rolePlaceholder') || "e.g., 'Operations Manager'"}
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
              {t('shortBio') || 'Short Bio'}
            </label>
            <textarea
              placeholder={t('shortBio') || 'Short bio'}
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.9rem',
                resize: 'vertical',
              }}
            />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
              <FontAwesomeIcon icon={faImage} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
              {t('profileImage') || 'Profile Image'}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{
                  padding: '0.4rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  flex: 1,
                }}
              />
              {uploading && (
                <span style={{ fontSize: '0.8rem', color: COLORS.textMuted }}>
                  <FontAwesomeIcon icon={faSave} spin /> {t('uploading') || 'Uploading...'}
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder={t('orImageUrl') || 'Or image URL'}
              value={form.image_url}
              onChange={e => setForm({ ...form, image_url: e.target.value })}
              style={{
                width: '100%',
                marginTop: '0.5rem',
                padding: '10px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.9rem',
              }}
            />
            {form.image_url && (
              <div style={{ marginTop: '0.5rem' }}>
                <img 
                  src={form.image_url} 
                  alt="Preview" 
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    objectFit: 'cover', 
                    borderRadius: '8px', 
                    border: `2px solid ${COLORS.primary}` 
                  }} 
                />
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                <FontAwesomeIcon icon={faSort} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
                {t('sortOrder') || 'Sort Order'}
              </label>
              <input
                type="number"
                placeholder={t('sortOrder') || 'Sort order (lower = earlier)'}
                value={form.sort_order}
                onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                {t('status') || 'Status'}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  style={{ accentColor: COLORS.primary, width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '0.85rem', color: COLORS.textSecondary }}>
                  {t('activeShowOnWebsite') || 'Active (show on website)'}
                </span>
              </label>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowForm(false);
                setEditing(null);
                setForm({ name: '', role: '', bio: '', image_url: '', sort_order: 0, is_active: true });
                setError('');
              }}
              style={{
                padding: '0.5rem 1.25rem',
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
              onClick={saveMember}
              disabled={saving}
              style={{
                padding: '0.5rem 1.25rem',
                background: COLORS.primary,
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                color: 'white',
                fontWeight: '600',
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
              {saving ? (t('saving') || 'Saving...') : (editing ? t('update') || 'Update' : t('add') || 'Add')}
            </button>
          </div>
        </div>
      )}

      {/* Team Members Grid - FIXED with professional edit/delete buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {members.map(m => (
          <div
            key={m.id}
            style={{
              background: 'white',
              padding: '1.25rem',
              borderRadius: '12px',
              boxShadow: COLORS.shadow,
              transition: 'all 0.2s',
              border: `1px solid ${COLORS.border}`,
              opacity: m.is_active ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = COLORS.shadowHover;
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = COLORS.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = COLORS.shadow;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = COLORS.border;
            }}
          >
            {m.image_url ? (
              <img 
                src={m.image_url} 
                alt={m.name} 
                style={{ 
                  width: '100%', 
                  height: '180px', 
                  objectFit: 'cover', 
                  borderRadius: '8px', 
                  marginBottom: '0.75rem',
                }} 
              />
            ) : (
              <div style={{ 
                width: '100%', 
                height: '180px', 
                background: COLORS.bgGray, 
                borderRadius: '8px', 
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: COLORS.textMuted,
                fontSize: '3rem',
              }}>
                <FontAwesomeIcon icon={faUser} />
              </div>
            )}
            <h4 style={{ margin: 0, color: COLORS.textPrimary }}>{m.name}</h4>
            <p style={{ color: COLORS.primary, fontWeight: '600', margin: '0.15rem 0' }}>{m.role}</p>
            {m.bio && (
              <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0.5rem 0' }}>
                {m.bio}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', color: COLORS.textMuted }}>
                <FontAwesomeIcon icon={faSort} style={{ marginRight: '0.2rem' }} />
                {t('sort') || 'Sort'}: {m.sort_order}
              </span>
              <span style={{
                fontSize: '0.6rem',
                padding: '2px 10px',
                borderRadius: '12px',
                background: m.is_active ? '#d1fae5' : '#fee2e2',
                color: m.is_active ? '#065f46' : '#991b1b',
                fontWeight: '600',
              }}>
                {m.is_active ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
              </span>
            </div>
            
            {/* FIXED: Professional Edit/Delete Buttons */}
            <div style={{ 
              marginTop: '0.75rem', 
              display: 'flex', 
              gap: '0.5rem',
              paddingTop: '0.75rem',
              borderTop: `1px solid ${COLORS.border}`,
            }}>
              <button
                onClick={() => { 
                  setEditing(m); 
                  setForm({ 
                    name: m.name, 
                    role: m.role, 
                    bio: m.bio || '', 
                    image_url: m.image_url || '', 
                    sort_order: m.sort_order, 
                    is_active: m.is_active 
                  });
                  setShowForm(true);
                  setError('');
                }}
                style={{
                  flex: 1,
                  padding: '0.4rem 0.8rem',
                  background: COLORS.info,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <FontAwesomeIcon icon={faEdit} /> {t('edit') || 'Edit'}
              </button>
              <button
                onClick={() => deleteMember(m.id)}
                style={{
                  flex: 1,
                  padding: '0.4rem 0.8rem',
                  background: COLORS.danger,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <FontAwesomeIcon icon={faTrashAlt} /> {t('delete') || 'Delete'}
              </button>
            </div>
          </div>
        ))}
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