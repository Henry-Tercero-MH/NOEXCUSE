import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { CircleAlert, CloudCheck, CloudOff, LoaderCircle, RefreshCw, Sheet, Unplug } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../lib/store'
import { syncNow, testConnection, useSyncStatus } from '../lib/sync'

/** Formulario de conexión (también se usa en el onboarding para recuperar datos). */
export function ConnectForm({ onConnected, cta = 'Conectar' }: { onConnected: (info: { habits: number; marks: number; userName?: string }) => void; cta?: string }) {
  const setSync = useStore((s) => s.setSync)
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = async (e: React.FormEvent) => {
    e.preventDefault()
    const cfg = { url: url.trim(), token: token.trim() }
    if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(cfg.url)) {
      setError('La URL debe ser la de la aplicación web de Apps Script (termina en /exec).')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const info = await testConnection(cfg)
      setSync(cfg)
      onConnected(info)
    } catch (err) {
      setError(err instanceof Error ? `No se pudo conectar: ${err.message}` : 'No se pudo conectar')
    } finally {
      setBusy(false)
    }
  }

  const input = 'w-full rounded-xl border border-line bg-card-2 px-3 py-2.5 text-sm outline-none focus:border-teal'
  return (
    <form onSubmit={connect} className="space-y-2">
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec" aria-label="URL de la aplicación web" className={input} />
      <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token" aria-label="Token" autoComplete="off" className={input} />
      {error && (
        <p className="flex items-start gap-1.5 text-xs text-coral">
          <CircleAlert className="mt-px size-3.5 shrink-0" /> {error}
        </p>
      )}
      <button disabled={busy || !url || !token} className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal py-2.5 text-sm font-bold text-bg disabled:opacity-50">
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Sheet className="size-4" />}
        {busy ? 'Conectando…' : cta}
      </button>
    </form>
  )
}

export function SyncSection() {
  const sync = useStore((s) => s.sync)
  const setSync = useStore((s) => s.setSync)
  const status = useSyncStatus()
  const [open, setOpen] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  if (!sync) {
    return (
      <div className="rounded-2xl bg-card-2 p-3.5">
        <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 text-left">
          <CloudOff className="size-5 shrink-0 text-muted" />
          <div>
            <div className="font-semibold">Conectar con Google Sheets / AppSheet</div>
            <div className="text-xs text-muted">Guarda tus datos en una hoja de Google y úsala como fuente de una app de AppSheet.</div>
          </div>
        </button>
        {open && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted">
              Necesitas la URL <b>/exec</b> y el <b>token</b> del script <code className="text-white">Code.gs</code> (ver <code className="text-white">integrations/appsheet/README.md</code>).
            </p>
            <ConnectForm onConnected={(i) => setInfo(`Conectado. En la hoja hay ${i.habits} hábitos y ${i.marks} marcas; se fusionarán con los tuyos.`)} />
          </div>
        )}
        {info && <p className="mt-2 text-xs text-green">{info}</p>}
      </div>
    )
  }

  const last = sync.lastSync ? formatDistanceToNow(new Date(sync.lastSync), { addSuffix: true, locale: es }) : 'nunca'
  return (
    <div className="space-y-2 rounded-2xl bg-card-2 p-3.5">
      <div className="flex items-center gap-3">
        {status.state === 'syncing' ? (
          <LoaderCircle className="size-5 shrink-0 animate-spin text-teal" />
        ) : status.state === 'error' ? (
          <CircleAlert className="size-5 shrink-0 text-coral" />
        ) : (
          <CloudCheck className="size-5 shrink-0 text-green" />
        )}
        <div className="min-w-0">
          <div className="font-semibold">Google Sheets conectado</div>
          <div className="truncate text-xs text-muted">
            {status.state === 'syncing' ? 'Sincronizando…' : status.state === 'error' ? status.error : `Última sincronización: ${last}`}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => syncNow()} disabled={status.state === 'syncing'} className="flex items-center justify-center gap-1.5 rounded-xl border border-line py-2 text-sm font-semibold hover:bg-line disabled:opacity-50">
          <RefreshCw className="size-4" /> Sincronizar
        </button>
        <button
          onClick={() => confirm('¿Desconectar de Google Sheets? Tus datos se quedan en este dispositivo y en la hoja.') && setSync(null)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-line py-2 text-sm font-semibold text-muted hover:text-coral"
        >
          <Unplug className="size-4" /> Desconectar
        </button>
      </div>
    </div>
  )
}
