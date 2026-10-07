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
  const [nextRouteLoading, setNextRouteLoading] = useState(false);

  // ✅ Loading tied to actual resource loading
  useEffect(() => {
    let startTime = 0;

    const handleStart = () => {
      startTime = Date.now();
      setLoading(true);
    };

    const handleComplete = () => {
      // Enforce minimum 500ms so spinner is visible
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 500 - elapsed);
      setTimeout(() => setLoading(false), remaining);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  // ✅ Preferences — dashboard only
  useEffect(() => {
    if (!isDashboard) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const applyPreferences = async () => {
      try {
        const res = await fetch('/api/user/preferences', { headers: getAuthHeaders() });
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          document.cookie = 'token=; path=/; max-age=0';
          return;
        }
        if (res.ok) {
          const prefs = await res.json();
          document.documentElement.setAttribute('data-theme', prefs.theme || 'light');
          if (prefs.compact_mode === 'true') document.body.classList.add('compact-mode');
          else document.body.classList.remove('compact-mode');
        }
      } catch {}
    };
    applyPreferences();
  }, [isDashboard, router.pathname]);

  // ✅ Maintenance (public)
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/public/maintenance-mode');
        const data = await res.json();
        if (data.enabled) {
          const userRole = getUserRoleFromToken();
          if (userRole !== ROLES.SUPERADMIN && window.location.pathname !== '/maintenance') {
            window.location.href = '/maintenance';
          }
        }
      } catch {}
    };
    check();
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