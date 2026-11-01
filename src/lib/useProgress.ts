import { useMemo } from 'react'
import { evaluate } from '../core/achievements'
import { todayISO } from '../core/dates'
import { levelFromXp } from '../core/levels'
import { computeProgress } from '../core/progress'
import { THEMES, balance } from '../core/shop'
import { useStore } from './store'

export function useProgress() {
  const habits = useStore((s) => s.habits)
  const completions = useStore((s) => s.completions)
  const purchases = useStore((s) => s.purchases)
  const chestsOpened = useStore((s) => s.chestsOpened)
  const seed = useStore((s) => s.seed)
  const today = todayISO()
  return useMemo(() => {
    const progress = computeProgress({ habits, completions, today, purchases, chestsOpened, seed })
    return {
      today,
      progress,
      level: levelFromXp(progress.totalXp),
      achievements: evaluate(progress),
      coins: balance(progress.totalXp, purchases),
    }
  }, [habits, completions, purchases, chestsOpened, seed, today])
}

export function useTheme() {
  const theme = useStore((s) => s.settings.theme)
  return THEMES[theme] ?? THEMES.turquesa
}
