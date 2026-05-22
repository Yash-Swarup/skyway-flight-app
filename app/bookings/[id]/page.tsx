import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { BookingDetailClient } from '@/components/booking/BookingDetailClient'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ pnr?: string; new?: string }>
}

export default async function BookingDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/bookings')

  const { data: booking } = await supabase
    .from('bookings')
    .select(`*, flight:flights(*), seat:seats(*), passengers(*)`)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!booking) notFound()

  // Fetch available flights on same route for rescheduling
  const { data: altFlights } = await supabase
    .from('flights')
    .select('*')
    .ilike('origin', booking.flight.origin)
    .ilike('destination', booking.flight.destination)
    .neq('id', booking.flight_id)
    .neq('status', 'cancelled')
    .gte('departs_at', new Date().toISOString())
    .order('departs_at')

  return (
    <BookingDetailClient
      booking={booking}
      altFlights={altFlights ?? []}
      isNew={sp.new === '1'}
    />
  )
}
