import { Check, Feather } from 'lucide-react'
import type { Status } from '../core/types'
import { useStore } from '../lib/store'

// Codificación redundante de estados (no depende solo del color):
//   completo = color sólido · mínimo = rayado diagonal · a medias = puntos + borde · vacío = gris
export const EMPTY_FILL = '#1F2747'
export const EMPTY_STROKE_A11Y = '#6B7699' // 3.84:1 sobre la tarjeta
/** días que aún no llegan: tenues pero visibles, para que la espiral se vea completa desde el día 1 */
export const FUTURE_STYLE = { fill: '#1A2039', stroke: '#2C355A', strokeWidth: 0.6 }

const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '')

/** <defs> con un patrón de "mínimo" y otro de "a medias" por cada color. */
export function StatusDefs({ id, colors, scale = 1 }: { id: string; colors: string[]; scale?: number }) {
  const w = 5 * scale
  return (
    <defs>
      {[...new Set(colors)].map((c) => (
        <g key={c}>
          <pattern id={`${safe(id)}-min-${safe(c)}`} width={w} height={w} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={w} height={w} fill="#151A2E" />
            <rect width={w / 2} height={w} fill={c} />
          </pattern>
          <pattern id={`${safe(id)}-par-${safe(c)}`} width={4 * scale} height={4 * scale} patternUnits="userSpaceOnUse">
            <rect width={4 * scale} height={4 * scale} fill={EMPTY_FILL} />
            <circle cx={2 * scale} cy={2 * scale} r={0.9 * scale} fill={c} />
          </pattern>
        </g>
      ))}
    </defs>
  )
}

export interface CellStyle {
  fill: string
  stroke?: string
  strokeWidth?: number
}

/** Relleno y borde de un gajo/celda según su estado. */
export function statusStyle(st: Status, color: string, id: string, opts: { applies: boolean; future: boolean; a11y: boolean }): CellStyle {
  if (!opts.applies) return { fill: '#0E1222' }
  if (st === 'full') return { fill: color }
  if (st === 'min') return { fill: `url(#${safe(id)}-min-${safe(color)})` }
  if (st === 'partial') return { fill: `url(#${safe(id)}-par-${safe(color)})`, stroke: color, strokeWidth: 1.2 }
  if (opts.future) return FUTURE_STYLE
  return opts.a11y ? { fill: EMPTY_FILL, stroke: EMPTY_STROKE_A11Y, strokeWidth: 0.8 } : { fill: EMPTY_FILL }
}

export const useA11yPalette = () => useStore((s) => s.settings.palette === 'accessible')

/** Leyenda visible con los 4 estados (muestra + texto). */
export function StatusLegend({ color }: { color: string }) {
  const a11y = useA11yPalette()
  const sw = 'size-4 rounded-[4px] shrink-0'
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className={`${sw} grid place-items-center`} style={{ background: color }}>
          <Check className="size-3 text-bg" strokeWidth={3.5} />
        </span>
        Completo
      </span>
      <span className="inline-flex items-center gap-1.5">
        <svg className={sw} viewBox="0 0 16 16">
          <StatusDefs id="legend" colors={[color]} />
          <rect width="16" height="16" rx="4" fill={`url(#legend-min-${safe(color)})`} />
        </svg>
        <Feather className="size-3" /> Mínimo
      </span>
      <span className="inline-flex items-center gap-1.5">
        <svg className={sw} viewBox="0 0 16 16">
          <rect x="0.75" y="0.75" width="14.5" height="14.5" rx="3.5" fill={`url(#legend-par-${safe(color)})`} stroke={color} strokeWidth="1.5" />
        </svg>
        A medias
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className={sw} style={{ background: EMPTY_FILL, border: a11y ? `1px solid ${EMPTY_STROKE_A11Y}` : undefined }} />
        Sin marcar
      </span>
    </div>
  )
}
