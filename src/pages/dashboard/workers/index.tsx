import Link from 'next/link';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faSearch, faUsers, faArrowRight, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== CLEAN DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  success: "#10b981",
  info: "#3b82f6",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  bgGray: "#f9fafb",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowHover: "0 8px 25px rgba(0,0,0,0.08)",
};

function WorkerCard({ 
  title, 
  description, 
  icon, 
  href, 
  color = COLORS.primary 
}: { 
  title: string; 
  description: string; 
  icon: any; 
  href: string; 
  color?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem 1.5rem',
          boxShadow: isHovered ? COLORS.shadowHover : COLORS.shadow,
          textAlign: 'center',
          cursor: 'pointer',
          border: `1px solid ${isHovered ? color : COLORS.border}`,
          transition: 'all 0.3s ease',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            transition: 'all 0.3s ease',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          <FontAwesomeIcon icon={icon} size="2x" style={{ color }} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: COLORS.textPrimary, margin: '0 0 0.5rem 0' }}>
          {title}
        </h2>
        <p style={{ fontSize: '0.9rem', color: COLORS.textSecondary, margin: '0 0 1rem 0', lineHeight: '1.5' }}>
          {description}
        </p>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            color,
            fontSize: '0.85rem',
            fontWeight: '500',
            transition: 'all 0.3s ease',
            transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
          }}
        >
          {t('viewDetails') || 'View Details'}
          <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '0.7rem' }} />
        </div>
      </div>
    </Link>
  );
}

export default function WorkersLanding() {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
              <FontAwesomeIcon icon={faUsers} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
              {t('workersPortal') || 'Workers Portal'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0.15rem 0 0 0' }}>
              {t('manageWorkers') || 'Manage your workforce, track performance, and handle HR tasks'}
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}>
          <WorkerCard
            title={t('generalLists') || 'General Lists'}
            description={t('generalListsDesc') || 'Simple worker list – name, department, phone. Ideal for quick reference.'}
            icon={faList}
            href="/dashboard/workers/general"
            color={COLORS.info}
          />
          <WorkerCard
            title={t('deepSeek') || 'Deep Seek'}
            description={t('deepSeekDesc') || 'Full worker management – salary history, documents, leave, performance reviews, attendance.'}
            icon={faSearch}
            href="/dashboard/workers/deep"
            color={COLORS.primary}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}