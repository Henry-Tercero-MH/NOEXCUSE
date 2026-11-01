// XP para pasar del nivel n al n+1 = 200·n + 100  (nivel 7 → 1.500 XP)
export const xpForLevel = (n: number) => 200 * n + 100

export const XP = {
  base: 10,
  completeDay: 25, // todo hecho, contando versiones mínimas
  perfectDay: 50, // todo hecho al 100 %
  onTime: 5, // marcado dentro de ±90 min de la hora de su plan
  onTimeWindowMin: 90,
  freezeEvery: 7,
  maxFreezes: 2,
  consistencyWindow: 28,
}

/**
 * Multiplicador por CONSTANCIA de los últimos 28 días (no por racha):
 * fallar un día apenas lo mueve, así que no hay doble castigo ni efecto "total, ya da igual".
 */
export function consistencyMultiplier(rate: number) {
  if (rate >= 0.9) return 1.3
  if (rate >= 0.75) return 1.2
  if (rate >= 0.6) return 1.1
  return 1
}

export interface LevelInfo {
  level: number
  into: number // XP dentro del nivel actual
  needed: number // XP total del nivel actual
  rank: Rank
  nextRank?: Rank
}

export interface Rank {
  from: number
  name: string
  color: string
}

export const RANKS: Rank[] = [
  { from: 1, name: 'Novato', color: '#8A93B0' },
  { from: 5, name: 'Disciplinado', color: '#2EE6C8' },
  { from: 10, name: 'Constante', color: '#2EE66B' },
  { from: 15, name: 'Imparable', color: '#7DD3FC' },
  { from: 20, name: 'Élite', color: '#A78BFA' },
  { from: 30, name: 'Titán', color: '#FF6B5B' },
  { from: 40, name: 'Leyenda', color: '#FB923C' },
  { from: 50, name: 'Sin Excusas', color: '#FFD600' },
]

export const rankFor = (level: number) => [...RANKS].reverse().find((r) => level >= r.from)!

export function levelFromXp(xp: number): LevelInfo {
  let level = 1
  let rest = xp
  while (rest >= xpForLevel(level)) {
    rest -= xpForLevel(level)
    level++
  }
  const rank = rankFor(level)
  return { level, into: rest, needed: xpForLevel(level), rank, nextRank: RANKS.find((r) => r.from > level) }
}
