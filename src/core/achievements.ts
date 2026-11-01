import { levelFromXp } from './levels'
import type { Progress } from './types'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string // nombre de icono de Lucide
  tier: 'bronze' | 'silver' | 'gold'
  /** progreso actual y meta; desbloqueado cuando current >= goal */
  progress: (p: Progress) => { current: number; goal: number }
}

const best = (p: Progress) => p.bestStreak

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-step', title: 'Primer paso', description: 'Completa tu primer hábito', icon: 'Footprints', tier: 'bronze', progress: (p) => ({ current: p.totalCompletions, goal: 1 }) },
  { id: 'perfect-day', title: 'Primer día perfecto', description: 'Completa el 100% de un día', icon: 'Star', tier: 'bronze', progress: (p) => ({ current: p.perfectDays, goal: 1 }) },
  { id: 'streak-7', title: 'Racha de 7 días', description: '7 días seguidos sin fallar', icon: 'Flame', tier: 'bronze', progress: (p) => ({ current: best(p), goal: 7 }) },
  { id: 'on-time-10', title: 'Puntual', description: 'Cumple 10 hábitos a la hora de tu plan', icon: 'AlarmClock', tier: 'bronze', progress: (p) => ({ current: p.onTime, goal: 10 }) },
  { id: 'complete-5', title: 'Nunca a medias', description: 'Completa 5 días enteros (contando mínimos)', icon: 'CalendarCheck', tier: 'bronze', progress: (p) => ({ current: p.completeDays, goal: 5 }) },
  { id: 'perfect-10', title: 'Diez de diez', description: 'Acumula 10 días perfectos', icon: 'Sparkles', tier: 'silver', progress: (p) => ({ current: p.perfectDays, goal: 10 }) },
  { id: 'streak-30', title: 'Mes imparable', description: 'Racha de 30 días', icon: 'CalendarCheck', tier: 'silver', progress: (p) => ({ current: best(p), goal: 30 }) },
  { id: 'perfect-week', title: 'Semana perfecta', description: '7 días perfectos seguidos', icon: 'Gem', tier: 'silver', progress: (p) => ({ current: p.bestPerfectRun, goal: 7 }) },
  { id: 'never-zero', title: 'Nunca cero', description: 'Usa la versión mínima 5 veces en vez de fallar', icon: 'Feather', tier: 'bronze', progress: (p) => ({ current: p.minUses, goal: 5 }) },
  { id: 'comeback', title: 'Resurgir', description: 'Pierde una racha y vuelve con 7 días seguidos', icon: 'RotateCcw', tier: 'silver', progress: (p) => ({ current: p.comebacks, goal: 1 }) },
  { id: 'freezer', title: 'Previsor', description: 'Guarda 2 congeladores de racha', icon: 'Snowflake', tier: 'silver', progress: (p) => ({ current: p.maxFreezes, goal: 2 }) },
  { id: 'level-10', title: 'Constante', description: 'Llega al nivel 10', icon: 'Shield', tier: 'silver', progress: (p) => ({ current: levelFromXp(p.totalXp).level, goal: 10 }) },
  { id: 'streak-100', title: 'Centurión', description: 'Racha de 100 días', icon: 'Crown', tier: 'gold', progress: (p) => ({ current: best(p), goal: 100 }) },
  { id: 'thousand', title: 'Mil hábitos', description: '1.000 hábitos completados', icon: 'Trophy', tier: 'gold', progress: (p) => ({ current: p.totalCompletions, goal: 1000 }) },
  { id: 'level-50', title: 'Sin excusas', description: 'Llega al nivel 50', icon: 'Mountain', tier: 'gold', progress: (p) => ({ current: levelFromXp(p.totalXp).level, goal: 50 }) },
]

export function evaluate(p: Progress) {
  return ACHIEVEMENTS.map((a) => {
    const { current, goal } = a.progress(p)
    return { ...a, current: Math.min(current, goal), goal, unlocked: current >= goal }
  })
}
