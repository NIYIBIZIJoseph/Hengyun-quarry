"use client";

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log('🔄 BackToTop: Looking for ANY scrollable element');

    // Method 1: Find ANY element with scroll
    const findAnyScrollable = (): HTMLElement | null => {
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const style = window.getComputedStyle(el);
        // Check if element has overflow auto/scroll AND has scrollable content
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll')) {
          if (el.scrollHeight > el.clientHeight + 5) { // +5 for rounding errors
            console.log('✅ Found scrollable:', el.tagName, 'ID:', el.id || 'no-id', 'Class:', el.className || 'no-class');
            return el as HTMLElement;
          }
        }
      }
      return null;
    };

    // Method 2: Check if the page itself is scrolling (body/html)
    const isPageScrolling = (): boolean => {
      return document.documentElement.scrollHeight > document.documentElement.clientHeight ||
             document.body.scrollHeight > document.body.clientHeight;
    };

    // Find the scroll container
    let scrollContainer = findAnyScrollable();

    // If no element has scroll, check if page is scrolling
    if (!scrollContainer && isPageScrolling()) {
      console.log('✅ Page itself is scrolling (html/body)');
      // Use window for page scroll
      scrollContainer = null; // Will use window fallback
    }

    const handleScroll = () => {
      let scrollTop = 0;
      
      if (scrollContainer) {
        scrollTop = scrollContainer.scrollTop;
        console.log('📊 Container scroll:', scrollTop);
      } else {
        // Use window/page scroll
        scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
        console.log('📊 Page/Window scroll:', scrollTop);
      }
      
      const shouldShow = scrollTop > 300;
      if (shouldShow !== isVisible) {
        setIsVisible(shouldShow);
      }
    };

    // Add listeners to EVERYTHING that might scroll
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    // Always listen to window scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    // Also check on resize
    window.addEventListener('resize', handleScroll, { passive: true });

    // Initial check with delay to ensure layout is settled
    setTimeout(handleScroll, 100);
    setTimeout(handleScroll, 500);

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isVisible]);

  const scrollToTop = () => {
    // Try to find scrollable container and scroll it
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const style = window.getComputedStyle(el);
      if ((style.overflowY === 'auto' || style.overflowY === 'scroll')) {
        if (el.scrollHeight > el.clientHeight) {
          (el as HTMLElement).scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    }
    // Fallback: scroll window
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        backgroundColor: '#f59e0b',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 0.3s ease',
        zIndex: 9999,
        opacity: 0.95,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#d97706';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.3)';
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#f59e0b';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.opacity = '0.95';
      }}
    >
      <FontAwesomeIcon icon={faArrowUp} />
    </button>
  );
}