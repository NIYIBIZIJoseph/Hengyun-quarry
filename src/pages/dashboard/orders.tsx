import { useEffect, useState } from 'react';
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
} from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/hooks/useTranslation';
import { ROLES } from '@/lib/roles';

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

export default function OrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');

  const [branches, setBranches] = useState<
    { id: number; name: string }[]
  >([]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const userRole = getUserRoleFromToken();

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
      const res = await fetch(`/api/orders?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      setOrders(data);
      setFilteredOrders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches', {
        headers: getAuthHeaders(),
      });

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

  const isSuperAdmin = userRole === ROLES.SUPERADMIN;

  const handleMonthChange = (direction: number) => {
    const [year, month] = currentMonth.split('-').map(Number);

    let newYear = year;
    let newMonth = month + direction;

    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }

    const newMonthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;

    setCurrentMonth(newMonthStr);

    const firstDay = `${newYear}-${String(newMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(newYear, newMonth, 0)
      .toISOString()
      .slice(0, 10);

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
    a.download = `orders_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading)
    return (
      <DashboardLayout>
        {t('loadingOrders') || 'Loading orders...'}
      </DashboardLayout>
    );

  if (error)
    return (
      <DashboardLayout>
        {t('error') || 'Error'}: {error}
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>{t('marketOrders') || 'Market Orders'}</h1>

        <button onClick={exportToCSV}>
          <FontAwesomeIcon icon={faFileExport} />{' '}
          {t('exportCSV') || 'Export CSV'}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          placeholder={t('searchOrders') || 'Search...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>

        {isSuperAdmin && (
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Products</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td>#{order.order_number}</td>
                <td>{order.client_name}</td>
                <td>{order.client_phone}</td>
                <td>{order.product_names || '-'}</td>
                <td>{order.total_amount?.toLocaleString()}</td>
                <td>{order.status}</td>
                <td>{order.payment_status}</td>
                <td>
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td>
                  <Link href={`/dashboard/orders/${order.id}`}>
                    <button>
                      <FontAwesomeIcon icon={faEye} /> View
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}