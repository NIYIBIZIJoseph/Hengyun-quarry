// src/components/support/TicketList.tsx
import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTicketAlt, 
  faEye, 
  faTrashAlt, 
  faSearch, 
  faPlus,
  faTimes,
  faClock,
  faCheckCircle,
  faExclamationTriangle,
  faUser,
  faPhoneAlt,
  faEdit,
  faSave,
  faSpinner,
  faArrowUp,
  faArrowDown,
  faMinus,
  faCalendar
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

function TicketRow({ ticket, onDelete, onStatusUpdate, onPriorityUpdate, updating }: { 
  ticket: any; 
  onDelete: (id: number) => void; 
  onStatusUpdate: (id: number, status: string) => void;
  onPriorityUpdate: (id: number, priority: string) => void;
  updating: number | null;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const { t } = useTranslation();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return COLORS.danger;
      case 'high': return '#f97316';
      case 'medium': return COLORS.primary;
      case 'low': return COLORS.success;
      default: return COLORS.textMuted;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return t('priorityUrgent') || 'Urgent';
      case 'high': return t('priorityHigh') || 'High';
      case 'medium': return t('priorityMedium') || 'Medium';
      case 'low': return t('priorityLow') || 'Low';
      default: return priority;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return faArrowUp;
      case 'high': return faArrowUp;
      case 'medium': return faMinus;
      case 'low': return faArrowDown;
      default: return faMinus;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return t('statusOpen') || 'Open';
      case 'in_progress': return t('statusInProgress') || 'In Progress';
      case 'resolved': return t('statusResolved') || 'Resolved';
      case 'closed': return t('statusClosed') || 'Closed';
      default: return status;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'open': return { background: '#fef3c7', color: '#92400e' };
      case 'in_progress': return { background: '#dbeafe', color: '#1e40af' };
      case 'resolved': return { background: '#d1fae5', color: '#065f46' };
      case 'closed': return { background: '#f3f4f6', color: '#6b7280' };
      default: return { background: '#f3f4f6', color: '#6b7280' };
    }
  };

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  const priorityOptions = [
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const isLoading = updating === ticket.id;

  return (
    <tr
      style={{
        borderBottom: `1px solid ${COLORS.border}`,
        backgroundColor: isHovered ? COLORS.bgGray : 'transparent',
        transition: 'all 0.2s ease',
        opacity: isLoading ? 0.6 : 1,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: COLORS.textPrimary, fontSize: '0.85rem' }}>
        {ticket.ticket_number}
      </td>
      <td style={{ padding: '0.75rem 1rem' }}>
        <div style={{ fontWeight: '500', fontSize: '0.85rem', color: COLORS.textPrimary }}>
          {ticket.user_name}
        </div>
        <div style={{ fontSize: '0.65rem', color: COLORS.textMuted }}>
          <FontAwesomeIcon icon={faPhoneAlt} style={{ marginRight: '0.2rem' }} />
          {ticket.phone}
        </div>
      </td>
      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: COLORS.textSecondary }}>
        {ticket.subject}
      </td>
      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={() => setShowPriorityMenu(!showPriorityMenu)}
            disabled={isLoading}
            style={{
              background: 'transparent',
              border: 'none',
              color: getPriorityColor(ticket.priority),
              cursor: isLoading ? 'not-allowed' : 'pointer',
              padding: '0.2rem 0.4rem',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontWeight: '600',
              fontSize: '0.8rem',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            <FontAwesomeIcon icon={getPriorityIcon(ticket.priority)} style={{ fontSize: '0.7rem' }} />
            {getPriorityLabel(ticket.priority)}
            <FontAwesomeIcon icon={faEdit} style={{ fontSize: '0.6rem', opacity: 0.6 }} />
          </button>
          {showPriorityMenu && !isLoading && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'white',
              borderRadius: '8px',
              boxShadow: COLORS.shadowHover,
              border: `1px solid ${COLORS.border}`,
              zIndex: 100,
              minWidth: '120px',
              marginTop: '4px',
              overflow: 'hidden',
            }}>
              {priorityOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    onPriorityUpdate(ticket.id, option.value);
                    setShowPriorityMenu(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.4rem 0.8rem',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    textAlign: 'left',
                    color: getPriorityColor(option.value),
                    fontWeight: option.value === ticket.priority ? '600' : '400',
                    transition: 'all 0.2s',
                  }}
                >
                  <FontAwesomeIcon icon={getPriorityIcon(option.value)} style={{ marginRight: '0.3rem', fontSize: '0.7rem' }} />
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>
      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            disabled={isLoading}
            style={{
              ...getStatusBadgeStyle(ticket.status),
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              fontSize: '0.7rem',
              fontWeight: '500',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? (
              <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: '0.6rem' }} />
            ) : (
              <>
                {getStatusLabel(ticket.status)}
                <FontAwesomeIcon icon={faEdit} style={{ fontSize: '0.6rem' }} />
              </>
            )}
          </button>
          {showStatusMenu && !isLoading && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'white',
              borderRadius: '8px',
              boxShadow: COLORS.shadowHover,
              border: `1px solid ${COLORS.border}`,
              zIndex: 100,
              minWidth: '120px',
              marginTop: '4px',
              overflow: 'hidden',
            }}>
              {statusOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    onStatusUpdate(ticket.id, option.value);
                    setShowStatusMenu(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.4rem 0.8rem',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    textAlign: 'left',
                    color: COLORS.textPrimary,
                    fontWeight: option.value === ticket.status ? '600' : '400',
                    transition: 'all 0.2s',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>
      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: COLORS.textMuted }}>
        {new Date(ticket.created_at).toLocaleDateString()}
      </td>
      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
          <Link href={`/dashboard/support/${ticket.id}`}>
            <button
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
            >
              <FontAwesomeIcon icon={faEye} />
            </button>
          </Link>
          <button
            onClick={() => onDelete(ticket.id)}
            disabled={isLoading}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.danger,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              transition: 'all 0.2s',
              fontSize: '0.8rem',
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            <FontAwesomeIcon icon={faTrashAlt} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function TicketList() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ 
    status: '', 
    priority: '', 
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [deleting, setDeleting] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchTickets = async () => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.search) params.append('search', filters.search);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    
    try {
      const res = await fetch(`/api/support/tickets?${params.toString()}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setTickets(data); 
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const deleteTicket = async (id: number) => {
    if (!confirm(t('confirmDeleteTicket') || 'Delete this ticket?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/support/tickets/${id}`, { 
        method: 'DELETE', 
        headers: getAuthHeaders() 
      });
      if (res.ok) {
        setTickets(prev => prev.filter(ticket => ticket.id !== id));
      } else {
        const error = await res.json();
        alert(error.message || t('failedToDelete') || 'Failed to delete');
      }
    } catch (err) {
      console.error('Error deleting ticket:', err);
      alert(t('networkError') || 'Network error');
    } finally {
      setDeleting(null);
    }
  };

  const updateTicketStatus = async (id: number, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/support/tickets/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setTickets(prevTickets => 
          prevTickets.map(ticket => 
            ticket.id === id ? { ...ticket, status } : ticket
          )
        );
      } else {
        const error = await res.json();
        alert(error.message || t('failedToUpdate') || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating ticket:', err);
      alert(t('networkError') || 'Network error');
    } finally {
      setUpdating(null);
    }
  };

  const updateTicketPriority = async (id: number, priority: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/support/tickets/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ priority })
      });
      if (res.ok) {
        setTickets(prevTickets => 
          prevTickets.map(ticket => 
            ticket.id === id ? { ...ticket, priority } : ticket
          )
        );
      } else {
        const error = await res.json();
        alert(error.message || t('failedToUpdate') || 'Failed to update priority');
      }
    } catch (err) {
      console.error('Error updating priority:', err);
      alert(t('networkError') || 'Network error');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: COLORS.textMuted }}>
        {t('loadingTickets') || 'Loading tickets...'}
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '1rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        boxShadow: COLORS.shadow,
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '150px' }}>
            <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
            <input
              type="text"
              placeholder={t('searchTicketsPlaceholder') || 'Search...'}
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              style={{
                width: '100%',
                padding: '0.4rem 0.75rem 0.4rem 2.2rem',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.85rem',
                background: COLORS.bgGray,
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
            style={{
              padding: '0.4rem 0.75rem',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              fontSize: '0.85rem',
              background: COLORS.bgGray,
              minWidth: '120px',
            }}
          >
            <option value="">{t('allStatus') || 'All Status'}</option>
            <option value="open">{t('statusOpen') || 'Open'}</option>
            <option value="in_progress">{t('statusInProgress') || 'In Progress'}</option>
            <option value="resolved">{t('statusResolved') || 'Resolved'}</option>
            <option value="closed">{t('statusClosed') || 'Closed'}</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={e => setFilters({ ...filters, priority: e.target.value })}
            style={{
              padding: '0.4rem 0.75rem',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              fontSize: '0.85rem',
              background: COLORS.bgGray,
              minWidth: '120px',
            }}
          >
            <option value="">{t('allPriorities') || 'All Priority'}</option>
            <option value="low">{t('priorityLow') || 'Low'}</option>
            <option value="medium">{t('priorityMedium') || 'Medium'}</option>
            <option value="high">{t('priorityHigh') || 'High'}</option>
            <option value="urgent">{t('priorityUrgent') || 'Urgent'}</option>
          </select>

          {/* ✅ NEW: Date From Filter */}
          <div style={{ position: 'relative', minWidth: '140px' }}>
            <FontAwesomeIcon icon={faCalendar} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted, fontSize: '0.8rem' }} />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
              style={{
                width: '100%',
                padding: '0.4rem 0.75rem 0.4rem 2rem',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.85rem',
                background: COLORS.bgGray,
                color: COLORS.textPrimary,
              }}
              placeholder="From"
            />
          </div>

          {/* ✅ NEW: Date To Filter */}
          <div style={{ position: 'relative', minWidth: '140px' }}>
            <FontAwesomeIcon icon={faCalendar} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted, fontSize: '0.8rem' }} />
            <input
              type="date"
              value={filters.dateTo}
              onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
              style={{
                width: '100%',
                padding: '0.4rem 0.75rem 0.4rem 2rem',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.85rem',
                background: COLORS.bgGray,
                color: COLORS.textPrimary,
              }}
              placeholder="To"
            />
          </div>

          {/* Reset Button */}
          {(filters.status || filters.priority || filters.search || filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => setFilters({ status: '', priority: '', search: '', dateFrom: '', dateTo: '' })}
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
              }}
            >
              <FontAwesomeIcon icon={faTimes} style={{ fontSize: '0.7rem' }} />
              {t('reset') || 'Reset'}
            </button>
          )}

          {/* New Ticket Button */}
          <Link href="/dashboard/support/new" style={{ marginLeft: 'auto' }}>
            <button style={{
              padding: '0.4rem 1.25rem',
              background: COLORS.primary,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <FontAwesomeIcon icon={faPlus} /> {t('newTicket') || 'New Ticket'}
            </button>
          </Link>
        </div>
      </div>

      {/* Ticket Table */}
      {tickets.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'white',
          borderRadius: '12px',
          boxShadow: COLORS.shadow,
        }}>
          <FontAwesomeIcon icon={faTicketAlt} style={{ fontSize: '3rem', color: COLORS.textMuted, marginBottom: '1rem' }} />
          <h3 style={{ color: COLORS.textSecondary, fontSize: '1rem' }}>{t('noTicketsFound') || 'No tickets found.'}</h3>
          <p style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>
            {t('tryAdjustingFilters') || 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', boxShadow: COLORS.shadow }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: COLORS.bgGray, borderBottom: `1px solid ${COLORS.border}` }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: '600' }}>
                  {t('id') || 'ID'}
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: '600' }}>
                  {t('customer') || 'Customer'}
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: '600' }}>
                  {t('subject') || 'Subject'}
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: '600' }}>
                  {t('priority') || 'Priority'}
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: '600' }}>
                  {t('status') || 'Status'}
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: '600' }}>
                  {t('created') || 'Created'}
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: '600' }}>
                  {t('actions') || 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  onDelete={deleteTicket}
                  onStatusUpdate={updateTicketStatus}
                  onPriorityUpdate={updateTicketPriority}
                  updating={updating}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}