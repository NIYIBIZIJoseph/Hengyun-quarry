import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faExclamationTriangle, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== CLEAN DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",      // Your brand gold
  danger: "#ef4444",       // Only for negative
  warning: "#f59e0b",      // Gold for warnings too
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

export default function InventoryKPIs() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ totalProducts: 0, lowStock: 0, outOfStock: 0 });

  useEffect(() => {
    fetch('/api/products', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(products => {
        const total = products.length;
        const low = products.filter((p: any) => p.stock_quantity <= (p.reorder_level || 5) && p.stock_quantity > 0).length;
        const out = products.filter((p: any) => p.stock_quantity === 0).length;
        setStats({ totalProducts: total, lowStock: low, outOfStock: out });
      })
      .catch(console.error);
  }, []);

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
      gap: '1rem' 
    }}>
      <KpiCard
        label={t('totalProducts') || "Total Products"}
        value={stats.totalProducts}
        icon={faBox}
        color={COLORS.primary}
      />
      <KpiCard
        label={t('lowStock') || "Low Stock"}
        value={stats.lowStock}
        sub={t('reorderSoon') || "reorder soon"}
        icon={faExclamationTriangle}
        color={COLORS.primary}
        trend={5}
      />
      <KpiCard
        label={t('outOfStock') || "Out of Stock"}
        value={stats.outOfStock}
        sub={t('urgent') || "urgent"}
        icon={faBoxOpen}
        color={COLORS.danger}
        trend={2}
      />
    </div>
  );
}