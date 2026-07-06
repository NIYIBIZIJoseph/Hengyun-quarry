// src/pages/dashboard/settings/audit.tsx
import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHistory, faEye, faChevronLeft, 
  faChevronRight, faSearch, faTimes,
  faUser, faClock, faInfoCircle, faFileExport
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

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

// ========== ACTION BADGE ==========
function ActionBadge({ action }: { action: string }) {
  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) return COLORS.success;
    if (action.includes('update') || action.includes('edit')) return COLORS.primary;
    if (action.includes('delete') || action.includes('remove')) return COLORS.danger;
    if (action.includes('login')) return COLORS.info;
    if (action.includes('logout')) return COLORS.textMuted;
    return COLORS.textMuted;
  };

  const getActionIcon = (action: string) => {
    if (action.includes('create') || action.includes('add')) return '➕';
    if (action.includes('update') || action.includes('edit')) return '✏️';
    if (action.includes('delete') || action.includes('remove')) return '🗑️';
    if (action.includes('login')) return '🔐';
    if (action.includes('logout')) return '🚪';
    return '📝';
  };

  const color = getActionColor(action);

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      padding: '0.2rem 0.6rem',
      borderRadius: '12px',
      background: `${color}15`,
      color: color,
      fontSize: '0.75rem',
      fontWeight: '500',
    }}>
      {getActionIcon(action)} {action}
    </span>
  );
}

export default function AuditLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, search, actionFilter]);

  async function fetchLogs() {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', '30');
    if (search) params.append('search', search);
    if (actionFilter) params.append('action', actionFilter);
    
    try {
      const res = await fetch(`/api/audit?${params.toString()}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalLogs(data.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['User', 'Action', 'Target', 'IP Address', 'Time', 'Details'];
    const rows = logs.map(log => [
      log.user_name || log.user_id || 'system',
      log.action,
      `${log.target_type}#${log.target_id}`,
      log.ip_address || '-',
      new Date(log.created_at).toLocaleString(),
      JSON.stringify(log.old_data || {}),
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header with Stats */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: COLORS.textPrimary, margin: 0 }}>
            <FontAwesomeIcon icon={faHistory} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
            {t('auditLogs') || 'Audit Logs'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: COLORS.textMuted, margin: '0.15rem 0 0 0' }}>
            {t('auditLogsDesc') || 'View system activity and audit trails'} • <strong>{totalLogs}</strong> {t('records') || 'records'}
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={logs.length === 0}
          style={{
            padding: '0.5rem 1.25rem',
            background: COLORS.primary,
            border: 'none',
            borderRadius: '8px',
            cursor: logs.length === 0 ? 'not-allowed' : 'pointer',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            opacity: logs.length === 0 ? 0.5 : 1,
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
          }}
          onMouseEnter={(e) => {
            if (logs.length > 0) {
              e.currentTarget.style.backgroundColor = COLORS.primaryDark;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (logs.length > 0) {
              e.currentTarget.style.backgroundColor = COLORS.primary;
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <FontAwesomeIcon icon={faFileExport} /> {t('exportCSV') || 'Export CSV'}
        </button>
      </div>

      {/* Search and Filters */}
      <div style={{
        background: 'white',
        padding: '1rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        boxShadow: COLORS.shadow,
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
          <input
            type="text"
            placeholder={t('searchAuditLogs') || 'Search by user, action, target...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
            fontSize: '0.85rem',
            background: COLORS.bgGray,
            minWidth: '150px',
          }}
        >
          <option value="">{t('allActions') || 'All Actions'}</option>
          <option value="create">{t('create') || 'Create'}</option>
          <option value="update">{t('update') || 'Update'}</option>
          <option value="delete">{t('delete') || 'Delete'}</option>
          <option value="login">{t('login') || 'Login'}</option>
          <option value="logout">{t('logout') || 'Logout'}</option>
        </select>
        {(search || actionFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setActionFilter('');
              setPage(1);
            }}
            style={{
              padding: '0.4rem 1rem',
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
            <FontAwesomeIcon icon={faTimes} style={{ fontSize: '0.7rem' }} />
            {t('clearFilters') || 'Clear Filters'}
          </button>
        )}
      </div>

      {/* Logs Table */}
      {logs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'white',
          borderRadius: '12px',
          boxShadow: COLORS.shadow,
        }}>
          <FontAwesomeIcon icon={faHistory} style={{ fontSize: '3rem', color: COLORS.textMuted, marginBottom: '1rem' }} />
          <h3 style={{ color: COLORS.textSecondary, fontSize: '1rem' }}>{t('noLogsFound') || 'No audit logs found'}</h3>
          <p style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>
            {t('tryAdjustingFilters') || 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div style={{ 
          overflowX: 'auto', 
          background: 'white', 
          borderRadius: '12px', 
          boxShadow: COLORS.shadow,
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: COLORS.bgGray, borderBottom: `1px solid ${COLORS.border}` }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                  <FontAwesomeIcon icon={faUser} style={{ marginRight: '0.3rem' }} /> {t('user') || 'User'}
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                  {t('action') || 'Action'}
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                  {t('target') || 'Target'}
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                  <FontAwesomeIcon icon={faClock} style={{ marginRight: '0.3rem' }} /> {t('time') || 'Time'}
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                  {t('details') || 'Details'}
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr 
                  key={log.id} 
                  style={{ 
                    borderBottom: `1px solid ${COLORS.border}`,
                    backgroundColor: expandedRow === index ? COLORS.bgGray : 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (expandedRow !== index) {
                      e.currentTarget.style.backgroundColor = COLORS.bgGray;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (expandedRow !== index) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: '500', fontSize: '0.85rem', color: COLORS.textPrimary }}>
                      {log.user_name || log.user_id || 'system'}
                    </div>
                    {log.ip_address && (
                      <div style={{ fontSize: '0.65rem', color: COLORS.textMuted }}>
                        {log.ip_address}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <ActionBadge action={log.action} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                    {log.target_type} #{log.target_id}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: COLORS.textMuted }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: COLORS.primary,
                        cursor: 'pointer',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        transition: 'all 0.2s',
                        fontSize: '0.8rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${COLORS.primary}15`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <FontAwesomeIcon icon={faEye} /> 
                      {expandedRow === index ? (t('hide') || 'Hide') : (t('view') || 'View')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginTop: '1.5rem', 
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '6px 14px',
              background: page === 1 ? COLORS.bgGray : 'white',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              color: page === 1 ? COLORS.textMuted : COLORS.textPrimary,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
            onMouseEnter={(e) => {
              if (page !== 1) {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.color = COLORS.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (page !== 1) {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.color = COLORS.textPrimary;
              }
            }}
          >
            <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: '0.7rem' }} />
            {t('previous') || 'Previous'}
          </button>
          <span style={{ padding: '6px 14px', fontSize: '0.85rem', color: COLORS.textSecondary }}>
            {t('page') || 'Page'} {page} {t('of') || 'of'} {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '6px 14px',
              background: page === totalPages ? COLORS.bgGray : 'white',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              color: page === totalPages ? COLORS.textMuted : COLORS.textPrimary,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
            onMouseEnter={(e) => {
              if (page !== totalPages) {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.color = COLORS.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (page !== totalPages) {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.color = COLORS.textPrimary;
              }
            }}
          >
            {t('next') || 'Next'}
            <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '0.7rem' }} />
          </button>
        </div>
      )}

      {/* Expanded Details Row */}
      {expandedRow !== null && logs[expandedRow] && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: COLORS.bgGray,
          borderRadius: '8px',
          border: `1px solid ${COLORS.border}`,
          animation: 'slideDown 0.3s ease',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <strong style={{ fontSize: '0.8rem', color: COLORS.textSecondary, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <FontAwesomeIcon icon={faInfoCircle} style={{ color: COLORS.primary }} />
                {t('oldData') || 'Old Data'}:
              </strong>
              <pre style={{ 
                background: 'white', 
                padding: '0.5rem', 
                borderRadius: '6px', 
                fontSize: '0.75rem',
                overflowX: 'auto',
                maxHeight: '150px',
                border: `1px solid ${COLORS.border}`,
                marginTop: '0.25rem',
              }}>
                {JSON.stringify(logs[expandedRow].old_data, null, 2)}
              </pre>
            </div>
            <div>
              <strong style={{ fontSize: '0.8rem', color: COLORS.textSecondary, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <FontAwesomeIcon icon={faInfoCircle} style={{ color: COLORS.primary }} />
                {t('newData') || 'New Data'}:
              </strong>
              <pre style={{ 
                background: 'white', 
                padding: '0.5rem', 
                borderRadius: '6px', 
                fontSize: '0.75rem',
                overflowX: 'auto',
                maxHeight: '150px',
                border: `1px solid ${COLORS.border}`,
                marginTop: '0.25rem',
              }}>
                {JSON.stringify(logs[expandedRow].new_data, null, 2)}
              </pre>
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
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}