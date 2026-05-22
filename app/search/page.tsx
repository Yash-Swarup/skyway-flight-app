import { createClient } from '@/lib/supabase/server'
import { FlightCard } from '@/components/flight/FlightCard'
import { FlightSearchForm } from '@/components/flight/FlightSearchForm'
import { Plane } from 'lucide-react'
import type { Flight } from '@/types'

interface SearchPageProps {
  searchParams: Promise<{ origin?: string; destination?: string; date?: string; passengers?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const { origin, destination, date } = params

  let flights: Flight[] = []
  let error: string | null = null

  if (origin && destination && date) {
    const supabase = await createClient()
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data, error: dbError } = await supabase
      .from('flights')
      .select('*')
      .ilike('origin', origin)
      .ilike('destination', destination)
      .gte('departs_at', startOfDay.toISOString())
      .lte('departs_at', endOfDay.toISOString())
      .neq('status', 'cancelled')
      .order('departs_at')

    if (dbError) error = dbError.message
    else flights = data ?? []
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Search form at top */}
      <div style={{ marginBottom: '2rem' }}>
        <FlightSearchForm />
      </div>

      {/* Results header */}
      {origin && destination && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            {origin} → {destination}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            {date} · {params.passengers ?? 1} passenger{Number(params.passengers ?? 1) > 1 ? 's' : ''}
            {' · '}{flights.length} flight{flights.length !== 1 ? 's' : ''} found
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12, padding: '1rem', color: '#ef4444', marginBottom: '1rem',
        }}>
          Failed to load flights: {error}
        </div>
      )}

      {/* No results */}
      {!error && origin && destination && flights.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '4rem 1rem',
          background: 'rgba(15,23,42,0.5)', borderRadius: 16,
          border: '1px solid rgba(56,189,248,0.1)',
        }}>
          <Plane size={48} color="#334155" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No flights found</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Try a different date or route.
          </p>
        </div>
      )}

      {/* Prompt to search */}
      {!origin && !destination && (
        <div style={{
          textAlign: 'center', padding: '4rem 1rem',
          background: 'rgba(15,23,42,0.5)', borderRadius: 16,
          border: '1px solid rgba(56,189,248,0.1)',
        }}>
          <Plane size={48} color="#334155" style={{ marginBottom: '1rem' }} />
          <p style={{ color: '#64748b' }}>Enter your search above to find available flights.</p>
        </div>
      )}

      {/* Flight list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {flights.map((flight, i) => (
          <FlightCard
            key={flight.id}
            flight={flight}
            passengers={Number(params.passengers ?? 1)}
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
