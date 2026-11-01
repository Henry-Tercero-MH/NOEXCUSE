import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Coins, Feather, Flame, Sheet, Shield, Snowflake, Sparkles, Zap } from 'lucide-react'
import { ConnectForm } from '../components/SyncSection'
import { useState } from 'react'
import { todayISO } from '../core/dates'
import { PACKS, fromTemplate, templateByKey } from '../core/library'
import { COLORS, iconFor } from '../lib/icons'
import { SUGGESTED, useStore } from '../lib/store'

export function Onboarding() {
  const finish = useStore((s) => s.finishOnboarding)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [pack, setPack] = useState(PACKS[0].id)
  // empezar pequeño (Fogg): 3 hábitos preseleccionados, el resto opcional
  const [picked, setPicked] = useState<string[]>(PACKS[0].keys.slice(0, 3))
  const packHabits = PACKS.find((p) => p.id === pack)!.keys.map(templateByKey)

  const choosePack = (id: string) => {
    setPack(id)
    setPicked(PACKS.find((p) => p.id === id)!.keys.slice(0, 3))
  }

  const habits = picked.map((k) => ({ ...fromTemplate(templateByKey(k)), id: k, order: 0, createdAt: todayISO() }))

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-5 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-black tracking-tight">
          <div className="grid size-8 place-items-center rounded-lg bg-teal text-bg">
            <Flame className="size-5" fill="currentColor" />
          </div>
          NO EXCUSES
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-teal' : 'w-1.5 bg-line'}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-1 flex-col">
          {step === 0 && (
            <>
              <h1 className="text-4xl font-black leading-tight tracking-tight">
                Sin excusas.
                <br />
                <span className="text-teal">Solo progreso.</span>
              </h1>
              <p className="mt-3 text-muted">Convierte tus hábitos en un juego: gana XP, sube de nivel y no rompas la racha.</p>
              <label className="mt-8 mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">¿Cómo te llamas?</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(1)}
                placeholder="Tu nombre"
                className="rounded-xl border border-line bg-card px-4 py-3.5 text-lg outline-none focus:border-teal"
              />
              <RestoreFromSheets />
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-3xl font-black tracking-tight">Elige tu camino</h1>
              <p className="mt-2 text-muted">Empieza con un paquete y quita lo que no quieras. Lo ideal: de 3 a 6 hábitos.</p>
              <div className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5">
                {PACKS.map((p) => {
                  const PIcon = iconFor(p.icon)
                  const on = pack === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => choosePack(p.id)}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors"
                      style={on ? { borderColor: p.color, background: `${p.color}1a`, color: p.color } : { borderColor: '#262E4D', color: '#8A93B0' }}
                    >
                      <PIcon className="size-4" /> {p.name}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 space-y-2">
                {packHabits.map((h) => {
                  const Icon = iconFor(h.icon)
                  const on = picked.includes(h.key)
                  const c = COLORS[h.color]
                  return (
                    <button
                      key={h.key}
                      onClick={() => setPicked((p) => (on ? p.filter((x) => x !== h.key) : [...p, h.key]))}
                      className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left transition-colors"
                      style={{ borderColor: on ? c : '#262E4D' }}
                    >
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: `${c}22`, color: c }}>
                        <Icon className="size-5" />
                      </div>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold leading-snug">{h.name}</span>
                        <span className="block text-xs leading-snug text-muted">{h.why}</span>
                      </span>
                      <span className="grid size-7 place-items-center rounded-full border-2" style={{ borderColor: on ? c : '#3A4470', background: on ? c : 'transparent' }}>
                        {on && <Check className="size-4 text-bg" strokeWidth={3} />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-3xl font-black tracking-tight">Así se juega</h1>
              <div className="mt-6 space-y-3">
                <Rule icon={Zap} color="#2EE6C8" title="Gana XP" text="Cada hábito da 10-20 XP según su dificultad." />
                <Rule icon={Flame} color="#FF6B5B" title="Cuida tu racha" text="Cada 7 días de racha: +10% de XP (hasta +50%)." />
                <Rule icon={Sparkles} color="#FFD600" title="Día perfecto" text="Completa todo y gana +50 XP de bonus." />
                <Rule icon={Snowflake} color="#7DD3FC" title="Congeladores" text="Cada 7 días ganas uno. Protege tu racha si un día fallas." />
                <Rule icon={Feather} color="#A78BFA" title="Nunca cero" text="¿Día difícil? Haz la versión mínima: mantiene la racha y da la mitad de XP." />
                <Rule icon={Coins} color="#FFD600" title="Gasta tu XP" text="Compra congeladores y temas en la tienda. Tu nivel nunca baja." />
                <Rule icon={Shield} color="#2EE66B" title="Sube de rango" text="De Novato a Sin Excusas." />
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 space-y-2">
        {step < 2 ? (
          <button
            disabled={(step === 0 && !name.trim()) || (step === 1 && picked.length === 0)}
            onClick={() => setStep(step + 1)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal py-4 font-bold text-bg disabled:opacity-40"
          >
            Continuar <ArrowRight className="size-5" />
          </button>
        ) : (
          <>
            <button onClick={() => finish(name, habits, false)} className="w-full rounded-2xl bg-teal py-4 font-bold text-bg glow-teal">
              Empezar hoy
            </button>
            <button
              onClick={() => finish(name, SUGGESTED.map((h) => ({ ...h, createdAt: todayISO() })), true)}
              className="w-full rounded-2xl border border-line py-3.5 text-sm font-semibold text-muted hover:text-white"
            >
              Explorar con datos de ejemplo
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/** En un dispositivo nuevo: conectar la hoja de Google y traer todo el historial. */
function RestoreFromSheets() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-6">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-white">
        <Sheet className="size-4" /> ¿Ya tienes tus datos en Google Sheets? Recupéralos
      </button>
      {open && (
        <div className="mt-3 rounded-2xl border border-line bg-card p-4">
          <ConnectForm
            cta="Recuperar mis datos"
            onConnected={(info) => {
              useStore.setState({ onboarded: true, userName: info.userName || 'Campeón' })
            }}
          />
        </div>
      )}
    </div>
  )
}

function Rule({ icon: Icon, color, title, text }: { icon: typeof Zap; color: string; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line bg-card p-3.5">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: `${color}1f`, color }}>
        <Icon className="size-5" />
      </div>
      <div>
        <div className="font-bold">{title}</div>
        <div className="text-sm text-muted">{text}</div>
      </div>
    </div>
  )
}
