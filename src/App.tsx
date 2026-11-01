import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, CalendarDays, Flame, House, Settings, Shield, ShoppingBag, Trophy, Volume2, VolumeX, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Habit } from './core/types'
import { HabitSheet } from './components/HabitSheet'
import { LibrarySheet } from './components/LibrarySheet'
import { SettingsSheet } from './components/SettingsSheet'
import { feedback } from './lib/feedback'
import { applyPalette, iconFor } from './lib/icons'
import { SUGGESTED, useStore } from './lib/store'
import { todayISO } from './core/dates'
import { useProgress } from './lib/useProgress'
import { Achievements } from './screens/Achievements'
import { Month } from './screens/Month'
import { Onboarding } from './screens/Onboarding'
import { Shop } from './screens/Shop'
import { Stats } from './screens/Stats'
import { Today } from './screens/Today'

type Tab = 'today' | 'month' | 'stats' | 'achievements' | 'shop'
const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  // el seguimiento del mes es la pantalla principal: abrir y marcar, sin pasos extra
  { id: 'month', label: 'Mes', icon: CalendarDays },
  { id: 'today', label: 'Hoy', icon: House },
  { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
  { id: 'achievements', label: 'Logros', icon: Trophy },
  { id: 'shop', label: 'Tienda', icon: ShoppingBag },
]

// ?demo carga datos de ejemplo directamente (útil para enseñar la app)
const params = new URLSearchParams(location.search)
if (params.has('demo') && !useStore.getState().onboarded) {
  useStore.getState().finishOnboarding('Henry', SUGGESTED.map((h) => ({ ...h, createdAt: todayISO() })), true)
}

const pal = params.get('palette')
if (pal === 'accessible' || pal === 'vivid') useStore.getState().setSettings({ palette: pal })

export default function App() {
  const onboarded = useStore((s) => s.onboarded)
  // la paleta se aplica antes de pintar: al cambiarla, App se vuelve a renderizar con los colores nuevos
  const palette = useStore((s) => s.settings.palette ?? 'vivid')
  applyPalette(palette)
  return onboarded ? <Main /> : <Onboarding />
}

function Main() {
  const [tab, setTab] = useState<Tab>(() => (params.get('tab') as Tab) || 'month')
  const [sheet, setSheet] = useState<{ habit?: Habit } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(() => params.get('open') === 'library')
  const celebration = useCelebrations()

  return (
    <div className="mx-auto flex min-h-full max-w-6xl">
      <SideNav tab={tab} setTab={setTab} onSettings={() => setSettingsOpen(true)} />
      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-8 md:pb-10">
        <div className={`mx-auto ${tab === 'month' ? 'max-w-5xl' : 'max-w-2xl'}`}>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {tab === 'today' && <Today onEdit={(habit) => setSheet({ habit })} onShop={() => setTab('shop')} onSettings={() => setSettingsOpen(true)} onLibrary={() => setLibraryOpen(true)} />}
              {tab === 'month' && <Month />}
              {tab === 'stats' && <Stats onSeeAchievements={() => setTab('achievements')} />}
              {tab === 'achievements' && <Achievements />}
              {tab === 'shop' && <Shop />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <BottomNav tab={tab} setTab={setTab} />
      <AnimatePresence>{sheet && <HabitSheet habit={sheet.habit} onClose={() => setSheet(null)} />}</AnimatePresence>
      <AnimatePresence>{settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}</AnimatePresence>
      <AnimatePresence>{libraryOpen && <LibrarySheet onClose={() => setLibraryOpen(false)} />}</AnimatePresence>
      {celebration}
    </div>
  )
}

function SideNav({ tab, setTab, onSettings }: { tab: Tab; setTab: (t: Tab) => void; onSettings: () => void }) {
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line px-4 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2 px-2 text-lg font-black tracking-tight">
        <div className="grid size-8 place-items-center rounded-lg bg-teal text-bg">
          <Flame className="size-5" fill="currentColor" />
        </div>
        NO EXCUSES
      </div>
      <nav className="space-y-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${tab === t.id ? 'text-white' : 'text-muted hover:text-white'}`}
          >
            {tab === t.id && <motion.span layoutId="side" className="absolute inset-0 rounded-xl bg-card ring-1 ring-line" />}
            <t.icon className={`relative size-5 ${tab === t.id ? 'text-teal' : ''}`} />
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto space-y-1 text-sm text-muted">
        <button onClick={() => setSettings({ sound: !settings.sound })} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 hover:text-white">
          {settings.sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />} Sonido {settings.sound ? 'activado' : 'apagado'}
        </button>
        <button onClick={onSettings} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 hover:text-white">
          <Settings className="size-4" /> Ajustes y copia
        </button>
      </div>
    </aside>
  )
}

function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/85 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`relative flex flex-col items-center gap-1 py-1.5 text-[10px] font-semibold ${tab === t.id ? 'text-teal' : 'text-muted'}`}>
            {tab === t.id && <motion.span layoutId="bottom" className="absolute -top-2 h-0.5 w-8 rounded-full bg-teal shadow-[0_0_10px_#2EE6C8]" />}
            <t.icon className="size-6" strokeWidth={tab === t.id ? 2.4 : 2} />
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

/** Detecta subidas de nivel y logros nuevos y los celebra. */
function useCelebrations() {
  const { level, achievements, progress, today } = useProgress()
  const perfectToday = !!progress.byDate[today]?.perfect
  const completeToday = !!progress.byDate[today]?.complete
  const prev = useRef<{ level: number; unlocked: Set<string>; perfect: boolean; complete: boolean } | null>(null)
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const [toast, setToast] = useState<(typeof achievements)[number] | null>(null)

  useEffect(() => {
    const unlocked = new Set(achievements.filter((a) => a.unlocked).map((a) => a.id))
    const p = prev.current
    prev.current = { level: level.level, unlocked, perfect: perfectToday, complete: completeToday }
    if (!p) return // primera carga: no celebrar
    if (perfectToday && !p.perfect) feedback.perfectDay()
    else if (completeToday && !p.complete) feedback.completeDay()
    if (level.level > p.level) {
      setLevelUp(level.level)
      setTimeout(feedback.levelUp, 400)
    }
    const fresh = achievements.find((a) => a.unlocked && !p.unlocked.has(a.id))
    if (fresh) {
      setToast(fresh)
      setTimeout(feedback.achievement, 700)
      setTimeout(() => setToast(null), 4000)
    }
  }, [level.level, achievements, perfectToday, completeToday])

  const ToastIcon = toast ? iconFor(toast.icon) : null

  return (
    <>
      <AnimatePresence>
        {toast && ToastIcon && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="fixed inset-x-0 top-4 z-50 mx-auto flex w-[calc(100%-32px)] max-w-sm items-center gap-3 rounded-2xl border border-gold/40 bg-card p-3.5 glow-gold"
          >
            <div className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-[#FFF07A] to-[#FFB800]">
              <ToastIcon className="size-5 text-bg" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-gold">Logro desbloqueado</div>
              <div className="font-bold">{toast.title}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {levelUp && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-bg/80 p-6 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLevelUp(null)}
          >
            <motion.div initial={{ scale: 0.5, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="text-center">
              <div className="mx-auto grid size-32 place-items-center rounded-full bg-gradient-to-br from-teal to-green shadow-[0_0_80px_-10px_#2EE6C8]">
                <Shield className="size-16 text-bg" fill="currentColor" fillOpacity={0.25} strokeWidth={2.2} />
              </div>
              <div className="mt-6 text-sm font-bold uppercase tracking-[0.3em] text-teal">¡Subiste de nivel!</div>
              <div className="text-6xl font-black">Nivel {levelUp}</div>
              <div className="mt-2 text-lg font-semibold" style={{ color: level.rank.color }}>
                {level.rank.name}
              </div>
              <button className="mt-8 rounded-2xl bg-teal px-8 py-3 font-bold text-bg">Seguir así</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
