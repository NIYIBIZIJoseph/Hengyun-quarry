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

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  textPrimary: "#111827",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.05)",
  shadowHover: "0 4px 12px rgba(0,0,0,0.08)",
};

const actionColors = {
  addProduct: "#3b82f6",
  createOrder: "#10b981",
  addWorker: "#f59e0b",
  markAttendance: "#8b5cf6",
  openTicket: "#ef4444",
};

// ========== ACTION BUTTON COMPONENT ==========
function ActionButton({ action, onClick }: { action: any; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered ? action.color : 'white',
        border: `1px solid ${isHovered ? action.color : COLORS.border}`,
        padding: '0.75rem 1rem',
        borderRadius: '10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontWeight: '500',
        fontSize: '0.8rem',
        color: isHovered ? 'white' : COLORS.textPrimary,
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? COLORS.shadowHover : COLORS.shadow,
        width: '100%',
      }}
    >
      <FontAwesomeIcon
        icon={action.icon}
        style={{
          fontSize: '0.9rem',
          color: isHovered ? 'white' : action.color,
        }}
      />
      {action.label}
    </button>
  );
}

export default function QuickActions() {
  const router = useRouter();
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState<Role | null>(null);

  useEffect(() => {
    const role = getUserRoleFromToken();
    if (role) {
      setUserRole(role);
    }
  }, []);

  // ✅ UPDATED: Point to existing listing pages (where users can click "Add")
  const actions: {
    label: string;
    icon: any;
    path: string;
    roles: Role[];
    color: string;
  }[] = [
    {
      label: t('addProduct') || 'Add Product',
      icon: faPlus,
      path: '/dashboard/products',          // existing page
      roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
      color: actionColors.addProduct,
    },
    {
      label: t('createOrder') || 'Create Order',
      icon: faShoppingCart,
      path: '/dashboard/orders',            // existing page
      roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
      color: actionColors.createOrder,
    },
    {
      label: t('addWorker') || 'Add Worker',
      icon: faUserPlus,
      path: '/dashboard/workers',           // existing page
      roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
      color: actionColors.addWorker,
    },
    {
      label: t('markAttendance') || 'Mark Attendance',
      icon: faCalendarCheck,
      path: '/dashboard/attendance/weekly',        // existing page
      roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
      color: actionColors.markAttendance,
    },
    {
      label: t('openTicket') || 'Open Ticket',
      icon: faTicketAlt,
      path: '/dashboard/support',           // existing page
      roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
      color: actionColors.openTicket,
    },
  ];

  const visibleActions = actions.filter(
    (action) => userRole && action.roles.includes(userRole)
  );

  if (!visibleActions.length) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{
        fontSize: '0.85rem',
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: '0.75rem',
      }}>
        {t('quickActions') || 'Quick Actions'}
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.75rem',
      }}>
        {visibleActions.map((action, idx) => (
          <ActionButton
            key={idx}
            action={action}
            onClick={() => router.push(action.path)}
          />
        ))}
      </div>
    </div>
  );
}