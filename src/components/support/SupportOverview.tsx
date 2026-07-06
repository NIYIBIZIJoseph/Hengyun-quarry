// src/components/support/SupportOverview.tsx
import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTicketAlt, 
  faEnvelope, 
  faUsers, 
  faChartLine, 
  faClock, 
  faCheckCircle, 
  faExclamationTriangle,
  faLifeRing,
  faUserCheck,
  faUserTimes
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'next/router';

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  bgWhite: "#ffffff",
  bgGray: "#f9fafb",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowHover: "0 8px 25px rgba(0,0,0,0.08)",
};

// ========== KPI CARD ==========
function KpiCard({ 
  label, 
  value, 
  icon, 
  color = COLORS.primary,
  subtext
}: { 
  label: string; 
  value: string | number; 
  icon: any; 
  color?: string;
  subtext?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        background: 'white',
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        boxShadow: isHovered ? COLORS.shadowHover : COLORS.shadow,
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        borderLeft: `3px solid ${color}`,
        cursor: 'default',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FontAwesomeIcon icon={icon} style={{ color, fontSize: '0.8rem' }} />
        <span style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, marginTop: '0.25rem' }}>
        {value}
      </div>
      {subtext && (
        <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginTop: '0.1rem' }}>
          {subtext}
        </div>
      )}
    </div>
  );
}

// ========== QUICK ACTION CARD ==========
function QuickActionCard({ 
  title, 
  icon, 
  color, 
  href, 
  onClick 
}: { 
  title: string; 
  icon: any; 
  color: string; 
  href?: string; 
  onClick?: () => void; 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: isHovered ? COLORS.shadowHover : COLORS.shadow,
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        border: `1px solid ${COLORS.border}`,
        cursor: 'pointer',
        textAlign: 'center',
        textDecoration: 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 0.75rem',
      }}>
        <FontAwesomeIcon icon={icon} style={{ color, fontSize: '1.25rem' }} />
      </div>
      <div style={{ fontSize: '0.85rem', fontWeight: '500', color: COLORS.textPrimary }}>
        {title}
      </div>
      <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>
        {isHovered ? t('clickToOpen') || 'Click to open →' : ''}
      </div>
    </div>
  );
}

export default function SupportOverview() {
  const { t } = useTranslation();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    pendingTickets: 0,
    resolvedTickets: 0,
    urgentIssues: 0,
    unreadMessages: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const headers = getAuthHeaders();
      try {
        const ticketsRes = await fetch('/api/support/tickets', { headers });
        const tickets = await ticketsRes.json();
        const open = tickets.filter((t: any) => t.status === 'open').length;
        const pending = tickets.filter((t: any) => t.status === 'in_progress').length;
        const resolved = tickets.filter((t: any) => t.status === 'resolved').length;
        const urgent = tickets.filter((t: any) => t.priority === 'urgent' && t.status !== 'closed').length;
        
        const messagesRes = await fetch('/api/contact-messages', { headers });
        const messages = await messagesRes.json();
        const unread = messages.filter((m: any) => !m.is_read).length;
        
        setStats({ 
          totalTickets: tickets.length, 
          openTickets: open, 
          pendingTickets: pending, 
          resolvedTickets: resolved, 
          urgentIssues: urgent, 
          unreadMessages: unread 
        });
      } catch (error) {
        console.error('Error fetching support stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <KpiCard
          label={t('totalTickets') || 'Total Tickets'}
          value={stats.totalTickets}
          icon={faTicketAlt}
          color={COLORS.primary}
        />
        <KpiCard
          label={t('open') || 'Open'}
          value={stats.openTickets}
          icon={faClock}
          color={stats.openTickets > 0 ? COLORS.warning : COLORS.success}
          subtext={stats.openTickets > 0 ? t('needsAttention') || 'Needs attention' : ''}
        />
        <KpiCard
          label={t('inProgress') || 'In Progress'}
          value={stats.pendingTickets}
          icon={faUserCheck}
          color={COLORS.info}
        />
        <KpiCard
          label={t('resolved') || 'Resolved'}
          value={stats.resolvedTickets}
          icon={faCheckCircle}
          color={COLORS.success}
        />
        <KpiCard
          label={t('urgent') || 'Urgent'}
          value={stats.urgentIssues}
          icon={faExclamationTriangle}
          color={stats.urgentIssues > 0 ? COLORS.danger : COLORS.success}
          subtext={stats.urgentIssues > 0 ? t('urgentAttention') || 'Urgent attention needed' : ''}
        />
        <KpiCard
          label={t('unreadMessages') || 'Unread Messages'}
          value={stats.unreadMessages}
          icon={faEnvelope}
          color={stats.unreadMessages > 0 ? COLORS.primary : COLORS.textMuted}
          subtext={stats.unreadMessages > 0 ? t('awaitingReview') || 'Awaiting review' : ''}
        />
      </div>

      {/* Quick Action Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem'
      }}>
        <QuickActionCard
          title={t('createNewTicket') || 'Create New Ticket'}
          icon={faTicketAlt}
          color={COLORS.primary}
          onClick={() => router.push('/dashboard/support/new')}
        />
        <QuickActionCard
          title={t('viewAllTickets') || 'View All Tickets'}
          icon={faLifeRing}
          color={COLORS.info}
          onClick={() => router.push('/dashboard/support?tab=tickets')}
        />
        <QuickActionCard
          title={t('manageFaqs') || 'Manage FAQs'}
          icon={faUsers}
          color={COLORS.success}
          onClick={() => router.push('/dashboard/support?tab=faq')}
        />
      </div>
    </div>
  );
}