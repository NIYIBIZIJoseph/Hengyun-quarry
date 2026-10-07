// src/components/LoadingSpinner.tsx
import { useEffect, useState } from 'react';

export default function LoadingSpinner() {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Fade out slightly before unmount for smoothness
    const t = setTimeout(() => setOpacity(0), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: '#0f2b3d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        transition: 'opacity 0.15s ease',
        opacity,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
        {/* Brand mark — clean SVG, no text overlap */}
        <svg width="180" height="48" viewBox="0 0 160 45" fill="none">
          <path d="M8 36 L25 14 L38 27 L52 9 L70 31 L84 18 L102 36"
                stroke="#f59e0b" strokeWidth="2.5" fill="none"
                strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M102 36 L115 22 L128 34 L142 18 L155 36"
                stroke="#f59e0b" strokeWidth="2.5" fill="none"
                strokeLinecap="round" strokeLinejoin="round"/>
          <text x="24" y="20" fontFamily="serif" fontSize="16" fill="#f59e0b" fontWeight="bold">恒</text>
          <text x="52" y="25" fontFamily="Arial, sans-serif" fontSize="12" fill="white" fontWeight="bold">HENG YUN</text>
        </svg>

        {/* Thin orange ring */}
        <div className="hy-ring-spinner" />

        <style jsx global>{`
          .hy-ring-spinner {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: 3px solid rgba(245, 158, 11, 0.15);
            border-top-color: #f59e0b;
            animation: hy-spin 0.8s linear infinite;
          }
          @keyframes hy-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}