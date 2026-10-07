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
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // ✅ First-visit ribbon: only for public pages, once per browser session
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isFirstVisit = !sessionStorage.getItem('hy_initial_load');
    const onPublicPage = !window.location.pathname.startsWith('/dashboard');

    if (isFirstVisit && onPublicPage) {
      setLoading(true);

      const hide = () => {
        setLoading(false);
        sessionStorage.setItem('hy_initial_load', '1');
        setInitialLoadDone(true);
      };

      // Hide when page is truly ready, or after 2.5s max
      const timer = setTimeout(hide, 2500);
      window.addEventListener('load', hide, { once: true });
      return () => {
        clearTimeout(timer);
        window.removeEventListener('load', hide);
      };
    } else {
      setInitialLoadDone(true);
    }
  }, []);

  // ✅ Route-change spinner (only after first visit)
  useEffect(() => {
    if (!initialLoadDone) return;

    let minTimer: NodeJS.Timeout | null = null;

    const handleStart = () => {
      setLoading(true);
      minTimer = setTimeout(() => { minTimer = null; }, 400);
    };
    const handleComplete = () => {
      if (minTimer) setTimeout(() => setLoading(false), 400);
      else setLoading(false);
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
  }, [router, initialLoadDone]);

  // Preferences — dashboard only
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

  // Maintenance check (public-safe)
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