"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";
import PublicHeader from "@/components/PublicHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearchPlus, faArrowLeft, faCheckCircle } from "@fortawesome/free-solid-svg-icons";

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  success: "#10b981",
  textPrimary: "#111827",
  textSecondary: "#4b5563",
  textMuted: "#6b7280",
  bgWhite: "#ffffff",
  bgGray: "#f9fafb",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowHover: "0 8px 25px rgba(0,0,0,0.08)",
};

// Image Modal Component
function ImageModal({ imageUrl, alt, onClose }: { imageUrl: string; alt: string; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        cursor: "pointer",
      }}
      onClick={onClose}
    >
      <div style={{ maxWidth: "90vw", maxHeight: "90vh", position: "relative" }}>
        <img src={imageUrl} alt={alt} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            backgroundColor: "white",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            fontSize: "20px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { locale, setLocale } = useLanguage();
  const t = translations[locale as keyof typeof translations];
  const router = useRouter();
  const { id } = router.query;
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalAlt, setModalAlt] = useState<string>("");
  const [isImageHovered, setIsImageHovered] = useState(false);

  // Static product data
  const productImageMap: Record<string, string> = {
    sand: "/products/product2.jpg",
    "fine-sand": "/products/product3.jpg",
    aggregates: "/products/product1.jpg",
    "crusher-run": "/products/product6.jpg",
    "quarry-dust": "/products/product4.jpg",
    ballast: "/products/product5.jpg",
    "road-base": "/products/product7.jpg",
    "fill-material": "/products/product8.jpg",
  };

  const productDetails: Record<string, { titleKey: string; descKey: string; fullDescKey: string }> = {
    sand: { titleKey: "sandTitle", descKey: "sandDesc", fullDescKey: "sandFullDesc" },
    "fine-sand": { titleKey: "fineSandTitle", descKey: "fineSandDesc", fullDescKey: "fineSandFullDesc" },
    aggregates: { titleKey: "aggregatesTitle", descKey: "aggregatesDesc", fullDescKey: "aggregatesFullDesc" },
    "crusher-run": { titleKey: "crusherRunTitle", descKey: "crusherRunDesc", fullDescKey: "crusherRunFullDesc" },
    "quarry-dust": { titleKey: "quarryDustTitle", descKey: "quarryDustDesc", fullDescKey: "quarryDustFullDesc" },
    ballast: { titleKey: "ballastTitle", descKey: "ballastDesc", fullDescKey: "ballastFullDesc" },
    "road-base": { titleKey: "roadBaseTitle", descKey: "roadBaseDesc", fullDescKey: "roadBaseFullDesc" },
    "fill-material": { titleKey: "fillMaterialTitle", descKey: "fillMaterialDesc", fullDescKey: "fillMaterialFullDesc" },
  };

  const product = productDetails[id as string];
  const productImage = productImageMap[id as string];

  const openModal = (imageUrl: string, alt: string) => {
    setModalImage(imageUrl);
    setModalAlt(alt);
  };

  if (!product && router.isReady) {
    return (
      <div>
        <PublicHeader />
        <div style={{ padding: "6rem 2rem", textAlign: "center" }}>
          <h2 style={{ fontSize: "2rem", color: COLORS.textPrimary, marginBottom: "1rem" }}>
            Product Not Found
          </h2>
          <p style={{ color: COLORS.textSecondary, marginBottom: "2rem" }}>
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link 
            href="/products" 
            style={{
              display: "inline-block",
              backgroundColor: COLORS.primary,
              color: "white",
              padding: "0.75rem 2rem",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }
  if (!product) return null;

  const title = t[product.titleKey as keyof typeof t] as string;
  const desc = t[product.descKey as keyof typeof t] as string;
  const fullDesc = t[product.fullDescKey as keyof typeof t] as string;

  return (
    <div>
      <PublicHeader />

      {/* Image Modal */}
      {modalImage && (
        <ImageModal imageUrl={modalImage} alt={modalAlt} onClose={() => setModalImage(null)} />
      )}

      {/* ========== PRODUCT DETAIL ========== */}
      <section style={detailSectionStyle}>
        <div style={containerStyle}>
          <Link 
            href="/products" 
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "2rem",
              color: COLORS.primary,
              textDecoration: "none",
              fontWeight: "500",
              fontSize: "0.95rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.primaryDark;
              e.currentTarget.style.transform = "translateX(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.primary;
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> {t.backToProducts}
          </Link>

          <div style={detailCardStyle}>
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                borderRadius: "16px",
                marginBottom: "1.5rem",
                width: "100%",
                maxWidth: "500px",
              }}
              onMouseEnter={() => setIsImageHovered(true)}
              onMouseLeave={() => setIsImageHovered(false)}
              onClick={() => openModal(productImage, title)}
            >
              <img
                src={productImage}
                alt={title}
                style={{
                  width: "100%",
                  height: "350px",
                  borderRadius: "16px",
                  objectFit: "cover",
                  transition: "transform 0.4s ease",
                  transform: isImageHovered ? "scale(1.05)" : "scale(1)",
                }}
                onError={(e) => {
                  e.currentTarget.src = "/products/placeholder.jpg";
                  e.currentTarget.onerror = null;
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundColor: "rgba(245, 158, 11, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isImageHovered ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  borderRadius: "16px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    borderRadius: "50%",
                    padding: "16px",
                    color: "white",
                    fontSize: "1.8rem",
                    transition: "transform 0.2s ease",
                    transform: isImageHovered ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  <FontAwesomeIcon icon={faSearchPlus} />
                </div>
              </div>
            </div>

            <div style={{ width: "100%", maxWidth: "800px", textAlign: "center" }}>
              <span style={{
                display: "inline-block",
                background: `${COLORS.primary}15`,
                color: COLORS.primary,
                padding: "0.2rem 1rem",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: "600",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginBottom: "0.5rem",
              }}>
                Product Details
              </span>
              <h1 style={detailTitleStyle}>{title}</h1>
              <p style={detailDescStyle}>{desc}</p>
              <div style={detailFullDescStyle}>
                {fullDesc.split("\n").map((para: string, idx: number) => (
                  <p key={idx} style={{ marginBottom: "0.75rem" }}>{para}</p>
                ))}
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginBottom: "1.5rem",
                padding: "0.75rem",
                background: `${COLORS.success}10`,
                borderRadius: "8px",
                border: `1px solid ${COLORS.success}30`,
              }}>
                <FontAwesomeIcon icon={faCheckCircle} style={{ color: COLORS.success }} />
                <span style={{ color: COLORS.textSecondary, fontSize: "0.9rem" }}>
                  Premium quality guaranteed
                </span>
              </div>

              <Link 
                href="/contact" 
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor: COLORS.primary,
                  color: "white",
                  padding: "0.8rem 2.5rem",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "1.05rem",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(245, 158, 11, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.primary;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.3)";
                }}
              >
                {t.requestQuote}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========== THREE COLUMN FOOTER ========== */}
      <section style={threeColumnSectionStyle}>
        <div style={threeColumnContainerStyle}>
          <div style={servicesColumnStyle}>
            <h3 style={columnHeadingStyle}>{t.servicesTitle}</h3>
            <ul style={servicesListSingleStyle}>
              {(t.servicesList || []).map((service: string, idx: number) => (
                <li key={idx} style={serviceItemStyle}>
                  <span style={{ color: COLORS.primary, marginRight: "0.5rem" }}>▸</span>
                  {service}
                </li>
              ))}
            </ul>
          </div>
          <div style={environmentalColumnStyle}>
            <div style={logoWrapperStyle}>
              <svg width="120" height="34" viewBox="0 0 160 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 36 L25 14 L38 27 L52 9 L70 31 L84 18 L102 36" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M102 36 L115 22 L128 34 L142 18 L155 36" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <text x="24" y="20" fontFamily="serif" fontSize="16" fill="#f59e0b" fontWeight="bold">恒</text>
                <text x="52" y="25" fontFamily="Arial, sans-serif" fontSize="12" fill="currentColor" fontWeight="bold">HENG YUN</text>
              </svg>
            </div>
            <h4 style={environmentalHeadingStyle}>{t.environmentalTitle}</h4>
            <p style={environmentalTextStyle}>{t.environmentalText}</p>
          </div>
          <div style={contactColumnStyle}>
            <h3 style={columnHeadingStyle}>{t.contactUsHeading}</h3>
            <address style={contactAddressStyle}>
              <div>{(t.address || "").split('\n').map((line: string, i: number) => <span key={i}>{line}<br /></span>)}</div>
              <p><strong>{t.phoneLabel}:</strong> {t.phone}</p>
              <p><strong>{t.emailLabel}:</strong> {t.email}</p>
            </address>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer style={footerStyle}>
        <div style={footerContainerStyle}>
          <p>{t.footerText}</p>
        </div>
      </footer>
    </div>
  );
}

// ========== STYLES ==========
const detailSectionStyle: React.CSSProperties = {
  padding: "4rem 2rem",
  backgroundColor: "white",
  minHeight: "60vh",
};
const containerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "0 1rem",
};
const detailCardStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  padding: "2rem",
  borderRadius: "16px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
};
const detailTitleStyle: React.CSSProperties = {
  fontSize: "2.2rem",
  marginBottom: "0.75rem",
  color: "#1f2937",
  fontWeight: "700",
};
const detailDescStyle: React.CSSProperties = {
  fontSize: "1.1rem",
  color: "#4b5563",
  marginBottom: "1rem",
  maxWidth: "700px",
};
const detailFullDescStyle: React.CSSProperties = {
  fontSize: "1rem",
  color: "#6b7280",
  lineHeight: "1.8",
  marginBottom: "1.5rem",
  maxWidth: "800px",
  textAlign: "left",
};
const threeColumnSectionStyle: React.CSSProperties = {
  padding: "4rem 2rem",
  backgroundColor: "#2d3748",
};
const threeColumnContainerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "2rem",
  alignItems: "start",
};
const servicesColumnStyle: React.CSSProperties = { textAlign: "left" };
const servicesListSingleStyle: React.CSSProperties = {
  listStyle: "none",
  paddingLeft: 0,
  margin: 0,
};
const serviceItemStyle: React.CSSProperties = {
  marginBottom: "0.5rem",
  fontSize: "0.95rem",
  color: "#e2e8f0",
};
const columnHeadingStyle: React.CSSProperties = {
  fontSize: "1.4rem",
  marginBottom: "1rem",
  color: "white",
  borderLeft: "4px solid #f59e0b",
  paddingLeft: "0.75rem",
  fontWeight: "700",
};
const environmentalColumnStyle: React.CSSProperties = { textAlign: "center" };
const logoWrapperStyle: React.CSSProperties = {
  marginBottom: "1rem",
  display: "flex",
  justifyContent: "center",
};
const environmentalHeadingStyle: React.CSSProperties = {
  fontSize: "1.2rem",
  marginBottom: "0.75rem",
  color: "white",
  fontWeight: "600",
};
const environmentalTextStyle: React.CSSProperties = {
  fontSize: "0.95rem",
  lineHeight: "1.6",
  color: "#cbd5e1",
};
const contactColumnStyle: React.CSSProperties = {
  textAlign: "left",
  marginLeft: "40%",
};
const contactAddressStyle: React.CSSProperties = {
  fontStyle: "normal",
  color: "#e2e8f0",
  fontSize: "0.95rem",
  lineHeight: "1.8",
};
const footerStyle: React.CSSProperties = {
  backgroundColor: "#1a202c",
  color: "#a0aec0",
  textAlign: "center",
  padding: "1.5rem",
  borderTop: "1px solid #2d3748",
};
const footerContainerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  fontSize: "0.85rem",
};