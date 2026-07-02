import { useEffect, useState } from 'react';
import { useRouter } from 'next/router'; // ← ADD THIS IMPORT
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders, getUserRoleFromToken } from '@/lib/auth-client';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  faEye,
  faFileExport,
  faSearch,
  faChevronLeft,
  faChevronRight,
  faCheckCircle,
  faTimesCircle,
  faTruck,
  faClock,
  faEdit,
  faTrashAlt,
  faFilter,
  faBox,
  faMoneyBillWave,
  faShoppingCart,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/hooks/useTranslation';
import { ROLES } from '@/lib/roles';

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
  bgWhite: "#ffffff",
  bgGray: "#f9fafb",
  bgLightGray: "#f3f4f6",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowHover: "0 8px 25px rgba(0,0,0,0.08)",
};

interface Order {
  id: number;
  order_number: string;
  client_name: string;
  client_phone: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  branch_name: string;
  product_names: string | null;
  product_count: number;
}

// ========== KPI CARD COMPONENT ==========
function KpiCard({ title, value, icon, color = COLORS.primary, bgColor = 'white', suffix = '' }: { 
  title: string; 
  value: string | number; 
  icon: any; 
  color?: string; 
  bgColor?: string;
  suffix?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        background: bgColor,
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        boxShadow: isHovered ? COLORS.shadowHover : COLORS.shadow,
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        borderLeft: `4px solid ${color}`,
        cursor: 'default',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FontAwesomeIcon icon={icon} style={{ color, fontSize: '0.9rem' }} />
        <span style={{ fontSize: '0.75rem', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          {title}
        </span>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: '700', color: COLORS.textPrimary, marginTop: '0.25rem' }}>
        {value}{suffix}
      </div>
    </div>
  );
}

// ========== STATUS BADGE ==========
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
      padding: '0.25rem 0.75rem',
      borderRadius: '20px',
      fontSize: '0.7rem',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
    }}>
      <FontAwesomeIcon icon={config.icon} style={{ fontSize: '0.5rem' }} />
      {config.label}
    </span>
  );
}

// ========== PAYMENT BADGE ==========
function PaymentBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  if (status === 'paid') {
    return (
      <span style={{
        background: '#d1fae5',
        color: '#065f46',
        padding: '0.25rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.7rem',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
      }}>
        <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '0.5rem' }} />
        {t('paid') || 'Paid'}
      </span>
    );
  }
  return (
    <span style={{
      background: '#fef3c7',
      color: '#92400e',
      padding: '0.25rem 0.75rem',
      borderRadius: '20px',
      fontSize: '0.7rem',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
    }}>
      <FontAwesomeIcon icon={faClock} style={{ fontSize: '0.5rem' }} />
      {t('unpaid') || 'Unpaid'}
    </span>
  );
}

// ========== ORDER ROW COMPONENT ==========
function OrderRow({ order, onView }: { order: Order; onView: (id: number) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

  return (
    <tr
      style={{
        borderBottom: `1px solid ${COLORS.border}`,
        backgroundColor: isHovered ? COLORS.bgGray : 'transparent',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onView(order.id)}
    >
      <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: COLORS.textPrimary, fontSize: '0.85rem' }}>
        #{order.order_number}
      </td>
      <td style={{ padding: '0.75rem 1rem' }}>
        <div style={{ fontWeight: '500', fontSize: '0.85rem', color: COLORS.textPrimary }}>
          {order.client_name}
        </div>
        {order.branch_name && (
          <div style={{ fontSize: '0.65rem', color: COLORS.textMuted }}>
            {order.branch_name}
          </div>
        )}
      </td>
      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>
        {order.client_phone}
      </td>
      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>
        {order.product_names ? (
          <span title={order.product_names}>
            {order.product_names.length > 40 ? order.product_names.substring(0, 40) + '...' : order.product_names}
          </span>
        ) : (
          `${order.product_count || 0} items`
        )}
      </td>
      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '600', color: COLORS.primary }}>
        {order.total_amount?.toLocaleString()} RWF
      </td>
      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
        <StatusBadge status={order.status} />
      </td>
      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
        <PaymentBadge status={order.payment_status} />
      </td>
      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: COLORS.textMuted }}>
        {new Date(order.created_at).toLocaleDateString()}
      </td>
      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <button
          onClick={() => onView(order.id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: COLORS.info,
            cursor: 'pointer',
            padding: '0.3rem 0.6rem',
            borderRadius: '6px',
            transition: 'all 0.2s',
            fontSize: '0.85rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${COLORS.info}15`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <FontAwesomeIcon icon={faEye} />
        </button>
      </td>
    </tr>
  );
}

export default function OrdersPage() {
  const router = useRouter(); // ← ADD THIS LINE
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');

  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));

  const userRole = getUserRoleFromToken();
  const isSuperAdmin = userRole === ROLES.SUPERADMIN;

  const fetchOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (paymentFilter !== 'all') params.append('payment', paymentFilter);
    if (branchFilter !== 'all') params.append('branch', branchFilter);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    try {
      const res = await fetch(`/api/orders?${params.toString()}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const ordersArray = Array.isArray(data) ? data : [];
      setOrders(ordersArray);
      setFilteredOrders(ordersArray);
    } catch (err: any) {
      setError(err.message);
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches', { headers: getAuthHeaders() });
      const data = await res.json();
      setBranches(Array.isArray(data) ? data : []);
    } catch {
      setBranches([]);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter, paymentFilter, branchFilter, startDate, endDate]);

  const handleMonthChange = (direction: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month + direction;
    if (newMonth < 1) { newMonth = 12; newYear--; }
    else if (newMonth > 12) { newMonth = 1; newYear++; }
    const newMonthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    setCurrentMonth(newMonthStr);
    const firstDay = `${newYear}-${String(newMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(newYear, newMonth, 0).toISOString().slice(0, 10);
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  const exportToCSV = () => {
    const headers = [
      t('orderNumber') || 'Order #',
      t('customer') || 'Customer',
      t('phone') || 'Phone',
      t('products') || 'Products',
      t('total') || 'Total (RWF)',
      t('status') || 'Status',
      t('paymentStatus') || 'Payment',
      t('date') || 'Date',
    ];
    const rows = filteredOrders.map((o) => [
      o.order_number,
      o.client_name,
      o.client_phone,
      o.product_names || '-',
      o.total_amount?.toLocaleString() || '0',
      o.status,
      o.payment_status,
      new Date(o.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate KPIs with proper number handling
  const totalOrders = filteredOrders.length;
  
  const totalRevenue = filteredOrders.reduce((sum, o) => {
    const amount = typeof o.total_amount === 'number' ? o.total_amount : parseFloat(o.total_amount) || 0;
    return sum + amount;
  }, 0);
  
  const pendingOrders = filteredOrders.filter(o => o.status === 'pending').length;
  const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered').length;

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: COLORS.textMuted }}>
          {t('loadingOrders') || 'Loading orders...'}
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

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
              {t('marketOrders') || 'Market Orders'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0.15rem 0 0 0' }}>
              {t('manageOrders') || 'Manage and track all customer orders'}
            </p>
          </div>
          <button
            onClick={exportToCSV}
            style={{
              background: COLORS.primary,
              border: 'none',
              padding: '0.6rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.primaryDark;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.primary;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
            }}
          >
            <FontAwesomeIcon icon={faFileExport} /> {t('exportCSV') || 'Export CSV'}
          </button>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <KpiCard
            title={t('totalOrders') || 'Total Orders'}
            value={totalOrders}
            icon={faShoppingCart}
            color={COLORS.info}
          />
          <KpiCard
            title={t('totalRevenue') || 'Total Revenue'}
            value={totalRevenue.toLocaleString()}
            icon={faMoneyBillWave}
            color={COLORS.primary}
            suffix=" RWF"
          />
          <KpiCard
            title={t('pendingOrders') || 'Pending Orders'}
            value={pendingOrders}
            icon={faClock}
            color={pendingOrders > 0 ? COLORS.warning : COLORS.success}
            bgColor={pendingOrders > 0 ? '#fef3c7' : 'white'}
          />
          <KpiCard
            title={t('delivered') || 'Delivered'}
            value={deliveredOrders}
            icon={faCheckCircle}
            color={COLORS.success}
          />
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          padding: '1rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          boxShadow: COLORS.shadow,
        }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
              <input
                type="text"
                placeholder={t('searchOrders') || 'Search by order #, customer name, phone...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  background: COLORS.bgGray,
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = COLORS.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.primary}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = COLORS.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.85rem',
                background: COLORS.bgGray,
                minWidth: '130px',
              }}
            >
              <option value="all">{t('allStatus') || 'All Status'}</option>
              <option value="pending">{t('statusPending') || 'Pending'}</option>
              <option value="approved">{t('statusApproved') || 'Approved'}</option>
              <option value="delivered">{t('statusDelivered') || 'Delivered'}</option>
              <option value="cancelled">{t('statusCancelled') || 'Cancelled'}</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.85rem',
                background: COLORS.bgGray,
                minWidth: '130px',
              }}
            >
              <option value="all">{t('allPayment') || 'All Payment'}</option>
              <option value="paid">{t('paid') || 'Paid'}</option>
              <option value="unpaid">{t('unpaid') || 'Unpaid'}</option>
            </select>
            {isSuperAdmin && (
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  background: COLORS.bgGray,
                  minWidth: '130px',
                }}
              >
                <option value="all">{t('allBranches') || 'All Branches'}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <button
                onClick={() => handleMonthChange(-1)}
                style={{
                  background: COLORS.bgGray,
                  border: `1px solid ${COLORS.border}`,
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.border;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.bgGray;
                }}
              >
                <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: '0.8rem' }} />
              </button>
              <span style={{ minWidth: '90px', textAlign: 'center', fontSize: '0.85rem', fontWeight: '500', color: COLORS.textPrimary }}>
                {currentMonth}
              </span>
              <button
                onClick={() => handleMonthChange(1)}
                style={{
                  background: COLORS.bgGray,
                  border: `1px solid ${COLORS.border}`,
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.border;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.bgGray;
                }}
              >
                <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '0.8rem' }} />
              </button>
            </div>
            {(startDate || endDate || search || statusFilter !== 'all' || paymentFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setPaymentFilter('all');
                  setBranchFilter('all');
                  setStartDate('');
                  setEndDate('');
                  setCurrentMonth(new Date().toISOString().slice(0, 7));
                }}
                style={{
                  padding: '0.4rem 1rem',
                  background: COLORS.bgGray,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.danger;
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = COLORS.danger;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.bgGray;
                  e.currentTarget.style.color = COLORS.textPrimary;
                  e.currentTarget.style.borderColor = COLORS.border;
                }}
              >
                {t('clearFilters') || 'Clear Filters'}
              </button>
            )}
          </div>
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'white',
            borderRadius: '12px',
            boxShadow: COLORS.shadow,
          }}>
            <FontAwesomeIcon icon={faBox} style={{ fontSize: '3rem', color: COLORS.textMuted, marginBottom: '1rem' }} />
            <h3 style={{ color: COLORS.textSecondary }}>{t('noOrdersFound') || 'No orders found'}</h3>
            <p style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>
              {t('tryAdjustingFilters') || 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', boxShadow: COLORS.shadow }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: COLORS.bgGray, borderBottom: `1px solid ${COLORS.border}` }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('orderNumber') || 'Order #'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('customer') || 'Customer'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('phone') || 'Phone'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('products') || 'Products'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('total') || 'Total'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('status') || 'Status'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('paymentStatus') || 'Payment'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('date') || 'Date'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('actions') || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onView={(id) => router.push(`/dashboard/orders/${id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}