import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// ========== DESIGN TOKENS ==========
const COLORS = {
  success: "#10b981",
  primary: "#f59e0b",
  danger: "#ef4444",
  successLight: "rgba(16, 185, 129, 0.1)",
  primaryLight: "rgba(245, 158, 11, 0.1)",
  dangerLight: "rgba(239, 68, 68, 0.1)",
  textMuted: "#9ca3af",
  textPrimary: "#111827",
  border: "#e5e7eb",
};

export default function AttendanceTrendChart() {
  const { t } = useTranslation();
  const [chartData, setChartData] = useState<any>({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/attendance/weekly', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(weeklyData => {
        if (weeklyData.days && weeklyData.workers.length > 0) {
          const labels = weeklyData.days.map((d: any) => d.label);
          const presentCounts = new Array(labels.length).fill(0);
          const lateCounts = new Array(labels.length).fill(0);
          const absentCounts = new Array(labels.length).fill(0);

          weeklyData.workers.forEach((worker: any) => {
            worker.days.forEach((day: any, idx: number) => {
              if (day.status === 'present') presentCounts[idx]++;
              else if (day.status === 'late') lateCounts[idx]++;
              else if (day.status === 'absent') absentCounts[idx]++;
            });
          });

          setChartData({
            labels,
            datasets: [
              { 
                label: t('attendancePresent') || 'Present', 
                data: presentCounts, 
                borderColor: COLORS.success, 
                backgroundColor: COLORS.successLight, 
                fill: true, 
                tension: 0.4,
                pointBackgroundColor: COLORS.success,
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                borderWidth: 2,
              },
              { 
                label: t('attendanceLate') || 'Late', 
                data: lateCounts, 
                borderColor: COLORS.primary, 
                backgroundColor: COLORS.primaryLight, 
                fill: true, 
                tension: 0.4,
                pointBackgroundColor: COLORS.primary,
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                borderWidth: 2,
              },
              { 
                label: t('attendanceAbsent') || 'Absent', 
                data: absentCounts, 
                borderColor: COLORS.danger, 
                backgroundColor: COLORS.dangerLight, 
                fill: true, 
                tension: 0.4,
                pointBackgroundColor: COLORS.danger,
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                borderWidth: 2,
              },
            ],
          });
        } else {
          setChartData({
            labels: [t('mon') || 'Mon', t('tue') || 'Tue', t('wed') || 'Wed', t('thu') || 'Thu', t('fri') || 'Fri', t('sat') || 'Sat', t('sun') || 'Sun'],
            datasets: [
              { label: t('attendancePresent') || 'Present', data: [0,0,0,0,0,0,0], borderColor: COLORS.success, backgroundColor: COLORS.successLight, fill: true, tension: 0.4 },
              { label: t('attendanceLate') || 'Late', data: [0,0,0,0,0,0,0], borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight, fill: true, tension: 0.4 },
              { label: t('attendanceAbsent') || 'Absent', data: [0,0,0,0,0,0,0], borderColor: COLORS.danger, backgroundColor: COLORS.dangerLight, fill: true, tension: 0.4 },
            ],
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [t]);

  const options = {
    responsive: true,
    maintainAspectRatio: true,
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
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${value} ${t('employees') || 'employees'}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9ca3af',
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
          color: '#9ca3af',
          font: {
            size: 10,
          },
          stepSize: 1,
        },
        beginAtZero: true,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
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
        {t('attendanceTrend') || 'Attendance Trend'}
      </h4>
      <div style={{ height: '220px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}