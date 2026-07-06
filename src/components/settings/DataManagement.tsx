// src/components/settings/DataManagement.tsx
import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';
import { ROLES } from "@/lib/roles";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDatabase, faDownload, faTrashAlt, faRecycle, 
  faSave, faEye, faTrash, faUndo, faCheckSquare, 
  faSquare, faLayerGroup, faClock, faTable,
  faExclamationTriangle, faCheckCircle, faSpinner
} from '@fortawesome/free-solid-svg-icons';

// ========== DESIGN TOKENS ==========
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

interface TableInfo {
  name: string;
  count: number;
}

interface DeletedItem {
  id: number;
  name: string;
  type: string;
  deleted_at: string;
  deleted_by: number | null;
}

// ========== STAT CARD ==========
function StatCard({ label, value, icon, color = COLORS.primary }: { label: string; value: string | number; icon: any; color?: string }) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FontAwesomeIcon icon={icon} style={{ color, fontSize: '0.8rem' }} />
        <span style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, marginTop: '0.25rem' }}>
        {value}
      </div>
    </div>
  );
}

// ========== ACTION BUTTON ==========
function ActionButton({ label, icon, onClick, color = COLORS.primary, disabled = false, loading = false }: { 
  label: string; 
  icon: any; 
  onClick: () => void; 
  color?: string; 
  disabled?: boolean;
  loading?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '0.5rem 1.25rem',
        background: isHovered && !disabled && !loading ? color : 'white',
        border: `1px solid ${isHovered && !disabled && !loading ? color : COLORS.border}`,
        borderRadius: '8px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontSize: '0.85rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: isHovered && !disabled && !loading ? 'white' : COLORS.textSecondary,
        transition: 'all 0.2s ease',
        transform: isHovered && !disabled && !loading ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isHovered && !disabled && !loading ? `0 4px 12px ${color}40` : 'none',
        opacity: disabled || loading ? 0.5 : 1,
        fontWeight: isHovered && !disabled && !loading ? '600' : '400',
      }}
    >
      <FontAwesomeIcon icon={loading ? faSpinner : icon} spin={loading} style={{ fontSize: '0.8rem' }} />
      {loading ? (label + '...') : label}
    </button>
  );
}

export default function DataManagementSettings() {
  const { t } = useTranslation();

  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('orders');
  const [purgeDays, setPurgeDays] = useState<number>(365);
  const [softDeleteDays, setSoftDeleteDays] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [purgeLoading, setPurgeLoading] = useState<boolean>(false);
  const [cleanupLoading, setCleanupLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [recycleLoading, setRecycleLoading] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const userRole = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || '{}').role
    : null;

  const canEdit = userRole === ROLES.SUPERADMIN;

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/data-management/tables', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch tables');
      const data = await res.json();
      setTables(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecycleBin = async () => {
    setRecycleLoading(true);
    try {
      const res = await fetch('/api/admin/recycle-bin', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch deleted items');
      const data = await res.json();
      setDeletedItems(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setRecycleLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchRecycleBin();
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const exportTable = async () => {
    if (!canEdit) return;
    setExportLoading(true);
    setMessage('');

    try {
      const res = await fetch(
        `/api/settings/data-management/export?table=${selectedTable}`,
        { headers: getAuthHeaders() }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Export failed');
      }

      const data = await res.json();

      if (data.length === 0) {
        showMessage(t('noDataToExport') || 'No data to export', 'error');
        return;
      }

      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map((row: Record<string, any>) =>
          headers.map(h => JSON.stringify(row[h] ?? '')).join(',')
        ),
      ];

      const csv = csvRows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTable}_export_${new Date().toISOString().slice(0, 19)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      showMessage(t('exportCompleted') || 'Export completed');
    } catch (err: any) {
      showMessage(`${t('exportError') || 'Export error'}: ${err.message}`, 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const purgeOldRecords = async () => {
    if (!canEdit) return;

    if (!confirm(
      `⚠️ WARNING: This will permanently delete records older than ${purgeDays} days from "${selectedTable}" table.\n\nThis action CANNOT be undone. Are you sure?`
    )) return;

    setPurgeLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/settings/data-management/purge', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ table: selectedTable, days: purgeDays }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Purge failed');

      showMessage(`✅ Purged ${result.deleted} records from ${selectedTable}`);
      await fetchTables();
      await fetchRecycleBin();
    } catch (err: any) {
      showMessage(`${t('purgeError') || 'Purge error'}: ${err.message}`, 'error');
    } finally {
      setPurgeLoading(false);
    }
  };

  const cleanupSoftDeleted = async () => {
    if (!canEdit) return;

    if (!confirm(
      `⚠️ WARNING: This will permanently delete soft-deleted records older than ${softDeleteDays} days from "${selectedTable}" table.\n\nThis action CANNOT be undone. Are you sure?`
    )) return;

    setCleanupLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/settings/data-management/cleanup-soft-deleted', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ table: selectedTable, days: softDeleteDays }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Cleanup failed');

      showMessage(`✅ Cleaned up ${result.deleted} soft-deleted records from ${selectedTable}`);
      await fetchTables();
      await fetchRecycleBin();
    } catch (err: any) {
      showMessage(`${t('cleanupError') || 'Cleanup error'}: ${err.message}`, 'error');
    } finally {
      setCleanupLoading(false);
    }
  };

  // ✅ FIXED: Restore item with better error handling
  const restoreItem = async (item: DeletedItem) => {
    if (!confirm(`Restore ${item.name}?`)) return;

    setActionLoading(item.id);
    setMessage('');
    try {
      const res = await fetch('/api/admin/recycle-bin', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: item.type, id: item.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Restore failed');
      }

      showMessage(`✅ ${item.name} restored successfully`);
      await fetchRecycleBin();
      await fetchTables();
    } catch (err: any) {
      showMessage(`❌ ${err.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ FIXED: Permanent delete with better error handling
  const permanentDeleteItem = async (item: DeletedItem) => {
    if (!confirm(`⚠️ Permanently delete ${item.name}? This cannot be undone.`)) return;

    setActionLoading(item.id);
    setMessage('');
    try {
      const res = await fetch('/api/admin/recycle-bin', {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: item.type, id: item.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Delete failed');
      }

      showMessage(`✅ ${item.name} permanently deleted`);
      await fetchRecycleBin();
      await fetchTables();
    } catch (err: any) {
      showMessage(`❌ ${err.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelectItem = (itemKey: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(itemKey) ? next.delete(itemKey) : next.add(itemKey);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(deletedItems.map(i => `${i.type}-${i.id}`)));
  };

  const deselectAll = () => setSelectedItems(new Set());

  const bulkDelete = async () => {
    if (!selectedItems.size) return alert('No items selected');
    if (!confirm(`⚠️ Permanently delete ${selectedItems.size} items? This cannot be undone.`)) return;

    setBulkLoading(true);
    try {
      const items = Array.from(selectedItems).map(k => {
        const [type, id] = k.split('-');
        return { type, id: Number(id) };
      });

      const res = await fetch('/api/admin/recycle-bin/bulk-delete', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) throw new Error('Bulk delete failed');

      showMessage(`✅ ${selectedItems.size} items permanently deleted`);
      await fetchRecycleBin();
      setSelectedItems(new Set());
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: COLORS.danger, padding: '1rem', background: '#fee2e2', borderRadius: '8px' }}>
        <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
      </div>
    );
  }

  const getTableCount = (tableName: string) => {
    const table = tables.find(t => t.name === tableName);
    return table?.count || 0;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: COLORS.textPrimary, margin: 0 }}>
          <FontAwesomeIcon icon={faDatabase} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
          {t('dataManagement') || 'Data Management'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: COLORS.textMuted, margin: '0.15rem 0 0 0' }}>
          {t('dataManagementDesc') || 'Export, purge, and manage your database records.'} 
          <span style={{ color: COLORS.danger, fontWeight: '500' }}> ⚠️ Warning: Some actions are permanent and cannot be undone.</span>
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '12px 16px', 
          background: messageType === 'success' ? '#d1fae5' : '#fee2e2', 
          borderRadius: '8px', 
          color: messageType === 'success' ? '#065f46' : '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          borderLeft: `3px solid ${messageType === 'success' ? COLORS.success : COLORS.danger}`,
        }}>
          <FontAwesomeIcon icon={messageType === 'success' ? faCheckCircle : faExclamationTriangle} />
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        
        {/* Export Data Section */}
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '12px',
          boxShadow: COLORS.shadow,
          transition: 'all 0.2s',
          borderLeft: `3px solid ${COLORS.info}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = COLORS.shadowHover;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = COLORS.shadow;
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: `${COLORS.info}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FontAwesomeIcon icon={faDownload} style={{ color: COLORS.info }} />
            </div>
            <h4 style={{ margin: 0, color: COLORS.textPrimary }}>{t('exportData') || 'Export Data'}</h4>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.85rem', color: COLORS.textSecondary }}>
              {t('selectTable') || 'Select Table'}
            </label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.9rem',
                background: 'white',
              }}
            >
              {tables.map(table => (
                <option key={table.name} value={table.name}>
                  {table.name} ({table.count} {t('records') || 'records'})
                </option>
              ))}
            </select>
          </div>
          
          <ActionButton
            label={exportLoading ? (t('exporting') || 'Exporting...') : (t('exportToCsv') || 'Export to CSV')}
            icon={faDownload}
            onClick={exportTable}
            color={COLORS.info}
            disabled={!canEdit}
            loading={exportLoading}
          />
          
          <p style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: '0.5rem' }}>
            {t('exportDesc') || 'Export table data as CSV file for backup or analysis.'}
          </p>
        </div>

        {/* Purge Old Records Section */}
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '12px',
          boxShadow: COLORS.shadow,
          transition: 'all 0.2s',
          borderLeft: `3px solid ${COLORS.danger}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = COLORS.shadowHover;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = COLORS.shadow;
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: `${COLORS.danger}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FontAwesomeIcon icon={faTrashAlt} style={{ color: COLORS.danger }} />
            </div>
            <h4 style={{ margin: 0, color: COLORS.textPrimary }}>{t('purgeOldRecords') || 'Purge Old Records'}</h4>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.85rem', color: COLORS.textSecondary }}>
              {t('deleteRecordsOlderThan') || 'Delete records older than (days)'}
            </label>
            <input
              type="number"
              value={purgeDays}
              onChange={(e) => setPurgeDays(parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.9rem',
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.85rem', color: COLORS.textSecondary }}>
              {t('selectTable') || 'Select Table'}
            </label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.9rem',
                background: 'white',
              }}
            >
              {tables.map(table => (
                <option key={table.name} value={table.name}>{table.name} ({table.count} records)</option>
              ))}
            </select>
          </div>
          
          <ActionButton
            label={purgeLoading ? (t('purging') || 'Purging...') : (t('purgeOldRecords') || 'Purge Old Records')}
            icon={faTrash}
            onClick={purgeOldRecords}
            color={COLORS.danger}
            disabled={!canEdit}
            loading={purgeLoading}
          />
          
          <p style={{ fontSize: '0.75rem', color: COLORS.danger, marginTop: '0.5rem' }}>
            ⚠️ {t('purgeWarning') || 'Permanently delete records older than specified days.'}
          </p>
        </div>

        {/* Cleanup Soft-Deleted Section */}
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '12px',
          boxShadow: COLORS.shadow,
          transition: 'all 0.2s',
          borderLeft: `3px solid ${COLORS.primary}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = COLORS.shadowHover;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = COLORS.shadow;
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: `${COLORS.primary}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FontAwesomeIcon icon={faRecycle} style={{ color: COLORS.primary }} />
            </div>
            <h4 style={{ margin: 0, color: COLORS.textPrimary }}>{t('cleanupSoftDeleted') || 'Cleanup Soft-Deleted Records'}</h4>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.85rem', color: COLORS.textSecondary }}>
              {t('deleteSoftDeletedOlderThan') || 'Delete soft-deleted records older than (days)'}
            </label>
            <input
              type="number"
              value={softDeleteDays}
              onChange={(e) => setSoftDeleteDays(parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.9rem',
              }}
            />
          </div>
          
          <ActionButton
            label={cleanupLoading ? (t('cleaning') || 'Cleaning...') : (t('cleanupSoftDeleted') || 'Cleanup Soft-Deleted')}
            icon={faSave}
            onClick={cleanupSoftDeleted}
            color={COLORS.primary}
            disabled={!canEdit}
            loading={cleanupLoading}
          />
          
          <p style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: '0.5rem' }}>
            {t('cleanupDesc') || 'Permanently remove soft-deleted records older than specified days.'}
          </p>
        </div>
      </div>

      {/* Recycle Bin Section */}
      <div style={{ 
        marginTop: '2rem', 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: '12px',
        boxShadow: COLORS.shadow,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: COLORS.textPrimary }}>
              <FontAwesomeIcon icon={faRecycle} style={{ color: COLORS.primary }} /> {t('recycleBin') || 'Recycle Bin'}
            </h4>
            <p style={{ fontSize: '0.8rem', color: COLORS.textMuted, margin: '0.15rem 0 0 0' }}>
              {deletedItems.length} {t('items') || 'items'} {t('inRecycleBin') || 'in recycle bin'}
            </p>
          </div>
          {deletedItems.length > 0 && canEdit && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={selectAll}
                style={{
                  padding: '6px 12px',
                  background: COLORS.bgGray,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = COLORS.primary;
                  e.currentTarget.style.color = COLORS.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.border;
                  e.currentTarget.style.color = COLORS.textPrimary;
                }}
              >
                <FontAwesomeIcon icon={faCheckSquare} /> {t('selectAll') || 'Select All'}
              </button>
              <button
                onClick={deselectAll}
                style={{
                  padding: '6px 12px',
                  background: COLORS.bgGray,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = COLORS.primary;
                  e.currentTarget.style.color = COLORS.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.border;
                  e.currentTarget.style.color = COLORS.textPrimary;
                }}
              >
                <FontAwesomeIcon icon={faSquare} /> {t('deselectAll') || 'Deselect All'}
              </button>
              {selectedItems.size > 0 && (
                <button
                  onClick={bulkDelete}
                  disabled={bulkLoading}
                  style={{
                    padding: '6px 12px',
                    background: COLORS.danger,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: bulkLoading ? 'not-allowed' : 'pointer',
                    color: 'white',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!bulkLoading) {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!bulkLoading) {
                      e.currentTarget.style.backgroundColor = COLORS.danger;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                  {bulkLoading ? (t('deleting') || 'Deleting...') : `${t('deleteSelected') || 'Delete Selected'} (${selectedItems.size})`}
                </button>
              )}
            </div>
          )}
        </div>

        {recycleLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : deletedItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: COLORS.textMuted }}>
            <FontAwesomeIcon icon={faRecycle} style={{ fontSize: '2rem', marginBottom: '1rem', color: COLORS.textMuted }} />
            <p>{t('noDeletedItems') || 'No deleted items found.'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: COLORS.bgGray, borderBottom: `1px solid ${COLORS.border}` }}>
                  <th style={{ padding: '12px', textAlign: 'center', width: '40px' }}>
                    <FontAwesomeIcon icon={faLayerGroup} />
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('type') || 'Type'}
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('nameIdentifier') || 'Name / Identifier'}
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    <FontAwesomeIcon icon={faClock} style={{ marginRight: '0.3rem' }} /> {t('deletedAt') || 'Deleted At'}
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('deletedBy') || 'Deleted By'}
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {t('actions') || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {deletedItems.map((item) => (
                  <tr
                    key={`${item.type}-${item.id}`}
                    style={{
                      borderBottom: `1px solid ${COLORS.border}`,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.bgGray;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedItems.has(`${item.type}-${item.id}`)}
                        onChange={() => toggleSelectItem(`${item.type}-${item.id}`)}
                        disabled={!canEdit}
                        style={{ accentColor: COLORS.primary }}
                      />
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '500',
                        background: `${COLORS.primary}15`,
                        color: COLORS.primary,
                      }}>
                        {item.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: '500', color: COLORS.textPrimary }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                      {new Date(item.deleted_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                      {item.deleted_by || 'System'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => restoreItem(item)}
                          disabled={actionLoading === item.id}
                          style={{
                            padding: '4px 10px',
                            background: COLORS.success,
                            border: 'none',
                            borderRadius: '6px',
                            cursor: actionLoading === item.id ? 'not-allowed' : 'pointer',
                            color: 'white',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.2s',
                            opacity: actionLoading === item.id ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (actionLoading !== item.id) {
                              e.currentTarget.style.backgroundColor = '#059669';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (actionLoading !== item.id) {
                              e.currentTarget.style.backgroundColor = COLORS.success;
                              e.currentTarget.style.transform = 'translateY(0)';
                            }
                          }}
                        >
                          <FontAwesomeIcon icon={faUndo} /> {t('restore') || 'Restore'}
                        </button>
                        <button
                          onClick={() => permanentDeleteItem(item)}
                          disabled={actionLoading === item.id}
                          style={{
                            padding: '4px 10px',
                            background: COLORS.danger,
                            border: 'none',
                            borderRadius: '6px',
                            cursor: actionLoading === item.id ? 'not-allowed' : 'pointer',
                            color: 'white',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.2s',
                            opacity: actionLoading === item.id ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (actionLoading !== item.id) {
                              e.currentTarget.style.backgroundColor = '#dc2626';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (actionLoading !== item.id) {
                              e.currentTarget.style.backgroundColor = COLORS.danger;
                              e.currentTarget.style.transform = 'translateY(0)';
                            }
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} /> {t('delete') || 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx global>{`
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid ${COLORS.border};
          border-top-color: ${COLORS.primary};
          borderRadius: '50%';
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}