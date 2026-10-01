// src/components/settings/UIPreferences.tsx
import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave, faPalette, faGlobe, faBell,
  faCompressAlt, faCheckCircle, faExclamationTriangle, faLanguage, faSun
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
  label, value, options, onChange, saving, icon,
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
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        {icon && <FontAwesomeIcon icon={icon} style={{ color: COLORS.primary, fontSize: '0.8rem' }} />}
        <label style={{ fontWeight: '500', fontSize: '0.85rem', color: COLORS.textPrimary }}>{label}</label>
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
  const [prefs, setPrefs] = useState<Record<string, any>>({});
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
      if (data.theme) applyPreference('theme', data.theme);
      if (typeof data.compact_mode === 'boolean') applyPreference('compact_mode', String(data.compact_mode));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrefs();
  }, []);

  const updatePref = async (key: string, value: any) => {
    setSaving(true);
    setError('');
    setMessage('');

    // Normalize value based on key
    let payload: Record<string, any> = {};
    if (key === 'compact_mode' || key === 'notifications_enabled') {
      payload[key] = value === 'true';
    } else {
      payload[key] = value;
    }

    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Update failed');

      setPrefs(prev => ({ ...prev, ...payload }));
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
          if (prefersDark) document.body.classList.add('dark-theme');
          else document.body.classList.remove('dark-theme');
        }
        break;
      case 'locale':
        localStorage.setItem('preferred_language', value);
        window.location.reload();
        break;
      case 'compact_mode':
        if (value === 'true') document.body.classList.add('compact-mode');
        else document.body.classList.remove('compact-mode');
        break;
      case 'notifications_enabled':
        localStorage.setItem('notifications_enabled', value);
        break;
    }
  };

  const getValue = (key: string, defaultValue: string) => {
    const v = prefs[key];
    if (v === undefined || v === null) return defaultValue;
    return String(v);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: COLORS.textPrimary, margin: 0 }}>
          <FontAwesomeIcon icon={faPalette} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
          {t('uiPreferences') || 'UI Preferences'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: COLORS.textMuted, margin: '0.15rem 0 0 0' }}>
          {t('uiPrefDesc') || 'Customize your dashboard appearance, language, and layout.'}
        </p>
      </div>

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

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: COLORS.shadow }}>
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
          value={getValue('locale', 'en')}
          options={[
            { value: 'en', label: '🇬🇧 English' },
            { value: 'rw', label: '🇷🇼 Kinyarwanda' },
            { value: 'zh', label: '🇨🇳 中文' },
          ]}
          onChange={(val) => updatePref('locale', val)}
          saving={saving}
          icon={faLanguage}
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
          icon={faCompressAlt}
        />

        <PreferenceRow
          label={t('notificationsSound') || 'Notifications'}
          value={getValue('notifications_enabled', 'true')}
          options={[
            { value: 'true', label: '🔔 Enabled' },
            { value: 'false', label: '🔕 Disabled' },
          ]}
          onChange={(val) => updatePref('notifications_enabled', val)}
          saving={saving}
          icon={faBell}
        />

        {saving && (
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: COLORS.textMuted, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FontAwesomeIcon icon={faSave} spin /> {t('saving') || 'Saving preferences...'}
          </div>
        )}
      </div>
    </div>
  );
}