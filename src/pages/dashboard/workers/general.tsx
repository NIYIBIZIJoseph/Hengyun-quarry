import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faFileExport, faPrint, faUser, faPhoneAlt, faBuilding,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== CLEAN DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  success: "#10b981",
  danger: "#ef4444",      // ← ADDED
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

interface SimpleWorker {
  id: number;
  full_name: string;
  phone: string;
  department_id: number;
  department_name: string;
}

function WorkerRow({ worker }: { worker: SimpleWorker }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <tr
      style={{
        borderBottom: `1px solid ${COLORS.border}`,
        backgroundColor: isHovered ? COLORS.bgGray : 'transparent',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td style={{ padding: '0.75rem 1rem', fontWeight: '500', color: COLORS.textPrimary }}>
        {worker.full_name}
      </td>
      <td style={{ padding: '0.75rem 1rem', color: COLORS.textSecondary }}>
        {worker.phone || '-'}
      </td>
      <td style={{ padding: '0.75rem 1rem', color: COLORS.textSecondary }}>
        {worker.department_name || '-'}
      </td>
    </tr>
  );
}

export default function GeneralWorkersList() {
  const { t } = useTranslation();
  const [workers, setWorkers] = useState<SimpleWorker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<SimpleWorker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const fetchWorkers = async () => {
    try {
      const res = await fetch('/api/workers', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch workers');
      const data = await res.json();
      const mapped = data.map((w: any) => ({
        id: w.id,
        full_name: w.full_name,
        phone: w.phone,
        department_id: w.department_id,
        department_name: w.department_name,
      }));
      setWorkers(mapped);
      applyFilters(mapped, searchTerm, departmentFilter);
    } catch (err: any) {
      setError(err.message);
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

  const applyFilters = (workersList: SimpleWorker[], search: string, deptId: string) => {
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

  const exportToCSV = () => {
    const headers = [t('name'), t('phone'), t('department')];
    const rows = filteredWorkers.map(w => [w.full_name, w.phone || '', w.department_name || '']);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workers_general.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const printList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>Workers General List</title></head>
        <body>
          <h1>Workers List</h1>
          <table border="1" cellpadding="8">
            <thead><tr><th>${t('name')}</th><th>${t('phone')}</th><th>${t('department')}</th></tr></thead>
            <tbody>
              ${filteredWorkers.map(w => `<tr><td>${w.full_name}</td><td>${w.phone || '-'}</td><td>${w.department_name || '-'}</td></tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: COLORS.textMuted }}>
          {t('loading') || 'Loading...'}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div style={{ padding: '2rem', textAlign: 'center', color: COLORS.danger }}>
          {t('error') || 'Error'}: {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
              <FontAwesomeIcon icon={faUser} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
              {t('generalLists') || 'General Lists'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0.15rem 0 0 0' }}>
              {t('quickWorkerReference') || 'Quick reference list of all workers'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={exportToCSV}
              style={{
                padding: '0.5rem 1rem',
                background: COLORS.success,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <FontAwesomeIcon icon={faFileExport} /> {t('exportCSV') || 'Export CSV'}
            </button>
            <button
              onClick={printList}
              style={{
                padding: '0.5rem 1rem',
                background: COLORS.primary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
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
              <FontAwesomeIcon icon={faPrint} /> {t('printPDF') || 'Print PDF'}
            </button>
            <button
              onClick={() => window.history.back()}
              style={{
                padding: '0.5rem 1rem',
                background: COLORS.bgGray,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
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
            <h3 style={{ color: COLORS.textSecondary, fontSize: '1rem' }}>{t('noWorkersMatching') || 'No workers found'}</h3>
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
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map(worker => (
                  <WorkerRow key={worker.id} worker={worker} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}