"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";
import PublicHeader from "@/components/PublicHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearchPlus, faArrowRight } from "@fortawesome/free-solid-svg-icons";

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

// ========== GLOBAL STYLES ==========
const globalStyles = `
  /* Image hover overlay (zoom) */
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

  /* Card hover effects */
  .card-hover {
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .card-hover:hover {
    transform: translateY(-5px);
    box-shadow: ${COLORS.shadowHover};
  }

  /* Product grid – 2 columns on small screens */
  .product-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
    margin-bottom: 2rem;
  }
  @media (max-width: 1024px) {
    .product-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  @media (max-width: 640px) {
    .product-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 1rem;
    }
  }

  /* Carousel dots */
  .carousel-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    cursor: pointer;
    background: rgba(255,255,255,0.5);
    transition: background 0.3s;
  }
  .carousel-dot.active {
    background: ${COLORS.primary};
  }

  /* Section titles */
  .section-title {
    font-size: 2.2rem !important;
    font-weight: 700 !important;
    margin-bottom: 1rem !important;
    color: ${COLORS.textPrimary};
    text-align: center;
  }
  .section-subtitle {
    font-size: 1.1rem !important;
    color: ${COLORS.textSecondary};
    line-height: 1.6;
    max-width: 700px;
    margin: 0 auto 2rem auto !important;
    text-align: center;
  }
  .card-title {
    font-size: 1.3rem !important;
    font-weight: 700 !important;
    margin: 1rem 0 0.5rem !important;
    color: ${COLORS.textPrimary};
  }
  .card-description {
    font-size: 0.95rem !important;
    color: ${COLORS.textSecondary};
    line-height: 1.5;
    padding: 0 1rem 1rem;
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

  /* Hero carousel full viewport */
  .hero-carousel {
    height: 100vh !important;
    min-height: 600px;
    width: 100%;
    position: relative;
    overflow: hidden;
  }
`;

// ========== IMAGE MODAL (matching the UI from your screenshot) ==========
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
        {/* Close button – large, clean, top‑right */}
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

// ========== MAIN COMPONENT ==========
export default function Home() {
  const { locale } = useLanguage();
  const t = translations[locale as keyof typeof translations];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [facilitySlide, setFacilitySlide] = useState(0);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalAlt, setModalAlt] = useState<string>("");

  // Hero slides
  const slides = [
    {
      image: "/homeslide/slide1imageofcrusher.jpg",
      heading: t.slide1Heading,
      paragraph: t.slide1Paragraph,
      button: "contact",
    },
    {
      image: "/homeslide/slide2image.jpg",
      heading: t.slide2Heading,
      paragraph: t.slide2Paragraph,
      button: "services",
    },
    {
      image: "/homeslide/slide3image.jpg",
      heading: t.slide3Heading,
      paragraph: "",
      button: "none",
    },
  ];

  const facilityImages = [
    "/operations/facility1.jpg",
    "/operations/facility2.jpg",
    "/operations/facility3.jpg",
    "/operations/facility4.jpg",
    "/operations/facility5.jpg",
    "/operations/facility6.jpg",
  ];

  // Auto‑slide hero
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      window.scrollTo(0, 0);
    }
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  const nextFacility = () => setFacilitySlide((prev) => (prev + 1) % facilityImages.length);
  const prevFacility = () => setFacilitySlide((prev) => (prev - 1 + facilityImages.length) % facilityImages.length);

  const openModal = (imageUrl: string, alt: string) => {
    setModalImage(imageUrl);
    setModalAlt(alt);
  };

  return (
    <div>
      <style>{globalStyles}</style>
      <PublicHeader />

      {/* Image Modal */}
      {modalImage && <ImageModal imageUrl={modalImage} alt={modalAlt} onClose={() => setModalImage(null)} />}

      {/* ========== HERO CAROUSEL – FULL VIEWPORT ========== */}
      <div className="hero-carousel">
        {slides.map((slide, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              transition: "opacity 0.6s ease-in-out",
              opacity: index === currentSlide ? 1 : 0,
              zIndex: index === currentSlide ? 2 : 1,
              backgroundImage: `url(${slide.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1 }} />
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              color: "white",
              zIndex: 2,
              width: "80%",
              maxWidth: "800px",
            }}>
              {slide.heading && <h1 style={{ fontSize: "3rem", marginBottom: "1rem", fontWeight: "700" }}>{slide.heading}</h1>}
              {slide.paragraph && <p style={{ fontSize: "1.3rem", marginBottom: "1.5rem" }}>{slide.paragraph}</p>}
              {slide.button === "contact" && (
                <Link href="/contact" style={{ backgroundColor: "transparent", color: "#f59e0b", border: "2px solid #f59e0b", padding: "0.75rem 1.5rem", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", display: "inline-block" }}>{t.contactButton}</Link>
              )}
              {slide.button === "services" && (
                <Link href="#services-section" style={{ backgroundColor: "transparent", color: "#f59e0b", border: "2px solid #f59e0b", padding: "0.75rem 1.5rem", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", display: "inline-block" }}>{t.servicesButton}</Link>
              )}
            </div>
          </div>
        ))}
        <button onClick={prevSlide} style={{ position: "absolute", top: "50%", left: "20px", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "white", border: "none", fontSize: "2rem", padding: "0.5rem 1.2rem", cursor: "pointer", zIndex: 10, borderRadius: "8px" }}>❮</button>
        <button onClick={nextSlide} style={{ position: "absolute", top: "50%", right: "20px", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "white", border: "none", fontSize: "2rem", padding: "0.5rem 1.2rem", cursor: "pointer", zIndex: 10, borderRadius: "8px" }}>❯</button>
        <div style={{ position: "absolute", bottom: "30px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "12px", zIndex: 10 }}>
          {slides.map((_, idx) => (
            <span key={idx} onClick={() => setCurrentSlide(idx)} className={`carousel-dot ${idx === currentSlide ? "active" : ""}`} />
          ))}
        </div>
      </div>

      {/* ========== ABOUT SECTION ========== */}
      <section style={{ padding: "4rem 2rem", backgroundColor: COLORS.bgWhite }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "2rem", alignItems: "center" }}>
          <div style={{ flex: "1", minWidth: "250px" }}>
            <h2 style={{ fontSize: "2.2rem", marginBottom: "1rem", color: COLORS.textPrimary, borderLeft: `4px solid ${COLORS.primary}`, paddingLeft: "1rem", fontWeight: "700" }}>{t.aboutTitle}</h2>
            <p style={{ fontSize: "1.05rem", lineHeight: "1.6", color: COLORS.textSecondary }}>{t.aboutText}</p>
          </div>
          <div style={{ flex: "1", minWidth: "250px" }}>
            <video width="100%" controls style={{ borderRadius: "8px", display: "block", aspectRatio: "16/9", objectFit: "cover" }}>
              <source src="/video/video1.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "0.9rem", color: COLORS.textMuted }}>{t.watchVideo}</div>
          </div>
        </div>
      </section>

      {/* ========== FACILITIES CARDS ========== */}
      <section style={{ padding: "4rem 2rem", backgroundColor: COLORS.bgGray }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h2 className="section-title">{t.facilitiesTitle}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
            {[
              {
                img: "https://images.pexels.com/photos/162639/digger-machine-machinery-construction-162639.jpeg",
                title: t.meticulousPlanningTitle,
                desc: t.meticulousPlanningDesc,
              },
              {
                img: "https://images.pexels.com/photos/31925745/pexels-photo-31925745.jpeg",
                title: t.perfectExecutionTitle,
                desc: t.perfectExecutionDesc,
              },
              {
                img: "https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg",
                title: t.completionOnTimeTitle,
                desc: t.completionOnTimeDesc,
              },
            ].map((card, idx) => (
              <div key={idx} className="card-hover" style={{ backgroundColor: COLORS.bgWhite, borderRadius: "12px", overflow: "hidden", boxShadow: COLORS.shadow }}>
                <div className="image-hover-container" onClick={() => openModal(card.img, card.title)} style={{ height: "220px" }}>
                  <img src={card.img} alt={card.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div className="image-overlay">
                    <div className="zoom-icon"><FontAwesomeIcon icon={faSearchPlus} /></div>
                  </div>
                </div>
                <h3 className="card-title">{card.title}</h3>
                <p className="card-description">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== OPERATION FACILITIES CAROUSEL ========== */}
      <section style={{ padding: "4rem 2rem", backgroundColor: COLORS.bgWhite }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h2 className="section-title">{t.operationFacilitiesTitle}</h2>
          <div style={{ position: "relative", width: "100%", maxWidth: "900px", margin: "0 auto", overflow: "hidden" }}>
            <div
              className="image-hover-container"
              onClick={() => openModal(facilityImages[facilitySlide], `Facility ${facilitySlide + 1}`)}
              style={{ width: "100%", height: "400px", borderRadius: "8px", overflow: "hidden" }}
            >
              <img
                src={facilityImages[facilitySlide]}
                alt={`Facility ${facilitySlide + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div className="image-overlay">
                <div className="zoom-icon"><FontAwesomeIcon icon={faSearchPlus} /></div>
              </div>
            </div>
            <button onClick={prevFacility} style={{ position: "absolute", top: "50%", left: "10px", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "white", border: "none", fontSize: "2rem", padding: "0.5rem 1rem", cursor: "pointer", borderRadius: "4px", zIndex: 5 }}>❮</button>
            <button onClick={nextFacility} style={{ position: "absolute", top: "50%", right: "10px", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "white", border: "none", fontSize: "2rem", padding: "0.5rem 1rem", cursor: "pointer", borderRadius: "4px", zIndex: 5 }}>❯</button>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "1rem" }}>
              {facilityImages.map((_, idx) => (
                <span key={idx} onClick={() => setFacilitySlide(idx)} className={`carousel-dot ${idx === facilitySlide ? "active" : ""}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== PRODUCTS GRID ========== */}
      <section style={{ padding: "4rem 2rem", backgroundColor: COLORS.bgGray }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h2 className="section-title">{t.productsTitle}</h2>
          <p className="section-subtitle">{t.productsDesc}</p>
          <div className="product-grid">
            {[
              { img: "/products/product1.jpg", title: t.aggregatesTitle, desc: t.aggregatesDesc },
              { img: "/products/product2.jpg", title: t.sandTitle, desc: t.sandDesc },
              { img: "/products/product3.jpg", title: t.otherSandTitle, desc: t.otherSandDesc },
              { img: "/products/product4.jpg", title: t.quarryDustTitle, desc: t.quarryDustDesc },
              { img: "/products/product5.jpg", title: t.ballastTitle, desc: t.ballastDesc },
              { img: "/products/product6.jpg", title: t.crusherRunTitle, desc: t.crusherRunDesc },
              { img: "/products/product7.jpg", title: t.roadBaseTitle, desc: t.roadBaseDesc },
              { img: "/products/product8.jpg", title: t.fillMaterialTitle, desc: t.fillMaterialDesc },
            ].map((product, idx) => (
              <div key={idx} className="card-hover" style={{ backgroundColor: COLORS.bgWhite, borderRadius: "12px", overflow: "hidden", boxShadow: COLORS.shadow }}>
                <div className="image-hover-container" onClick={() => openModal(product.img, product.title)} style={{ height: "220px" }}>
                  <img src={product.img} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div className="image-overlay">
                    <div className="zoom-icon"><FontAwesomeIcon icon={faSearchPlus} /></div>
                  </div>
                </div>
                <h3 className="card-title">{product.title}</h3>
                <p className="card-description">{product.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/products" className="btn-primary">{t.seeAllProducts}</Link>
        </div>
      </section>

      {/* ========== THREE‑COLUMN FOOTER ========== */}
      <section id="services-section" style={{ padding: "4rem 2rem", backgroundColor: "#2d3748" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", alignItems: "start" }}>
          <div style={{ textAlign: "left" }}>
            <h3 style={{ fontSize: "1.4rem", marginBottom: "1rem", color: "white", borderLeft: `4px solid ${COLORS.primary}`, paddingLeft: "0.75rem", fontWeight: "700" }}>{t.servicesTitle}</h3>
            <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
              {(t.servicesList || []).map((service, idx) => (
                <li key={idx} className="service-text" style={{ marginBottom: "0.5rem", fontSize: "0.95rem", color: "#e2e8f0" }}>
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
            <h4 style={{ fontSize: "1.2rem", marginBottom: "0.75rem", color: "white", fontWeight: "600" }}>{t.environmentalTitle}</h4>
            <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#cbd5e1" }}>{t.environmentalText}</p>
          </div>
          <div style={{ textAlign: "left" }}>
            <h3 style={{ fontSize: "1.4rem", marginBottom: "1rem", color: "white", borderLeft: `4px solid ${COLORS.primary}`, paddingLeft: "0.75rem", fontWeight: "700" }}>{t.contactUsHeading}</h3>
            <address style={{ fontStyle: "normal", color: "#e2e8f0", fontSize: "0.95rem", lineHeight: "1.8" }}>
              <div>{(t.address || "").split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}</div>
              <p><strong>{t.phoneLabel}:</strong> 0786592766</p>
              <p><strong>{t.emailLabel}:</strong> hengyunquarry@gmail.com</p>
            </address>
          </div>
        </div>
      </section>

      {/* ========== FINAL FOOTER ========== */}
      <footer style={{ backgroundColor: "#1a202c", color: "#a0aec0", textAlign: "center", padding: "1.5rem", borderTop: "1px solid #2d3748" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", fontSize: "0.85rem" }}>
          <p>{t.footerText}</p>
        </div>
      </footer>
    </div>
  );
}