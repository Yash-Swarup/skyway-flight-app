'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format, differenceInHours } from 'date-fns'
import {
  Plane, CheckCircle, RefreshCw, XCircle,
  AlertTriangle, ArrowLeft, Clock, CreditCard, User
} from 'lucide-react'
import type { Booking, Flight } from '@/types'

interface Props {
  booking: Booking & { flight: Flight }
  altFlights: Flight[]
  isNew: boolean
}

export function BookingDetailClient({ booking, altFlights, isNew }: Props) {
  const router = useRouter()
  const [showReschedule, setShowReschedule] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [selectedAlt, setSelectedAlt] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localBooking, setLocalBooking] = useState(booking)

  const flight = localBooking.flight
  const seat = localBooking.seat
  const passenger = localBooking.passengers?.[0]
  const hoursUntilDeparture = differenceInHours(new Date(flight.departs_at), new Date())
  const canCancel = localBooking.status !== 'cancelled' && hoursUntilDeparture >= 2
  const canReschedule = localBooking.status !== 'cancelled'

  const handleReschedule = async () => {
    if (!selectedAlt) return
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const newFlight = altFlights.find(f => f.id === selectedAlt)!
      const fee = Math.max(0, newFlight.base_price - flight.base_price)

      // Insert reschedule record
      const { error: rsErr } = await supabase.from('reschedules').insert({
        booking_id: localBooking.id,
        old_flight_id: localBooking.flight_id,
        new_flight_id: selectedAlt,
        fee_charged: fee,
      })
      if (rsErr) throw new Error(rsErr.message)

      // Update booking
      const { data: updated, error: upErr } = await supabase
        .from('bookings')
        .update({
          flight_id: selectedAlt,
          status: 'rescheduled',
          total_price: localBooking.total_price + fee,
        })
        .eq('id', localBooking.id)
        .select('*, flight:flights(*), seat:seats(*), passengers(*)')
        .single()
      if (upErr) throw new Error(upErr.message)

      setLocalBooking(updated)
      setShowReschedule(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reschedule failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: rpcErr } = await supabase.rpc('cancel_booking', { p_booking_id: localBooking.id })
      if (rpcErr) throw new Error(rpcErr.message)
      if (!data) throw new Error('Cancellation failed.')

      setLocalBooking(prev => ({ ...prev, status: 'cancelled' }))
      setShowCancelConfirm(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cancellation failed')
    } finally {
      setLoading(false)
    }
  }

  const STATUS_CONFIG = {
    confirmed:   { icon: CheckCircle,  color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)',  label: 'Confirmed' },
    rescheduled: { icon: RefreshCw,    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'Rescheduled' },
    cancelled:   { icon: XCircle,      color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  label: 'Cancelled' },
  }
  const cfg = STATUS_CONFIG[localBooking.status]
  const StatusIcon = cfg.icon

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <button onClick={() => router.push('/bookings')} style={{
        background: 'none', border: 'none', color: '#64748b',
        display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
        fontSize: '0.875rem', marginBottom: '1.5rem', padding: 0,
      }}>
        <ArrowLeft size={16} /> Back to bookings
      </button>

      {/* Success banner for new bookings */}
      {isNew && (
        <div style={{
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 12, padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: 10,
          color: '#22c55e', marginBottom: '1.5rem', fontSize: '0.9rem',
        }}>
          <CheckCircle size={18} />
          Booking confirmed! Your PNR is <strong style={{ fontFamily: "'Space Mono', monospace" }}>{localBooking.pnr_code}</strong>
        </div>
      )}

      {/* PNR Card */}
      <div className="glass" style={{ padding: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          Booking Reference
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '2.5rem', fontWeight: 700, color: '#38bdf8',
          letterSpacing: '0.15em', marginBottom: 12,
        }}>
          {localBooking.pnr_code}
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          borderRadius: 100, padding: '5px 16px',
          fontSize: '0.8rem', color: cfg.color,
        }}>
          <StatusIcon size={13} />
          {cfg.label}
        </div>
      </div>

      {/* Flight details */}
      <div className="glass" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plane size={14} />Flight Details
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
          <Detail label="Flight" value={flight.flight_no} mono />
          <Detail label="Route" value={`${flight.origin} → ${flight.destination}`} />
          <Detail label="Departure" value={format(new Date(flight.departs_at), 'EEE dd MMM · HH:mm')} />
          <Detail label="Arrival" value={format(new Date(flight.arrives_at), 'EEE dd MMM · HH:mm')} />
          <Detail label="Aircraft" value={flight.aircraft_type} />
          {seat && <Detail label="Seat" value={`${seat.seat_number} (${seat.class})`} mono />}
        </div>
      </div>

      {/* Passenger */}
      {passenger && (
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={14} />Passenger
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
            <Detail label="Name" value={passenger.full_name} />
            <Detail label="Nationality" value={passenger.nationality} />
            <Detail label="Passport" value={`••• ${passenger.passport_no.slice(-4)}`} mono />
            <Detail label="DOB" value={format(new Date(passenger.dob), 'dd MMM yyyy')} />
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <CreditCard size={14} />Pricing
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700 }}>
          <span>Total Paid</span>
          <span style={{ fontFamily: "'Space Mono', monospace", color: '#f59e0b' }}>
            ₹{localBooking.total_price.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '1rem',
          display: 'flex', alignItems: 'center', gap: 8,
          color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem',
        }}>
          <AlertTriangle size={16} />{error}
        </div>
      )}

      {/* Actions */}
      {localBooking.status !== 'cancelled' && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {canReschedule && (
            <button onClick={() => setShowReschedule(true)} style={{
              flex: 1, minWidth: 160,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 10, color: '#f59e0b',
              padding: '12px',
              fontSize: '0.875rem', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <RefreshCw size={15} />Reschedule
            </button>
          )}
          {canCancel ? (
            <button onClick={() => setShowCancelConfirm(true)} style={{
              flex: 1, minWidth: 160,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, color: '#ef4444',
              padding: '12px',
              fontSize: '0.875rem', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <XCircle size={15} />Cancel Booking
            </button>
          ) : hoursUntilDeparture < 2 && (localBooking.status as string) !== 'cancelled' && (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 6,
              color: '#64748b', fontSize: '0.8rem', padding: '12px',
              border: '1px dashed rgba(100,116,139,0.3)', borderRadius: 10,
            }}>
              <Clock size={14} />Cancellation not available within 2hrs of departure
            </div>
          )}
        </div>
      )}

      {/* Reschedule Modal */}
      {showReschedule && (
        <Modal title="Reschedule Flight" onClose={() => setShowReschedule(false)}>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Select an alternative flight on the same route.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {altFlights.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No alternative flights available.</p>
            ) : altFlights.map(f => {
              const fee = Math.max(0, f.base_price - flight.base_price)
              return (
                <label key={f.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px',
                  background: selectedAlt === f.id ? 'rgba(56,189,248,0.1)' : 'rgba(15,23,42,0.5)',
                  border: `1px solid ${selectedAlt === f.id ? 'rgba(56,189,248,0.4)' : 'rgba(56,189,248,0.1)'}`,
                  borderRadius: 10, cursor: 'pointer',
                }}>
                  <input type="radio" name="alt" value={f.id} checked={selectedAlt === f.id}
                    onChange={() => setSelectedAlt(f.id)}
                    style={{ accentColor: '#38bdf8' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: '0.875rem' }}>{f.flight_no}</div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {format(new Date(f.departs_at), 'EEE dd MMM · HH:mm')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: fee > 0 ? '#f59e0b' : '#22c55e', fontSize: '0.8rem', fontWeight: 600 }}>
                      {fee > 0 ? `+₹${fee.toLocaleString('en-IN')}` : 'No extra charge'}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>₹{f.base_price.toLocaleString('en-IN')}</div>
                  </div>
                </label>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setShowReschedule(false)} style={{
              flex: 1, background: 'none', border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: 8, color: '#94a3b8', padding: '10px', cursor: 'pointer',
            }}>Cancel</button>
            <button onClick={handleReschedule} disabled={!selectedAlt || loading} style={{
              flex: 2,
              background: selectedAlt && !loading ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#1e293b',
              border: 'none', borderRadius: 8,
              color: selectedAlt && !loading ? 'white' : '#64748b',
              padding: '10px', fontWeight: 600,
              cursor: selectedAlt && !loading ? 'pointer' : 'not-allowed',
            }}>
              {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          </div>
        </Modal>
      )}

      {/* Cancel confirm modal */}
      {showCancelConfirm && (
        <Modal title="Cancel Booking" onClose={() => setShowCancelConfirm(false)}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '1rem', marginBottom: '1.25rem',
            color: '#ef4444', fontSize: '0.875rem',
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            This action is irreversible. Your booking for <strong>{flight.flight_no}</strong> departing {format(new Date(flight.departs_at), 'dd MMM · HH:mm')} will be cancelled.
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setShowCancelConfirm(false)} style={{
              flex: 1, background: 'none', border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: 8, color: '#94a3b8', padding: '10px', cursor: 'pointer',
            }}>Keep Booking</button>
            <button onClick={handleCancel} disabled={loading} style={{
              flex: 2,
              background: loading ? '#1e293b' : 'linear-gradient(135deg, #ef4444, #dc2626)',
              border: 'none', borderRadius: 8,
              color: loading ? '#64748b' : 'white',
              padding: '10px', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Cancelling...' : 'Yes, Cancel Booking'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: mono ? "'Space Mono', monospace" : undefined, fontWeight: 500 }}>{value}</div>
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(10,14,26,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{
        padding: '2rem', maxWidth: 480, width: '100%', borderRadius: 16,
        border: '1px solid rgba(56,189,248,0.2)',
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>{title}</h3>
        {children}
      </div>
    </div>
  )
}
