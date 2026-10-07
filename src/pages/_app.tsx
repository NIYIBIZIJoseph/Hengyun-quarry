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
  const isPublic = !router.pathname.startsWith('/dashboard');
  const isDashboard = !isPublic;

  const [loading, setLoading] = useState(false);

  // ✅ Loading spinner with minimum 400ms display (no flash)
  useEffect(() => {
    let minTimer: NodeJS.Timeout | null = null;

    const handleStart = () => {
      setLoading(true);
      minTimer = setTimeout(() => {
        minTimer = null;
      }, 400);
    };

    const handleComplete = () => {
      if (minTimer) {
        setTimeout(() => setLoading(false), 400);
      } else {
        setLoading(false);
      }
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
      if (minTimer) clearTimeout(minTimer);
    };
  }, [router]);

  // ✅ Apply user preferences — ONLY on dashboard pages (no more 401 on public)
  useEffect(() => {
    if (!isDashboard) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const applyPreferences = async () => {
      try {
        const res = await fetch('/api/user/preferences', { headers: getAuthHeaders() });

        // 401 = expired token → clear and stop
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
      } catch {
        // silent fail — no console spam
      }
    };

    applyPreferences();
  }, [isDashboard, router.pathname]);

  // ✅ Maintenance mode check (public-safe endpoint)
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
      } catch {
        // silent fail
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