import { motion } from 'framer-motion'
import { Archive, X } from 'lucide-react'
import { useState } from 'react'
import type { Difficulty, Habit, HabitColor } from '../core/types'
import { COLORS, HABIT_ICON_CHOICES, iconFor } from '../lib/icons'
import { useStore } from '../lib/store'

const WEEK = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
const DIFFS: { v: Difficulty; label: string; xp: number }[] = [
  { v: 1, label: 'Fácil', xp: 10 },
  { v: 1.5, label: 'Media', xp: 15 },
  { v: 2, label: 'Difícil', xp: 20 },
]

export function HabitSheet({ habit, onClose }: { habit?: Habit; onClose: () => void }) {
  const save = useStore((s) => s.saveHabit)
  const archive = useStore((s) => s.archiveHabit)
  const [name, setName] = useState(habit?.name ?? '')
  const [icon, setIcon] = useState(habit?.icon ?? 'Target')
  const [color, setColor] = useState<HabitColor>(habit?.color ?? 'teal')
  const [difficulty, setDifficulty] = useState<Difficulty>(habit?.difficulty ?? 1)
  const [days, setDays] = useState<number[]>(habit?.days ?? [])
  const [qty, setQty] = useState((habit?.target ?? 1) > 1)
  const [target, setTarget] = useState(habit && habit.target > 1 ? habit.target : 10)
  const [unit, setUnit] = useState(habit?.unit ?? '')
  const [minLabel, setMinLabel] = useState(habit?.minLabel ?? '')
  const [minValue, setMinValue] = useState<number | ''>(habit?.minValue ?? '')
  const [cueAfter, setCueAfter] = useState(habit?.cue?.after ?? '')
  const [cueTime, setCueTime] = useState(habit?.cue?.time ?? '')
  const Icon = iconFor(icon)
  const c = COLORS[color]
  const validMin = minValue !== '' && minValue > 0 && minValue < target

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    save({
      id: habit?.id,
      name: name.trim(),
      icon,
      color,
      difficulty,
      days: days.length === 7 ? [] : days,
      target: qty ? Math.max(2, target) : 1,
      unit: qty ? unit.trim() || undefined : undefined,
      minLabel: !qty && minLabel.trim() ? minLabel.trim() : undefined,
      minValue: qty && validMin ? Number(minValue) : undefined,
      cue: cueAfter.trim() || cueTime ? { after: cueAfter.trim() || undefined, time: cueTime || undefined } : undefined,
    })
    onClose()
  }

  const toggleDay = (d: number) => setDays((ds) => (ds.length === 0 ? [0, 1, 2, 3, 4, 5, 6].filter((x) => x !== d) : ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d].sort()))

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-line bg-card p-5 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{habit ? 'Editar hábito' : 'Nuevo hábito'}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full bg-card-2 text-muted" aria-label="Cerrar">
            <X className="size-4" />
          </button>
        </div>

        {/* vista previa */}
        <div className="mb-5 flex items-center gap-3 rounded-2xl border p-3.5" style={{ borderColor: `${c}55`, background: `${c}12` }}>
          <div className="grid size-12 place-items-center rounded-xl" style={{ background: `${c}22`, color: c }}>
            <Icon className="size-6" />
          </div>
          <div className="font-semibold">{name || 'Nombre del hábito'}</div>
        </div>

        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Nombre</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Leer 10 páginas"
          maxLength={40}
          className="mb-5 w-full rounded-xl border border-line bg-card-2 px-4 py-3 outline-none focus:border-teal"
        />

        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Tu plan (recomendado)</label>
        <p className="mb-2 text-xs text-muted">Atar el hábito a algo que ya haces es lo que más ayuda a cumplirlo. Si lo marcas cerca de esa hora: +5 XP.</p>
        <div className="mb-5 flex items-center gap-2">
          <span className="shrink-0 text-sm text-muted">Después de</span>
          <input
            value={cueAfter}
            onChange={(e) => setCueAfter(e.target.value)}
            placeholder="cenar, tomar el café…"
            maxLength={32}
            aria-label="Después de qué lo harás"
            className="min-w-0 flex-1 rounded-xl border border-line bg-card-2 px-3 py-2.5 outline-none focus:border-teal"
          />
          <input
            type="time"
            value={cueTime}
            onChange={(e) => setCueTime(e.target.value)}
            aria-label="Hora aproximada"
            className="w-28 shrink-0 rounded-xl border border-line bg-card-2 px-2 py-2.5 outline-none [color-scheme:dark] focus:border-teal"
          />
        </div>

        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Tipo</label>
        <div className="mb-3 grid grid-cols-2 gap-2">
          {[
            { v: false, label: 'Sí / No', hint: 'Lo hiciste o no' },
            { v: true, label: 'Cantidad', hint: 'Páginas, vasos, minutos…' },
          ].map((o) => (
            <button
              type="button"
              key={o.label}
              onClick={() => setQty(o.v)}
              className={`rounded-xl border py-2.5 text-sm font-semibold ${qty === o.v ? 'border-teal bg-teal/10 text-teal' : 'border-line text-muted'}`}
            >
              {o.label}
              <div className="text-[11px] font-normal opacity-80">{o.hint}</div>
            </button>
          ))}
        </div>
        {qty && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            <input
              type="number"
              min={2}
              max={999}
              value={target}
              onChange={(e) => setTarget(Math.max(2, Number(e.target.value) || 2))}
              aria-label="Meta diaria"
              className="rounded-xl border border-line bg-card-2 px-4 py-3 outline-none focus:border-teal"
            />
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unidad (páginas)" maxLength={16} className="rounded-xl border border-line bg-card-2 px-4 py-3 outline-none focus:border-teal" />
          </div>
        )}

        <label className="mb-1.5 mt-2 block text-xs font-bold uppercase tracking-wider text-muted">Versión mínima (opcional)</label>
        <p className="mb-2 text-xs text-muted">Para los días difíciles: mantiene tu racha y da la mitad de XP. Nunca cero.</p>
        {qty ? (
          <input
            type="number"
            min={1}
            max={target - 1}
            value={minValue}
            onChange={(e) => setMinValue(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={`Ej. 1 ${unit || 'unidad'}`}
            className={`mb-5 w-full rounded-xl border bg-card-2 px-4 py-3 outline-none focus:border-teal ${minValue !== '' && !validMin ? 'border-coral' : 'border-line'}`}
          />
        ) : (
          <input
            value={minLabel}
            onChange={(e) => setMinLabel(e.target.value)}
            placeholder="Ej. Meditar 5 minutos"
            maxLength={40}
            className="mb-5 w-full rounded-xl border border-line bg-card-2 px-4 py-3 outline-none focus:border-teal"
          />
        )}

        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Icono</label>
        <div className="mb-5 grid grid-cols-8 gap-1.5 sm:grid-cols-10">
          {HABIT_ICON_CHOICES.map((n) => {
            const I = iconFor(n)
            const sel = n === icon
            return (
              <button
                type="button"
                key={n}
                onClick={() => setIcon(n)}
                aria-label={n}
                aria-pressed={sel}
                className="grid aspect-square place-items-center rounded-lg transition-colors"
                style={{ background: sel ? `${c}2a` : '#1C2340', color: sel ? c : '#8A93B0', outline: sel ? `2px solid ${c}` : 'none' }}
              >
                <I className="size-[18px]" />
              </button>
            )
          })}
        </div>

        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Color</label>
        <div className="mb-5 flex flex-wrap gap-2.5">
          {(Object.keys(COLORS) as HabitColor[]).map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setColor(k)}
              aria-label={k}
              aria-pressed={k === color}
              className="size-9 rounded-full transition-transform"
              style={{ background: COLORS[k], transform: k === color ? 'scale(1.15)' : undefined, boxShadow: k === color ? `0 0 0 3px #151A2E, 0 0 0 5px ${COLORS[k]}` : undefined }}
            />
          ))}
        </div>

        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Dificultad</label>
        <div className="mb-5 grid grid-cols-3 gap-2">
          {DIFFS.map((d) => (
            <button
              type="button"
              key={d.v}
              onClick={() => setDifficulty(d.v)}
              className={`rounded-xl border py-2.5 text-sm font-semibold ${difficulty === d.v ? 'border-teal bg-teal/10 text-teal' : 'border-line text-muted'}`}
            >
              {d.label}
              <div className="text-[11px] font-normal opacity-80">{d.xp} XP</div>
            </button>
          ))}
        </div>

        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Días</label>
        <div className="mb-6 flex gap-1.5">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const on = days.length === 0 || days.includes(d)
            return (
              <button
                type="button"
                key={d}
                onClick={() => toggleDay(d)}
                aria-pressed={on}
                className={`flex-1 rounded-lg py-2 text-sm font-bold ${on ? 'bg-teal text-bg' : 'bg-card-2 text-muted'}`}
              >
                {WEEK[d]}
              </button>
            )
          })}
        </div>

        <div className="flex gap-2">
          {habit && (
            <button
              type="button"
              onClick={() => {
                archive(habit.id)
                onClose()
              }}
              className="flex items-center gap-1.5 rounded-xl border border-line px-4 font-semibold text-muted hover:border-coral hover:text-coral"
            >
              <Archive className="size-4" /> Archivar
            </button>
          )}
          <button type="submit" disabled={!name.trim()} className="flex-1 rounded-xl bg-teal py-3.5 font-bold text-bg transition-opacity disabled:opacity-40">
            {habit ? 'Guardar cambios' : 'Crear hábito'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  )
}
