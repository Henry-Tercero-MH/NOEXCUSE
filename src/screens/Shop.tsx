import { AnimatePresence, motion } from 'framer-motion'
import { Check, Coins, Lock, Palette } from 'lucide-react'
import { useState } from 'react'
import { MAX_FREEZES_WITH_SHOP, SHOP, THEMES, owns, type ShopItem, type ThemeId } from '../core/shop'
import { feedback } from '../lib/feedback'
import { iconFor } from '../lib/icons'
import { useStore } from '../lib/store'
import { useProgress } from '../lib/useProgress'

export function Shop() {
  const { coins, progress } = useProgress()
  const purchases = useStore((s) => s.purchases)
  const theme = useStore((s) => s.settings.theme)
  const buy = useStore((s) => s.buy)
  const setSettings = useStore((s) => s.setSettings)
  const [confirm, setConfirm] = useState<ShopItem | null>(null)

  const state = (item: ShopItem) => {
    if (item.kind === 'theme' && owns(purchases, item.id)) return 'owned' as const
    if (item.kind === 'freeze' && progress.freezes >= MAX_FREEZES_WITH_SHOP) return 'full' as const
    return coins >= item.cost ? ('buy' as const) : ('poor' as const)
  }

  const ownedThemes = (Object.keys(THEMES) as ThemeId[]).filter((t) => t === 'turquesa' || owns(purchases, `theme-${t}`))

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Tienda</h1>
          <p className="text-sm text-muted">Gasta tu XP. Tu nivel no baja al comprar.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-2 text-gold">
          <Coins className="size-5" />
          <span className="tabular text-xl font-black">{coins.toLocaleString('es')}</span>
          <span className="text-xs font-semibold opacity-80">XP</span>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {SHOP.map((item) => {
          const Icon = iconFor(item.icon)
          const st = state(item)
          const accent = item.kind === 'theme' ? item.color : '#7DD3FC'
          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -2 }}
              className="relative overflow-hidden rounded-3xl border border-line bg-card p-4"
            >
              {item.kind === 'theme' && (
                <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-40 blur-2xl" style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})` }} />
              )}
              <div className="relative flex items-start gap-3">
                <div
                  className="grid size-12 shrink-0 place-items-center rounded-2xl"
                  style={{ background: item.kind === 'theme' ? `linear-gradient(135deg, ${item.from}, ${item.to})` : `${accent}22`, color: item.kind === 'theme' ? '#0B0E1A' : accent }}
                >
                  <Icon className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{item.name}</div>
                  <div className="text-xs leading-snug text-muted">{item.description}</div>
                  {item.kind === 'freeze' && (
                    <div className="mt-1 text-xs text-ice">
                      Tienes {progress.freezes} de {MAX_FREEZES_WITH_SHOP}
                    </div>
                  )}
                </div>
              </div>
              <button
                disabled={st !== 'buy'}
                onClick={() => setConfirm(item)}
                className={`relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-opacity ${
                  st === 'buy' ? 'bg-gold text-bg hover:opacity-90' : 'bg-card-2 text-muted'
                }`}
              >
                {st === 'owned' ? (
                  <>
                    <Check className="size-4" /> Comprado
                  </>
                ) : st === 'full' ? (
                  'Ya tienes el máximo'
                ) : (
                  <>
                    {st === 'poor' ? <Lock className="size-4" /> : <Coins className="size-4" />}
                    {item.cost.toLocaleString('es')} XP
                    {st === 'poor' && <span className="font-normal">· te faltan {(item.cost - coins).toLocaleString('es')}</span>}
                  </>
                )}
              </button>
            </motion.div>
          )
        })}
      </section>

      <section className="rounded-3xl border border-line bg-card p-5">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <Palette className="size-5 text-muted" /> Tus temas
        </h2>
        <div className="flex flex-wrap gap-3">
          {ownedThemes.map((t) => {
            const th = THEMES[t]
            const active = theme === t
            return (
              <button
                key={t}
                onClick={() => setSettings({ theme: t })}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${active ? 'border-white/40 bg-card-2' : 'border-line text-muted hover:text-white'}`}
              >
                <span className="size-4 rounded-full" style={{ background: `linear-gradient(135deg, ${th.from}, ${th.to})` }} />
                {th.name}
              </button>
            )
          })}
        </div>
      </section>

      <AnimatePresence>
        {confirm && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirm(null)}>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-line bg-card p-6 text-center"
            >
              <div className="text-lg font-bold">¿Comprar {confirm.name}?</div>
              <p className="mt-1 text-sm text-muted">
                Se descontarán <b className="text-gold">{confirm.cost.toLocaleString('es')} XP</b> de tu saldo. Te quedarán {(coins - confirm.cost).toLocaleString('es')}.
              </p>
              <div className="mt-5 flex gap-2">
                <button onClick={() => setConfirm(null)} className="flex-1 rounded-xl border border-line py-3 font-semibold text-muted">
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    buy(confirm)
                    feedback.achievement()
                    setConfirm(null)
                  }}
                  className="flex-1 rounded-xl bg-gold py-3 font-bold text-bg"
                >
                  Comprar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
