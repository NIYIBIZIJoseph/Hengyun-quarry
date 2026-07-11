"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";
import PublicHeader from "@/components/PublicHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearchPlus } from "@fortawesome/free-solid-svg-icons";

// ========== DESIGN TOKENS (same as Home/Products) ==========
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

// ========== GLOBAL STYLES (same as Products) ==========
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

  /* Point card with icon */
  .point-card {
    text-align: center;
    padding: 2rem 1.5rem;
    background: ${COLORS.bgWhite};
    border-radius: 12px;
    box-shadow: ${COLORS.shadow};
    transition: all 0.3s ease;
    cursor: default;
  }
  .point-card:hover {
    transform: translateY(-4px);
    box-shadow: ${COLORS.shadowHover};
  }
  .point-icon {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    display: block;
  }
  .point-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: ${COLORS.textPrimary};
    margin-bottom: 0.5rem;
  }
  .point-desc {
    font-size: 0.9rem;
    color: ${COLORS.textSecondary};
    line-height: 1.6;
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

// ========== IMAGE MODAL (same as Products) ==========
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

// ========== PRODUCT CARD (unchanged) ==========
function ProductCard({ product, onImageClick, orderNowText, getStockMessage }: { 
  product: any; 
  onImageClick: (url: string, name: string) => void; 
  orderNowText: string;
  getStockMessage: (stock: number, reorderLevel: number) => { text: string; color: string };
}) {
  const stockMsg = getStockMessage(product.stock_quantity, product.reorder_level);

  return (
    <div
      className="card-hover"
      style={{
        backgroundColor: COLORS.bgWhite,
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: COLORS.shadow,
        display: "flex",
        flexDirection: "column",
        cursor: "default",
      }}
    >
      <div
        className="image-hover-container"
        onClick={() => onImageClick(product.image_url || "/products/placeholder.jpg", product.name)}
        style={{ height: "200px" }}
      >
        <img
          src={product.image_url || "/products/placeholder.jpg"}
          alt={product.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => { e.currentTarget.src = "/products/placeholder.jpg"; }}
        />
        <div className="image-overlay">
          <div className="zoom-icon"><FontAwesomeIcon icon={faSearchPlus} /></div>
        </div>
      </div>
      <div style={{ padding: "1rem", textAlign: "left" }}>
        <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", color: COLORS.textPrimary, fontWeight: "600" }}>
          {product.name}
        </h3>
        <p><strong>Category:</strong> {product.category_name}</p>
        <p><strong>Price:</strong> {product.price?.toLocaleString()} RWF / m³</p>
        <p style={{ color: stockMsg.color }}><strong>Availability:</strong> {stockMsg.text}</p>
        <button
          onClick={() => {
            const event = new CustomEvent('openOrderModal', { detail: product });
            window.dispatchEvent(event);
          }}
          className="btn-primary"
          style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.95rem" }}
        >
          {orderNowText}
        </button>
      </div>
    </div>
  );
}

// ========== MAIN COMPONENT ==========
export default function MarketHome() {
  const { locale } = useLanguage();
  const t = translations[locale as keyof typeof translations];

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalAlt, setModalAlt] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    productName: "",
    quantity: "",
    bargaining: "",
    location: "",
    note: "",
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/public/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleOpenModal = (e: CustomEvent) => {
      setActiveProduct(e.detail);
      setFormData({
        name: "",
        phone: "",
        productName: e.detail.name,
        quantity: "",
        bargaining: "",
        location: "",
        note: "",
      });
    };
    window.addEventListener('openOrderModal', handleOpenModal as EventListener);
    return () => window.removeEventListener('openOrderModal', handleOpenModal as EventListener);
  }, []);

  const openImageModal = (imageUrl: string, alt: string) => {
    setModalImage(imageUrl);
    setModalAlt(alt);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const items = [{
      product_id: activeProduct.id,
      quantity: parseInt(formData.quantity)
    }];
    const res = await fetch("/api/public/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: formData.name,
        client_phone: formData.phone,
        delivery_location: formData.location,
        items: items,
        notes: formData.note,
        bargaining: formData.bargaining,
      }),
    });
    if (res.ok) {
      setSubmitted(true);
      setActiveProduct(null);
      setFormData({
        name: "",
        phone: "",
        productName: "",
        quantity: "",
        bargaining: "",
        location: "",
        note: "",
      });
      setTimeout(() => setSubmitted(false), 3000);
    } else {
      const errorData = await res.json();
      alert(`Order failed: ${errorData.error || "Please try again."}`);
    }
  };

  const getStockMessage = (stock: number, reorderLevel: number) => {
    if (stock <= 0) return { text: "Out of stock – we will contact you", color: "#dc2626" };
    if (stock <= reorderLevel) return { text: "Low stock – order soon", color: "#f59e0b" };
    return { text: "In stock", color: "#10b981" };
  };

  if (loading) return (
    <div>
      <PublicHeader />
      <div style={{ textAlign: "center", padding: "4rem" }}>Loading products...</div>
    </div>
  );

  return (
    <div>
      <style>{globalStyles}</style>
      <PublicHeader />

      {/* Image Modal */}
      {modalImage && (
        <ImageModal imageUrl={modalImage} alt={modalAlt} onClose={() => setModalImage(null)} />
      )}

      {/* ========== HERO – matches Products page ========== */}
      <div style={{
        height: "450px",
        backgroundImage: "url('/products/product2.jpg')",
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
            {t.marketHeroTitle}
          </h1>
          <p style={{
            color: "white",
            fontSize: "1.2rem",
            maxWidth: "700px",
            opacity: 0.9,
          }}>
            {t.marketHeroDesc}
          </p>
        </div>
      </div>

      {/* ========== THREE POINTS WITH ICONS ========== */}
      <section style={{ padding: "4rem 2rem", backgroundColor: COLORS.bgGray }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
          <div className="point-card">
            <span className="point-icon">💰</span>
            <h3 className="point-title">{t.goodPriceTitle}</h3>
            <p className="point-desc">{t.goodPriceDesc}</p>
          </div>
          <div className="point-card">
            <span className="point-icon">⭐</span>
            <h3 className="point-title">{t.bestServicesTitle}</h3>
            <p className="point-desc">{t.bestServicesDesc}</p>
          </div>
          <div className="point-card">
            <span className="point-icon">🚚</span>
            <h3 className="point-title">{t.quickDeliveryTitle}</h3>
            <p className="point-desc">{t.quickDeliveryDesc}</p>
          </div>
        </div>
      </section>

      {/* ========== PRODUCTS GRID (unchanged) ========== */}
      <section style={{ padding: "4rem 2rem", backgroundColor: COLORS.bgWhite }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 className="section-title">{t.availableProducts}</h2>
          {products.length === 0 ? (
            <p style={{ textAlign: "center", color: COLORS.textSecondary }}>No products available yet.</p>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
              gap: "2rem",
              marginTop: "2rem",
            }}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onImageClick={openImageModal}
                  orderNowText={t.orderNow}
                  getStockMessage={getStockMessage}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========== ORDER MODAL (unchanged) ========== */}
      {activeProduct && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
          }}
          onClick={() => setActiveProduct(null)}
        >
          <div 
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "1.5rem",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "85vh",
              overflowY: "auto",
              position: "relative",
              boxShadow: "0 20px 30px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveProduct(null)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "none",
                border: "none",
                fontSize: "1.8rem",
                cursor: "pointer",
                color: "#6b7280",
                zIndex: 100000,
              }}
            >
              ×
            </button>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: COLORS.textPrimary, paddingRight: "1.5rem" }}>
              {t.orderFormTitle}
            </h3>
            {submitted && (
              <div style={{ backgroundColor: "#10b981", color: "white", padding: "0.5rem", borderRadius: "6px", textAlign: "center", marginBottom: "1rem" }}>
                ✓ {t.requestSubmitted}
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input type="text" name="name" placeholder={t.fullName} value={formData.name} onChange={handleFormChange} required style={inputStyle} />
              <input type="tel" name="phone" placeholder={t.phoneLabel} value={formData.phone} onChange={handleFormChange} required style={inputStyle} />
              <input type="text" name="productName" value={formData.productName} readOnly style={{ ...inputStyle, backgroundColor: "#f3f4f6" }} />
              <input type="text" name="quantity" placeholder={t.quantity} value={formData.quantity} onChange={handleFormChange} required style={inputStyle} />
              <input type="text" name="bargaining" placeholder={t.bargaining} value={formData.bargaining} onChange={handleFormChange} style={inputStyle} />
              <input type="text" name="location" placeholder={t.location} value={formData.location} onChange={handleFormChange} required style={inputStyle} />
              <textarea name="note" placeholder={t.note} value={formData.note} onChange={handleFormChange} rows={3} style={{ ...inputStyle, fontFamily: "inherit" }} />
              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button type="button" onClick={() => setActiveProduct(null)} style={{ backgroundColor: "#e5e7eb", color: "#1f2937", padding: "0.5rem 1rem", borderRadius: "6px", border: "none", cursor: "pointer" }}>
                  {t.cancel}
                </button>
                <button type="submit" style={{ backgroundColor: COLORS.primary, color: "#1f2937", padding: "0.5rem 1rem", borderRadius: "6px", border: "none", fontWeight: "bold", cursor: "pointer" }}>
                  {t.submitRequest}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== THREE‑COLUMN FOOTER ========== */}
      <section style={{ padding: "4rem 2rem", backgroundColor: "#2d3748" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", alignItems: "start" }}>
          <div style={{ textAlign: "left" }}>
            <h3 style={{ fontSize: "1.4rem", marginBottom: "1rem", color: "white", borderLeft: `4px solid ${COLORS.primary}`, paddingLeft: "0.75rem", fontWeight: "700" }}>
              {t.servicesTitle}
            </h3>
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
                <text x="52" y="25" fontFamily="Arial" fontSize="12" fill="currentColor" fontWeight="bold">HENG YUN</text>
              </svg>
            </div>
            <h4 style={{ fontSize: "1.2rem", marginBottom: "0.75rem", color: "white", fontWeight: "600" }}>{t.environmentalTitle}</h4>
            <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#cbd5e1" }}>{t.environmentalText}</p>
          </div>
          <div style={{ textAlign: "left" }}>
            <h3 style={{ fontSize: "1.4rem", marginBottom: "1rem", color: "white", borderLeft: `4px solid ${COLORS.primary}`, paddingLeft: "0.75rem", fontWeight: "700" }}>
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
      <footer style={{ backgroundColor: "#1a202c", color: "#a0aec0", textAlign: "center", padding: "1.5rem", borderTop: "1px solid #2d3748" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", fontSize: "0.85rem" }}>
          <p>{t.footerText}</p>
        </div>
      </footer>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.75rem",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "1rem",
  width: "100%",
  boxSizing: "border-box",
};