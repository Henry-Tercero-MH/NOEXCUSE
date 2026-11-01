import type { ISODate } from './types'

// Cofre de cierre del día: una sola recompensa variable al día (no en cada toque),
// para aprovechar el error de predicción de recompensa sin convertir la app en una tragaperras.
// Es determinista (fecha + semilla del usuario): deshacer marcas no permite "volver a tirar".

export type ChestReward = { kind: 'xp'; amount: number; rarity: 'común' | 'rara' | 'épica' } | { kind: 'freeze'; rarity: 'rara' } | { kind: 'jackpot'; amount: number; rarity: 'legendaria' }

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

export function chestReward(date: ISODate, seed: string): ChestReward {
  const r = hash(`${seed}|${date}|roll`)
  const v = hash(`${seed}|${date}|value`)
  if (r < 0.7) return { kind: 'xp', amount: 10 + Math.round(v * 15), rarity: 'común' } // 70 %: 10-25 XP
  if (r < 0.92) return { kind: 'xp', amount: 40 + Math.round(v * 20), rarity: 'épica' } // 22 %: 40-60 XP
  if (r < 0.98) return { kind: 'freeze', rarity: 'rara' } // 6 %: congelador
  return { kind: 'jackpot', amount: 150, rarity: 'legendaria' } // 2 %: 150 XP
}

export const chestXp = (r: ChestReward) => (r.kind === 'freeze' ? 0 : r.amount)
