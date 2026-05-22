import { FlightSearchForm } from '@/components/flight/FlightSearchForm'
import { Plane, Shield, Zap, Clock } from 'lucide-react'

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        position: 'relative',
        padding: '5rem 1.5rem 4rem',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)',
            borderRadius: 100, padding: '6px 16px', marginBottom: '1.5rem',
            fontSize: '0.8rem', color: '#38bdf8', fontWeight: 500,
          }}>
            <Plane size={14} />
            Flight Management Platform
          </div>

          <h1 style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: '1.25rem',
            letterSpacing: '-0.03em',
          }}>
            Your journey,<br />
            <span style={{
              background: 'linear-gradient(135deg, #38bdf8, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>seamlessly managed</span>
          </h1>

          <p style={{
            color: '#94a3b8', fontSize: '1.1rem', lineHeight: 1.7,
            maxWidth: 520, margin: '0 auto 3rem',
          }}>
            Search flights, pick your seat, and manage bookings — all in one elegant, real-time platform.
          </p>
        </div>
      </div>

      {/* Search Form */}
      <div style={{ maxWidth: 900, margin: '-1rem auto 4rem', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
        <FlightSearchForm />
      </div>

      {/* Features */}
      <div style={{ maxWidth: 900, margin: '0 auto 5rem', padding: '0 1.5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}>
          {[
            { icon: Zap, title: 'Live seat maps', desc: 'Real-time availability via Supabase Realtime — see updates as they happen.' },
            { icon: Shield, title: 'Secure bookings', desc: 'Row-level security and atomic seat reservation prevent double-booking.' },
            { icon: Clock, title: 'Flexible management', desc: 'Reschedule or cancel bookings anytime — with fair 2-hour departure rules.' },
            { icon: Plane, title: '4 routes, 8 flights', desc: 'DEL↔BOM and BLR↔HYD with economy, business, and first class.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass" style={{ padding: '1.5rem' }}>
              <div style={{
                width: 40, height: 40,
                background: 'rgba(56,189,248,0.1)',
                border: '1px solid rgba(56,189,248,0.2)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <Icon size={20} color="#38bdf8" />
              </div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.95rem' }}>{title}</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
