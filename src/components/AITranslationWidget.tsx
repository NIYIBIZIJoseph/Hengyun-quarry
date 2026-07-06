"use client";
import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLanguage, 
  faTimes, 
  faCopy, 
  faCheck, 
  faRobot,
  faSpinner,
  faGlobe,
  faChevronDown,
  faChevronUp,
  faLightbulb,
  faMousePointer,
  faArrowRight,
  faExchangeAlt,
  faTrashAlt,
  faHistory,
  faExternalLinkAlt,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';

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

export default function AITranslationWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState('en');
  const [sourceLang, setSourceLang] = useState('auto');
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [translationHistory, setTranslationHistory] = useState<Array<{original: string, translated: string, lang: string}>>([]);
  const [error, setError] = useState<string | null>(null);
  const [manualText, setManualText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [isFirstTranslate, setIsFirstTranslate] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  const languages = [
    { code: 'auto', name: 'Auto Detect', flag: '🌐' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'sw', name: 'Swahili', flag: '🇹🇿' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  ];

  // Translate using server-side API
  const translateText = async (text: string) => {
    if (!text) return;
    
    setIsTranslating(true);
    setError(null);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          source: sourceLang,
          target: targetLang
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Translation failed');
      }

      if (data.success) {
        setTranslatedText(data.translation);
        if (data.detectedLanguage) {
          setDetectedLanguage(data.detectedLanguage);
        }
        
        setTranslationHistory(prev => [
          { 
            original: text.substring(0, 100) + (text.length > 100 ? '...' : ''), 
            translated: data.translation.substring(0, 100) + (data.translation.length > 100 ? '...' : ''), 
            lang: targetLang 
          },
          ...prev.slice(0, 9)
        ]);
        
        setIsOpen(true);
        setIsFirstTranslate(false);
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      setError(error.message || 'Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  // ✅ FIXED: Translate selected text
  const handleManualTranslate = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      setSelectedText(text);
      translateText(text);
    } else {
      setError('Please select some text on the page first.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Translate typed text
  const handleTypeTranslate = () => {
    if (manualText.trim().length > 0) {
      setSelectedText(manualText);
      translateText(manualText);
    } else {
      setError('Please enter some text to translate.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // ✅ FIXED: Copy to clipboard with feedback
  const copyToClipboard = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // ✅ FIXED: Open in Google Translate - Now working!
  const openInGoogleTranslate = () => {
    const text = selectedText || manualText;
    if (!text) {
      setError('No text to translate. Please select or type text first.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    // Build the Google Translate URL
    const source = sourceLang === 'auto' ? 'auto' : sourceLang;
    const target = targetLang;
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.google.com/?sl=${source}&tl=${target}&text=${encodedText}&op=translate`;
    
    // Open in new tab
    window.open(url, '_blank');
  };

  const closeWidget = () => {
    setIsOpen(false);
    setTranslatedText('');
    setError(null);
  };

  const resetAll = () => {
    setSelectedText('');
    setTranslatedText('');
    setIsOpen(false);
    setError(null);
    setManualText('');
    setDetectedLanguage(null);
    setIsFirstTranslate(true);
    setCopySuccess(false);
  };

  const getLanguageName = (code: string) => {
    const lang = languages.find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.name}` : code;
  };

  const swapLanguages = () => {
    if (sourceLang !== 'auto') {
      const temp = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(temp);
    }
  };

  // Keyboard shortcut Ctrl+Shift+T
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        handleManualTranslate();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div style={{
      padding: '1rem 0',
      maxWidth: '720px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${COLORS.primary}20, ${COLORS.primary}10)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${COLORS.primary}30`,
          }}>
            <FontAwesomeIcon icon={faRobot} style={{ fontSize: '24px', color: COLORS.primary }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.textPrimary, margin: 0 }}>
              AI Translation
            </h2>
            <p style={{ fontSize: '0.85rem', color: COLORS.textSecondary, margin: '0.15rem 0 0 0' }}>
              Powered by Google Translate
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={resetAll}
            style={{
              padding: '0.4rem 1rem',
              background: COLORS.bgGray,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: COLORS.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
              e.currentTarget.style.color = COLORS.danger;
              e.currentTarget.style.borderColor = COLORS.danger;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.bgGray;
              e.currentTarget.style.color = COLORS.textSecondary;
              e.currentTarget.style.borderColor = COLORS.border;
            }}
          >
            <FontAwesomeIcon icon={faTrashAlt} /> Clear All
          </button>
        </div>
      </div>

      {/* Language Selector - Enhanced UI */}
      <div style={{
        background: 'white',
        padding: '1.25rem',
        borderRadius: '12px',
        boxShadow: COLORS.shadow,
        marginBottom: '1.5rem',
        border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr auto',
          gap: '8px',
          alignItems: 'center',
        }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: COLORS.textMuted, display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              From
            </label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: `2px solid ${COLORS.border}`,
                fontSize: '0.85rem',
                background: 'white',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.primary}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={swapLanguages}
            style={{
              padding: '0.5rem 0.6rem',
              background: COLORS.bgGray,
              border: `2px solid ${COLORS.border}`,
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '0.8rem',
              marginTop: '18px',
              transition: 'all 0.2s',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.primary;
              e.currentTarget.style.borderColor = COLORS.primary;
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.bgGray;
              e.currentTarget.style.borderColor = COLORS.border;
              e.currentTarget.style.color = COLORS.textPrimary;
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Swap languages"
          >
            <FontAwesomeIcon icon={faExchangeAlt} />
          </button>
          
          <div>
            <label style={{ fontSize: '0.7rem', color: COLORS.textMuted, display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              To
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: `2px solid ${COLORS.border}`,
                fontSize: '0.85rem',
                background: 'white',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.primary}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {languages.filter(l => l.code !== 'auto').map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
          
          {detectedLanguage && (
            <div style={{ marginTop: '18px', fontSize: '0.65rem', color: COLORS.textMuted, background: COLORS.bgGray, padding: '0.2rem 0.6rem', borderRadius: '12px', whiteSpace: 'nowrap' }}>
              🎯 {getLanguageName(detectedLanguage)}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Enhanced UI */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '0.75rem',
        marginBottom: '1rem',
      }}>
        <button
          onClick={handleManualTranslate}
          style={{
            padding: '0.75rem 1rem',
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
          }}
        >
          <FontAwesomeIcon icon={faMousePointer} />
          <span>Selected Text</span>
          <span style={{
            fontSize: '0.55rem',
            background: 'rgba(255,255,255,0.2)',
            padding: '0.1rem 0.4rem',
            borderRadius: '8px',
          }}>
            Ctrl+Shift+T
          </span>
        </button>
        
        <button
          onClick={handleTypeTranslate}
          disabled={!manualText.trim() || isTranslating}
          style={{
            padding: '0.75rem 1rem',
            background: manualText.trim() && !isTranslating ? 'white' : COLORS.bgGray,
            border: `2px solid ${manualText.trim() && !isTranslating ? COLORS.primary : COLORS.border}`,
            borderRadius: '10px',
            color: manualText.trim() && !isTranslating ? COLORS.textPrimary : COLORS.textMuted,
            fontWeight: '600',
            fontSize: '0.85rem',
            cursor: manualText.trim() && !isTranslating ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            opacity: manualText.trim() && !isTranslating ? 1 : 0.6,
          }}
          onMouseEnter={(e) => {
            if (manualText.trim() && !isTranslating) {
              e.currentTarget.style.borderColor = COLORS.primaryDark;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = COLORS.shadowHover;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = manualText.trim() && !isTranslating ? COLORS.primary : COLORS.border;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {isTranslating ? (
            <><FontAwesomeIcon icon={faSpinner} spin /> Translating...</>
          ) : (
            <><FontAwesomeIcon icon={faArrowRight} /> Type & Translate</>
          )}
        </button>

        {/* ✅ FIXED: Open in Google Translate - Now Working! */}
        <button
          onClick={openInGoogleTranslate}
          style={{
            padding: '0.75rem 1rem',
            background: 'white',
            border: `2px solid ${COLORS.info}`,
            borderRadius: '10px',
            color: COLORS.info,
            fontWeight: '600',
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.info;
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.info}40`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = COLORS.info;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <FontAwesomeIcon icon={faGlobe} />
          <span>Google Translate</span>
          <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: '0.6rem' }} />
        </button>
      </div>

      {/* Manual Text Input - Enhanced UI */}
      <div style={{
        background: 'white',
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        boxShadow: COLORS.shadow,
        marginBottom: '1.5rem',
        border: `1px solid ${COLORS.border}`,
      }}>
        <label style={{ fontSize: '0.8rem', fontWeight: '500', color: COLORS.textSecondary, display: 'block', marginBottom: '0.5rem' }}>
          <FontAwesomeIcon icon={faArrowRight} style={{ color: COLORS.primary, marginRight: '0.3rem' }} />
          Type text to translate:
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Type text here and press Enter..."
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleTypeTranslate();
              }
            }}
            style={{
              flex: 1,
              padding: '0.7rem 0.85rem',
              border: `2px solid ${COLORS.border}`,
              borderRadius: '8px',
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              background: COLORS.bgGray,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.primary}20`;
              e.currentTarget.style.background = 'white';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.border;
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = COLORS.bgGray;
            }}
          />
          <button
            onClick={handleTypeTranslate}
            disabled={!manualText.trim() || isTranslating}
            style={{
              padding: '0.7rem 1.5rem',
              background: manualText.trim() && !isTranslating ? COLORS.primary : COLORS.textMuted,
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: manualText.trim() && !isTranslating ? 'pointer' : 'not-allowed',
              opacity: manualText.trim() && !isTranslating ? 1 : 0.5,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (manualText.trim() && !isTranslating) {
                e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = manualText.trim() && !isTranslating ? COLORS.primary : COLORS.textMuted;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isTranslating ? (
              <><FontAwesomeIcon icon={faSpinner} spin /> Translating</>
            ) : (
              <><FontAwesomeIcon icon={faArrowRight} /> Translate</>
            )}
          </button>
        </div>
      </div>

      {/* Error Message - Enhanced */}
      {error && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem 1rem',
          background: '#fee2e2',
          borderRadius: '8px',
          color: '#991b1b',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          borderLeft: `3px solid ${COLORS.danger}`,
        }}>
          <FontAwesomeIcon icon={faTimesCircle} style={{ color: COLORS.danger }} />
          {error}
        </div>
      )}

      {/* Instructions - Enhanced UI */}
      {isFirstTranslate && !translatedText && !error && (
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: COLORS.shadow,
          textAlign: 'center',
          border: `1px solid ${COLORS.border}`,
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${COLORS.primary}20, ${COLORS.primary}10)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            border: `2px dashed ${COLORS.primary}30`,
          }}>
            <FontAwesomeIcon icon={faLightbulb} style={{ fontSize: '32px', color: COLORS.primary }} />
          </div>

          <h3 style={{ fontSize: '1.1rem', color: COLORS.textPrimary, marginBottom: '0.5rem' }}>
            How to Use AI Translation
          </h3>
          <p style={{ color: COLORS.textSecondary, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Choose one of the methods below to translate text
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            textAlign: 'left',
            maxWidth: '550px',
            margin: '0 auto',
          }}>
            <div style={{
              padding: '1rem',
              background: COLORS.bgGray,
              borderRadius: '8px',
              borderLeft: `3px solid ${COLORS.primary}`,
            }}>
              <div style={{ fontWeight: '600', color: COLORS.textPrimary, fontSize: '0.9rem' }}>
                <FontAwesomeIcon icon={faMousePointer} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
                Method 1
              </div>
              <div style={{ fontSize: '0.85rem', color: COLORS.textSecondary }}>Select text → Click "Translate Selected Text"</div>
            </div>
            <div style={{
              padding: '1rem',
              background: COLORS.bgGray,
              borderRadius: '8px',
              borderLeft: `3px solid ${COLORS.primary}`,
            }}>
              <div style={{ fontWeight: '600', color: COLORS.textPrimary, fontSize: '0.9rem' }}>
                <FontAwesomeIcon icon={faArrowRight} style={{ marginRight: '0.3rem', color: COLORS.primary }} />
                Method 2
              </div>
              <div style={{ fontSize: '0.85rem', color: COLORS.textSecondary }}>Type text → Click "Translate" or press Enter</div>
            </div>
          </div>

          <div style={{
            marginTop: '1.5rem',
            padding: '0.75rem',
            background: '#fef3c7',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#92400e',
          }}>
            <FontAwesomeIcon icon={faLightbulb} style={{ color: COLORS.primary, marginRight: '0.3rem' }} />
            <strong>Tip:</strong> Select any text on this page, then click the "Translate Selected Text" button!
          </div>
        </div>
      )}

      {/* Translation Result - Enhanced UI */}
      {isOpen && translatedText && (
        <div style={{
          background: 'white',
          padding: '1.25rem',
          borderRadius: '12px',
          boxShadow: COLORS.shadow,
          marginTop: '1.5rem',
          borderLeft: `4px solid ${COLORS.success}`,
          animation: 'slideUp 0.3s ease',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <FontAwesomeIcon icon={faCheckCircle} style={{ color: COLORS.success, marginRight: '0.3rem' }} />
                Translation
              </span>
              {detectedLanguage && (
                <span style={{
                  fontSize: '0.6rem',
                  background: COLORS.bgGray,
                  padding: '0.15rem 0.6rem',
                  borderRadius: '12px',
                  color: COLORS.textMuted,
                }}>
                  Detected: {getLanguageName(detectedLanguage)}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              <button
                onClick={copyToClipboard}
                style={{
                  background: copySuccess ? COLORS.success : 'none',
                  border: 'none',
                  color: copySuccess ? 'white' : COLORS.textMuted,
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.3rem 0.7rem',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!copySuccess) {
                    e.currentTarget.style.backgroundColor = COLORS.bgGray;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!copySuccess) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <FontAwesomeIcon icon={copySuccess ? faCheck : faCopy} />
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={openInGoogleTranslate}
                style={{
                  background: 'none',
                  border: 'none',
                  color: COLORS.info,
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.3rem 0.7rem',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.bgGray;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <FontAwesomeIcon icon={faGlobe} /> Google
              </button>
              <button
                onClick={closeWidget}
                style={{
                  background: 'none',
                  border: 'none',
                  color: COLORS.danger,
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  padding: '0.3rem 0.7rem',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fee2e2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
          
          <div style={{
            fontSize: '1rem',
            color: COLORS.textPrimary,
            lineHeight: '1.6',
            padding: '0.75rem',
            background: COLORS.bgGray,
            borderRadius: '8px',
            border: `1px solid ${COLORS.border}`,
          }}>
            {translatedText}
          </div>
          
          {selectedText && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.5rem 0.75rem',
              background: '#f0fdf4',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: COLORS.textMuted,
              border: `1px solid ${COLORS.success}20`,
            }}>
              <strong>Original:</strong> {selectedText}
            </div>
          )}
        </div>
      )}

      {/* History - Enhanced UI */}
      {translationHistory.length > 0 && (
        <div style={{
          marginTop: '1.5rem',
          background: 'white',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          boxShadow: COLORS.shadow,
          border: `1px solid ${COLORS.border}`,
        }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.textMuted,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.2rem 0',
              width: '100%',
            }}
          >
            <FontAwesomeIcon icon={showHistory ? faChevronUp : faChevronDown} />
            <span>{showHistory ? 'Hide History' : 'Show History'}</span>
            <span style={{
              background: COLORS.bgGray,
              padding: '0.1rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.7rem',
              color: COLORS.textMuted,
            }}>
              {translationHistory.length}
            </span>
          </button>
          {showHistory && (
            <div style={{ marginTop: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
              {translationHistory.map((item, index) => (
                <div key={index} style={{
                  padding: '0.5rem 0.75rem',
                  background: COLORS.bgGray,
                  borderRadius: '6px',
                  marginBottom: '0.5rem',
                  fontSize: '0.8rem',
                  borderLeft: `2px solid ${COLORS.primary}`,
                }}>
                  <div style={{ color: COLORS.textMuted, fontSize: '0.7rem' }}>
                    {item.original} → {getLanguageName(item.lang)}
                  </div>
                  <div style={{ color: COLORS.textPrimary, marginTop: '0.2rem' }}>
                    {item.translated}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}