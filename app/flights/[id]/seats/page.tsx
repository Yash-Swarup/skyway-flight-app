import { SeatPageClient } from '@/components/seat/SeatPageClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SeatsPage({ params }: Props) {
  const { id } = await params
  return <SeatPageClient flightId={id} />
}
