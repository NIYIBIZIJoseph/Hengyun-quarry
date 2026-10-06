import { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import BackToTop from '@/components/BackToTop';
import WhatsAppButton from '@/components/WhatsAppButton';
import LoadingSpinner from '@/components/LoadingSpinner';
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

  // ✅ Public vs dashboard split
  const isDashboard = router.pathname.startsWith('/dashboard');
  const isPublic = !isDashboard;

  const [loading, setLoading] = useState(false);

  // ✅ Loading spinner on route changes
  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  // ✅ Apply user preferences — ONLY on dashboard pages
  useEffect(() => {
    if (!isDashboard) return;          // ← skip on all public pages
    const token = localStorage.getItem('token');
    if (!token) return;                 // ← skip if not logged in

    const applyPreferences = async () => {
      try {
        const res = await fetch('/api/user/preferences', { headers: getAuthHeaders() });

        // 401 = expired/invalid token → clear it, stop retrying
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          document.cookie = 'token=; path=/; max-age=0';
          return;
        }

        if (res.ok) {
          const prefs = await res.json();
          document.documentElement.setAttribute('data-theme', prefs.theme || 'light');
          if (prefs.compact_mode === 'true') {
            document.body.classList.add('compact-mode');
          } else {
            document.body.classList.remove('compact-mode');
          }
        }
      } catch (err) {
        // Silent fail — no console spam
      }
    };

    applyPreferences();
  }, [isDashboard, router.pathname]);

  // ✅ Maintenance mode check — public-safe endpoint
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/public/maintenance-mode');
        const data = await res.json();
        if (data.enabled) {
          const userRole = getUserRoleFromToken();
          if (userRole !== ROLES.SUPERADMIN && window.location.pathname !== '/maintenance') {
            window.location.href = '/maintenance';
          }
        }
      } catch (err) {
        // Silent fail
      }
    };
    checkMaintenance();
  }, []);

  return (
    <LanguageProvider>
      {loading && <LoadingSpinner />}
      <Component {...pageProps} />
      <BackToTop />
      {isPublic && <WhatsAppButton />}
    </LanguageProvider>
  );
}