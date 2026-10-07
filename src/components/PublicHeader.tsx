"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes, faGlobe } from "@fortawesome/free-solid-svg-icons";

const COLORS = {
  primary: "#f59e0b",
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
    const onClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
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
    { href: "/products", label: t.products },
    { href: "/market", label: t.market },
    { href: "/contact", label: t.contact },
    { href: "/faq", label: t.faq || "FAQ" },
  ];

  const languages = [
    { code: "en", label: "English" },
    { code: "rw", label: "Kinyarwanda" },
    { code: "zh", label: "中文" },
  ];

  // ✅ Language changer — no reload (sessionStorage + React re-render handle it)
  const changeLanguage = (code: string) => {
    setLocale(code as any);
    setLangOpen(false);
    setMenuOpen(false);
  };

  return (
    <>
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backgroundColor: COLORS.navDark,
        padding: "0.85rem 2.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        minHeight: "86px",
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <svg width="220" height="60" viewBox="0 0 260 68" fill="none">
            <path
              d="M10 48 L32 18 L48 34 L66 10 L88 40 L106 22 L130 48"
              stroke={COLORS.primary} strokeWidth="3.2" fill="none"
              strokeLinecap="round" strokeLinejoin="round"
            />
            <path
              d="M130 48 L146 30 L162 44 L180 22 L198 48"
              stroke={COLORS.primary} strokeWidth="3.2" fill="none"
              strokeLinecap="round" strokeLinejoin="round"
            />
            <text x="30" y="28" fontFamily="serif" fontSize="22"
                  fill={COLORS.primary} fontWeight="bold">恒</text>
            <text x="70" y="34" fontFamily="Arial, Helvetica, sans-serif" fontSize="20"
                  fill={COLORS.white} fontWeight="900" letterSpacing="1">HENG YUN</text>
            <text x="70" y="52" fontFamily="Arial, Helvetica, sans-serif" fontSize="8"
                  fill="#94a3b8" fontWeight="600" letterSpacing="2.5">SAND AND QUARRY SUPPLIES</text>
          </svg>
        </Link>

        {/* Desktop nav */}
        <nav className="hy-desktop-nav" style={{
          display: "flex",
          alignItems: "center",
          gap: "2rem",
        }}>
          {navLinks.map(link => {
            const active = currentPath === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: active ? COLORS.primary : COLORS.white,
                  fontWeight: active ? "700" : "500",
                  fontSize: "0.9rem",
                  letterSpacing: "0.5px",
                  textDecoration: "none",
                  textTransform: "uppercase",
                }}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Language globe — desktop */}
          <div ref={langRef} style={{ position: "relative" }}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              style={{
                width: "34px", height: "34px",
                borderRadius: "50%",
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
                opacity: 0.7,
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
                {languages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => changeLanguage(l.code)}
                    style={{
                      display: "block", width: "100%",
                      padding: "0.5rem 0.75rem",
                      background: locale === l.code ? "#f3f4f6" : "transparent",
                      border: "none", textAlign: "left",
                      cursor: "pointer", fontSize: "0.85rem",
                      borderRadius: "6px",
                      color: "#111827",
                      fontWeight: locale === l.code ? "600" : "400",
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Login */}
          <Link
            href="/login"
            style={{
              background: COLORS.primary,
              color: "white",
              padding: "0.6rem 1.6rem",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "700",
              fontSize: "0.85rem",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            {t.login}
          </Link>
        </nav>

        {/* Hamburger (mobile) */}
        <button
          onClick={() => setMenuOpen(true)}
          className="hy-hamburger-btn"
          style={{
            width: "44px", height: "44px",
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
      </header>

      {/* Mobile slide-in panel */}
      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.55)",
              zIndex: 9998,
              animation: "hy-fade-in 0.2s ease",
            }}
          />
          <aside style={{
            position: "fixed", top: 0, right: 0, bottom: 0,
            width: "min(320px, 85vw)",
            background: COLORS.navDark,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            animation: "hy-slide-in 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div style={{
              display: "flex", justifyContent: "flex-end",
              padding: "1rem 1.25rem",
            }}>
              <button
                onClick={() => setMenuOpen(false)}
                style={{
                  background: "transparent", border: "none",
                  color: "white", fontSize: "1.7rem",
                  cursor: "pointer", width: "40px", height: "40px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                aria-label="Close menu"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <nav style={{ flex: 1, overflowY: "auto" }}>
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

              {/* ✅ Language switcher inside mobile menu */}
              <div>
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "1.1rem 1.75rem",
                    background: langOpen ? COLORS.navActive : "transparent",
                    color: langOpen ? COLORS.primary : "white",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "1rem",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    textAlign: "left",
                    borderLeft: langOpen ? `4px solid ${COLORS.primary}` : "4px solid transparent",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <FontAwesomeIcon icon={faGlobe} style={{ fontSize: "1rem" }} />
                    Language
                  </span>
                  <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>
                    {locale.toUpperCase()}
                  </span>
                </button>

                {langOpen && (
                  <div style={{ background: "rgba(0,0,0,0.2)" }}>
                    {languages.map(l => (
                      <button
                        key={l.code}
                        onClick={() => changeLanguage(l.code)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "0.9rem 1.75rem 0.9rem 3rem",
                          background: "transparent",
                          color: locale === l.code ? COLORS.primary : "#e2e8f0",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: locale === l.code ? "700" : "400",
                          fontSize: "0.9rem",
                          textAlign: "left",
                        }}
                      >
                        <span>{l.label}</span>
                        {locale === l.code && (
                          <span style={{ color: COLORS.primary, fontSize: "1rem" }}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            <div style={{ padding: "1.25rem 1.75rem" }}>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block", textAlign: "center",
                  background: COLORS.primary, color: "white",
                  padding: "0.85rem", borderRadius: "8px",
                  textDecoration: "none", fontWeight: "700",
                  fontSize: "0.95rem", letterSpacing: "0.5px",
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
        .hy-hamburger-btn { display: none !important; }
        @media (max-width: 900px) {
          .hy-desktop-nav { display: none !important; }
          .hy-hamburger-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}