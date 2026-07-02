import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Filler);

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryLight: "rgba(245, 158, 11, 0.6)",
  primaryBorder: "#f59e0b",
  textMuted: "#9ca3af",
  textPrimary: "#111827",
  border: "#e5e7eb",
  bgGray: "#f9fafb",
};

export default function RevenueChart() {
  const { t } = useTranslation();
  const [data, setData] = useState({ labels: [], values: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/revenue-trend', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(trend => {
        setData({
          labels: trend.map((item: any) => new Date(item.date).toLocaleDateString()),
          values: trend.map((item: any) => item.total),
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const chartData = {
    labels: data.labels,
    datasets: [{
      label: t('revenueChartLabel') || 'Revenue (RWF)',
      data: data.values,
      backgroundColor: COLORS.primaryLight,
      borderColor: COLORS.primaryBorder,
      borderWidth: 2,
      borderRadius: 4,
      hoverBackgroundColor: COLORS.primary,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: COLORS.textPrimary,
        bodyColor: '#6b7280',
        borderColor: COLORS.border,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            label += new Intl.NumberFormat().format(context.raw) + ' RWF';
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: COLORS.textMuted,
          font: {
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(0,0,0,0.05)',
          drawBorder: false,
        },
        ticks: {
          color: COLORS.textMuted,
          font: {
            size: 10,
          },
          callback: function(value: any) {
            return value >= 1000 ? `${value / 1000}k` : value;
          },
        },
        beginAtZero: true,
      },
    },
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

  if (data.labels.length === 0) {
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
        {t('noDataAvailable') || 'No data available'}
      </div>
    );
  }

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
          {t('revenueTrend') || 'Revenue Trend'}
        </h4>
        <span style={{
          fontSize: '0.65rem',
          color: '#10b981',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}>
          ↑ 12% vs last month
        </span>
      </div>
      <div style={{ height: '220px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}