import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faCheckCircle, faTimesCircle, faExclamationTriangle, faUmbrellaBeach } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== CLEAN DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  success: "#10b981",
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
  const [stats, setStats] = useState({ 
    activeWorkers: 0, 
    presentToday: 0, 
    absentToday: 0, 
    lateToday: 0, 
    onLeave: 0 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const headers = getAuthHeaders();
      try {
        // ✅ Fetch workers with safe handling
        const workersRes = await fetch('/api/workers', { headers });
        
        let active = 0;
        if (workersRes.ok) {
          let workersData;
          try {
            workersData = await workersRes.json();
          } catch (parseError) {
            console.error('Failed to parse workers JSON:', parseError);
            workersData = [];
          }
          
          // ✅ Ensure workers is an array
          let workers = [];
          if (Array.isArray(workersData)) {
            workers = workersData;
          } else if (workersData && typeof workersData === 'object') {
            workers = workersData.data || workersData.workers || workersData.rows || [];
            if (!Array.isArray(workers)) workers = [];
          }
          
          active = workers.filter((w: any) => 
            w.is_active === true || 
            w.status === 'active' || 
            w.status === 'Active'
          ).length;
        }

        // ✅ Fetch attendance with safe handling
        let presentToday = 0;
        let absentToday = 0;
        let lateToday = 0;
        let onLeave = 0;
        
        try {
          const attendanceRes = await fetch('/api/attendance/weekly', { headers });
          if (attendanceRes.ok) {
            const attendanceData = await attendanceRes.json();
            const summary = attendanceData?.summary || {};
            presentToday = summary.presentToday || summary.present || 0;
            absentToday = summary.absentToday || summary.absent || 0;
            lateToday = summary.lateToday || summary.late || 0;
            onLeave = summary.onLeaveToday || summary.on_leave || 0;
          }
        } catch (attendanceError) {
          console.warn('Failed to fetch attendance:', attendanceError);
        }

        setStats({ 
          activeWorkers: active, 
          presentToday, 
          absentToday, 
          lateToday, 
          onLeave 
        });
      } catch (error) {
        console.error('Error fetching workforce KPIs:', error);
        setStats({ 
          activeWorkers: 0, 
          presentToday: 0, 
          absentToday: 0, 
          lateToday: 0, 
          onLeave: 0 
        });
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
        gap: '1rem' 
      }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ 
            background: 'white', 
            borderRadius: '12px',
            padding: '1.25rem',
            height: '110px',
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
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
      gap: '1rem' 
    }}>
      <KpiCard
        label={t('activeWorkers') || "Active Workers"}
        value={stats.activeWorkers}
        icon={faUsers}
        color={stats.activeWorkers > 0 ? COLORS.primary : "#9ca3af"}
        trend={stats.activeWorkers > 0 ? 3 : 0}
      />
      <KpiCard
        label={t('presentToday') || "Present Today"}
        value={stats.presentToday}
        sub={t('onSite') || "on site"}
        icon={faCheckCircle}
        color={stats.presentToday > 0 ? COLORS.success : "#9ca3af"}
        trend={stats.presentToday > 0 ? 13 : 0}
      />
      <KpiCard
        label={t('absent') || "Absent"}
        value={stats.absentToday}
        sub={t('unexcused') || "unexcused"}
        icon={faTimesCircle}
        color={stats.absentToday > 0 ? COLORS.danger : "#9ca3af"}
        trend={stats.absentToday > 0 ? -5 : 0}
      />
      <KpiCard
        label={t('late') || "Late"}
        value={stats.lateToday}
        sub={t('arrivedLate') || "arrived late"}
        icon={faExclamationTriangle}
        color={stats.lateToday > 0 ? COLORS.primary : "#9ca3af"}
        trend={stats.lateToday > 0 ? -2 : 0}
      />
      <KpiCard
        label={t('onLeave') || "On Leave"}
        value={stats.onLeave}
        sub={t('approved') || "approved"}
        icon={faUmbrellaBeach}
        color={stats.onLeave > 0 ? COLORS.primary : "#9ca3af"}
        trend={0}
      />
    </div>
  );
}