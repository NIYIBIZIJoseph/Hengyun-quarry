import { useEffect, useState } from 'react';
import { getUserRoleFromToken } from '@/lib/auth-client';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import AlertBar from '@/components/dashboard/AlertBar';
import QuickActions from '@/components/dashboard/QuickActions';
import AISummary from '@/components/dashboard/AISummary';

import BusinessKPIs from '@/components/dashboard/KPICards/BusinessKPIs';
import WorkforceKPIs from '@/components/dashboard/KPICards/WorkforceKPIs';
import InventoryKPIs from '@/components/dashboard/KPICards/InventoryKPIs';
import SupportKPIs from '@/components/dashboard/KPICards/SupportKPIs';

import RecentActivity from '@/components/dashboard/OperationalPanel/RecentActivity';
import AttendanceSnapshot from '@/components/dashboard/OperationalPanel/AttendanceSnapshot';
import RecentOrders from '@/components/dashboard/OperationalPanel/RecentOrders';
import SupportQueue from '@/components/dashboard/OperationalPanel/SupportQueue';

import RevenueChart from '@/components/dashboard/AnalyticsPanel/RevenueChart';
import OrderStatusPie from '@/components/dashboard/AnalyticsPanel/OrderStatusPie';
import InventoryHealthChart from '@/components/dashboard/AnalyticsPanel/InventoryHealthChart';
import AttendanceTrendChart from '@/components/dashboard/AnalyticsPanel/AttendanceTrendChart';
import BranchPerformance from '@/components/dashboard/BranchPerformance';
import PendingApprovals from '@/components/dashboard/PendingApprovals';

// Define ROLES in lowercase to match token
const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  SERVICE_PROVIDER: 'service_provider',
};

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    
    if (!token) {
      console.log('No token, redirecting to login');
      window.location.href = '/login';
      return;
    }
    
    // Get role from token
    const role = getUserRoleFromToken();
    console.log('Role from token:', role);
    
    // Convert to lowercase if needed
    const normalizedRole = role ? role.toLowerCase() : null;
    console.log('Normalized role:', normalizedRole);
    
    setUserRole(normalizedRole);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          Loading dashboard...
        </div>
      </DashboardLayout>
    );
  }

  if (!userRole) {
    return (
      <DashboardLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          Please login to continue.
          <button 
            onClick={() => window.location.href = '/login'}
            style={{ marginLeft: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Go to Login
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const isSupervisor = userRole === ROLES.SUPERVISOR;
  const isAdmin = userRole === ROLES.ADMIN || userRole === ROLES.SUPERADMIN;
  
  console.log('User role:', userRole);
  console.log('isSupervisor:', isSupervisor);
  console.log('isAdmin:', isAdmin);

  return (
    <DashboardLayout>
      <DashboardHeader />

      {isAdmin && <AISummary />}

      {!isSupervisor && (
        <div style={{ marginBottom: '2rem' }}>
          <h2>Business</h2>
          <BusinessKPIs />
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h2>Workforce</h2>
        <WorkforceKPIs />
      </div>

      {!isSupervisor && (
        <div style={{ marginBottom: '2rem' }}>
          <h2>Inventory</h2>
          <InventoryKPIs />
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h2>Support</h2>
        <SupportKPIs />
      </div>

      <QuickActions />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div>
          <RecentActivity />
          <div style={{ marginTop: '1.5rem' }}><AttendanceSnapshot /></div>
          {!isSupervisor && <div style={{ marginTop: '1.5rem' }}><RecentOrders /></div>}
          <div style={{ marginTop: '1.5rem' }}><SupportQueue /></div>
          <div style={{ marginTop: '1.5rem' }}><AlertBar /></div>
        </div>

        <div>
          {isAdmin && <RevenueChart />}
          {isAdmin && <div style={{ marginTop: '1.5rem' }}><OrderStatusPie /></div>}
          {isAdmin && <div style={{ marginTop: '1.5rem' }}><InventoryHealthChart /></div>}
          <div style={{ marginTop: '1.5rem' }}><AttendanceTrendChart /></div>
        </div>
      </div>

      {isAdmin && <BranchPerformance />}
      {isAdmin && <PendingApprovals />}
    </DashboardLayout>
  );
}