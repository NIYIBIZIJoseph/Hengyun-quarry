import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faBoxOpen, faTicketAlt, faUserClock } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function AlertBar() {
  const { t } = useTranslation();
  const [lowStockCount, setLowStockCount] = useState(0);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [absentTodayCount, setAbsentTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      const headers = getAuthHeaders();
      try {
        // Products low stock
        const productsRes = await fetch('/api/products', { headers });
        const productsData = await productsRes.json();
        const products = Array.isArray(productsData) ? productsData : (productsData.data || []);
        const lowStock = products.filter((p: any) => p.stock_quantity <= (p.reorder_level || 5) && p.stock_quantity > 0).length;
        setLowStockCount(lowStock);

        // Open tickets
        const ticketsRes = await fetch('/api/support/tickets', { headers });
        const ticketsData = await ticketsRes.json();
        const tickets = Array.isArray(ticketsData) ? ticketsData : (ticketsData.data || []);
        const openTickets = tickets.filter((t: any) => t.status !== 'closed').length;
        setOpenTicketsCount(openTickets);

        // Absent today from attendance summary
        const attendanceRes = await fetch('/api/attendance/weekly', { headers });
        const attendanceData = await attendanceRes.json();
        if (attendanceData && attendanceData.summary) {
          setAbsentTodayCount(attendanceData.summary.absentToday || 0);
        }
      } catch (err) {
        console.error('Failed to fetch alerts', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  if (loading) return null;
  if (lowStockCount === 0 && openTicketsCount === 0 && absentTodayCount === 0) return null;

  return (
    <div style={{ 
      background: '#fef3c7', 
      borderLeft: '4px solid #f59e0b', 
      padding: '12px 16px', 
      borderRadius: '8px', 
      marginBottom: '1rem',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      alignItems: 'center'
    }}>
      <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#f59e0b' }} />
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FontAwesomeIcon icon={faBoxOpen} /> 
        {t('lowStock')}: {lowStockCount}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FontAwesomeIcon icon={faTicketAlt} /> 
        {t('openTickets')}: {openTicketsCount}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FontAwesomeIcon icon={faUserClock} /> 
        {t('absentToday')}: {absentTodayCount}
      </span>
    </div>
  );
}