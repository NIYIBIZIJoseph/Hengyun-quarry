import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, faMoneyBillWave, faBoxes, faUsers,
  faCheckCircle, faTimesCircle, faExclamationTriangle, faUmbrellaBeach,
  faTruck, faClock, faChartSimple, faEye, faUserCheck,
  faCalendarWeek, faShoppingCart, faDollarSign, faArrowUp, faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { useTranslation } from '@/hooks/useTranslation';

// Register ChartJS components
ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, 
  PointElement, LineElement, Filler, ArcElement
);

// ========== CLEAN DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  success: "#10b981",
  danger: "#ef4444",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  bgGray: "#f9fafb",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowHover: "0 8px 25px rgba(0,0,0,0.08)",
};

// ========== FIXED KPI CARD - ONLY LEFT BORDER COLOR (NO BADGES) ==========
function KpiCard({ 
  title, 
  value, 
  icon, 
  color = COLORS.primary, 
  suffix = ''
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  color?: string;
  suffix?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Format number with commas
  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString() 
    : value;

  return (
    <div
      style={{
        background: 'white',
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        boxShadow: isHovered ? COLORS.shadowHover : COLORS.shadow,
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        borderLeft: `3px solid ${color}`,
        cursor: 'default',
        position: 'relative',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <FontAwesomeIcon icon={icon} style={{ color, fontSize: '0.8rem' }} />
        <span style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          {title}
        </span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, marginTop: '0.25rem' }}>
        {formattedValue}{suffix}
      </div>
    </div>
  );
}

// ========== TAB BUTTON ==========
function TabButton({ label, icon, active, onClick }: { label: string; icon: any; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.6rem 1.25rem',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontWeight: active ? '600' : '400',
        borderBottom: active ? `3px solid ${COLORS.primary}` : '3px solid transparent',
        color: active ? COLORS.primary : COLORS.textSecondary,
        fontSize: '0.85rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = COLORS.textPrimary;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = COLORS.textSecondary;
        }
      }}
    >
      <FontAwesomeIcon icon={icon} style={{ fontSize: '0.8rem' }} />
      {label}
    </button>
  );
}

// ========== WORKER RANKING ROW - FIXED: uses full_name ==========
function WorkerRankingRow({ worker }: { worker: any }) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

  return (
    <tr 
      style={{ 
        borderBottom: `1px solid ${COLORS.border}`,
        backgroundColor: isHovered ? COLORS.bgGray : 'transparent',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td style={{ padding: '0.6rem 1rem', fontWeight: '500', color: COLORS.textPrimary }}>
        {worker.full_name || worker.name || 'Unknown'}
      </td>
      <td style={{ padding: '0.6rem 1rem', textAlign: 'center', color: COLORS.success }}>
        {worker.present_days || worker.present || 0}
      </td>
      <td style={{ padding: '0.6rem 1rem', textAlign: 'center', color: COLORS.primary }}>
        {worker.late_days || worker.late || 0}
      </td>
      <td style={{ padding: '0.6rem 1rem', textAlign: 'center', color: COLORS.textPrimary }}>
        {worker.total_days || (worker.present_days + worker.late_days + worker.absent_days) || 0}
      </td>
    </tr>
  );
}

// ========== WORKFORCE LIST ITEM - FIXED: uses full_name ==========
function WorkforceListItem({ worker, color, label, valueKey }: { worker: any; color: string; label: string; valueKey: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      style={{ 
        padding: '0.5rem 0', 
        borderBottom: `1px solid ${COLORS.border}`,
        backgroundColor: isHovered ? COLORS.bgGray : 'transparent',
        transition: 'all 0.2s ease',
        paddingLeft: isHovered ? '0.5rem' : '0',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={{ fontWeight: '500', color: COLORS.textPrimary }}>
        {worker.full_name || worker.name || 'Unknown'}
      </span>
      <span style={{ color: COLORS.textMuted, fontSize: '0.8rem', marginLeft: '0.5rem' }}>
        – <strong style={{ color }}>{worker[valueKey] || 0}</strong> {label}
      </span>
    </div>
  );
}

// ========== CHART OPTIONS ==========
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 16,
        font: { size: 11 },
        color: COLORS.textMuted,
      },
    },
    tooltip: {
      backgroundColor: 'white',
      titleColor: COLORS.textPrimary,
      bodyColor: COLORS.textSecondary,
      borderColor: COLORS.border,
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: COLORS.textMuted, font: { size: 10 } },
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
      ticks: { color: COLORS.textMuted, font: { size: 10 } },
      beginAtZero: true,
    },
  },
};

export default function Analytics() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('operational');
  const [operational, setOperational] = useState<any>(null);
  const [financial, setFinancial] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [workforce, setWorkforce] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      const headers = getAuthHeaders();
      try {
        const [op, fin, inv, wf] = await Promise.all([
          fetch('/api/analytics/operational', { headers }).then(res => res.json()).catch(() => ({ error: 'Failed to load' })),
          fetch('/api/analytics/financial', { headers }).then(res => res.json()).catch(() => ({ error: 'Failed to load' })),
          fetch('/api/analytics/inventory', { headers }).then(res => res.json()).catch(() => ({ error: 'Failed to load' })),
          fetch('/api/analytics/workforce', { headers }).then(res => res.json()).catch(() => ({ error: 'Failed to load' })),
        ]);
        
        setOperational(op);
        setFinancial(fin);
        setInventory(inv);
        setWorkforce(wf);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const lineChartData = (labels: string[], data: number[], label: string) => ({
    labels,
    datasets: [{ 
      label, 
      data, 
      borderColor: COLORS.primary, 
      backgroundColor: `${COLORS.primary}20`, 
      tension: 0.4, 
      fill: true,
      pointBackgroundColor: COLORS.primary,
      pointBorderColor: 'white',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2.5,
    }],
  });

  const barChartData = (labels: string[], data: number[], label: string) => ({
    labels,
    datasets: [{ 
      label, 
      data, 
      backgroundColor: COLORS.primary,
      borderRadius: 6,
      barPercentage: 0.7,
    }],
  });

  const lineChartMultiData = (labels: string[], datasets: any[]) => ({
    labels,
    datasets: datasets.map(d => ({
      ...d,
      pointBorderColor: 'white',
      pointBorderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 2,
      tension: 0.4,
      fill: true,
    })),
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: COLORS.textMuted }}>
          {t('loadingAnalytics') || 'Loading analytics...'}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div style={{ padding: '2rem', textAlign: 'center', color: COLORS.danger }}>
          {error}
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'operational', label: t('operational') || 'Operational', icon: faChartLine },
    { id: 'financial', label: t('financial') || 'Financial', icon: faMoneyBillWave },
    { id: 'inventory', label: t('inventory') || 'Inventory', icon: faBoxes },
    { id: 'workforce', label: t('workforce') || 'Workforce', icon: faUsers },
  ];

  // ===== RENDER FUNCTIONS =====

  const renderOperational = () => {
    if (!operational || operational.error) {
      return (
        <div style={{ background: 'white', padding: '3rem 2rem', borderRadius: '12px', textAlign: 'center', boxShadow: COLORS.shadow }}>
          <FontAwesomeIcon icon={faChartLine} style={{ fontSize: '3rem', color: COLORS.textMuted, marginBottom: '1rem' }} />
          <h3 style={{ color: COLORS.textSecondary }}>{t('noOperationalData') || 'No operational data available'}</h3>
          <p style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>Check your attendance records and database connection.</p>
        </div>
      );
    }

    const { todayStats, attendanceTrend, workerRanking } = operational;
    const totalWorkers = todayStats?.total_workers || 0;
    const present = todayStats?.present || 0;
    const absent = todayStats?.absent || 0;
    const late = todayStats?.late || 0;
    const onLeave = todayStats?.on_leave || 0;
    
    return (
      <div>
        {/* KPI Cards - ALL WHITE BACKGROUND, COLORED LEFT BORDER ONLY */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <KpiCard
            title={t('totalWorkers') || 'Total Workers'}
            value={totalWorkers}
            icon={faUsers}
            color={COLORS.primary}
          />
          <KpiCard
            title={t('present') || 'Present'}
            value={present}
            icon={faCheckCircle}
            color={present > 0 ? '#10b981' : COLORS.primary}
          />
          <KpiCard
            title={t('absent') || 'Absent'}
            value={absent}
            icon={faTimesCircle}
            color={absent > 0 ? '#ef4444' : COLORS.primary}
          />
          <KpiCard
            title={t('late') || 'Late'}
            value={late}
            icon={faExclamationTriangle}
            color={late > 0 ? COLORS.primary : COLORS.primary}
          />
          <KpiCard
            title={t('onLeave') || 'On Leave'}
            value={onLeave}
            icon={faUmbrellaBeach}
            color={onLeave > 0 ? '#3b82f6' : COLORS.primary}
          />
        </div>

        {/* Attendance Trend Chart */}
        {attendanceTrend && attendanceTrend.length > 0 && (
          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: COLORS.shadow }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '0.75rem' }}>
              <FontAwesomeIcon icon={faChartLine} style={{ color: COLORS.primary, marginRight: '0.4rem' }} />
              {t('attendanceTrend') || 'Attendance Trend (Last 7 days)'}
            </h3>
            <div style={{ height: '250px' }}>
              <Line 
                data={lineChartMultiData(
                  attendanceTrend.map((d: any) => new Date(d.date).toLocaleDateString()),
                  [
                    { label: t('present') || 'Present', data: attendanceTrend.map((d: any) => d.present), borderColor: '#10b981', backgroundColor: '#10b98120' },
                    { label: t('late') || 'Late', data: attendanceTrend.map((d: any) => d.late), borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}20` },
                    { label: t('absent') || 'Absent', data: attendanceTrend.map((d: any) => d.absent), borderColor: '#ef4444', backgroundColor: '#ef444420' },
                  ]
                )} 
                options={chartOptions} 
              />
            </div>
          </div>
        )}

        {/* Top Reliable Workers - FIXED: uses full_name */}
        {workerRanking && workerRanking.length > 0 && (
          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: COLORS.shadow }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '0.75rem' }}>
              <FontAwesomeIcon icon={faUserCheck} style={{ color: COLORS.primary, marginRight: '0.4rem' }} />
              {t('topReliableWorkers') || 'Top 5 Most Reliable Workers'}
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: COLORS.bgGray, borderBottom: `1px solid ${COLORS.border}` }}>
                    <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: '600' }}>
                      {t('worker') || 'Worker'}
                    </th>
                    <th style={{ padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: '600' }}>
                      {t('present') || 'Present'}
                    </th>
                    <th style={{ padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: '600' }}>
                      {t('late') || 'Late'}
                    </th>
                    <th style={{ padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: '600' }}>
                      {t('totalDays') || 'Total Days'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workerRanking.slice(0,5).map((w: any, idx: number) => (
                    <WorkerRankingRow key={idx} worker={w} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFinancial = () => {
    if (!financial || financial.error) {
      return (
        <div style={{ background: 'white', padding: '3rem 2rem', borderRadius: '12px', textAlign: 'center', boxShadow: COLORS.shadow }}>
          <FontAwesomeIcon icon={faMoneyBillWave} style={{ fontSize: '3rem', color: COLORS.textMuted, marginBottom: '1rem' }} />
          <h3 style={{ color: COLORS.textSecondary }}>{t('noFinancialData') || 'No financial data available'}</h3>
        </div>
      );
    }

    const { revenueDaily, topProducts } = financial;
    // FIXED: Proper number parsing
    const totalRevenue = revenueDaily?.reduce((sum: number, r: any) => sum + parseFloat(r.revenue || 0), 0) || 0;

    return (
      <div>
        {/* Total Revenue - Gold Accent */}
        <div style={{ 
          background: `linear-gradient(135deg, ${COLORS.primary}10, ${COLORS.primary}20)`,
          padding: '1.5rem', 
          borderRadius: '16px', 
          marginBottom: '1.5rem', 
          border: `1px solid ${COLORS.primary}30`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <FontAwesomeIcon icon={faDollarSign} style={{ color: COLORS.primary, marginRight: '0.3rem' }} />
              {t('totalRevenueLast30') || 'Total Revenue (Last 30 days)'}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.textPrimary }}>
              {totalRevenue.toLocaleString()} RWF
            </div>
          </div>
          <div style={{
            padding: '0.4rem 1rem',
            background: 'white',
            borderRadius: '8px',
            border: `1px solid ${COLORS.primary}20`,
          }}>
            <span style={{ fontSize: '0.7rem', color: COLORS.textMuted }}>
              <FontAwesomeIcon icon={faArrowUp} style={{ color: COLORS.success, marginRight: '0.2rem' }} />
              {t('allTime') || 'All Time'}
            </span>
          </div>
        </div>

        {/* Revenue Trend */}
        {revenueDaily && revenueDaily.length > 0 && (
          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: COLORS.shadow }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '0.75rem' }}>
              <FontAwesomeIcon icon={faChartLine} style={{ color: COLORS.primary, marginRight: '0.4rem' }} />
              {t('revenueTrend') || 'Revenue Trend (Last 30 days)'}
            </h3>
            <div style={{ height: '250px' }}>
              <Line 
                data={lineChartData(
                  revenueDaily.map((r: any) => r.date), 
                  revenueDaily.map((r: any) => parseFloat(r.revenue) || 0), 
                  t('revenue') || 'Revenue (RWF)'
                )} 
                options={chartOptions} 
              />
            </div>
          </div>
        )}

        {/* Top Products */}
        {topProducts && topProducts.length > 0 && (
          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: COLORS.shadow }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '0.75rem' }}>
              <FontAwesomeIcon icon={faChartSimple} style={{ color: COLORS.primary, marginRight: '0.4rem' }} />
              {t('topSellingProducts') || 'Top Selling Products (by revenue)'}
            </h3>
            <div style={{ height: '250px' }}>
              <Bar 
                data={barChartData(
                  topProducts.map((p: any) => p.name), 
                  topProducts.map((p: any) => parseFloat(p.revenue) || 0), 
                  t('revenue') || 'Revenue (RWF)'
                )} 
                options={chartOptions} 
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInventory = () => {
    if (!inventory || inventory.error) {
      return (
        <div style={{ background: 'white', padding: '3rem 2rem', borderRadius: '12px', textAlign: 'center', boxShadow: COLORS.shadow }}>
          <FontAwesomeIcon icon={faBoxes} style={{ fontSize: '3rem', color: COLORS.textMuted, marginBottom: '1rem' }} />
          <h3 style={{ color: COLORS.textSecondary }}>{t('noInventoryData') || 'No inventory data available'}</h3>
        </div>
      );
    }

    const { 
      fastMoving, slowMoving, deadStock, turnoverRate, productSales,
      fastMovingProducts, slowMovingProducts, deadStockProducts 
    } = inventory;

    return (
      <div>
        {/* Inventory KPI Cards - ALL WHITE BACKGROUND */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <KpiCard
            title={t('fastMoving') || 'Fast-Moving'}
            value={fastMoving || 0}
            icon={faTruck}
            color={fastMoving > 0 ? '#10b981' : COLORS.primary}
          />
          <KpiCard
            title={t('slowMoving') || 'Slow-Moving'}
            value={slowMoving || 0}
            icon={faClock}
            color={slowMoving > 0 ? COLORS.primary : COLORS.primary}
          />
          <KpiCard
            title={t('deadStock') || 'Dead Stock'}
            value={deadStock || 0}
            icon={faTimesCircle}
            color={deadStock > 0 ? '#ef4444' : COLORS.primary}
          />
          <KpiCard
            title={t('turnoverRate') || 'Turnover Rate'}
            value={turnoverRate?.toFixed(2) || '0.00'}
            icon={faChartSimple}
            color={COLORS.primary}
          />
        </div>

        {/* Product Lists */}
        {fastMovingProducts && fastMovingProducts.length > 0 && (
          <div style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1rem', boxShadow: COLORS.shadow, borderLeft: `3px solid #10b981` }}>
            <h4 style={{ margin: 0, marginBottom: '0.5rem', color: '#10b981', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FontAwesomeIcon icon={faTruck} /> {t('fastMovingProducts') || 'Fast-Moving Products (Sold > 50 units)'}
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
              {fastMovingProducts.map((p: any) => (
                <li key={p.id} style={{ padding: '0.25rem 0', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                  {p.name} - <strong style={{ color: '#10b981' }}>{p.units_sold}</strong> units sold
                </li>
              ))}
            </ul>
          </div>
        )}

        {slowMovingProducts && slowMovingProducts.length > 0 && (
          <div style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1rem', boxShadow: COLORS.shadow, borderLeft: `3px solid ${COLORS.primary}` }}>
            <h4 style={{ margin: 0, marginBottom: '0.5rem', color: COLORS.primary, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FontAwesomeIcon icon={faClock} /> {t('slowMovingProducts') || 'Slow-Moving Products (Sold 1-50 units)'}
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
              {slowMovingProducts.map((p: any) => (
                <li key={p.id} style={{ padding: '0.25rem 0', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                  {p.name} - <strong style={{ color: COLORS.primary }}>{p.units_sold}</strong> units sold
                </li>
              ))}
            </ul>
          </div>
        )}

        {deadStockProducts && deadStockProducts.length > 0 && (
          <div style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1rem', boxShadow: COLORS.shadow, borderLeft: `3px solid #ef4444` }}>
            <h4 style={{ margin: 0, marginBottom: '0.5rem', color: '#ef4444', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FontAwesomeIcon icon={faTimesCircle} /> {t('deadStockProducts') || 'Dead Stock (No sales in 90 days)'}
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
              {deadStockProducts.map((p: any) => (
                <li key={p.id} style={{ padding: '0.25rem 0', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                  {p.name} - <strong style={{ color: '#ef4444' }}>{p.stock_quantity}</strong> units in stock
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Product Sales Chart */}
        {productSales && productSales.length > 0 && (
          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: COLORS.shadow, marginTop: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '0.75rem' }}>
              <FontAwesomeIcon icon={faShoppingCart} style={{ color: COLORS.primary, marginRight: '0.4rem' }} />
              {t('productSales') || 'Product Sales (Last 30 days)'}
            </h3>
            <div style={{ height: '250px' }}>
              <Bar 
                data={barChartData(
                  productSales.map((p: any) => p.name), 
                  productSales.map((p: any) => p.sold_units || 0), 
                  t('unitsSold') || 'Units Sold'
                )} 
                options={chartOptions} 
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWorkforce = () => {
    if (!workforce || workforce.error) {
      return (
        <div style={{ background: 'white', padding: '3rem 2rem', borderRadius: '12px', textAlign: 'center', boxShadow: COLORS.shadow }}>
          <FontAwesomeIcon icon={faUsers} style={{ fontSize: '3rem', color: COLORS.textMuted, marginBottom: '1rem' }} />
          <h3 style={{ color: COLORS.textSecondary }}>{t('noWorkforceData') || 'No workforce data available'}</h3>
        </div>
      );
    }

    const { topReliable, mostLate, mostAbsent } = workforce;

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))', gap: '1rem' }}>
        {/* Top Reliable - Green */}
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: COLORS.shadow, borderLeft: `3px solid #10b981` }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '0.75rem' }}>
            <FontAwesomeIcon icon={faUserCheck} style={{ color: '#10b981', marginRight: '0.4rem' }} />
            {t('topReliableWorkers') || 'Most Reliable Workers'}
          </h3>
          {topReliable && topReliable.length > 0 ? (
            topReliable.map((w: any, idx: number) => (
              <WorkforceListItem 
                key={idx} 
                worker={w} 
                color="#10b981" 
                label={t('presentDays') || 'present days'} 
                valueKey="present_days" 
              />
            ))
          ) : (
            <p style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>No reliable worker data available</p>
          )}
        </div>

        {/* Most Late - Gold */}
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: COLORS.shadow, borderLeft: `3px solid ${COLORS.primary}` }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '0.75rem' }}>
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: COLORS.primary, marginRight: '0.4rem' }} />
            {t('mostLateArrivals') || 'Most Late Arrivals'}
          </h3>
          {mostLate && mostLate.length > 0 ? (
            mostLate.map((w: any, idx: number) => (
              <WorkforceListItem 
                key={idx} 
                worker={w} 
                color={COLORS.primary} 
                label={t('lateDays') || 'late days'} 
                valueKey="late_count" 
              />
            ))
          ) : (
            <p style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>No late arrival data available</p>
          )}
        </div>

        {/* Most Absent - Red */}
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: COLORS.shadow, borderLeft: `3px solid #ef4444` }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '0.75rem' }}>
            <FontAwesomeIcon icon={faTimesCircle} style={{ color: '#ef4444', marginRight: '0.4rem' }} />
            {t('mostAbsentWorkers') || 'Most Absent Workers'}
          </h3>
          {mostAbsent && mostAbsent.length > 0 ? (
            mostAbsent.map((w: any, idx: number) => (
              <WorkforceListItem 
                key={idx} 
                worker={w} 
                color="#ef4444" 
                label={t('absentDays') || 'absent days'} 
                valueKey="absent_count" 
              />
            ))
          ) : (
            <p style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>No absentee data available</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
            <FontAwesomeIcon icon={faChartLine} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
            {t('analyticsDashboard') || 'Analytics Dashboard'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0.15rem 0 0 0' }}>
            {t('analyticsDescription') || 'View insights across operational, financial, inventory, and workforce metrics'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, marginBottom: '1.5rem', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <TabButton
              key={tab.id}
              label={tab.label}
              icon={tab.icon}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'operational' && renderOperational()}
        {activeTab === 'financial' && renderFinancial()}
        {activeTab === 'inventory' && renderInventory()}
        {activeTab === 'workforce' && renderWorkforce()}
      </div>
    </DashboardLayout>
  );
}