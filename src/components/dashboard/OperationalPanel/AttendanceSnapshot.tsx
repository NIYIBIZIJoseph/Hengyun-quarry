import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faExclamationTriangle, faUmbrellaBeach } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  success: "#10b981",
  danger: "#ef4444",
  info: "#3b82f6",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.05)",
  shadowHover: "0 4px 12px rgba(0,0,0,0.08)",
};

export default function AttendanceSnapshot() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState({ presentToday: 0, absentToday: 0, lateToday: 0, onLeaveToday: 0, totalWorkers: 0 });

  useEffect(() => {
    fetch('/api/attendance/weekly', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => setSummary(data.summary || {}))
      .catch(console.error);
  }, []);

  const total = summary.totalWorkers || 0;
  const present = summary.presentToday || 0;
  const percent = total ? Math.round((present / total) * 100) : 0;

  const stats = [
    { label: t('present') || 'Present', value: present, icon: faCheckCircle, color: COLORS.success },
    { label: t('absent') || 'Absent', value: summary.absentToday || 0, icon: faTimesCircle, color: COLORS.danger },
    { label: t('late') || 'Late', value: summary.lateToday || 0, icon: faExclamationTriangle, color: COLORS.primary },
    { label: t('onLeave') || 'On Leave', value: summary.onLeaveToday || 0, icon: faUmbrellaBeach, color: COLORS.info },
  ];

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.25rem',
      boxShadow: COLORS.shadow,
      transition: 'all 0.2s ease',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem',
      }}>
        <h3 style={{
          fontSize: '0.85rem',
          fontWeight: '600',
          color: COLORS.textPrimary,
          margin: 0,
        }}>
          {t('attendanceToday') || 'Attendance Today'}
        </h3>
        <div style={{
          fontSize: '0.7rem',
          color: COLORS.textMuted,
        }}>
          {total} {t('workers') || 'workers'}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.75rem',
      }}>
        <div style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: COLORS.textPrimary,
        }}>
          {percent}%
        </div>
        <div style={{
          flex: 1,
          height: '4px',
          background: COLORS.border,
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${percent}%`,
            height: '100%',
            background: percent > 70 ? COLORS.success : percent > 40 ? COLORS.primary : COLORS.danger,
            borderRadius: '2px',
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.5rem',
      }}>
        {stats.map((stat, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.6rem',
              borderRadius: '6px',
              background: '#f9fafb',
            }}
          >
            <FontAwesomeIcon icon={stat.icon} style={{ color: stat.color, fontSize: '0.7rem' }} />
            <span style={{ fontSize: '0.7rem', color: COLORS.textSecondary }}>
              {stat.label}: <strong style={{ color: COLORS.textPrimary }}>{stat.value}</strong>
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/dashboard/attendance/weekly"
        style={{
          fontSize: '0.7rem',
          color: COLORS.primary,
          marginTop: '0.75rem',
          display: 'inline-block',
          textDecoration: 'none',
          fontWeight: '500',
        }}
      >
        {t('viewFullAttendance') || 'View full attendance'} →
      </Link>
    </div>
  );
}