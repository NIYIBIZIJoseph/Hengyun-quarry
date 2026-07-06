// src/components/support/FAQManager.tsx
import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faEdit, 
  faTrashAlt, 
  faSave, 
  faTimes,
  faQuestionCircle,
  faEye,
  faEyeSlash,
  faChevronDown,
  faChevronRight
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

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

export default function FAQManager() {
  const { t } = useTranslation();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', category: '', sort_order: 0 });
  const [showForm, setShowForm] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);

  const fetchFAQs = async () => {
    try {
      const res = await fetch('/api/faq', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setFaqs(data);
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFAQs(); }, []);

  // ✅ CREATE or UPDATE FAQ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      alert(t('questionAnswerRequired') || 'Question and answer are required');
      return;
    }

    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { ...form, id: editing.id } : form;
    
    try {
      const res = await fetch('/api/faq', { 
        method, 
        headers: getAuthHeaders(), 
        body: JSON.stringify(body) 
      });
      if (res.ok) {
        setEditing(null);
        setForm({ question: '', answer: '', category: '', sort_order: 0 });
        setShowForm(false);
        await fetchFAQs();
      } else {
        const error = await res.json();
        alert(error.error || t('failedToSaveFaq') || 'Failed to save FAQ');
      }
    } catch (err) {
      console.error('Error saving FAQ:', err);
      alert(t('networkError') || 'Network error');
    }
  };

  // ✅ DELETE FAQ - WORKS PROPERLY
  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDeleteFaq') || 'Delete this FAQ?')) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/faq?id=${id}`, { 
        method: 'DELETE', 
        headers: getAuthHeaders() 
      });
      if (res.ok) {
        await fetchFAQs();
      } else {
        const error = await res.json();
        alert(error.error || t('failedToDelete') || 'Failed to delete');
      }
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      alert(t('networkError') || 'Network error');
    } finally {
      setProcessing(null);
    }
  };

  // ✅ TOGGLE ACTIVE STATUS - EYE ICON
  const toggleActive = async (faq: FAQ) => {
    setProcessing(faq.id);
    try {
      const res = await fetch('/api/faq', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          id: faq.id,
          is_active: !faq.is_active
        }),
      });
      if (res.ok) {
        await fetchFAQs();
      } else {
        const error = await res.json();
        alert(error.error || t('failedToUpdate') || 'Failed to update');
      }
    } catch (err) {
      console.error('Error toggling FAQ:', err);
      alert(t('networkError') || 'Network error');
    } finally {
      setProcessing(null);
    }
  };

  // ✅ UPDATE FAQ - EDIT BUTTON
  const handleUpdate = async (faq: FAQ) => {
    setProcessing(faq.id);
    try {
      const res = await fetch('/api/faq', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          id: faq.id,
          question: faq.question,
          answer: faq.answer,
          category: faq.category || '',
          sort_order: faq.sort_order || 0,
          is_active: faq.is_active
        }),
      });
      if (res.ok) {
        await fetchFAQs();
      } else {
        const error = await res.json();
        alert(error.error || t('failedToUpdate') || 'Failed to update');
      }
    } catch (err) {
      console.error('Error updating FAQ:', err);
      alert(t('networkError') || 'Network error');
    } finally {
      setProcessing(null);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleEdit = (faq: FAQ) => {
    setEditing(faq);
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
      sort_order: faq.sort_order || 0,
    });
    setShowForm(true);
    setExpandedFaq(faq.id);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: COLORS.textMuted }}>
        {t('loadingFaqs') || 'Loading FAQs...'}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: COLORS.textPrimary, margin: 0 }}>
            <FontAwesomeIcon icon={faQuestionCircle} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
            {t('manageFaqs') || 'Manage FAQs'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0.15rem 0 0 0' }}>
            {faqs.length} {t('faqsTotal') || 'FAQs total'}
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ question: '', answer: '', category: '', sort_order: 0 });
            setShowForm(!showForm);
          }}
          style={{
            padding: '0.5rem 1.25rem',
            background: showForm ? COLORS.danger : COLORS.primary,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
          }}
        >
          <FontAwesomeIcon icon={showForm ? faTimes : faPlus} />
          {showForm ? (t('close') || 'Close') : (t('addFaq') || 'Add FAQ')}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: COLORS.shadow,
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                {t('question') || 'Question'} *
              </label>
              <input
                type="text"
                placeholder={t('enterQuestion') || 'Enter question...'}
                value={form.question}
                onChange={e => setForm({ ...form, question: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                {t('answer') || 'Answer'} *
              </label>
              <textarea
                placeholder={t('enterAnswer') || 'Enter answer...'}
                value={form.answer}
                onChange={e => setForm({ ...form, answer: e.target.value })}
                required
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                {t('categoryOptional') || 'Category (optional)'}
              </label>
              <input
                type="text"
                placeholder={t('categoryPlaceholder') || 'e.g., General, Technical...'}
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.25rem' }}>
                {t('sortOrder') || 'Sort order'}
              </label>
              <input
                type="number"
                placeholder="0"
                value={form.sort_order}
                onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
                setForm({ question: '', answer: '', category: '', sort_order: 0 });
              }}
              style={{
                padding: '0.6rem 1.5rem',
                background: COLORS.bgGray,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                color: COLORS.textSecondary,
              }}
            >
              <FontAwesomeIcon icon={faTimes} /> {t('cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              style={{
                padding: '0.6rem 1.5rem',
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
              }}
            >
              <FontAwesomeIcon icon={editing ? faSave : faPlus} />
              {editing ? (t('update') || 'Update') : (t('create') || 'Create')}
            </button>
          </div>
        </form>
      )}

      {/* FAQ List */}
      {faqs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          background: 'white',
          borderRadius: '12px',
          boxShadow: COLORS.shadow,
        }}>
          <FontAwesomeIcon icon={faQuestionCircle} style={{ fontSize: '3rem', color: COLORS.textMuted, marginBottom: '1rem' }} />
          <h3 style={{ color: COLORS.textSecondary, fontSize: '1rem' }}>{t('noFaqs') || 'No FAQs yet'}</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {faqs.map((faq) => (
            <FAQCard
              key={faq.id}
              faq={faq}
              expanded={expandedFaq === faq.id}
              onToggle={() => toggleExpand(faq.id)}
              onEdit={() => handleEdit(faq)}
              onDelete={handleDelete}
              onActiveToggle={toggleActive}
              processing={processing === faq.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ========== FAQ CARD COMPONENT ==========
function FAQCard({ 
  faq, 
  expanded,
  onToggle,
  onEdit, 
  onDelete, 
  onActiveToggle,
  processing
}: { 
  faq: FAQ; 
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void; 
  onDelete: (id: number) => void; 
  onActiveToggle: (faq: FAQ) => void;
  processing: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

  return (
    <div
      style={{
        background: 'white',
        border: `1px solid ${faq.is_active ? COLORS.border : '#fee2e2'}`,
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        boxShadow: isHovered ? COLORS.shadowHover : COLORS.shadow,
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        opacity: faq.is_active ? 1 : 0.6,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        {/* LEFT SIDE - Click to expand */}
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={onToggle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FontAwesomeIcon 
              icon={expanded ? faChevronDown : faChevronRight} 
              style={{ 
                color: faq.is_active ? COLORS.primary : COLORS.textMuted,
                fontSize: '0.7rem',
                transition: 'transform 0.2s',
              }} 
            />
            <span style={{ 
              fontWeight: '500', 
              color: faq.is_active ? COLORS.textPrimary : COLORS.textMuted,
              fontSize: '0.9rem',
            }}>
              {faq.question}
            </span>
            {!faq.is_active && (
              <span style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '0.1rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.6rem',
                fontWeight: '500',
              }}>
                {t('inactive') || 'Inactive'}
              </span>
            )}
            {faq.category && (
              <span style={{
                background: COLORS.bgGray,
                color: COLORS.textMuted,
                padding: '0.1rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.6rem',
              }}>
                {faq.category}
              </span>
            )}
          </div>
          {expanded && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              background: COLORS.bgGray,
              borderRadius: '8px',
              color: COLORS.textSecondary,
              fontSize: '0.85rem',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
            }}>
              {faq.answer}
            </div>
          )}
        </div>

        {/* RIGHT SIDE - Action Buttons */}
        <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
          {/* ✅ EYE ICON: Toggles Active/Inactive - NOT DELETE */}
          <button
            onClick={() => onActiveToggle(faq)}
            disabled={processing}
            style={{
              background: 'transparent',
              border: 'none',
              color: faq.is_active ? COLORS.success : COLORS.textMuted,
              cursor: processing ? 'not-allowed' : 'pointer',
              padding: '0.2rem 0.4rem',
              borderRadius: '4px',
              transition: 'all 0.2s',
              opacity: processing ? 0.5 : 1,
            }}
            title={faq.is_active ? t('deactivate') || 'Deactivate' : t('activate') || 'Activate'}
          >
            <FontAwesomeIcon icon={faq.is_active ? faEye : faEyeSlash} />
          </button>

          {/* ✅ EDIT ICON: Opens Edit Form */}
          <button
            onClick={onEdit}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.info,
              cursor: 'pointer',
              padding: '0.2rem 0.4rem',
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
            title={t('edit') || 'Edit'}
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>

          {/* ✅ DELETE ICON: Deletes FAQ - NOT Eye */}
          <button
            onClick={() => onDelete(faq.id)}
            disabled={processing}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.danger,
              cursor: processing ? 'not-allowed' : 'pointer',
              padding: '0.2rem 0.4rem',
              borderRadius: '4px',
              transition: 'all 0.2s',
              opacity: processing ? 0.5 : 1,
            }}
            title={t('delete') || 'Delete'}
          >
            <FontAwesomeIcon icon={faTrashAlt} />
          </button>
        </div>
      </div>
    </div>
  );
}