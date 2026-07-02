import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faCheckCircle, faTimesCircle, faExclamationTriangle, faUmbrellaBeach } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== CLEAN DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",      // Your brand gold - use this for everything
  success: "#10b981",      // Only for positive (present)
  danger: "#ef4444",       // Only for negative (absent)
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
          color: isPositive ? COLORS.success : COLORS.danger,
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

export default function WorkforceKPIs() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ activeWorkers: 0, presentToday: 0, absentToday: 0, lateToday: 0, onLeave: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const headers = getAuthHeaders();
      const workersRes = await fetch('/api/workers', { headers });
      const workers = await workersRes.json();
      const active = workers.filter((w: any) => w.is_active).length;
      const attendanceRes = await fetch('/api/attendance/weekly', { headers });
      const attendanceData = await attendanceRes.json();
      const summary = attendanceData.summary || {};
      setStats({ 
        activeWorkers: active, 
        presentToday: summary.presentToday || 0, 
        absentToday: summary.absentToday || 0, 
        lateToday: summary.lateToday || 0, 
        onLeave: summary.onLeaveToday || 0 
      });
    };
    fetchData();
  }, []);

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
      gap: '1rem' 
    }}>
      <KpiCard
        label={t('activeWorkers') || "Active Workers"}
        value={stats.activeWorkers}
        icon={faUsers}
        color={COLORS.primary}
      />
      <KpiCard
        label={t('presentToday') || "Present Today"}
        value={stats.presentToday}
        sub={t('onSite') || "on site"}
        icon={faCheckCircle}
        color={COLORS.success}
        trend={3}
      />
      <KpiCard
        label={t('absent') || "Absent"}
        value={stats.absentToday}
        sub={t('unexcused') || "unexcused"}
        icon={faTimesCircle}
        color={COLORS.danger}
        trend={-5}
      />
      <KpiCard
        label={t('late') || "Late"}
        value={stats.lateToday}
        sub={t('arrivedLate') || "arrived late"}
        icon={faExclamationTriangle}
        color={COLORS.primary}
        trend={-2}
      />
      <KpiCard
        label={t('onLeave') || "On Leave"}
        value={stats.onLeave}
        sub={t('approved') || "approved"}
        icon={faUmbrellaBeach}
        color={COLORS.primary}
      />
    </div>
  );
}