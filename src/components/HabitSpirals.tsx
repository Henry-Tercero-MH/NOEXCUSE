import { subDays } from 'date-fns'
import { motion } from 'framer-motion'
import { CalendarCheck, Flame, Gauge, Star, TrendingDown, TrendingUp } from 'lucide-react'
import { useId } from 'react'
import { fromISO, key, toISO } from '../core/dates'
import { isScheduled } from '../core/progress'
import { counts, statusOf } from '../core/status'
import type { CompletionMap, DayInfo, Habit, ISODate } from '../core/types'
import { COLORS, iconFor } from '../lib/icons'
import { FUTURE_STYLE, StatusDefs, StatusLegend, statusStyle, useA11yPalette, type CellStyle } from './StatusPatterns'

interface Props {
  days: ISODate[]
  habits: Habit[]
  completions: CompletionMap
  byDate: Record<ISODate, DayInfo>
  streak: number
  today: ISODate
  onToggle: (h: Habit, d: ISODate) => void
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
const weekday = (d: ISODate) => (fromISO(d).getDay() + 6) % 7 // lunes = 0

// ---------- Geometría de la espiral ----------
// Espiral de Arquímedes: 7 gajos por vuelta (una vuelta = una semana). El radio crece
// de forma continua, así que las semanas forman una sola espiral y cada día de la
// semana queda siempre en el mismo ángulo.
const SIZE = 220
const C = SIZE / 2
const R0 = 24
const W = 10.6
const STEP = (2 * Math.PI) / 7
const GAP = 0.035

const radius = (p: number) => R0 + (p / 7) * W
const xy = (r: number, a: number) => [C + r * Math.sin(a), C - r * Math.cos(a)] as const
const pt = (r: number, a: number) => xy(r, a).map((v) => v.toFixed(2)).join(',')

function spiralSegment(p: number) {
  const outer: string[] = []
  const inner: string[] = []
  const N = 8
  for (let i = 0; i <= N; i++) {
    const q = p + GAP + ((1 - 2 * GAP) * i) / N
    outer.push(pt(radius(q) + W * 0.88, q * STEP))
    inner.unshift(pt(radius(q), q * STEP))
  }
  return `M${outer.join(' L')} L${inner.join(' L')} Z`
}

interface Cell {
  style: CellStyle
  dark: boolean // número del día en tinta oscura (sobre relleno claro)
  title: string
  star?: boolean // día perfecto: estrella además del color
  onClick?: () => void
}

function Spiral({ days, today, cell, center, sub, alertDay, label, delay = 0, numbers = false, patternColors = [] }: {
  days: ISODate[]
  today: ISODate
  cell: (d: ISODate, pid: string) => Cell
  center: string
  sub: string
  alertDay?: number
  label: string
  delay?: number
  numbers?: boolean
  patternColors?: string[]
}) {
  const offset = weekday(days[0])
  const pid = useId()
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto block w-full" role="group" aria-label={label}>
      <StatusDefs id={pid} colors={patternColors} scale={0.7} />
      {WEEKDAYS.map((l, w) => {
        const [x, y] = xy(102, (w + 0.5) * STEP)
        const alert = alertDay === w
        return (
          <g key={l} aria-hidden>
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={800} fill={alert ? '#FF6B5B' : '#A3ABC8'}>
              {l}
            </text>
            {/* el día flojo también se subraya: no depende solo del color */}
            {alert && <line x1={x - 5} x2={x + 5} y1={y + 8} y2={y + 8} stroke="#FF6B5B" strokeWidth={1.5} strokeLinecap="round" />}
          </g>
        )
      })}

      {days.map((d, j) => {
        const p = offset + j
        const c = cell(d, pid)
        const mid = (p + 0.5) * STEP
        const [tx, ty] = xy(radius(p + 0.5) + W * 0.44, mid)
        const press = (e: React.KeyboardEvent) => {
          if (c.onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            c.onClick()
          }
        }
        return (
          <g
            key={d}
            onClick={c.onClick}
            onKeyDown={press}
            role={c.onClick ? 'button' : 'img'}
            tabIndex={c.onClick ? 0 : undefined}
            aria-label={c.title}
            className="outline-none [&:focus-visible>path]:stroke-white [&:focus-visible>path]:[stroke-width:2.5]"
            style={{ cursor: c.onClick ? 'pointer' : 'default' }}
          >
            <title>{c.title}</title>
            <motion.path
              d={spiralSegment(p)}
              fill={c.style.fill}
              stroke={d === today ? '#FFFFFF' : (c.style.stroke ?? 'none')}
              strokeWidth={d === today ? 1.4 : (c.style.strokeWidth ?? 0)}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ transformOrigin: `${C}px ${C}px` }}
              transition={{ delay: delay + j * 0.015, duration: 0.3 }}
            />
            {c.star ? (
              <path
                transform={`translate(${tx - 4.5},${ty - 4.5}) scale(0.375)`}
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="#0B0E1A"
                pointerEvents="none"
              />
            ) : (
              numbers && (
                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central" fontSize={7.5} fontWeight={800} fill={c.dark ? '#0B0E1A' : '#C5CBE0'} pointerEvents="none" className="tabular">
                  {j + 1}
                </text>
              )
            )}
          </g>
        )
      })}

      <circle cx={C} cy={C} r={R0 - 3} fill="#1C2340" />
      <text x={C} y={C - 4} textAnchor="middle" dominantBaseline="central" fontSize={center.length > 3 ? 12 : 15} fontWeight={900} fill="#E8ECF8" className="tabular">
        {center}
      </text>
      <text x={C} y={C + 10} textAnchor="middle" dominantBaseline="central" fontSize={8} fontWeight={600} fill="#A3ABC8">
        {sub}
      </text>
    </svg>
  )
}

// ---------- Estadísticas por día de la semana ----------
function weekdayRates(entries: { d: ISODate; rate: number }[]) {
  return WEEKDAYS.map((_, w) => {
    const xs = entries.filter((e) => weekday(e.d) === w)
    return { w, n: xs.length, rate: xs.length ? xs.reduce((s, e) => s + e.rate, 0) / xs.length : 0 }
  }).filter((x) => x.n >= 2)
}

/** Constancia de los últimos 28 días (hoy cuenta solo si ya está hecho). Un fallo no la rompe. */
function consistency28(h: Habit, completions: CompletionMap, today: ISODate) {
  let done = 0
  let total = 0
  for (let i = 0; i < 28; i++) {
    const iso = toISO(subDays(fromISO(today), i))
    if (iso < h.createdAt) break
    if (!isScheduled(h, iso)) continue
    const ok = counts(statusOf(h, completions[key(h.id, iso)]))
    if (i === 0 && !ok) continue
    total++
    if (ok) done++
  }
  return { done, total }
}

const STATUS_LABEL = { full: 'completado', min: 'versión mínima', partial: 'a medias', none: 'sin marcar' }

// mapa de calor en 5 escalones (alfa sobre el teal) con su tinta de mayor contraste
const HEAT_STEPS = [
  { max: 0.25, alpha: '1A', dark: false },
  { max: 0.5, alpha: '38', dark: false },
  { max: 0.75, alpha: '61', dark: false },
  { max: 0.9, alpha: '99', dark: true },
  { max: 1, alpha: 'D9', dark: true },
]

export function HabitSpirals({ days, habits, completions, byDate, streak, today, onToggle }: Props) {
  const a11y = useA11yPalette()
  // ----- espiral general -----
  const pastDays = days.filter((d) => d <= today && byDate[d]?.scheduled)
  const allDone = pastDays.reduce((s, d) => s + byDate[d].done, 0)
  const allSched = pastDays.reduce((s, d) => s + byDate[d].scheduled, 0)
  const perfect = pastDays.filter((d) => byDate[d].perfect).length
  const rates = weekdayRates(pastDays.map((d) => ({ d, rate: byDate[d].pct })))
  const best = [...rates].sort((a, b) => b.rate - a.rate)[0]
  const worst = [...rates].sort((a, b) => a.rate - b.rate)[0]
  const showWorst = worst && best && worst.w !== best.w

  const overallCell = (d: ISODate): Cell => {
    const info = byDate[d]
    if (!info || d > today) return { style: FUTURE_STYLE, dark: false, title: `${fromISO(d).getDate()}: próximamente` }
    if (!info.scheduled) return { style: { fill: '#0E1222' }, dark: false, title: `${fromISO(d).getDate()}: día libre` }
    const pct = Math.round(info.pct * 100)
    // 5 escalones discretos (no degradado continuo): así el número siempre tiene contraste ≥ 4.5:1
    const step = HEAT_STEPS.find((s) => info.pct <= s.max)!
    return {
      style: info.perfect ? { fill: '#FFD600' } : info.pct === 0 ? { fill: '#1F2747' } : { fill: `${COLORS.teal}${step.alpha}` },
      dark: info.perfect || step.dark,
      star: info.perfect,
      title: `${fromISO(d).getDate()}: ${info.done} de ${info.scheduled} hábitos (${pct} %)${info.perfect ? ', día perfecto' : ''}`,
    }
  }

  return (
    <div className="space-y-3">
      {/* General */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-line bg-card p-5">
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <div className="w-full max-w-[320px] shrink-0">
            <Spiral
              days={days}
              today={today}
              cell={overallCell}
              center={`${allSched ? Math.round((allDone / allSched) * 100) : 0}%`}
              sub="del mes"
              alertDay={showWorst && worst.rate < 0.7 ? worst.w : undefined}
              label={`Todos los hábitos: ${allDone} de ${allSched} cumplidos este mes`}
              numbers
            />
          </div>
          <div className="w-full space-y-3">
            <div>
              <h3 className="text-lg font-extrabold">Todos los hábitos</h3>
              <p className="text-xs text-muted">Cada gajo es un día: cuanto más intenso, más hábitos cumpliste. Dorado con estrella = día perfecto.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Stat icon={CalendarCheck} color="#2EE6C8" value={`${allDone}/${allSched}`} label="Hábitos cumplidos" />
              <Stat icon={Star} color="#FFD600" value={perfect} label="Días perfectos" />
              <Stat icon={Flame} color="#FF6B5B" value={`${streak} d`} label="Racha actual" />
              {best && <Stat icon={TrendingUp} color="#2EE66B" value={`${Math.round(best.rate * 100)}%`} label={`Tu mejor día: ${WEEKDAY_NAMES[best.w]}`} />}
            </div>
            {showWorst && (
              <p className="flex items-start gap-2 rounded-xl bg-coral/10 p-2.5 text-xs text-coral">
                <TrendingDown className="size-4 shrink-0" />
                <span>
                  Los <b>{WEEKDAY_NAMES[worst.w]}</b> son tu punto débil ({Math.round(worst.rate * 100)}%). Prepara ese día la noche anterior o usa la versión mínima.
                </span>
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Uno por hábito */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {habits.map((h, hi) => {
          const color = COLORS[h.color]
          const Icon = iconFor(h.icon)
          const past = days.filter((d) => d <= today && isScheduled(h, d))
          const doneSet = new Set(past.filter((d) => counts(statusOf(h, completions[key(h.id, d)]))))
          const recent = consistency28(h, completions, today)
          const weakest = weekdayRates(past.map((d) => ({ d, rate: doneSet.has(d) ? 1 : 0 }))).sort((a, b) => a.rate - b.rate)[0]
          const weak = weakest && weakest.rate < 0.7 ? weakest : undefined

          const cell = (d: ISODate, pid: string): Cell => {
            const applies = isScheduled(h, d)
            const future = d > today
            const st = applies ? statusOf(h, completions[key(h.id, d)]) : 'none'
            const day = fromISO(d).getDate()
            return {
              style: statusStyle(st, color, pid, { applies, future, a11y }),
              dark: st === 'full',
              title: `${h.name}, día ${day}: ${!applies ? 'no aplica' : future ? 'próximamente' : STATUS_LABEL[st]}`,
              onClick: applies && !future ? () => onToggle(h, d) : undefined,
            }
          }

          return (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + hi * 0.05 }}
              className="rounded-3xl border border-line bg-card p-4"
            >
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ background: `${color}1f`, color }}>
                  <Icon className="size-[18px]" />
                </div>
                <div className="min-w-0 flex-1 truncate text-sm font-bold">{h.name}</div>
                {recent.total > 0 && (
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-card-2 px-2 py-0.5 text-xs font-bold text-muted"
                    title="Constancia de los últimos 28 días. Fallar un día no la rompe."
                  >
                    <Gauge className="size-3" style={{ color }} /> {recent.done}/{recent.total}
                  </span>
                )}
              </div>

              <div className="mx-auto mt-1 max-w-[260px]">
                <Spiral
                  days={days}
                  today={today}
                  cell={cell}
                  patternColors={[color]}
                  center={String(doneSet.size)}
                  sub={`de ${past.length}`}
                  alertDay={weak?.w}
                  label={`${h.name}: ${doneSet.size} de ${past.length} días cumplidos`}
                  delay={0.1 + hi * 0.05}
                />
              </div>

              <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold" style={{ color }}>
                  {past.length ? Math.round((doneSet.size / past.length) * 100) : 0}% del mes
                </span>
                {weak ? (
                  <span className="inline-flex items-center gap-1 text-muted">
                    <TrendingDown className="size-3.5 text-coral" /> Flojo los {WEEKDAY_NAMES[weak.w]}
                  </span>
                ) : (
                  past.length > 6 && <span className="text-muted">Constante toda la semana</span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
      <StatusLegend color={COLORS.teal} />
    </div>
  )
}

function Stat({ icon: Icon, color, value, label }: { icon: typeof Star; color: string; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-card-2 p-3">
      <Icon className="size-5 shrink-0" style={{ color }} />
      <div className="min-w-0">
        <div className="tabular text-base font-extrabold leading-none">{value}</div>
        <div className="mt-1 truncate text-[11px] text-muted">{label}</div>
      </div>
    </div>
  )
}
