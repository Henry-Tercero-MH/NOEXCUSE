import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { LevelInfo } from '../core/levels'

interface Props {
  level: LevelInfo
  from?: string
  to?: string
  /** XP ganada hoy: cuando sube, la barra destella una vez (en vez de pulsar siempre) */
  gained?: number
  children?: ReactNode
}

export function XpBar({ level, from = '#2EE6C8', to = '#2EE66B', gained = 0, children }: Props) {
  const pct = level.into / level.needed
  const prev = useRef(gained)
  const [flash, setFlash] = useState(0)
  useEffect(() => {
    if (gained > prev.current) setFlash((f) => f + 1)
    prev.current = gained
  }, [gained])

  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ background: `${level.rank.color}22`, color: level.rank.color }}>
            <Shield className="size-5" strokeWidth={2.4} />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-[15px] font-bold">
              Nivel {level.level} <span className="text-muted">·</span> <span style={{ color: level.rank.color }}>{level.rank.name}</span>
            </div>
            {level.nextRank && <div className="truncate text-xs text-muted">Siguiente rango: {level.nextRank.name} (nivel {level.nextRank.from})</div>}
          </div>
        </div>
        <div className="tabular shrink-0 text-sm font-semibold text-muted">
          <span className="text-white">{level.into.toLocaleString('es')}</span> / {level.needed.toLocaleString('es')} XP
        </div>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-card-2" role="progressbar" aria-valuenow={level.into} aria-valuemax={level.needed} aria-label="Experiencia">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg,${from},${to})` }}
          initial={false}
          animate={{ width: `${pct * 100}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        />
        {flash > 0 && (
          <motion.span
            key={flash}
            className="pointer-events-none absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            initial={{ left: '-25%' }}
            animate={{ left: '110%' }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        )}
      </div>
      {children && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-muted">{children}</div>}
    </div>
  )
}
