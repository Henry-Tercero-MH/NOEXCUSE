import { endOfMonth, format, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { Coffee, Coins, Crown, Feather, Flame, Gauge, Gift, LibraryBig, Plus, Settings, Snowflake, Sparkles, Target, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { eachDay, key, toISO } from '../core/dates'
import { XP } from '../core/levels'
import { scheduledHabits } from '../core/progress'
import { chestReward } from '../core/rewards'
import { counts, hasMin, statusOf } from '../core/status'
import type { Habit } from '../core/types'
import { HabitCard } from '../components/HabitCard'
import { MonthTracker } from '../components/MonthTracker'
import { Ring } from '../components/Ring'
import { XpBar } from '../components/XpBar'
import { feedback } from '../lib/feedback'
import { iconFor } from '../lib/icons'
import { useStore } from '../lib/store'
import { useProgress, useTheme } from '../lib/useProgress'

const greeting = (h: number) => (h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches')
const SILVER = '#CBD5E1'

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])
  return now
}

export function Today({ onEdit, onShop, onSettings, onLibrary }: { onEdit: (h?: Habit) => void; onShop: () => void; onSettings: () => void; onLibrary: () => void }) {
  const { today, progress, level, achievements, coins } = useProgress()
  const theme = useTheme()
  const habits = useStore((s) => s.habits)
  const completions = useStore((s) => s.completions)
  const userName = useStore((s) => s.userName)
  const setMark = useStore((s) => s.setMark)
  const now = useNow()

  // Tras marcar, la tarjeta se queda en su sitio ~700 ms para que la recompensa se vea
  // antes de moverse a "Completados".
  const [settling, setSettling] = useState<Record<string, 'pending' | 'done'>>({})
  const timers = useRef<Record<string, number>>({})

  const list = scheduledHabits(habits, today).sort((a, b) => a.order - b.order)
  const isDone = (h: Habit) => counts(statusOf(h, completions[key(h.id, today)]))
  const placed = (h: Habit) => settling[h.id] ?? (isDone(h) ? 'done' : 'pending')
  const pending = list.filter((h) => placed(h) === 'pending')
  const done = list.filter((h) => placed(h) === 'done')
  const doneCount = list.filter(isDone).length

  const day = progress.byDate[today]
  const perfect = day?.perfect ?? false
  const complete = day?.complete ?? false
  const pct = day?.pct ?? 0
  const remaining = list.length - doneCount

  // Recordatorio amable (sin cuenta atrás ni rojo): por la tarde, si aún no hay nada hecho
  const hour = now.getHours()
  const nudgeHabit = list.find((h) => hasMin(h)) ?? list[0]
  const showNudge = doneCount === 0 && list.length > 0 && hour >= 18 && hour < 23

  const nextGoal = achievements.filter((a) => !a.unlocked).sort((a, b) => b.current / b.goal - a.current / a.goal)[0]

  const mark = (h: Habit, m: { value: number; min?: boolean } | null) => {
    const from = isDone(h) ? 'done' : 'pending'
    setSettling((s) => ({ ...s, [h.id]: from }))
    window.clearTimeout(timers.current[h.id])
    timers.current[h.id] = window.setTimeout(() => setSettling(({ [h.id]: _, ...rest }) => rest), 700)
    setMark(h.id, today, m)
  }

  const card = (h: Habit) => (
    <HabitCard
      key={h.id}
      habit={h}
      completion={completions[key(h.id, today)]}
      multiplier={progress.multiplier}
      nth={day?.full ?? 0}
      onMark={(m) => mark(h, m)}
      onEdit={() => onEdit(h)}
    />
  )

  const dateLabel = format(now, "EEEE d 'de' MMMM", { locale: es })
  const monthDays = eachDay(toISO(startOfMonth(now)), toISO(endOfMonth(now)))
  const ringColor = perfect ? '#FFD600' : complete ? SILVER : theme.color

  return (
    <div className="space-y-4">
      {/* Encabezado: solo saludo y racha */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            ¡{greeting(hour)}, {userName}!
          </h1>
          <p className="mt-0.5 text-sm font-medium text-muted">{dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <motion.div
            key={progress.streak}
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 rounded-full border border-coral/40 bg-coral/10 px-3 py-1.5 text-base font-extrabold text-coral"
            title="Días seguidos con al menos un hábito"
          >
            <Flame className="size-4" fill="currentColor" strokeWidth={2} />
            <span className="tabular">{progress.streak}</span>
            <span className="text-xs font-semibold">días</span>
          </motion.div>
          <button onClick={onSettings} className="grid size-9 place-items-center rounded-full bg-card text-muted hover:text-white md:hidden" aria-label="Ajustes">
            <Settings className="size-4" />
          </button>
        </div>
      </header>

      <XpBar level={level} from={theme.from} to={theme.to} gained={day?.xp ?? 0}>
        <span className="inline-flex items-center gap-1" title={`Constancia de los últimos 28 días: ${Math.round(progress.consistency * 100)} %. A más constancia, más XP (no depende de la racha).`}>
          <Gauge className="size-3.5 text-gold" /> x{progress.multiplier.toFixed(1)} XP
        </span>
        <span className="inline-flex items-center gap-1" title="Congeladores: protegen tu racha si un día no puedes">
          <Snowflake className="size-3.5 text-ice" /> {progress.freezes}
        </span>
        <button onClick={onShop} className="inline-flex items-center gap-1 hover:text-white" title="XP disponible para la tienda">
          <Coins className="size-3.5 text-gold" /> <span className="tabular">{coins.toLocaleString('es')}</span>
        </button>
      </XpBar>

      {/* Recordatorio amable */}
      <AnimatePresence>
        {showNudge && nudgeHabit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3.5 text-sm"
          >
            <Feather className="size-5 shrink-0 text-teal" />
            <div>
              <b>Aún estás a tiempo.</b>{' '}
              <span className="text-muted">
                {hasMin(nudgeHabit)
                  ? `Haz la versión mínima de "${nudgeHabit.name}": ${nudgeHabit.minLabel ?? `${nudgeHabit.minValue} ${nudgeHabit.unit ?? ''}`}. Con eso basta hoy.`
                  : `Un solo hábito mantiene tu racha de ${progress.streak} días.`}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Anillo del día */}
      <section className={`relative overflow-hidden rounded-3xl border bg-card p-5 transition-all ${perfect ? 'border-gold/50 glow-gold' : complete ? 'border-white/25' : 'border-line'}`}>
        {(perfect || complete) && <div className="pointer-events-none absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full blur-3xl" style={{ background: `${ringColor}22` }} />}
        <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
          <div className="sm:hidden">
            <DayRing size={164} stroke={12} {...{ list, pct, ringColor, perfect, complete, doneCount }} />
          </div>
          <div className="hidden sm:block">
            <DayRing size={196} stroke={14} {...{ list, pct, ringColor, perfect, complete, doneCount }} />
          </div>
          <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:grid-cols-1">
            <MiniStat icon={Zap} color="#2EE6C8" label="XP hoy" value={`+${day?.xp ?? 0}`} />
            <MiniStat icon={Gauge} color="#FFD600" label="Constancia 28 d" value={`${Math.round(progress.consistency * 100)}%`} />
            <MiniStat icon={Sparkles} color="#2EE66B" label="Días perfectos" value={progress.perfectDays} />
          </div>
        </div>
        {list.length > 0 && !perfect && (
          <p className="relative mt-4 text-center text-xs text-muted">
            {complete ? (
              <>
                ¡Día completo! Haz todo al 100 % y súbelo a <b className="text-gold">perfecto (+{XP.perfectDay} XP)</b>
              </>
            ) : remaining === 1 ? (
              <>
                <b className="text-white">Te falta 1</b> para el día completo <b style={{ color: SILVER }}>(+{XP.completeDay} XP)</b>
              </>
            ) : (
              <>
                Todo hecho (mínimos incluidos): <b style={{ color: SILVER }}>+{XP.completeDay} XP</b> · todo al 100 %: <b className="text-gold">+{XP.perfectDay} XP</b>
              </>
            )}
          </p>
        )}
      </section>

      {/* Lista de hábitos */}
      <section className="space-y-2.5">
        {list.length === 0 && habits.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line p-8 text-center">
            <Target className="mx-auto size-10 text-teal" />
            <p className="mt-2 font-semibold">Aún no tienes hábitos</p>
            <p className="text-sm text-muted">Elige un paquete de la biblioteca o crea el tuyo. Empieza con 3.</p>
          </div>
        )}
        {pending.length > 0 && <SectionTitle>Pendientes · {pending.length}</SectionTitle>}
        {pending.map(card)}
        {done.length > 0 && <SectionTitle>Completados · {done.length}</SectionTitle>}
        {done.map(card)}
      </section>

      {/* el mismo seguimiento del mes que en la pestaña Mes */}
      {habits.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>Tu mes · {format(now, 'MMMM', { locale: es })}</SectionTitle>
          <MonthTracker days={monthDays} compact />
        </section>
      )}

      {list.length > 0 && <ChestCard today={today} unlocked={doneCount > 0} />}

      {nextGoal && <NextAchievement title={nextGoal.title} description={nextGoal.description} icon={nextGoal.icon} current={nextGoal.current} goal={nextGoal.goal} />}

      <div className="grid grid-cols-2 gap-2.5">
        <button onClick={onLibrary} className="flex items-center justify-center gap-2 rounded-2xl border border-gold/30 bg-gold/5 p-4 text-sm font-semibold text-gold transition-colors hover:bg-gold/10">
          <LibraryBig className="size-4" /> Biblioteca
        </button>
        <button
          onClick={() => onEdit()}
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-line p-4 text-sm font-semibold text-muted transition-colors hover:border-teal/60 hover:text-teal"
        >
          <Plus className="size-4" /> Crear propio
        </button>
      </div>
    </div>
  )
}

function DayRing({ size, stroke, list, pct, ringColor, perfect, complete, doneCount }: { size: number; stroke: number; list: Habit[]; pct: number; ringColor: string; perfect: boolean; complete: boolean; doneCount: number }) {
  return (
    <Ring value={pct} size={size} stroke={stroke} color={ringColor} glow={perfect || complete}>
      {list.length === 0 ? (
        <div>
          <Coffee className="mx-auto size-8 text-muted" />
          <div className="mt-1 text-sm font-semibold">Día libre</div>
        </div>
      ) : (
        <div>
          {(perfect || complete) && <Crown className="mx-auto mb-1 size-6" style={{ color: ringColor }} fill="currentColor" />}
          <div className="tabular text-[40px] font-extrabold leading-none tracking-tight">
            {doneCount}
            <span className="text-muted"> / {list.length}</span>
          </div>
          <div className="mt-1.5 text-sm font-semibold" style={{ color: ringColor }}>
            {perfect ? '¡Día perfecto!' : complete ? '¡Día completo!' : `${Math.round(pct * 100)}% del día`}
          </div>
        </div>
      )}
    </Ring>
  )
}

/** Cofre de cierre: una recompensa variable al día, se desbloquea con el primer hábito. */
function ChestCard({ today, unlocked }: { today: string; unlocked: boolean }) {
  const opened = useStore((s) => s.chestsOpened.includes(today))
  const seed = useStore((s) => s.seed)
  const openChest = useStore((s) => s.openChest)
  const reward = chestReward(today, seed)
  const rarityColor = { común: '#8A93B0', rara: '#7DD3FC', épica: '#A78BFA', legendaria: '#FFD600' }[reward.rarity]

  const open = () => {
    openChest(today)
    if (reward.rarity === 'común') feedback.check(4)
    else feedback.achievement()
  }

  return (
    <div className={`flex items-center gap-3.5 rounded-2xl border p-3.5 ${unlocked && !opened ? 'border-gold/40 bg-gold/5' : 'border-line bg-card'}`}>
      <motion.div
        className="grid size-12 shrink-0 place-items-center rounded-xl"
        style={{ background: opened ? `${rarityColor}22` : unlocked ? '#FFD60022' : '#1C2340', color: opened ? rarityColor : unlocked ? '#FFD600' : '#5B6488' }}
        animate={unlocked && !opened ? { rotate: [0, -8, 8, -5, 5, 0] } : { rotate: 0 }}
        transition={unlocked && !opened ? { duration: 0.7, repeat: Infinity, repeatDelay: 2.5 } : undefined}
      >
        {opened && reward.kind === 'freeze' ? <Snowflake className="size-6" /> : <Gift className="size-6" />}
      </motion.div>
      <div className="min-w-0 flex-1">
        <div className="font-bold">Cofre del día</div>
        <AnimatePresence mode="wait">
          {opened ? (
            <motion.div key="r" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-sm">
              <b style={{ color: rarityColor }}>{reward.kind === 'freeze' ? 'Congelador de racha' : `+${reward.amount} XP`}</b>
              <span className="text-muted"> · recompensa {reward.rarity}. Vuelve mañana por otro.</span>
            </motion.div>
          ) : (
            <motion.div key="t" className="text-sm text-muted">
              {unlocked ? 'Listo para abrir. Puede traer XP extra, un congelador o un premio legendario.' : 'Completa tu primer hábito de hoy para desbloquearlo.'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {unlocked && !opened && (
        <motion.button whileTap={{ scale: 0.9 }} onClick={open} className="shrink-0 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-bg">
          Abrir
        </motion.button>
      )}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="px-1 pt-2 text-xs font-bold uppercase tracking-wider text-muted">{children}</h2>
}

function MiniStat({ icon: Icon, color, label, value }: { icon: typeof Zap; color: string; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-card-2 px-3 py-2.5 sm:flex-row sm:gap-3 sm:px-4">
      <Icon className="size-5" style={{ color }} />
      <div className="text-center sm:text-left">
        <div className="tabular text-lg font-extrabold leading-none">{value}</div>
        <div className="mt-0.5 text-[11px] text-muted">{label}</div>
      </div>
    </div>
  )
}

function NextAchievement({ title, description, icon, current, goal }: { title: string; description: string; icon: string; current: number; goal: number }) {
  const Icon = iconFor(icon)
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-card p-3.5">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold">
            Próximo logro: <span className="text-gold">{title}</span>
          </span>
          <span className="tabular text-xs text-muted">
            {current}/{goal}
          </span>
        </div>
        <div className="truncate text-xs text-muted">{description}</div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-card-2">
          <div className="h-full rounded-full bg-gold" style={{ width: `${(current / goal) * 100}%` }} />
        </div>
      </div>
    </div>
  )
}
