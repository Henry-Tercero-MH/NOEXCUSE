import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  value: number // 0..1
  size?: number
  stroke?: number
  color?: string
  glow?: boolean
  children?: ReactNode
}

export function Ring({ value, size = 200, stroke = 16, color = '#2EE6C8', glow = false, children }: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const id = `ring-${color.slice(1)}`
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity={0.55} />
          </linearGradient>
          <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1C2340" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - Math.max(0.001, Math.min(1, value))) }}
          transition={{ type: 'spring', stiffness: 60, damping: 16 }}
          filter={glow ? `url(#${id}-glow)` : undefined}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}
