import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faUser, faPhoneAlt, faTag, faFlag,
  faSave, faReply, faClock, faEnvelope, faPrint
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface Reply {
  id: number;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

interface Ticket {
  id: number;
  ticket_number: string;
  user_name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  category?: string;
}

export default function TicketDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = router.query;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  useEffect(() => {
    if (!id) return;

    fetch(`/api/support/tickets/${id}`, {
      headers: getAuthHeaders(),
    })
      .then(res => res.json())
      .then(data => {
        setTicket(data.ticket);
        setReplies(data.messages || []);
        setStatus(data.ticket.status);
        setPriority(data.ticket.priority);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const updateTicket = async () => {
    await fetch(`/api/support/tickets/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, priority }),
    });
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await fetch(`/api/support/tickets/${id}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: newMessage }),
    });

    setNewMessage('');

    const res = await fetch(`/api/support/tickets/${id}`, {
      headers: getAuthHeaders(),
    });

    const data = await res.json();
    setReplies(data.messages || []);
  };

  if (loading) {
    return (
      <DashboardLayout>
        {t('loadingTicketDetails') || 'Loading ticket details...'}
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        {t('ticketNotFound') || 'Ticket not found'}
      </DashboardLayout>
    );
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'open': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusText = (s: string) => {
    switch (s) {
      case 'open': return t('statusOpen') || 'Open';
      case 'in_progress': return t('statusInProgress') || 'In Progress';
      case 'resolved': return t('statusResolved') || 'Resolved';
      case 'closed': return t('statusClosed') || 'Closed';
      default: return s;
    }
  };

  const getPriorityText = (p: string) => {
    switch (p) {
      case 'urgent': return t('priorityUrgent') || 'Urgent';
      case 'high': return t('priorityHigh') || 'High';
      case 'medium': return t('priorityMedium') || 'Medium';
      case 'low': return t('priorityLow') || 'Low';
      default: return p;
    }
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => router.push('/dashboard/support')}
          style={{
            background: '#e5e7eb',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          {' '}
          {t('backToSupport') || 'Back to Support'}
        </button>

        <button
          onClick={() => window.print()}
          style={{
            background: '#f59e0b',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          <FontAwesomeIcon icon={faPrint} />
          {' '}
          {t('print') || 'Print'}
        </button>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <h1>
          Ticket #{ticket.ticket_number}
        </h1>

        <div style={{ marginTop: '1rem' }}>
          <strong>Status:</strong>{' '}
          <span style={{ color: statusColor(ticket.status) }}>
            {getStatusText(ticket.status)}
          </span>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <strong>Priority:</strong>{' '}
          <span style={{ color: priorityColor(ticket.priority) }}>
            {getPriorityText(ticket.priority)}
          </span>
        </div>

        <p style={{ marginTop: '1rem' }}>
          {ticket.message}
        </p>

        <div style={{ marginTop: '1rem' }}>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            style={{ marginLeft: '10px' }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <button onClick={updateTicket} style={{ marginLeft: '10px' }}>
            <FontAwesomeIcon icon={faSave} /> Update
          </button>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>Replies</h3>

        {replies.map(reply => (
          <div key={reply.id} style={{ borderBottom: '1px solid #ddd', padding: '10px 0' }}>
            <strong>{reply.sender_name}</strong>
            <p>{reply.message}</p>
          </div>
        ))}

        <form onSubmit={sendReply} style={{ marginTop: '1rem' }}>
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            rows={3}
            style={{ width: '100%' }}
          />

          <button type="submit" style={{ marginTop: '10px' }}>
            <FontAwesomeIcon icon={faReply} /> Send Reply
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}