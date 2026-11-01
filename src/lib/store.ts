import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { addDays, format, subDays } from 'date-fns'
import { key, toISO, todayISO } from '../core/dates'
import { isScheduled } from '../core/progress'
import type { ShopItem, ThemeId } from '../core/shop'
import type { PaletteId } from './icons'
import type { CompletionMap, Habit, ISODate, Purchase } from '../core/types'

export interface Settings {
  sound: boolean
  haptics: boolean
  theme: ThemeId
  palette: PaletteId
}

export type NewHabit = Omit<Habit, 'id' | 'order' | 'createdAt'> & { id?: string }

export interface SyncConfig {
  /** URL /exec de la aplicación web de Apps Script */
  url: string
  token: string
  /** momento (ISO UTC) de la última sincronización correcta */
  lastSync?: string
}

interface Data {
  userName: string
  onboarded: boolean
  habits: Habit[]
  completions: CompletionMap
  purchases: Purchase[]
  /** días en que se abrió el cofre de cierre */
  chestsOpened: ISODate[]
  /** semilla estable para las recompensas variables */
  seed: string
  settings: Settings
  /** marcas borradas (clave → momento del borrado), para propagar el borrado a la hoja */
  tombstones: Record<string, string>
  sync: SyncConfig | null
}

interface State extends Data {
  /** null borra la marca del día */
  setMark: (habitId: string, date: ISODate, mark: { value: number; min?: boolean } | null) => void
  saveHabit: (h: NewHabit) => void
  /** añade varios hábitos (p. ej. desde la biblioteca); omite plantillas ya activas. Devuelve cuántos añadió */
  addHabits: (hs: NewHabit[]) => number
  archiveHabit: (id: string) => void
  finishOnboarding: (name: string, habits: Habit[], withDemo: boolean) => void
  setSettings: (s: Partial<Settings>) => void
  buy: (item: ShopItem) => void
  openChest: (date: ISODate) => void
  /** la copia no incluye la conexión con Sheets (contiene el token) */
  exportData: () => Omit<Data, 'tombstones' | 'sync'> & { app: 'no-excuses'; version: number; exportedAt: string }
  importData: (raw: unknown) => boolean
  reset: () => void
  setSync: (s: SyncConfig | null) => void
}

const VERSION = 4
const nowLocal = () => format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
const uid = () => Math.random().toString(36).slice(2, 10)
export const stamp = () => new Date().toISOString()

export const SUGGESTED: Omit<Habit, 'createdAt'>[] = [
  { id: 'wake', name: 'Levantarme a las 5 AM', icon: 'AlarmClock', color: 'gold', difficulty: 2, days: [], target: 1, minLabel: 'Levantarme antes de las 6', cue: { after: 'Sonar la alarma', time: '05:00' }, order: 0 },
  { id: 'meditate', name: 'Meditar 30 minutos', icon: 'Brain', color: 'teal', difficulty: 1.5, days: [], target: 1, minLabel: 'Meditar 5 minutos', cue: { after: 'Tomar el café', time: '05:30' }, order: 1 },
  { id: 'read', name: 'Leer', icon: 'BookOpen', color: 'coral', difficulty: 1, days: [], target: 10, unit: 'páginas', minValue: 1, templateKey: 'read', cue: { after: 'Cenar', time: '21:00' }, order: 2 },
  { id: 'macros', name: 'Contabilizar mis macros', icon: 'Apple', color: 'green', difficulty: 1, days: [], target: 1, templateKey: 'macros', cue: { after: 'Cada comida' }, order: 3 },
  { id: 'workout', name: 'Entrenar 45 minutos', icon: 'Dumbbell', color: 'violet', difficulty: 2, days: [1, 2, 3, 4, 5, 6], target: 1, minLabel: '10 flexiones', templateKey: 'workout', cue: { after: 'Salir del trabajo', time: '18:30' }, order: 4 },
  { id: 'water', name: 'Tomar agua', icon: 'GlassWater', color: 'sky', difficulty: 1, days: [], target: 8, unit: 'vasos', templateKey: 'water', order: 5 },
]

/** Genera ~2 meses de historial creíble para ver la app "viva". */
function demoCompletions(habits: Habit[], from: ISODate, today: ISODate): CompletionMap {
  let seed = 42
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const rate: Record<string, number> = { wake: 0.68, meditate: 0.8, read: 0.6, macros: 0.5, workout: 0.72, water: 0.88 }
  const out: CompletionMap = {}
  for (let d = new Date(from + 'T00:00'); toISO(d) < today; d = addDays(d, 1)) {
    const date = toISO(d)
    const strong = rnd() < 0.22 // algunos días perfectos
    for (const h of habits) {
      if (!isScheduled(h, date)) continue
      const hour = h.id === 'wake' ? 5 : 6 + Math.floor(rnd() * 15)
      const at = `${date}T${String(hour).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')}:00`
      if (strong || rnd() < (rate[h.id] ?? 0.7)) {
        out[key(h.id, date)] = { habitId: h.id, date, completedAt: at, value: h.target }
      } else if (rnd() < 0.35 && (h.minLabel || h.minValue || h.target > 1)) {
        // a veces, versión mínima o progreso parcial
        const min = !!(h.minLabel || h.minValue)
        out[key(h.id, date)] = { habitId: h.id, date, completedAt: at, value: h.minValue ?? (min ? 0 : Math.ceil(h.target / 2)), min: !!h.minLabel || undefined }
      }
    }
  }
  // hoy: dos hábitos hechos temprano y algo de agua
  for (const id of ['wake', 'meditate']) out[key(id, today)] = { habitId: id, date: today, completedAt: nowLocal(), value: 1 }
  out[key('water', today)] = { habitId: 'water', date: today, completedAt: nowLocal(), value: 3 }
  return out
}

const initial: Data = {
  userName: '',
  onboarded: false,
  habits: [],
  completions: {},
  purchases: [],
  chestsOpened: [],
  seed: '',
  settings: { sound: true, haptics: true, theme: 'turquesa', palette: 'vivid' },
  tombstones: {},
  sync: null,
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial,
      setMark: (habitId, date, mark) => {
        const k = key(habitId, date)
        const completions = { ...get().completions }
        const { [k]: _, ...tombstones } = get().tombstones
        if (!mark || (mark.value <= 0 && !mark.min)) {
          if (!completions[k]) return
          delete completions[k]
          tombstones[k] = stamp()
        } else completions[k] = { habitId, date, completedAt: nowLocal(), value: mark.value, ...(mark.min ? { min: true } : {}), updatedAt: stamp() }
        set({ completions, tombstones })
      },
      saveHabit: (h) =>
        set((s) => {
          if (h.id && s.habits.some((x) => x.id === h.id)) {
            return { habits: s.habits.map((x) => (x.id === h.id ? { ...x, ...h, id: x.id, updatedAt: stamp() } : x)) }
          }
          return { habits: [...s.habits, { ...h, id: uid(), order: s.habits.length, createdAt: todayISO(), updatedAt: stamp() }] }
        }),
      addHabits: (hs) => {
        const active = new Set(get().habits.filter((h) => !h.archivedAt && h.templateKey).map((h) => h.templateKey))
        const fresh = hs.filter((h) => !h.templateKey || !active.has(h.templateKey))
        set((s) => ({
          habits: [...s.habits, ...fresh.map((h, i) => ({ ...h, id: uid(), order: s.habits.length + i, createdAt: todayISO(), updatedAt: stamp() }))],
        }))
        return fresh.length
      },
      // archivar en vez de borrar: se conserva el historial
      archiveHabit: (id) => set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, archivedAt: todayISO(), updatedAt: stamp() } : h)) })),
      finishOnboarding: (name, habits, withDemo) => {
        const today = todayISO()
        const from = withDemo ? toISO(subDays(new Date(), 60)) : today
        const hs = habits.map((h, i) => ({ ...h, order: i, createdAt: from }))
        const completions = withDemo ? demoCompletions(hs, from, today) : {}
        // en la demo, los cofres de días anteriores ya están abiertos
        const chestsOpened = withDemo ? [...new Set(Object.values(completions).map((c) => c.date))].filter((d) => d < today) : []
        set({ userName: name.trim() || 'Campeón', onboarded: true, habits: hs, completions, purchases: [], chestsOpened, seed: uid() + uid() })
      },
      setSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),
      buy: (item) => {
        set((s) => ({ purchases: [...s.purchases, { id: uid(), itemId: item.id, cost: item.cost, date: todayISO() }] }))
        if (item.kind === 'theme') get().setSettings({ theme: item.id.replace('theme-', '') as ThemeId })
      },
      openChest: (date) => set((s) => (s.chestsOpened.includes(date) ? s : { chestsOpened: [...s.chestsOpened, date] })),
      exportData: () => {
        const { userName, onboarded, habits, completions, purchases, chestsOpened, seed, settings } = get()
        return { app: 'no-excuses', version: VERSION, exportedAt: new Date().toISOString(), userName, onboarded, habits, completions, purchases, chestsOpened, seed, settings }
      },
      importData: (raw) => {
        const d = raw as Partial<Data> & { app?: string }
        const ok = d && d.app === 'no-excuses' && Array.isArray(d.habits) && typeof d.completions === 'object' && d.completions !== null
        if (!ok) return false
        set({
          userName: String(d.userName ?? 'Campeón'),
          onboarded: true,
          habits: d.habits!.map((h) => ({ ...h, target: h.target ?? 1 })),
          completions: d.completions!,
          purchases: Array.isArray(d.purchases) ? d.purchases : [],
          chestsOpened: Array.isArray(d.chestsOpened) ? d.chestsOpened : [],
          seed: typeof d.seed === 'string' && d.seed ? d.seed : uid() + uid(),
          settings: { ...initial.settings, ...d.settings },
        })
        return true
      },
      reset: () => set(initial),
      setSync: (sync) => set({ sync }),
    }),
    {
      name: 'no-excuses',
      version: VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ userName, onboarded, habits, completions, purchases, chestsOpened, seed, settings, tombstones, sync }) => ({
        userName,
        onboarded,
        habits,
        completions,
        purchases,
        chestsOpened,
        seed,
        settings,
        tombstones,
        sync,
      }),
      migrate: (persisted, version) => {
        const s = persisted as Data
        if (version < 2) {
          s.habits = s.habits.map((h) => ({ ...h, target: h.target ?? 1 }))
          s.purchases = []
          s.settings = { ...initial.settings, ...s.settings }
        }
        if (version < 3) {
          s.chestsOpened = []
          s.seed = uid() + uid()
        }
        if (version < 4) {
          s.tombstones = {}
          s.sync = null
        }
        return s
      },
    },
  ),
)
