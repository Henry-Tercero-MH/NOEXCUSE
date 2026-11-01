import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { Check, CircleDot, Feather, Shell, Snowflake, Star, Table2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { fromISO, key } from '../core/dates'
import { isScheduled } from '../core/progress'
import { counts, statusOf, targetOf, valueOf } from '../core/status'
import type { Habit, ISODate } from '../core/types'
import { feedback } from '../lib/feedback'
import { COLORS, WEEK_COLORS, iconFor } from '../lib/icons'
import { useStore } from '../lib/store'
import { useProgress } from '../lib/useProgress'
import { HabitSpirals } from './HabitSpirals'
import { RadialTracker } from './RadialTracker'
import { StatusLegend } from './StatusPatterns'

// 5 escalones discretos: cada uno con la tinta (clara u oscura) que garantiza contraste ≥ 4.5:1
const heat = (p: number) => {
  const steps = [
    { max: 0.25, a: 0.1, dark: false },
    { max: 0.5, a: 0.22, dark: false },
    { max: 0.75, a: 0.38, dark: false },
    { max: 0.9, a: 0.6, dark: true },
    { max: 1, a: 0.85, dark: true },
  ]
  const st = steps.find((x) => p <= x.max)!
  return { bg: `rgb(46 230 200 / ${st.a})`, fg: st.dark ? '#0B0E1A' : '#E8ECF8' }
}

type View = 'circle' | 'spiral' | 'grid'

/** Seguimiento del mes (Circular / Por hábito / Tabla). Se usa en Mes y en Hoy; la vista elegida se recuerda. */
export function MonthTracker({ days, compact = false }: { days: ISODate[]; compact?: boolean }) {
  const { today, progress } = useProgress()
  const habits = useStore((s) => s.habits)
  const completions = useStore((s) => s.completions)
  const setMark = useStore((s) => s.setMark)
  const [view, setView] = useState<View>(() => {
    try {
      const v = new URLSearchParams(location.search).get('view') ?? localStorage.getItem('ne-month-view')
      return v === 'spiral' || v === 'grid' ? v : 'circle'
    } catch {
      return 'circle'
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem('ne-month-view', view)
    } catch {
      /* sin almacenamiento */
    }
  }, [view])
  const scroller = useRef<HTMLDivElement>(null)

  const visible = habits.filter((h) => !h.archivedAt || h.archivedAt > days[0]).sort((a, b) => a.order - b.order)

  useEffect(() => {
    const el = scroller.current?.querySelector<HTMLElement>('[data-today]')
    if (el && scroller.current) scroller.current.scrollLeft = el.offsetLeft - scroller.current.clientWidth / 2
  }, [days[0], view])

  const toggleCell = (h: Habit, d: string) => {
    if (statusOf(h, completions[key(h.id, d)]) === 'full') {
      feedback.uncheck()
      setMark(h.id, d, null)
    } else {
      feedback.check(0)
      setMark(h.id, d, { value: targetOf(h) })
    }
  }

  const monthDone = days.reduce((s, d) => s + (progress.byDate[d]?.done ?? 0), 0)
  const monthSched = days.filter((d) => d <= today).reduce((s, d) => s + (progress.byDate[d]?.scheduled ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="flex rounded-lg bg-card p-0.5 text-xs font-bold" role="tablist" aria-label="Tipo de vista">
          {([['circle', 'Circular', CircleDot], ['spiral', 'Por hábito', Shell], ['grid', 'Tabla', Table2]] as const).map(([v, label, Icon]) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 ${view === v ? 'bg-teal text-bg' : 'text-muted hover:text-white'}`}>
              <Icon className="relative size-3.5" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {view === 'spiral' ? (
        <HabitSpirals days={days} habits={visible} completions={completions} byDate={progress.byDate} streak={progress.streak} today={today} onToggle={toggleCell} />
      ) : view === 'circle' ? (
        <div>
          <RadialTracker days={days} habits={visible} completions={completions} today={today} monthPct={monthSched ? monthDone / monthSched : 0} onToggle={toggleCell} />
          <div className="mt-4">
            <StatusLegend color={COLORS.teal} />
          </div>
        </div>
      ) : (
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <div ref={scroller} className="no-scrollbar overflow-x-auto">
          <table className="border-separate border-spacing-0 text-xs">
            <thead>
              {/* % diario */}
              <tr>
                <th className="sticky left-0 z-20 bg-card px-3 pt-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted">% del día</th>
                {days.map((d) => {
                  const info = progress.byDate[d]
                  const show = info && d <= today && info.scheduled > 0
                  return (
                    <th key={d} className="px-[3px] pt-3">
                      <div
                        className="tabular grid h-6 w-8 place-items-center rounded-md text-[9px] font-bold"
                        style={{ background: show ? heat(info.pct).bg : 'transparent', color: show ? heat(info.pct).fg : '#8A93B0' }}
                        title={show ? `${Math.round(info.pct * 100)}%` : undefined}
                      >
                        {info?.frozen ? <Snowflake className="size-3 text-ice" /> : show ? `${Math.round(info.pct * 100)}` : ''}
                      </div>
                    </th>
                  )
                })}
                <th />
              </tr>
              {/* días */}
              <tr>
                <th className="sticky left-0 z-20 bg-card px-3 pb-2 pt-1 text-left text-[10px] font-bold uppercase tracking-wider text-muted">Hábito</th>
                {days.map((d, i) => {
                  const wc = WEEK_COLORS[Math.floor(i / 7)]
                  const isToday = d === today
                  return (
                    <th key={d} className="px-[3px] pb-2 pt-1" {...(isToday ? { 'data-today': true } : {})}>
                      <div
                        className="flex w-8 flex-col items-center rounded-md py-1"
                        style={{ background: isToday ? '#2EE6C8' : `${wc}14`, color: isToday ? '#0B0E1A' : wc }}
                      >
                        <span className="text-[9px] font-semibold uppercase opacity-80">{format(fromISO(d), 'EEEEEE', { locale: es })}</span>
                        <span className="tabular text-[11px] font-extrabold">{i + 1}</span>
                      </div>
                    </th>
                  )
                })}
                <th className="px-3 pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted">Total</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((h) => {
                const Icon = iconFor(h.icon)
                const sched = days.filter((d) => d <= today && isScheduled(h, d))
                const total = sched.filter((d) => counts(statusOf(h, completions[key(h.id, d)]))).length
                return (
                  <tr key={h.id}>
                    <td className="sticky left-0 z-10 border-t border-line/60 bg-card px-3 py-1.5">
                      <div className="flex w-36 items-center gap-2 sm:w-48">
                        <Icon className="size-4 shrink-0" style={{ color: COLORS[h.color] }} />
                        <span className="truncate text-[13px] font-medium">{h.name}</span>
                      </div>
                    </td>
                    {days.map((d, i) => {
                      const wc = WEEK_COLORS[Math.floor(i / 7)]
                      const c = completions[key(h.id, d)]
                      const st = statusOf(h, c)
                      const done = st === 'full'
                      const applies = isScheduled(h, d)
                      const future = d > today
                      const label = { full: ', completado', min: ', versión mínima', partial: `, ${valueOf(h, c)} de ${targetOf(h)}`, none: '' }[st]
                      return (
                        <td key={d} className="border-t border-line/60 px-[3px] py-1.5">
                          {applies ? (
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              disabled={future}
                              onClick={() => toggleCell(h, d)}
                              aria-label={`${h.name}, ${d}${label}`}
                              title={label ? label.slice(2) : undefined}
                              className="relative grid size-8 place-items-center overflow-hidden rounded-md border transition-colors disabled:cursor-default disabled:opacity-50"
                              style={{
                                background: done ? wc : st === 'min' ? `${wc}30` : 'transparent',
                                borderColor: st !== 'none' ? wc : d === today ? '#2EE6C8' : '#2A3255',
                                boxShadow: done ? `0 0 10px -3px ${wc}` : undefined,
                              }}
                            >
                              {st === 'partial' && <span className="absolute inset-x-0 bottom-0" style={{ height: `${(valueOf(h, c) / targetOf(h)) * 100}%`, background: `${wc}40` }} />}
                              {done && <Check className="size-4 text-bg" strokeWidth={3.5} />}
                              {st === 'min' && <Feather className="size-3.5" style={{ color: wc }} />}
                            </motion.button>
                          ) : (
                            <div className="grid size-8 place-items-center text-line">·</div>
                          )}
                        </td>
                      )
                    })}
                    <td className="tabular border-t border-line/60 px-3 text-right text-[13px] font-bold">
                      {total}
                      <span className="text-muted">/{sched.length}</span>
                    </td>
                  </tr>
                )
              })}
              {/* días perfectos */}
              <tr>
                <td className="sticky left-0 z-10 border-t border-line bg-card px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gold">Día perfecto</td>
                {days.map((d) => (
                  <td key={d} className="border-t border-line px-[3px] py-2">
                    <div className="grid w-8 place-items-center">
                      {progress.byDate[d]?.perfect && <Star className="size-4 text-gold drop-shadow-[0_0_6px_#FFD600]" fill="currentColor" />}
                    </div>
                  </td>
                ))}
                <td className="border-t border-line" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      )}
      {!compact && (
        <p className="text-center text-xs text-muted">{view === 'spiral' ? 'Cada vuelta de la espiral es una semana y cada gajo un día; los días de la semana siempre quedan en la misma posición. Toca un gajo para marcarlo.' : view === 'circle' ? 'Cada anillo es un hábito y cada gajo un día. Toca un gajo para marcarlo; pasa el cursor para ver el detalle.' : 'Toca cualquier casilla para marcar días anteriores. La pluma indica versión mínima; el copo de nieve, un congelador de racha usado.'}</p>
      )}
    </div>
  )
}
