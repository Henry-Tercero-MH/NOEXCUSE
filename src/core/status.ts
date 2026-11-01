import type { Completion, Habit, Status } from './types'

export const targetOf = (h: Habit) => h.target ?? 1
export const isQuantity = (h: Habit) => targetOf(h) > 1
export const hasMin = (h: Habit) => (isQuantity(h) ? !!h.minValue : !!h.minLabel)
export const valueOf = (h: Habit, c?: Completion) => (c ? (c.value ?? targetOf(h)) : 0)

export function statusOf(h: Habit, c?: Completion): Status {
  if (!c) return 'none'
  const v = valueOf(h, c)
  if (v >= targetOf(h) && !c.min) return 'full'
  if (c.min || (h.minValue && v >= h.minValue)) return 'min'
  return v > 0 ? 'partial' : 'none'
}

/** Completo o mínimo: cuenta para el % del día y mantiene la racha. */
export const counts = (s: Status) => s === 'full' || s === 'min'

/** La versión mínima da la mitad de XP y no cuenta para el día perfecto. */
export const MIN_XP_FACTOR = 0.5
