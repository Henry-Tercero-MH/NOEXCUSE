# No Excuses

App de hábitos gamificada (web primero, móvil con React Native después).

```bash
npm install
npm run dev     # http://localhost:5173
npm run build
```

## Estructura

```
src/
  core/      Lógica pura en TypeScript, sin DOM (XP, niveles, rachas, congeladores, logros).
             Se mueve tal cual a packages/core cuando exista la app móvil.
  lib/       Store (zustand + persist), iconos de Lucide, sonido/vibración/confeti.
  components/ Ring, XpBar, HabitCard, Medal, HabitSheet
  screens/   Onboarding, Hoy, Mes, Estadísticas, Logros
```

## Reglas del juego

| Mecánica | Regla |
|---|---|
| XP por hábito | 10 × dificultad (Fácil x1, Media x1,5, Difícil x2) |
| Multiplicador por constancia | Según el % cumplido en los últimos 28 días: ≥60 % x1,1 · ≥75 % x1,2 · ≥90 % x1,3. Fallar un día apenas lo mueve |
| Día completo | Todo hecho contando versiones mínimas: +25 XP, anillo plateado |
| Día perfecto | Todo al 100 %: +50 XP, anillo dorado y confeti |
| Cofre del día | Se desbloquea con el primer hábito. 70 % 10-25 XP · 22 % 40-60 XP · 6 % congelador · 2 % 150 XP. Determinista por fecha |
| A tiempo | +5 XP si marcas el hábito a ±90 min de la hora de su plan ("Después de ___ a las __:__") |
| Accesibilidad | Ajustes → Colores para daltonismo. Los estados llevan además patrón: sólido = completo, rayado = mínimo, puntos = a medias |
| Congelador | Ganas 1 cada 7 días de racha (máx. 2). Protege la racha un día que fallas |
| Hábitos con cantidad | Meta diaria (p. ej. 10 páginas); cada toque suma 1 |
| Versión mínima | Mantiene la racha y cuenta para el % del día; da la mitad de XP y no cuenta para el día perfecto |
| Tienda | Saldo = XP ganada − XP gastada. Congelador: 200 XP (máx. 3). Temas: 600-2.500 XP. El nivel nunca baja |
| Copia de seguridad | Ajustes → Exportar/Importar (JSON) |
| Niveles | Del nivel n al n+1 hacen falta 200·n + 100 XP |
| Rangos | Novato → Disciplinado → Constante → Imparable → Élite → Titán → Leyenda → Sin Excusas |

Todo se deriva de `habits + completions`, así que deshacer una marca nunca deja datos inconsistentes.

## Hoja de ruta

1. **Siguiente:** cofre diario con recompensa variable, desafío semanal, combo, notificación de racha en peligro (PWA).
2. **Móvil:** monorepo (pnpm + Turborepo) con `packages/core` y `apps/mobile` en Expo.
   Equivalencias: `lucide-react-native`, `react-native-reanimated`, `victory-native`, `expo-haptics`, `react-native-mmkv`.
3. **Sincronización:** backend (Supabase) para usar la misma cuenta en web y móvil.
