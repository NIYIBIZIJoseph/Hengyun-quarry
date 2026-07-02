import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faBoxOpen, 
  faTicketAlt, 
  faUserClock,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  danger: "#ef4444",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
};

export default function AlertBar() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<{ lowStock: number; openTickets: number; absentToday: number }>({
    lowStock: 0,
    openTickets: 0,
    absentToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      const headers = getAuthHeaders();
      try {
        const productsRes = await fetch('/api/products', { headers });
        const productsData = await productsRes.json();
        const products = Array.isArray(productsData) ? productsData : (productsData.data || []);
        const lowStock = products.filter((p: any) => p.stock_quantity <= (p.reorder_level || 5) && p.stock_quantity > 0).length;

        const ticketsRes = await fetch('/api/support/tickets', { headers });
        const ticketsData = await ticketsRes.json();
        const tickets = Array.isArray(ticketsData) ? ticketsData : (ticketsData.data || []);
        const openTickets = tickets.filter((t: any) => t.status !== 'closed').length;

        const attendanceRes = await fetch('/api/attendance/weekly', { headers });
        const attendanceData = await attendanceRes.json();
        const absentToday = attendanceData?.summary?.absentToday || 0;

        setAlerts({ lowStock, openTickets, absentToday });
      } catch (err) {
        console.error('Failed to fetch alerts', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  if (loading) return null;

  const hasAlerts = alerts.lowStock > 0 || alerts.openTickets > 0 || alerts.absentToday > 0;
  if (!hasAlerts || dismissed) return null;

  const alertItems = [
    { label: t('lowStock') || 'Low Stock', value: alerts.lowStock, icon: faBoxOpen },
    { label: t('openTickets') || 'Open Tickets', value: alerts.openTickets, icon: faTicketAlt },
    { label: t('absentToday') || 'Absent Today', value: alerts.absentToday, icon: faUserClock },
  ].filter(item => item.value > 0);

  return (
    <div style={{
      background: '#fef3c7',
      borderLeft: `4px solid ${COLORS.primary}`,
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '0.5rem',
      position: 'relative',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
      }}>
        <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: COLORS.primary }} />
        <span style={{
          fontSize: '0.75rem',
          fontWeight: '500',
          color: COLORS.textPrimary,
        }}>
          {t('alerts') || 'Alerts'}:
        </span>
        {alertItems.map((item, idx) => (
          <span
            key={idx}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem',
              color: COLORS.textSecondary,
              background: 'rgba(255,255,255,0.5)',
              padding: '0.2rem 0.6rem',
              borderRadius: '12px',
            }}
          >
            <FontAwesomeIcon icon={item.icon} style={{ color: COLORS.primary, fontSize: '0.6rem' }} />
            {item.label}: <strong style={{ color: COLORS.textPrimary }}>{item.value}</strong>
          </span>
        ))}
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: COLORS.textSecondary,
          padding: '0.2rem 0.4rem',
          borderRadius: '4px',
          fontSize: '0.8rem',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>
    </div>
  );
}