'use client'

import type { Seat, SeatClass } from '@/types'

interface SeatMapProps {
  seats: Seat[]
  selectedId: string | null
  onSelect: (seat: Seat) => void
}

const CLASS_COLORS: Record<SeatClass, { avail: string; border: string; label: string }> = {
  first:    { avail: '#f59e0b', border: '#f59e0b60', label: 'First Class' },
  business: { avail: '#a855f7', border: '#a855f760', label: 'Business' },
  economy:  { avail: '#22c55e', border: '#22c55e60', label: 'Economy' },
}

export function SeatMap({ seats, selectedId, onSelect }: SeatMapProps) {
  if (!seats.length) return <p style={{ color: '#64748b' }}>No seats available.</p>

  // Parse seat numbers → group by row
  const rowMap = new Map<number, Seat[]>()
  for (const seat of seats) {
    const match = seat.seat_number.match(/^(\d+)([A-F])$/)
    if (!match) continue
    const row = parseInt(match[1])
    if (!rowMap.has(row)) rowMap.set(row, [])
    rowMap.get(row)!.push(seat)
  }

  const sortedRows = Array.from(rowMap.entries()).sort(([a], [b]) => a - b)

  // Detect class boundaries for section headers
  let lastClass: SeatClass | null = null

  return (
    <div style={{ overflowY: 'auto', maxHeight: '70vh', paddingRight: 4 }}>
      {/* Airplane nose */}
      <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#334155', fontSize: '0.75rem' }}>
        ✈ FRONT OF AIRCRAFT
      </div>

      {/* Column labels */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', gap: 4 }}>
        {/* Padding for row label */}
        <div style={{ width: 36 }} />
        {['A', 'B', 'C', '', 'D', 'E', 'F'].map((col, i) => (
          <div key={i} style={{
            width: col ? 38 : 20,
            textAlign: 'center',
            fontSize: '0.7rem',
            color: '#64748b',
            fontFamily: "'Space Mono', monospace",
          }}>
            {col}
          </div>
        ))}
      </div>

      {sortedRows.map(([rowNum, rowSeats]) => {
        const rowClass = rowSeats[0]?.class as SeatClass
        const showHeader = rowClass !== lastClass
        if (showHeader) lastClass = rowClass

        const sortedCols = rowSeats.sort((a, b) => a.seat_number.localeCompare(b.seat_number))

        // 6-column aircraft: A B C | D E F
        const left = sortedCols.filter(s => ['A','B','C'].includes(s.seat_number.slice(-1)))
        const right = sortedCols.filter(s => ['D','E','F'].includes(s.seat_number.slice(-1)))

        // For 4-column aircraft: A B | C D
        const is4Col = rowSeats.length <= 4
        const leftCols = is4Col ? ['A','B'] : ['A','B','C']
        const rightCols = is4Col ? ['C','D'] : ['D','E','F']

        const leftSeats = sortedCols.filter(s => leftCols.includes(s.seat_number.slice(-1)))
        const rightSeats = sortedCols.filter(s => rightCols.includes(s.seat_number.slice(-1)))

        return (
          <div key={rowNum}>
            {showHeader && (
              <div style={{
                textAlign: 'center', padding: '6px 0',
                fontSize: '0.7rem', fontWeight: 700,
                color: CLASS_COLORS[rowClass]?.avail ?? '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                borderTop: '1px dashed rgba(255,255,255,0.06)',
                borderBottom: '1px dashed rgba(255,255,255,0.06)',
                marginBottom: 4, marginTop: 8,
              }}>
                ── {CLASS_COLORS[rowClass]?.label ?? rowClass} ──
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              {/* Row number */}
              <div style={{ width: 32, textAlign: 'right', fontSize: '0.7rem', color: '#334155', fontFamily: "'Space Mono', monospace" }}>
                {rowNum}
              </div>

              {/* Left seats */}
              <div style={{ display: 'flex', gap: 4 }}>
                {leftSeats.map(seat => (
                  <SeatButton key={seat.id} seat={seat} selected={selectedId === seat.id} onSelect={onSelect} />
                ))}
              </div>

              {/* Aisle */}
              <div style={{ width: 20, textAlign: 'center', fontSize: '0.6rem', color: '#1e293b' }}>│</div>

              {/* Right seats */}
              <div style={{ display: 'flex', gap: 4 }}>
                {rightSeats.map(seat => (
                  <SeatButton key={seat.id} seat={seat} selected={selectedId === seat.id} onSelect={onSelect} />
                ))}
              </div>
            </div>
          </div>
        )
      })}

      <div style={{ textAlign: 'center', marginTop: '1rem', color: '#334155', fontSize: '0.75rem' }}>
        ✈ REAR OF AIRCRAFT
      </div>
    </div>
  )
}

function SeatButton({ seat, selected, onSelect }: { seat: Seat; selected: boolean; onSelect: (s: Seat) => void }) {
  const cls = seat.class as SeatClass
  const colors = CLASS_COLORS[cls]

  let bg = colors.avail
  let opacity = 1
  let cursor = 'pointer'
  let border = 'transparent'

  if (!seat.is_available) {
    bg = '#1e293b'
    opacity = 0.6
    cursor = 'not-allowed'
  } else if (selected) {
    bg = '#38bdf8'
    border = '#38bdf8'
  } else {
    bg = `${colors.avail}25`
    border = colors.border
  }

  const tooltip = `${seat.seat_number} · ${cls}${seat.extra_fee > 0 ? ` · +₹${seat.extra_fee}` : ''}${!seat.is_available ? ' · Occupied' : ''}`

  return (
    <button
      title={tooltip}
      onClick={() => onSelect(seat)}
      disabled={!seat.is_available}
      style={{
        width: 38, height: 38,
        borderRadius: 6,
        background: bg,
        border: `1px solid ${border}`,
        color: selected ? '#0f172a' : (seat.is_available ? colors.avail : '#334155'),
        fontSize: '0.65rem',
        fontFamily: "'Space Mono', monospace",
        fontWeight: selected ? 700 : 500,
        cursor,
        opacity,
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {seat.seat_number}
    </button>
  )
}
