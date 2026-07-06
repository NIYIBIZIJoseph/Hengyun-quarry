import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faFileExport,
  faCheckCircle,
  faExclamationTriangle,
  faUmbrellaBeach,
  faTimesCircle,
  faSave,
  faUsers,
  faCalendarAlt,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== CLEAN DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  bgGray: "#f9fafb",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowHover: "0 8px 25px rgba(0,0,0,0.08)",
};

// ========== UPDATED KPI CARD - BLACK NUMBERS ==========
function KpiCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendLabel,
  bgColor = 'white' 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  trend?: number;
  trendLabel?: string;
  bgColor?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  const isPositive = trend && trend > 0;
  const trendColor = isPositive ? '#10b981' : trend && trend < 0 ? '#ef4444' : COLORS.textMuted;
  const trendIcon = isPositive ? '↑' : trend && trend < 0 ? '↓' : '→';

  return (
    <div
      style={{
        background: bgColor,
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        boxShadow: isHovered ? COLORS.shadowHover : COLORS.shadow,
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        borderLeft: `3px solid ${COLORS.primary}`,
        cursor: 'default',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <FontAwesomeIcon icon={icon} style={{ color: COLORS.primary, fontSize: '0.8rem' }} />
        <span style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          {title}
        </span>
      </div>
      {/* BLACK NUMBER - FIXED */}
      <div style={{ fontSize: '1.75rem', fontWeight: '700', color: COLORS.textPrimary }}>
        {value}
      </div>
      {trend !== undefined && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.3rem',
          marginTop: '0.2rem',
          fontSize: '0.7rem',
          color: trendColor,
          fontWeight: '500'
        }}>
          <span>{trendIcon} {Math.abs(trend)}%</span>
          <span style={{ color: COLORS.textMuted, fontWeight: '400' }}>
            {trendLabel || 'vs last month'}
          </span>
        </div>
      )}
    </div>
  );
}

// ========== STATUS ICON WITH DIFFERENT COLORS ==========
function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'present':
      return <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10b981', fontSize: '1.1rem' }} />;
    case 'late':
      return <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#f59e0b', fontSize: '1.1rem' }} />;
    case 'leave':
      return <FontAwesomeIcon icon={faUmbrellaBeach} style={{ color: '#3b82f6', fontSize: '1.1rem' }} />;
    default:
      return <FontAwesomeIcon icon={faTimesCircle} style={{ color: '#ef4444', fontSize: '1.1rem' }} />;
  }
}

export default function WeeklyAttendance() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedCell, setSelectedCell] = useState<any>(null);
  const [overrideStatus, setOverrideStatus] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // ========== NEW FILTER STATES ==========
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchData = async (start?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (start) params.append('weekStart', start);
    if (departmentFilter) params.append('department_id', departmentFilter);
    params.append('_t', Date.now().toString());
    try {
      const res = await fetch(`/api/attendance/weekly?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      if (!weekStart && json.week) setWeekStart(json.week.start);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetch('/api/departments', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(setDepartments)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (weekStart) fetchData(weekStart);
  }, [weekStart, departmentFilter, refreshKey]);

  const changeWeek = (delta: number) => {
    const current = new Date(weekStart);
    current.setDate(current.getDate() + delta * 7);
    setWeekStart(formatLocalDate(current));
  };

  const handleCellClick = (worker: any, day: any, date: string) => {
    setSelectedCell({ worker, day, date });
    setOverrideStatus(day.status);
  };

  const handleOverride = async () => {
    if (!selectedCell) return;
    try {
      const res = await fetch('/api/attendance/override', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          worker_id: selectedCell.worker.id,
          date: selectedCell.date,
          status: overrideStatus,
          reason: 'Manual override',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t('overrideFailed') || 'Override failed');
      setRefreshKey(prev => prev + 1);
      setSelectedCell(null);
    } catch (err: any) {
      alert(`${t('overrideFailed') || 'Override error'}: ${err.message}`);
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const headers = [t('worker') || 'Worker', t('department') || 'Department', ...data.days.map((d: any) => d.label)];
    const rows = data.workers.map((w: any) => [
      w.name,
      w.department,
      ...w.days.map((d: any) => {
        if (d.status === 'present') return 'P';
        if (d.status === 'late') return 'L';
        if (d.status === 'leave') return 'LV';
        return 'A';
      }),
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${data.week.start}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTranslatedDayLabel = (label: string) => {
    const dayMap: Record<string, string> = {
      'Mon': t('mon') || 'Mon',
      'Tue': t('tue') || 'Tue',
      'Wed': t('wed') || 'Wed',
      'Thu': t('thu') || 'Thu',
      'Fri': t('fri') || 'Fri',
      'Sat': t('sat') || 'Sat',
      'Sun': t('sun') || 'Sun',
    };
    return dayMap[label] || label;
  };

  // ========== FILTER WORKERS ==========
  const filteredWorkers = data?.workers?.filter((worker: any) => {
    // Search by name
    if (searchTerm && !worker.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filter by status
    if (statusFilter) {
      const hasStatus = worker.days.some((day: any) => day.status === statusFilter);
      if (!hasStatus) return false;
    }
    
    return true;
  }) || [];

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: COLORS.textMuted }}>
          {t('loadingAttendance') || 'Loading attendance...'}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div style={{ padding: '2rem', textAlign: 'center', color: COLORS.textMuted }}>
          {t('error') || 'Error'}: {error}
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div style={{ padding: '2rem', textAlign: 'center', color: COLORS.textMuted }}>
          {t('noData') || 'No data available'}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
            <FontAwesomeIcon icon={faCalendarAlt} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
            {t('weeklyAttendance') || 'Weekly Attendance'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0.15rem 0 0 0' }}>
            {t('trackAttendance') || 'Track and manage weekly attendance'}
          </p>
        </div>

        {/* Controls */}
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
          <button
            onClick={() => changeWeek(-1)}
            style={{
              padding: '0.4rem 1rem',
              background: COLORS.bgGray,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.border;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.bgGray;
            }}
          >
            <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: '0.7rem' }} /> {t('prevWeek') || 'Prev Week'}
          </button>
          <span style={{ fontSize: '0.85rem', fontWeight: '500', color: COLORS.textPrimary }}>
            {t('weekStarting') || 'Week starting'} {data.week.start}
          </span>
          <button
            onClick={() => changeWeek(1)}
            style={{
              padding: '0.4rem 1rem',
              background: COLORS.bgGray,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.border;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.bgGray;
            }}
          >
            {t('nextWeek') || 'Next Week'} <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '0.7rem' }} />
          </button>
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            style={{
              padding: '0.4rem 0.75rem',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              fontSize: '0.85rem',
              background: COLORS.bgGray,
              minWidth: '150px',
            }}
          >
            <option value="">{t('allDepartments') || 'All Departments'}</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button
            onClick={exportCSV}
            style={{
              padding: '0.4rem 1rem',
              background: COLORS.primary,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'white',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.primaryDark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.primary;
            }}
          >
            <FontAwesomeIcon icon={faFileExport} style={{ fontSize: '0.7rem' }} /> {t('exportCSV') || 'Export CSV'}
          </button>
          {departmentFilter && (
            <button
              onClick={() => setDepartmentFilter('')}
              style={{
                padding: '0.3rem 0.8rem',
                background: COLORS.bgGray,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.7rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.bgGray;
              }}
            >
              {t('clear') || 'Clear'}
            </button>
          )}
        </div>

        {/* ========== NEW SEARCH & FILTER SECTION ========== */}
        <div style={{
          background: 'white',
          padding: '0.75rem 1rem',
          borderRadius: '12px',
          marginBottom: '1rem',
          boxShadow: COLORS.shadow,
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: '1', minWidth: '150px' }}>
            <FontAwesomeIcon icon={faSearch} style={{ color: COLORS.textMuted, fontSize: '0.8rem' }} />
            <input
              type="text"
              placeholder={t('searchByName') || 'Search by name...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.4rem 0.75rem',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '6px',
                fontSize: '0.85rem',
                width: '100%',
                background: COLORS.bgGray,
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.primary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
              }}
            />
          </div>
          
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: '0.4rem 0.75rem',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              fontSize: '0.85rem',
              background: COLORS.bgGray,
              outline: 'none',
              minWidth: '140px',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.primary;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.border;
            }}
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.4rem 0.75rem',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              fontSize: '0.85rem',
              background: COLORS.bgGray,
              minWidth: '130px',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.primary;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.border;
            }}
          >
            <option value="">{t('allStatus') || 'All Status'}</option>
            <option value="present">{t('present') || 'Present'}</option>
            <option value="absent">{t('absent') || 'Absent'}</option>
            <option value="late">{t('late') || 'Late'}</option>
            <option value="leave">{t('leave') || 'Leave'}</option>
          </select>
          
          {(searchTerm || dateFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFilter('');
                setStatusFilter('');
              }}
              style={{
                padding: '0.3rem 0.8rem',
                background: COLORS.bgGray,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.7rem',
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
              {t('clearAll') || 'Clear All'}
            </button>
          )}
        </div>

        {/* ========== UPDATED KPI CARDS WITH BLACK NUMBERS ========== */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
          gap: '1rem', 
          marginBottom: '1.5rem' 
        }}>
          <KpiCard
            title={t('activeWorkers') || 'Active Workers'}
            value={data.summary.totalWorkers || 0}
            icon={faUsers}
            trend={3}
            trendLabel="vs last month"
          />
          <KpiCard
            title={t('presentToday') || 'Present Today'}
            value={data.summary.presentToday || 0}
            icon={faCheckCircle}
            trend={13}
            trendLabel="vs last month"
          />
          <KpiCard
            title={t('absent') || 'Absent'}
            value={data.summary.absentToday || 0}
            icon={faTimesCircle}
            trend={-5}
            trendLabel="vs last month"
          />
          <KpiCard
            title={t('late') || 'Late'}
            value={data.summary.lateToday || 0}
            icon={faExclamationTriangle}
            trend={-2}
            trendLabel="vs last month"
          />
          <KpiCard
            title={t('onLeave') || 'On Leave'}
            value={data.summary.onLeaveToday || 0}
            icon={faUmbrellaBeach}
            trend={0}
            trendLabel="approved"
          />
        </div>

        {/* Attendance Table */}
        <div style={{ overflowX: 'auto' }} key={refreshKey}>
          <table style={{ borderCollapse: 'collapse', width: '100%', background: 'white', borderRadius: '12px', boxShadow: COLORS.shadow }}>
            <thead style={{ background: COLORS.bgGray }}>
              <tr>
                <th style={{ border: `1px solid ${COLORS.border}`, padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                  {t('workerDepartment') || 'Worker / Department'}
                </th>
                {data.days.map((day: any) => (
                  <th key={day.date} style={{ border: `1px solid ${COLORS.border}`, padding: '0.75rem 0.5rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textMuted, fontWeight: '600' }}>
                    {getTranslatedDayLabel(day.label)}<br />
                    <span style={{ fontWeight: '400', fontSize: '0.6rem', color: COLORS.textMuted }}>{day.date}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.map((worker: any) => (
                <tr key={worker.id} style={{ transition: 'background 0.2s' }}>
                  <td style={{ border: `1px solid ${COLORS.border}`, padding: '0.75rem 1rem', fontWeight: '500', color: COLORS.textPrimary }}>
                    {worker.name}
                    <br />
                    <span style={{ fontSize: '0.7rem', color: COLORS.textMuted }}>{worker.department}</span>
                  </td>
                  {worker.days.map((day: any, idx: number) => (
                    <td
                      key={`${worker.id}-${idx}`}
                      onClick={() => handleCellClick(worker, day, data.days[idx].date)}
                      style={{
                        border: `1px solid ${COLORS.border}`,
                        padding: '0.75rem 0.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.bgGray;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title={t('clickToOverride') || 'Click to override'}
                    >
                      <StatusIcon status={day.status} />
                    </td>
                  ))}
                </tr>
              ))}
              {filteredWorkers.length === 0 && (
                <tr>
                  <td colSpan={data.days.length + 1} style={{ 
                    padding: '2rem', 
                    textAlign: 'center', 
                    color: COLORS.textMuted,
                    fontSize: '0.85rem'
                  }}>
                    {t('noWorkersFound') || 'No workers found matching your filters'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Override Modal */}
        {selectedCell && (
          <div
            style={{
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
            }}
            onClick={() => setSelectedCell(null)}
          >
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '16px',
              width: '420px',
              maxWidth: '90%',
              boxShadow: COLORS.shadowHover,
            }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '0.5rem' }}>
                {t('overrideAttendance') || 'Override Attendance'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary }}>
                <strong>{selectedCell.worker.name}</strong> – {selectedCell.date}
              </p>
              <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, marginBottom: '1rem' }}>
                {t('currentStatus') || 'Current status'}: <strong>{selectedCell.day.status}</strong>
              </p>
              <select
                value={overrideStatus}
                onChange={e => setOverrideStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  marginBottom: '1rem',
                  background: 'white',
                }}
              >
                <option value="present">{t('present') || 'Present'}</option>
                <option value="late">{t('late') || 'Late'}</option>
                <option value="absent">{t('absent') || 'Absent'}</option>
                <option value="leave">{t('leave') || 'Leave'}</option>
              </select>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSelectedCell(null)}
                  style={{
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
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleOverride}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: COLORS.primary,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: 'white',
                    fontWeight: '500',
                    fontSize: '0.85rem',
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
                  <FontAwesomeIcon icon={faSave} style={{ fontSize: '0.7rem' }} /> {t('saveOverride') || 'Save Override'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}