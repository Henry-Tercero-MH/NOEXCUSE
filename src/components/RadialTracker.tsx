import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { useId, useState } from 'react'
import { fromISO, key } from '../core/dates'
import { isScheduled } from '../core/progress'
import { counts, statusOf, targetOf, valueOf } from '../core/status'
import type { CompletionMap, Habit, ISODate } from '../core/types'
import { COLORS, WEEK_COLORS, iconFor } from '../lib/icons'
import { StatusDefs, statusStyle, useA11yPalette } from './StatusPatterns'

interface Props {
  days: ISODate[]
  habits: Habit[]
  completions: CompletionMap
  today: ISODate
  monthPct: number
  onToggle: (h: Habit, d: ISODate) => void
}

// Geometría: los anillos empiezan arriba (12 en punto) y giran 270° en sentido horario
// hasta las 9. El cuadrante libre (arriba a la izquierda) contiene la franja con los nombres.
const SIZE = 640
const C = SIZE / 2
const R_OUT = 268
const SWEEP = (3 * Math.PI) / 2

const pt = (r: number, a: number) => [C + r * Math.sin(a), C - r * Math.cos(a)] as const

function sector(r0: number, r1: number, a0: number, a1: number) {
  const [x1, y1] = pt(r1, a0)
  const [x2, y2] = pt(r1, a1)
  const [x3, y3] = pt(r0, a1)
  const [x4, y4] = pt(r0, a0)
  return `M${x1},${y1} A${r1},${r1} 0 0 1 ${x2},${y2} L${x3},${y3} A${r0},${r0} 0 0 0 ${x4},${y4} Z`
}

export function RadialTracker({ days, habits, completions, today, monthPct, onToggle }: Props) {
  const [hover, setHover] = useState<{ h: Habit; d: ISODate } | null>(null)
  const pid = useId()
  const a11y = useA11yPalette()
  const n = Math.max(habits.length, 1)
  const ringW = Math.min(30, (R_OUT - 96) / n)
  const R_IN = R_OUT - n * ringW
  const step = SWEEP / days.length

  // anillo 0 = exterior (primera fila de la franja)
  const ring = (i: number) => ({ r1: R_OUT - i * ringW, r0: R_OUT - (i + 1) * ringW })

  const hoverInfo = (() => {
    if (!hover) return null
    const c = completions[key(hover.h.id, hover.d)]
    const st = statusOf(hover.h, c)
    const label = { full: 'Completado', min: 'Versión mínima', partial: `${valueOf(hover.h, c)} de ${targetOf(hover.h)} ${hover.h.unit ?? ''}`, none: hover.d > today ? 'Próximamente' : 'Sin marcar' }[st]
    return { name: hover.h.name, date: format(fromISO(hover.d), "EEE d 'de' MMM", { locale: es }), label, color: COLORS[hover.h.color] }
  })()

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto block w-full max-w-[640px] select-none" role="img" aria-label="Seguimiento circular del mes. Usa la vista Tabla para navegar con teclado.">
      <StatusDefs id={pid} colors={habits.map((h) => COLORS[h.color])} />
      {/* franja con los nombres de los hábitos */}
      {habits.map((h, i) => {
        const { r0, r1 } = ring(i)
        const Icon = iconFor(h.icon)
        const sched = days.filter((d) => d <= today && isScheduled(h, d))
        const total = sched.filter((d) => counts(statusOf(h, completions[key(h.id, d)]))).length
        const fs = Math.min(13, ringW * 0.48)
        const yMid = C - (r0 + r1) / 2
        return (
          <g key={h.id}>
            <rect x={C - R_OUT} y={C - r1} width={R_OUT} height={ringW} fill={i % 2 ? '#151A2E' : '#1A2038'} />
            <Icon x={C - R_OUT + 8} y={yMid - fs * 0.6} width={fs * 1.2} height={fs * 1.2} color={COLORS[h.color]} />
            <text x={C - R_OUT + 14 + fs * 1.2} y={yMid} dominantBaseline="central" fontSize={fs} fontWeight={600} fill="#E8ECF8">
              {h.name.length > 26 ? h.name.slice(0, 25) + '…' : h.name}
            </text>
            <text x={C - 10} y={yMid} dominantBaseline="central" textAnchor="end" fontSize={fs * 0.9} fontWeight={700} fill="#8A93B0" className="tabular">
              {total}/{sched.length}
            </text>
          </g>
        )
      })}
      <text x={C - R_OUT} y={C - R_OUT - 14} fontSize={11} fontWeight={800} letterSpacing={2} fill="#8A93B0">
        HÁBITOS
      </text>

      {/* gajos: un anillo por hábito, un gajo por día */}
      {days.map((d, j) => {
        const a0 = j * step
        const a1 = (j + 1) * step
        const wc = WEEK_COLORS[Math.floor(j / 7)]
        const future = d > today
        return (
          <g key={d}>
            {habits.map((h, i) => {
              const { r0, r1 } = ring(i)
              const applies = isScheduled(h, d)
              const c = completions[key(h.id, d)]
              const st = applies ? statusOf(h, c) : 'none'
              const color = COLORS[h.color]
              const s = statusStyle(st, color, pid, { applies, future, a11y })
              // sin marcar: tinte suave de la semana (en modo accesible, gris con borde)
              const fill = st === 'none' && applies && !a11y ? `${wc}${future ? '08' : '14'}` : s.fill
              const isHover = hover?.h.id === h.id && hover.d === d
              return (
                <motion.path
                  key={h.id}
                  d={sector(r0, r1, a0, a1)}
                  fill={fill}
                  stroke={isHover ? '#FFFFFF' : st === 'partial' || (a11y && st === 'none' && applies && !future) ? s.stroke : '#0B0E1A'}
                  strokeWidth={isHover ? 2 : 1.5}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: j * 0.012 + i * 0.02, duration: 0.25 }}
                  style={{ cursor: applies && !future ? 'pointer' : 'default' }}
                  onMouseEnter={() => setHover({ h, d })}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => applies && !future && onToggle(h, d)}
                />
              )
            })}
            {/* número del día */}
            {(() => {
              const [x, y] = pt(R_OUT + 16, (a0 + a1) / 2)
              const isToday = d === today
              return (
                <g>
                  {isToday && <circle cx={x} cy={y} r={11} fill="#2EE6C8" />}
                  <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={isToday ? 12 : 11} fontWeight={isToday ? 900 : 700} fill={isToday ? '#0B0E1A' : '#A3ABC8'} className="tabular">
                    {j + 1}
                  </text>
                </g>
              )
            })()}
          </g>
        )
      })}

      {/* marca de hoy: radio que atraviesa los anillos */}
      {days.includes(today) &&
        (() => {
          const j = days.indexOf(today)
          const [x0, y0] = pt(R_IN - 4, (j + 0.5) * step)
          const [x1, y1] = pt(R_OUT + 4, (j + 0.5) * step)
          return <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#2EE6C8" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7} pointerEvents="none" />
        })()}

      {/* centro */}
      <circle cx={C} cy={C} r={R_IN - 8} fill="#151A2E" stroke="#262E4D" />
      {hoverInfo ? (
        <g pointerEvents="none">
          <text x={C} y={C - 22} textAnchor="middle" fontSize={13} fontWeight={700} fill={hoverInfo.color}>
            {hoverInfo.name.length > 22 ? hoverInfo.name.slice(0, 21) + '…' : hoverInfo.name}
          </text>
          <text x={C} y={C} textAnchor="middle" fontSize={12} fill="#8A93B0">
            {hoverInfo.date}
          </text>
          <text x={C} y={C + 22} textAnchor="middle" fontSize={14} fontWeight={800} fill="#E8ECF8">
            {hoverInfo.label}
          </text>
        </g>
      ) : (
        <g pointerEvents="none">
          <text x={C} y={C - 10} textAnchor="middle" fontSize={Math.min(46, R_IN * 0.42)} fontWeight={900} fill="#E8ECF8" className="tabular">
            {Math.round(monthPct * 100)}%
          </text>
          <text x={C} y={C + 24} textAnchor="middle" fontSize={12} fontWeight={600} fill="#8A93B0">
            del mes cumplido
          </text>
        </g>
      )}
    </svg>
  )
}
