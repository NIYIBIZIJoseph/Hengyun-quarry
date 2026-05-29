import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { getUserRoleFromToken } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faKey, faBuilding, faClock, faChartLine, faBoxes,
  faHeadset, faBell, faShieldAlt, faDatabase, faPalette, faCrown,
  faUsers, faHistory
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

  const tabs = [
    { id: 'account', label: t('account') || 'Account', icon: faUser, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
    { id: 'roles', label: t('rolesPermissions') || 'Roles & Permissions', icon: faKey, roles: [ROLES.SUPERADMIN] },
    { id: 'organization', label: t('organization') || 'Organization', icon: faBuilding, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
    { id: 'attendance', label: t('attendanceRules') || 'Attendance Rules', icon: faClock, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
    { id: 'analytics', label: t('analyticsConfig') || 'Analytics', icon: faChartLine, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
    { id: 'inventory', label: t('inventoryConfig') || 'Inventory', icon: faBoxes, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
    { id: 'support', label: t('supportConfig') || 'Support', icon: faHeadset, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
    { id: 'notifications', label: t('notifications') || 'Notifications', icon: faBell, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
    { id: 'security', label: t('security') || 'Security', icon: faShieldAlt, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
    { id: 'data', label: t('dataManagement') || 'Data', icon: faDatabase, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
    { id: 'ui', label: t('uiPreferences') || 'UI', icon: faPalette, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
    { id: 'admin', label: t('adminControls') || 'Admin', icon: faCrown, roles: [ROLES.SUPERADMIN] },
    { id: 'team', label: t('teamManagement') || 'Team', icon: faUsers, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
    { id: 'audit', label: t('auditLogs') || 'Audit', icon: faHistory, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
  ];

  const visibleTabs = tabs.filter(
    (t) => userRole !== null && t.roles.includes(userRole as any)
  );

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
        return <div>Coming soon</div>;
    }
  };

  if (userRole === null) {
    return <DashboardLayout>Loading...</DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <h1>{t('settings') || 'Settings'}</h1>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {visibleTabs.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setActiveTab(tabItem.id)}
            style={{
              borderBottom: activeTab === tabItem.id ? '2px solid #f59e0b' : 'none',
              fontWeight: activeTab === tabItem.id ? 'bold' : 'normal',
            }}
          >
            <FontAwesomeIcon icon={tabItem.icon} /> {tabItem.label}
          </button>
        ))}
      </div>

      {renderTab()}
    </DashboardLayout>
  );
}