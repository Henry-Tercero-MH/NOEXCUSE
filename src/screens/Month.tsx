import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { eachDay, toISO } from '../core/dates'
import { MonthTracker } from '../components/MonthTracker'
import { useProgress } from '../lib/useProgress'

export function Month() {
  const { today, progress } = useProgress()
  const [cursor, setCursor] = useState(() => {
    const m = new URLSearchParams(location.search).get('m') // p. ej. ?m=2026-10
    return startOfMonth(m && /^\d{4}-\d{2}$/.test(m) ? new Date(m + '-01T00:00') : new Date())
  })

  const days = eachDay(toISO(startOfMonth(cursor)), toISO(endOfMonth(cursor)))
  const isCurrent = days.includes(today)
  const monthDone = days.reduce((s, d) => s + (progress.byDate[d]?.done ?? 0), 0)
  const monthSched = days.filter((d) => d <= today).reduce((s, d) => s + (progress.byDate[d]?.scheduled ?? 0), 0)

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <button onClick={() => setCursor((c) => addMonths(c, -1))} className="grid size-8 place-items-center rounded-lg bg-card text-muted hover:text-white" aria-label="Mes anterior">
          <ChevronLeft className="size-4" />
        </button>
        <div className="text-center">
          <h1 className="bg-gradient-to-b from-[#FFE55C] to-[#E0A800] bg-clip-text text-xl font-black uppercase tracking-wider text-transparent">
            {format(cursor, 'MMMM yyyy', { locale: es })}
          </h1>
          <p className="text-xs font-medium text-muted">Seguimiento de hábitos</p>
        </div>
        <button
          onClick={() => setCursor((c) => addMonths(c, 1))}
          disabled={isCurrent}
          className="grid size-8 place-items-center rounded-lg bg-card text-muted hover:text-white disabled:opacity-50"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="size-4" />
        </button>
      </header>

      <div className="grid grid-cols-3 divide-x divide-line rounded-xl border border-line bg-card text-center">
        <Kpi label="Completados" value={monthDone} color="#2EE66B" />
        <Kpi label="Cumplimiento" value={`${monthSched ? Math.round((monthDone / monthSched) * 100) : 0}%`} color="#2EE6C8" />
        <Kpi label="Días perfectos" value={days.filter((d) => progress.byDate[d]?.perfect).length} color="#FFD600" />
      </div>

      <MonthTracker key={days[0]} days={days} />
    </div>
  )
}

function Kpi({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-center gap-x-1.5 px-2 py-1.5">
      <span className="tabular text-sm font-extrabold" style={{ color }}>
        {value}
      </span>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  )
}
