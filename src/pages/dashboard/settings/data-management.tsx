// src/pages/dashboard/settings/data-management.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faDatabase, faTrashAlt, faDownload,
  faFileExport, faTable, faClock, faExclamationTriangle,
  faCheckCircle, faSpinner, faRecycle
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

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

export default function DataManagementPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [deletedItems, setDeletedItems] = useState<any[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchTables();
    fetchDeletedItems();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/settings/data-management/tables', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setTables(data);
        if (data.length > 0) {
          setSelectedTable(data[0].name);
        }
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedItems = async () => {
    try {
      const res = await fetch('/api/admin/recycle-bin', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setDeletedItems(data);
      }
    } catch (err) {
      console.error('Error fetching deleted items:', err);
    }
  };

  const exportTable = async () => {
    if (!selectedTable) return;
    try {
      const res = await fetch(
        `/api/settings/data-management/export?table=${selectedTable}`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedTable}_export.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setMessage('Export successful');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('Export error:', err);
      setError('Export failed');
      setTimeout(() => setError(''), 3000);
    }
  };

  const purgeOldRecords = async () => {
    if (!confirm(`Delete records older than ${days} days? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/settings/data-management/purge', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ days }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(`${data.deleted || 0} records deleted`);
        fetchDeletedItems();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('Purge error:', err);
      setError('Purge failed');
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const cleanupSoftDeleted = async () => {
    if (!confirm(`Cleanup soft-deleted records older than ${days} days?`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/settings/data-management/cleanup-soft-deleted', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ days }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(`${data.deleted || 0} soft-deleted records cleaned up`);
        fetchDeletedItems();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('Cleanup error:', err);
      setError('Cleanup failed');
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => router.push('/dashboard/settings')}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: COLORS.textSecondary,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = COLORS.bgGray;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
            <FontAwesomeIcon icon={faDatabase} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
            Data Management
          </h2>
        </div>
        <p style={{ color: COLORS.textSecondary, marginTop: '0.25rem' }}>
          Manage your data, export tables, and clean up old records
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div style={{ marginBottom: '1rem', padding: '12px', background: '#d1fae5', borderRadius: '8px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FontAwesomeIcon icon={faCheckCircle} /> {message}
        </div>
      )}
      {error && (
        <div style={{ marginBottom: '1rem', padding: '12px', background: '#fee2e2', borderRadius: '8px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
        </div>
      )}

      {/* Deleted Items Count */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: COLORS.shadow,
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        borderLeft: `4px solid ${COLORS.primary}`,
      }}>
        <div>
          <h4 style={{ margin: 0, color: COLORS.textPrimary }}>
            <FontAwesomeIcon icon={faRecycle} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
            Recycle Bin
          </h4>
          <p style={{ color: COLORS.textMuted, fontSize: '0.85rem', margin: 0 }}>
            {deletedItems.length} items in recycle bin
          </p>
        </div>
      </div>

      {/* Export Data */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: COLORS.shadow,
        marginBottom: '1.5rem',
        borderLeft: `4px solid ${COLORS.info}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <FontAwesomeIcon icon={faFileExport} style={{ color: COLORS.info }} />
          <h4 style={{ margin: 0, color: COLORS.textPrimary }}>Export Data</h4>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              fontSize: '0.9rem',
              background: 'white',
              minWidth: '200px',
            }}
          >
            {tables.map((table) => (
              <option key={table.name} value={table.name}>
                {table.name} ({table.count || 0} records)
              </option>
            ))}
          </select>
          <button
            onClick={exportTable}
            style={{
              padding: '8px 20px',
              background: COLORS.info,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'white',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <FontAwesomeIcon icon={faDownload} /> Export to CSV
          </button>
        </div>
      </div>

      {/* Purge Old Records */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: COLORS.shadow,
        marginBottom: '1.5rem',
        borderLeft: `4px solid ${COLORS.danger}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <FontAwesomeIcon icon={faTrashAlt} style={{ color: COLORS.danger }} />
          <h4 style={{ margin: 0, color: COLORS.textPrimary }}>Purge Old Records (Permanent Delete)</h4>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: COLORS.textSecondary, display: 'block', marginBottom: '4px' }}>
              Delete records older than:
            </label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 30)}
              min="1"
              max="365"
              style={{
                padding: '8px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.9rem',
                width: '100px',
              }}
            />
          </div>
          <div style={{ marginTop: '1.2rem' }}>
            <button
              onClick={purgeOldRecords}
              disabled={deleting}
              style={{
                padding: '8px 20px',
                background: COLORS.danger,
                border: 'none',
                borderRadius: '8px',
                cursor: deleting ? 'not-allowed' : 'pointer',
                color: 'white',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                opacity: deleting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!deleting) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!deleting) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {deleting ? (
                <><FontAwesomeIcon icon={faSpinner} spin /> Deleting...</>
              ) : (
                <><FontAwesomeIcon icon={faTrashAlt} /> Purge Old Records</>
              )}
            </button>
          </div>
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: COLORS.danger }}>
          <FontAwesomeIcon icon={faExclamationTriangle} /> Warning: This action is permanent and cannot be undone
        </div>
      </div>

      {/* Cleanup Soft-Deleted Records */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: COLORS.shadow,
        borderLeft: `4px solid ${COLORS.primary}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <FontAwesomeIcon icon={faClock} style={{ color: COLORS.primary }} />
          <h4 style={{ margin: 0, color: COLORS.textPrimary }}>Cleanup Soft-Deleted Records</h4>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: COLORS.textSecondary, display: 'block', marginBottom: '4px' }}>
              Delete soft-deleted records older than (days):
            </label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 30)}
              min="1"
              max="365"
              style={{
                padding: '8px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.9rem',
                width: '100px',
              }}
            />
          </div>
          <div style={{ marginTop: '1.2rem' }}>
            <button
              onClick={cleanupSoftDeleted}
              disabled={deleting}
              style={{
                padding: '8px 20px',
                background: COLORS.primary,
                border: 'none',
                borderRadius: '8px',
                cursor: deleting ? 'not-allowed' : 'pointer',
                color: 'white',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                opacity: deleting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!deleting) {
                  e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!deleting) {
                  e.currentTarget.style.backgroundColor = COLORS.primary;
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {deleting ? (
                <><FontAwesomeIcon icon={faSpinner} spin /> Cleaning...</>
              ) : (
                <><FontAwesomeIcon icon={faTrashAlt} /> Cleanup Soft-Deleted Records</>
              )}
            </button>
          </div>
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: COLORS.textMuted }}>
          Permanently removes soft-deleted records older than the specified number of days
        </div>
      </div>

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
  );
}