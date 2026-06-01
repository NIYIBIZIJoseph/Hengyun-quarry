'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Get the scrollable container
    const getScrollContainer = () => {
      const mainElement = document.querySelector('main');
      if (mainElement && mainElement.scrollHeight > mainElement.clientHeight) {
        return mainElement;
      }
      return window;
    };

    const handleScroll = () => {
      const container = getScrollContainer();
      let scrollTop = 0;
      
      if (container === window) {
        scrollTop = window.scrollY || document.documentElement.scrollTop;
      } else {
        scrollTop = (container as HTMLElement).scrollTop;
      }
      
      // Show button only after scrolling 300px
      setVisible(scrollTop > 300);
    };

    // Add scroll listeners
    window.addEventListener('scroll', handleScroll);
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
    }
    
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mainElement) {
        mainElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        background: '#f59e0b',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '36px',
        height: '36px',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.9rem',
        transition: 'all 0.2s',
        opacity: 0.9,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#e67e22';
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#f59e0b';
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.opacity = '0.9';
      }}
      aria-label="Back to top"
    >
      <FontAwesomeIcon icon={faArrowUp} />
    </button>
  );
}