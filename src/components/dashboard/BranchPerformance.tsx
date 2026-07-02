import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faMoneyBillWave, faUsers, faShoppingCart, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.05)",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
};

// ========== BRANCH ROW COMPONENT ==========
function BranchRow({ branch, index, total }: { branch: any; index: number; total: number }) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Safely get values with fallbacks
  const branchName = branch.branch || branch.name || 'Unknown';
  const revenue = typeof branch.revenue === 'number' ? branch.revenue : parseFloat(branch.revenue) || 0;
  const attendance = typeof branch.attendance === 'number' ? branch.attendance : parseFloat(branch.attendance) || 0;
  const orders = typeof branch.orders === 'number' ? branch.orders : parseInt(branch.orders) || 0;
  
  const getAttendanceColor = (attendanceValue: number) => {
    if (attendanceValue >= 80) return { bg: '#d1fae5', color: '#065f46' };
    if (attendanceValue >= 60) return { bg: '#fef3c7', color: '#92400e' };
    return { bg: '#fee2e2', color: '#991b1b' };
  };
  
  const colors = getAttendanceColor(attendance);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '0.5rem',
        padding: '0.6rem 0.75rem',
        borderRadius: '8px',
        backgroundColor: isHovered ? '#f9fafb' : 'transparent',
        transition: 'all 0.2s ease',
        borderBottom: index < total - 1 ? `1px solid ${COLORS.border}` : 'none',
        cursor: 'pointer',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: '500',
        fontSize: '0.85rem',
        color: COLORS.textPrimary,
      }}>
        <FontAwesomeIcon icon={faBuilding} style={{ color: COLORS.primary, fontSize: '0.8rem' }} />
        {branchName}
      </div>
      <div style={{
        textAlign: 'right',
        fontSize: '0.85rem',
        color: COLORS.primary,
        fontWeight: '600',
      }}>
        {revenue.toLocaleString()}
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{
          background: colors.bg,
          color: colors.color,
          padding: '0.15rem 0.6rem',
          borderRadius: '20px',
          fontSize: '0.7rem',
          fontWeight: '500',
        }}>
          {attendance.toFixed(1)}%
        </span>
      </div>
      <div style={{
        textAlign: 'right',
        fontSize: '0.85rem',
        fontWeight: '500',
        color: COLORS.textPrimary,
      }}>
        {orders}
      </div>
    </div>
  );
}

export default function BranchPerformance() {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/branch-performance', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        setBranches(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.25rem',
        boxShadow: COLORS.shadow,
        marginBottom: '1.5rem',
        textAlign: 'center',
        color: COLORS.textMuted,
        fontSize: '0.85rem',
      }}>
        <FontAwesomeIcon icon={faSpinner} spin /> {t('loading') || 'Loading...'}
      </div>
    );
  }

  if (branches.length === 0) return null;

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.25rem',
      boxShadow: COLORS.shadow,
      marginBottom: '1.5rem',
    }}>
      <h3 style={{
        fontSize: '0.85rem',
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <FontAwesomeIcon icon={faBuilding} style={{ color: COLORS.primary }} />
        {t('branchPerformance') || 'Branch Performance'}
      </h3>

      {/* Table Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        background: '#f9fafb',
        borderRadius: '8px',
        marginBottom: '0.5rem',
        fontWeight: '600',
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: COLORS.textSecondary,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <FontAwesomeIcon icon={faBuilding} style={{ fontSize: '0.6rem' }} />
          {t('branch') || 'Branch'}
        </div>
        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem' }}>
          <FontAwesomeIcon icon={faMoneyBillWave} style={{ fontSize: '0.6rem' }} />
          {t('revenue') || 'Revenue (RWF)'}
        </div>
        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem' }}>
          <FontAwesomeIcon icon={faUsers} style={{ fontSize: '0.6rem' }} />
          {t('attendance') || 'Attendance (%)'}
        </div>
        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem' }}>
          <FontAwesomeIcon icon={faShoppingCart} style={{ fontSize: '0.6rem' }} />
          {t('orders') || 'Orders'}
        </div>
      </div>

      {/* Branch Rows */}
      {branches.map((branch, idx) => (
        <BranchRow key={idx} branch={branch} index={idx} total={branches.length} />
      ))}
    </div>
  );
}