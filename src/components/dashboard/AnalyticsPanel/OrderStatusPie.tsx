import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

ChartJS.register(ArcElement, Tooltip, Legend);

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  success: "#10b981",
  info: "#3b82f6",
  danger: "#ef4444",
  textMuted: "#9ca3af",
  textPrimary: "#111827",
  border: "#e5e7eb",
};

interface StatusData {
  status: string;
  count: number;
}

export default function OrderStatusPie() {
  const { t } = useTranslation();
  const [data, setData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard/order-status', { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        setData(Array.isArray(result) ? result : []);
      } catch (err: unknown) {
        console.error('Error fetching order status:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusTranslation = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return t('statusPending') || 'Pending';
      case 'approved': return t('statusApproved') || 'Approved';
      case 'delivered': return t('statusDelivered') || 'Delivered';
      case 'cancelled': return t('statusCancelled') || 'Cancelled';
      default: return status || t('unknown') || 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return COLORS.primary;
      case 'approved': return COLORS.success;
      case 'delivered': return COLORS.info;
      case 'cancelled': return COLORS.danger;
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'white',
        padding: '1.25rem',
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: '0.85rem',
      }}>
        {t('loadingChart') || 'Loading chart...'}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'white',
        padding: '1.25rem',
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ef4444',
        fontSize: '0.85rem',
      }}>
        Error: {error}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{
        background: 'white',
        padding: '1.25rem',
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: '0.85rem',
      }}>
        {t('noOrderData') || 'No order data available'}
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  const chartData = {
    labels: data.map(item => getStatusTranslation(item.status)),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => getStatusColor(item.status)),
        borderWidth: 2,
        borderColor: 'white',
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '55%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 12,
          font: {
            size: 11,
          },
          color: '#6b7280',
        },
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#111827',
        bodyColor: '#6b7280',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
    },
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'all 0.2s ease',
    }}>
      <h4 style={{
        fontSize: '0.85rem',
        fontWeight: '600',
        color: '#111827',
        margin: '0 0 0.75rem 0',
      }}>
        {t('orderStatusDistribution') || 'Order Status'}
      </h4>
      <div style={{ height: '220px' }}>
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}