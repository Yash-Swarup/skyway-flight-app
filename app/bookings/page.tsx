'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { format } from 'date-fns'
import { Plane, CheckCircle, RefreshCw, XCircle, ChevronRight, BookOpen } from 'lucide-react'
import type { Booking } from '@/types'

const STATUS_CONFIG = {
  confirmed:   { icon: CheckCircle, color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)' },
  rescheduled: { icon: RefreshCw,   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  cancelled:   { icon: XCircle,     color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)' },
}

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login?redirect=/bookings'); return }

      const { data } = await supabase
        .from('bookings')
        .select('*, flight:flights(*), seat:seats(*), passengers(*)')
        .eq('user_id', user.id)
        .order('booked_at', { ascending: false })

      setBookings(data ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 100, borderRadius: 12, marginBottom: '1rem' }} />)}
    </div>
  )

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
        <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10, padding: 10 }}>
          <BookOpen size={20} color="#38bdf8" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>My Bookings</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {!bookings.length ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'rgba(15,23,42,0.5)', borderRadius: 16, border: '1px solid rgba(56,189,248,0.1)' }}>
          <Plane size={48} color="#334155" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No bookings yet</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Search for flights and make your first booking.</p>
          <Link href="/" style={{ background: 'linear-gradient(135deg, #38bdf8, #0284c7)', color: 'white', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
            Search Flights
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bookings.map(booking => {
            const cfg = STATUS_CONFIG[booking.status]
            const StatusIcon = cfg.icon
            const flight = booking.flight
            const seat = booking.seat
            const passenger = booking.passengers?.[0]

            return (
              <Link key={booking.id} href={`/bookings/${booking.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="glass" style={{ padding: '1.5rem', transition: 'border-color 0.2s, transform 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.1)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 10px', borderRadius: 6 }}>
                        PNR: {booking.pnr_code}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 100, padding: '3px 10px', fontSize: '0.72rem', color: cfg.color, textTransform: 'capitalize' }}>
                        <StatusIcon size={11} />{booking.status}
                      </span>
                    </div>
                    {flight && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: '1.1rem' }}>{flight.origin} → {flight.destination}</div>
                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{format(new Date(flight.departs_at), 'EEE, dd MMM yyyy · HH:mm')}</div>
                        {seat && <span style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', color: '#38bdf8' }}>Seat {seat.seat_number}</span>}
                      </div>
                    )}
                    {passenger && <div style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.8rem' }}>{passenger.full_name}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, color: '#f59e0b' }}>₹{booking.total_price.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{format(new Date(booking.booked_at), 'dd MMM yyyy')}</div>
                    </div>
                    <ChevronRight size={18} color="#334155" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
