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
  faGlobe
} from '@fortawesome/free-solid-svg-icons';

export default function AITranslationWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState('en');
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'sw', name: 'Swahili', flag: '🇹🇿' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  ];

  // Detect text selection
  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      if (text && text.length > 0 && text.length < 1000) {
        setSelectedText(text);
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        if (rect) {
          setPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 50,
          });
        }
      }
    };

    document.addEventListener('mouseup', handleTextSelection);
    return () => document.removeEventListener('mouseup', handleTextSelection);
  }, []);

  // Close widget when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        if (!isOpen) setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const translateText = async () => {
    if (!selectedText) return;
    
    setIsTranslating(true);
    try {
      const langMap: Record<string, string> = {
        en: 'en', rw: 'rw', zh: 'zh-CN', fr: 'fr', sw: 'sw', ar: 'ar', es: 'es'
      };
      
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langMap[targetLang]}&dt=t&q=${encodeURIComponent(selectedText)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data[0]) {
        const translation = data[0].map((item: any) => item[0]).join('');
        setTranslatedText(translation);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Translation error:', error);
      alert('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const translateInNewTab = () => {
    const url = `https://translate.google.com/?sl=auto&tl=${targetLang}&text=${encodeURIComponent(selectedText)}&op=translate`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Floating translate button that appears when text is selected */}
      {selectedText && !isOpen && (
        <div
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            transform: 'translateX(-50%)',
            background: '#f59e0b',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '20px',
            fontSize: '13px',
            cursor: 'pointer',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.2s',
          }}
          onClick={translateText}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
        >
          {isTranslating ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : (
            <FontAwesomeIcon icon={faLanguage} />
          )}
          <span>Translate to {languages.find(l => l.code === targetLang)?.name}</span>
        </div>
      )}

      {/* Translation Widget Popup */}
      {isOpen && translatedText && (
        <div
          ref={widgetRef}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '380px',
            maxWidth: '90vw',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            zIndex: 10001,
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1a4a6e, #0f2b3d)',
            color: 'white',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FontAwesomeIcon icon={faRobot} />
              <span style={{ fontWeight: 'bold' }}>AI Translation</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* Language Selector */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Translate to:
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
              }}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Original Text */}
          <div style={{ padding: '12px 16px', background: '#f9fafb' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Original:</div>
            <div style={{ fontSize: '14px', wordBreak: 'break-word', maxHeight: '100px', overflowY: 'auto' }}>
              {selectedText}
            </div>
          </div>

          {/* Translated Text */}
          <div style={{ padding: '12px 16px', background: '#d1fae5', position: 'relative' }}>
            <div style={{ fontSize: '11px', color: '#065f46', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Translation:</span>
              <button
                onClick={copyToClipboard}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#065f46',
                }}
              >
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} /> {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div style={{ fontSize: '14px', wordBreak: 'break-word', maxHeight: '150px', overflowY: 'auto' }}>
              {translatedText}
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
            <button
              onClick={translateInNewTab}
              style={{
                flex: 1,
                background: '#e5e7eb',
                border: 'none',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '12px',
              }}
            >
              <FontAwesomeIcon icon={faGlobe} /> Open in Google Translate
            </button>
            <button
              onClick={() => {
                translateText();
              }}
              style={{
                flex: 1,
                background: '#f59e0b',
                border: 'none',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '12px',
              }}
            >
              <FontAwesomeIcon icon={faLanguage} /> Translate Again
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}