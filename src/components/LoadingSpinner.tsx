// src/components/LoadingSpinner.tsx
export default function LoadingSpinner() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
      }}
      aria-label="Loading"
    >
      <div className="hy-quarry-spinner" />
      <style jsx global>{`
        .hy-quarry-spinner {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 6px solid #fef3c7;
          border-top-color: #f59e0b;
          animation: hy-spin 0.9s linear infinite;
        }
        @keyframes hy-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}