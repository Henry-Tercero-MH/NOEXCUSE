# No Excuses ⇄ Google Sheets ⇄ AppSheet

```
App web (React)  ⇄  Apps Script (Code.gs)  ⇄  Google Sheet  ⇄  App de AppSheet
```

- La app web funciona sin conexión y se sincroniza sola: 2,5 s después de cada cambio, al volver a la pestaña y cada 2 minutos.
- Cada fila tiene `ActualizadoEn`. Si los dos lados cambian la misma fila, **gana el cambio más reciente**.
- La gamificación (XP, niveles, racha, cofres) **no se guarda en la hoja**: se recalcula en la app a partir de los hábitos y las marcas. Por eso dos dispositivos siempre muestran lo mismo.

## 1. Crear la hoja y el puente (5 min, una sola vez)

1. Crea una hoja de cálculo nueva en Google Sheets, por ejemplo "No Excuses – datos".
2. **Extensiones → Apps Script**. Borra lo que haya y pega el contenido de [`Code.gs`](Code.gs). Guarda.
3. Arriba, elige la función **`setup`** y pulsa **Ejecutar**. Acepta los permisos.
   - Se crean las pestañas `Habitos`, `Marcas`, `Compras`, `Cofres` y `Perfil`.
   - En **Registro de ejecución** aparece `TOKEN para la app: …`. Cópialo.
4. **Implementar → Nueva implementación** → engranaje → **Aplicación web**.
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario** (el token protege los datos).
   - **Implementar** → copia la **URL de la aplicación web** (termina en `/exec`).
5. En No Excuses: **Ajustes → Conectar con Google Sheets / AppSheet**. Pega la URL y el token → **Conectar**.

En otro dispositivo, en la primera pantalla de la app pulsa **"¿Ya tienes tus datos en Google Sheets? Recupéralos"**.

> Si cambias `Code.gs` después, usa **Implementar → Gestionar implementaciones → Editar → Versión nueva**. Así la URL no cambia.

## 2. Crear la app en AppSheet

1. En la hoja: **Extensiones → AppSheet → Crear una aplicación**.
2. En **Data**, añade las tablas `Habitos` y `Marcas` (y `Compras`, `Cofres` y `Perfil` si quieres verlas).
3. Ajusta los tipos de columna:

**Habitos** (clave: `ID`)

| Columna | Tipo | Notas |
|---|---|---|
| ID | Text | Initial value: `UNIQUEID()` |
| Nombre | Name | |
| Color | Enum | teal, coral, green, gold, violet, sky, pink, orange |
| Dificultad | Enum (número) | 1, 1.5, 2 |
| Dias | Text | Días de la semana separados por coma (0 = domingo). Vacío = todos |
| Meta | Number | 1 = sí/no; más de 1 = cantidad |
| Hora | Text | `HH:mm` |
| CreadoEl | Date | Initial value: `TODAY()` |
| ArchivadoEl | Date | Para "quitar" un hábito sin perder historial |
| ActualizadoEn | **ChangeTimestamp** | **Imprescindible**: así las ediciones de AppSheet ganan a las más viejas |

**Marcas** (clave: `ID`)

| Columna | Tipo | Notas |
|---|---|---|
| ID | Text | Initial value: `CONCATENATE([HabitoID], "\|", TEXT([Fecha], "YYYY-MM-DD"))` |
| HabitoID | **Ref** → Habitos | Así AppSheet muestra el nombre del hábito |
| Fecha | Date | Initial value: `TODAY()` |
| Valor | Number | Vacío = completo. En hábitos con cantidad, cuánto llevas |
| Minimo | Yes/No | Versión mínima |
| HechoEn | DateTime | Initial value: `NOW()` |
| Eliminado | Yes/No | Initial value: `FALSE` |
| ActualizadoEn | **ChangeTimestamp** | |

4. Crea un **Slice** `MarcasActivas` con la condición `NOT([Eliminado])` y úsalo en las vistas.

### Ideas de vistas en AppSheet
- **Formulario "Marcar hoy"** sobre `MarcasActivas`, con `HabitoID` como desplegable.
- **Calendario** de `MarcasActivas` por `Fecha`.
- **Panel** con un gráfico de marcas por hábito.
- **Botón de acción** "Marcar hoy" en la vista de detalle de un hábito: añade una fila a `Marcas` con `HabitoID = [_THISROW].[ID]`.

## Reglas al editar desde la hoja o AppSheet

- **Borrar una marca:** puedes eliminar la fila o poner `Eliminado = TRUE`.
- **Quitar un hábito:** pon fecha en `ArchivadoEl`. **No borres la fila**: la app conservaría el hábito y perderías la relación con sus marcas.
- **No cambies los `ID`** de filas existentes.
- **No edites `Perfil.seed`:** decide los premios de los cofres y debe ser la misma en todos los dispositivos.

## Seguridad

- El token es como una contraseña: quien tenga la URL **y** el token puede leer y escribir la hoja.
- Para cambiarlo: en Apps Script → **Configuración del proyecto → Propiedades de la secuencia de comandos** → edita `NE_TOKEN`, y vuelve a conectar la app.
- La copia de seguridad (Ajustes → Exportar) **no incluye** la URL ni el token.
