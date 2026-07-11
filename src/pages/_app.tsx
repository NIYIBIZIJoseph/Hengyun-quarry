import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import BackToTop from '@/components/BackToTop';
import WhatsAppButton from '@/components/WhatsAppButton';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { getAuthHeaders, getUserRoleFromToken } from '@/lib/auth-client';
import { ROLES } from '@/lib/roles';
import '../styles/globals.css';
import '../styles/tokens.css';
import '../styles/header.css';
import '../styles/components.css';
import '../styles/responsive.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isPublic = !router.pathname.startsWith('/dashboard');
  // Apply user preferences (theme, compact mode)
  useEffect(() => {
    const applyPreferences = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('/api/user/preferences', { headers: getAuthHeaders() });
        if (res.ok) {
          const prefs = await res.json();
          // Theme
          document.documentElement.setAttribute('data-theme', prefs.theme || 'light');
          // Compact mode
          if (prefs.compact_mode === 'true') {
            document.body.classList.add('compact-mode');
          } else {
            document.body.classList.remove('compact-mode');
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    applyPreferences();
  }, []);

  // Maintenance mode check - UPDATED to use PUBLIC API
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        // ✅ CHANGED: Use public API endpoint (no auth required)
        const res = await fetch('/api/public/maintenance-mode');
        const data = await res.json();
        if (data.enabled) {
          const userRole = getUserRoleFromToken();
          if (userRole !== ROLES.SUPERADMIN && window.location.pathname !== '/maintenance') {
            window.location.href = '/maintenance';
          }
        }
      } catch (err) {
        // API may not exist yet – ignore
        console.error('Maintenance check error:', err);
      }
    };
    checkMaintenance();
  }, []);

  return (
    <LanguageProvider>
      <Component {...pageProps} />
      <BackToTop />
      {isPublic && <WhatsAppButton />}
    </LanguageProvider>
  );
}