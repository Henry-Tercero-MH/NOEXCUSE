import type { Purchase } from './types'

export type ShopItem =
  | { id: string; kind: 'freeze'; name: string; description: string; icon: string; cost: number }
  | { id: string; kind: 'theme'; name: string; description: string; icon: string; cost: number; color: string; from: string; to: string }

export const MAX_FREEZES_WITH_SHOP = 3

// Temas: cambian el color de acento del anillo y la barra de XP
export const THEMES = {
  turquesa: { name: 'Turquesa', color: '#2EE6C8', from: '#2EE6C8', to: '#2EE66B' },
  violeta: { name: 'Nebulosa', color: '#A78BFA', from: '#A78BFA', to: '#F472B6' },
  fuego: { name: 'Fuego', color: '#FF6B5B', from: '#FF6B5B', to: '#FFD600' },
  hielo: { name: 'Glaciar', color: '#7DD3FC', from: '#7DD3FC', to: '#2EE6C8' },
  oro: { name: 'Oro puro', color: '#FFD600', from: '#FFF07A', to: '#FFB800' },
} as const
export type ThemeId = keyof typeof THEMES

export const SHOP: ShopItem[] = [
  { id: 'freeze', kind: 'freeze', name: 'Congelador de racha', description: 'Protege tu racha un día que falles. Máximo 3 guardados.', icon: 'Snowflake', cost: 200 },
  theme('violeta', 600, 'Sparkles', 'Anillo y barra de XP violeta-rosa.'),
  theme('fuego', 900, 'Flame', 'Para los que no paran.'),
  theme('hielo', 900, 'Snowflake', 'Frío, calmado, constante.'),
  theme('oro', 2500, 'Crown', 'Solo para los más disciplinados.'),
]

function theme(t: ThemeId, cost: number, icon: string, description: string): ShopItem {
  const { name, color, from, to } = THEMES[t]
  return { id: `theme-${t}`, kind: 'theme', name: `Tema ${name}`, description, icon, cost, color, from, to }
}

export const spent = (purchases: Purchase[]) => purchases.reduce((s, p) => s + p.cost, 0)
/** Saldo para gastar = XP ganada − XP gastada. El nivel usa la XP ganada, así que comprar no te baja de nivel. */
export const balance = (totalXp: number, purchases: Purchase[]) => totalXp - spent(purchases)
export const owns = (purchases: Purchase[], itemId: string) => purchases.some((p) => p.itemId === itemId)
