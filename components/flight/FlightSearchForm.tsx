'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowLeftRight, Calendar, Users } from 'lucide-react'
import { useFlightStore } from '@/stores/flightStore'
import { format } from 'date-fns'

const AIRPORTS = [
  { code: 'DEL', city: 'Delhi' },
  { code: 'BOM', city: 'Mumbai' },
  { code: 'BLR', city: 'Bangalore' },
  { code: 'HYD', city: 'Hyderabad' },
]

export function FlightSearchForm() {
  const router = useRouter()
  const { setSearchQuery } = useFlightStore()

  const [origin, setOrigin] = useState('DEL')
  const [destination, setDestination] = useState('BOM')
  const [date, setDate] = useState(format(new Date(Date.now() + 2 * 86400000), 'yyyy-MM-dd'))
  const [passengers, setPassengers] = useState(1)

  const swap = () => {
    setOrigin(destination)
    setDestination(origin)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (origin === destination) return

    const cityOrigin = AIRPORTS.find(a => a.code === origin)?.city ?? origin
    const cityDest = AIRPORTS.find(a => a.code === destination)?.city ?? destination

    setSearchQuery({ origin: cityOrigin, destination: cityDest, date, passengers })
    router.push(`/search?origin=${cityOrigin}&destination=${cityDest}&date=${date}&passengers=${passengers}`)
  }

  const selectStyle = {
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(56,189,248,0.15)',
    borderRadius: 10,
    color: '#f1f5f9',
    padding: '12px 14px',
    fontSize: '0.9rem',
    width: '100%',
    outline: 'none',
    cursor: 'pointer',
  }

  return (
    <div className="glass" style={{ padding: '2rem' }}>
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          alignItems: 'end',
        }}>
          {/* Origin */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              From
            </label>
            <select value={origin} onChange={e => setOrigin(e.target.value)} style={selectStyle}>
              {AIRPORTS.map(a => (
                <option key={a.code} value={a.code} style={{ background: '#0f172a' }}>
                  {a.code} — {a.city}
                </option>
              ))}
            </select>
          </div>

          {/* Swap button */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 2 }}>
            <button type="button" onClick={swap} style={{
              background: 'rgba(56,189,248,0.1)',
              border: '1px solid rgba(56,189,248,0.3)',
              borderRadius: '50%', width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#38bdf8', transition: 'all 0.2s',
              flexShrink: 0,
            }}>
              <ArrowLeftRight size={16} />
            </button>
          </div>

          {/* Destination */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              To
            </label>
            <select value={destination} onChange={e => setDestination(e.target.value)} style={selectStyle}>
              {AIRPORTS.map(a => (
                <option key={a.code} value={a.code} style={{ background: '#0f172a' }}>
                  {a.code} — {a.city}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />Date
            </label>
            <input
              type="date"
              value={date}
              min={format(new Date(), 'yyyy-MM-dd')}
              onChange={e => setDate(e.target.value)}
              style={{ ...selectStyle, colorScheme: 'dark' }}
              required
            />
          </div>

          {/* Passengers */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <Users size={11} style={{ display: 'inline', marginRight: 4 }} />Passengers
            </label>
            <input
              type="number"
              min={1} max={9}
              value={passengers}
              onChange={e => setPassengers(Number(e.target.value))}
              style={selectStyle}
              required
            />
          </div>

          {/* Submit */}
          <div>
            <button type="submit" style={{
              width: '100%',
              background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              padding: '13px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'opacity 0.2s',
            }}>
              <Search size={16} />
              Search
            </button>
          </div>
        </div>

        {origin === destination && (
          <p style={{ color: '#f59e0b', fontSize: '0.8rem', marginTop: '0.75rem' }}>
            Origin and destination cannot be the same.
          </p>
        )}
      </form>
    </div>
  )
}
