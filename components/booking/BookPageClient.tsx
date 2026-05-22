'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useFlightStore } from '@/stores/flightStore'
import { useUserStore } from '@/stores/userStore'
import { ArrowLeft, User, Globe, Calendar, CreditCard, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

export function BookPageClient() {
  const router = useRouter()
  const { selectedFlight, selectedSeat, passengerForm, setPassengerForm, resetBooking } = useFlightStore()
  const { user } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!selectedFlight || !selectedSeat) {
    return (
      <div style={{ maxWidth: 600, margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>No flight or seat selected.</p>
        <button onClick={() => router.push('/')} style={{
          marginTop: '1rem', background: '#38bdf8', border: 'none',
          borderRadius: 8, color: '#0f172a', padding: '10px 20px', cursor: 'pointer',
        }}>Go Home</button>
      </div>
    )
  }

  if (!user) {
    router.push(`/auth/login?redirect=/flights/${selectedFlight.id}/book`)
    return null
  }

  const totalPrice = selectedFlight.base_price + selectedSeat.extra_fee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // 1. Reserve seat via RPC (prevents double-booking)
      const { data: reserved, error: rpcError } = await supabase
        .rpc('reserve_seat', { p_seat_id: selectedSeat.id, p_flight_id: selectedFlight.id })

      if (rpcError) throw new Error(rpcError.message)
      if (!reserved) throw new Error('Sorry, that seat was just taken. Please select another.')

      // 2. Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          flight_id: selectedFlight.id,
          seat_id: selectedSeat.id,
          total_price: totalPrice,
        })
        .select()
        .single()

      if (bookingError) throw new Error(bookingError.message)

      // 3. Create passenger
      const { error: passengerError } = await supabase
        .from('passengers')
        .insert({
          booking_id: booking.id,
          full_name: passengerForm.full_name,
          passport_no: passengerForm.passport_no,
          nationality: passengerForm.nationality,
          dob: passengerForm.dob,
        })

      if (passengerError) throw new Error(passengerError.message)

      resetBooking()
      router.push(`/bookings/${booking.id}?pnr=${booking.pnr_code}&new=1`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(56,189,248,0.15)',
    borderRadius: 10,
    color: '#f1f5f9',
    padding: '12px 14px',
    fontSize: '0.9rem',
    outline: 'none',
  }

  const labelStyle = {
    display: 'block' as const,
    fontSize: '0.75rem',
    color: '#64748b',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <button onClick={() => router.back()} style={{
        background: 'none', border: 'none', color: '#64748b',
        display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
        fontSize: '0.875rem', marginBottom: '1.5rem', padding: 0,
      }}>
        <ArrowLeft size={16} /> Back to seat selection
      </button>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Passenger Details</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.875rem' }}>
        Please enter accurate details as they appear on your passport.
      </p>

      {/* Booking summary */}
      <div className="glass" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: 2 }}>FLIGHT</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{selectedFlight.flight_no}</div>
            <div style={{ color: '#94a3b8' }}>{selectedFlight.origin} → {selectedFlight.destination}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: 2 }}>DEPARTURE</div>
            <div style={{ fontWeight: 600 }}>{format(new Date(selectedFlight.departs_at), 'EEE, dd MMM yyyy')}</div>
            <div style={{ color: '#94a3b8' }}>{format(new Date(selectedFlight.departs_at), 'HH:mm')}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: 2 }}>SEAT</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{selectedSeat.seat_number}</div>
            <div style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{selectedSeat.class} class</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: 2 }}>TOTAL FARE</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, color: '#f59e0b', fontSize: '1.1rem' }}>
              ₹{totalPrice.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '1rem',
          display: 'flex', alignItems: 'flex-start', gap: 8,
          color: '#ef4444', marginBottom: '1.5rem', fontSize: '0.875rem',
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={16} color="#38bdf8" />Passenger Information
          </h2>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Full Name (as on passport)</label>
              <input
                type="text"
                style={inputStyle}
                value={passengerForm.full_name}
                onChange={e => setPassengerForm({ full_name: e.target.value })}
                placeholder="John Doe"
                required
                minLength={3}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>
                  <Globe size={11} style={{ display: 'inline', marginRight: 4 }} />
                  Passport Number
                </label>
                <input
                  type="text"
                  style={inputStyle}
                  value={passengerForm.passport_no}
                  onChange={e => setPassengerForm({ passport_no: e.target.value.toUpperCase() })}
                  placeholder="A1234567"
                  required
                  pattern="[A-Z0-9]{6,9}"
                  title="6-9 uppercase letters/digits"
                />
              </div>
              <div>
                <label style={labelStyle}>Nationality</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={passengerForm.nationality}
                  onChange={e => setPassengerForm({ nationality: e.target.value })}
                  placeholder="Indian"
                  required
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                <Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />
                Date of Birth
              </label>
              <input
                type="date"
                style={{ ...inputStyle, colorScheme: 'dark' }}
                value={passengerForm.dob}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={e => setPassengerForm({ dob: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? '#1e293b' : 'linear-gradient(135deg, #38bdf8, #0284c7)',
            border: 'none', borderRadius: 12,
            color: loading ? '#64748b' : 'white',
            padding: '15px',
            fontSize: '1rem', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s',
          }}
        >
          <CreditCard size={18} />
          {loading ? 'Confirming booking...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  )
}
