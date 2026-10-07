import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { translations } from '@/data/translations';

type Locale = 'en' | 'rw' | 'zh';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'hy_locale';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  // ✅ On mount: load from localStorage first, then DB, then browser
  useEffect(() => {
    const init = async () => {
      // 1) Try localStorage (instant)
      const saved = typeof window !== 'undefined' ? localStorage.getItem(LOCALE_STORAGE_KEY) : null;
      if (saved && ['en', 'rw', 'zh'].includes(saved)) {
        setLocaleState(saved as Locale);
      }

      // 2) If logged in, DB takes priority (cross-device)
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('/api/user/preferences', { headers: getAuthHeaders() });
          if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          } else if (res.ok) {
            const prefs = await res.json();
            const dbLang = prefs.language;
            if (dbLang && ['en', 'rw', 'zh'].includes(dbLang)) {
              setLocaleState(dbLang as Locale);
              localStorage.setItem(LOCALE_STORAGE_KEY, dbLang);
              return;
            }
          }
        } catch { /* silent */ }
      }

      // 3) If nothing saved, use browser language (only first visit)
      if (!saved) {
        const browserLang = navigator.language.slice(0, 2);
        const detected: Locale = browserLang === 'rw' ? 'rw' : browserLang === 'zh' ? 'zh' : 'en';
        setLocaleState(detected);
        localStorage.setItem(LOCALE_STORAGE_KEY, detected);
      }
    };
    init();
  }, []);

  // ✅ Change locale — saves to state + localStorage + DB
  const updateLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    }

    // Also sync to DB if logged in (fire-and-forget)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      fetch('/api/user/preferences', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ language: newLocale }),
      }).catch(() => {});
    }
  };

  // Translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[locale];
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    let text = value || key;
    if (params && typeof text === 'string') {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale: updateLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}