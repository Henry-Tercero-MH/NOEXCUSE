import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { eachDay, fromISO, key, toISO } from '../core/dates'
import { isScheduled } from '../core/progress'
import { counts, statusOf } from '../core/status'
import { Medal } from '../components/Medal'
import { Ring } from '../components/Ring'
import { COLORS, iconFor } from '../lib/icons'
import { useStore } from '../lib/store'
import { useProgress } from '../lib/useProgress'

const RANGES = [7, 30, 90] as const

export function Stats({ onSeeAchievements }: { onSeeAchievements: () => void }) {
  const { today, progress, achievements } = useProgress()
  const habits = useStore((s) => s.habits)
  const completions = useStore((s) => s.completions)
  const [range, setRange] = useState<(typeof RANGES)[number]>(30)

  const days = eachDay(toISO(subDays(fromISO(today), range - 1)), today).filter((d) => progress.byDate[d])
  const done = days.reduce((s, d) => s + progress.byDate[d].done, 0)
  const sched = days.reduce((s, d) => s + progress.byDate[d].scheduled, 0)
  const pct = sched ? done / sched : 0

  const series = days.map((d) => ({
    date: d,
    label: format(fromISO(d), 'd MMM', { locale: es }),
    pct: Math.round(progress.byDate[d].pct * 100),
  }))

  const perHabit = habits
    .filter((h) => !h.archivedAt)
    .map((h) => {
      const s = days.filter((d) => isScheduled(h, d))
      return { h, done: s.filter((d) => counts(statusOf(h, completions[key(h.id, d)]))).length, total: s.length }
    })
    .sort((a, b) => b.done / (b.total || 1) - a.done / (a.total || 1))

  const medals = [...achievements].sort((a, b) => Number(b.unlocked) - Number(a.unlocked)).slice(0, 4)
  const fmt = (n: number) => n.toLocaleString('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  if (days.length < 2) {
    return (
      <div className="rounded-3xl border border-dashed border-line p-10 text-center">
        <p className="text-lg font-bold">Vuelve en un par de días</p>
        <p className="text-sm text-muted">Tus estadísticas aparecerán en cuanto tengas algo de historial.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Estadísticas</h1>
        <div className="flex rounded-xl bg-card p-1 text-xs font-bold" role="tablist">
          {RANGES.map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={range === r}
              onClick={() => setRange(r)}
              className={`relative rounded-lg px-3 py-1.5 ${range === r ? 'bg-teal text-bg' : 'text-muted hover:text-white'}`}
            >
              <span className="relative">{r} d</span>
            </button>
          ))}
        </div>
      </header>

      {/* Progreso general */}
      <section className="flex flex-col items-center gap-5 rounded-3xl border border-line bg-card p-5 sm:flex-row sm:justify-around">
        <Ring value={pct} size={180} stroke={14}>
          <div>
            <div className="text-xs font-semibold text-muted">Progreso general</div>
            <div className="tabular text-4xl font-black">{fmt(pct * 100)}%</div>
          </div>
        </Ring>
        <div className="w-full max-w-xs space-y-3">
          <p className="text-center text-sm text-muted sm:text-left">
            <b className="tabular text-white">
              {done} / {sched}
            </b>{' '}
            hábitos completados
          </p>
          <table className="w-full overflow-hidden rounded-xl text-sm">
            <tbody>
              <Row label="% Completado" value={`${fmt(pct * 100)}%`} color="#2EE6C8" />
              <Row label="Completados" value={done} color="#2EE66B" />
              <Row label="Incompletos" value={sched - done} color="#FF6B5B" />
              <Row label="Mejor racha" value={`${progress.bestStreak} días`} color="#FFD600" />
            </tbody>
          </table>
        </div>
      </section>

      {/* Progreso diario */}
      <section className="rounded-3xl border border-line bg-card p-5">
        <h2 className="mb-3 font-bold">Progreso diario</h2>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2EE6C8" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#2EE6C8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#262E4D" strokeDasharray="3 6" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#8A93B0', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fill: '#8A93B0', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                cursor={{ stroke: '#2EE6C8', strokeOpacity: 0.4 }}
                contentStyle={{ background: '#1C2340', border: '1px solid #262E4D', borderRadius: 12, color: '#E8ECF8', fontSize: 12 }}
                labelStyle={{ color: '#8A93B0' }}
                formatter={(v) => [`${v}%`, 'Completado']}
              />
              <Area isAnimationActive={false} type="monotone" dataKey="pct" stroke="#2EE6C8" strokeWidth={2} fill="url(#area)" activeDot={{ r: 5, stroke: '#151A2E', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Por hábito */}
      <section className="rounded-3xl border border-line bg-card p-5">
        <h2 className="mb-4 font-bold">Por hábito</h2>
        <div className="space-y-3.5">
          {perHabit.map(({ h, done, total }) => {
            const Icon = iconFor(h.icon)
            return (
              <div key={h.id} title={`${h.name}: ${done} de ${total}`}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon className="size-4 shrink-0" style={{ color: COLORS[h.color] }} />
                    <span className="truncate">{h.name}</span>
                  </span>
                  <span className="tabular shrink-0 font-bold">
                    {done} <span className="text-muted">/ {total}</span>
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-card-2">
                  <motion.div
                    className="h-full rounded-full bg-coral"
                    initial={{ width: 0 }}
                    animate={{ width: `${total ? (done / total) * 100 : 0}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Logros */}
      <section className="rounded-3xl border border-line bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">Logros</h2>
          <button onClick={onSeeAchievements} className="text-sm font-semibold text-teal hover:underline">
            Ver todos
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {medals.map((a) => (
            <Medal key={a.id} a={a} size="sm" />
          ))}
        </div>
      </section>
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <tr className="border-b border-line/60 last:border-0">
      <td className="py-2 text-muted">
        <span className="mr-2 inline-block size-2 rounded-full" style={{ background: color }} />
        {label}
      </td>
      <td className="tabular py-2 text-right font-bold">{value}</td>
    </tr>
  )
}
