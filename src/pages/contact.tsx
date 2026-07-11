"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";
import PublicHeader from "@/components/PublicHeader";

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

// ========== GLOBAL STYLES ==========
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
`;

export default function ContactPage() {
  const { locale, setLocale } = useLanguage();
  const t = translations[locale as keyof typeof translations];
  const router = useRouter();

  const [formData, setFormData] = useState({
    user_name: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_name || !formData.message) {
      setError(t.contactFormError || "Please fill in your name and message.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: formData.user_name,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to send");
      }
      setSubmitted(true);
      setFormData({ user_name: "", phone: "", subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: any) {
      setError(err.message || "Message could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <style>{globalStyles}</style>
      <PublicHeader />

      {/* ========== HERO – matches Products/About ========== */}
      <div style={{
        height: "450px",
        backgroundImage: "url('https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=1920&h=400&fit=crop')",
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
            {t.contactHeroTitle}
          </h1>
          <p style={{
            color: "white",
            fontSize: "1.2rem",
            maxWidth: "700px",
            opacity: 0.9,
          }}>
            {t.contactHeroDesc}
          </p>
        </div>
      </div>

      {/* ========== CONTACT INFO + FORM ========== */}
      <section style={{ padding: "4rem 2rem", backgroundColor: COLORS.bgWhite }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "3rem",
          }}>
            {/* Left column – Info & Map */}
            <div style={{
              backgroundColor: COLORS.bgGray,
              padding: "2rem",
              borderRadius: "12px",
              boxShadow: COLORS.shadow,
            }}>
              <h2 style={{ fontSize: "1.8rem", marginBottom: "1.5rem", color: COLORS.textPrimary }}>
                {t.contactInfoTitle}
              </h2>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.5rem" }}>📍</span>
                <div>
                  <strong>{t.officeAddress}</strong><br />
                  {t.address.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.5rem" }}>📞</span>
                <div>
                  <strong>{t.phoneLabel}</strong><br />
                  {t.phone}
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.5rem" }}>✉️</span>
                <div>
                  <strong>{t.emailLabel}</strong><br />
                  {t.email}
                </div>
              </div>
              <div style={{ marginTop: "1.5rem", borderRadius: "8px", overflow: "hidden" }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63741.28063066605!2d30.033333!3d-1.933333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca6f0b6f2d2f7%3A0x2b8f7c8b8b8b8b8b!2sNyacyonga%2C%20Rwanda!5e0!3m2!1sen!2srw!4v1712345678901!5m2!1sen!2srw"
                  width="100%"
                  height="250"
                  style={{ border: 0, borderRadius: "8px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Nyacyonga Quarry Area"
                ></iframe>
              </div>
            </div>

            {/* Right column – Contact Form + FAQ link */}
            <div style={{
              backgroundColor: COLORS.bgGray,
              padding: "2rem",
              borderRadius: "12px",
              boxShadow: COLORS.shadow,
            }}>
              <h2 style={{ fontSize: "1.8rem", marginBottom: "1.5rem", color: COLORS.textPrimary }}>
                {t.contactFormTitle}
              </h2>
              {submitted && (
                <div style={{ backgroundColor: "#10b981", color: "white", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", textAlign: "center" }}>
                  ✓ {t.contactFormSuccess}
                </div>
              )}
              {error && (
                <div style={{ backgroundColor: "#ef4444", color: "white", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", textAlign: "center" }}>
                  ⚠️ {error}
                </div>
              )}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <input
                  type="text"
                  name="user_name"
                  placeholder={t.fullName}
                  value={formData.user_name}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder={t.phoneLabel}
                  value={formData.phone}
                  onChange={handleChange}
                  style={inputStyle}
                />
                <input
                  type="text"
                  name="subject"
                  placeholder={t.subject}
                  value={formData.subject}
                  onChange={handleChange}
                  style={inputStyle}
                />
                <textarea
                  name="message"
                  placeholder={t.message}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  style={{ ...inputStyle, fontFamily: "inherit" }}
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary"
                  style={{ padding: "0.75rem", fontSize: "1rem", width: "100%" }}
                >
                  {sending ? "Sending..." : t.sendButton}
                </button>
              </form>

              {/* FAQ link */}
              <div style={{
                marginTop: "2rem",
                textAlign: "center",
                borderTop: "1px solid #e5e7eb",
                paddingTop: "1.5rem",
              }}>
                <Link href="/faq" style={{
                  color: COLORS.primary,
                  fontWeight: "500",
                  fontSize: "0.9rem",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}>
                  📖 {t.faqTitle || "Frequently Asked Questions"} →
                </Link>
              </div>
            </div>
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
    </div>
  );
}

// ========== SHARED INPUT STYLES ==========
const inputStyle: React.CSSProperties = {
  padding: "0.75rem",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "1rem",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  backgroundColor: "white",
};