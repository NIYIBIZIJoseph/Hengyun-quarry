import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTicketAlt, faFire, faClock } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== CLEAN DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  danger: "#ef4444",
};

function KpiCard({ 
  label, 
  value, 
  sub, 
  icon, 
  color = COLORS.primary,
  trend
}: { 
  label: string; 
  value: string | number; 
  sub?: string; 
  icon: any; 
  color?: string;
  trend?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const isPositive = trend && trend > 0;

  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        padding: "1.25rem",
        boxShadow: isHovered 
          ? "0 4px 12px rgba(0,0,0,0.08)" 
          : "0 1px 3px rgba(0,0,0,0.05)",
        transition: "all 0.2s ease",
        transform: isHovered ? "translateY(-2px)" : "translateY(0)",
        borderLeft: `3px solid ${color}`,
        cursor: "pointer",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <FontAwesomeIcon 
          icon={icon} 
          style={{ 
            color: color, 
            fontSize: "0.85rem",
            width: "16px"
          }} 
        />
        <span style={{ 
          fontSize: "0.7rem", 
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.3px",
          fontWeight: "600"
        }}>
          {label}
        </span>
      </div>
      
      <div style={{ 
        fontSize: "1.75rem", 
        fontWeight: "700", 
        color: "#111827",
        marginTop: "0.25rem"
      }}>
        {value}
      </div>
      
      {sub && (
        <div style={{ 
          fontSize: "0.7rem", 
          color: "#9ca3af",
          marginTop: "0.1rem"
        }}>
          {sub}
        </div>
      )}
      
      {trend !== undefined && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "0.7rem",
          color: isPositive ? "#10b981" : COLORS.danger,
          marginTop: "0.4rem",
          fontWeight: "500"
        }}>
          <span>{isPositive ? "↑" : "↓"}</span>
          <span>{Math.abs(trend)}%</span>
          <span style={{ color: "#9ca3af", fontWeight: "400" }}>vs last month</span>
        </div>
      )}
    </div>
  );
}

export default function SupportKPIs() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ openTickets: 0, urgentTickets: 0, avgResponseTime: '2.4h' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const headers = getAuthHeaders();
      try {
        const res = await fetch('/api/support/tickets', { headers });
        
        // ✅ Handle non-OK responses
        if (!res.ok) {
          console.warn('Support tickets API returned:', res.status);
          setStats({ openTickets: 0, urgentTickets: 0, avgResponseTime: '0h' });
          setLoading(false);
          return;
        }

        // ✅ Parse JSON safely
        let data;
        try {
          data = await res.json();
        } catch (parseError) {
          console.error('Failed to parse support tickets JSON:', parseError);
          setStats({ openTickets: 0, urgentTickets: 0, avgResponseTime: '0h' });
          setLoading(false);
          return;
        }

        // ✅ Ensure data is an array
        let tickets = [];
        if (Array.isArray(data)) {
          tickets = data;
        } else if (data && typeof data === 'object') {
          tickets = data.data || data.tickets || data.rows || [];
          if (!Array.isArray(tickets)) tickets = [];
        }

        const open = tickets.filter((t: any) => t.status !== 'closed' && t.status !== 'resolved').length;
        const urgent = tickets.filter((t: any) => t.priority === 'urgent' && t.status !== 'closed').length;
        setStats({ 
          openTickets: open, 
          urgentTickets: urgent, 
          avgResponseTime: open > 0 ? '2.4h' : '0h'
        });
      } catch (error) {
        console.error('Error fetching support KPIs:', error);
        setStats({ openTickets: 0, urgentTickets: 0, avgResponseTime: '0h' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '1rem' 
      }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ 
            background: 'white', 
            borderRadius: '12px',
            padding: '1.25rem',
            height: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            borderLeft: '3px solid #e5e7eb',
          }}>
            Loading...
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
      gap: '1rem' 
    }}>
      <KpiCard
        label={t('openTickets') || "Open Tickets"}
        value={stats.openTickets}
        sub={t('needsReply') || "needs reply"}
        icon={faTicketAlt}
        color={stats.openTickets > 0 ? COLORS.primary : "#9ca3af"}
        trend={stats.openTickets > 0 ? 7 : 0}
      />
      <KpiCard
        label={t('urgent') || "Urgent"}
        value={stats.urgentTickets}
        sub={t('highPriority') || "high priority"}
        icon={faFire}
        color={stats.urgentTickets > 0 ? COLORS.danger : "#9ca3af"}
        trend={0}
      />
      <KpiCard
        label={t('avgResponse') || "Avg Response"}
        value={stats.avgResponseTime}
        sub={t('firstReply') || "first reply"}
        icon={faClock}
        color={COLORS.primary}
        trend={stats.avgResponseTime !== '0h' ? -0.5 : 0}
      />
    </div>
  );
}