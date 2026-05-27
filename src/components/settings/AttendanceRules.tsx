import { useEffect, useState } from 'react';
import { getAuthHeaders, getUserRoleFromToken } from '@/lib/auth-client';
import { ROLES, type Role } from "@/lib/roles";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface Rule {
  key: string;
  value: string;
  description: string;
}

export default function AttendanceRules() {
  const { t } = useTranslation();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ✅ FIX: use Role (NOT number)
  const [userRole, setUserRole] = useState<Role | null>(null);

  useEffect(() => {
    const role = getUserRoleFromToken();
    setUserRole(role);
  }, []);

  const canEdit = userRole === ROLES.SUPERADMIN;

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/attendance-rules', {
        headers: getAuthHeaders()
      });

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
    fetchRules();
  }, []);

  const updateRule = async (key: string, value: string) => {
    if (!canEdit) return;

    setSaving(true);
    try {
      const res = await fetch('/api/settings/attendance-rules', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ key, value }),
      });

      if (!res.ok) throw new Error('Update failed');

      setRules(prev =>
        prev.map(r => (r.key === key ? { ...r, value } : r))
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getValue = (key: string) =>
    rules.find(r => r.key === key)?.value || '';

  if (loading) return <div>{t('loadingAttendanceRules') || 'Loading...'}</div>;
  if (error) return <div style={{ color: '#dc2626' }}>{error}</div>;

  return (
    <div>
      <h3>{t('attendanceRules') || 'Attendance Rules'}</h3>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px' }}>

        <h4>
          <FontAwesomeIcon icon={faSun} /> {t('generalRules')}
        </h4>

        <div>
          <label>Late Threshold</label>
          <input
            type="number"
            value={getValue('late_threshold_minutes')}
            onChange={(e) => updateRule('late_threshold_minutes', e.target.value)}
            disabled={!canEdit || saving}
          />
        </div>

        <div>
          <label>Max Leave Days</label>
          <input
            type="number"
            value={getValue('max_leave_days_per_year')}
            onChange={(e) => updateRule('max_leave_days_per_year', e.target.value)}
            disabled={!canEdit || saving}
          />
        </div>

      </div>
    </div>
  );
}