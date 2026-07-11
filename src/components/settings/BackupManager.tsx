import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDatabase, faDownload, faTrashAlt, faRefresh,
  faCheckCircle, faExclamationTriangle, faSpinner,
  faClock, faFile, faHistory, faSave, faUndo
} from '@fortawesome/free-solid-svg-icons';

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

interface Backup {
  id: number;
  filename: string;
  file_size: number;
  backup_type: string;
  status: string;
  created_at: string;
  completed_at: string;
  created_by_name: string;
}

export default function BackupManager() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [restoring, setRestoring] = useState<number | null>(null);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/backup', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
      }
    } catch (err) {
      console.error('Error fetching backups:', err);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    if (!confirm('Create a new database backup? This may take a few moments.')) return;
    
    setCreating(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type: 'manual' }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Backup created successfully!');
        await fetchBackups();
        setTimeout(() => setMessage(''), 5000);
      } else {
        setError(data.error || 'Failed to create backup');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = async (id: number, filename: string) => {
    try {
      const res = await fetch(`/api/admin/backup/download?id=${id}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to download backup');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to download backup');
    }
  };

  const deleteBackup = async (id: number) => {
    if (!confirm('Delete this backup file? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/admin/backup?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setMessage('Backup deleted successfully');
        await fetchBackups();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete backup');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete backup');
    }
  };

  const restoreBackup = async (id: number) => {
    if (!confirm('⚠️ RESTORE BACKUP\n\nThis will restore the database to the state of this backup.\n\nAll current data will be REPLACED with the backup data.\n\nAre you sure you want to continue?')) return;
    
    if (!confirm('⚠️ FINAL WARNING\n\nThis action CANNOT be undone!\n\nAll existing data will be replaced with the backup data.\n\nType "RESTORE" to confirm:')) return;
    
    setRestoring(id);
    try {
      const res = await fetch(`/api/admin/backup?id=${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Database restored successfully! Refreshing...');
        setTimeout(() => window.location.reload(), 3000);
      } else {
        setError(data.error || 'Failed to restore backup');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to restore backup');
    } finally {
      setRestoring(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', margin: 0, color: COLORS.textPrimary }}>
            <FontAwesomeIcon icon={faDatabase} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
            Database Backup & Restore
          </h3>
          <p style={{ color: COLORS.textMuted, fontSize: '0.85rem', margin: 0 }}>
            Manage database backups, restore previous versions, and view backup history.
          </p>
        </div>
        <button
          onClick={createBackup}
          disabled={creating}
          style={{
            padding: '10px 24px',
            background: COLORS.primary,
            border: 'none',
            borderRadius: '8px',
            cursor: creating ? 'not-allowed' : 'pointer',
            color: 'white',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            opacity: creating ? 0.6 : 1,
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
          }}
          onMouseEnter={(e) => {
            if (!creating) {
              e.currentTarget.style.backgroundColor = COLORS.primaryDark;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!creating) {
              e.currentTarget.style.backgroundColor = COLORS.primary;
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {creating ? (
            <><FontAwesomeIcon icon={faSpinner} spin /> Creating...</>
          ) : (
            <><FontAwesomeIcon icon={faSave} /> Create Backup</>
          )}
        </button>
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

      {/* Backup Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: COLORS.shadow, textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary }}>{backups.length}</div>
          <div style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>Total Backups</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: COLORS.shadow, textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary }}>
            {backups.filter(b => b.status === 'completed').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>Completed</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: COLORS.shadow, textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary }}>
            {backups.length > 0 ? formatFileSize(backups.reduce((sum, b) => sum + b.file_size, 0)) : '0 B'}
          </div>
          <div style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>Total Size</div>
        </div>
      </div>

      {/* Backup List */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: COLORS.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '1rem', background: COLORS.bgGray, borderBottom: `1px solid ${COLORS.border}` }}>
          <strong style={{ color: COLORS.textPrimary }}>
            <FontAwesomeIcon icon={faHistory} style={{ marginRight: '0.5rem' }} />
            Backup History
          </strong>
        </div>

        {backups.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: COLORS.textMuted }}>
            <FontAwesomeIcon icon={faDatabase} style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
            <p>No backups found. Create your first backup!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: COLORS.bgGray, borderBottom: `1px solid ${COLORS.border}` }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: COLORS.textMuted }}>Filename</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: COLORS.textMuted }}>Size</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: COLORS.textMuted }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: COLORS.textMuted }}>Created</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', color: COLORS.textMuted }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <FontAwesomeIcon icon={faFile} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
                      <span style={{ fontSize: '0.85rem', color: COLORS.textPrimary }}>{backup.filename}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                      {formatFileSize(backup.file_size)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        background: backup.backup_type === 'manual' ? COLORS.primary + '20' : COLORS.info + '20',
                        color: backup.backup_type === 'manual' ? COLORS.primary : COLORS.info,
                        fontWeight: '600',
                        textTransform: 'uppercase',
                      }}>
                        {backup.backup_type}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: COLORS.textSecondary }}>
                      {new Date(backup.created_at).toLocaleString()}
                      {backup.created_by_name && (
                        <div style={{ fontSize: '0.7rem', color: COLORS.textMuted }}>by {backup.created_by_name}</div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => downloadBackup(backup.id, backup.filename)}
                          title="Download"
                          style={{
                            padding: '0.3rem 0.6rem',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: COLORS.info,
                            borderRadius: '4px',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.info + '20';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </button>
                        <button
                          onClick={() => restoreBackup(backup.id)}
                          disabled={restoring === backup.id}
                          title="Restore"
                          style={{
                            padding: '0.3rem 0.6rem',
                            background: 'transparent',
                            border: 'none',
                            cursor: restoring === backup.id ? 'not-allowed' : 'pointer',
                            color: COLORS.danger,
                            borderRadius: '4px',
                            transition: 'all 0.2s',
                            opacity: restoring === backup.id ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (restoring !== backup.id) {
                              e.currentTarget.style.backgroundColor = COLORS.danger + '20';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {restoring === backup.id ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                          ) : (
                            <FontAwesomeIcon icon={faUndo} />
                          )}
                        </button>
                        <button
                          onClick={() => deleteBackup(backup.id)}
                          title="Delete"
                          style={{
                            padding: '0.3rem 0.6rem',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: COLORS.danger,
                            borderRadius: '4px',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.danger + '20';
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