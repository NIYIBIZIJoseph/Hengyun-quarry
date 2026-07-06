import { useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faTicketAlt } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== CLEAN DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  danger: "#ef4444",  // ← ADDED
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  bgGray: "#f9fafb",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowHover: "0 8px 25px rgba(0,0,0,0.08)",
};

export default function NewTicket() {
  const { t } = useTranslation();
  const router = useRouter();
  const [form, setForm] = useState({
    user_name: '',
    phone: '',
    category: '',
    priority: 'medium',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(t('failedToCreateTicket') || 'Failed to create ticket');
      const data = await res.json();
      router.push(`/dashboard/support/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
            <FontAwesomeIcon icon={faTicketAlt} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
            {t('createNewTicket') || 'Create New Support Ticket'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0.15rem 0 0 0' }}>
            {t('submitTicket') || 'Submit a new support ticket'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: COLORS.shadow,
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
              {t('name') || 'Name'} *
            </label>
            <input
              type="text"
              name="user_name"
              required
              value={form.user_name}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
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
            <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
              {t('phone') || 'Phone'}
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
              {t('category') || 'Category'}
            </label>
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder={t('categoryPlaceholder') || 'e.g., Login, Attendance, Billing'}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
              {t('priority') || 'Priority'}
            </label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.9rem',
                background: 'white',
              }}
            >
              <option value="low">{t('priorityLow') || 'Low'}</option>
              <option value="medium">{t('priorityMedium') || 'Medium'}</option>
              <option value="high">{t('priorityHigh') || 'High'}</option>
              <option value="urgent">{t('priorityUrgent') || 'Urgent'}</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
              {t('subject') || 'Subject'} *
            </label>
            <input
              type="text"
              name="subject"
              required
              value={form.subject}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
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
            <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
              {t('message') || 'Message'} *
            </label>
            <textarea
              name="message"
              rows={5}
              required
              value={form.message}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.9rem',
                resize: 'vertical',
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

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => router.push('/dashboard/support')}
              style={{
                padding: '0.6rem 1.5rem',
                background: COLORS.bgGray,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
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
              type="submit"
              disabled={loading}
              style={{
                padding: '0.6rem 1.5rem',
                background: COLORS.primary,
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                color: 'white',
                fontWeight: '600',
                transition: 'all 0.2s',
                opacity: loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = COLORS.primary;
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <FontAwesomeIcon icon={faSave} />
              {loading ? (t('creating') || 'Creating...') : (t('createTicket') || 'Create Ticket')}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}