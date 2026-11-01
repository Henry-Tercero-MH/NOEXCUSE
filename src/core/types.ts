// Lógica pura (sin DOM): esta carpeta se puede mover tal cual a packages/core
// para compartirla con la app de React Native.

export type ISODate = string // 'YYYY-MM-DD' en hora local

export type HabitColor = 'teal' | 'coral' | 'green' | 'gold' | 'violet' | 'sky' | 'pink' | 'orange'
export type Difficulty = 1 | 1.5 | 2

export interface Habit {
  id: string
  name: string
  icon: string // nombre de icono de Lucide (ver lib/icons.ts)
  color: HabitColor
  difficulty: Difficulty
  /** días de la semana en que aplica (0 = domingo). Vacío = todos los días */
  days: number[]
  /** 1 = hábito sí/no; >1 = hábito con cantidad (p. ej. 10 páginas) */
  target: number
  unit?: string
  /** versión mínima: texto para hábitos sí/no ("Meditar 5 minutos") */
  minLabel?: string
  /** versión mínima para hábitos con cantidad (p. ej. 1 página) */
  minValue?: number
  /** plan si-entonces: "Después de ___ (a las HH:mm), haré esto" */
  cue?: { after?: string; time?: string }
  /** plantilla de la biblioteca de la que viene (evita duplicados) */
  templateKey?: string
  order: number
  createdAt: ISODate
  archivedAt?: ISODate
  /** última modificación (ISO UTC): para sincronizar con Google Sheets / AppSheet */
  updatedAt?: string
}

export interface Completion {
  habitId: string
  date: ISODate
  completedAt: string // fecha y hora local
  value?: number // cantidad registrada; sin valor = completo (datos antiguos)
  min?: boolean // marcado con la versión mínima
  updatedAt?: string // última modificación (ISO UTC)
}

export type CompletionMap = Record<string, Completion> // clave `${habitId}|${date}`

export type Status = 'none' | 'partial' | 'min' | 'full'

export interface Purchase {
  id?: string // para sincronizar sin duplicar
  itemId: string
  cost: number
  date: ISODate
}

export interface DayInfo {
  date: ISODate
  scheduled: number
  done: number // completos + mínimos
  full: number
  complete: boolean // todo hecho contando versiones mínimas
  pct: number
  perfect: boolean
  frozen: boolean // se usó un congelador de racha
  streakAfter: number
  xp: number
}

export interface Progress {
  days: DayInfo[]
  byDate: Record<ISODate, DayInfo>
  totalXp: number
  streak: number
  bestStreak: number
  freezes: number
  perfectDays: number
  bestPerfectRun: number
  totalCompletions: number
  onTime: number
  completeDays: number
  maxFreezes: number
  /** constancia de los últimos 28 días (0..1) y multiplicador de XP actual */
  consistency: number
  multiplier: number
  comebacks: number
  minUses: number
}
