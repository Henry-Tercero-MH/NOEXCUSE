import { create } from 'zustand'
import { key } from '../core/dates'
import { valueOf } from '../core/status'
import type { Completion, Difficulty, Habit, HabitColor, Purchase } from '../core/types'
import { stamp, useStore, type SyncConfig } from './store'

// Sincronización local-first con Google Sheets (vía Apps Script), fuente de datos de AppSheet.
// - La app funciona sin conexión; cada cambio lleva ActualizadoEn (ISO UTC).
// - Un POST envía lo cambiado desde la última sincronización y devuelve la hoja completa.
// - Fusión por fila: gana el ActualizadoEn más reciente.

type Row = Record<string, string | number | boolean>

interface Remote {
  Habitos: Row[]
  Marcas: Row[]
  Compras: Row[]
  Cofres: Row[]
  Perfil: Row[]
}

interface SyncStatus {
  state: 'idle' | 'syncing' | 'ok' | 'error'
  error?: string
  at?: string
}
export const useSyncStatus = create<SyncStatus>(() => ({ state: 'idle' }))

const COLORS: HabitColor[] = ['teal', 'coral', 'green', 'gold', 'violet', 'sky', 'pink', 'orange']
const str = (v: unknown) => (v === undefined || v === null ? '' : String(v))
const num = (v: unknown) => (v === '' || v === undefined || v === null || isNaN(Number(v)) ? undefined : Number(v))

// ---------------------------------------------------------------- mapeo app ⇄ hoja

// `at`: marca de tiempo para filas antiguas sin updatedAt. Debe ser el inicio de la sincronización
// (no "ahora"): si fuera posterior, en la siguiente pasada parecerían cambiadas y se volverían a subir.
function habitToRow(h: Habit, at: string): Row {
  return {
    ID: h.id,
    Nombre: h.name,
    Icono: h.icon,
    Color: h.color,
    Dificultad: h.difficulty,
    Dias: h.days.join(','),
    Meta: h.target ?? 1,
    Unidad: h.unit ?? '',
    VersionMinima: h.minLabel ?? '',
    VersionMinimaCantidad: h.minValue ?? '',
    DespuesDe: h.cue?.after ?? '',
    Hora: h.cue?.time ?? '',
    Plantilla: h.templateKey ?? '',
    Orden: h.order,
    CreadoEl: h.createdAt,
    ArchivadoEl: h.archivedAt ?? '',
    ActualizadoEn: h.updatedAt ?? at,
  }
}

function rowToHabit(r: Row, fallbackOrder: number): Habit {
  const d = num(r.Dificultad) ?? 1
  const after = str(r.DespuesDe)
  const time = str(r.Hora)
  return {
    id: str(r.ID),
    name: str(r.Nombre) || 'Hábito',
    icon: str(r.Icono) || 'Target',
    color: COLORS.includes(r.Color as HabitColor) ? (r.Color as HabitColor) : 'teal',
    difficulty: (d >= 1.75 ? 2 : d >= 1.25 ? 1.5 : 1) as Difficulty,
    days: str(r.Dias)
      .split(',')
      .map((x) => parseInt(x, 10))
      .filter((x) => x >= 0 && x <= 6),
    target: Math.max(1, num(r.Meta) ?? 1),
    unit: str(r.Unidad) || undefined,
    minLabel: str(r.VersionMinima) || undefined,
    minValue: num(r.VersionMinimaCantidad),
    cue: after || time ? { after: after || undefined, time: time || undefined } : undefined,
    templateKey: str(r.Plantilla) || undefined,
    order: num(r.Orden) ?? fallbackOrder,
    createdAt: str(r.CreadoEl) || str(r.ActualizadoEn).slice(0, 10),
    archivedAt: str(r.ArchivadoEl) || undefined,
    updatedAt: str(r.ActualizadoEn) || undefined,
  }
}

function markToRow(c: Completion, at: string, h?: Habit): Row {
  return {
    ID: key(c.habitId, c.date),
    HabitoID: c.habitId,
    Fecha: c.date,
    Valor: h ? valueOf(h, c) : (c.value ?? 1),
    Minimo: !!c.min,
    HechoEn: c.completedAt,
    Eliminado: false,
    ActualizadoEn: c.updatedAt ?? at,
  }
}

function tombstoneToRow(k: string, at: string): Row {
  const [habitId, date] = k.split('|')
  return { ID: k, HabitoID: habitId, Fecha: date, Valor: 0, Minimo: false, HechoEn: '', Eliminado: true, ActualizadoEn: at }
}

function rowToMark(r: Row): Completion {
  const date = str(r.Fecha)
  return {
    habitId: str(r.HabitoID),
    date,
    completedAt: str(r.HechoEn) || `${date}T12:00:00`,
    value: num(r.Valor), // vacío (alta desde AppSheet) = completo
    min: r.Minimo === true || undefined,
    updatedAt: str(r.ActualizadoEn) || undefined,
  }
}

const purchaseId = (p: Purchase, i: number) => p.id ?? `${p.date}-${p.itemId}-${i}`

// ---------------------------------------------------------------- red

async function request(cfg: SyncConfig, body?: object): Promise<Remote> {
  const res = body
    ? await fetch(cfg.url, {
        method: 'POST',
        // text/plain evita la petición previa CORS, que Apps Script no admite
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ token: cfg.token, ...body }),
      })
    : await fetch(`${cfg.url}?token=${encodeURIComponent(cfg.token)}`)
  if (!res.ok) throw new Error(`El servidor respondió ${res.status}`)
  const json = (await res.json()) as { ok: boolean; error?: string; data?: Remote }
  if (!json.ok || !json.data) throw new Error(json.error ?? 'Respuesta inválida')
  return json.data
}

/** Prueba la conexión y devuelve un resumen de lo que hay en la hoja. */
export async function testConnection(cfg: SyncConfig) {
  const data = await request(cfg)
  const profile = Object.fromEntries(data.Perfil.map((r) => [str(r.Clave), str(r.Valor)]))
  return { habits: data.Habitos.length, marks: data.Marcas.filter((m) => m.Eliminado !== true).length, userName: profile.userName }
}

// ---------------------------------------------------------------- sincronización

let applying = false
let running: Promise<void> | null = null

export function syncNow(): Promise<void> {
  if (running) return running
  running = doSync().finally(() => (running = null))
  return running
}

async function doSync() {
  const s = useStore.getState()
  const cfg = s.sync
  if (!cfg) return
  const since = cfg.lastSync ?? ''
  const started = stamp()
  useSyncStatus.setState({ state: 'syncing', error: undefined })

  const byId = new Map(s.habits.map((h) => [h.id, h]))
  const changed = (t?: string) => !since || (t ?? '') > since
  const body = {
    habits: s.habits.filter((h) => changed(h.updatedAt)).map((h) => habitToRow(h, started)),
    marks: [
      ...Object.values(s.completions)
        .filter((c) => changed(c.updatedAt))
        .map((c) => markToRow(c, started, byId.get(c.habitId))),
      ...Object.entries(s.tombstones)
        .filter(([, t]) => changed(t))
        .map(([k, t]) => tombstoneToRow(k, t)),
    ],
    purchases: s.purchases.map((p, i) => ({ ID: purchaseId(p, i), Articulo: p.itemId, Costo: p.cost, Fecha: p.date })),
    chests: s.chestsOpened,
    profile: { userName: s.userName, seed: s.seed },
    keepProfile: true, // si la hoja ya tiene perfil (otro dispositivo), se respeta el suyo
  }

  try {
    const remote = await request(cfg, body)
    merge(remote, since)
    const sync = useStore.getState().sync
    if (sync) useStore.getState().setSync({ ...sync, lastSync: started })
    useSyncStatus.setState({ state: 'ok', at: new Date().toISOString() })
  } catch (e) {
    useSyncStatus.setState({ state: 'error', error: e instanceof Error ? e.message : String(e) })
  }
}

function merge(remote: Remote, since: string) {
  const s = useStore.getState()

  // hábitos
  const habits = new Map(s.habits.map((h) => [h.id, h]))
  remote.Habitos.forEach((r, i) => {
    const rh = rowToHabit(r, s.habits.length + i)
    if (!rh.id) return
    const local = habits.get(rh.id)
    if (!local || (rh.updatedAt ?? '') > (local.updatedAt ?? '')) habits.set(rh.id, rh)
  })

  // marcas
  const completions = { ...s.completions }
  const tombstones = { ...s.tombstones }
  const remoteKeys = new Set<string>()
  for (const r of remote.Marcas) {
    const m = rowToMark(r)
    if (!m.habitId || !m.date) continue
    const k = key(m.habitId, m.date)
    remoteKeys.add(k)
    const localT = completions[k]?.updatedAt ?? tombstones[k] ?? ''
    if ((m.updatedAt ?? '') <= localT && (completions[k] || tombstones[k])) continue
    if (r.Eliminado === true) {
      delete completions[k]
      tombstones[k] = m.updatedAt ?? stamp()
    } else {
      completions[k] = m
      delete tombstones[k]
    }
  }
  // filas borradas a mano en la hoja/AppSheet: si ya estaban sincronizadas, se borran aquí también
  if (since) {
    for (const [k, c] of Object.entries(completions)) {
      if (!remoteKeys.has(k) && (c.updatedAt ?? '') <= since) delete completions[k]
    }
  }

  // compras y cofres: unión
  const purchases = [...s.purchases]
  const have = new Set(purchases.map(purchaseId))
  for (const r of remote.Compras) {
    if (have.has(str(r.ID))) continue
    purchases.push({ id: str(r.ID), itemId: str(r.Articulo), cost: num(r.Costo) ?? 0, date: str(r.Fecha) })
  }
  const chestsOpened = [...new Set([...s.chestsOpened, ...remote.Cofres.map((r) => str(r.Fecha)).filter(Boolean)])]

  // perfil compartido: la semilla debe ser la misma en todos los dispositivos (cofres idénticos)
  const profile = Object.fromEntries(remote.Perfil.map((r) => [str(r.Clave), str(r.Valor)]))

  applying = true
  useStore.setState({
    habits: [...habits.values()].sort((a, b) => a.order - b.order),
    completions,
    tombstones,
    purchases: purchases.sort((a, b) => a.date.localeCompare(b.date)),
    chestsOpened,
    ...(profile.seed ? { seed: profile.seed } : {}),
    ...(profile.userName ? { userName: profile.userName } : {}),
  })
  applying = false
}

// ---------------------------------------------------------------- automático

let started = false

/** Sincroniza 2,5 s después de cada cambio, al volver a la pestaña y cada 2 minutos. */
export function startAutoSync() {
  if (started) return
  started = true
  let timer: number | undefined
  const schedule = (ms: number) => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      if (useStore.getState().sync && navigator.onLine !== false) syncNow()
    }, ms)
  }
  useStore.subscribe((st, prev) => {
    if (applying || !st.sync) return
    if (st.habits !== prev.habits || st.completions !== prev.completions || st.tombstones !== prev.tombstones || st.purchases !== prev.purchases || st.chestsOpened !== prev.chestsOpened) {
      schedule(2500)
    }
    if (st.sync && !prev.sync) schedule(0) // recién conectado
  })
  window.addEventListener('focus', () => schedule(300))
  window.addEventListener('online', () => schedule(300))
  window.setInterval(() => schedule(0), 120_000)
  schedule(500)
}
