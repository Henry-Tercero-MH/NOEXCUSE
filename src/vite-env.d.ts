/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL /exec de la aplicación web de Apps Script (integrations/appsheet/Code.gs) */
  readonly VITE_SYNC_URL?: string
  /** Token generado por setup() en Apps Script */
  readonly VITE_SYNC_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
