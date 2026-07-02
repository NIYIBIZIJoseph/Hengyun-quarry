import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTicketAlt, faFire, faHourglassHalf, faSpinner, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  success: "#10b981",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const priorityColors: Record<string, string> = {
  urgent: COLORS.danger,
  high: COLORS.primary,
  medium: COLORS.info,
  low: COLORS.success,
};

const priorityIcons: Record<string, any> = {
  urgent: faFire,
  high: faFire,
  medium: faHourglassHalf,
  low: faHourglassHalf,
};

// ========== TICKET ITEM COMPONENT ==========
function TicketItem({ ticket }: { ticket: any }) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

  const getPriorityText = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'Urgent';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return priority || 'Normal';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Progress';
      case 'pending': return 'Pending';
      default: return status || 'Unknown';
    }
  };

  const priorityColor = priorityColors[ticket.priority?.toLowerCase()] || COLORS.textMuted;
  const PriorityIcon = priorityIcons[ticket.priority?.toLowerCase()] || faTicketAlt;

  return (
    <Link
      href={`/dashboard/support/${ticket.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        textDecoration: 'none',
        padding: '0.6rem 0.75rem',
        borderRadius: '8px',
        backgroundColor: isHovered ? '#f9fafb' : 'transparent',
        transition: 'all 0.2s ease',
        borderBottom: `1px solid ${COLORS.border}`,
        display: 'block',
        borderLeft: `2px solid ${isHovered ? priorityColor : 'transparent'}`,
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '600',
            color: COLORS.textPrimary,
          }}>
            {ticket.subject}
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
        }}>
          <FontAwesomeIcon 
            icon={PriorityIcon} 
            style={{ 
              color: priorityColor, 
              fontSize: '0.6rem',
            }} 
          />
          <span style={{
            fontSize: '0.6rem',
            color: priorityColor,
            fontWeight: '500',
          }}>
            {getPriorityText(ticket.priority)}
          </span>
        </div>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '0.25rem',
      }}>
        <span style={{
          fontSize: '0.6rem',
          color: COLORS.textMuted,
        }}>
          {t('status') || 'Status'}: {getStatusText(ticket.status)}
          {ticket.created_at && ` • ${new Date(ticket.created_at).toLocaleDateString()}`}
        </span>
        <FontAwesomeIcon 
          icon={faArrowRight} 
          style={{ 
            color: COLORS.textMuted, 
            fontSize: '0.6rem',
            opacity: isHovered ? 1 : 0.3,
            transition: 'all 0.2s ease',
          }} 
        />
      </div>
    </Link>
  );
}

export default function SupportQueue() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/support/tickets', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        const open = Array.isArray(data) ? data.filter((t: any) => t.status !== 'closed' && t.status !== 'resolved') : [];
        setTickets(open.slice(0, 5));
        setLoading(false);
      })
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
        <FontAwesomeIcon icon={faTicketAlt} style={{ color: COLORS.primary }} />
        <h3 style={{
          fontSize: '0.85rem',
          fontWeight: '600',
          color: COLORS.textPrimary,
          margin: 0,
        }}>
          {t('supportQueue') || 'Support Queue'}
        </h3>
        {tickets.length > 0 && (
          <span style={{
            marginLeft: 'auto',
            fontSize: '0.6rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '10px',
            background: COLORS.primary + '20',
            color: COLORS.primary,
            fontWeight: '500',
          }}>
            {tickets.length} {t('open') || 'open'}
          </span>
        )}
      </div>

      {tickets.length === 0 ? (
        <p style={{
          color: COLORS.textMuted,
          textAlign: 'center',
          padding: '1.5rem',
          fontSize: '0.85rem',
        }}>
          {t('noOpenTickets') || 'No open tickets'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {tickets.map((ticket, idx) => (
            <TicketItem key={idx} ticket={ticket} />
          ))}
        </div>
      )}

      {tickets.length > 0 && (
        <Link
          href="/dashboard/support"
          style={{
            fontSize: '0.7rem',
            color: COLORS.primary,
            marginTop: '0.75rem',
            display: 'inline-block',
            textDecoration: 'none',
            fontWeight: '500',
          }}
        >
          {t('viewAllTickets') || 'View all tickets'} →
        </Link>
      )}
    </div>
  );
}