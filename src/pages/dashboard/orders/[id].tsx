import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faUser, 
  faPhoneAlt, 
  faCalendarAlt, 
  faMoneyBillWave, 
  faTruck, 
  faTrashAlt, 
  faSave,
  faCheckCircle,
  faClock,
  faTimesCircle,
  faBox,
  faLocationDot,
  faPrint,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  bgGray: "#f9fafb",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowHover: "0 8px 25px rgba(0,0,0,0.08)",
};

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Order {
  id: number;
  order_number: string;
  client_name: string;
  client_phone: string;
  delivery_location: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  branch_name: string;
  items: OrderItem[];
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const statusConfig: Record<string, { bg: string; color: string; icon: any; label: string }> = {
    pending: { bg: '#fef3c7', color: '#92400e', icon: faClock, label: t('statusPending') || 'Pending' },
    approved: { bg: '#d1fae5', color: '#065f46', icon: faCheckCircle, label: t('statusApproved') || 'Approved' },
    delivered: { bg: '#dbeafe', color: '#1e40af', icon: faTruck, label: t('statusDelivered') || 'Delivered' },
    cancelled: { bg: '#fee2e2', color: '#991b1b', icon: faTimesCircle, label: t('statusCancelled') || 'Cancelled' },
  };
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span style={{
      background: config.bg,
      color: config.color,
      padding: '0.3rem 1rem',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
    }}>
      <FontAwesomeIcon icon={config.icon} style={{ fontSize: '0.6rem' }} />
      {config.label}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  if (status === 'paid') {
    return (
      <span style={{
        background: '#d1fae5',
        color: '#065f46',
        padding: '0.3rem 1rem',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
      }}>
        <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '0.6rem' }} />
        {t('paid') || 'Paid'}
      </span>
    );
  }
  return (
    <span style={{
      background: '#fef3c7',
      color: '#92400e',
      padding: '0.3rem 1rem',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
    }}>
      <FontAwesomeIcon icon={faClock} style={{ fontSize: '0.6rem' }} />
      {t('unpaid') || 'Unpaid'}
    </span>
  );
}

export default function OrderDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setOrder(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchOrder();
      } else {
        const err = await res.json();
        alert(err.error || t('statusUpdateFailed') || 'Failed to update status');
      }
    } catch (err) {
      alert(t('networkError') || 'Network error while updating status');
    } finally {
      setUpdating(false);
    }
  };

  const deleteOrder = async () => {
    if (!confirm(t('confirmDeleteOrder') || 'Move this order to recycle bin?')) return;
    try {
      const res = await fetch(`/api/orders/${order?.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        router.push('/dashboard/orders');
      } else {
        alert(t('deleteFailed') || 'Delete failed');
      }
    } catch (err) {
      alert(t('deleteFailed') || 'Delete failed');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: COLORS.textMuted }}>
          {t('loadingOrder') || 'Loading order...'}
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <h2 style={{ color: COLORS.textPrimary }}>{t('orderNotFound') || 'Order not found'}</h2>
          <button
            onClick={() => router.push('/dashboard/orders')}
            style={{
              marginTop: '1rem',
              padding: '0.6rem 1.5rem',
              background: COLORS.primary,
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            {t('backToOrders') || 'Back to Orders'}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem' }}>
        {/* Header Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <button
            onClick={() => router.back()}
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
          <button
            onClick={deleteOrder}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.25rem',
              background: COLORS.danger,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = COLORS.shadowHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.danger;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <FontAwesomeIcon icon={faTrashAlt} /> {t('delete') || 'Delete'}
          </button>
        </div>

        {/* Order Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: COLORS.shadow,
          border: `1px solid ${COLORS.border}`,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingBottom: '1rem',
            borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
                  {t('orderHash') || 'Order'} #{order.order_number}
                </h1>
                <StatusBadge status={order.status} />
              </div>
              <div style={{ fontSize: '0.85rem', color: COLORS.textSecondary, marginTop: '0.25rem' }}>
                {new Date(order.created_at).toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.8rem', color: COLORS.textSecondary }}>{t('updateStatus') || 'Update Status:'}</label>
              <select
                value={order.status}
                onChange={(e) => updateStatus(e.target.value)}
                disabled={updating}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  border: `1px solid ${COLORS.border}`,
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: COLORS.textPrimary,
                }}
              >
                <option value="pending">{t('statusPending') || 'Pending'}</option>
                <option value="approved">{t('statusApproved') || 'Approved'}</option>
                <option value="delivered">{t('statusDelivered') || 'Delivered'}</option>
                <option value="cancelled">{t('statusCancelled') || 'Cancelled'}</option>
              </select>
              {updating && (
                <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                  {t('updating') || 'Updating...'}
                </span>
              )}
            </div>
          </div>

          {/* Order Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '1.25rem',
            padding: '1rem',
            background: COLORS.bgGray,
            borderRadius: '12px',
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                <FontAwesomeIcon icon={faUser} style={{ marginRight: '0.3rem' }} />
                {t('customer') || 'Customer'}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', color: COLORS.textPrimary }}>
                {order.client_name}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                <FontAwesomeIcon icon={faPhoneAlt} style={{ marginRight: '0.3rem' }} />
                {t('phone') || 'Phone'}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', color: COLORS.textPrimary }}>
                {order.client_phone}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                <FontAwesomeIcon icon={faLocationDot} style={{ marginRight: '0.3rem' }} />
                {t('deliveryLocation') || 'Delivery Location'}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', color: COLORS.textPrimary }}>
                {order.delivery_location || '-'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                <FontAwesomeIcon icon={faMoneyBillWave} style={{ marginRight: '0.3rem' }} />
                {t('total') || 'Total'}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: COLORS.primary }}>
                {order.total_amount?.toLocaleString()} RWF
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                <FontAwesomeIcon icon={faTruck} style={{ marginRight: '0.3rem' }} />
                {t('branch') || 'Branch'}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', color: COLORS.textPrimary }}>
                {order.branch_name || '-'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: '0.3rem' }} />
                {t('paymentStatus') || 'Payment'}
              </div>
              <div style={{ marginTop: '0.2rem' }}>
                <PaymentBadge status={order.payment_status} />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '0.75rem' }}>
              <FontAwesomeIcon icon={faBox} style={{ marginRight: '0.5rem', color: COLORS.primary }} />
              {t('items') || 'Items'}
            </h3>
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: `1px solid ${COLORS.border}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: COLORS.bgGray }}>
                  <tr>
                    <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                      {t('product') || 'Product'}
                    </th>
                    <th style={{ padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                      {t('quantity') || 'Qty'}
                    </th>
                    <th style={{ padding: '0.6rem 1rem', textAlign: 'right', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                      {t('unitPrice') || 'Unit Price'}
                    </th>
                    <th style={{ padding: '0.6rem 1rem', textAlign: 'right', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                      {t('subtotal') || 'Subtotal'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: idx < order.items.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: COLORS.textPrimary }}>
                        {item.product_name}
                      </td>
                      <td style={{ padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                        {item.unit_price?.toLocaleString()} RWF
                      </td>
                      <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '500', color: COLORS.primary }}>
                        {item.subtotal?.toLocaleString()} RWF
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr style={{ background: COLORS.bgGray, borderTop: `2px solid ${COLORS.border}` }}>
                    <td colSpan={3} style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: '600', color: COLORS.textPrimary }}>
                      {t('grandTotal') || 'Grand Total'}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: '700', color: COLORS.primary, fontSize: '1rem' }}>
                      {order.total_amount?.toLocaleString()} RWF
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}