// src/pages/dashboard/settings/attendance.tsx
import { useEffect, useState } from 'react';
import { getAuthHeaders, getUserRoleFromToken } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClock, faSun, faMoon, faUtensils, faCoffee,
  faSave, faCheckCircle, faExclamationTriangle, faHourglassHalf,
  faCalendarAlt, faUserClock, faBuilding
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

interface Rule {
  key: string;
  value: string;
  description: string;
}

function RuleInput({ 
  label, 
  key, 
  value, 
  onUpdate, 
  saving, 
  canEdit,
  type = 'text',
  placeholder = '',
  icon,
}: { 
  label: string; 
  key: string; 
  value: string; 
  onUpdate: (key: string, value: string) => void; 
  saving: boolean; 
  canEdit: boolean;
  type?: 'text' | 'number' | 'time';
  placeholder?: string;
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
        transition: 'all 0.2s',
        padding: '0.5rem',
        borderRadius: '8px',
        background: isHovered ? COLORS.bgGray : 'transparent',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <label style={{ 
        display: 'block', 
        fontWeight: '500', 
        marginBottom: '0.25rem',
        fontSize: '0.85rem',
        color: COLORS.textSecondary,
      }}>
        {icon && <FontAwesomeIcon icon={icon} style={{ marginRight: '0.5rem', color: COLORS.primary }} />}
        {label}
      </label>
      <input
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        disabled={!canEdit || saving}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1px solid ${isHovered ? COLORS.primary : COLORS.border}`,
          borderRadius: '8px',
          fontSize: '0.9rem',
          transition: 'all 0.2s',
          opacity: !canEdit ? 0.6 : 1,
          background: 'white',
        }}
      />
    </div>
  );
}

export default function AttendanceRules() {
  const { t } = useTranslation();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);

  const userRole = getUserRoleFromToken();
  const canEdit = userRole === ROLES.SUPERADMIN;

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
        if (data.length > 0) {
          setSelectedBranch(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRules = async (branchId?: number) => {
    setLoading(true);
    try {
      const url = branchId 
        ? `/api/settings/attendance-rules?branch_id=${branchId}`
        : '/api/settings/attendance-rules';
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch attendance rules');
      const data = await res.json();
      setRules(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchRules(selectedBranch);
    }
  }, [selectedBranch]);

  const updateRule = async (key: string, value: string) => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings/attendance-rules', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ key, value, branch_id: selectedBranch }),
      });
      if (!res.ok) throw new Error('Update failed');
      setRules(prev => prev.map(r => (r.key === key ? { ...r, value } : r)));
      setMessage(`${key} updated successfully`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getValue = (key: string) => {
    const rule = rules.find(r => r.key === key);
    return rule?.value || '';
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
      {/* Branch Selector */}
      {canEdit && branches.length > 0 && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          marginBottom: '1.5rem',
          padding: '0.75rem 1rem',
          background: 'white',
          borderRadius: '8px',
          boxShadow: COLORS.shadow,
          border: `1px solid ${COLORS.border}`,
        }}>
          <FontAwesomeIcon icon={faBuilding} style={{ color: COLORS.primary }} />
          <span style={{ fontSize: '0.85rem', color: COLORS.textSecondary, fontWeight: '500' }}>
            {t('branch') || 'Branch'}:
          </span>
          <select
            value={selectedBranch || ''}
            onChange={(e) => setSelectedBranch(parseInt(e.target.value))}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: `1px solid ${COLORS.border}`,
              fontSize: '0.85rem',
              background: 'white',
              flex: 1,
              maxWidth: '250px',
            }}
          >
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        </div>
      )}

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

      {/* Rules Form */}
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

        {/* General Rules */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ 
            marginBottom: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            color: COLORS.primary,
            fontSize: '0.95rem',
            borderBottom: `2px solid ${COLORS.primary}15`,
            paddingBottom: '0.5rem',
          }}>
            <FontAwesomeIcon icon={faClock} /> {t('generalRules') || 'General Rules'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.5rem' }}>
            <RuleInput
              label={t('lateThreshold') || 'Late Threshold (minutes)'}
              key="late_threshold_minutes"
              value={getValue('late_threshold_minutes')}
              onUpdate={updateRule}
              saving={saving}
              canEdit={canEdit}
              type="number"
              icon={faHourglassHalf}
            />
            <RuleInput
              label={t('maxLeaveDays') || 'Max Leave Days Per Year'}
              key="max_leave_days_per_year"
              value={getValue('max_leave_days_per_year')}
              onUpdate={updateRule}
              saving={saving}
              canEdit={canEdit}
              type="number"
              icon={faCalendarAlt}
            />
            <RuleInput
              label={t('autoMarkAbsent') || 'Auto-mark Absent After (hours)'}
              key="auto_mark_absent_hours"
              value={getValue('auto_mark_absent_hours')}
              onUpdate={updateRule}
              saving={saving}
              canEdit={canEdit}
              type="number"
              icon={faUserClock}
            />
          </div>
        </div>

        {/* Day Shift */}
        <div style={{ marginBottom: '2rem', borderTop: `1px solid ${COLORS.border}`, paddingTop: '1.5rem' }}>
          <h4 style={{ 
            marginBottom: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            color: COLORS.primary,
            fontSize: '0.95rem',
            borderBottom: `2px solid ${COLORS.primary}15`,
            paddingBottom: '0.5rem',
          }}>
            <FontAwesomeIcon icon={faSun} /> {t('dayShift') || 'Day Shift'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.5rem' }}>
            <RuleInput
              label={t('startTime') || 'Start Time'}
              key="day_shift_start"
              value={getValue('day_shift_start')}
              onUpdate={updateRule}
              saving={saving}
              canEdit={canEdit}
              type="time"
            />
            <RuleInput
              label={t('endTime') || 'End Time'}
              key="day_shift_end"
              value={getValue('day_shift_end')}
              onUpdate={updateRule}
              saving={saving}
              canEdit={canEdit}
              type="time"
            />
            <div style={{ padding: '0.5rem' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                <FontAwesomeIcon icon={faUtensils} style={{ marginRight: '0.5rem', color: COLORS.primary }} />
                {t('lunchBreak') || 'Lunch Break'}
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="time"
                  value={getValue('day_shift_lunch_start')}
                  onChange={(e) => updateRule('day_shift_lunch_start', e.target.value)}
                  disabled={!canEdit || saving}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    opacity: !canEdit ? 0.6 : 1,
                    background: 'white',
                  }}
                />
                <span style={{ color: COLORS.textMuted, fontSize: '0.8rem' }}>to</span>
                <input
                  type="time"
                  value={getValue('day_shift_lunch_end')}
                  onChange={(e) => updateRule('day_shift_lunch_end', e.target.value)}
                  disabled={!canEdit || saving}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    opacity: !canEdit ? 0.6 : 1,
                    background: 'white',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Night Shift */}
        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: '1.5rem' }}>
          <h4 style={{ 
            marginBottom: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            color: COLORS.primary,
            fontSize: '0.95rem',
            borderBottom: `2px solid ${COLORS.primary}15`,
            paddingBottom: '0.5rem',
          }}>
            <FontAwesomeIcon icon={faMoon} /> {t('nightShift') || 'Night Shift'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.5rem' }}>
            <RuleInput
              label={t('startTime') || 'Start Time'}
              key="night_shift_start"
              value={getValue('night_shift_start')}
              onUpdate={updateRule}
              saving={saving}
              canEdit={canEdit}
              type="time"
            />
            <RuleInput
              label={t('endTime') || 'End Time (next day)'}
              key="night_shift_end"
              value={getValue('night_shift_end')}
              onUpdate={updateRule}
              saving={saving}
              canEdit={canEdit}
              type="time"
            />
            <div style={{ padding: '0.5rem' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                <FontAwesomeIcon icon={faCoffee} style={{ marginRight: '0.5rem', color: COLORS.primary }} />
                {t('mealBreak') || 'Meal Break'}
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="time"
                  value={getValue('night_shift_meal_start')}
                  onChange={(e) => updateRule('night_shift_meal_start', e.target.value)}
                  disabled={!canEdit || saving}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    opacity: !canEdit ? 0.6 : 1,
                    background: 'white',
                  }}
                />
                <span style={{ color: COLORS.textMuted, fontSize: '0.8rem' }}>to</span>
                <input
                  type="time"
                  value={getValue('night_shift_meal_end')}
                  onChange={(e) => updateRule('night_shift_meal_end', e.target.value)}
                  disabled={!canEdit || saving}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    opacity: !canEdit ? 0.6 : 1,
                    background: 'white',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {saving && (
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: COLORS.textMuted, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FontAwesomeIcon icon={faSave} spin /> {t('saving') || 'Saving rules...'}
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