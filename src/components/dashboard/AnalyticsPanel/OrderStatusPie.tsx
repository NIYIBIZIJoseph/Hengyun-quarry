import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

ChartJS.register(ArcElement, Tooltip, Legend);

interface StatusData {
  status: string;
  count: number;
}

export default function OrderStatusPie() {
  const { t } = useTranslation();
  const [data, setData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/order-status', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
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
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'delivered': return '#3b82f6';
      case 'cancelled': return '#dc2626';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
        {t('loadingChart') || 'Loading chart...'}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center', color: '#6b7280' }}>
        {t('noOrderData') || 'No order data'}
      </div>
    );
  }

  const chartData = {
    labels: data.map(item => getStatusTranslation(item.status)),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => getStatusColor(item.status)),
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
      <h4 style={{ marginBottom: '1rem' }}>{t('orderStatusDistribution') || 'Order Status Distribution'}</h4>
      <Pie data={chartData} options={options} />
    </div>
  );
}