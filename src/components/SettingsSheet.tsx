import { motion } from 'framer-motion'
import { Download, Eye, RotateCcw, Upload, Vibrate, Volume2, VolumeX, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { todayISO } from '../core/dates'
import { useStore } from '../lib/store'
import { SyncSection } from './SyncSection'

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const reset = useStore((s) => s.reset)
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `no-excuses-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMsg({ ok: true, text: 'Copia descargada. Guárdala en un lugar seguro.' })
  }

  const doImport = async (f: File) => {
    try {
      const data = JSON.parse(await f.text())
      if (!confirm('Esto reemplazará todos tus datos actuales por los de la copia. ¿Continuar?')) return
      setMsg(importData(data) ? { ok: true, text: 'Datos restaurados.' } : { ok: false, text: 'El archivo no es una copia válida de No Excuses.' })
    } catch {
      setMsg({ ok: false, text: 'No se pudo leer el archivo.' })
    }
  }

  const Row = ({ icon: Icon, label, hint, onClick, danger }: { icon: typeof Download; label: string; hint?: string; onClick: () => void; danger?: boolean }) => (
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-2xl bg-card-2 p-3.5 text-left transition-colors ${danger ? 'hover:text-coral' : 'hover:bg-line'}`}>
      <Icon className={`size-5 shrink-0 ${danger ? 'text-coral' : 'text-muted'}`} />
      <div>
        <div className="font-semibold">{label}</div>
        {hint && <div className="text-xs text-muted">{hint}</div>}
      </div>
    </button>
  )

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="max-h-[92vh] w-full max-w-md space-y-2 overflow-y-auto rounded-t-3xl border border-line bg-card p-5 sm:rounded-3xl"
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold">Ajustes</h2>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full bg-card-2 text-muted" aria-label="Cerrar">
            <X className="size-4" />
          </button>
        </div>

        <Row icon={settings.sound ? Volume2 : VolumeX} label={`Sonido ${settings.sound ? 'activado' : 'apagado'}`} onClick={() => setSettings({ sound: !settings.sound })} />
        <Row icon={Vibrate} label={`Vibración ${settings.haptics ? 'activada' : 'apagada'}`} hint="Solo en móviles compatibles" onClick={() => setSettings({ haptics: !settings.haptics })} />

        <div className="px-1 pt-3 text-xs font-bold uppercase tracking-wider text-muted">Accesibilidad</div>
        <Row
          icon={Eye}
          label={`Colores para daltonismo: ${settings.palette === 'accessible' ? 'activados' : 'apagados'}`}
          hint="Paleta que se distingue con protanopía, deuteranopía y tritanopía"
          onClick={() => setSettings({ palette: settings.palette === 'accessible' ? 'vivid' : 'accessible' })}
        />

        <div className="px-1 pt-3 text-xs font-bold uppercase tracking-wider text-muted">Tus datos</div>
        <SyncSection />
        <Row icon={Download} label="Exportar copia de seguridad" hint="Descarga un archivo JSON con todo tu historial" onClick={doExport} />
        <Row icon={Upload} label="Importar copia" hint="Restaura desde un archivo exportado" onClick={() => file.current?.click()} />
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) doImport(f)
            e.target.value = ''
          }}
        />
        {msg && <p className={`px-1 text-sm ${msg.ok ? 'text-green' : 'text-coral'}`}>{msg.text}</p>}

        <div className="pt-2">
          <Row
            icon={RotateCcw}
            label="Reiniciar datos"
            hint="Borra todo y vuelve al inicio"
            danger
            onClick={() => {
              if (confirm('¿Borrar todos los datos y empezar de cero? Exporta una copia antes si quieres conservarlos.')) {
                reset()
                onClose()
              }
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
