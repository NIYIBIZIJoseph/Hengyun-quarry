// src/components/settings/UIPreferences.tsx
import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, faPalette, faGlobe, faClock, faBell,
  faCompressAlt, faExpandAlt, faMoon, faSun,
  faCheckCircle, faExclamationTriangle, faLanguage
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

function PreferenceRow({ 
  label, 
  value, 
  options, 
  onChange, 
  saving, 
  icon 
}: { 
  label: string; 
  value: string; 
  options: { value: string; label: string }[]; 
  onChange: (value: string) => void; 
  saving: boolean;
  icon?: any;
}) {
  const [isHovered, setIsHovered] = useState(false);

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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={saving}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1px solid ${isHovered ? COLORS.primary : COLORS.border}`,
          borderRadius: '8px',
          fontSize: '0.9rem',
          background: 'white',
          transition: 'all 0.2s',
          opacity: saving ? 0.6 : 1,
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function UIPreferencesSettings() {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchPrefs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/preferences', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch preferences');
      const data = await res.json();
      setPrefs(data);
      
      // Apply theme on load
      if (data.theme) {
        applyPreference('theme', data.theme);
      }
      if (data.compact_mode) {
        applyPreference('compact_mode', data.compact_mode);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrefs();
  }, []);

  const updatePref = async (key: string, value: string) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error('Update failed');
      setPrefs(prev => ({ ...prev, [key]: value }));
      setMessage(t('preferenceSaved') || 'Preference saved successfully');
      setTimeout(() => setMessage(''), 3000);
      applyPreference(key, value);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const applyPreference = (key: string, value: string) => {
    switch (key) {
      case 'theme':
        // Apply theme to document
        if (value === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
          document.documentElement.style.colorScheme = 'dark';
          document.body.classList.add('dark-theme');
        } else if (value === 'light') {
          document.documentElement.setAttribute('data-theme', 'light');
          document.documentElement.style.colorScheme = 'light';
          document.body.classList.remove('dark-theme');
        } else if (value === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
          document.documentElement.style.colorScheme = prefersDark ? 'dark' : 'light';
          if (prefersDark) {
            document.body.classList.add('dark-theme');
          } else {
            document.body.classList.remove('dark-theme');
          }
        }
        break;
      case 'sidebar_collapsed':
        window.dispatchEvent(new CustomEvent('sidebar-preference', { detail: value === 'true' }));
        break;
      case 'language':
        localStorage.setItem('preferred_language', value);
        window.location.reload();
        break;
      case 'compact_mode':
        if (value === 'true') {
          document.body.classList.add('compact-mode');
        } else {
          document.body.classList.remove('compact-mode');
        }
        break;
      case 'date_format':
        break;
      case 'time_format':
        break;
      case 'notifications_sound':
        break;
      case 'default_dashboard':
        break;
    }
  };

  const getValue = (key: string, defaultValue: string) => prefs[key] || defaultValue;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: COLORS.textPrimary, margin: 0 }}>
          <FontAwesomeIcon icon={faPalette} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
          {t('uiPreferences') || 'UI Preferences'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: COLORS.textMuted, margin: '0.15rem 0 0 0' }}>
          {t('uiPrefDesc') || 'Customize your dashboard appearance, language, and layout.'}
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
        <PreferenceRow
          label={t('theme') || 'Theme'}
          value={getValue('theme', 'light')}
          options={[
            { value: 'light', label: '☀️ Light' },
            { value: 'dark', label: '🌙 Dark' },
            { value: 'system', label: '💻 System default' },
          ]}
          onChange={(val) => updatePref('theme', val)}
          saving={saving}
          icon={faSun}
        />

        <PreferenceRow
          label={t('language') || 'Language'}
          value={getValue('language', 'en')}
          options={[
            { value: 'en', label: '🇬🇧 English' },
            { value: 'rw', label: '🇷🇼 Kinyarwanda' },
            { value: 'zh', label: '🇨🇳 中文' },
          ]}
          onChange={(val) => updatePref('language', val)}
          saving={saving}
          icon={faLanguage}
        />

        <PreferenceRow
          label={t('sidebarBehaviour') || 'Sidebar Behaviour'}
          value={getValue('sidebar_collapsed', 'false')}
          options={[
            { value: 'false', label: '📖 Expanded by default' },
            { value: 'true', label: '📕 Collapsed by default' },
          ]}
          onChange={(val) => updatePref('sidebar_collapsed', val)}
          saving={saving}
          icon={faCompressAlt}
        />

        <PreferenceRow
          label={t('compactMode') || 'Compact Mode'}
          value={getValue('compact_mode', 'false')}
          options={[
            { value: 'false', label: '❌ Disabled' },
            { value: 'true', label: '✅ Enabled (reduces whitespace)' },
          ]}
          onChange={(val) => updatePref('compact_mode', val)}
          saving={saving}
          icon={faExpandAlt}
        />

        <PreferenceRow
          label={t('defaultDashboardView') || 'Default Dashboard View'}
          value={getValue('default_dashboard', '/dashboard')}
          options={[
            { value: '/dashboard', label: '📊 Overview' },
            { value: '/dashboard/orders', label: '📦 Orders' },
            { value: '/dashboard/workers', label: '👷 Workers' },
            { value: '/dashboard/attendance/weekly', label: '⏰ Attendance' },
            { value: '/dashboard/inventory', label: '📦 Inventory' },
            { value: '/dashboard/analytics', label: '📈 Analytics' },
            { value: '/dashboard/support', label: '🎫 Support' },
            { value: '/dashboard/settings', label: '⚙️ Settings' },
          ]}
          onChange={(val) => updatePref('default_dashboard', val)}
          saving={saving}
          icon={faGlobe}
        />

        <PreferenceRow
          label={t('dateFormat') || 'Date Format'}
          value={getValue('date_format', 'DD/MM/YYYY')}
          options={[
            { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
          ]}
          onChange={(val) => updatePref('date_format', val)}
          saving={saving}
          icon={faClock}
        />

        <PreferenceRow
          label={t('timeFormat') || 'Time Format'}
          value={getValue('time_format', '24h')}
          options={[
            { value: '12h', label: '12‑hour (AM/PM)' },
            { value: '24h', label: '24‑hour' },
          ]}
          onChange={(val) => updatePref('time_format', val)}
          saving={saving}
          icon={faClock}
        />

        <PreferenceRow
          label={t('notificationsSound') || 'Notifications Sound'}
          value={getValue('notifications_sound', 'true')}
          options={[
            { value: 'true', label: '🔔 Enabled' },
            { value: 'false', label: '🔕 Disabled' },
          ]}
          onChange={(val) => updatePref('notifications_sound', val)}
          saving={saving}
          icon={faBell}
        />

        {saving && (
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: COLORS.textMuted, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FontAwesomeIcon icon={faSave} spin /> {t('saving') || 'Saving preferences...'}
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
        
        /* Dark Theme Styles */
        [data-theme="dark"] {
          --bg-primary: #1a1a2e;
          --bg-secondary: #16213e;
          --bg-card: #1f2a4a;
          --text-primary: #e0e0e0;
          --text-secondary: #b0b0b0;
          --border-color: #2a3a5a;
          --shadow-color: rgba(0,0,0,0.3);
        }
        
        [data-theme="dark"] body {
          background-color: #1a1a2e;
          color: #e0e0e0;
        }
        
        [data-theme="dark"] .settings-card,
        [data-theme="dark"] .preference-row,
        [data-theme="dark"] .form-group {
          background: #1f2a4a;
          border-color: #2a3a5a;
        }
        
        [data-theme="dark"] input,
        [data-theme="dark"] select,
        [data-theme="dark"] textarea {
          background: #16213e;
          color: #e0e0e0;
          border-color: #2a3a5a;
        }
        
        [data-theme="dark"] input:focus,
        [data-theme="dark"] select:focus,
        [data-theme="dark"] textarea:focus {
          border-color: ${COLORS.primary};
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
        }
      `}</style>
    </div>
  );
}