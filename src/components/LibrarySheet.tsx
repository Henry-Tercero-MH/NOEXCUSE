import { AnimatePresence, motion } from 'framer-motion'
import { Check, Feather, Plus, TriangleAlert, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CATEGORIES, LIBRARY, PACKS, fromTemplate, templateByKey, type CategoryId, type Template } from '../core/library'
import { feedback } from '../lib/feedback'
import { COLORS, iconFor } from '../lib/icons'
import { useStore } from '../lib/store'

const WEEK = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
const daysLabel = (d: number[]) => (d.length === 0 ? 'Diario' : d.length === 5 && !d.includes(0) && !d.includes(6) ? 'Lun-Vie' : d.map((x) => WEEK[x]).join(' '))

export function LibrarySheet({ onClose }: { onClose: () => void }) {
  const habits = useStore((s) => s.habits)
  const addHabits = useStore((s) => s.addHabits)
  const [cat, setCat] = useState<CategoryId | 'all'>('all')
  const [toast, setToast] = useState<string | null>(null)

  const activeKeys = useMemo(() => new Set(habits.filter((h) => !h.archivedAt && h.templateKey).map((h) => h.templateKey)), [habits])
  const activeCount = habits.filter((h) => !h.archivedAt).length
  const list = cat === 'all' ? LIBRARY : LIBRARY.filter((x) => x.category === cat)

  const add = (ts: Template[]) => {
    const n = addHabits(ts.map(fromTemplate))
    if (!n) return
    feedback.check(n)
    setToast(n === 1 ? 'Hábito añadido' : `${n} hábitos añadidos`)
    setTimeout(() => setToast(null), 2200)
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-line bg-bg sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Biblioteca de hábitos</h2>
            <p className="text-sm text-muted">Lo que practican las personas disciplinadas y de alto rendimiento.</p>
          </div>
          <button onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-full bg-card text-muted" aria-label="Cerrar">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Paquetes */}
          <section>
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted">Paquetes</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {PACKS.map((p) => {
                const PIcon = iconFor(p.icon)
                const ts = p.keys.map(templateByKey)
                const pending = ts.filter((x) => !activeKeys.has(x.key))
                return (
                  <div key={p.id} className="relative overflow-hidden rounded-2xl border border-line bg-card p-4">
                    <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full opacity-25 blur-2xl" style={{ background: p.color }} />
                    <div className="relative flex items-center gap-3">
                      <div className="grid size-11 place-items-center rounded-xl" style={{ background: `${p.color}22`, color: p.color }}>
                        <PIcon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold">{p.name}</div>
                        <div className="text-xs text-muted">{p.description}</div>
                      </div>
                    </div>
                    <div className="relative mt-3 flex gap-1.5">
                      {ts.map((x) => {
                        const I = iconFor(x.icon)
                        const on = activeKeys.has(x.key)
                        return (
                          <span key={x.key} title={x.name} className="grid size-7 place-items-center rounded-lg" style={{ background: on ? `${COLORS[x.color]}33` : '#1C2340', color: COLORS[x.color] }}>
                            <I className="size-3.5" />
                          </span>
                        )
                      })}
                    </div>
                    <button
                      disabled={pending.length === 0}
                      onClick={() => add(pending)}
                      className="relative mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-opacity disabled:bg-card-2 disabled:text-muted"
                      style={pending.length ? { background: `${p.color}1f`, color: p.color } : undefined}
                    >
                      {pending.length === 0 ? (
                        <>
                          <Check className="size-4" /> Paquete activo
                        </>
                      ) : (
                        <>
                          <Plus className="size-4" /> Añadir {pending.length === ts.length ? 'paquete' : `${pending.length} restantes`}
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Categorías */}
          <section>
            <div className="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5">
              {[{ id: 'all' as const, name: 'Todos', icon: 'Sparkles' }, ...CATEGORIES].map((c) => {
                const CIcon = iconFor(c.icon)
                const on = cat === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setCat(c.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${on ? 'border-teal bg-teal/10 text-teal' : 'border-line text-muted hover:text-white'}`}
                  >
                    <CIcon className="size-4" /> {c.name}
                  </button>
                )
              })}
            </div>

            <div className="space-y-2">
              {list.map((x) => {
                const I = iconFor(x.icon)
                const c = COLORS[x.color]
                const on = activeKeys.has(x.key)
                return (
                  <motion.div layout key={x.key} className="flex items-start gap-3 rounded-2xl border border-line bg-card p-3.5">
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: `${c}1f`, color: c }}>
                      <I className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold leading-snug">
                        {x.name}
                        {x.target > 1 && (
                          <span className="text-muted">
                            {' '}
                            · {x.target} {x.unit}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs leading-snug text-muted">{x.why}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                        <span className="rounded-full bg-card-2 px-2 py-0.5 text-muted">{daysLabel(x.days)}</span>
                        <span className="rounded-full bg-card-2 px-2 py-0.5 text-muted">{{ 1: 'Fácil', 1.5: 'Media', 2: 'Difícil' }[x.difficulty]}</span>
                        {(x.minLabel || x.minValue) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-card-2 px-2 py-0.5" style={{ color: c }}>
                            <Feather className="size-3" /> Mínimo: {x.minLabel ?? `${x.minValue} ${x.unit}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      disabled={on}
                      onClick={() => add([x])}
                      aria-label={on ? `${x.name} ya añadido` : `Añadir ${x.name}`}
                      className="grid size-10 shrink-0 place-items-center rounded-full border-2 transition-colors"
                      style={on ? { background: c, borderColor: c, color: '#0B0E1A' } : { borderColor: '#3A4470', color: c }}
                    >
                      {on ? <Check className="size-5" strokeWidth={3} /> : <Plus className="size-5" />}
                    </motion.button>
                  </motion.div>
                )
              })}
            </div>
          </section>
        </div>

        <div className="border-t border-line p-4">
          {activeCount > 8 ? (
            <p className="flex items-start gap-2 text-xs text-coral">
              <TriangleAlert className="size-4 shrink-0" />
              Tienes {activeCount} hábitos activos. Es mejor cumplir 5 al 100% que 12 a medias: archiva los que no sean prioridad.
            </p>
          ) : (
            <p className="text-center text-xs text-muted">
              {activeCount} hábitos activos · Consejo: empieza con 3 a 6 y añade más cuando sean automáticos.
            </p>
          )}
        </div>

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 bottom-20 mx-auto flex w-fit items-center gap-2 rounded-full bg-teal px-4 py-2 text-sm font-bold text-bg shadow-lg"
            >
              <Check className="size-4" strokeWidth={3} /> {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
