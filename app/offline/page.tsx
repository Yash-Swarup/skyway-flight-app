'use client'

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{
        fontSize: '4rem',
        marginBottom: '0.5rem',
      }}>✈️</div>
      <h1 style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: '1.75rem',
        fontWeight: 700,
      }}>You&apos;re offline</h1>
      <p style={{ color: '#64748b', maxWidth: 360, lineHeight: 1.7 }}>
        No internet connection detected. Your previously viewed bookings are still
        available — check <strong style={{ color: '#94a3b8' }}>My Bookings</strong> below.
      </p>
      <a href="/bookings" style={{
        marginTop: '0.5rem',
        background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
        color: 'white',
        padding: '11px 24px',
        borderRadius: 10,
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: '0.9rem',
      }}>
        View Cached Bookings
      </a>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: 'none',
          border: '1px solid rgba(56,189,248,0.3)',
          color: '#38bdf8',
          padding: '10px 24px',
          borderRadius: 10,
          cursor: 'pointer',
          fontSize: '0.875rem',
        }}
      >
        Try Again
      </button>
    </div>
  )
}
