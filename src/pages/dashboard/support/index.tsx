import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import SupportOverview from '@/components/support/SupportOverview';
import IncomingMessages from '@/components/support/IncomingMessages';
import TicketList from '@/components/support/TicketList';
import FAQManager from '@/components/support/FAQManager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faEnvelope, 
  faTicketAlt, 
  faQuestionCircle,
  faLanguage,
  faPaperPlane,
  faCopy,
  faCheck,
  faRobot,
  faSpinner,
  faTrash,
  faUser,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// AI Translation Component (inside the same file)
function AITranslator() {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Array<{
    id: string;
    original: string;
    translation: string;
    timestamp: Date;
  }>>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState('en');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧', googleCode: 'en' },
    { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼', googleCode: 'rw' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳', googleCode: 'zh-CN' },
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const translateText = async (text: string) => {
    if (!text.trim()) return;
    
    setIsTranslating(true);
    try {
      const selectedLang = languages.find(l => l.code === targetLang) || languages[0];
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${selectedLang.googleCode}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      let translation = text;
      if (data && data[0]) {
        translation = data[0].map((item: any) => item[0]).join('');
      }
      
      const newMessage = {
        id: Date.now().toString(),
        original: text,
        translation: translation,
        timestamp: new Date(),
      };
      
      setMessages(prev => [newMessage, ...prev]);
      setInputText('');
      
    } catch (error) {
      console.error('Translation error:', error);
      alert('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    translateText(inputText);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  // Example phrases - fixed to avoid special character issues
  const examplePhrases = [
    { text: 'I need help with my order', hint: 'Order help' },
    { text: 'John Doe is a hard worker', hint: 'Worker name' },
    { text: 'The product quality is excellent', hint: 'Product review' },
    { text: 'When will my delivery arrive?', hint: 'Delivery question' },
    { text: 'Muraho, ndaguhaye ibicuruzwa', hint: 'Kinyarwanda phrase' },
    { text: '你好，我需要帮助', hint: 'Chinese phrase' },
  ];

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 200px)',
      minHeight: '500px',
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem',
        background: 'linear-gradient(135deg, #1a4a6e, #0f2b3d)',
        color: 'white',
        borderRadius: '16px 16px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FontAwesomeIcon icon={faRobot} style={{ fontSize: '1.5rem' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>AI Translation Assistant</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', opacity: 0.8 }}>
              Translate any text - Worker names, Products, Support messages
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'white',
              fontSize: '0.75rem',
            }}
          >
            <FontAwesomeIcon icon={faTrash} /> Clear History
          </button>
        )}
      </div>

      {/* Language Selector */}
      <div style={{
        padding: '0.75rem 1.5rem',
        background: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Translate to:</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => setTargetLang(lang.code)}
              style={{
                padding: '0.3rem 0.8rem',
                borderRadius: '20px',
                border: targetLang === lang.code ? '2px solid #f59e0b' : '1px solid #d1d5db',
                background: targetLang === lang.code ? '#fef3c7' : 'white',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#9ca3af' }}>
          <FontAwesomeIcon icon={faArrowRight} /> Supports any text
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem 1.5rem',
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '1rem',
        background: '#f9fafb',
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#9ca3af',
          }}>
            <FontAwesomeIcon icon={faLanguage} style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
            <h4 style={{ marginBottom: '0.5rem' }}>AI Translation Assistant</h4>
            <p style={{ fontSize: '0.85rem' }}>Type or paste any text below to translate</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>✨ Supports: Worker Names, Product Names, Descriptions, Support Messages, and more!</p>
            <p style={{ fontSize: '0.75rem', marginTop: '1rem' }}>Try these examples:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
              {examplePhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(phrase.text)}
                  style={{
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '16px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                  }}
                  title={phrase.hint}
                >
                  {phrase.text.length > 30 ? phrase.text.substring(0, 30) + '...' : phrase.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              {/* Original Text */}
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <FontAwesomeIcon icon={faUser} style={{ fontSize: '0.5rem' }} /> Original
                </div>
                <div style={{ fontSize: '0.85rem', wordBreak: 'break-word', padding: '0.25rem 0' }}>
                  {msg.original}
                </div>
              </div>
              
              {/* Translation */}
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: '0.65rem', color: '#065f46', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <FontAwesomeIcon icon={faRobot} style={{ fontSize: '0.5rem' }} /> Translation ({languages.find(l => l.code === targetLang)?.name})
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  wordBreak: 'break-word',
                  padding: '0.5rem',
                  background: '#d1fae5',
                  borderRadius: '8px',
                  paddingRight: '40px',
                }}>
                  {msg.translation}
                </div>
                <button
                  onClick={() => copyToClipboard(msg.translation, msg.id)}
                  style={{
                    position: 'absolute',
                    bottom: '0.5rem',
                    right: '0.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#065f46',
                    fontSize: '0.7rem',
                  }}
                >
                  <FontAwesomeIcon icon={copiedId === msg.id ? faCheck : faCopy} />
                </button>
              </div>
              
              {/* Timestamp */}
              <div style={{ fontSize: '0.6rem', color: '#9ca3af', marginTop: '0.5rem', textAlign: 'right' }}>
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid #e5e7eb',
        background: 'white',
        borderRadius: '0 0 16px 16px',
        display: 'flex',
        gap: '0.75rem',
      }}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type or paste any text here to translate... (Worker names, Product names, Descriptions, Support messages, etc.)"
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: '12px',
            border: '1px solid #d1d5db',
            resize: 'none',
            fontSize: '0.85rem',
            fontFamily: 'inherit',
            minHeight: '70px',
          }}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={isTranslating || !inputText.trim()}
          style={{
            background: '#f59e0b',
            border: 'none',
            padding: '0 1.5rem',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 'bold',
            opacity: isTranslating || !inputText.trim() ? 0.6 : 1,
          }}
        >
          {isTranslating ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin />
              <span>Translating...</span>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faPaperPlane} />
              <span>Translate</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function SupportPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  
  const tabs = [
    { id: 'overview', label: t('overview') || 'Overview', icon: faChartLine },
    { id: 'incoming', label: t('incomingMessages') || 'Incoming Messages', icon: faEnvelope },
    { id: 'tickets', label: t('tickets') || 'Tickets', icon: faTicketAlt },
    { id: 'faq', label: t('faq') || 'FAQ', icon: faQuestionCircle },
    { id: 'aitranslate', label: 'AI Translate', icon: faLanguage },
  ];

  return (
    <DashboardLayout>
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          {t('supportCenter') || 'Support Center'}
        </h1>
        
        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          borderBottom: '1px solid #e5e7eb', 
          marginBottom: '1.5rem', 
          flexWrap: 'wrap' 
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.5rem 1rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                borderBottom: activeTab === tab.id ? '2px solid #f59e0b' : 'none',
                color: activeTab === tab.id ? '#f59e0b' : '#4b5563',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <FontAwesomeIcon icon={tab.icon} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <SupportOverview />}
        {activeTab === 'incoming' && <IncomingMessages />}
        {activeTab === 'tickets' && <TicketList />}
        {activeTab === 'faq' && <FAQManager />}
        {activeTab === 'aitranslate' && <AITranslator />}
      </div>
    </DashboardLayout>
  );
}