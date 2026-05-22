'use client'

import { useRouter } from 'next/navigation'
import { Plane, Clock, ArrowRight } from 'lucide-react'
import { format, differenceInMinutes } from 'date-fns'
import { useFlightStore } from '@/stores/flightStore'
import type { Flight } from '@/types'

interface FlightCardProps {
  flight: Flight
  passengers: number
  style?: React.CSSProperties
}

export function FlightCard({ flight, passengers, style }: FlightCardProps) {
  const router = useRouter()
  const { setSelectedFlight, setCurrentStep } = useFlightStore()

  const departs = new Date(flight.departs_at)
  const arrives = new Date(flight.arrives_at)
  const durationMins = differenceInMinutes(arrives, departs)
  const hours = Math.floor(durationMins / 60)
  const mins = durationMins % 60

  const handleSelect = () => {
    setSelectedFlight(flight)
    setCurrentStep('seats')
    router.push(`/flights/${flight.id}/seats`)
  }

  const statusColor = {
    scheduled: '#22c55e',
    boarding: '#f59e0b',
    departed: '#38bdf8',
    landed: '#64748b',
    cancelled: '#ef4444',
  }[flight.status] ?? '#64748b'

  return (
    <div className="glass fade-up" style={{
      padding: '1.5rem',
      cursor: 'pointer',
      transition: 'border-color 0.2s, transform 0.2s',
      ...style,
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(56,189,248,0.1)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Flight info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1, minWidth: 220 }}>
          {/* Airline logo placeholder */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(2,132,199,0.1))',
            border: '1px solid rgba(56,189,248,0.2)',
            borderRadius: 10, padding: '10px 14px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <Plane size={20} color="#38bdf8" />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: '#38bdf8', marginTop: 4 }}>
              {flight.flight_no}
            </span>
          </div>

          {/* Route */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '1.4rem', fontWeight: 700 }}>
                {format(departs, 'HH:mm')}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                {format(departs, 'dd MMM')}
              </div>
              <div style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 500 }}>
                {flight.origin}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ color: '#64748b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} />{hours}h {mins}m
              </div>
              <div style={{ position: 'relative', width: 80, height: 1, background: 'rgba(56,189,248,0.3)' }}>
                <div style={{
                  position: 'absolute', right: -4, top: -7,
                }}>
                  <ArrowRight size={14} color="#38bdf8" />
                </div>
              </div>
              <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{flight.aircraft_type}</div>
            </div>

            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '1.4rem', fontWeight: 700 }}>
                {format(arrives, 'HH:mm')}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                {format(arrives, 'dd MMM')}
              </div>
              <div style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 500 }}>
                {flight.destination}
              </div>
            </div>
          </div>
        </div>

        {/* Price + status + CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: `${statusColor}18`, border: `1px solid ${statusColor}40`,
            borderRadius: 100, padding: '3px 10px',
            fontSize: '0.72rem', color: statusColor, textTransform: 'capitalize',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
            {flight.status}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>from</div>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '1.5rem', fontWeight: 700,
              color: '#f59e0b',
            }}>
              ₹{(flight.base_price * passengers).toLocaleString('en-IN')}
            </div>
            {passengers > 1 && (
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>₹{flight.base_price.toLocaleString('en-IN')}/person</div>
            )}
          </div>

          <button onClick={handleSelect} style={{
            background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
            border: 'none', borderRadius: 8,
            color: 'white', padding: '9px 20px',
            fontSize: '0.875rem', fontWeight: 600,
            cursor: 'pointer', transition: 'opacity 0.2s',
          }}>
            Select Seat →
          </button>
        </div>
      </div>
    </div>
  )
}
