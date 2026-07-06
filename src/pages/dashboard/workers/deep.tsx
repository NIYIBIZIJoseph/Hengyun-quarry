// src/pages/dashboard/workers/index.tsx
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrashAlt, faEye, faFileExport, faPrint,
  faUser, faCamera, faCheckCircle, faTimesCircle,
  faUpload, faSave, faTimes, faSearch, faArrowLeft,
  faBuilding, faPhoneAlt, faEnvelope, faMoneyBillWave, faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== CLEAN DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  success: "#10b981",
  danger: "#ef4444",
  info: "#3b82f6",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  bgGray: "#f9fafb",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowHover: "0 8px 25px rgba(0,0,0,0.08)",
};

interface Department {
  id: number;
  name: string;
}

interface Worker {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  department_id: number;
  department_name: string;
  salary: number;
  join_date: string;
  location: string;
  image_url: string;
  is_active: boolean;
}

// ========== KPI CARD ==========
function KpiCard({ title, value, icon, color = COLORS.primary }: { 
  title: string; 
  value: string | number; 
  icon: any; 
  color?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        background: 'white',
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        boxShadow: isHovered ? COLORS.shadowHover : COLORS.shadow,
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        borderLeft: `3px solid ${color}`,
        cursor: 'default',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <FontAwesomeIcon icon={icon} style={{ color, fontSize: '0.8rem' }} />
        <span style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          {title}
        </span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, marginTop: '0.25rem' }}>
        {value}
      </div>
    </div>
  );
}

// ========== WORKER ROW ==========
function WorkerRow({ 
  worker, 
  onEdit, 
  onDelete,
  onView
}: { 
  worker: Worker; 
  onEdit: (worker: Worker) => void; 
  onDelete: (id: number, name: string, isActive: boolean) => void;
  onView: (id: number) => void;
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
      onClick={() => onView(worker.id)}
    >
      <td style={{ padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {worker.image_url ? (
            <img src={worker.image_url} alt={worker.full_name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${COLORS.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.primary }}>
              <FontAwesomeIcon icon={faUser} style={{ fontSize: '0.7rem' }} />
            </div>
          )}
          <span style={{ fontWeight: '500', fontSize: '0.85rem', color: COLORS.textPrimary }}>
            {worker.full_name}
          </span>
        </div>
      </td>
      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>
        {worker.phone || '-'}
      </td>
      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>
        {worker.department_name || '-'}
      </td>
      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: '500', color: COLORS.textPrimary }}>
        {worker.salary?.toLocaleString() || '-'}
      </td>
      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: COLORS.textSecondary }}>
        {worker.join_date ? new Date(worker.join_date).toLocaleDateString() : '-'}
      </td>
      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
        <span style={{
          background: worker.is_active ? `${COLORS.success}15` : `${COLORS.danger}15`,
          color: worker.is_active ? COLORS.success : COLORS.danger,
          padding: '0.2rem 0.6rem',
          borderRadius: '20px',
          fontSize: '0.7rem',
          fontWeight: '500',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.2rem',
        }}>
          <FontAwesomeIcon icon={worker.is_active ? faCheckCircle : faTimesCircle} style={{ fontSize: '0.4rem' }} />
          {worker.is_active ? t('active') || 'Active' : t('inactive') || 'Inactive'}
        </span>
      </td>
      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
          {/* Edit Button */}
          <button
            onClick={() => onEdit(worker)}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.info,
              cursor: 'pointer',
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              transition: 'all 0.2s',
              fontSize: '0.8rem',
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

          {/* ✅ Delete/Deactivate Button - ICON ONLY, NO TEXT */}
          <button
            onClick={() => {
              onDelete(worker.id, worker.full_name, worker.is_active);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: worker.is_active ? COLORS.danger : COLORS.danger,
              cursor: 'pointer',
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              transition: 'all 0.2s',
              fontSize: '0.8rem',
              opacity: worker.is_active ? 1 : 0.8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${COLORS.danger}15`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title={worker.is_active ? 'Deactivate Worker' : 'Permanently Delete Worker'}
          >
            <FontAwesomeIcon icon={worker.is_active ? faTimesCircle : faTrashAlt} />
          </button>

          {/* View Button */}
          <Link href={`/dashboard/workers/${worker.id}`}>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: COLORS.primary,
                cursor: 'pointer',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
                transition: 'all 0.2s',
                fontSize: '0.8rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${COLORS.primary}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FontAwesomeIcon icon={faEye} />
            </button>
          </Link>
        </div>
      </td>
    </tr>
  );
}

// ========== ACTION BUTTON ==========
function ActionButton({ 
  label, 
  icon, 
  onClick, 
  color = COLORS.primary,
  isActive = false
}: { 
  label: string; 
  icon: any; 
  onClick: () => void; 
  color?: string;
  isActive?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '0.5rem 1rem',
        background: isActive || isHovered ? color : 'white',
        border: `1px solid ${isActive || isHovered ? color : COLORS.border}`,
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.8rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        color: isActive || isHovered ? 'white' : COLORS.textSecondary,
        transition: 'all 0.2s ease',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isActive || isHovered ? `0 4px 12px ${color}40` : 'none',
      }}
    >
      <FontAwesomeIcon icon={icon} style={{ fontSize: '0.8rem' }} />
      {label}
    </button>
  );
}

export default function DeepWorkers() {
  const router = useRouter();
  const { t } = useTranslation();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    department_id: '',
    salary: '',
    join_date: '',
    location: '',
    image_url: '',
    is_active: true,
  });

  const fetchWorkers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/workers', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWorkers(data);
      applyFilters(data, searchTerm, departmentFilter);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setWorkers([]);
      setFilteredWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments', { headers: getAuthHeaders() });
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setDepartments([]);
    }
  };

  const applyFilters = (workersList: Worker[], search: string, deptId: string) => {
    let filtered = [...workersList];
    if (search.trim()) {
      filtered = filtered.filter(w =>
        w.full_name.toLowerCase().includes(search.toLowerCase()) ||
        w.phone?.includes(search)
      );
    }
    if (deptId !== 'all') {
      filtered = filtered.filter(w => w.department_id?.toString() === deptId);
    }
    setFilteredWorkers(filtered);
  };

  useEffect(() => {
    fetchWorkers();
    fetchDepartments();
  }, []);

  useEffect(() => {
    applyFilters(workers, searchTerm, departmentFilter);
  }, [searchTerm, departmentFilter, workers]);

  // ========== TWO-STEP DELETE ==========
  const handleDelete = async (workerId: number, workerName: string, isActive: boolean) => {
    // ✅ STEP 1: If worker is ACTIVE → DEACTIVATE
    if (isActive) {
      if (!confirm(
        `⚠️ Deactivate "${workerName}"?\n\n` +
        `This will make the worker INACTIVE.\n` +
        `They will not appear in active lists.\n\n` +
        `Click OK to deactivate.\n` +
        `Click Cancel to keep them active.`
      )) {
        return;
      }

      try {
        const res = await fetch(`/api/workers/${workerId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setMessage(`✅ "${workerName}" has been deactivated`);
          fetchWorkers();
          setTimeout(() => setMessage(''), 3000);
        } else {
          alert(data.error || 'Failed to deactivate worker');
        }
      } catch (err) {
        console.error('Deactivate error:', err);
        alert('Network error while deactivating worker');
      }
      return;
    }

    // ✅ STEP 2: If worker is INACTIVE → PERMANENT DELETE
    if (!isActive) {
      if (!confirm(
        `⚠️⚠️ PERMANENT DELETE "${workerName}" ⚠️⚠️\n\n` +
        `This worker is already INACTIVE.\n` +
        `Clicking OK will PERMANENTLY DELETE this worker.\n` +
        `This action CANNOT be undone!\n\n` +
        `All associated data will be removed.`
      )) {
        return;
      }

      // Double confirmation for safety
      if (!confirm(
        `⚠️ FINAL WARNING\n\n` +
        `Are you ABSOLUTELY sure you want to PERMANENTLY DELETE "${workerName}"?\n` +
        `This action cannot be undone.`
      )) {
        return;
      }

      try {
        const res = await fetch(`/api/workers/${workerId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setMessage(`🗑️ "${workerName}" permanently deleted`);
          fetchWorkers();
          setTimeout(() => setMessage(''), 3000);
        } else {
          alert(data.error || 'Failed to delete worker');
        }
      } catch (err) {
        console.error('Delete error:', err);
        alert('Network error while deleting worker');
      }
    }
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
      if (res.ok) {
        setForm({ ...form, image_url: data.url });
      } else {
        alert(data.message || t('uploadFailed'));
      }
    } catch (err) {
      console.error(err);
      alert(t('uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      alert(t('fullNameRequired'));
      return;
    }
    const url = editingWorker ? `/api/workers/${editingWorker.id}` : '/api/workers';
    const method = editingWorker ? 'PUT' : 'POST';
    const payload = {
      full_name: form.full_name,
      phone: form.phone || null,
      email: form.email || null,
      department_id: form.department_id ? parseInt(form.department_id) : null,
      salary: form.salary ? parseFloat(form.salary) : null,
      join_date: form.join_date || null,
      location: form.location || null,
      image_url: form.image_url || null,
      is_active: form.is_active,
    };
    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchWorkers();
        setShowModal(false);
        setEditingWorker(null);
        setForm({ full_name: '', phone: '', email: '', department_id: '', salary: '', join_date: '', location: '', image_url: '', is_active: true });
      } else {
        const err = await res.json();
        alert(err.message || t('saveFailed'));
      }
    } catch (err) {
      console.error(err);
      alert(t('networkError'));
    }
  };

  const openEdit = (worker: Worker) => {
    setEditingWorker(worker);
    const formattedJoinDate = worker.join_date ? worker.join_date.split('T')[0] : '';
    setForm({
      full_name: worker.full_name,
      phone: worker.phone || '',
      email: worker.email || '',
      department_id: worker.department_id?.toString() || '',
      salary: worker.salary?.toString() || '',
      join_date: formattedJoinDate,
      location: worker.location || '',
      image_url: worker.image_url || '',
      is_active: worker.is_active,
    });
    setShowModal(true);
  };

  const exportToCSV = () => {
    const headers = [t('name'), t('phone'), t('department'), t('salary'), t('joinDate'), t('location'), t('status')];
    const rows = filteredWorkers.map(w => [
      w.full_name,
      w.phone || '',
      w.department_name || '',
      w.salary?.toString() || '',
      w.join_date || '',
      w.location || '',
      w.is_active ? t('active') : t('inactive')
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workers_deep.csv';
    a.click();
    URL.revokeObjectURL(url);
    setActiveButton('export');
    setTimeout(() => setActiveButton(null), 500);
  };

  const printWorkers = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>Workers Deep Report</title></head>
        <body>
          <h1>Workers Detailed Report</h1>
          <table border="1" cellpadding="8">
            <thead><tr><th>${t('name')}</th><th>${t('phone')}</th><th>${t('department')}</th><th>${t('salary')}</th><th>${t('joinDate')}</th><th>${t('location')}</th><th>${t('status')}</th></tr></thead>
            <tbody>
              ${filteredWorkers.map(w => `
                <tr>
                  <td>${w.full_name}</td>
                  <td>${w.phone || '-'}</td>
                  <td>${w.department_name || '-'}</td>
                  <td>${w.salary?.toLocaleString() || '-'}</td>
                  <td>${w.join_date || '-'}</td>
                  <td>${w.location || '-'}</td>
                  <td>${w.is_active ? t('active') : t('inactive')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    setActiveButton('print');
    setTimeout(() => setActiveButton(null), 500);
  };

  // Proper salary calculation
  const activeCount = workers.filter(w => w.is_active).length;
  const inactiveCount = workers.filter(w => !w.is_active).length;
  
  const totalSalary = workers.reduce((sum, w) => {
    const salary = typeof w.salary === 'number' ? w.salary : parseFloat(w.salary) || 0;
    return sum + salary;
  }, 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: COLORS.textMuted }}>
          {t('loadingWorkers') || 'Loading workers...'}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem' }}>
        {/* Messages */}
        {message && (
          <div style={{ marginBottom: '1rem', padding: '12px 16px', background: '#d1fae5', borderRadius: '8px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: `3px solid ${COLORS.success}` }}>
            <FontAwesomeIcon icon={faCheckCircle} /> {message}
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
              <FontAwesomeIcon icon={faUser} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
              {t('deepSeek') || 'Deep Seek'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0.15rem 0 0 0' }}>
              {t('fullWorkerManagement') || 'Full worker management – salary, documents, leave, performance'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <ActionButton
              label={t('exportCSV') || 'Export CSV'}
              icon={faFileExport}
              onClick={exportToCSV}
              color={COLORS.success}
              isActive={activeButton === 'export'}
            />
            <ActionButton
              label={t('printPDF') || 'Print PDF'}
              icon={faPrint}
              onClick={printWorkers}
              color={COLORS.primary}
              isActive={activeButton === 'print'}
            />
            <ActionButton
              label={t('addWorker') || 'Add Worker'}
              icon={faPlus}
              onClick={() => { 
                setEditingWorker(null); 
                setForm({ full_name: '', phone: '', email: '', department_id: '', salary: '', join_date: '', location: '', image_url: '', is_active: true }); 
                setShowModal(true);
                setActiveButton('add');
                setTimeout(() => setActiveButton(null), 500);
              }}
              color={COLORS.primary}
              isActive={activeButton === 'add'}
            />
            <ActionButton
              label={t('back') || 'Back'}
              icon={faArrowLeft}
              onClick={() => router.push('/dashboard/workers')}
              color={COLORS.primary}
              isActive={activeButton === 'back'}
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <KpiCard
            title={t('totalWorkers') || 'Total Workers'}
            value={workers.length}
            icon={faUser}
            color={COLORS.primary}
          />
          <KpiCard
            title={t('active') || 'Active'}
            value={activeCount}
            icon={faCheckCircle}
            color={COLORS.success}
          />
          <KpiCard
            title={t('inactive') || 'Inactive'}
            value={inactiveCount}
            icon={faTimesCircle}
            color={inactiveCount > 0 ? COLORS.danger : COLORS.primary}
          />
          <KpiCard
            title={t('totalPayroll') || 'Total Payroll'}
            value={`${totalSalary.toLocaleString()} RWF`}
            icon={faMoneyBillWave}
            color={COLORS.primary}
          />
        </div>

        {/* Search and Filter */}
        <div style={{
          background: 'white',
          padding: '1rem',
          borderRadius: '12px',
          marginBottom: '1rem',
          boxShadow: COLORS.shadow,
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
            <input
              type="text"
              placeholder={t('searchByNamePhone') || 'Search by name or phone...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
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
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              fontSize: '0.85rem',
              background: COLORS.bgGray,
              minWidth: '150px',
            }}
          >
            <option value="all">{t('allDepartments') || 'All Departments'}</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {(searchTerm || departmentFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDepartmentFilter('all');
              }}
              style={{
                padding: '0.4rem 1rem',
                background: COLORS.bgGray,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.danger;
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = COLORS.danger;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.bgGray;
                e.currentTarget.style.color = COLORS.textPrimary;
                e.currentTarget.style.borderColor = COLORS.border;
              }}
            >
              {t('clearFilters') || 'Clear Filters'}
            </button>
          )}
        </div>

        {error && (
          <div style={{
            background: `${COLORS.danger}15`,
            color: COLORS.danger,
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <FontAwesomeIcon icon={faTimesCircle} /> {error}
          </div>
        )}

        {/* Workers Table */}
        {filteredWorkers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            background: 'white',
            borderRadius: '12px',
            boxShadow: COLORS.shadow,
          }}>
            <FontAwesomeIcon icon={faUser} style={{ fontSize: '3rem', color: COLORS.textMuted, marginBottom: '1rem' }} />
            <h3 style={{ color: COLORS.textSecondary, fontSize: '1rem' }}>{t('noWorkersFound') || 'No workers found'}</h3>
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
                    <FontAwesomeIcon icon={faUser} style={{ marginRight: '0.3rem' }} /> {t('name') || 'Name'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    <FontAwesomeIcon icon={faPhoneAlt} style={{ marginRight: '0.3rem' }} /> {t('phone') || 'Phone'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    <FontAwesomeIcon icon={faBuilding} style={{ marginRight: '0.3rem' }} /> {t('department') || 'Department'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    <FontAwesomeIcon icon={faMoneyBillWave} style={{ marginRight: '0.3rem' }} /> {t('salary') || 'Salary'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '0.3rem' }} /> {t('joinDate') || 'Join Date'}
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
                {filteredWorkers.map(worker => (
                  <WorkerRow
                    key={worker.id}
                    worker={worker}
                    onEdit={openEdit}
                    onDelete={(id, name, isActive) => handleDelete(id, name, isActive)}
                    onView={(id) => window.location.href = `/dashboard/workers/${id}`}
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
            right: 0,
            bottom: 0,
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
                  {editingWorker ? t('editWorker') || 'Edit Worker' : t('addWorker') || 'Add Worker'}
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
                {/* Form fields - same as before */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                    {t('fullName') || 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    placeholder={t('fullName') || 'Full Name'}
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                      {t('phone') || 'Phone'}
                    </label>
                    <input
                      type="tel"
                      placeholder={t('phone') || 'Phone'}
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
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
                      {t('email') || 'Email'}
                    </label>
                    <input
                      type="email"
                      placeholder={t('email') || 'Email'}
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                      {t('department') || 'Department'}
                    </label>
                    <select
                      value={form.department_id}
                      onChange={e => setForm({ ...form, department_id: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        background: 'white',
                      }}
                    >
                      <option value="">{t('selectDepartment') || 'Select Department'}</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                      {t('salary') || 'Salary (RWF)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.salary}
                      onChange={e => setForm({ ...form, salary: e.target.value })}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                      {t('joinDate') || 'Join Date'}
                    </label>
                    <input
                      type="date"
                      value={form.join_date}
                      onChange={e => setForm({ ...form, join_date: e.target.value })}
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
                      {t('location') || 'Location'}
                    </label>
                    <input
                      type="text"
                      placeholder={t('location') || 'Location'}
                      value={form.location}
                      onChange={e => setForm({ ...form, location: e.target.value })}
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
                    {t('profileImage') || 'Profile Image'}
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
                        <FontAwesomeIcon icon={faUpload} spin /> {t('uploading') || 'Uploading...'}
                      </span>
                    )}
                  </div>
                  {form.image_url && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img src={form.image_url} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${COLORS.primary}` }} />
                    </div>
                  )}
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
                    <FontAwesomeIcon icon={faSave} style={{ marginRight: '0.3rem' }} />
                    {editingWorker ? (t('update') || 'Update') : (t('save') || 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}