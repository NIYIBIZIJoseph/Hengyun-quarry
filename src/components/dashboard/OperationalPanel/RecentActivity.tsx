import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner, 
  faClock, 
  faUser, 
  faEdit, 
  faTrash, 
  faPlus,
  faCircle
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  success: "#10b981",
  danger: "#ef4444",
  info: "#3b82f6",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.05)",
};

// ========== ACTIVITY ITEM COMPONENT ==========
function ActivityItem({ activity }: { activity: any }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const getActionIcon = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'CREATE': 
        return { icon: faPlus, color: COLORS.success };
      case 'UPDATE': 
        return { icon: faEdit, color: COLORS.info };
      case 'DELETE': 
        return { icon: faTrash, color: COLORS.danger };
      default: 
        return { icon: faUser, color: COLORS.textMuted };
    }
  };

  const getActionText = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'CREATE': return 'Created';
      case 'UPDATE': return 'Updated';
      case 'DELETE': return 'Deleted';
      default: return action || 'Action';
    }
  };

  const actionInfo = getActionIcon(activity.action);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.6rem 0.75rem',
        borderRadius: '8px',
        backgroundColor: isHovered ? '#f9fafb' : 'transparent',
        transition: 'all 0.2s ease',
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
        <FontAwesomeIcon 
          icon={actionInfo.icon} 
          style={{ color: actionInfo.color, fontSize: '0.8rem', width: '16px' }} 
        />
        <div>
          <span style={{ fontSize: '0.8rem', color: COLORS.textPrimary }}>
            <strong>{getActionText(activity.action)}</strong>
            <span style={{ color: COLORS.textMuted }}> – </span>
            <span>{activity.target_type || 'Unknown'}</span>
          </span>
          <div style={{ fontSize: '0.65rem', color: COLORS.textMuted, marginTop: '0.1rem' }}>
            {activity.created_at ? new Date(activity.created_at).toLocaleString() : 'Unknown'}
          </div>
        </div>
      </div>
      <FontAwesomeIcon 
        icon={faCircle} 
        style={{ 
          color: actionInfo.color, 
          fontSize: '0.4rem',
          opacity: 0.5,
        }} 
      />
    </div>
  );
}

export default function RecentActivity() {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/activity', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => { setActivities(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{
        background: 'white',
        padding: '1.25rem',
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: COLORS.shadow,
        color: COLORS.textMuted,
        fontSize: '0.85rem',
      }}>
        <FontAwesomeIcon icon={faSpinner} spin /> {t('loading') || 'Loading...'}
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.25rem',
      boxShadow: COLORS.shadow,
      transition: 'all 0.2s ease',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.75rem',
      }}>
        <FontAwesomeIcon icon={faClock} style={{ color: COLORS.primary }} />
        <h3 style={{
          fontSize: '0.85rem',
          fontWeight: '600',
          color: COLORS.textPrimary,
          margin: 0,
        }}>
          {t('recentActivity') || 'Recent Activity'}
        </h3>
      </div>

      {activities.length === 0 ? (
        <p style={{
          color: COLORS.textMuted,
          textAlign: 'center',
          padding: '1.5rem',
          fontSize: '0.85rem',
        }}>
          {t('noRecentActivity') || 'No recent activity'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {activities.slice(0, 5).map((act, idx) => (
            <ActivityItem key={idx} activity={act} />
          ))}
        </div>
      )}
    </div>
  );
}