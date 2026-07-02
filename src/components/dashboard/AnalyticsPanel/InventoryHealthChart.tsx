import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

ChartJS.register(ArcElement, Tooltip, Legend);

// ========== DESIGN TOKENS ==========
const COLORS = {
  success: "#10b981",
  primary: "#f59e0b",
  danger: "#ef4444",
  textMuted: "#9ca3af",
  textPrimary: "#111827",
  border: "#e5e7eb",
};

export default function InventoryHealthChart() {
  const { t } = useTranslation();
  const [data, setData] = useState({ healthy: 0, lowStock: 0, outOfStock: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(products => {
        const healthy = products.filter((p: any) => p.stock_quantity > (p.reorder_level || 5)).length;
        const lowStock = products.filter((p: any) => p.stock_quantity <= (p.reorder_level || 5) && p.stock_quantity > 0).length;
        const outOfStock = products.filter((p: any) => p.stock_quantity === 0).length;
        setData({ healthy, lowStock, outOfStock });
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

  const hasData = data.healthy > 0 || data.lowStock > 0 || data.outOfStock > 0;

  if (!hasData) {
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
        {t('noInventoryData') || 'No inventory data'}
      </div>
    );
  }

  const total = data.healthy + data.lowStock + data.outOfStock;

  const chartData = {
    labels: [
      t('inventoryHealthy') || 'Healthy',
      t('inventoryLowStock') || 'Low Stock',
      t('inventoryOutOfStock') || 'Out of Stock'
    ],
    datasets: [{
      data: [data.healthy, data.lowStock, data.outOfStock],
      backgroundColor: [COLORS.success, COLORS.primary, COLORS.danger],
      borderWidth: 2,
      borderColor: 'white',
      hoverOffset: 8,
    }],
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
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem',
      }}>
        <h4 style={{
          fontSize: '0.85rem',
          fontWeight: '600',
          color: '#111827',
          margin: 0,
        }}>
          {t('inventoryHealth') || 'Inventory Health'}
        </h4>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.6rem',
          color: '#9ca3af',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS.success }} />
            {t('healthy') || 'Healthy'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS.primary }} />
            {t('low') || 'Low'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS.danger }} />
            {t('out') || 'Out'}
          </span>
        </div>
      </div>
      <div style={{ height: '200px' }}>
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}