"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe, faBars, faTimes } from "@fortawesome/free-solid-svg-icons";

const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  navDark: "#0f2b3d",
  navActive: "#1a3f57",
  white: "#ffffff",
};

export default function PublicHeader() {
  const { locale, setLocale } = useLanguage();
  const t = translations[locale as keyof typeof translations];
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [router.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const currentPath = router.asPath.split('?')[0].split('#')[0];

  const navLinks = [
    { href: "/", label: t.home },
    { href: "/about", label: t.about },
    { href: "/products", label: t.products, sub: [
      { href: "/products#sand", label: t.sand },
      { href: "/products#quarry", label: t.quarry },
    ]},
    { href: "/market", label: t.market, sub: [
      { href: "/market/sand", label: t.sand },
      { href: "/market/quarry", label: t.quarry },
    ]},
    { href: "/contact", label: t.contact },
    { href: "/faq", label: t.faq || "FAQ" },
  ];

  return (
    <>
      {/* ============ HEADER BAR ============ */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backgroundColor: COLORS.navDark,
        padding: "0.75rem 1.25rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        minHeight: "68px",
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <svg width="130" height="34" viewBox="0 0 160 45" fill="none">
            <path d="M8 36 L25 14 L38 27 L52 9 L70 31 L84 18 L102 36" stroke={COLORS.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M102 36 L115 22 L128 34 L142 18 L155 36" stroke={COLORS.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <text x="24" y="20" fontFamily="serif" fontSize="16" fill={COLORS.primary} fontWeight="bold">恒</text>
            <text x="52" y="25" fontFamily="Arial, sans-serif" fontSize="11" fill="white" fontWeight="bold">HENG YUN</text>
            <text x="52" y="36" fontFamily="Arial, sans-serif" fontSize="6" fill="#cbd5e1" letterSpacing="0.5">SAND AND QUARRY SUPPLIES</text>
          </svg>
        </Link>

        {/* Right side: language + hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Language button — always visible */}
          <div ref={langRef} style={{ position: "relative" }}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              style={{
                width: "40px", height: "40px",
                borderRadius: "50%", border: "none",
                background: "transparent", color: "white",
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: "1.1rem",
              }}
              aria-label="Language"
            >
              <FontAwesomeIcon icon={faGlobe} />
            </button>
            {langOpen && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                background: "white",
                borderRadius: "8px",
                boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                padding: "0.5rem",
                minWidth: "160px",
                zIndex: 1002,
              }}>
                {[
                  { code: "en", label: "English" },
                  { code: "rw", label: "Kinyarwanda" },
                  { code: "zh", label: "中文" },
                ].map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLocale(l.code as any); setLangOpen(false); }}
                    style={{
                      display: "block", width: "100%",
                      padding: "0.5rem 0.75rem",
                      background: locale === l.code ? "#f3f4f6" : "transparent",
                      border: "none", textAlign: "left",
                      cursor: "pointer", fontSize: "0.85rem",
                      borderRadius: "6px",
                      color: locale === l.code ? COLORS.primaryDark : "#111827",
                      fontWeight: locale === l.code ? "600" : "400",
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMenuOpen(true)}
            className="hy-hamburger-btn"
            style={{
              width: "42px", height: "42px",
              background: "transparent",
              border: "none",
              color: "white",
              cursor: "pointer",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
            }}
            aria-label="Open menu"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        </div>

        {/* Desktop nav (hidden on mobile) */}
        <nav className="hy-desktop-nav" style={{
          display: "flex",
          gap: "1.75rem",
          alignItems: "center",
        }}>
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: currentPath === link.href ? COLORS.primary : "white",
                fontWeight: currentPath === link.href ? "700" : "500",
                fontSize: "0.95rem",
                textDecoration: "none",
                letterSpacing: "0.3px",
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            style={{
              background: COLORS.primary,
              color: "white",
              padding: "0.5rem 1.25rem",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "0.9rem",
            }}
          >
            {t.login}
          </Link>
        </nav>
      </header>

      {/* ============ MOBILE SLIDE-IN PANEL ============ */}
      {menuOpen && (
        <>
          {/* Gray overlay */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 9998,
              animation: "hy-fade-in 0.25s ease",
            }}
          />

          {/* Panel */}
          <aside style={{
            position: "fixed",
            top: 0, right: 0, bottom: 0,
            width: "min(340px, 88vw)",
            background: COLORS.navDark,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            animation: "hy-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "-8px 0 30px rgba(0,0,0,0.3)",
          }}>
            {/* Close header */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "1rem 1.25rem",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}>
              <svg width="110" height="30" viewBox="0 0 160 45" fill="none">
                <path d="M8 36 L25 14 L38 27 L52 9 L70 31 L84 18 L102 36" stroke={COLORS.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M102 36 L115 22 L128 34 L142 18 L155 36" stroke={COLORS.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <text x="24" y="20" fontFamily="serif" fontSize="16" fill={COLORS.primary} fontWeight="bold">恒</text>
                <text x="52" y="25" fontFamily="Arial, sans-serif" fontSize="11" fill="white" fontWeight="bold">HENG YUN</text>
              </svg>
              <button
                onClick={() => setMenuOpen(false)}
                style={{
                  background: "transparent", border: "none",
                  color: "white", fontSize: "1.6rem",
                  cursor: "pointer", width: "40px", height: "40px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                aria-label="Close menu"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Links */}
            <nav style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0" }}>
              {navLinks.map(link => {
                const active = currentPath === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "block",
                      padding: "1.1rem 1.75rem",
                      background: active ? COLORS.navActive : "transparent",
                      color: active ? COLORS.primary : "white",
                      textDecoration: "none",
                      fontWeight: "600",
                      fontSize: "1rem",
                      letterSpacing: "0.5px",
                      borderLeft: active ? `4px solid ${COLORS.primary}` : "4px solid transparent",
                      textTransform: "uppercase",
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Login button at bottom */}
            <div style={{ padding: "1.25rem 1.75rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block",
                  textAlign: "center",
                  background: COLORS.primary,
                  color: "white",
                  padding: "0.85rem",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  letterSpacing: "0.5px",
                }}
              >
                {t.login}
              </Link>
            </div>
          </aside>
        </>
      )}

      <style jsx global>{`
        @keyframes hy-slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes hy-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Default: hamburger hidden, desktop nav visible */
        .hy-hamburger-btn { display: none !important; }

        /* Mobile: hamburger visible, desktop nav hidden */
        @media (max-width: 900px) {
          .hy-desktop-nav { display: none !important; }
          .hy-hamburger-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}