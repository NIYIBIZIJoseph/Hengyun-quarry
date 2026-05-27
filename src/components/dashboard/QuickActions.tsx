import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  faPlus,
  faShoppingCart,
  faUserPlus,
  faCalendarCheck,
  faTicketAlt,
} from '@fortawesome/free-solid-svg-icons';

import { getUserRoleFromToken } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';
import { ROLES, Role } from '@/lib/roles';

export default function QuickActions() {
  const router = useRouter();
  const { t } = useTranslation();

  // ✅ FIX: use Role type, not number
  const [userRole, setUserRole] = useState<Role | null>(null);

  useEffect(() => {
    const role = getUserRoleFromToken();

    if (role) {
      setUserRole(role); // ✅ NO conversion
    }
  }, []);

  const actions: {
    label: string;
    icon: any;
    path: string;
    roles: Role[];
  }[] = [
    {
      label: t('addProduct'),
      icon: faPlus,
      path: '/dashboard/products/new',
      roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
    },
    {
      label: t('createOrder'),
      icon: faShoppingCart,
      path: '/dashboard/orders/new',
      roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
    },
    {
      label: t('addWorker'),
      icon: faUserPlus,
      path: '/dashboard/workers/new',
      roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
    },
    {
      label: t('markAttendance'),
      icon: faCalendarCheck,
      path: '/dashboard/attendance/mark',
      roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
    },
    {
      label: t('openTicket'),
      icon: faTicketAlt,
      path: '/dashboard/support/new',
      roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
    },
  ];

  // ✅ clean filtering
  const visibleActions = actions.filter(
    (action) => userRole && action.roles.includes(userRole)
  );

  if (!visibleActions.length) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>{t('quickActions')}</h2>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {visibleActions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => router.push(action.path)}
            style={{
              background: '#f59e0b',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500',
              color: '#1f2937',
            }}
          >
            <FontAwesomeIcon icon={action.icon} />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}