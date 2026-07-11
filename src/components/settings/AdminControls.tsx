// src/pages/dashboard/settings/admin.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuthHeaders, getUserRoleFromToken } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faTools, faShieldAlt, faDatabase, 
  faRefresh, faSave, faCheckCircle, faExclamationTriangle,
  faServer, faClock, faTrashAlt, faCrown
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

// ========== STAT CARD ==========
function StatCard({ 
  label, 
  value, 
  icon, 
  color = COLORS.primary,
  subtext
}: { 
  label: string; 
  value: string | number; 
  icon: any; 
  color?: string;
  subtext?: string;
}) {
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
      {subtext && (
        <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginTop: '0.1rem' }}>
          {subtext}
        </div>
      )}
    </div>
  );
}

export default function AdminControlsSettings() {
  const { t } = useTranslation();
  const router = useRouter();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [lastMaintenanceToggle, setLastMaintenanceToggle] = useState<string>('');
  
  const userRole = getUserRoleFromToken();
  const isSuperAdmin = userRole === ROLES.SUPERADMIN;

  const fetchMaintenanceMode = async () => {
    try {
      const res = await fetch('/api/admin/maintenance-mode', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMaintenanceMode(data.enabled);
        if (data.last_toggled) {
          setLastMaintenanceToggle(data.last_toggled);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const res = await fetch('/api/admin/system-info', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSystemInfo(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push('/dashboard/settings');
      return;
    }
    Promise.all([fetchMaintenanceMode(), fetchSystemInfo()]).finally(() => setLoading(false));
  }, []);

  const toggleMaintenanceMode = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/maintenance-mode', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ enabled: !maintenanceMode }),
      });
      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();
      setMaintenanceMode(data.enabled);
      setLastMaintenanceToggle(data.last_toggled || new Date().toISOString());
      setMessage(`Maintenance mode ${data.enabled ? 'enabled' : 'disabled'} successfully`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const clearCache = async () => {
    if (!confirm('Clear application cache? This may cause a temporary slowdown.')) return;
    setCacheLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/clear-cache', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Clear cache failed');
      setMessage('Cache cleared successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCacheLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '4rem 2rem',
        background: 'white',
        borderRadius: '12px',
        boxShadow: COLORS.shadow,
      }}>
        <FontAwesomeIcon icon={faCrown} style={{ fontSize: '3rem', color: COLORS.textMuted, marginBottom: '1rem' }} />
        <h3 style={{ color: COLORS.textSecondary }}>Access Denied</h3>
        <p style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>
          You don't have permission to access this page. Super Admin access required.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Messages */}
      {message && (
        <div style={{ marginBottom: '1rem', padding: '12px', background: '#d1fae5', borderRadius: '8px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FontAwesomeIcon icon={faCheckCircle} /> {message}
        </div>
      )}
      {error && (
        <div style={{ marginBottom: '1rem', padding: '12px', background: '#fee2e2', borderRadius: '8px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
        </div>
      )}

      {/* Stats Overview */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <StatCard
          label="Maintenance Mode"
          value={maintenanceMode ? 'Enabled' : 'Disabled'}
          icon={faShieldAlt}
          color={maintenanceMode ? COLORS.danger : COLORS.success}
          subtext={maintenanceMode ? 'Site is in maintenance' : 'Site is live'}
        />
        <StatCard
          label="System Status"
          value="Operational"
          icon={faServer}
          color={COLORS.success}
          subtext="All systems running normally"
        />
        <StatCard
          label="Cache Status"
          value="Active"
          icon={faRefresh}
          color={COLORS.primary}
          subtext="Last cleared: Today"
        />
      </div>

      {/* Settings Cards */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {/* Maintenance Mode */}
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '12px', 
          boxShadow: COLORS.shadow,
          transition: 'all 0.2s',
          borderLeft: `4px solid ${maintenanceMode ? COLORS.danger : COLORS.success}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = COLORS.shadowHover;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = COLORS.shadow;
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: maintenanceMode ? `${COLORS.danger}15` : `${COLORS.success}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FontAwesomeIcon icon={faShieldAlt} style={{ color: maintenanceMode ? COLORS.danger : COLORS.success }} />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: COLORS.textPrimary }}>
                    {t('maintenanceMode') || 'Maintenance Mode'}
                  </h4>
                  <span style={{
                    fontSize: '0.6rem',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    background: maintenanceMode ? '#fee2e2' : '#d1fae5',
                    color: maintenanceMode ? '#991b1b' : '#065f46',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                  }}>
                    {maintenanceMode ? (t('enabled') || 'Enabled') : (t('disabled') || 'Disabled')}
                  </span>
                </div>
              </div>
              <p style={{ color: COLORS.textMuted, marginBottom: 0, fontSize: '0.85rem', marginTop: '0.5rem', marginLeft: '3.5rem' }}>
                {t('maintenanceModeDesc') || 'When enabled, non‑admin users see a maintenance page.'}
              </p>
              {lastMaintenanceToggle && (
                <p style={{ color: COLORS.textMuted, fontSize: '0.7rem', marginTop: '0.25rem', marginLeft: '3.5rem' }}>
                  Last toggled: {new Date(lastMaintenanceToggle).toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={toggleMaintenanceMode}
              disabled={saving}
              style={{
                padding: '8px 20px',
                background: maintenanceMode ? COLORS.danger : COLORS.success,
                border: 'none',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                color: 'white',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                opacity: saving ? 0.6 : 1,
                boxShadow: maintenanceMode 
                  ? '0 2px 8px rgba(239, 68, 68, 0.3)' 
                  : '0 2px 8px rgba(16, 185, 129, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = maintenanceMode 
                    ? '0 4px 16px rgba(239, 68, 68, 0.4)' 
                    : '0 4px 16px rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!saving) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = maintenanceMode 
                    ? '0 2px 8px rgba(239, 68, 68, 0.3)' 
                    : '0 2px 8px rgba(16, 185, 129, 0.3)';
                }
              }}
            >
              <FontAwesomeIcon icon={faSave} />
              {saving ? (t('updating') || 'Updating...') : (maintenanceMode ? t('disable') || 'Disable' : t('enable') || 'Enable')}
            </button>
          </div>
        </div>

        {/* Clear Cache */}
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '12px', 
          boxShadow: COLORS.shadow,
          transition: 'all 0.2s',
          borderLeft: `4px solid ${COLORS.primary}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = COLORS.shadowHover;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = COLORS.shadow;
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: `${COLORS.primary}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FontAwesomeIcon icon={faRefresh} style={{ color: COLORS.primary }} />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: COLORS.textPrimary }}>
                    {t('clearApplicationCache') || 'Clear Application Cache'}
                  </h4>
                </div>
              </div>
              <p style={{ color: COLORS.textMuted, marginBottom: 0, fontSize: '0.85rem', marginTop: '0.5rem', marginLeft: '3.5rem' }}>
                {t('clearCacheDesc') || 'Clear Next.js cache and temporary data to resolve performance issues.'}
              </p>
            </div>
            <button
              onClick={clearCache}
              disabled={cacheLoading}
              style={{
                padding: '8px 20px',
                background: COLORS.primary,
                border: 'none',
                borderRadius: '8px',
                cursor: cacheLoading ? 'not-allowed' : 'pointer',
                color: 'white',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                opacity: cacheLoading ? 0.6 : 1,
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (!cacheLoading) {
                  e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(245, 158, 11, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!cacheLoading) {
                  e.currentTarget.style.backgroundColor = COLORS.primary;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
                }
              }}
            >
              <FontAwesomeIcon icon={faRefresh} />
              {cacheLoading ? (t('clearing') || 'Clearing...') : (t('clearCache') || 'Clear Cache')}
            </button>
          </div>
        </div>

        {/* Database Backup */}
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '12px', 
          boxShadow: COLORS.shadow,
          transition: 'all 0.2s',
          borderLeft: `4px solid ${COLORS.info}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = COLORS.shadowHover;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = COLORS.shadow;
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: `${COLORS.info}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FontAwesomeIcon icon={faDatabase} style={{ color: COLORS.info }} />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: COLORS.textPrimary }}>
                    {t('databaseBackup') || 'Database Backup'}
                  </h4>
                </div>
              </div>
              <p style={{ color: COLORS.textMuted, marginBottom: 0, fontSize: '0.85rem', marginTop: '0.5rem', marginLeft: '3.5rem' }}>
                {t('databaseBackupDesc') || 'Export full database backup or manage data retention policies.'}
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/settings/backup')}
              style={{
                padding: '8px 20px',
                background: COLORS.info,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'white',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
              }}
            >
              <FontAwesomeIcon icon={faDatabase} />
              Go to Backup
            </button>
          </div>
        </div>

        {/* System Information */}
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '12px', 
          boxShadow: COLORS.shadow,
          borderLeft: `4px solid ${COLORS.textMuted}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = COLORS.shadowHover;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = COLORS.shadow;
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: `${COLORS.textMuted}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FontAwesomeIcon icon={faServer} style={{ color: COLORS.textMuted }} />
            </div>
            <div>
              <h4 style={{ margin: 0, color: COLORS.textPrimary }}>
                {t('systemInformation') || 'System Information'}
              </h4>
            </div>
          </div>
          {systemInfo ? (
            <div style={{ 
              background: COLORS.bgGray, 
              padding: '1rem', 
              borderRadius: '8px', 
              border: `1px solid ${COLORS.border}`,
              overflowX: 'auto',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {Object.entries(systemInfo).map(([key, value]) => (
                  <div key={key} style={{ 
                    padding: '0.5rem',
                    background: 'white',
                    borderRadius: '6px',
                    border: `1px solid ${COLORS.border}`,
                  }}>
                    <div style={{ fontSize: '0.6rem', color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: '600' }}>
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: COLORS.textPrimary, fontWeight: '500' }}>
                      {String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: COLORS.textMuted }}>{t('unableToLoadSystemInfo') || 'Unable to load system info.'}</p>
          )}
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