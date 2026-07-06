// src/pages/dashboard/settings/index.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { getUserRoleFromToken } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faKey, faBuilding, faClock, faChartLine, faBoxes,
  faHeadset, faBell, faShieldAlt, faDatabase, faPalette, faCrown,
  faUsers, faHistory, faSlidersH, faLock, faEnvelope, faPhone,
  faGlobe, faPaintBrush, faCodeBranch, faChevronRight
} from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/hooks/useTranslation';
import { ROLES } from '@/lib/roles';
import AccountSettings from '@/components/settings/AccountSettings';
import RolesPermissions from '@/components/settings/RolesPermissions';
import OrganizationSettings from '@/components/settings/OrganizationSettings';
import AttendanceRules from '@/components/settings/AttendanceRules';
import AnalyticsConfigSettings from '@/components/settings/AnalyticsConfig';
import InventoryConfigSettings from '@/components/settings/InventoryConfig';
import SupportConfigSettings from '@/components/settings/SupportConfigSettings';
import NotificationsConfigSettings from '@/components/settings/NotificationsSettings';
import SecurityConfigSettings from '@/components/settings/SecuritySettings';
import DataManagementSettings from '@/components/settings/DataManagement';
import UIPreferencesSettings from '@/components/settings/UIPreferences';
import AdminControlsSettings from '@/components/settings/AdminControls';
import TeamManagementSettings from '@/components/settings/TeamManagementSettings';
import AuditLogs from '@/components/settings/AuditLogs';

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  primaryLight: "#fbbf24",
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

// ========== TAB BUTTON ==========
function TabButton({ 
  tab, 
  active, 
  onClick,
  description
}: { 
  tab: any; 
  active: boolean; 
  onClick: () => void;
  description: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '0.6rem 1.25rem',
        background: active ? COLORS.primary : 'transparent',
        color: active ? 'white' : (isHovered ? COLORS.textPrimary : COLORS.textSecondary),
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: active ? '600' : '400',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        boxShadow: active ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
        transform: isHovered && !active ? 'translateY(-2px)' : 'translateY(0)',
      }}
      title={description}
    >
      <FontAwesomeIcon icon={tab.icon} style={{ fontSize: '0.85rem' }} />
      {tab.label}
    </button>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { tab } = router.query;

  const [activeTab, setActiveTab] = useState('account');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = getUserRoleFromToken();
    setUserRole(role || null);
  }, []);

  // Define all tabs with their required roles
  const allTabs = [
    { id: 'account', label: t('account') || 'Account', icon: faUser, roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SERVICE_PROVIDER], description: 'Manage your profile, password, and 2FA' },
    { id: 'roles', label: t('rolesPermissions') || 'Roles & Permissions', icon: faKey, roles: [ROLES.SUPERADMIN], description: 'Manage user roles and permissions' },
    { id: 'organization', label: t('organization') || 'Organization', icon: faBuilding, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'Manage branches, departments, and company settings' },
    { id: 'attendance', label: t('attendanceRules') || 'Attendance Rules', icon: faClock, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'Configure attendance policies and shift timings' },
    { id: 'analytics', label: t('analyticsConfig') || 'Analytics Config', icon: faChartLine, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'Configure analytics dashboard settings' },
    { id: 'inventory', label: t('inventoryConfig') || 'Inventory Config', icon: faBoxes, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'Configure inventory management settings' },
    { id: 'support', label: t('supportConfig') || 'Support Config', icon: faHeadset, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'Configure support ticket system' },
    { id: 'notifications', label: t('notifications') || 'Notifications', icon: faBell, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'Configure email and in-app notifications' },
    { id: 'security', label: t('security') || 'Security', icon: faShieldAlt, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'Configure security policies and 2FA' },
    { id: 'data', label: t('dataManagement') || 'Data Management', icon: faDatabase, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'Export, purge, and manage database records' },
    { id: 'ui', label: t('uiPreferences') || 'UI Preferences', icon: faPalette, roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SERVICE_PROVIDER], description: 'Customize theme, layout, and language' },
    { id: 'admin', label: t('adminControls') || 'Admin Controls', icon: faCrown, roles: [ROLES.SUPERADMIN], description: 'Maintenance mode, cache, system info' },
    { id: 'team', label: t('teamManagement') || 'Team Management', icon: faUsers, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'Manage team members for About Us page' },
    { id: 'audit', label: t('auditLogs') || 'Audit Logs', icon: faHistory, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'View system audit logs' },
  ];

  // Filter tabs based on user role
  const visibleTabs = allTabs.filter(
    (tab) => userRole !== null && tab.roles.includes(userRole as any)
  );

  // Set active tab from URL query or first visible tab
  useEffect(() => {
    if (!userRole || visibleTabs.length === 0) return;

    let target = activeTab;

    if (typeof tab === 'string' && visibleTabs.some(t => t.id === tab)) {
      target = tab;
    }

    if (!visibleTabs.some(t => t.id === target)) {
      target = visibleTabs[0].id;
    }

    setActiveTab(target);
  }, [userRole, tab, visibleTabs, activeTab]);

  const renderTab = () => {
    switch (activeTab) {
      case 'account': return <AccountSettings />;
      case 'roles': return <RolesPermissions />;
      case 'organization': return <OrganizationSettings />;
      case 'attendance': return <AttendanceRules />;
      case 'analytics': return <AnalyticsConfigSettings />;
      case 'inventory': return <InventoryConfigSettings />;
      case 'support': return <SupportConfigSettings />;
      case 'notifications': return <NotificationsConfigSettings />;
      case 'security': return <SecurityConfigSettings />;
      case 'data': return <DataManagementSettings />;
      case 'ui': return <UIPreferencesSettings />;
      case 'admin': return <AdminControlsSettings />;
      case 'team': return <TeamManagementSettings />;
      case 'audit': return <AuditLogs />;
      default:
        return (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            background: 'white',
            borderRadius: '12px',
            boxShadow: COLORS.shadow,
          }}>
            <FontAwesomeIcon icon={faSlidersH} size="3x" style={{ color: COLORS.textMuted, marginBottom: '1rem' }} />
            <h3 style={{ color: COLORS.textSecondary }}>{t('comingSoon') || 'Coming soon...'}</h3>
            <p style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>
              {t('settingsComingSoon') || 'This settings section is under development'}
            </p>
          </div>
        );
    }
  };

  if (userRole === null) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `${COLORS.primary}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FontAwesomeIcon icon={faSlidersH} style={{ color: COLORS.primary, fontSize: '1.5rem' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
                {t('settings') || 'Settings'}
              </h1>
              <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0.15rem 0 0 0' }}>
                {t('manageSystemPreferences') || 'Manage your system preferences, user roles, and application settings.'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          flexWrap: 'wrap', 
          marginBottom: '2rem',
          padding: '0.5rem',
          background: COLORS.bgGray,
          borderRadius: '12px',
          border: `1px solid ${COLORS.border}`,
        }}>
          {visibleTabs.map((tabItem) => (
            <TabButton
              key={tabItem.id}
              tab={tabItem}
              active={activeTab === tabItem.id}
              onClick={() => setActiveTab(tabItem.id)}
              description={tabItem.description}
            />
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ marginTop: '1rem' }}>
          {renderTab()}
        </div>

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