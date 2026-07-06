// src/pages/dashboard/workers/[id].tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faUser, faPhoneAlt, faEnvelope, faBuilding, faMoneyBillWave,
  faCalendarAlt, faMapMarkerAlt, faCheckCircle, faTimesCircle, faFileAlt,
  faUmbrellaBeach, faStar, faChartLine, faEdit, faTrashAlt, faSave, faTimes,
  faUpload, faPrint, faHistory, faExclamationTriangle, faUserCircle,
  faBriefcase, faClock, faEye
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== DESIGN TOKENS - SINGLE ACCENT COLOR ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  success: "#10b981",
  danger: "#ef4444",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  bgGray: "#f9fafb",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowHover: "0 8px 25px rgba(0,0,0,0.08)",
};

interface Worker {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  department_name?: string;
  salary: number;
  join_date: string;
  location: string;
  image_url: string;
  is_active: boolean;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  status: string;
  status_reason: string;
}

interface SalaryRecord {
  id: number;
  old_salary: number;
  new_salary: number;
  effective_date: string;
  reason: string;
}

interface Document {
  id: number;
  type: string;
  title: string;
  file_url: string;
  uploaded_at: string;
}

interface LeaveRequest {
  id: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
}

interface PerformanceReview {
  id: number;
  review_date: string;
  reviewer: string;
  rating: number;
  comments: string;
}

interface AttendanceSummary {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
}

// ========== TAB BUTTON ==========
function TabButton({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon: any }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.6rem 1.25rem',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontWeight: active ? '600' : '400',
        borderBottom: active ? `3px solid ${COLORS.primary}` : '3px solid transparent',
        color: active ? COLORS.primary : COLORS.textSecondary,
        fontSize: '0.85rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = COLORS.textPrimary;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = COLORS.textSecondary;
        }
      }}
    >
      <FontAwesomeIcon icon={icon} style={{ fontSize: '0.8rem' }} />
      {label}
    </button>
  );
}

// ========== STATUS BADGE - Clean ==========
function StatusBadge({ isActive }: { isActive: boolean }) {
  const { t } = useTranslation();
  return (
    <span style={{
      background: isActive ? `${COLORS.primary}15` : `${COLORS.danger}15`,
      color: isActive ? COLORS.primary : COLORS.danger,
      padding: '0.25rem 0.75rem',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
    }}>
      <FontAwesomeIcon icon={isActive ? faCheckCircle : faTimesCircle} style={{ fontSize: '0.5rem' }} />
      {isActive ? t('active') || 'Active' : t('inactive') || 'Inactive'}
    </span>
  );
}

// ========== LEAVE STATUS BADGE ==========
function LeaveStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: `${COLORS.primary}15`, color: COLORS.primary, label: 'Pending' },
    approved: { bg: `${COLORS.success}15`, color: COLORS.success, label: 'Approved' },
    rejected: { bg: `${COLORS.danger}15`, color: COLORS.danger, label: 'Rejected' },
  };
  const c = config[status] || config.pending;
  return (
    <span style={{
      background: c.bg,
      color: c.color,
      padding: '0.15rem 0.6rem',
      borderRadius: '12px',
      fontSize: '0.7rem',
      fontWeight: '500',
    }}>
      {c.label}
    </span>
  );
}

export default function WorkerDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const id = router.query.id as string;
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [salaryHistory, setSalaryHistory] = useState<SalaryRecord[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newSalary, setNewSalary] = useState({ new_salary: '', effective_date: '', reason: '' });
  const [newDocument, setNewDocument] = useState({ type: 'contract', title: '', file_url: '' });
  const [newLeave, setNewLeave] = useState({ start_date: '', end_date: '', reason: '' });
  const [newReview, setNewReview] = useState({ review_date: '', reviewer: '', rating: 3, comments: '' });

  const fetchWorker = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/workers/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch worker');
      const data = await res.json();
      setWorker(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchSalaryHistory = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/workers/${id}/salary-history`, { headers: getAuthHeaders() });
      const data = await res.json();
      setSalaryHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching salary history:', err);
    }
  };

  const fetchDocuments = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/workers/${id}/documents`, { headers: getAuthHeaders() });
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const fetchLeaveRequests = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/workers/${id}/leave-requests`, { headers: getAuthHeaders() });
      const data = await res.json();
      setLeaveRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
    }
  };

  const fetchPerformanceReviews = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/workers/${id}/performance-reviews`, { headers: getAuthHeaders() });
      const data = await res.json();
      setPerformanceReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching performance reviews:', err);
    }
  };

  const fetchAttendanceSummary = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/workers/${id}/attendance-summary`, { headers: getAuthHeaders() });
      const data = await res.json();
      setAttendanceSummary(data);
    } catch (err) {
      console.error('Error fetching attendance summary:', err);
    }
  };

  useEffect(() => {
    if (id) {
      Promise.all([
        fetchWorker(),
        fetchSalaryHistory(),
        fetchDocuments(),
        fetchLeaveRequests(),
        fetchPerformanceReviews(),
        fetchAttendanceSummary(),
      ]).finally(() => setLoading(false));
    }
  }, [id]);

  const addSalaryRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSalary.new_salary || !newSalary.effective_date) return;
    try {
      const res = await fetch(`/api/workers/${id}/salary-history`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          old_salary: worker?.salary,
          new_salary: parseFloat(newSalary.new_salary),
          effective_date: newSalary.effective_date,
          reason: newSalary.reason,
        }),
      });
      if (res.ok) {
        setNewSalary({ new_salary: '', effective_date: '', reason: '' });
        await fetchSalaryHistory();
        await fetchWorker();
      } else {
        alert(t('failedToAddSalaryRecord') || 'Failed to add salary record');
      }
    } catch (err) {
      alert(t('networkError') || 'Network error');
    }
  };

  const addDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocument.file_url) return;
    try {
      const res = await fetch(`/api/workers/${id}/documents`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newDocument),
      });
      if (res.ok) {
        setNewDocument({ type: 'contract', title: '', file_url: '' });
        await fetchDocuments();
      } else {
        alert(t('failedToAddDocument') || 'Failed to add document');
      }
    } catch (err) {
      alert(t('networkError') || 'Network error');
    }
  };

  const deleteDocument = async (docId: number) => {
    if (!confirm(t('confirmDeleteDocument') || 'Delete this document?')) return;
    try {
      const res = await fetch(`/api/workers/${id}/documents`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ docId }),
      });
      if (res.ok) await fetchDocuments();
    } catch (err) {
      alert(t('networkError') || 'Network error');
    }
  };

  const addLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeave.start_date || !newLeave.end_date) return;
    try {
      const res = await fetch(`/api/workers/${id}/leave-requests`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newLeave),
      });
      if (res.ok) {
        setNewLeave({ start_date: '', end_date: '', reason: '' });
        await fetchLeaveRequests();
      } else {
        alert(t('failedToAddLeaveRequest') || 'Failed to add leave request');
      }
    } catch (err) {
      alert(t('networkError') || 'Network error');
    }
  };

  const updateLeaveStatus = async (leaveId: number, status: string) => {
    try {
      const res = await fetch(`/api/workers/${id}/leave-requests`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ leave_id: leaveId, status }),
      });
      if (res.ok) await fetchLeaveRequests();
    } catch (err) {
      alert(t('networkError') || 'Network error');
    }
  };

  const addPerformanceReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.review_date || !newReview.rating) return;
    try {
      const res = await fetch(`/api/workers/${id}/performance-reviews`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newReview),
      });
      if (res.ok) {
        setNewReview({ review_date: '', reviewer: '', rating: 3, comments: '' });
        await fetchPerformanceReviews();
      } else {
        alert(t('failedToAddReview') || 'Failed to add review');
      }
    } catch (err) {
      alert(t('networkError') || 'Network error');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: COLORS.textMuted }}>
          {t('loadingWorkerDetails') || 'Loading worker details...'}
        </div>
      </DashboardLayout>
    );
  }

  if (error || !worker) {
    return (
      <DashboardLayout>
        <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '3rem', color: COLORS.primary, marginBottom: '1rem' }} />
          <h2 style={{ color: COLORS.textPrimary }}>{t('error') || 'Error'}</h2>
          <p style={{ color: COLORS.textSecondary }}>{error || (t('workerNotFound') || 'Worker not found')}</p>
          <button
            onClick={() => router.push('/dashboard/workers')}
            style={{
              marginTop: '1rem',
              padding: '0.6rem 1.5rem',
              background: COLORS.primary,
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            {t('backToWorkers') || 'Back to Workers'}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {worker.image_url ? (
              <img src={worker.image_url} alt={worker.full_name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${COLORS.primary}` }} />
            ) : (
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${COLORS.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.primary }}>
                <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '1.5rem' }} />
              </div>
            )}
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
                {worker.full_name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                <StatusBadge isActive={worker.is_active} />
                <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                  {worker.department_name || '-'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/workers/deep')}
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
            <FontAwesomeIcon icon={faArrowLeft} /> {t('backToWorkers') || 'Back to Workers'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, marginBottom: '1.5rem', overflowX: 'auto' }}>
          <TabButton label={t('basic') || 'Basic'} active={activeTab === 'basic'} onClick={() => setActiveTab('basic')} icon={faUser} />
          <TabButton label={t('salary') || 'Salary'} active={activeTab === 'salary'} onClick={() => setActiveTab('salary')} icon={faMoneyBillWave} />
          <TabButton label={t('documents') || 'Documents'} active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} icon={faFileAlt} />
          <TabButton label={t('leave') || 'Leave'} active={activeTab === 'leave'} onClick={() => setActiveTab('leave')} icon={faUmbrellaBeach} />
          <TabButton label={t('reviews') || 'Reviews'} active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} icon={faStar} />
          <TabButton label={t('attendance') || 'Attendance'} active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={faClock} />
        </div>

        {/* ===== BASIC INFO TAB ===== */}
        {activeTab === 'basic' && (
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: COLORS.shadow }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  <FontAwesomeIcon icon={faUser} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
                  {t('fullName') || 'Full Name'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '500', color: COLORS.textPrimary }}>
                  {worker.full_name}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  <FontAwesomeIcon icon={faPhoneAlt} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
                  {t('phone') || 'Phone'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '500', color: COLORS.textPrimary }}>
                  {worker.phone || '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
                  {t('email') || 'Email'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '500', color: COLORS.textPrimary }}>
                  {worker.email || '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  <FontAwesomeIcon icon={faBuilding} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
                  {t('department') || 'Department'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '500', color: COLORS.textPrimary }}>
                  {worker.department_name || '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  <FontAwesomeIcon icon={faMoneyBillWave} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
                  {t('salary') || 'Salary'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: COLORS.textPrimary }}>
                  {worker.salary?.toLocaleString()} RWF
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
                  {t('joinDate') || 'Join Date'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '500', color: COLORS.textPrimary }}>
                  {worker.join_date ? new Date(worker.join_date).toLocaleDateString() : '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
                  {t('location') || 'Location'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '500', color: COLORS.textPrimary }}>
                  {worker.location || '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  <FontAwesomeIcon icon={faBriefcase} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
                  {t('employmentStatus') || 'Employment Status'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '500', color: COLORS.textPrimary }}>
                  {worker.status || '-'} {worker.status_reason && `(${worker.status_reason})`}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  <FontAwesomeIcon icon={faUserCircle} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
                  {t('emergencyContact') || 'Emergency Contact'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '500', color: COLORS.textPrimary }}>
                  {worker.emergency_contact_name || '-'} / {worker.emergency_contact_phone || '-'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== SALARY HISTORY TAB ===== */}
        {activeTab === 'salary' && (
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: COLORS.shadow }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '1rem' }}>
              <FontAwesomeIcon icon={faHistory} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
              {t('salaryHistory') || 'Salary History'}
            </h2>

            <form onSubmit={addSalaryRecord} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', padding: '1rem', background: COLORS.bgGray, borderRadius: '8px' }}>
              <input
                type="number"
                placeholder={t('newSalary') || 'New Salary (RWF)'}
                value={newSalary.new_salary}
                onChange={e => setNewSalary({ ...newSalary, new_salary: e.target.value })}
                required
                style={{
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  flex: 1,
                  minWidth: '150px',
                }}
              />
              <input
                type="date"
                value={newSalary.effective_date}
                onChange={e => setNewSalary({ ...newSalary, effective_date: e.target.value })}
                required
                style={{
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  minWidth: '140px',
                }}
              />
              <input
                type="text"
                placeholder={t('reason') || 'Reason'}
                value={newSalary.reason}
                onChange={e => setNewSalary({ ...newSalary, reason: e.target.value })}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  flex: 1,
                  minWidth: '120px',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1.25rem',
                  background: COLORS.primary,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'white',
                  fontWeight: '500',
                  fontSize: '0.85rem',
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
                <FontAwesomeIcon icon={faSave} /> {t('addRecord') || 'Add Record'}
              </button>
            </form>

            {salaryHistory.length === 0 ? (
              <p style={{ color: COLORS.textMuted, textAlign: 'center', padding: '1rem' }}>{t('noSalaryHistory') || 'No salary history.'}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: COLORS.bgGray, borderBottom: `1px solid ${COLORS.border}` }}>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted }}>{t('date') || 'Date'}</th>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'right', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted }}>{t('oldSalary') || 'Old Salary'}</th>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'right', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted }}>{t('newSalaryValue') || 'New Salary'}</th>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted }}>{t('reason') || 'Reason'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryHistory.map((s, idx) => (
                      <tr key={s.id} style={{ borderBottom: idx < salaryHistory.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                        <td style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>{new Date(s.effective_date).toLocaleDateString()}</td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontSize: '0.85rem', color: COLORS.textSecondary }}>{s.old_salary?.toLocaleString() || '-'}</td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600', color: COLORS.textPrimary }}>{s.new_salary.toLocaleString()}</td>
                        <td style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>{s.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== DOCUMENTS TAB ===== */}
        {activeTab === 'documents' && (
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: COLORS.shadow }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '1rem' }}>
              <FontAwesomeIcon icon={faFileAlt} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
              {t('documents') || 'Documents'}
            </h2>

            <div style={{ padding: '1rem', background: COLORS.bgGray, borderRadius: '8px', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '500', color: COLORS.textPrimary, marginBottom: '0.5rem' }}>
                {t('addDocument') || 'Add New Document'}
              </h3>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <select
                  value={newDocument.type}
                  onChange={e => setNewDocument({ ...newDocument, type: e.target.value })}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    minWidth: '130px',
                  }}
                >
                  <option value="contract">{t('contract') || 'Contract'}</option>
                  <option value="id_card">{t('idCard') || 'ID Card'}</option>
                  <option value="certificate">{t('certificate') || 'Certificate'}</option>
                  <option value="other">{t('other') || 'Other'}</option>
                </select>
                <input
                  type="text"
                  placeholder={t('title') || 'Title (optional)'}
                  value={newDocument.title}
                  onChange={e => setNewDocument({ ...newDocument, title: e.target.value })}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    flex: 1,
                    minWidth: '150px',
                  }}
                />
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    const fd = new FormData();
                    fd.append('image', file);
                    try {
                      const res = await fetch('/api/upload', { method: 'POST', body: fd });
                      const data = await res.json();
                      if (res.ok) {
                        setNewDocument({ ...newDocument, file_url: data.url });
                      } else {
                        alert(t('uploadFailed') || 'Upload failed');
                      }
                    } catch (err) {
                      alert(t('uploadError') || 'Upload error');
                    } finally {
                      setUploading(false);
                    }
                  }}
                  style={{
                    padding: '0.4rem',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    flex: 1,
                    minWidth: '150px',
                  }}
                />
                <button
                  onClick={addDocument}
                  disabled={!newDocument.file_url || uploading}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: COLORS.primary,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    color: 'white',
                    fontWeight: '500',
                    fontSize: '0.85rem',
                    opacity: uploading ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!uploading) {
                      e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!uploading) {
                      e.currentTarget.style.backgroundColor = COLORS.primary;
                    }
                  }}
                >
                  {uploading ? (
                    <><FontAwesomeIcon icon={faUpload} spin /> {t('uploading') || 'Uploading...'}</>
                  ) : (
                    <><FontAwesomeIcon icon={faSave} /> {t('addDocument') || 'Add Document'}</>
                  )}
                </button>
              </div>
              {newDocument.file_url && (
                <div style={{ marginTop: '0.5rem', color: COLORS.success, fontSize: '0.8rem' }}>
                  <FontAwesomeIcon icon={faCheckCircle} /> {t('fileReady') || 'File ready'}: {newDocument.file_url.split('/').pop()}
                </div>
              )}
            </div>

            {documents.length === 0 ? (
              <p style={{ color: COLORS.textMuted, textAlign: 'center', padding: '1rem' }}>{t('noDocuments') || 'No documents.'}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: COLORS.bgGray, borderBottom: `1px solid ${COLORS.border}` }}>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted }}>{t('documentType') || 'Type'}</th>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted }}>{t('title') || 'Title'}</th>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted }}>{t('file') || 'File'}</th>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted }}>{t('uploadedAt') || 'Uploaded'}</th>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted }}>{t('actions') || 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((d, idx) => (
                      <tr key={d.id} style={{ borderBottom: idx < documents.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                        <td style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.1rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            background: `${COLORS.primary}15`,
                            color: COLORS.primary,
                          }}>
                            {d.type}
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: COLORS.textPrimary }}>{d.title || '-'}</td>
                        <td style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                          <a href={d.file_url} target="_blank" rel="noreferrer" style={{ color: COLORS.primary, textDecoration: 'none' }}>
                            <FontAwesomeIcon icon={faEye} /> {t('view') || 'View'}
                          </a>
                        </td>
                        <td style={{ padding: '0.6rem 1rem', fontSize: '0.8rem', color: COLORS.textMuted }}>{new Date(d.uploaded_at).toLocaleDateString()}</td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'center' }}>
                          <button
                            onClick={() => deleteDocument(d.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: COLORS.danger,
                              cursor: 'pointer',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              transition: 'all 0.2s',
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== LEAVE REQUESTS TAB ===== */}
        {activeTab === 'leave' && (
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: COLORS.shadow }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '1rem' }}>
              <FontAwesomeIcon icon={faUmbrellaBeach} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
              {t('leaveRequests') || 'Leave Requests'}
            </h2>

            <form onSubmit={addLeaveRequest} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', padding: '1rem', background: COLORS.bgGray, borderRadius: '8px' }}>
              <input
                type="date"
                value={newLeave.start_date}
                onChange={e => setNewLeave({ ...newLeave, start_date: e.target.value })}
                required
                style={{
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  minWidth: '140px',
                }}
              />
              <input
                type="date"
                value={newLeave.end_date}
                onChange={e => setNewLeave({ ...newLeave, end_date: e.target.value })}
                required
                style={{
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  minWidth: '140px',
                }}
              />
              <input
                type="text"
                placeholder={t('reason') || 'Reason'}
                value={newLeave.reason}
                onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  flex: 1,
                  minWidth: '120px',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1.25rem',
                  background: COLORS.primary,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'white',
                  fontWeight: '500',
                  fontSize: '0.85rem',
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
                <FontAwesomeIcon icon={faSave} /> {t('requestLeave') || 'Request Leave'}
              </button>
            </form>

            {leaveRequests.length === 0 ? (
              <p style={{ color: COLORS.textMuted, textAlign: 'center', padding: '1rem' }}>{t('noLeaveRequests') || 'No leave requests.'}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: COLORS.bgGray, borderBottom: `1px solid ${COLORS.border}` }}>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted }}>{t('startDate') || 'Start'}</th>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted }}>{t('endDate') || 'End'}</th>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted }}>{t('reason') || 'Reason'}</th>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted }}>{t('status') || 'Status'}</th>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted }}>{t('actions') || 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map((l, idx) => (
                      <tr key={l.id} style={{ borderBottom: idx < leaveRequests.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                        <td style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>{new Date(l.start_date).toLocaleDateString()}</td>
                        <td style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>{new Date(l.end_date).toLocaleDateString()}</td>
                        <td style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>{l.reason || '-'}</td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'center' }}>
                          <LeaveStatusBadge status={l.status} />
                        </td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'center' }}>
                          {l.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                              <button
                                onClick={() => updateLeaveStatus(l.id, 'approved')}
                                style={{
                                  padding: '0.15rem 0.6rem',
                                  background: COLORS.success,
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: 'white',
                                  fontSize: '0.7rem',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = '0.8';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                }}
                              >
                                <FontAwesomeIcon icon={faCheckCircle} /> {t('approve') || 'Approve'}
                              </button>
                              <button
                                onClick={() => updateLeaveStatus(l.id, 'rejected')}
                                style={{
                                  padding: '0.15rem 0.6rem',
                                  background: COLORS.danger,
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: 'white',
                                  fontSize: '0.7rem',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = '0.8';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                }}
                              >
                                <FontAwesomeIcon icon={faTimesCircle} /> {t('reject') || 'Reject'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== PERFORMANCE REVIEWS TAB ===== */}
        {activeTab === 'reviews' && (
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: COLORS.shadow }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '1rem' }}>
              <FontAwesomeIcon icon={faStar} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
              {t('performanceReviews') || 'Performance Reviews'}
            </h2>

            <form onSubmit={addPerformanceReview} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', padding: '1rem', background: COLORS.bgGray, borderRadius: '8px' }}>
              <input
                type="date"
                value={newReview.review_date}
                onChange={e => setNewReview({ ...newReview, review_date: e.target.value })}
                required
                style={{
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  minWidth: '140px',
                }}
              />
              <input
                type="text"
                placeholder={t('reviewer') || 'Reviewer'}
                value={newReview.reviewer}
                onChange={e => setNewReview({ ...newReview, reviewer: e.target.value })}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  flex: 1,
                  minWidth: '120px',
                }}
              />
              <select
                value={newReview.rating}
                onChange={e => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  minWidth: '100px',
                }}
              >
                {[1, 2, 3, 4, 5].map(r => (
                  <option key={r} value={r}>{r} {'⭐'.repeat(r)}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder={t('comments') || 'Comments'}
                value={newReview.comments}
                onChange={e => setNewReview({ ...newReview, comments: e.target.value })}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  flex: 1,
                  minWidth: '120px',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1.25rem',
                  background: COLORS.primary,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'white',
                  fontWeight: '500',
                  fontSize: '0.85rem',
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
                <FontAwesomeIcon icon={faSave} /> {t('addReview') || 'Add Review'}
              </button>
            </form>

            {performanceReviews.length === 0 ? (
              <p style={{ color: COLORS.textMuted, textAlign: 'center', padding: '1rem' }}>{t('noPerformanceReviews') || 'No performance reviews.'}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: COLORS.bgGray, borderBottom: `1px solid ${COLORS.border}` }}>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted }}>{t('date') || 'Date'}</th>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted }}>{t('reviewer') || 'Reviewer'}</th>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted }}>{t('rating') || 'Rating'}</th>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted }}>{t('comments') || 'Comments'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceReviews.map((r, idx) => (
                      <tr key={r.id} style={{ borderBottom: idx < performanceReviews.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                        <td style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>{new Date(r.review_date).toLocaleDateString()}</td>
                        <td style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>{r.reviewer || '-'}</td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'center', fontSize: '1rem' }}>
                          {'⭐'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                        </td>
                        <td style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>{r.comments || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== ATTENDANCE SUMMARY TAB - NUMBERS IN BLACK (NOT YELLOW) ===== */}
        {activeTab === 'attendance' && (
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: COLORS.shadow }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '1rem' }}>
              <FontAwesomeIcon icon={faClock} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
              {t('attendanceSummary') || 'Attendance Summary (Current Month)'}
            </h2>

            {attendanceSummary ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                {/* Total Days - BLACK TEXT */}
                <div style={{ 
                  background: 'white', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  border: `1px solid ${COLORS.border}`,
                  boxShadow: COLORS.shadow,
                }}>
                  <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    <FontAwesomeIcon icon={faCalendarAlt} style={{ color: COLORS.primary }} /> {t('totalDays') || 'Total Days'}
                  </div>
                  {/* ✅ CHANGED: BLACK instead of YELLOW */}
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary }}>
                    {attendanceSummary.total_days}
                  </div>
                </div>

                {/* Present - BLACK TEXT */}
                <div style={{ 
                  background: 'white', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  border: `1px solid ${COLORS.border}`,
                  boxShadow: COLORS.shadow,
                }}>
                  <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    <FontAwesomeIcon icon={faCheckCircle} style={{ color: COLORS.primary }} /> {t('present') || 'Present'}
                  </div>
                  {/* ✅ CHANGED: BLACK instead of YELLOW */}
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary }}>
                    {attendanceSummary.present_days}
                  </div>
                </div>

                {/* Absent - BLACK TEXT */}
                <div style={{ 
                  background: 'white', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  border: `1px solid ${COLORS.border}`,
                  boxShadow: COLORS.shadow,
                }}>
                  <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    <FontAwesomeIcon icon={faTimesCircle} style={{ color: COLORS.primary }} /> {t('absent') || 'Absent'}
                  </div>
                  {/* ✅ CHANGED: BLACK instead of YELLOW */}
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary }}>
                    {attendanceSummary.absent_days}
                  </div>
                </div>

                {/* Late - BLACK TEXT */}
                <div style={{ 
                  background: 'white', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  border: `1px solid ${COLORS.border}`,
                  boxShadow: COLORS.shadow,
                }}>
                  <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: COLORS.primary }} /> {t('late') || 'Late'}
                  </div>
                  {/* ✅ CHANGED: BLACK instead of YELLOW */}
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.textPrimary }}>
                    {attendanceSummary.late_days}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: COLORS.textMuted, textAlign: 'center', padding: '2rem' }}>
                {t('noAttendanceData') || 'No attendance data for this month.'}
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}