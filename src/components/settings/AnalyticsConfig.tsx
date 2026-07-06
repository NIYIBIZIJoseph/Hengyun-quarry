// src/pages/dashboard/settings/analytics.tsx
import { useEffect, useState } from 'react';
import { getAuthHeaders, getUserRoleFromToken } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, faCalendarAlt, faRefresh, 
  faChartBar, faDatabase, faClock, faSave, faCheckCircle,
  faExclamationTriangle, faSlidersH, faChartPie
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
  type?: 'text' | 'number' | 'select';
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
      ) : type === 'number' ? (
        <input
          type="number"
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
      ) : (
        <input
          type="text"
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

export default function AnalyticsConfigSettings() {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const userRole = getUserRoleFromToken();
  const canEdit = userRole === ROLES.SUPERADMIN;

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/analytics-config', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch analytics config');
      let data = await res.json();
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        if (data.data && Array.isArray(data.data)) data = data.data;
        else if (data.success && Array.isArray(data.data)) data = data.data;
        else data = [];
      }
      if (!Array.isArray(data)) data = [];
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
      const res = await fetch('/api/settings/analytics-config', {
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

  const getValue = (key: string) => {
    if (!Array.isArray(configs)) return '';
    const config = configs.find(c => c.key === key);
    return config?.value || '';
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

      {/* Config Form */}
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

        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <ConfigRow
            label={t('defaultDateRange') || 'Default Date Range'}
            key="analytics_default_range"
            value={getValue('analytics_default_range')}
            description={t('defaultDateRangeDesc') || 'Default date range for all analytics charts'}
            type="select"
            icon={faCalendarAlt}
            options={[
              { value: 'last_7_days', label: 'Last 7 days' },
              { value: 'last_30_days', label: 'Last 30 days' },
              { value: 'this_month', label: 'This month' },
              { value: 'this_year', label: 'This year' },
            ]}
            onUpdate={updateConfig}
            saving={saving}
            canEdit={canEdit}
          />

          <ConfigRow
            label={t('chartRefreshInterval') || 'Chart Refresh Interval'}
            key="analytics_refresh_interval"
            value={getValue('analytics_refresh_interval')}
            description={t('chartRefreshIntervalDesc') || 'How often charts automatically refresh with new data'}
            type="select"
            icon={faRefresh}
            options={[
              { value: '60', label: '60 seconds' },
              { value: '300', label: '5 minutes' },
              { value: '600', label: '10 minutes' },
              { value: '3600', label: '1 hour' },
            ]}
            onUpdate={updateConfig}
            saving={saving}
            canEdit={canEdit}
          />

          <ConfigRow
            label={t('defaultAnalyticsTab') || 'Default Analytics Tab'}
            key="analytics_default_tab"
            value={getValue('analytics_default_tab')}
            description={t('defaultAnalyticsTabDesc') || 'First tab shown when opening Analytics dashboard'}
            type="select"
            icon={faChartBar}
            options={[
              { value: 'operational', label: 'Operational' },
              { value: 'financial', label: 'Financial' },
              { value: 'inventory', label: 'Inventory' },
              { value: 'workforce', label: 'Workforce' },
            ]}
            onUpdate={updateConfig}
            saving={saving}
            canEdit={canEdit}
          />

          <ConfigRow
            label={t('enableCaching') || 'Enable Caching'}
            key="analytics_caching_enabled"
            value={getValue('analytics_caching_enabled')}
            description={t('enableCachingDesc') || 'Cache analytics data to improve performance'}
            type="select"
            icon={faDatabase}
            options={[
              { value: 'true', label: 'Enabled' },
              { value: 'false', label: 'Disabled' },
            ]}
            onUpdate={updateConfig}
            saving={saving}
            canEdit={canEdit}
          />

          <ConfigRow
            label={t('cacheDuration') || 'Cache Duration (minutes)'}
            key="analytics_cache_minutes"
            value={getValue('analytics_cache_minutes')}
            description={t('cacheDurationDesc') || 'How long to cache analytics data (only applies when caching is enabled)'}
            type="number"
            icon={faClock}
            onUpdate={updateConfig}
            saving={saving}
            canEdit={canEdit}
          />

          <ConfigRow
            label={t('topProductsLimit') || 'Top Products Limit'}
            key="analytics_top_products_limit"
            value={getValue('analytics_top_products_limit')}
            description={t('topProductsLimitDesc') || 'Number of products to show in top selling charts'}
            type="number"
            icon={faChartPie}
            onUpdate={updateConfig}
            saving={saving}
            canEdit={canEdit}
          />

          <ConfigRow
            label={t('chartType') || 'Default Chart Type'}
            key="analytics_default_chart_type"
            value={getValue('analytics_default_chart_type')}
            description={t('chartTypeDesc') || 'Preferred chart type for revenue and sales data'}
            type="select"
            icon={faChartLine}
            options={[
              { value: 'line', label: 'Line Chart' },
              { value: 'bar', label: 'Bar Chart' },
              { value: 'pie', label: 'Pie Chart' },
            ]}
            onUpdate={updateConfig}
            saving={saving}
            canEdit={canEdit}
          />

          <ConfigRow
            label={t('enableRealTime') || 'Enable Real-time Updates'}
            key="analytics_realtime_enabled"
            value={getValue('analytics_realtime_enabled')}
            description={t('enableRealTimeDesc') || 'Automatically update charts when new data is available'}
            type="select"
            icon={faRefresh}
            options={[
              { value: 'true', label: 'Enabled' },
              { value: 'false', label: 'Disabled' },
            ]}
            onUpdate={updateConfig}
            saving={saving}
            canEdit={canEdit}
          />

          <ConfigRow
            label={t('enablePredictiveAnalytics') || 'Enable Predictive Analytics'}
            key="analytics_predictive_enabled"
            value={getValue('analytics_predictive_enabled')}
            description={t('enablePredictiveAnalyticsDesc') || 'Show trend predictions based on historical data'}
            type="select"
            icon={faChartLine}
            options={[
              { value: 'true', label: 'Enabled' },
              { value: 'false', label: 'Disabled' },
            ]}
            onUpdate={updateConfig}
            saving={saving}
            canEdit={canEdit}
          />
        </div>

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