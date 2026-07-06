// src/pages/dashboard/inventory/revenue.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMoneyBillWave, 
  faArrowLeft, 
  faChartLine,
  faBox,
  faTrophy,
  faArrowUp,
  faSpinner,
  faExclamationTriangle
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
  order_count: number;
}

function RevenueCard({ product }: { product: ProductRevenue }) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '0.5rem',
        borderTop: `1px solid ${COLORS.border}`,
        marginTop: '0.5rem',
      }}>
        <div style={{ fontSize: '0.65rem', color: COLORS.textMuted }}>
          {product.order_count} {product.order_count === 1 ? 'order' : 'orders'}
        </div>
        {/* ✅ Added .toLocaleString() for consistent formatting */}
        <div style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          color: COLORS.textPrimary,
        }}>
          {product.revenue.toLocaleString()} RWF
        </div>
      </div>
    </div>
  );
}

export default function RevenueOverview() {
  const { t } = useTranslation();
  const router = useRouter();
  const [revenues, setRevenues] = useState<ProductRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [topProduct, setTopProduct] = useState<ProductRevenue | null>(null);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await fetch('/api/inventory/revenue-stats', { 
          headers: getAuthHeaders() 
        });
        if (!res.ok) throw new Error('Failed to fetch revenue');
        const data = await res.json();
        
        setTotalRevenue(data.totalRevenue || 0);
        setTotalOrders(data.totalOrders || 0);
        setTopProduct(data.topProduct || null);
        setRevenues(data.perProductRevenue || []);
      } catch (err: any) {
        console.error('Error fetching revenue:', err);
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div style={{ 
          maxWidth: '600px', 
          margin: '4rem auto', 
          textAlign: 'center',
          padding: '3rem',
          background: 'white',
          borderRadius: '16px',
          boxShadow: COLORS.shadow,
        }}>
          <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '3rem', color: COLORS.danger, marginBottom: '1rem' }} />
          <h2 style={{ color: COLORS.textPrimary }}>Error Loading Revenue</h2>
          <p style={{ color: COLORS.textMuted }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.6rem 1.5rem',
              background: COLORS.primary,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.85rem',
            }}
          >
            <FontAwesomeIcon icon={faSpinner} style={{ marginRight: '0.5rem' }} />
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const sortedRevenues = [...revenues].sort((a, b) => b.revenue - a.revenue);

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
              <FontAwesomeIcon icon={faChartLine} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
              {t('revenueOverview') || 'Revenue Overview'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0.15rem 0 0 0' }}>
              {t('revenueStats') || 'Revenue breakdown from approved orders'}
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/inventory')}
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
              {t('totalRevenueDesc') || 'Total Revenue (Approved orders)'}
            </div>
            {/* ✅ Added .toLocaleString() for consistent formatting */}
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: COLORS.textPrimary }}>
              {totalRevenue.toLocaleString()} RWF
            </div>
            <div style={{ fontSize: '0.8rem', color: COLORS.textSecondary, marginTop: '0.25rem' }}>
              {t('fromOrders') || 'From'} {totalOrders} {t('approvedOrders') || 'approved orders'}
            </div>
          </div>
          {topProduct && topProduct.revenue > 0 && (
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
                <div style={{ fontSize: '0.7rem', color: COLORS.primary, fontWeight: '500' }}>
                  {topProduct.revenue.toLocaleString()} RWF
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

        {revenues.length === 0 || sortedRevenues.every(p => p.revenue === 0) ? (
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
            {sortedRevenues.map(product => (
              <RevenueCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <style jsx global>{`
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid ${COLORS.border};
            border-top-color: ${COLORS.primary};
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
}