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

  // Lock body scroll while menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const currentPath = router.asPath.split('?')[0].split('#')[0];

  // Existing enlarged-text CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .image-container { position: relative; overflow: hidden; cursor: pointer; }
      .image-container img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
      .image-container:hover img { transform: scale(1.05); }
      .public-header .main-nav a,
      .public-header .main-nav .dropdown > a,
      .public-header .main-nav .login-btn { font-size: 1rem !important; font-weight: 600 !important; }
      .public-header .logo .tagline { font-size: 0.7rem !important; font-weight: 600 !important; letter-spacing: 1px !important; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const navLinks = [
    { href: "/", label: t.home },
    { href: "/about", label: t.about },
    { href: "/products", label: `${t.products} ▼`, sub: [
      { href: "/products#sand", label: t.sand },
      { href: "/products#quarry", label: t.quarry },
    ]},
    { href: "/market", label: `${t.market} ▼`, sub: [
      { href: "/market/sand", label: t.sand },
      { href: "/market/quarry", label: t.quarry },
    ]},
    { href: "/contact", label: t.contact },
    { href: "/faq", label: t.faq || "FAQ" },
  ];

  return (
    <>
      <header className="public-header" style={{ backgroundColor: COLORS.navDark }}>
        <div className="header-row">
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
          </button>
          <div className="logo">
            <svg width="140" height="38" viewBox="0 0 160 45" fill="none">
              <path d="M8 36 L25 14 L38 27 L52 9 L70 31 L84 18 L102 36" stroke={COLORS.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M102 36 L115 22 L128 34 L142 18 L155 36" stroke={COLORS.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <text x="24" y="20" fontFamily="serif" fontSize="16" fill={COLORS.primary} fontWeight="bold">恒</text>
              <text x="52" y="25" fontFamily="Arial, sans-serif" fontSize="12" fill="white" fontWeight="bold">HENG YUN</text>
            </svg>
            <div className="tagline">SAND AND QUARRY SUPPLIES</div>
          </div>
          <div className="lang-dropdown" ref={langRef}>
            <button onClick={() => setLangOpen(!langOpen)} className="lang-btn" aria-label="Language">
              <FontAwesomeIcon icon={faGlobe} />
            </button>
            {langOpen && (
              <div className="dropdown-menu">
                <button onClick={() => { setLocale("en"); setLangOpen(false); }}>English</button>
                <button onClick={() => { setLocale("rw"); setLangOpen(false); }}>Kinyarwanda</button>
                <button onClick={() => { setLocale("zh"); setLangOpen(false); }}>中文</button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop nav (unchanged) */}
        <nav className={`main-nav ${menuOpen ? "open" : ""}`}>
          <Link href="/" className={currentPath === "/" ? "active" : ""}>{t.home}</Link>
          <Link href="/about" className={currentPath === "/about" ? "active" : ""}>{t.about}</Link>
          <div className="dropdown">
            <Link href="/products" className={currentPath === "/products" ? "active" : ""}>{t.products} ▼</Link>
            <div className="dropdown-content">
              <Link href="/products#sand">{t.sand}</Link>
              <Link href="/products#quarry">{t.quarry}</Link>
            </div>
          </div>
          <div className="dropdown">
            <Link href="/market" className={currentPath === "/market" ? "active" : ""}>{t.market} ▼</Link>
            <div className="dropdown-content">
              <Link href="/market/sand">{t.sand}</Link>
              <Link href="/market/quarry">{t.quarry}</Link>
            </div>
          </div>
          <Link href="/contact" className={currentPath === "/contact" ? "active" : ""}>{t.contact}</Link>
          <Link href="/faq" className={currentPath === "/faq" ? "active" : ""}>{t.faq || "FAQ"}</Link>
          <Link href="/login" className="login-btn">{t.login}</Link>
        </nav>
      </header>

      {/* ===== MOBILE SLIDE-IN PANEL (right side) ===== */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.45)", zIndex: 9000,
            animation: "hy-fade-in 0.25s ease",
          }} className="hy-mobile-overlay" />

          <aside style={{
            position: "fixed", top: 0, right: 0, bottom: 0,
            width: "min(340px, 88vw)",
            background: COLORS.navDark, zIndex: 9001,
            display: "flex", flexDirection: "column",
            animation: "hy-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }} className="hy-mobile-panel">
            {/* Header */}
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
              <button onClick={() => setMenuOpen(false)} style={{
                background: "transparent", border: "none",
                color: "white", fontSize: "1.6rem",
                cursor: "pointer", width: "40px", height: "40px",
              }} aria-label="Close menu">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Links */}
            <nav style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0" }}>
              {navLinks.map(link => {
                const active = currentPath === link.href;
                return (
                  <Link key={link.href} href={link.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "block",
                      padding: "1.1rem 1.75rem",
                      background: active ? COLORS.navActive : "transparent",
                      color: active ? COLORS.primary : "white",
                      textDecoration: "none",
                      fontWeight: "600", fontSize: "1rem",
                      borderLeft: active ? `4px solid ${COLORS.primary}` : "4px solid transparent",
                    }}>
                    {link.label.toUpperCase()}
                  </Link>
                );
              })}
            </nav>

            {/* Login button */}
            <div style={{ padding: "1.25rem 1.75rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <Link href="/login" onClick={() => setMenuOpen(false)}
                style={{
                  display: "block", textAlign: "center",
                  background: COLORS.primary, color: "white",
                  padding: "0.85rem", borderRadius: "8px",
                  textDecoration: "none", fontWeight: "700",
                  fontSize: "0.95rem", letterSpacing: "0.5px",
                }}>
                {t.login}
              </Link>
            </div>
          </aside>

          <style jsx global>{`
            @keyframes hy-slide-in {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            @keyframes hy-fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @media (min-width: 901px) {
              .hy-mobile-overlay, .hy-mobile-panel { display: none !important; }
            }
          `}</style>
        </>
      )}
    </>
  );
}