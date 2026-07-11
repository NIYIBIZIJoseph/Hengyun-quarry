"use client";
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";
import PublicHeader from "@/components/PublicHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

// ========== DESIGN TOKENS (same as other pages) ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  textPrimary: "#111827",
  textSecondary: "#4b5563",
  textMuted: "#6b7280",
  bgWhite: "#ffffff",
  bgGray: "#f9fafb",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowHover: "0 8px 25px rgba(0,0,0,0.08)",
};

// ========== GLOBAL STYLES (same as other pages) ==========
const globalStyles = `
  .section-title {
    font-size: 2.2rem !important;
    font-weight: 700 !important;
    margin-bottom: 1rem !important;
    color: ${COLORS.textPrimary};
    text-align: center;
  }

  .service-text {
    font-size: 1rem !important;
  }

  .btn-primary {
    background-color: ${COLORS.primary};
    color: white;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    display: inline-block;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
  }
  .btn-primary:hover {
    background-color: ${COLORS.primaryDark};
    transform: translateY(-2px);
    box-shadow: ${COLORS.shadowHover};
  }

  /* Skeleton loading animation */
  .skeleton-text {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: 4px;
  }
  @keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

// Skeleton loader component
function SkeletonLoader() {
  return (
    <div className="skeleton-faq-list">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ marginBottom: "1rem", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ padding: "1rem", backgroundColor: COLORS.bgGray }}>
            <div className="skeleton-text" style={{ width: "70%", height: "20px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FAQPage() {
  const { locale } = useLanguage();
  const t = translations[locale as keyof typeof translations];
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/public/faq")
      .then((res) => res.json())
      .then((data) => {
        setFaqs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setFaqs([]);
        setLoading(false);
      });
  }, []);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <>
      <Head>
        <title>{t.faqTitle || "Frequently Asked Questions"} | HENG YUN</title>
        <meta name="description" content={t.faqDesc || "Find answers to common questions about our quarry and sand products."} />
      </Head>

      <style>{globalStyles}</style>
      <PublicHeader />

      {/* ========== HERO – matches other pages ========== */}
      <div style={{
        height: "450px",
        backgroundImage: "url('/homeslide/faqimage.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.55)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem",
        }}>
          <h1 style={{
            color: "white",
            fontSize: "3.5rem",
            fontWeight: "700",
            marginBottom: "0.5rem",
            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
          }}>
            {t.faqTitle || "Frequently Asked Questions"}
          </h1>
          <p style={{
            color: "white",
            fontSize: "1.2rem",
            maxWidth: "700px",
            opacity: 0.9,
          }}>
            {t.faqDesc || "Find quick answers to common questions about our products and services."}
          </p>
        </div>
      </div>

      {/* ========== FAQ ACCORDION ========== */}
      <section style={{ padding: "4rem 2rem", backgroundColor: COLORS.bgWhite }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1rem" }}>
          {loading ? (
            <SkeletonLoader />
          ) : faqs.length === 0 ? (
            <p style={{ textAlign: "center", padding: "2rem", color: COLORS.textSecondary }}>
              No FAQs found. Check back later!
            </p>
          ) : (
            <div className="faq-list">
              {faqs.map((faq, idx) => (
                <div key={faq.id} style={{
                  marginBottom: "1rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: COLORS.shadow,
                }}>
                  <button
                    onClick={() => toggle(idx)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "1rem 1.2rem",
                      backgroundColor: openIndex === idx ? COLORS.primary : COLORS.bgGray,
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "600",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "1.05rem",
                      transition: "background 0.2s",
                      color: openIndex === idx ? "white" : COLORS.textPrimary,
                    }}
                  >
                    <span>{faq.question}</span>
                    <FontAwesomeIcon icon={openIndex === idx ? faChevronUp : faChevronDown} style={{ color: openIndex === idx ? "white" : COLORS.primary }} />
                  </button>
                  {openIndex === idx && (
                    <div style={{
                      padding: "1.2rem",
                      borderTop: "1px solid #e5e7eb",
                      backgroundColor: "white",
                      color: COLORS.textSecondary,
                      lineHeight: "1.7",
                    }}>
                      {faq.answer.split("\n").map((line, i) => (
                        <p key={i} style={{ marginBottom: "0.5rem" }}>{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <Link href="/contact" className="btn-primary">
              {t.faqContactText || "Still have questions? Contact us"}
            </Link>
          </div>
        </div>
      </section>

      {/* ========== THREE‑COLUMN FOOTER (same as other pages) ========== */}
      <section style={{ padding: "4rem 2rem", backgroundColor: "#2d3748" }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "2rem",
          alignItems: "start",
        }}>
          <div style={{ textAlign: "left" }}>
            <h3 style={{
              fontSize: "1.4rem",
              marginBottom: "1rem",
              color: "white",
              borderLeft: `4px solid ${COLORS.primary}`,
              paddingLeft: "0.75rem",
              fontWeight: "700",
            }}>
              {t.servicesTitle}
            </h3>
            <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
              {(t.servicesList || []).map((service, idx) => (
                <li key={idx} className="service-text" style={{
                  marginBottom: "0.5rem",
                  fontSize: "0.95rem",
                  color: "#e2e8f0",
                }}>
                  <span style={{ color: COLORS.primary, marginRight: "0.5rem" }}>▸</span>
                  {service}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
              <svg width="120" height="34" viewBox="0 0 160 45" fill="none">
                <path d="M8 36 L25 14 L38 27 L52 9 L70 31 L84 18 L102 36" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M102 36 L115 22 L128 34 L142 18 L155 36" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <text x="24" y="20" fontFamily="serif" fontSize="16" fill="#f59e0b" fontWeight="bold">恒</text>
                <text x="52" y="25" fontFamily="Arial, sans-serif" fontSize="12" fill="currentColor" fontWeight="bold">HENG YUN</text>
              </svg>
            </div>
            <h4 style={{ fontSize: "1.2rem", marginBottom: "0.75rem", color: "white", fontWeight: "600" }}>
              {t.environmentalTitle}
            </h4>
            <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#cbd5e1" }}>
              {t.environmentalText}
            </p>
          </div>
          <div style={{ textAlign: "left" }}>
            <h3 style={{
              fontSize: "1.4rem",
              marginBottom: "1rem",
              color: "white",
              borderLeft: `4px solid ${COLORS.primary}`,
              paddingLeft: "0.75rem",
              fontWeight: "700",
            }}>
              {t.contactUsHeading}
            </h3>
            <address style={{ fontStyle: "normal", color: "#e2e8f0", fontSize: "0.95rem", lineHeight: "1.8" }}>
              <div>{(t.address || "").split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}</div>
              <p><strong>{t.phoneLabel}:</strong> 0786592766</p>
              <p><strong>{t.emailLabel}:</strong> hengyunquarry@gmail.com</p>
            </address>
          </div>
        </div>
      </section>

      {/* ========== FINAL FOOTER ========== */}
      <footer style={{
        backgroundColor: "#1a202c",
        color: "#a0aec0",
        textAlign: "center",
        padding: "1.5rem",
        borderTop: "1px solid #2d3748",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", fontSize: "0.85rem" }}>
          <p>{t.footerText}</p>
        </div>
      </footer>
    </>
  );
}