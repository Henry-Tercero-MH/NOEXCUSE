import { Shield } from 'lucide-react'
import { RANKS } from '../core/levels'
import { Medal } from '../components/Medal'
import { useProgress } from '../lib/useProgress'

export function Achievements() {
  const { achievements, level } = useProgress()
  const unlocked = achievements.filter((a) => a.unlocked).length

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Logros</h1>
        <p className="text-sm text-muted">
          <b className="text-gold">{unlocked}</b> de {achievements.length} desbloqueados
        </p>
      </header>

      <section className="grid grid-cols-2 gap-x-3 gap-y-6 rounded-3xl border border-line bg-card p-5 sm:grid-cols-3 lg:grid-cols-4">
        {[...achievements]
          .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || b.current / b.goal - a.current / a.goal)
          .map((a) => (
            <Medal key={a.id} a={a} />
          ))}
      </section>

      <section className="rounded-3xl border border-line bg-card p-5">
        <h2 className="mb-4 font-bold">Rangos</h2>
        <ol className="space-y-2">
          {RANKS.map((r, i) => {
            const reached = level.level >= r.from
            const current = reached && (RANKS[i + 1]?.from ?? Infinity) > level.level
            return (
              <li
                key={r.name}
                className={`flex items-center gap-3 rounded-xl p-2.5 ${current ? 'bg-card-2 ring-1' : ''}`}
                style={current ? { ['--tw-ring-color' as string]: r.color } : undefined}
              >
                <div className="grid size-9 place-items-center rounded-lg" style={{ background: reached ? `${r.color}22` : '#1C2340', color: reached ? r.color : '#3A4470' }}>
                  <Shield className="size-5" fill={reached ? 'currentColor' : 'none'} fillOpacity={0.25} />
                </div>
                <div className="flex-1">
                  <div className={`font-semibold ${reached ? '' : 'text-muted'}`}>{r.name}</div>
                  <div className="text-xs text-muted">Desde el nivel {r.from}</div>
                </div>
                {current && <span className="rounded-full px-2 py-0.5 text-xs font-bold text-bg" style={{ background: r.color }}>Actual</span>}
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
