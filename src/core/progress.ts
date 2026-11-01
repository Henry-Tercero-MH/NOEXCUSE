import { eachDay, fromISO, key } from './dates'
import { XP, consistencyMultiplier } from './levels'
import { chestReward, chestXp } from './rewards'
import { MAX_FREEZES_WITH_SHOP } from './shop'
import { MIN_XP_FACTOR, counts, statusOf } from './status'
import type { Completion, CompletionMap, DayInfo, Habit, ISODate, Progress, Purchase } from './types'

export function isScheduled(h: Habit, date: ISODate) {
  if (h.createdAt > date) return false
  if (h.archivedAt && h.archivedAt <= date) return false
  return h.days.length === 0 || h.days.includes(fromISO(date).getDay())
}

export const scheduledHabits = (habits: Habit[], date: ISODate) => habits.filter((h) => isScheduled(h, date))

/** ¿Se marcó dentro de ±90 min de la hora de su plan? */
export function isOnTime(h: Habit, c: Completion) {
  if (!h.cue?.time || !c.completedAt.startsWith(c.date)) return false
  const [hh, mm] = h.cue.time.split(':').map(Number)
  const at = new Date(c.completedAt)
  return Math.abs(at.getHours() * 60 + at.getMinutes() - (hh * 60 + mm)) <= XP.onTimeWindowMin
}

export interface ProgressInput {
  habits: Habit[]
  completions: CompletionMap
  today: ISODate
  purchases?: Purchase[]
  chestsOpened?: ISODate[]
  seed?: string
}

/**
 * Todo se deriva de hábitos + marcas (+ compras y cofres): XP, racha, congeladores y días perfectos.
 * Así deshacer una marca nunca deja datos inconsistentes.
 */
export function computeProgress({ habits, completions, today, purchases = [], chestsOpened = [], seed = '' }: ProgressInput): Progress {
  const start = habits.reduce((min, h) => (h.createdAt < min ? h.createdAt : min), today)
  const freezeGifts: Record<ISODate, number> = {}
  for (const p of purchases) if (p.itemId === 'freeze') freezeGifts[p.date] = (freezeGifts[p.date] ?? 0) + 1
  const chests = new Set(chestsOpened)

  const days: DayInfo[] = []
  let streak = 0
  let bestStreak = 0
  let freezes = 0
  let maxFreezes = 0
  let totalXp = 0
  let perfectDays = 0
  let completeDays = 0
  let perfectRun = 0
  let bestPerfectRun = 0
  let totalCompletions = 0
  let onTime = 0
  let comebacks = 0
  let minUses = 0
  let lostStreak = false

  // constancia de los 28 días anteriores (solo días con hábitos programados)
  const consistencyBefore = () => {
    const win = days.slice(-XP.consistencyWindow).filter((d) => d.scheduled > 0)
    return win.length ? win.reduce((s, d) => s + d.pct, 0) / win.length : 0
  }

  for (const date of eachDay(start, today)) {
    const sched = scheduledHabits(habits, date)
    const marks = sched.map((h) => {
      const c = completions[key(h.id, date)]
      return { h, c, s: statusOf(h, c) }
    })
    const full = marks.filter((m) => m.s === 'full').length
    const done = marks.filter((m) => counts(m.s)).length
    const perfect = sched.length > 0 && full === sched.length
    const complete = sched.length > 0 && done === sched.length
    const mult = consistencyMultiplier(consistencyBefore())
    let frozen = false

    let xp = 0
    for (const { h, c, s } of marks) {
      if (!counts(s) || !c) continue
      xp += XP.base * h.difficulty * mult * (s === 'min' ? MIN_XP_FACTOR : 1)
      if (s === 'min') minUses++
      if (s === 'full' && isOnTime(h, c)) {
        xp += XP.onTime
        onTime++
      }
    }
    if (perfect) xp += XP.perfectDay
    else if (complete) xp += XP.completeDay

    // cofre del día (solo si se abrió y hubo al menos un hábito hecho)
    if (chests.has(date) && done > 0) {
      const reward = chestReward(date, seed)
      xp += chestXp(reward)
      if (reward.kind === 'freeze') freezeGifts[date] = (freezeGifts[date] ?? 0) + 1
    }
    xp = Math.round(xp)

    // congeladores comprados o ganados en el cofre: disponibles desde ese día
    if (freezeGifts[date]) freezes = Math.min(MAX_FREEZES_WITH_SHOP, freezes + freezeGifts[date])

    if (sched.length === 0) {
      // día libre: no suma ni rompe la racha
    } else if (done > 0) {
      streak++
      if (streak % XP.freezeEvery === 0) freezes = Math.min(Math.max(XP.maxFreezes, freezes), freezes + 1)
      if (lostStreak && streak >= 7) {
        comebacks++
        lostStreak = false
      }
    } else if (date !== today) {
      if (freezes > 0) {
        freezes--
        frozen = true
      } else {
        if (streak >= 3) lostStreak = true
        streak = 0
      }
    }
    maxFreezes = Math.max(maxFreezes, freezes)

    if (perfect) {
      perfectDays++
      perfectRun++
    } else if (sched.length > 0 && date !== today) {
      perfectRun = 0 // hoy aún está en curso: no rompe la serie
    }
    if (complete) completeDays++
    bestPerfectRun = Math.max(bestPerfectRun, perfectRun)
    bestStreak = Math.max(bestStreak, streak)
    totalXp += xp
    totalCompletions += done

    days.push({ date, scheduled: sched.length, done, full, complete, pct: sched.length ? done / sched.length : 0, perfect, frozen, streakAfter: streak, xp })
  }

  // constancia "de hoy": los 28 días anteriores a hoy (hoy aún está en curso)
  const past = days.filter((d) => d.date < today).slice(-XP.consistencyWindow).filter((d) => d.scheduled > 0)
  const consistency = past.length ? past.reduce((s, d) => s + d.pct, 0) / past.length : 0

  return {
    days,
    byDate: Object.fromEntries(days.map((d) => [d.date, d])),
    totalXp,
    streak,
    bestStreak,
    freezes,
    maxFreezes,
    perfectDays,
    completeDays,
    bestPerfectRun,
    totalCompletions,
    onTime,
    comebacks,
    minUses,
    consistency,
    multiplier: consistencyMultiplier(consistency),
  }
}

/** XP que daría completar ahora este hábito (para el "+15 XP" flotante). */
export function previewXp(h: Habit, multiplier: number, min = false) {
  return Math.round(XP.base * h.difficulty * multiplier * (min ? MIN_XP_FACTOR : 1))
}
