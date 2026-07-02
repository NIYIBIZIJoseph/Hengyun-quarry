// DashboardHeader.tsx - FIXED with proper styling
import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
};

interface UserInfo {
  name: string;
  branch: string;
}

export default function DashboardHeader() {
  const { t } = useTranslation();
  const [user, setUser] = useState<UserInfo>({ name: '', branch: '' });
  const [greeting, setGreeting] = useState('');
  const [formattedDate, setFormattedDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser({
          name: parsed.fullName || parsed.full_name || '',
          branch: t('kigaliBranch') || 'Kigali Branch',
        });
      }
    } catch (e) {
      console.error('Error reading user from localStorage:', e);
    }
    
    const fetchUserProfile = async () => {
      try {
        const res = await fetch('/api/user/profile', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setUser(prev => ({
            name: data.fullName || data.full_name || data.name || prev.name,
            branch: data.branch || prev.branch,
          }));
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };
    
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const updateDateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      let greetingText = '';
      if (hour < 12) greetingText = 'goodMorning';
      else if (hour < 18) greetingText = 'goodAfternoon';
      else greetingText = 'goodEvening';
      setGreeting(greetingText);
      setFormattedDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    
    updateDateTime();
    const timer = setInterval(updateDateTime, 60000);
    
    return () => clearInterval(timer);
  }, [mounted]);

  const displayName = user.name || t('user') || 'User';
  const displayBranch = user.branch || t('kigaliBranch') || 'Kigali Branch';

  const getGreetingText = () => {
    switch (greeting) {
      case 'goodMorning': return t('goodMorning') || 'Good Morning';
      case 'goodAfternoon': return t('goodAfternoon') || 'Good Afternoon';
      case 'goodEvening': return t('goodEvening') || 'Good Evening';
      default: return '';
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem',
      width: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primary}dd)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.2rem',
        }}>
          <FontAwesomeIcon icon={faUserCircle} />
        </div>
        <div>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: COLORS.textPrimary,
            margin: 0,
            lineHeight: 1.3,
          }}>
            {getGreetingText()}, {displayName}
          </h1>
          <div style={{
            color: COLORS.textSecondary,
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}>
            <span style={{ color: COLORS.primary }}>●</span>
            {displayBranch}
          </div>
        </div>
      </div>
      <div style={{
        textAlign: 'right',
        padding: '0.25rem 0.75rem',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #f3f4f6',
      }}>
        <div style={{
          fontSize: '0.85rem',
          fontWeight: '500',
          color: COLORS.textPrimary,
        }}>
          {formattedDate}
        </div>
        <div style={{
          color: COLORS.textMuted,
          fontSize: '0.75rem',
        }}>
          {currentTime}
        </div>
      </div>
    </div>
  );
}