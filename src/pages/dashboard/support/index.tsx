// src/pages/dashboard/support/index.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import SupportOverview from '@/components/support/SupportOverview';
import IncomingMessages from '@/components/support/IncomingMessages';
import TicketList from '@/components/support/TicketList';
import FAQManager from '@/components/support/FAQManager';
import AITranslationWidget from '@/components/AITranslationWidget';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faEnvelope, 
  faTicketAlt, 
  faQuestionCircle,
  faLifeRing,
  faLanguage,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  border: "#e5e7eb",
};

// ========== TAB BUTTON ==========
function TabButton({ 
  label, 
  icon, 
  active, 
  onClick,
  count
}: { 
  label: string; 
  icon: any; 
  active: boolean; 
  onClick: () => void;
  count?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      role="tab"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '0.6rem 1.25rem',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontWeight: active ? '600' : '400',
        borderBottom: active ? `3px solid ${COLORS.primary}` : '3px solid transparent',
        color: active ? COLORS.primary : (isHovered ? COLORS.textPrimary : COLORS.textSecondary),
        fontSize: '0.85rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      <FontAwesomeIcon icon={icon} style={{ fontSize: '0.8rem' }} />
      {label}
      {count !== undefined && count > 0 && (
        <span style={{
          background: COLORS.primary,
          color: 'white',
          borderRadius: '50%',
          padding: '0.1rem 0.5rem',
          fontSize: '0.6rem',
          fontWeight: '600',
          marginLeft: '0.1rem',
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

export default function SupportPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  // Check for tab query param on load
  useEffect(() => {
    const tab = router.query.tab as string;
    if (tab) {
      setActiveTab(tab);
    }
  }, [router.query]);

  const tabs = [
    { id: 'overview', label: t('overview') || 'Overview', icon: faChartLine },
    { id: 'incoming', label: t('incomingMessages') || 'Messages', icon: faEnvelope },
    { id: 'tickets', label: t('tickets') || 'Tickets', icon: faTicketAlt },
    { id: 'faq', label: t('faq') || 'FAQ', icon: faQuestionCircle },
    { id: 'aitranslate', label: 'AI Translate', icon: faLanguage },
  ];

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
            <FontAwesomeIcon icon={faLifeRing} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
            {t('supportCenter') || 'Support Center'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0.15rem 0 0 0' }}>
            {t('manageSupport') || 'Manage tickets, messages, and FAQs'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          borderBottom: `1px solid ${COLORS.border}`, 
          marginBottom: '1.5rem', 
          overflowX: 'auto',
          flexWrap: 'wrap',
          gap: '0.25rem',
        }}>
          {tabs.map(tab => (
            <TabButton
              key={tab.id}
              label={tab.label}
              icon={tab.icon}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <SupportOverview />}
        {activeTab === 'incoming' && <IncomingMessages />}
        {activeTab === 'tickets' && <TicketList />}
        {activeTab === 'faq' && <FAQManager />}
        {activeTab === 'aitranslate' && <AITranslationWidget />}
      </div>
    </DashboardLayout>
  );
}