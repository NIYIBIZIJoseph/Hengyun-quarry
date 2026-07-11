"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";
import PublicHeader from "@/components/PublicHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearchPlus } from "@fortawesome/free-solid-svg-icons";

// ========== DESIGN TOKENS (from Products page) ==========
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

// ========== GLOBAL STYLES (same as Products page) ==========
const globalStyles = `
  .image-hover-container {
    position: relative;
    overflow: hidden;
    cursor: pointer;
  }
  .image-hover-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  .image-hover-container:hover img {
    transform: scale(1.05);
  }
  .image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(245, 158, 11, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .image-hover-container:hover .image-overlay {
    opacity: 1;
  }
  .zoom-icon {
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    padding: 12px;
    color: white;
    font-size: 1.5rem;
    transition: transform 0.2s ease;
  }
  .image-hover-container:hover .zoom-icon {
    transform: scale(1.1);
  }

  .card-hover {
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .card-hover:hover {
    transform: translateY(-5px);
    box-shadow: ${COLORS.shadowHover};
  }

  .section-title {
    font-size: 2.2rem !important;
    font-weight: 700 !important;
    margin-bottom: 1rem !important;
    color: ${COLORS.textPrimary};
    text-align: center;
  }

  .skeleton-image {
    background: linear-gradient(90deg, #e5e7eb 25%, #d1d5db 50%, #e5e7eb 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
  }
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

  .service-text {
    font-size: 1rem !important;
  }
`;

// ========== IMAGE MODAL (same as Products page) ==========
function ImageModal({ imageUrl, alt, onClose }: { imageUrl: string; alt: string; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        cursor: "pointer",
        padding: "2rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: "95vw",
          maxHeight: "90vh",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={alt}
          style={{
            maxWidth: "95vw",
            maxHeight: "85vh",
            objectFit: "contain",
            borderRadius: "8px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          }}
        />
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "-50px",
            right: "-10px",
            backgroundColor: "rgba(255,255,255,0.95)",
            border: "none",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            fontSize: "28px",
            fontWeight: "300",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            color: "#111827",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.backgroundColor = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.95)";
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ========== SKELETON TEAM CARD ==========
function SkeletonTeamCard() {
  return (
    <div
      style={{
        backgroundColor: COLORS.bgWhite,
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: COLORS.shadow,
        textAlign: "center",
        paddingBottom: "1rem",
      }}
    >
      <div className="skeleton-image" style={{ height: "280px", width: "100%" }} />
      <div className="skeleton-text" style={{ width: "60%", height: "20px", margin: "1rem auto 0.5rem" }} />
      <div className="skeleton-text" style={{ width: "40%", height: "15px", margin: "0 auto 0.5rem" }} />
      <div className="skeleton-text" style={{ width: "80%", height: "60px", margin: "0 auto" }} />
    </div>
  );
}

// ========== STAFF CARD ==========
function StaffCard({ member, onImageClick }: { member: any; onImageClick: (url: string, name: string) => void }) {
  return (
    <div
      className="card-hover"
      style={{
        backgroundColor: COLORS.bgWhite,
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: COLORS.shadow,
        textAlign: "center",
        paddingBottom: "1rem",
        cursor: "default",
      }}
    >
      <div
        className="image-hover-container"
        onClick={() => onImageClick(member.image_url || '/staff/placeholder.jpg', member.name)}
        style={{ height: "280px" }}
      >
        <img
          src={member.image_url || '/staff/placeholder.jpg'}
          alt={member.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => { e.currentTarget.src = '/staff/placeholder.jpg'; }}
        />
        <div className="image-overlay">
          <div className="zoom-icon"><FontAwesomeIcon icon={faSearchPlus} /></div>
        </div>
      </div>
      <h3 style={{ fontSize: "1.3rem", margin: "1rem 0 0.25rem", color: COLORS.textPrimary, fontWeight: "700" }}>
        {member.name}
      </h3>
      <p style={{ fontSize: "1rem", color: COLORS.primary, fontWeight: "600", marginBottom: "0.5rem" }}>
        {member.role}
      </p>
      <p style={{ fontSize: "0.9rem", color: COLORS.textSecondary, padding: "0 1rem 1rem", lineHeight: "1.5" }}>
        {member.bio}
      </p>
    </div>
  );
}

// ========== MAIN COMPONENT ==========
export default function About() {
  const { locale } = useLanguage();
  const t = translations[locale as keyof typeof translations];

  const [team, setTeam] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalAlt, setModalAlt] = useState<string>("");

  // ✅ DATA FETCHING – UNCHANGED from your original code
  useEffect(() => {
    fetch('/api/public/team')
      .then(res => res.json())
      .then(data => {
        console.log('Team data from API:', data); // Debug: check console
        setTeam(Array.isArray(data) ? data : []);
        setLoadingTeam(false);
      })
      .catch(err => {
        console.error('Error fetching team:', err);
        setTeam([]);
        setLoadingTeam(false);
      });
  }, []);

  const openModal = (imageUrl: string, alt: string) => {
    setModalImage(imageUrl);
    setModalAlt(alt);
  };

  return (
    <div>
      <style>{globalStyles}</style>
      <PublicHeader />

      {modalImage && (
        <ImageModal imageUrl={modalImage} alt={modalAlt} onClose={() => setModalImage(null)} />
      )}

      {/* ========== HERO – matches Products page ========== */}
      <section style={{
        height: "450px",
        backgroundImage: "url('/operations/facility2.jpg')",
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
            {t.aboutTitle}
          </h1>
          <p style={{
            color: "white",
            fontSize: "1.2rem",
            maxWidth: "700px",
            opacity: 0.9,
          }}>
            Learn more about our company
          </p>
        </div>
      </section>

      {/* ========== COMPANY STORY ========== */}
      <section style={{ padding: "4rem 2rem", backgroundColor: COLORS.bgWhite }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {t.aboutStory.split('\n').map((para, i) => (
            <p key={i} style={{
              fontSize: "1.05rem",
              lineHeight: "1.7",
              color: COLORS.textSecondary,
              marginBottom: "1rem"
            }}>
              {para}
            </p>
          ))}
        </div>
      </section>

      {/* ========== STAFF SECTION ========== */}
      <section style={{ padding: "4rem 2rem", backgroundColor: COLORS.bgGray }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 className="section-title">{t.staffTitle}</h2>
          {loadingTeam ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "2rem",
              marginTop: "2rem"
            }}>
              {[1, 2, 3, 4].map((i) => (
                <SkeletonTeamCard key={i} />
              ))}
            </div>
          ) : team.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: "1.1rem", color: COLORS.textSecondary }}>
              No team members added yet.
            </p>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "2rem",
              marginTop: "2rem"
            }}>
              {team.map((member) => (
                <StaffCard key={member.id} member={member} onImageClick={openModal} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========== THREE‑COLUMN FOOTER ========== */}
      <section style={{ padding: "4rem 2rem", backgroundColor: "#2d3748" }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "2rem",
          alignItems: "start"
        }}>
          <div style={{ textAlign: "left" }}>
            <h3 style={{
              fontSize: "1.4rem",
              marginBottom: "1rem",
              color: "white",
              borderLeft: `4px solid ${COLORS.primary}`,
              paddingLeft: "0.75rem",
              fontWeight: "700"
            }}>
              {t.servicesTitle}
            </h3>
            <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
              {(t.servicesList || []).map((service, idx) => (
                <li key={idx} className="service-text" style={{
                  marginBottom: "0.5rem",
                  fontSize: "0.95rem",
                  color: "#e2e8f0"
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
                <text x="52" y="25" fontFamily="Arial" fontSize="12" fill="currentColor" fontWeight="bold">HENG YUN</text>
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
              fontWeight: "700"
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
        borderTop: "1px solid #2d3748"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", fontSize: "0.85rem" }}>
          <p>{t.footerText}</p>
        </div>
      </footer>
    </div>
  );
}