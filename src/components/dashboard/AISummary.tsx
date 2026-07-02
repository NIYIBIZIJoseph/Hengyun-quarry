import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, 
  faChartLine, 
  faExclamationTriangle, 
  faTicketAlt, 
  faUsers,
  faBox,
  faSpinner,
  faRefresh
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.05)",
};

// ========== SUMMARY STAT ITEM ==========
function SummaryStat({ icon, label, value, color = COLORS.primary }: { icon: any; label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.3rem',
      background: 'rgba(255,255,255,0.5)',
      padding: '0.2rem 0.6rem',
      borderRadius: '12px',
      fontSize: '0.7rem',
    }}>
      <FontAwesomeIcon icon={icon} style={{ color, fontSize: '0.6rem' }} />
      <span style={{ color: COLORS.textSecondary }}>{label}:</span>
      <strong style={{ color: COLORS.textPrimary }}>{value}</strong>
    </div>
  );
}

export default function AISummary() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();
      const [revenueRes, ticketsRes, productsRes, attendanceRes] = await Promise.all([
        fetch('/api/dashboard/stats', { headers }),
        fetch('/api/support/tickets', { headers }),
        fetch('/api/products', { headers }),
        fetch('/api/attendance/weekly', { headers }),
      ]);

      const revenueData = await revenueRes.json();
      const tickets = await ticketsRes.json();
      const products = await productsRes.json();
      const attendanceData = await attendanceRes.json();

      const lowStockCount = products.filter((p: any) => p.stock_quantity <= (p.reorder_level || 5) && p.stock_quantity > 0).length;
      const outOfStockCount = products.filter((p: any) => p.stock_quantity === 0).length;
      const openTickets = tickets.filter((t: any) => t.status !== 'closed' && t.status !== 'resolved').length;
      const absentToday = attendanceData.summary?.absentToday || 0;
      const revenue = revenueData.revenue || 0;
      const totalWorkers = attendanceData.summary?.totalWorkers || 0;

      setSummary({
        revenue,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        openTickets,
        absentToday,
        totalWorkers,
      });
    } catch (err) {
      console.error(err);
      setError(t('unableToLoadInsights') || 'Unable to load insights. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [t]);

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        boxShadow: COLORS.shadow,
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        color: COLORS.textMuted,
        fontSize: '0.85rem',
      }}>
        <FontAwesomeIcon icon={faSpinner} spin style={{ color: COLORS.primary }} />
        {t('loadingInsights') || 'Loading insights...'}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: '#fef2f2',
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        boxShadow: COLORS.shadow,
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        borderLeft: `3px solid ${COLORS.danger}`,
      }}>
        <span style={{ fontSize: '0.85rem', color: COLORS.danger }}>
          <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '0.5rem' }} />
          {error}
        </span>
        <button
          onClick={fetchSummary}
          style={{
            background: 'transparent',
            border: 'none',
            color: COLORS.primary,
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: '500',
          }}
        >
          <FontAwesomeIcon icon={faRefresh} /> {t('retry') || 'Retry'}
        </button>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div style={{
      background: `linear-gradient(135deg, ${COLORS.primary}08, ${COLORS.primary}15)`,
      borderRadius: '12px',
      padding: '0.75rem 1.25rem',
      marginBottom: '1rem',
      border: `1px solid ${COLORS.primary}20`,
      boxShadow: COLORS.shadow,
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.5rem',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: COLORS.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}>
          <FontAwesomeIcon icon={faRobot} style={{ fontSize: '0.9rem' }} />
        </div>
        <span style={{
          fontSize: '0.8rem',
          fontWeight: '500',
          color: COLORS.textPrimary,
        }}>
          {t('aiInsights') || 'AI Insights'}
        </span>
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <SummaryStat 
          icon={faChartLine} 
          label={t('revenue') || 'Revenue'} 
          value={`${summary.revenue.toLocaleString()} RWF`}
          color={COLORS.primary}
        />
        <SummaryStat 
          icon={faBox} 
          label={t('lowStock') || 'Low Stock'} 
          value={summary.lowStock}
          color={summary.lowStock > 0 ? COLORS.danger : COLORS.success}
        />
        <SummaryStat 
          icon={faTicketAlt} 
          label={t('openTickets') || 'Open Tickets'} 
          value={summary.openTickets}
          color={summary.openTickets > 0 ? COLORS.warning : COLORS.success}
        />
        <SummaryStat 
          icon={faUsers} 
          label={t('absentToday') || 'Absent Today'} 
          value={summary.absentToday}
          color={summary.absentToday > 0 ? COLORS.danger : COLORS.success}
        />
      </div>

      <button
        onClick={fetchSummary}
        style={{
          background: 'transparent',
          border: 'none',
          color: COLORS.textMuted,
          cursor: 'pointer',
          fontSize: '0.7rem',
          padding: '0.2rem 0.4rem',
          borderRadius: '4px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = COLORS.primary;
          e.currentTarget.style.background = `${COLORS.primary}10`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = COLORS.textMuted;
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <FontAwesomeIcon icon={faRefresh} />
      </button>
    </div>
  );
}