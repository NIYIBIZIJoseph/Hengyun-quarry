import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import Papa from 'papaparse';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrashAlt, faBoxOpen, 
  faBox, faExclamationTriangle, faCheckCircle, 
  faEye, faWarehouse, faChartLine, faFileExport, faSpinner,
  faSearch
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
  bgWhite: "#ffffff",
  bgGray: "#f9fafb",
  bgLightGray: "#f3f4f6",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowHover: "0 8px 25px rgba(0,0,0,0.08)",
};

interface Product {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  price: number;
  stock_quantity: number;
  description: string;
  image_url: string;
  reorder_level: number;
  is_active: boolean;
  sku?: string;
  updated_at?: string;
}

// ========== KPI CARD COMPONENT ==========
function KpiCard({ title, value, icon, color = COLORS.primary, bgColor = 'white' }: { title: string; value: string | number; icon: any; color?: string; bgColor?: string }) {
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

// ========== STOCK BADGE ==========
function StockBadge({ product }: { product: Product }) {
  const { t } = useTranslation();
  
  if (product.stock_quantity === 0) {
    return (
      <span style={{
        background: '#fee2e2',
        color: '#dc2626',
        padding: '0.2rem 0.6rem',
        borderRadius: '12px',
        fontSize: '0.7rem',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.2rem',
      }}>
        <FontAwesomeIcon icon={faBoxOpen} style={{ fontSize: '0.5rem' }} />
        {t('outOfStock')}
      </span>
    );
  }
  
  if (product.stock_quantity <= product.reorder_level) {
    return (
      <span style={{
        background: '#fef3c7',
        color: '#b45309',
        padding: '0.2rem 0.6rem',
        borderRadius: '12px',
        fontSize: '0.7rem',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.2rem',
      }}>
        <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '0.5rem' }} />
        {t('lowStock')} ({product.stock_quantity})
      </span>
    );
  }
  
  return (
    <span style={{
      background: '#d1fae5',
      color: '#065f46',
      padding: '0.2rem 0.6rem',
      borderRadius: '12px',
      fontSize: '0.7rem',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.2rem',
    }}>
      <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '0.5rem' }} />
      {product.stock_quantity} {t('inStock')}
    </span>
  );
}

// ========== PRODUCT ROW COMPONENT - HOOKS AT TOP LEVEL ==========
function ProductRow({ 
  product, 
  onEdit, 
  onDelete, 
  onSelect 
}: { 
  product: Product; 
  onEdit: (product: Product) => void; 
  onDelete: (id: number) => void; 
  onSelect: (product: Product) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

  return (
    <tr
      style={{
        borderBottom: `1px solid ${COLORS.border}`,
        backgroundColor: isHovered ? COLORS.bgGray : 'transparent',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(product)}
    >
      <td style={{ padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src={product.image_url || '/placeholder.jpg'}
            alt={product.name}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              objectFit: 'cover',
              border: `1px solid ${COLORS.border}`,
            }}
            onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
          />
          <span style={{ fontWeight: '500', fontSize: '0.85rem', color: COLORS.textPrimary }}>{product.name}</span>
        </div>
      </td>
      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>{product.category_name}</td>
      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600', color: COLORS.primary }}>
        {product.price?.toLocaleString()}
      </td>
      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
        <StockBadge product={product} />
      </td>
      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
        {product.is_active ? (
          <span style={{ color: COLORS.success, fontSize: '0.75rem' }}>
            <FontAwesomeIcon icon={faCheckCircle} /> {t('active') || 'Active'}
          </span>
        ) : (
          <span style={{ color: COLORS.textMuted, fontSize: '0.75rem' }}>
            {t('inactive') || 'Inactive'}
          </span>
        )}
      </td>
      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
          <button
            onClick={() => onEdit(product)}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.info,
              cursor: 'pointer',
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              transition: 'all 0.2s',
              fontSize: '0.85rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${COLORS.info}15`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.danger,
              cursor: 'pointer',
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              transition: 'all 0.2s',
              fontSize: '0.85rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${COLORS.danger}15`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <FontAwesomeIcon icon={faTrashAlt} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ProductsPortal() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    category_id: '',
    price: '',
    stock_quantity: '',
    description: '',
    image_url: '',
    reorder_level: '20',
    is_active: true,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', { headers: getAuthHeaders() });
      const data = await res.json();
      const productArray = Array.isArray(data) ? data : (data.data || []);
      setProducts(productArray);
      applyFilters(productArray, search, categoryFilter, statusFilter);
    } catch (err) {
      console.error(err);
      setProducts([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', { headers: getAuthHeaders() });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error(err);
      setCategories([]);
    }
  };

  const applyFilters = (productsList: Product[], searchTerm: string, cat: string, stat: string) => {
    let filteredList = [...productsList];
    if (searchTerm) {
      filteredList = filteredList.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (cat !== 'all') {
      filteredList = filteredList.filter(p => p.category_id.toString() === cat);
    }
    if (stat !== 'all') {
      if (stat === 'low') filteredList = filteredList.filter(p => p.stock_quantity <= p.reorder_level && p.stock_quantity > 0);
      else if (stat === 'out') filteredList = filteredList.filter(p => p.stock_quantity === 0);
      else if (stat === 'active') filteredList = filteredList.filter(p => p.is_active);
      else if (stat === 'inactive') filteredList = filteredList.filter(p => !p.is_active);
    }
    setFiltered(filteredList);
  };

  useEffect(() => {
    applyFilters(products, search, categoryFilter, statusFilter);
  }, [search, categoryFilter, statusFilter, products]);

  const exportToCSV = () => {
    const csvData = filtered.map(p => ({
      [t('productName')]: p.name,
      [t('category')]: p.category_name,
      [t('price')]: p.price,
      [t('stock')]: p.stock_quantity,
      [t('reorderLevel')]: p.reorder_level,
      [t('status')]: p.is_active ? t('active') : t('inactive'),
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t('productsExport')}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) setForm({ ...form, image_url: data.url });
      else setError(data.message || t('uploadFailed'));
    } catch (err) {
      setError(t('networkError'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category_id) {
      setError(t('nameCategoryRequired'));
      return;
    }
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';
    const payload = {
      name: form.name,
      category_id: parseInt(form.category_id),
      price: parseFloat(form.price) || 0,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      description: form.description || '',
      image_url: form.image_url || '',
      reorder_level: parseInt(form.reorder_level) || 20,
      is_active: form.is_active,
    };
    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchProducts();
        setShowModal(false);
        setEditingProduct(null);
        setForm({ name: '', category_id: '', price: '', stock_quantity: '', description: '', image_url: '', reorder_level: '20', is_active: true });
        setError('');
      } else {
        const err = await res.json();
        setError(err.message || t('saveFailed'));
      }
    } catch (err) {
      setError(t('networkError'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDelete'))) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    fetchProducts();
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category_id: product.category_id.toString(),
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      description: product.description || '',
      image_url: product.image_url || '',
      reorder_level: product.reorder_level.toString(),
      is_active: product.is_active,
    });
    setShowModal(true);
  };

  const inventoryValue = Array.isArray(products) ? products.reduce((acc, p) => acc + (p.price * p.stock_quantity), 0) : 0;
  const lowStockCount = Array.isArray(products) ? products.filter(p => p.stock_quantity <= p.reorder_level && p.stock_quantity > 0).length : 0;
  const outOfStockCount = Array.isArray(products) ? products.filter(p => p.stock_quantity === 0).length : 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <FontAwesomeIcon icon={faSpinner} spin style={{ color: COLORS.primary, fontSize: '2rem' }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
            {t('products') || 'Products'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0.15rem 0 0 0' }}>
            {t('manageProductInventory') || 'Manage your product inventory'}
          </p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setForm({ name: '', category_id: categories[0]?.id.toString() || '', price: '', stock_quantity: '', description: '', image_url: '', reorder_level: '20', is_active: true }); setShowModal(true); }}
          style={{
            background: COLORS.primary,
            border: 'none',
            padding: '0.6rem 1.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.primaryDark;
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.primary;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
          }}
        >
          <FontAwesomeIcon icon={faPlus} /> {t('addProduct') || 'Add Product'}
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
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
          icon={faBoxOpen}
          color={COLORS.danger}
          bgColor={outOfStockCount > 0 ? '#fee2e2' : 'white'}
        />
        <KpiCard
          title={t('inventoryValue') || 'Inventory Value'}
          value={`${inventoryValue.toLocaleString()} RWF`}
          icon={faChartLine}
          color={COLORS.primary}
        />
      </div>

      {/* Low stock alert banner */}
      {lowStockCount > 0 && (
        <div style={{
          background: '#fef3c7',
          borderLeft: `4px solid ${COLORS.primary}`,
          padding: '0.6rem 1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: COLORS.primary }} />
          <span style={{ fontSize: '0.85rem', color: '#92400e' }}>
            {t('lowStockAlert') || `${lowStockCount} products are running low on stock.`}
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        marginBottom: '1rem',
        justifyContent: 'space-between',
        background: 'white',
        padding: '1rem',
        borderRadius: '12px',
        boxShadow: COLORS.shadow,
      }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
            <input
              type="text"
              placeholder={t('searchByName') || 'Search by name...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                width: '100%',
                fontSize: '0.85rem',
                background: COLORS.bgGray,
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
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              fontSize: '0.85rem',
              background: COLORS.bgGray,
              minWidth: '140px',
            }}
          >
            <option value="all">{t('allCategories') || 'All Categories'}</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              fontSize: '0.85rem',
              background: COLORS.bgGray,
              minWidth: '140px',
            }}
          >
            <option value="all">{t('allStock') || 'All Stock'}</option>
            <option value="low">{t('lowStock') || 'Low Stock'}</option>
            <option value="out">{t('outOfStock') || 'Out of Stock'}</option>
            <option value="active">{t('active') || 'Active'}</option>
            <option value="inactive">{t('inactive') || 'Inactive'}</option>
          </select>
        </div>
        <button
          onClick={exportToCSV}
          style={{
            background: COLORS.bgGray,
            border: `1px solid ${COLORS.border}`,
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.primary;
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.borderColor = COLORS.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.bgGray;
            e.currentTarget.style.color = COLORS.textPrimary;
            e.currentTarget.style.borderColor = COLORS.border;
          }}
        >
          <FontAwesomeIcon icon={faFileExport} /> {t('exportCSV') || 'Export CSV'}
        </button>
      </div>

      {/* Product Table */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'white',
          borderRadius: '12px',
          boxShadow: COLORS.shadow,
        }}>
          <FontAwesomeIcon icon={faBox} style={{ fontSize: '3rem', color: COLORS.textMuted, marginBottom: '1rem' }} />
          <h3 style={{ color: COLORS.textSecondary }}>{t('noProductsFound') || 'No products found'}</h3>
          <p style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>
            {t('tryAdjustingFilters') || 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', boxShadow: COLORS.shadow }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: COLORS.bgGray, borderBottom: `1px solid ${COLORS.border}` }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                  {t('productName') || 'Product'}
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                  {t('category') || 'Category'}
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                  {t('price') || 'Price (RWF)'}
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                  {t('stock') || 'Stock'}
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                  {t('status') || 'Status'}
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                  {t('actions') || 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onSelect={(product) => { setSelectedProduct(product); setShowDrawer(true); }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            width: '550px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: COLORS.shadowHover,
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
                {editingProduct ? t('editProduct') || 'Edit Product' : t('addProduct') || 'Add Product'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: COLORS.textMuted,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.textPrimary;
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = COLORS.textMuted;
                  e.currentTarget.style.transform = 'rotate(0)';
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                  {t('productNameRequired') || 'Product Name *'}
                </label>
                <input
                  type="text"
                  placeholder={t('productNameRequired') || 'Enter product name'}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
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

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                  {t('category') || 'Category *'}
                </label>
                <select
                  value={form.category_id}
                  onChange={e => setForm({ ...form, category_id: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    background: 'white',
                  }}
                >
                  <option value="">{t('selectCategory') || 'Select Category'}</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                    {t('priceRWF') || 'Price (RWF)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                    {t('stockQuantity') || 'Stock Quantity'}
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.stock_quantity}
                    onChange={e => setForm({ ...form, stock_quantity: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                  {t('reorderLevel') || 'Reorder Level'}
                </label>
                <input
                  type="number"
                  placeholder="20"
                  value={form.reorder_level}
                  onChange={e => setForm({ ...form, reorder_level: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                  {t('description') || 'Description'}
                </label>
                <textarea
                  placeholder={t('description') || 'Product description...'}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                  {t('productImage') || 'Product Image'}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{
                      padding: '0.4rem',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      flex: 1,
                    }}
                  />
                  {uploading && (
                    <span style={{ fontSize: '0.8rem', color: COLORS.textMuted }}>
                      <FontAwesomeIcon icon={faSpinner} spin /> {t('uploading') || 'Uploading...'}
                    </span>
                  )}
                </div>
                {form.image_url && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img src={form.image_url} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: `1px solid ${COLORS.border}` }} />
                  </div>
                )}
                <input
                  type="text"
                  placeholder={t('orEnterImageUrl') || 'Or enter image URL'}
                  value={form.image_url}
                  onChange={e => setForm({ ...form, image_url: e.target.value })}
                  style={{
                    width: '100%',
                    marginTop: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: COLORS.primary }}
                />
                <span style={{ fontSize: '0.85rem', color: COLORS.textSecondary }}>{t('active') || 'Active'}</span>
              </label>

              {error && (
                <div style={{
                  color: COLORS.danger,
                  fontSize: '0.85rem',
                  marginTop: '1rem',
                  padding: '0.5rem 0.75rem',
                  background: '#fee2e2',
                  borderRadius: '8px',
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '0.6rem 1.5rem',
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
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    padding: '0.6rem 1.5rem',
                    background: COLORS.primary,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    color: 'white',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    opacity: uploading ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!uploading) {
                      e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!uploading) {
                      e.currentTarget.style.backgroundColor = COLORS.primary;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {editingProduct ? (t('update') || 'Update') : (t('save') || 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Detail Drawer */}
      {showDrawer && selectedProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '450px',
          height: '100%',
          background: 'white',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          zIndex: 1000,
          padding: '1.5rem',
          overflowY: 'auto',
          animation: 'slideIn 0.3s ease',
        }}>
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
              {selectedProduct.name}
            </h2>
            <button
              onClick={() => setShowDrawer(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: COLORS.textMuted,
                transition: 'all 0.2s',
                padding: '0.25rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.textPrimary;
                e.currentTarget.style.transform = 'rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.textMuted;
                e.currentTarget.style.transform = 'rotate(0)';
              }}
            >
              ×
            </button>
          </div>

          <div style={{
            width: '100%',
            height: '220px',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '1rem',
            background: COLORS.bgGray,
          }}>
            <img
              src={selectedProduct.image_url || '/placeholder.jpg'}
              alt={selectedProduct.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {t('category') || 'Category'}
              </span>
              <p style={{ fontSize: '0.9rem', fontWeight: '500', color: COLORS.textPrimary, margin: '0.1rem 0 0 0' }}>
                {selectedProduct.category_name}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {t('price') || 'Price'}
              </span>
              <p style={{ fontSize: '0.9rem', fontWeight: '600', color: COLORS.primary, margin: '0.1rem 0 0 0' }}>
                {selectedProduct.price?.toLocaleString()} RWF
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {t('stock') || 'Stock'}
              </span>
              <div style={{ marginTop: '0.1rem' }}>
                <StockBadge product={selectedProduct} />
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {t('reorderLevel') || 'Reorder Level'}
              </span>
              <p style={{ fontSize: '0.9rem', fontWeight: '500', color: COLORS.textPrimary, margin: '0.1rem 0 0 0' }}>
                {selectedProduct.reorder_level}
              </p>
            </div>
          </div>

          {selectedProduct.description && (
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {t('description') || 'Description'}
              </span>
              <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0.1rem 0 0 0', lineHeight: '1.6' }}>
                {selectedProduct.description}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: `1px solid ${COLORS.border}`, paddingTop: '1rem' }}>
            <button
              onClick={() => {
                setEditingProduct(selectedProduct);
                setForm({
                  name: selectedProduct.name,
                  category_id: selectedProduct.category_id.toString(),
                  price: selectedProduct.price.toString(),
                  stock_quantity: selectedProduct.stock_quantity.toString(),
                  description: selectedProduct.description || '',
                  image_url: selectedProduct.image_url || '',
                  reorder_level: selectedProduct.reorder_level.toString(),
                  is_active: selectedProduct.is_active,
                });
                setShowDrawer(false);
                setShowModal(true);
              }}
              style={{
                background: COLORS.primary,
                border: 'none',
                padding: '0.6rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'white',
                fontWeight: '500',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.primaryDark;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.primary;
              }}
            >
              <FontAwesomeIcon icon={faEdit} /> {t('editProduct') || 'Edit Product'}
            </button>
            <button
              onClick={() => {
                if (confirm(t('confirmDelete') || 'Are you sure?')) {
                  handleDelete(selectedProduct.id);
                  setShowDrawer(false);
                }
              }}
              style={{
                background: 'transparent',
                border: `1px solid ${COLORS.danger}`,
                padding: '0.6rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                color: COLORS.danger,
                fontWeight: '500',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FontAwesomeIcon icon={faTrashAlt} /> {t('delete') || 'Delete'}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}