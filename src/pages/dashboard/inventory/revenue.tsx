import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMoneyBillWave, 
  faArrowLeft, 
  faChartLine,
  faBox,
  faTrophy,
  faArrowUp // ← Changed from faTrendUp to faArrowUp
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  success: "#10b981",
  danger: "#ef4444",
  info: "#3b82f6",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  bgGray: "#f9fafb",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowHover: "0 8px 25px rgba(0,0,0,0.08)",
};

interface ProductRevenue {
  id: number;
  name: string;
  category_name: string;
  revenue: number;
}

function RevenueCard({ product }: { product: ProductRevenue }) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation(); // ← ADD THIS

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.25rem',
        boxShadow: isHovered ? COLORS.shadowHover : COLORS.shadow,
        border: `1px solid ${isHovered ? COLORS.primary : COLORS.border}`,
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        cursor: 'default',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: `${COLORS.primary}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.primary,
          }}
        >
          <FontAwesomeIcon icon={faBox} style={{ fontSize: '0.8rem' }} />
        </div>
        <div>
          <div style={{ fontWeight: '600', fontSize: '1rem', color: COLORS.textPrimary }}>
            {product.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
            {product.category_name}
          </div>
        </div>
      </div>
      <div style={{
        fontSize: '1.25rem',
        fontWeight: '700',
        color: COLORS.primary,
        paddingTop: '0.5rem',
        borderTop: `1px solid ${COLORS.border}`,
        marginTop: '0.5rem',
      }}>
        {product.revenue.toLocaleString()} RWF
      </div>
    </div>
  );
}

export default function RevenueOverview() {
  const { t } = useTranslation();
  const [revenues, setRevenues] = useState<ProductRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await fetch('/api/inventory/revenue-stats', { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch revenue');
        const data = await res.json();
        setTotalRevenue(data.totalRevenue || 0);
        setRevenues(data.perProductRevenue || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: COLORS.textMuted }}>
          {t('loadingRevenue') || 'Loading revenue overview...'}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div style={{ padding: '2rem', textAlign: 'center', color: COLORS.danger }}>
          {t('error') || 'Error'}: {error}
        </div>
      </DashboardLayout>
    );
  }

  const sortedRevenues = [...revenues].sort((a, b) => b.revenue - a.revenue);
  const topProduct = sortedRevenues.length > 0 ? sortedRevenues[0] : null;

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
              <FontAwesomeIcon icon={faChartLine} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
              {t('revenueOverview') || 'Revenue Overview'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0.15rem 0 0 0' }}>
              {t('revenueStats') || 'Track your revenue performance across all products'}
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.25rem',
              background: COLORS.bgGray,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: COLORS.textSecondary,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.border;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.bgGray;
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> {t('back') || 'Back'}
          </button>
        </div>

        {/* Total Revenue Card */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.primary}10, ${COLORS.primary}20)`,
          padding: '1.5rem',
          borderRadius: '16px',
          marginBottom: '2rem',
          border: `1px solid ${COLORS.primary}30`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <FontAwesomeIcon icon={faMoneyBillWave} style={{ marginRight: '0.3rem' }} />
              {t('totalRevenueDesc') || 'Total Revenue (All delivered orders)'}
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: COLORS.primary }}>
              {totalRevenue.toLocaleString()} RWF
            </div>
          </div>
          {topProduct && (
            <div style={{
              background: 'white',
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              boxShadow: COLORS.shadow,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: `${COLORS.success}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: COLORS.success,
              }}>
                <FontAwesomeIcon icon={faTrophy} />
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {t('topProduct') || 'Top Product'}
                </div>
                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: COLORS.textPrimary }}>
                  {topProduct.name}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Revenue by Product */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '1rem' }}>
          <FontAwesomeIcon icon={faArrowUp} style={{ marginRight: '0.5rem', color: COLORS.primary }} />
          {t('revenueByProduct') || 'Revenue by Product'}
        </h2>

        {revenues.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'white',
            borderRadius: '12px',
            boxShadow: COLORS.shadow,
          }}>
            <FontAwesomeIcon icon={faMoneyBillWave} style={{ fontSize: '3rem', color: COLORS.textMuted, marginBottom: '1rem' }} />
            <h3 style={{ color: COLORS.textSecondary }}>{t('noRevenueData') || 'No revenue data yet'}</h3>
            <p style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>
              {t('completeOrdersToSeeRevenue') || 'Complete orders to see revenue data.'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1rem',
          }}>
            {revenues.map(product => (
              <RevenueCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}