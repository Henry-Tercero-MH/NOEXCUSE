/**
 * No Excuses ⇄ Google Sheets ⇄ AppSheet
 *
 * Puente entre la app web y esta hoja de cálculo. La misma hoja es la fuente de datos de AppSheet.
 *
 * Instalación (una sola vez):
 *   1. Extensiones → Apps Script → pega este archivo como Code.gs → Guardar.
 *   2. Ejecuta la función `setup` (autoriza los permisos). Crea las pestañas y muestra tu TOKEN en el registro.
 *   3. Implementar → Nueva implementación → Tipo: Aplicación web
 *        Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario → Implementar.
 *   4. Copia la URL que termina en /exec y el TOKEN en la app: Ajustes → Google Sheets / AppSheet.
 *
 * Reglas de sincronización:
 *   - Cada fila tiene ActualizadoEn. Cuando ambos lados cambian la misma fila, gana el cambio más reciente.
 *   - En AppSheet pon ActualizadoEn como tipo ChangeTimestamp para que se actualice solo al editar.
 *   - Para borrar una marca desde AppSheet puedes borrar la fila o poner Eliminado = TRUE.
 *   - Para quitar un hábito usa ArchivadoEl (no borres la fila: perderías el historial).
 */

const SHEETS = {
  Habitos: ['ID', 'Nombre', 'Icono', 'Color', 'Dificultad', 'Dias', 'Meta', 'Unidad', 'VersionMinima', 'VersionMinimaCantidad', 'DespuesDe', 'Hora', 'Plantilla', 'Orden', 'CreadoEl', 'ArchivadoEl', 'ActualizadoEn'],
  Marcas: ['ID', 'HabitoID', 'Fecha', 'Valor', 'Minimo', 'HechoEn', 'Eliminado', 'ActualizadoEn'],
  Compras: ['ID', 'Articulo', 'Costo', 'Fecha'],
  Cofres: ['Fecha'],
  Perfil: ['Clave', 'Valor'],
}

// Columnas de solo fecha, de fecha y hora, booleanas y de texto plano (evita que Sheets las convierta)
const DATE_COLS = ['Fecha', 'CreadoEl', 'ArchivadoEl']
const STAMP_COLS = ['ActualizadoEn']
const LOCAL_DT_COLS = ['HechoEn']
const BOOL_COLS = ['Minimo', 'Eliminado']
const TEXT_COLS = ['ID', 'HabitoID', 'Dias', 'Hora', 'Plantilla', 'Clave', 'Valor']

// ---------------------------------------------------------------- instalación

function setup() {
  const ss = SpreadsheetApp.getActive()
  Object.keys(SHEETS).forEach((name) => {
    const headers = SHEETS[name]
    const sh = ss.getSheetByName(name) || ss.insertSheet(name)
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold')
    sh.setFrozenRows(1)
    headers.forEach((h, i) => {
      if (TEXT_COLS.indexOf(h) >= 0) sh.getRange(2, i + 1, sh.getMaxRows() - 1, 1).setNumberFormat('@')
    })
  })
  const def = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1')
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def)

  const props = PropertiesService.getScriptProperties()
  let token = props.getProperty('NE_TOKEN')
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '')
    props.setProperty('NE_TOKEN', token)
  }
  Logger.log('TOKEN para la app: ' + token)
  return token
}

// ---------------------------------------------------------------- endpoints

function doGet(e) {
  if (!authorized(e.parameter.token)) return json({ ok: false, error: 'Token inválido' })
  return json({ ok: true, data: readAll() })
}

function doPost(e) {
  let body
  try {
    body = JSON.parse(e.postData.contents)
  } catch (err) {
    return json({ ok: false, error: 'JSON inválido' })
  }
  if (!authorized(body.token)) return json({ ok: false, error: 'Token inválido' })

  const lock = LockService.getScriptLock()
  lock.waitLock(20000)
  try {
    upsert('Habitos', body.habits || [], true)
    upsert('Marcas', body.marks || [], true)
    upsert('Compras', body.purchases || [], false)
    upsertKeyed('Cofres', 'Fecha', (body.chests || []).map((d) => ({ Fecha: d })))
    if (body.profile) upsertKeyed('Perfil', 'Clave', Object.keys(body.profile).filter((k) => body.profile[k] !== undefined && body.profile[k] !== '').map((k) => ({ Clave: k, Valor: String(body.profile[k]) })), body.keepProfile)
    SpreadsheetApp.flush()
    return json({ ok: true, data: readAll() })
  } finally {
    lock.releaseLock()
  }
}

function authorized(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('NE_TOKEN')
  return !!expected && token === expected
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

// ---------------------------------------------------------------- lectura

function readAll() {
  const out = {}
  Object.keys(SHEETS).forEach((name) => (out[name] = readSheet(name)))
  return out
}

function readSheet(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name)
  if (!sh || sh.getLastRow() < 2) return []
  const values = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues()
  const headers = values[0]
  return values
    .slice(1)
    .filter((r) => r[0] !== '' && r[0] !== null)
    .map((r) => {
      const o = {}
      headers.forEach((h, i) => (o[h] = fromCell(h, r[i])))
      return o
    })
}

function fromCell(col, v) {
  const tz = Session.getScriptTimeZone()
  if (v === '' || v === null) return ''
  if (BOOL_COLS.indexOf(col) >= 0) return v === true || String(v).toUpperCase() === 'TRUE' || String(v).toUpperCase() === 'Y'
  if (v instanceof Date) {
    if (DATE_COLS.indexOf(col) >= 0) return Utilities.formatDate(v, tz, 'yyyy-MM-dd')
    if (LOCAL_DT_COLS.indexOf(col) >= 0) return Utilities.formatDate(v, tz, "yyyy-MM-dd'T'HH:mm:ss")
    if (col === 'Hora') return Utilities.formatDate(v, tz, 'HH:mm')
    return v.toISOString()
  }
  return v
}

// ---------------------------------------------------------------- escritura

function toCell(col, v) {
  if (v === undefined || v === null || v === '') return ''
  if (BOOL_COLS.indexOf(col) >= 0) return v === true
  if (DATE_COLS.indexOf(col) >= 0) {
    const p = String(v).split('-')
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]))
  }
  if (STAMP_COLS.indexOf(col) >= 0 || LOCAL_DT_COLS.indexOf(col) >= 0) return new Date(v)
  return v
}

/** Inserta o actualiza filas por ID. Con lww=true solo pisa si el cambio entrante es más reciente. */
function upsert(name, rows, lww) {
  if (!rows.length) return
  const sh = SpreadsheetApp.getActive().getSheetByName(name)
  const headers = SHEETS[name]
  const last = sh.getLastRow()
  const data = last > 1 ? sh.getRange(2, 1, last - 1, headers.length).getValues() : []
  const index = {}
  data.forEach((r, i) => (index[String(r[0])] = i))
  const stampCol = headers.indexOf('ActualizadoEn')

  rows.forEach((row) => {
    const id = String(row.ID)
    const values = headers.map((h) => toCell(h, row[h]))
    if (id in index) {
      const cur = data[index[id]]
      if (lww && stampCol >= 0 && cur[stampCol] instanceof Date && new Date(row.ActualizadoEn) < cur[stampCol]) return
      data[index[id]] = values
    } else {
      index[id] = data.length
      data.push(values)
    }
  })
  if (data.length) sh.getRange(2, 1, data.length, headers.length).setValues(data)
}

/** Inserta filas por una clave; si keepExisting, no pisa valores ya presentes (perfil compartido). */
function upsertKeyed(name, keyCol, rows, keepExisting) {
  if (!rows.length) return
  const sh = SpreadsheetApp.getActive().getSheetByName(name)
  const headers = SHEETS[name]
  const last = sh.getLastRow()
  const data = last > 1 ? sh.getRange(2, 1, last - 1, headers.length).getValues() : []
  const k = headers.indexOf(keyCol)
  const index = {}
  data.forEach((r, i) => (index[String(fromCell(keyCol, r[k]))] = i))
  rows.forEach((row) => {
    const id = String(row[keyCol])
    const values = headers.map((h) => toCell(h, row[h]))
    if (id in index) {
      if (!keepExisting) data[index[id]] = values
    } else {
      index[id] = data.length
      data.push(values)
    }
  })
  if (data.length) sh.getRange(2, 1, data.length, headers.length).setValues(data)
}
