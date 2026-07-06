import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faReply, 
  faPaperPlane,
  faUser,
  faPhone,
  faClock,
  faTag,
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle,
  faSpinner
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

export default function TicketDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation();
  const [ticket, setTicket] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchTicket = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/support/tickets/${id}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTicket(data.ticket);
        setReplies(data.replies || []);
      } else {
        alert('Failed to load ticket');
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTicket();
  }, [id]);

  // ✅ FIXED: Update ticket status (no refresh needed)
  const updateStatus = async (status: string) => {
    if (!ticket) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        // ✅ Update local state immediately - NO HARD REFRESH NEEDED!
        setTicket({ ...ticket, status });
        // ✅ Also update the replies data to reflect changes
        const updatedTicket = await fetch(`/api/support/tickets/${ticket.id}`, { headers: getAuthHeaders() });
        if (updatedTicket.ok) {
          const data = await updatedTicket.json();
          setTicket(data.ticket);
          setReplies(data.replies || []);
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  // ✅ FIXED: Send reply - updates immediately
  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !ticket) return;
    
    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: replyMessage })
      });
      if (res.ok) {
        // ✅ Clear input and refresh replies
        setReplyMessage('');
        await fetchTicket(); // Refresh to show new reply
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Error sending reply');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, any> = {
      open: { background: '#fef3c7', color: '#92400e' },
      in_progress: { background: '#dbeafe', color: '#1e40af' },
      resolved: { background: '#d1fae5', color: '#065f46' },
      closed: { background: '#f3f4f6', color: '#6b7280' },
    };
    return styles[status] || styles.open;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: COLORS.danger,
      high: '#f97316',
      medium: COLORS.primary,
      low: COLORS.success,
    };
    return colors[priority] || COLORS.textMuted;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: '2rem', color: COLORS.primary }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <div style={{ padding: '2rem', textAlign: 'center', color: COLORS.textMuted }}>
          Ticket not found
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem' }}>
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/support')}
          style={{
            background: 'none',
            border: 'none',
            color: COLORS.textSecondary,
            cursor: 'pointer',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.primary; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.textSecondary; }}
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Tickets
        </button>

        {/* Ticket Header */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: COLORS.shadow,
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: COLORS.textMuted }}>#{ticket.ticket_number}</span>
                <span style={{
                  ...getStatusBadge(ticket.status),
                  padding: '0.2rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                }}>
                  {ticket.status}
                </span>
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: COLORS.textPrimary, margin: '0.5rem 0 0 0' }}>
                {ticket.subject}
              </h2>
            </div>
            {/* ✅ FIXED: Status Update Dropdown - Updates Immediately */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>Status:</span>
              <select
                value={ticket.status}
                onChange={(e) => updateStatus(e.target.value)}
                disabled={updating}
                style={{
                  padding: '0.3rem 0.8rem',
                  borderRadius: '8px',
                  border: `1px solid ${COLORS.border}`,
                  fontSize: '0.8rem',
                  background: 'white',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  opacity: updating ? 0.6 : 1,
                }}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              {updating && <FontAwesomeIcon icon={faSpinner} spin style={{ color: COLORS.primary }} />}
            </div>
          </div>

          {/* Customer Info */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: `1px solid ${COLORS.border}`,
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: COLORS.textMuted }}>Customer</span>
              <div style={{ fontSize: '0.9rem', color: COLORS.textPrimary, fontWeight: '500' }}>
                <FontAwesomeIcon icon={faUser} style={{ marginRight: '0.3rem', color: COLORS.textMuted }} />
                {ticket.user_name}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: COLORS.textMuted }}>Phone</span>
              <div style={{ fontSize: '0.9rem', color: COLORS.textPrimary, fontWeight: '500' }}>
                <FontAwesomeIcon icon={faPhone} style={{ marginRight: '0.3rem', color: COLORS.textMuted }} />
                {ticket.phone}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: COLORS.textMuted }}>Priority</span>
              <div style={{ fontSize: '0.9rem', color: getPriorityColor(ticket.priority), fontWeight: '500' }}>
                <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '0.3rem' }} />
                {ticket.priority}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: COLORS.textMuted }}>Created</span>
              <div style={{ fontSize: '0.9rem', color: COLORS.textSecondary }}>
                <FontAwesomeIcon icon={faClock} style={{ marginRight: '0.3rem', color: COLORS.textMuted }} />
                {new Date(ticket.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Message */}
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${COLORS.border}` }}>
            <span style={{ fontSize: '0.7rem', color: COLORS.textMuted }}>Message</span>
            <div style={{ fontSize: '0.9rem', color: COLORS.textSecondary, marginTop: '0.3rem', whiteSpace: 'pre-wrap' }}>
              {ticket.message}
            </div>
          </div>
        </div>

        {/* Replies Section */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: COLORS.shadow,
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '1rem' }}>
            <FontAwesomeIcon icon={faReply} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
            Replies ({replies.length})
          </h3>

          {replies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: COLORS.textMuted }}>
              <FontAwesomeIcon icon={faReply} style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.3 }} />
              <p>No replies yet. Be the first to respond!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {replies.map((reply) => (
                <div key={reply.id} style={{
                  background: reply.sender_role === 'Staff' ? '#f0fdf4' : COLORS.bgGray,
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  borderLeft: `3px solid ${reply.sender_role === 'Staff' ? COLORS.success : COLORS.primary}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.85rem', color: COLORS.textPrimary }}>
                      {reply.sender_name} {reply.sender_role === 'Staff' && '(Staff)'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: COLORS.textMuted }}>
                      {new Date(reply.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: COLORS.textSecondary, marginTop: '0.3rem', whiteSpace: 'pre-wrap' }}>
                    {reply.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply Form */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: COLORS.shadow,
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '0.75rem' }}>
            <FontAwesomeIcon icon={faPaperPlane} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
            Add Reply
          </h3>
          <form onSubmit={sendReply}>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply here..."
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.9rem',
                resize: 'vertical',
                fontFamily: 'inherit',
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <button
                type="submit"
                disabled={!replyMessage.trim() || sending}
                style={{
                  padding: '0.6rem 1.5rem',
                  background: COLORS.primary,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !replyMessage.trim() || sending ? 'not-allowed' : 'pointer',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: !replyMessage.trim() || sending ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!sending && replyMessage.trim()) {
                    e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.primary;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {sending ? (
                  <><FontAwesomeIcon icon={faSpinner} spin /> Sending...</>
                ) : (
                  <><FontAwesomeIcon icon={faPaperPlane} /> Send Reply</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}