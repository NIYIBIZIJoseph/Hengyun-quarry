import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faSpinner, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  success: "#10b981",
  danger: "#ef4444",
  info: "#3b82f6",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const statusColors: Record<string, string> = {
  pending: COLORS.primary,
  approved: COLORS.success,
  delivered: COLORS.info,
  cancelled: COLORS.danger,
};

// ========== ORDER ITEM COMPONENT ==========
function OrderItem({ order }: { order: any }) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    return statusColors[status?.toLowerCase()] || COLORS.textMuted;
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Unknown';
    }
  };

  return (
    <Link
      href={`/dashboard/orders/${order.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        textDecoration: 'none',
        padding: '0.6rem 0.75rem',
        borderRadius: '8px',
        backgroundColor: isHovered ? '#f9fafb' : 'transparent',
        transition: 'all 0.2s ease',
        borderBottom: `1px solid ${COLORS.border}`,
        display: 'block',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '600',
            color: COLORS.textPrimary,
          }}>
            #{order.order_number || order.id}
          </span>
          <span style={{
            fontSize: '0.75rem',
            color: COLORS.textSecondary,
            marginLeft: '0.5rem',
          }}>
            {order.client_name}
          </span>
        </div>
        <span style={{
          fontSize: '0.6rem',
          padding: '0.15rem 0.5rem',
          borderRadius: '10px',
          background: getStatusColor(order.status) + '20',
          color: getStatusColor(order.status),
          fontWeight: '500',
        }}>
          {getStatusText(order.status)}
        </span>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '0.25rem',
      }}>
        <span style={{
          fontSize: '0.6rem',
          color: COLORS.textMuted,
        }}>
          {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
        </span>
        <FontAwesomeIcon 
          icon={faArrowRight} 
          style={{ 
            color: COLORS.textMuted, 
            fontSize: '0.6rem',
            opacity: isHovered ? 1 : 0.3,
            transition: 'all 0.2s ease',
          }} 
        />
      </div>
    </Link>
  );
}

export default function RecentOrders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => { setOrders(Array.isArray(data) ? data.slice(0, 5) : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{
        background: 'white',
        padding: '1.25rem',
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: COLORS.shadow,
        color: COLORS.textMuted,
        fontSize: '0.85rem',
      }}>
        <FontAwesomeIcon icon={faSpinner} spin /> {t('loading') || 'Loading...'}
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.25rem',
      boxShadow: COLORS.shadow,
      transition: 'all 0.2s ease',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.75rem',
      }}>
        <FontAwesomeIcon icon={faBox} style={{ color: COLORS.primary }} />
        <h3 style={{
          fontSize: '0.85rem',
          fontWeight: '600',
          color: COLORS.textPrimary,
          margin: 0,
        }}>
          {t('recentOrders') || 'Recent Orders'}
        </h3>
      </div>

      {orders.length === 0 ? (
        <p style={{
          color: COLORS.textMuted,
          textAlign: 'center',
          padding: '1.5rem',
          fontSize: '0.85rem',
        }}>
          {t('noOrdersFound') || 'No orders found'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {orders.map((order, idx) => (
            <OrderItem key={idx} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}