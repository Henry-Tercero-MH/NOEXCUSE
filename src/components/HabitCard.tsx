import { AnimatePresence, motion } from 'framer-motion'
import { CornerDownRight, Feather, Minus, Pencil, Plus, Zap } from 'lucide-react'
import { useState } from 'react'
import { previewXp } from '../core/progress'
import { hasMin, isQuantity, statusOf, targetOf, valueOf } from '../core/status'
import type { Completion, Habit } from '../core/types'
import { feedback } from '../lib/feedback'
import { COLORS, iconFor } from '../lib/icons'

interface Props {
  habit: Habit
  completion?: Completion
  multiplier: number // multiplicador de XP por constancia
  nth: number // hábitos ya completados hoy (para el tono del sonido)
  onMark: (mark: { value: number; min?: boolean } | null) => void
  onEdit: () => void
}

const DIFF_LABEL = { 1: 'Fácil', 1.5: 'Media', 2: 'Difícil' } as const

export function HabitCard({ habit, completion, multiplier, nth, onMark, onEdit }: Props) {
  const Icon = iconFor(habit.icon)
  const color = COLORS[habit.color]
  const qty = isQuantity(habit)
  const target = targetOf(habit)
  const value = valueOf(habit, completion)
  const status = statusOf(habit, completion)
  const full = status === 'full'
  const min = status === 'min'
  const xpFull = previewXp(habit, multiplier)
  const xpMin = previewXp(habit, multiplier, true)
  const [floats, setFloats] = useState<{ id: number; xp: number }[]>([])
  const [ripple, setRipple] = useState(0)

  const float = (xp: number) => {
    setFloats((f) => [...f, { id: Date.now(), xp }])
    setRipple((r) => r + 1)
  }

  const complete = () => {
    float(min ? xpFull - xpMin : xpFull)
    feedback.check(nth)
    onMark({ value: target })
  }

  const onMain = () => {
    if (full) {
      feedback.uncheck()
      return onMark(null)
    }
    if (!qty) return complete()
    const next = value + 1
    if (next >= target) return complete()
    // cruzar el mínimo también premia
    if (habit.minValue && next >= habit.minValue && value < habit.minValue) {
      float(xpMin)
      feedback.check(nth)
    } else feedback.tick(next / target)
    onMark({ value: next })
  }

  const onMinus = () => {
    feedback.uncheck()
    onMark(value - 1 > 0 ? { value: value - 1 } : null)
  }

  const onMinimum = () => {
    float(xpMin)
    feedback.check(nth)
    onMark(qty ? { value: Math.max(value, habit.minValue!) } : { value: 0, min: true })
  }

  const fill = full ? 1 : min ? 0.5 : qty ? value / target : 0

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
      className={`group relative overflow-hidden rounded-2xl border bg-card transition-opacity duration-500 ${full ? 'opacity-75' : ''}`}
      style={{ borderColor: full ? `${color}55` : min ? `${color}33` : '#262E4D' }}
    >
      {/* barrido de color según el progreso */}
      <motion.div
        className="absolute inset-0 origin-left"
        style={{ background: `linear-gradient(90deg, ${color}26, ${color}08)` }}
        initial={false}
        animate={{ scaleX: fill }}
        // la recompensa (barrido) llega después del check, no a la vez
        transition={{ duration: 0.5, delay: fill > 0 ? 0.15 : 0, ease: [0.2, 0.8, 0.2, 1] }}
      />

      <div className="relative flex items-center gap-3.5 p-3.5">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl" style={{ background: `${color}1f`, color }}>
          <Icon className="size-6" strokeWidth={2.2} />
        </div>

        <div className="min-w-0 flex-1">
          <button onClick={onEdit} className="block w-full text-left" aria-label={`Editar ${habit.name}`}>
            <div className={`truncate text-base font-semibold transition-colors ${full ? 'text-muted' : 'text-[#F1F4FC]'}`}>{habit.name}</div>
            {habit.cue?.after && !full && (
              <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
                <CornerDownRight className="size-3 shrink-0" />
                Después de {habit.cue.after.charAt(0).toLowerCase() + habit.cue.after.slice(1)}
                {habit.cue.time && <span className="tabular"> · {habit.cue.time}</span>}
              </div>
            )}
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
              {qty && (
                <span className="tabular font-semibold" style={{ color: full ? undefined : color }}>
                  {value} / {target} {habit.unit}
                </span>
              )}
              {min ? (
                <span className="inline-flex items-center gap-1 font-semibold" style={{ color }}>
                  <Feather className="size-3" /> Mínimo cumplido
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5">
                  <Zap className="size-3" strokeWidth={2.5} />
                  {xpFull} XP
                </span>
              )}
              {!qty && !min && (
                <>
                  <span>·</span>
                  <span>{DIFF_LABEL[habit.difficulty]}</span>
                </>
              )}
              <Pencil className="size-3 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100" />
            </div>
          </button>

          {hasMin(habit) && (status === 'none' || status === 'partial') && (
            <button
              onClick={onMinimum}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-card-2/80 px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-white"
            >
              <Feather className="size-3" style={{ color }} />
              Solo lo mínimo: {qty ? `${habit.minValue} ${habit.minValue === 1 ? (habit.unit ?? '').replace(/s$/, '') : (habit.unit ?? '')}` : habit.minLabel}
              <span style={{ color }}>+{xpMin} XP</span>
            </button>
          )}
        </div>

        {qty && value > 0 && !full && (
          <button onClick={onMinus} className="grid size-11 shrink-0 place-items-center rounded-full bg-card-2 text-muted hover:text-white" aria-label="Restar uno">
            <Minus className="size-4" />
          </button>
        )}

        <motion.button
          onClick={onMain}
          whileTap={{ scale: 0.88 }}
          animate={full ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          role={qty ? undefined : 'checkbox'}
          aria-checked={qty ? undefined : full ? true : min ? 'mixed' : false}
          aria-label={qty ? `Sumar uno a ${habit.name} (${value} de ${target})` : min ? `${habit.name}, versión mínima hecha` : habit.name}
          className="relative grid size-14 shrink-0 place-items-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          style={{
            background: full ? color : min ? `${color}2e` : 'transparent',
            boxShadow: full ? `0 0 18px -4px ${color}66` : 'none',
          }}
        >
          {/* onda de recompensa */}
          <AnimatePresence>
            {ripple > 0 && (
              <motion.span
                key={ripple}
                className="pointer-events-none absolute inset-0 rounded-full border-2"
                style={{ borderColor: color }}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>
          {/* aro de progreso */}
          <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
            <circle cx="24" cy="24" r="22" fill="none" stroke={full ? color : '#46507E'} strokeWidth="2.6" />
            {!full && (
              <motion.circle
                cx="24"
                cy="24"
                r="22"
                fill="none"
                stroke={color}
                strokeWidth="2.6"
                strokeLinecap="round"
                initial={false}
                animate={{ pathLength: qty ? value / target : min ? 0.5 : 0, opacity: (qty && value > 0) || min ? 1 : 0 }}
              />
            )}
          </svg>

          {full || !qty ? (
            <svg viewBox="0 0 24 24" className="relative size-6" fill="none" stroke={full ? '#0B0E1A' : color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
              <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={false} animate={{ pathLength: full || min ? 1 : 0, opacity: full || min ? 1 : 0 }} transition={{ duration: 0.22, delay: full ? 0.12 : 0, ease: [0.65, 0, 0.35, 1] }} />
            </svg>
          ) : (
            <span className="relative flex flex-col items-center leading-none" style={{ color: value ? color : '#8A93B0' }}>
              {value === 0 ? <Plus className="size-5" /> : <span className="tabular text-base font-extrabold">{value}</span>}
            </span>
          )}

          <span className="sr-only" aria-live="polite">
            {floats.length ? `+${floats[floats.length - 1].xp} XP` : ''}
          </span>
          <AnimatePresence>
            {floats.map(({ id, xp }) => (
              <motion.span
                key={id}
                className="pointer-events-none absolute -top-2 right-0 whitespace-nowrap text-[13px] font-extrabold"
                style={{ color }}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 1, 0], y: -28 }}
                transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                onAnimationComplete={() => setFloats((f) => f.filter((x) => x.id !== id))}
              >
                +{xp} XP
              </motion.span>
            ))}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  )
}
