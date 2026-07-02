import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserClock, 
  faSpinner, 
  faEye, 
  faCheckCircle, 
  faUserPlus,
  faArrowRight 
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  success: "#10b981",
  danger: "#ef4444",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.05)",
  shadowHover: "0 4px 12px rgba(0,0,0,0.08)",
};

// ========== PENDING ITEM COMPONENT ==========
function PendingItem({ worker, index, total }: { worker: any; index: number; total: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

  return (
    <Link
      href={`/dashboard/workers/${worker.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        textDecoration: 'none',
        padding: '0.6rem 0.75rem',
        borderRadius: '8px',
        backgroundColor: isHovered ? '#f9fafb' : 'transparent',
        transition: 'all 0.2s ease',
        borderBottom: index < total - 1 ? `1px solid ${COLORS.border}` : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: `${COLORS.primary}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: COLORS.primary,
        }}>
          <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: '0.7rem' }} />
        </div>
        <div>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: '500',
            color: COLORS.textPrimary,
          }}>
            {worker.name}
          </span>
          <div style={{
            fontSize: '0.65rem',
            color: COLORS.textMuted,
          }}>
            {worker.role || t('worker') || 'Worker'}
          </div>
        </div>
      </div>
      <span style={{
        fontSize: '0.6rem',
        padding: '0.15rem 0.5rem',
        borderRadius: '12px',
        background: `${COLORS.primary}20`,
        color: COLORS.primary,
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
      }}>
        <FontAwesomeIcon icon={faEye} style={{ fontSize: '0.5rem' }} />
        {t('pendingActivation') || 'Pending'}
      </span>
    </Link>
  );
}

export default function PendingApprovals() {
  const { t } = useTranslation();
  const [pendingWorkers, setPendingWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/workers', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(workers => {
        setPendingWorkers(workers.filter((w: any) => !w.is_active));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.25rem',
        boxShadow: COLORS.shadow,
        marginBottom: '1.5rem',
        textAlign: 'center',
        color: COLORS.textMuted,
        fontSize: '0.85rem',
      }}>
        <FontAwesomeIcon icon={faSpinner} spin /> {t('loading') || 'Loading...'}
      </div>
    );
  }

  if (pendingWorkers.length === 0) return null;

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.25rem',
      boxShadow: COLORS.shadow,
      marginBottom: '1.5rem',
      transition: 'all 0.2s ease',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem',
      }}>
        <h3 style={{
          fontSize: '0.85rem',
          fontWeight: '600',
          color: COLORS.textPrimary,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <FontAwesomeIcon icon={faUserClock} style={{ color: COLORS.primary }} />
          {t('pendingApprovals') || 'Pending Approvals'}
          <span style={{
            fontSize: '0.6rem',
            padding: '0.1rem 0.5rem',
            borderRadius: '10px',
            background: COLORS.primary,
            color: 'white',
            fontWeight: '500',
          }}>
            {pendingWorkers.length}
          </span>
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
        {pendingWorkers.slice(0, 5).map((w, idx) => (
          <PendingItem key={w.id} worker={w} index={idx} total={Math.min(pendingWorkers.length, 5)} />
        ))}
      </div>

      {pendingWorkers.length > 5 && (
        <Link
          href="/dashboard/workers?pending=true"
          style={{
            fontSize: '0.7rem',
            color: COLORS.primary,
            marginTop: '0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            textDecoration: 'none',
            fontWeight: '500',
          }}
        >
          <FontAwesomeIcon icon={faCheckCircle} />
          {t('viewAllPending') || 'View all pending'} ({pendingWorkers.length - 5} more)
          <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '0.6rem' }} />
        </Link>
      )}
    </div>
  );
}