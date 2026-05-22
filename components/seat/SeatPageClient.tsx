'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useFlightStore } from '@/stores/flightStore'
import { SeatMap } from '@/components/seat/SeatMap'
import { Plane, ArrowLeft, Info } from 'lucide-react'
import { format } from 'date-fns'
import type { Seat } from '@/types'

interface SeatPageClientProps {
  flightId: string
}

export function SeatPageClient({ flightId }: SeatPageClientProps) {
  const router = useRouter()
  const { selectedFlight, setSelectedFlight, setSelectedSeat, setCurrentStep } = useFlightStore()
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const loadFlight = useCallback(async () => {
    const supabase = createClient()
    if (!selectedFlight || selectedFlight.id !== flightId) {
      const { data } = await supabase.from('flights').select('*').eq('id', flightId).single()
      if (data) setSelectedFlight(data)
    }
  }, [flightId, selectedFlight, setSelectedFlight])

  const loadSeats = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('seats')
      .select('*')
      .eq('flight_id', flightId)
      .order('seat_number')
    setSeats(data ?? [])
    setLoading(false)
  }, [flightId])

  useEffect(() => {
    loadFlight()
    loadSeats()

    // Supabase Realtime subscription
    const supabase = createClient()
    const channel = supabase
      .channel(`seats:flight_${flightId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'seats', filter: `flight_id=eq.${flightId}` },
        (payload) => {
          setSeats(prev => prev.map(s => s.id === payload.new.id ? { ...s, ...payload.new } : s))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [flightId, loadFlight, loadSeats])

  const handleSeatSelect = (seat: Seat) => {
    if (!seat.is_available) return
    setSelectedId(prev => prev === seat.id ? null : seat.id)
    // Optimistic selection
    setSelectedSeat(selectedId === seat.id ? null : seat)
  }

  const handleContinue = () => {
    if (!selectedId) return
    const seat = seats.find(s => s.id === selectedId)
    if (seat) {
      setSelectedSeat(seat)
      setCurrentStep('passengers')
      router.push(`/flights/${flightId}/book`)
    }
  }

  const selectedSeat = seats.find(s => s.id === selectedId)
  const totalPrice = selectedFlight
    ? selectedFlight.base_price + (selectedSeat?.extra_fee ?? 0)
    : 0

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Back button */}
      <button onClick={() => router.back()} style={{
        background: 'none', border: 'none', color: '#64748b',
        display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
        fontSize: '0.875rem', marginBottom: '1.5rem', padding: 0,
      }}>
        <ArrowLeft size={16} /> Back to results
      </button>

      {/* Flight summary */}
      {selectedFlight && (
        <div className="glass" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Plane size={20} color="#38bdf8" />
            <div>
              <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{selectedFlight.flight_no}</span>
              <span style={{ color: '#64748b', marginLeft: 12, fontSize: '0.875rem' }}>
                {selectedFlight.origin} → {selectedFlight.destination}
              </span>
            </div>
            <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.875rem' }}>
              {format(new Date(selectedFlight.departs_at), 'EEE, dd MMM · HH:mm')}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr min(300px, 100%)', gap: '2rem', alignItems: 'start' }}>
        {/* Seat map */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Select Your Seat</h2>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(56,189,248,0.1)', borderRadius: 100,
              padding: '3px 10px', fontSize: '0.72rem', color: '#38bdf8',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
              Live availability
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shimmer" style={{ height: 44, borderRadius: 8 }} />
              ))}
            </div>
          ) : (
            <SeatMap seats={seats} selectedId={selectedId} onSelect={handleSeatSelect} />
          )}
        </div>

        {/* Selection panel */}
        <div style={{ position: 'sticky', top: 84 }}>
          {/* Legend */}
          <div className="glass" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: '#94a3b8' }}>
              <Info size={14} style={{ display: 'inline', marginRight: 6 }} />
              Legend
            </h3>
            {[
              { color: '#22c55e', label: 'Available' },
              { color: '#38bdf8', label: 'Selected (you)' },
              { color: '#334155', label: 'Occupied' },
              { color: '#f59e0b', label: 'First Class' },
              { color: '#a855f7', label: 'Business' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Selected seat info */}
          {selectedSeat ? (
            <div className="glass" style={{ padding: '1.25rem', marginBottom: '1rem', border: '1px solid rgba(56,189,248,0.3)' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Selected seat
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '2rem', fontWeight: 700, color: '#38bdf8' }}>
                {selectedSeat.seat_number}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'capitalize', marginBottom: '0.75rem' }}>
                {selectedSeat.class} class
                {selectedSeat.extra_fee > 0 && ` · +₹${selectedSeat.extra_fee.toLocaleString('en-IN')}`}
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Base fare</span>
                  <span style={{ fontSize: '0.8rem' }}>₹{selectedFlight?.base_price.toLocaleString('en-IN')}</span>
                </div>
                {selectedSeat.extra_fee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Seat upgrade</span>
                    <span style={{ fontSize: '0.8rem' }}>₹{selectedSeat.extra_fee.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontWeight: 600 }}>Total</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, color: '#f59e0b' }}>
                    ₹{totalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              padding: '1.25rem', borderRadius: 12,
              border: '1px dashed rgba(56,189,248,0.2)',
              textAlign: 'center', color: '#64748b',
              fontSize: '0.85rem', marginBottom: '1rem',
            }}>
              Click a seat to select it
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={!selectedId}
            style={{
              width: '100%',
              background: selectedId ? 'linear-gradient(135deg, #38bdf8, #0284c7)' : '#1e293b',
              border: 'none', borderRadius: 10,
              color: selectedId ? 'white' : '#64748b',
              padding: '13px',
              fontSize: '0.9rem', fontWeight: 600,
              cursor: selectedId ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            Continue to Passenger Details →
          </button>
        </div>
      </div>
    </div>
  )
}
