// src/components/settings/SupportConfig.tsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeadset, faTicketAlt } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function SupportConfig() {
  const { t } = useTranslation();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827', margin: 0 }}>
          <FontAwesomeIcon icon={faHeadset} style={{ color: '#f59e0b', marginRight: '0.5rem' }} />
          {t('supportSystemSettings') || 'Support System Settings'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.15rem 0 0 0' }}>
          {t('supportConfigDesc') || 'Configure ticket categories, priorities, and support workflows.'}
        </p>
      </div>

      <div style={{ 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        borderLeft: '3px solid #f59e0b',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ 
            padding: '1rem', 
            background: '#f9fafb', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <FontAwesomeIcon icon={faTicketAlt} style={{ color: '#f59e0b' }} />
              <strong style={{ fontSize: '0.9rem' }}>Auto-create tickets</strong>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
              {t('autoCreateTickets') || 'Auto‑create tickets from contact form'}:
              <span style={{ 
                padding: '2px 10px', 
                borderRadius: '12px', 
                background: '#d1fae5', 
                color: '#065f46',
                marginLeft: '0.5rem',
                fontWeight: '500',
                fontSize: '0.75rem',
              }}>
                {t('yes') || 'Yes'}
              </span>
            </p>
          </div>

          <div style={{ 
            padding: '1rem', 
            background: '#f9fafb', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <FontAwesomeIcon icon={faTicketAlt} style={{ color: '#f59e0b' }} />
              <strong style={{ fontSize: '0.9rem' }}>Default Priority</strong>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
              {t('defaultPriority') || 'Default priority for new tickets'}:
              <span style={{ 
                padding: '2px 10px', 
                borderRadius: '12px', 
                background: '#dbeafe', 
                color: '#1e40af',
                marginLeft: '0.5rem',
                fontWeight: '500',
                fontSize: '0.75rem',
              }}>
                {t('priorityMedium') || 'Medium'}
              </span>
            </p>
          </div>
        </div>

        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: '#fef3c7', 
          borderRadius: '8px',
          border: "'1px solid '#f59e0b'",
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <FontAwesomeIcon icon={faTicketAlt} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: '0.85rem', color: '#92400e' }}>
            {t('supportConfigNote') || 'Configure these settings in the full Support Configuration panel.'}
          </span>
        </div>
      </div>
    </div>
  );
}