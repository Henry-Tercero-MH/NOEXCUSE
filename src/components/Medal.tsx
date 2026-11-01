import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import type { evaluate } from '../core/achievements'
import { iconFor } from '../lib/icons'

type A = ReturnType<typeof evaluate>[number]

const TIER = {
  bronze: { from: '#FF9A6B', to: '#FF6B5B' },
  silver: { from: '#7DF5E1', to: '#2EE6C8' },
  gold: { from: '#FFF07A', to: '#FFB800' },
}

export function Medal({ a, size = 'md' }: { a: A; size?: 'sm' | 'md' }) {
  const Icon = iconFor(a.icon)
  const t = TIER[a.tier]
  const dim = size === 'sm' ? 'size-14' : 'size-20'
  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        whileHover={a.unlocked ? { rotate: [0, -8, 8, 0], scale: 1.06 } : undefined}
        className={`relative grid ${dim} place-items-center rounded-full`}
        style={
          a.unlocked
            ? { background: `radial-gradient(circle at 30% 25%, ${t.from}, ${t.to})`, boxShadow: `0 0 26px -6px ${t.to}, inset 0 -4px 8px #0003` }
            : { background: '#1C2340', border: '2px dashed #2A3255' }
        }
      >
        {a.unlocked ? (
          <>
            <Icon className={size === 'sm' ? 'size-6' : 'size-9'} color="#0B0E1A" strokeWidth={2.4} />
            {/* nivel en numeral: no depende de distinguir bronce/plata/oro por color */}
            <span
              className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-card bg-bg text-[9px] font-black text-white"
              aria-label={`Nivel ${a.tier === 'bronze' ? 'bronce' : a.tier === 'silver' ? 'plata' : 'oro'}`}
            >
              {a.tier === 'bronze' ? 'I' : a.tier === 'silver' ? 'II' : 'III'}
            </span>
            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
              <span className="absolute -left-1/2 top-0 h-full w-1/3 rotate-12 animate-[shine_3s_ease-in-out_infinite] bg-white/40 blur-sm" />
            </span>
          </>
        ) : (
          <Lock className={size === 'sm' ? 'size-5 text-muted' : 'size-7 text-muted'} />
        )}
      </motion.div>
      <div className={`mt-2 font-semibold leading-tight ${size === 'sm' ? 'text-[11px]' : 'text-sm'} ${a.unlocked ? '' : 'text-muted'}`}>{a.title}</div>
      {size === 'md' && (
        <>
          <div className="mt-0.5 text-[11px] leading-snug text-muted">{a.description}</div>
          {!a.unlocked && (
            <div className="mt-2 w-full">
              <div className="h-1.5 overflow-hidden rounded-full bg-card-2">
                <div className="h-full rounded-full" style={{ width: `${(a.current / a.goal) * 100}%`, background: t.to }} />
              </div>
              <div className="tabular mt-1 text-[10px] text-muted">
                {a.current} / {a.goal}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
