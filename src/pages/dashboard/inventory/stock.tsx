// src/pages/dashboard/inventory/stock.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBox, faExclamationTriangle, faCheckCircle, faTimesCircle,
  faChartLine, faPlus, faArrowLeft, faSearch,
  faTruck, faEye, faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  bgGray: "#f9fafb",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowHover: "0 8px 25px rgba(0,0,0,0.08)",
};

interface Product {
  id: number;
  name: string;
  category_name: string;
  stock_quantity: number;
  reorder_level: number;
  is_active: boolean;
}

interface TopProduct {
  name: string;
  total_sold: number;
}

// ========== STOCK BADGE ==========
function StockBadge({ product }: { product: Product }) {
  const { t } = useTranslation();
  
  if (product.stock_quantity === 0) {
    return (
      <span style={{
        background: '#fee2e2',
        color: '#991b1b',
        padding: '0.15rem 0.6rem',
        borderRadius: '20px',
        fontSize: '0.7rem',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.2rem',
      }}>
        <FontAwesomeIcon icon={faTimesCircle} style={{ fontSize: '0.5rem' }} />
        {t('outOfStock') || 'Out of Stock'}
      </span>
    );
  }
  if (product.stock_quantity <= product.reorder_level) {
    return (
      <span style={{
        background: '#fef3c7',
        color: '#d97706',
        padding: '0.15rem 0.6rem',
        borderRadius: '20px',
        fontSize: '0.7rem',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.2rem',
      }}>
        <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '0.5rem' }} />
        {t('lowStock') || 'Low Stock'}
      </span>
    );
  }
  return (
    <span style={{
      background: '#d1fae5',
      color: '#065f46',
      padding: '0.15rem 0.6rem',
      borderRadius: '20px',
      fontSize: '0.7rem',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.2rem',
    }}>
      <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '0.5rem' }} />
      {t('inStock') || 'In Stock'}
    </span>
  );
}

// ========== KPI CARD ==========
function KpiCard({ title, value, icon, color = COLORS.primary, bgColor = 'white' }: { 
  title: string; 
  value: string | number; 
  icon: any; 
  color?: string; 
  bgColor?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        background: bgColor,
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        boxShadow: isHovered ? COLORS.shadowHover : COLORS.shadow,
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        borderLeft: `4px solid ${color}`,
        cursor: 'default',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FontAwesomeIcon icon={icon} style={{ color, fontSize: '0.9rem' }} />
        <span style={{ fontSize: '0.75rem', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          {title}
        </span>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: '700', color: COLORS.textPrimary, marginTop: '0.25rem' }}>
        {value}
      </div>
    </div>
  );
}

// ========== PRODUCT CARD ==========
function ProductCard({ 
  product, 
  onRestock 
}: { 
  product: Product; 
  onRestock: (product: Product) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();
  
  const isOut = product.stock_quantity === 0;
  const isLow = product.stock_quantity <= product.reorder_level && product.stock_quantity > 0;

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        boxShadow: isHovered ? COLORS.shadowHover : COLORS.shadow,
        border: `1px solid ${isHovered ? COLORS.primary : COLORS.border}`,
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        borderLeft: isOut ? '4px solid #dc2626' : (isLow ? '4px solid #f59e0b' : '4px solid #10b981'),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: '600', fontSize: '1rem', color: COLORS.textPrimary }}>
            {product.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
            {product.category_name}
          </div>
        </div>
        <StockBadge product={product} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.5rem',
        marginTop: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: `1px solid ${COLORS.border}`,
      }}>
        <div>
          <div style={{ fontSize: '0.6rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            {t('stockLabel') || 'Stock'}
          </div>
          <div style={{ fontWeight: '600', fontSize: '1rem', color: COLORS.textPrimary }}>
            {product.stock_quantity} {t('units') || 'units'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.6rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            {t('reorderLevel') || 'Reorder Level'}
          </div>
          <div style={{ fontWeight: '600', fontSize: '1rem', color: COLORS.textPrimary }}>
            {product.reorder_level} {t('units') || 'units'}
          </div>
        </div>
      </div>

      <button
        onClick={() => onRestock(product)}
        style={{
          width: '100%',
          marginTop: '0.75rem',
          padding: '0.4rem',
          background: COLORS.primary,
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          color: 'white',
          fontWeight: '500',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.primaryDark;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.primary;
        }}
      >
        <FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.7rem' }} />
        {t('restock') || 'Restock'}
      </button>
    </div>
  );
}

export default function StockOverview() {
  const { t } = useTranslation();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState(0);
  const [restockReason, setRestockReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchProducts = async () => {
    const res = await fetch('/api/products', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : (data.data || []));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await fetchProducts();
        // Try to get top products from dashboard API
        try {
          const topRes = await fetch('/api/dashboard/top-products', { headers: getAuthHeaders() });
          if (topRes.ok) {
            const topData = await topRes.json();
            setTopProducts(Array.isArray(topData) ? topData.slice(0, 5) : []);
          }
        } catch (err) {
          console.error('Error fetching top products:', err);
          setTopProducts([]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRestock = async (product: Product) => {
    if (!restockQuantity || restockQuantity <= 0) {
      alert(t('validQuantityRequired') || 'Please enter a valid quantity');
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch('/api/stock/add', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          product_id: product.id,
          quantity: restockQuantity,
          reason: restockReason || (t('manualRestock') || 'Manual restock'),
        }),
      });
      if (res.ok) {
        await fetchProducts();
        setRestockProduct(null);
        setRestockQuantity(0);
        setRestockReason('');
        alert(t('stockAddedSuccess') || 'Stock added successfully');
      } else {
        const err = await res.json();
        alert(err.error || t('restockFailed') || 'Restock failed');
      }
    } catch (err) {
      console.error('Restock error:', err);
      alert(t('errorRestocking') || 'Error restocking');
    } finally {
      setUpdating(false);
    }
  };

  // Filter products by search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category_name?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const lowStockCount = products.filter(p => p.stock_quantity <= p.reorder_level && p.stock_quantity > 0).length;
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock_quantity, 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div style={{ 
          maxWidth: '600px', 
          margin: '4rem auto', 
          textAlign: 'center',
          padding: '3rem',
          background: 'white',
          borderRadius: '16px',
          boxShadow: COLORS.shadow,
        }}>
          <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '3rem', color: COLORS.danger, marginBottom: '1rem' }} />
          <h2 style={{ color: COLORS.textPrimary }}>Error Loading Stock</h2>
          <p style={{ color: COLORS.textMuted }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.6rem 1.5rem',
              background: COLORS.primary,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.85rem',
            }}
          >
            <FontAwesomeIcon icon={faSpinner} style={{ marginRight: '0.5rem' }} />
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
              <FontAwesomeIcon icon={faBox} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
              {t('stockOverview') || 'Stock Overview'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0.15rem 0 0 0' }}>
              {t('manageStock') || 'Monitor stock levels and manage inventory'}
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/inventory')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.25rem',
              background: COLORS.bgGray,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: COLORS.textSecondary,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.border;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.bgGray;
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> {t('back') || 'Back'}
          </button>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <KpiCard
            title={t('totalProducts') || 'Total Products'}
            value={products.length}
            icon={faBox}
            color={COLORS.info}
          />
          <KpiCard
            title={t('lowStock') || 'Low Stock'}
            value={lowStockCount}
            icon={faExclamationTriangle}
            color={COLORS.warning}
            bgColor={lowStockCount > 0 ? '#fef3c7' : 'white'}
          />
          <KpiCard
            title={t('outOfStock') || 'Out of Stock'}
            value={outOfStockCount}
            icon={faTimesCircle}
            color={COLORS.danger}
            bgColor={outOfStockCount > 0 ? '#fee2e2' : 'white'}
          />
          <KpiCard
            title={t('totalStockUnits') || 'Total Stock Units'}
            value={totalStockUnits}
            icon={faChartLine}
            color={COLORS.primary}
          />
        </div>

        {/* Fast-Moving Products */}
        {topProducts.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '0.75rem' }}>
              <FontAwesomeIcon icon={faTruck} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
              {t('fastMovingProducts') || 'Fast-Moving Products (Last 30 days)'}
            </h2>
            <div style={{
              background: COLORS.bgGray,
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              border: `1px solid ${COLORS.border}`,
            }}>
              {topProducts.map((p, idx) => {
                const product = products.find(prod => prod.name === p.name);
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0',
                      borderBottom: idx < topProducts.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: '500', color: COLORS.textPrimary }}>
                        {p.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginLeft: '0.5rem' }}>
                        {p.total_sold} {t('unitsSold') || 'units sold'}
                      </span>
                    </div>
                    {product && (
                      <button
                        onClick={() => setRestockProduct(product)}
                        style={{
                          background: COLORS.primary,
                          border: 'none',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: 'white',
                          fontSize: '0.75rem',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.primary;
                        }}
                      >
                        <FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.6rem' }} /> {t('restock') || 'Restock'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: '0.5rem' }}>
              {t('restockRecommendation') || 'Consider restocking these products first.'}
            </p>
          </div>
        )}

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
          <input
            type="text"
            placeholder={t('searchProducts') || 'Search products...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem 0.6rem 2.5rem',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '10px',
              fontSize: '0.85rem',
              background: 'white',
              transition: 'all 0.2s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.primary}20`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.border;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* All Products */}
        <h2 style={{ fontSize: '1rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '0.75rem' }}>
          <FontAwesomeIcon icon={faBox} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
          {t('allProductsStock') || 'All Products Stock'}
          <span style={{ fontSize: '0.75rem', color: COLORS.textMuted, fontWeight: '400', marginLeft: '0.5rem' }}>
            ({filteredProducts.length} {t('products') || 'products'})
          </span>
        </h2>

        {filteredProducts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            background: 'white',
            borderRadius: '12px',
            boxShadow: COLORS.shadow,
          }}>
            <FontAwesomeIcon icon={faBox} style={{ fontSize: '3rem', color: COLORS.textMuted, marginBottom: '1rem' }} />
            <h3 style={{ color: COLORS.textSecondary }}>{t('noProductsFound') || 'No products found'}</h3>
            <p style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>
              {t('tryAdjustingSearch') || 'Try adjusting your search'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}>
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onRestock={setRestockProduct}
              />
            ))}
          </div>
        )}

        {/* Restock Modal */}
        {restockProduct && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }} onClick={() => setRestockProduct(null)}>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '16px',
              width: '420px',
              maxWidth: '90%',
              boxShadow: COLORS.shadowHover,
            }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '0.25rem' }}>
                <FontAwesomeIcon icon={faPlus} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
                {t('restockProduct') || 'Restock'} {restockProduct.name}
              </h3>
              <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, marginBottom: '1rem' }}>
                {t('currentStock') || 'Current stock'}: <strong>{restockProduct.stock_quantity}</strong> {t('units') || 'units'}
                <br />
                {t('reorderLevel') || 'Reorder Level'}: <strong>{restockProduct.reorder_level}</strong> {t('units') || 'units'}
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                  {t('quantityToAdd') || 'Quantity to add (units)'} *
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={restockQuantity}
                  onChange={e => setRestockQuantity(parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = COLORS.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = COLORS.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                  {t('reasonOptional') || 'Reason (optional)'}
                </label>
                <input
                  type="text"
                  placeholder={t('enterReason') || 'Enter reason...'}
                  value={restockReason}
                  onChange={e => setRestockReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  onClick={() => setRestockProduct(null)}
                  style={{
                    padding: '0.5rem 1.5rem',
                    background: COLORS.bgGray,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: COLORS.textSecondary,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.border;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.bgGray;
                  }}
                  disabled={updating}
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  onClick={() => handleRestock(restockProduct)}
                  disabled={updating}
                  style={{
                    padding: '0.5rem 1.5rem',
                    background: COLORS.primary,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: updating ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    color: 'white',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    opacity: updating ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                  onMouseEnter={(e) => {
                    if (!updating) {
                      e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!updating) {
                      e.currentTarget.style.backgroundColor = COLORS.primary;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {updating ? (
                    <FontAwesomeIcon icon={faSpinner} spin /> 
                  ) : (
                    <FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.7rem' }} />
                  )}
                  {updating ? (t('adding') || 'Adding...') : (t('addStock') || 'Add Stock')}
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx global>{`
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid ${COLORS.border};
            border-top-color: ${COLORS.primary};
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
}