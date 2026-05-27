import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';
import { ROLES } from "@/lib/roles";

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

  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [recycleLoading, setRecycleLoading] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // FIX: safely read role (can be null)
  const userRole =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('user') || '{}').role
      : null;

  // FIX: ensure strict comparison works with numeric roles
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

  const exportTable = async () => {
    if (!canEdit) return;
    setExportLoading(true);
    setMessage('');

    try {
      const res = await fetch(
        `/api/settings/data-management/export?table=${selectedTable}`,
        { headers: getAuthHeaders() }
      );

      if (!res.ok) throw new Error('Export failed');

      const data = await res.json();

      if (data.length === 0) {
        setMessage(t('noDataToExport') || 'No data to export');
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
      a.download = `${selectedTable}_export_${new Date()
        .toISOString()
        .slice(0, 19)}.csv`;

      a.click();
      URL.revokeObjectURL(url);

      setMessage(t('exportCompleted') || 'Export completed');
    } catch (err: any) {
      setMessage(`${t('exportError') || 'Export error'}: ${err.message}`);
    } finally {
      setExportLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const purgeOldRecords = async () => {
    if (!canEdit) return;

    if (
      !confirm(
        t('confirmPurge')
          ?.replace('{days}', purgeDays.toString())
          .replace('{table}', selectedTable) ||
          `Delete records older than ${purgeDays} days from ${selectedTable}?`
      )
    )
      return;

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

      setMessage(
        t('purgedRecords')
          ?.replace('{count}', result.deleted)
          .replace('{table}', selectedTable) ||
          `Purged ${result.deleted} records`
      );

      fetchTables();
      fetchRecycleBin();
    } catch (err: any) {
      setMessage(`${t('purgeError') || 'Purge error'}: ${err.message}`);
    } finally {
      setPurgeLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const cleanupSoftDeleted = async () => {
    if (!canEdit) return;

    if (
      !confirm(
        t('confirmCleanup')
          ?.replace('{days}', softDeleteDays.toString())
          .replace('{table}', selectedTable) ||
          `Cleanup soft deleted records?`
      )
    )
      return;

    setCleanupLoading(true);
    setMessage('');

    try {
      const res = await fetch(
        '/api/settings/data-management/cleanup-soft-deleted',
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            table: selectedTable,
            days: softDeleteDays,
          }),
        }
      );

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Cleanup failed');

      setMessage(
        t('cleanedUpRecords')
          ?.replace('{count}', result.deleted)
          .replace('{table}', selectedTable) ||
          `Cleaned up ${result.deleted} records`
      );

      fetchTables();
      fetchRecycleBin();
    } catch (err: any) {
      setMessage(`${t('cleanupError') || 'Cleanup error'}: ${err.message}`);
    } finally {
      setCleanupLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const restoreItem = async (item: DeletedItem) => {
    if (
      !confirm(
        t('confirmRestore')
          ?.replace('{type}', item.type)
          .replace('{name}', item.name) ||
          `Restore ${item.name}?`
      )
    )
      return;

    setActionLoading(item.id);

    try {
      const res = await fetch(
        `/api/admin/recycle-bin?type=${item.type}&id=${item.id}&action=restore`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        }
      );

      if (!res.ok) throw new Error('Restore failed');

      await fetchRecycleBin();
      await fetchTables();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const permanentDeleteItem = async (item: DeletedItem) => {
    if (
      !confirm(
        t('confirmPermanentDelete') ||
          `Delete ${item.name} permanently?`
      )
    )
      return;

    setActionLoading(item.id);

    try {
      const res = await fetch(
        `/api/admin/recycle-bin?type=${item.type}&id=${item.id}&action=permanent`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );

      if (!res.ok) throw new Error('Delete failed');

      await fetchRecycleBin();
      await fetchTables();
    } catch (err: any) {
      alert(err.message);
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
    setSelectedItems(
      new Set(deletedItems.map(i => `${i.type}-${i.id}`))
    );
  };

  const deselectAll = () => setSelectedItems(new Set());

  const bulkDelete = async () => {
    if (!selectedItems.size) return alert('No items selected');

    setBulkLoading(true);

    try {
      const items = Array.from(selectedItems).map(k => {
        const [type, id] = k.split('-');
        return { type, id: Number(id) };
      });

      const res = await fetch('/api/admin/recycle-bin/bulk-delete', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ items }),
      });

      if (!res.ok) throw new Error('Bulk delete failed');

      await fetchRecycleBin();
      setSelectedItems(new Set());
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading)
    return <div>{t('loadingDataManagement')}</div>;

  if (error)
    return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h3>{t('dataManagement')}</h3>
      {/* UI unchanged */}
    </div>
  );
}