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

const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  SERVICE_PROVIDER: 'service_provider',
};

// ========== STYLES ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  primaryLight: "#fbbf24",
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

const sectionStyle = {
  marginBottom: "2rem",
};

const sectionTitleStyle = {
  fontSize: "1.25rem",
  fontWeight: "600",
  color: COLORS.textPrimary,
  marginBottom: "1rem",
  paddingBottom: "0.5rem",
  borderBottom: `2px solid ${COLORS.border}`,
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

const twoColumnGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
  gap: "1.5rem",
};

const columnSpacing = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "1.5rem",
};

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const role = getUserRoleFromToken();
    const normalizedRole = role ? role.toLowerCase() : null;
    setUserRole(normalizedRole);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>
      </DashboardLayout>
    );
  }

  if (!userRole) {
    return (
      <DashboardLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          Please login to continue.
          <button onClick={() => window.location.href = '/login'} style={{ marginLeft: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
            Go to Login
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const isSuperAdmin = userRole === ROLES.SUPERADMIN;
  const isAdmin = userRole === ROLES.ADMIN || isSuperAdmin;
  const isSupervisor = userRole === ROLES.SUPERVISOR;

  return (
    <DashboardLayout>
      <DashboardHeader />

      {/* AI Summary - Admin only */}
      {isAdmin && <AISummary />}

      {/* BUSINESS - Only Admin */}
      {isAdmin && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <span>📊</span> Business
          </div>
          <BusinessKPIs />
        </div>
      )}

      {/* WORKFORCE - Admin and Supervisor */}
      {(isAdmin || isSupervisor) && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <span>👥</span> Workforce
          </div>
          <WorkforceKPIs />
        </div>
      )}

      {/* INVENTORY - Only Admin */}
      {isAdmin && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <span>📦</span> Inventory
          </div>
          <InventoryKPIs />
        </div>
      )}

      {/* SUPPORT - Everyone */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <span>🎫</span> Support
        </div>
        <SupportKPIs />
      </div>

      {/* Quick Actions - Only Admin */}
      {isAdmin && <QuickActions />}

      {/* Main Two Column Layout */}
      <div style={twoColumnGrid}>
        {/* Left Column */}
        <div style={columnSpacing}>
          <RecentActivity />
          <AttendanceSnapshot />
          {isAdmin && <RecentOrders />}
          <SupportQueue />
          <AlertBar />
        </div>

        {/* Right Column */}
        <div style={columnSpacing}>
          {isAdmin && <RevenueChart />}
          {isAdmin && <OrderStatusPie />}
          {isAdmin && <InventoryHealthChart />}
          <AttendanceTrendChart />
        </div>
      </div>

      {/* Bottom Sections */}
      {isAdmin && <BranchPerformance />}
      {isAdmin && <PendingApprovals />}
    </DashboardLayout>
  );
}