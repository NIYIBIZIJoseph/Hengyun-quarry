// src/components/settings/SupportConfigSettings.tsx
import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, faHeadset, faTicketAlt, faClock, faEnvelope,
  faSms, faPaperclip, faExclamationTriangle, faCheckCircle
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

interface Config {
  key: string;
  value: string;
  description: string;
}

function ConfigRow({ 
  label, 
  key, 
  value, 
  description, 
  type = 'text',
  options,
  onUpdate,
  saving,
  canEdit,
  icon
}: { 
  label: string; 
  key: string; 
  value: string; 
  description: string; 
  type?: 'text' | 'number' | 'select' | 'time';
  options?: { value: string; label: string }[];
  onUpdate: (key: string, value: string) => void;
  saving: boolean;
  canEdit: boolean;
  icon?: any;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) {
      onUpdate(key, localValue);
    }
  };

  return (
    <div 
      style={{
        marginBottom: '1.25rem',
        paddingBottom: '1.25rem',
        borderBottom: `1px solid ${COLORS.border}`,
        transition: 'all 0.2s',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        {icon && <FontAwesomeIcon icon={icon} style={{ color: COLORS.primary, fontSize: '0.8rem' }} />}
        <label style={{ 
          fontWeight: '500', 
          fontSize: '0.85rem',
          color: COLORS.textPrimary,
        }}>
          {label}
        </label>
      </div>
      {type === 'select' ? (
        <select
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          disabled={!canEdit || saving}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: `1px solid ${isHovered ? COLORS.primary : COLORS.border}`,
            borderRadius: '8px',
            fontSize: '0.9rem',
            background: 'white',
            transition: 'all 0.2s',
            opacity: !canEdit ? 0.6 : 1,
          }}
        >
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          disabled={!canEdit || saving}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: `1px solid ${isHovered ? COLORS.primary : COLORS.border}`,
            borderRadius: '8px',
            fontSize: '0.9rem',
            transition: 'all 0.2s',
            opacity: !canEdit ? 0.6 : 1,
          }}
        />
      )}
      <small style={{ color: COLORS.textMuted, display: 'block', marginTop: '0.25rem', fontSize: '0.75rem' }}>
        {description}
      </small>
    </div>
  );
}

export default function SupportConfigSettings() {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const userRole = typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('user') || '{}').role) : null;
  const canEdit = userRole === ROLES.SUPERADMIN;

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/support-config', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch support config');
      const data = await res.json();
      setConfigs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const updateConfig = async (key: string, value: string) => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings/support-config', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error('Update failed');
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value } : c));
      setMessage(`${key} updated successfully`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getValue = (key: string) => configs.find(c => c.key === key)?.value || '';

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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: COLORS.textPrimary, margin: 0 }}>
          <FontAwesomeIcon icon={faHeadset} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
          {t('supportConfiguration') || 'Support Configuration'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: COLORS.textMuted, margin: '0.15rem 0 0 0' }}>
          {t('supportConfigDesc') || 'Configure ticket categories, priorities, and support workflows.'}
        </p>
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
        padding: '1.5rem', 
        borderRadius: '12px', 
        boxShadow: COLORS.shadow,
      }}>
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

        <ConfigRow
          label={t('defaultTicketPriority') || 'Default Ticket Priority'}
          key="support_default_priority"
          value={getValue('support_default_priority')}
          description={t('defaultTicketPriorityDesc') || 'Default priority for new tickets.'}
          type="select"
          icon={faTicketAlt}
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' },
          ]}
          onUpdate={updateConfig}
          saving={saving}
          canEdit={canEdit}
        />

        <ConfigRow
          label={t('defaultTicketCategory') || 'Default Ticket Category'}
          key="support_default_category"
          value={getValue('support_default_category')}
          description={t('defaultTicketCategoryDesc') || 'Default category for new tickets.'}
          type="text"
          icon={faTicketAlt}
          onUpdate={updateConfig}
          saving={saving}
          canEdit={canEdit}
        />

        <ConfigRow
          label={t('autoCloseDays') || 'Auto-close Days (inactivity)'}
          key="support_auto_close_days"
          value={getValue('support_auto_close_days')}
          description={t('autoCloseDaysDesc') || 'Days after last activity before auto-closing a resolved ticket.'}
          type="number"
          icon={faClock}
          onUpdate={updateConfig}
          saving={saving}
          canEdit={canEdit}
        />

        <ConfigRow
          label={t('emailNotifications') || 'Email Notifications'}
          key="support_email_notifications"
          value={getValue('support_email_notifications')}
          description={t('emailNotificationsDesc') || 'Send email to assigned staff on ticket updates.'}
          type="select"
          icon={faEnvelope}
          options={[
            { value: 'true', label: 'Enabled' },
            { value: 'false', label: 'Disabled' },
          ]}
          onUpdate={updateConfig}
          saving={saving}
          canEdit={canEdit}
        />

        <ConfigRow
          label={t('smsNotificationsUrgent') || 'SMS Notifications for Urgent Tickets'}
          key="support_sms_notifications_urgent"
          value={getValue('support_sms_notifications_urgent')}
          description={t('smsNotificationsUrgentDesc') || 'Requires SMS service integration.'}
          type="select"
          icon={faSms}
          options={[
            { value: 'true', label: 'Enabled' },
            { value: 'false', label: 'Disabled' },
          ]}
          onUpdate={updateConfig}
          saving={saving}
          canEdit={canEdit}
        />

        <ConfigRow
          label={t('maxAttachmentsPerTicket') || 'Max Attachments per Ticket'}
          key="support_max_attachments"
          value={getValue('support_max_attachments')}
          description={t('maxAttachmentsPerTicketDesc') || 'Limit number of files per ticket.'}
          type="number"
          icon={faPaperclip}
          onUpdate={updateConfig}
          saving={saving}
          canEdit={canEdit}
        />

        {saving && (
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: COLORS.textMuted, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FontAwesomeIcon icon={faSave} spin /> {t('saving') || 'Saving configuration...'}
          </div>
        )}
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