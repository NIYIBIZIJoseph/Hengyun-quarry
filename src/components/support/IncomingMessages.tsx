// src/components/support/IncomingMessages.tsx
import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faEye, 
  faTicketAlt, 
  faTrashAlt,
  faCheckCircle,
  faClock,
  faUser,
  faPhoneAlt,
  faEnvelope as faEnvelopeIcon,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  bgGray: "#f9fafb",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowHover: "0 8px 25px rgba(0,0,0,0.08)",
};

// ========== ACTION BUTTON ==========
function ActionButton({ 
  label, 
  icon, 
  onClick, 
  color = COLORS.primary,
  disabled = false
}: { 
  label: string; 
  icon: any; 
  onClick: () => void; 
  color?: string;
  disabled?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '0.4rem 0.8rem',
        background: isHovered && !disabled ? color : 'transparent',
        border: `1px solid ${isHovered && !disabled ? color : COLORS.border}`,
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.75rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        color: disabled ? COLORS.textMuted : (isHovered ? 'white' : COLORS.textSecondary),
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <FontAwesomeIcon icon={icon} style={{ fontSize: '0.7rem' }} />
      {label}
    </button>
  );
}

// ========== MESSAGE CARD ==========
function MessageCard({ 
  message, 
  onMarkRead, 
  onConvert, 
  onDelete,
  isProcessing
}: { 
  message: any; 
  onMarkRead: (id: number) => void; 
  onConvert: (msg: any) => void; 
  onDelete: (id: number) => void;
  isProcessing: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

  return (
    <div
      style={{
        background: message.is_read ? 'white' : '#fef3c7',
        border: `1px solid ${message.is_read ? COLORS.border : COLORS.primary}`,
        borderRadius: '12px',
        padding: '1.25rem',
        boxShadow: isHovered ? COLORS.shadowHover : COLORS.shadow,
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        position: 'relative',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!message.is_read && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: COLORS.primary,
          color: 'white',
          padding: '2px 10px',
          borderRadius: '20px',
          fontSize: '0.65rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
        }}>
          {t('new') || 'New'}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: `${COLORS.primary}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.primary,
            }}>
              <FontAwesomeIcon icon={faUser} />
            </div>
            <div>
              <div style={{ fontWeight: '600', color: COLORS.textPrimary }}>
                {message.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                {message.email && (
                  <span><FontAwesomeIcon icon={faEnvelopeIcon} style={{ marginRight: '0.2rem' }} /> {message.email} </span>
                )}
                {message.phone && (
                  <span><FontAwesomeIcon icon={faPhoneAlt} style={{ marginRight: '0.2rem' }} /> {message.phone}</span>
                )}
              </div>
            </div>
          </div>
          {message.subject && (
            <div style={{ marginTop: '0.5rem', fontWeight: '500', fontSize: '0.9rem', color: COLORS.textPrimary }}>
              {message.subject}
            </div>
          )}
          <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>
            <FontAwesomeIcon icon={faClock} style={{ marginRight: '0.2rem' }} />
            {new Date(message.created_at).toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '0.75rem',
        background: COLORS.bgGray,
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        color: COLORS.textSecondary,
        fontSize: '0.85rem',
        lineHeight: '1.6',
        maxHeight: '100px',
        overflowY: 'auto',
      }}>
        {message.message}
      </div>

      <div style={{
        marginTop: '1rem',
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        borderTop: `1px solid ${COLORS.border}`,
        paddingTop: '0.75rem',
      }}>
        <ActionButton
          label={t('markRead') || 'Mark Read'}
          icon={faEye}
          onClick={() => onMarkRead(message.id)}
          color={COLORS.primary}
          disabled={message.is_read || isProcessing}
        />
        <ActionButton
          label={t('convertToTicket') || 'Convert to Ticket'}
          icon={faTicketAlt}
          onClick={() => onConvert(message)}
          color={COLORS.success}
          disabled={isProcessing}
        />
        <ActionButton
          label={t('delete') || 'Delete'}
          icon={faTrashAlt}
          onClick={() => onDelete(message.id)}
          color={COLORS.danger}
          disabled={isProcessing}
        />
      </div>
    </div>
  );
}

export default function IncomingMessages() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/contact-messages', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const markAsRead = async (id: number) => {
    setProcessing(id);
    try {
      const res = await fetch('/api/contact-messages', { 
        method: 'PUT', 
        headers: getAuthHeaders(), 
        body: JSON.stringify({ id }) 
      });
      if (res.ok) {
        await fetchMessages();
      } else {
        alert(t('failedToMarkRead') || 'Failed to mark as read');
      }
    } catch (err) {
      console.error(err);
      alert(t('error') || 'Error');
    } finally {
      setProcessing(null);
    }
  };

  const convertToTicket = async (msg: any) => {
    setProcessing(msg.id);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_name: msg.name,
          phone: msg.phone,
          subject: msg.subject || t('contactFormMessage') || 'Contact form message',
          message: msg.message,
          priority: 'medium',
        }),
      });
      if (res.ok) {
        // Mark message as read
        await fetch('/api/contact-messages', { 
          method: 'PUT', 
          headers: getAuthHeaders(), 
          body: JSON.stringify({ id: msg.id }) 
        });
        alert(t('ticketCreatedFromMessage') || 'Ticket created from message');
        await fetchMessages();
      } else {
        const error = await res.json();
        alert(error.error || t('failedToCreateTicket') || 'Failed to create ticket');
      }
    } catch (err) {
      console.error(err);
      alert(t('errorCreatingTicket') || 'Error creating ticket');
    } finally {
      setProcessing(null);
    }
  };

  const deleteMessage = async (id: number) => {
    if (!confirm(t('confirmDeleteMessage') || 'Delete this message?')) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/contact-messages?id=${id}`, { 
        method: 'DELETE', 
        headers: getAuthHeaders() 
      });
      if (res.ok) {
        await fetchMessages();
      } else {
        alert(t('failedToDelete') || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
      alert(t('error') || 'Error');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: COLORS.textMuted }}>
        {t('loadingMessages') || 'Loading messages...'}
      </div>
    );
  }

  return (
    <div>
      {messages.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'white',
          borderRadius: '12px',
          boxShadow: COLORS.shadow,
        }}>
          <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: '3rem', color: COLORS.textMuted, marginBottom: '1rem' }} />
          <h3 style={{ color: COLORS.textSecondary, fontSize: '1rem' }}>{t('noIncomingMessages') || 'No incoming messages.'}</h3>
          <p style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>
            {t('messagesWillAppear') || 'Messages from contact form will appear here'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg) => (
            <MessageCard
              key={msg.id}
              message={msg}
              onMarkRead={markAsRead}
              onConvert={convertToTicket}
              onDelete={deleteMessage}
              isProcessing={processing === msg.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}