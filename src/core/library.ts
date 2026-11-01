import type { Habit } from './types'

export type CategoryId = 'manana' | 'cuerpo' | 'mente' | 'dinero' | 'crecimiento' | 'noche' | 'relaciones'

export const CATEGORIES: { id: CategoryId; name: string; icon: string }[] = [
  { id: 'manana', name: 'Mañana', icon: 'Sunrise' },
  { id: 'cuerpo', name: 'Cuerpo', icon: 'Dumbbell' },
  { id: 'mente', name: 'Mente', icon: 'Brain' },
  { id: 'dinero', name: 'Dinero', icon: 'PiggyBank' },
  { id: 'crecimiento', name: 'Crecimiento', icon: 'BookOpen' },
  { id: 'noche', name: 'Noche', icon: 'Moon' },
  { id: 'relaciones', name: 'Relaciones', icon: 'Users' },
]

export type Template = Omit<Habit, 'id' | 'order' | 'createdAt'> & {
  key: string
  category: CategoryId
  why: string
}

const t = (key: string, category: CategoryId, h: Partial<Template> & Pick<Template, 'name' | 'icon' | 'color' | 'why'>): Template => ({
  key,
  category,
  difficulty: 1,
  days: [],
  target: 1,
  ...h,
})

const WEEKDAYS = [1, 2, 3, 4, 5]

export const LIBRARY: Template[] = [
  // Mañana
  t('wake-early', 'manana', { name: 'Levantarme a las 5:30 AM', icon: 'AlarmClock', color: 'gold', difficulty: 2, minLabel: 'Levantarme antes de las 7', why: 'Ganas una o dos horas sin interrupciones antes de que el mundo despierte.' }),
  t('make-bed', 'manana', { name: 'Tender la cama', icon: 'BedDouble', color: 'sky', why: 'Una victoria pequeña y temprana que marca el tono del día.' }),
  t('cold-shower', 'manana', { name: 'Ducha fría', icon: 'ShowerHead', color: 'sky', difficulty: 1.5, minLabel: '30 segundos de agua fría', why: 'Entrenas tu voluntad haciendo algo incómodo a propósito.' }),
  t('no-phone-am', 'manana', { name: 'Sin celular la primera hora', icon: 'PhoneOff', color: 'violet', difficulty: 1.5, minLabel: 'Sin celular 15 minutos', why: 'Empiezas el día con tus prioridades, no con las de los demás.' }),
  t('plan-day', 'manana', { name: 'Definir mis 3 tareas clave', icon: 'ListTodo', color: 'teal', why: 'Decidir qué importa antes de empezar evita pasar el día reaccionando.' }),
  t('sunlight', 'manana', { name: 'Luz solar 10 minutos', icon: 'Sun', color: 'gold', minLabel: 'Abrir ventanas y salir 2 minutos', why: 'La luz de la mañana ayuda a regular tu reloj interno y tu sueño.' }),

  // Cuerpo
  t('workout', 'cuerpo', { name: 'Entrenar 45 minutos', icon: 'Dumbbell', color: 'violet', difficulty: 2, days: [1, 2, 3, 4, 5, 6], minLabel: '10 flexiones', why: 'El ejercicio regular mejora energía, ánimo y concentración.' }),
  t('walk', 'cuerpo', { name: 'Caminar 30 minutos', icon: 'Footprints', color: 'green', minLabel: 'Caminar 10 minutos', why: 'Moverte a diario es la base de la salud a largo plazo, y además despeja la mente.' }),
  t('water', 'cuerpo', { name: 'Tomar agua', icon: 'GlassWater', color: 'sky', target: 8, unit: 'vasos', minValue: 4, why: 'Incluso una deshidratación leve afecta el rendimiento y el ánimo.' }),
  t('macros', 'cuerpo', { name: 'Contabilizar mis macros', icon: 'Apple', color: 'green', why: 'Lo que se mide se mejora: registrar te hace consciente de lo que comes.' }),
  t('veggies', 'cuerpo', { name: 'Verduras en mis comidas', icon: 'Salad', color: 'green', target: 2, unit: 'comidas', minValue: 1, why: 'Más fibra y nutrientes con un cambio fácil de sostener.' }),
  t('no-sugar', 'cuerpo', { name: 'Cero azúcar añadida', icon: 'Ban', color: 'coral', difficulty: 1.5, why: 'Menos picos de energía y antojos a lo largo del día.' }),
  t('no-alcohol', 'cuerpo', { name: 'Sin alcohol', icon: 'WineOff', color: 'coral', difficulty: 1.5, why: 'Mejor sueño, más claridad y más dinero en tu bolsillo.' }),
  t('sleep', 'cuerpo', { name: 'Dormir 7-8 horas', icon: 'Bed', color: 'violet', difficulty: 1.5, why: 'El sueño es el multiplicador de todo lo demás: energía, memoria y decisiones.' }),

  // Mente
  t('meditate', 'mente', { name: 'Meditar 10 minutos', icon: 'Brain', color: 'teal', difficulty: 1.5, minLabel: 'Respirar 2 minutos', why: 'Entrena la atención y te ayuda a responder en lugar de reaccionar.' }),
  t('journal', 'mente', { name: 'Escribir en mi diario', icon: 'NotebookPen', color: 'pink', minLabel: 'Escribir una sola línea', why: 'Escribir ordena tus ideas y te muestra patrones que no ves en tu cabeza.' }),
  t('gratitude', 'mente', { name: 'Anotar agradecimientos', icon: 'Heart', color: 'pink', target: 3, unit: 'cosas', minValue: 1, why: 'Entrena a tu mente a notar lo que sí funciona.' }),
  t('deep-work', 'mente', { name: 'Trabajo profundo 90 minutos', icon: 'Focus', color: 'teal', difficulty: 2, days: WEEKDAYS, minLabel: '25 minutos sin distracciones', why: 'El trabajo de más valor exige bloques largos de concentración sin interrupciones.' }),
  t('less-social', 'mente', { name: 'Máximo 30 min de redes sociales', icon: 'Smartphone', color: 'coral', difficulty: 1.5, why: 'Recuperas horas a la semana para lo que de verdad te hace avanzar.' }),

  // Dinero
  t('track-expenses', 'dinero', { name: 'Registrar mis gastos', icon: 'Receipt', color: 'gold', why: 'No puedes controlar lo que no ves. Es el primer paso de cualquier plan financiero.' }),
  t('pay-yourself', 'dinero', { name: 'Ahorrar antes de gastar', icon: 'PiggyBank', color: 'green', difficulty: 1.5, days: [1], why: 'Págate primero: separa tu ahorro antes de que el dinero se vaya en otras cosas.' }),
  t('no-impulse', 'dinero', { name: 'Cero compras impulsivas', icon: 'CircleDollarSign', color: 'coral', difficulty: 1.5, why: 'Esperar 48 horas antes de comprar elimina la mayoría de gastos innecesarios.' }),
  t('learn-invest', 'dinero', { name: 'Aprender sobre inversión 15 min', icon: 'ChartLine', color: 'gold', minLabel: 'Leer un artículo corto', why: 'El conocimiento financiero se acumula igual que el interés compuesto.' }),
  t('side-project', 'dinero', { name: 'Trabajar en mi negocio 1 hora', icon: 'Briefcase', color: 'violet', difficulty: 2, minLabel: '15 minutos de avance', why: 'Construir algo propio, poco a poco, es la vía más común hacia más ingresos.' }),
  t('weekly-finance', 'dinero', { name: 'Revisar mis finanzas de la semana', icon: 'Wallet', color: 'gold', difficulty: 1.5, days: [0], why: 'Una revisión semanal te permite corregir el rumbo antes de que sea tarde.' }),

  // Crecimiento
  t('read', 'crecimiento', { name: 'Leer', icon: 'BookOpen', color: 'coral', target: 20, unit: 'páginas', minValue: 1, why: 'Leer a diario es uno de los hábitos que más comparten las personas de alto rendimiento.' }),
  t('audio-learn', 'crecimiento', { name: 'Podcast o audiolibro educativo', icon: 'Headphones', color: 'sky', why: 'Conviertes trayectos y tareas rutinarias en tiempo de aprendizaje.' }),
  t('language', 'crecimiento', { name: 'Practicar un idioma 15 min', icon: 'Languages', color: 'teal', minLabel: 'Repasar 5 palabras', why: 'Un idioma nuevo abre oportunidades de trabajo, negocio y viaje.' }),
  t('key-skill', 'crecimiento', { name: 'Practicar mi habilidad clave 30 min', icon: 'Target', color: 'violet', difficulty: 1.5, minLabel: '10 minutos de práctica', why: 'La práctica deliberada y diaria es lo que separa a los buenos de los excelentes.' }),
  t('review-goals', 'crecimiento', { name: 'Leer mis metas', icon: 'Lightbulb', color: 'gold', why: 'Tener tus metas presentes cada día hace que tus decisiones se alineen con ellas.' }),

  // Noche
  t('plan-tomorrow', 'noche', { name: 'Preparar el día de mañana', icon: 'CalendarCheck', color: 'teal', why: 'Despiertas sabiendo qué hacer, sin gastar voluntad en decidir.' }),
  t('screens-off', 'noche', { name: 'Pantallas apagadas 1 h antes de dormir', icon: 'MonitorOff', color: 'violet', difficulty: 1.5, minLabel: '20 minutos sin pantallas', why: 'Te ayuda a conciliar el sueño más rápido y a descansar mejor.' }),
  t('reflect', 'noche', { name: 'Reflexión: qué salió bien hoy', icon: 'Sunset', color: 'orange', why: 'Cerrar el día revisando lo aprendido acelera tu mejora.' }),
  t('bedtime', 'noche', { name: 'Acostarme antes de las 10:30 PM', icon: 'Moon', color: 'violet', difficulty: 1.5, why: 'Levantarte temprano empieza la noche anterior.' }),

  // Relaciones
  t('reach-out', 'relaciones', { name: 'Escribir o llamar a alguien importante', icon: 'Phone', color: 'pink', why: 'Las relaciones fuertes son uno de los mejores predictores de una vida feliz.' }),
  t('network', 'relaciones', { name: 'Contactar a alguien de mi red profesional', icon: 'Handshake', color: 'gold', days: WEEKDAYS, why: 'Muchas oportunidades llegan por contactos, no por currículums.' }),
  t('family-time', 'relaciones', { name: 'Tiempo de calidad sin celular', icon: 'Users', color: 'pink', minLabel: '15 minutos presentes', why: 'Estar presente con los tuyos es lo que más se valora con los años.' }),
]

export const PACKS: { id: string; name: string; description: string; icon: string; color: string; keys: string[] }[] = [
  {
    id: 'millonaria',
    name: 'Rutina millonaria',
    description: 'Madrugar, enfoque, lectura y dinero bajo control.',
    icon: 'Crown',
    color: '#FFD600',
    keys: ['wake-early', 'plan-day', 'read', 'deep-work', 'track-expenses', 'learn-invest'],
  },
  {
    id: 'disciplina',
    name: 'Disciplina total',
    description: 'Hábitos duros que forjan carácter.',
    icon: 'Shield',
    color: '#2EE6C8',
    keys: ['wake-early', 'make-bed', 'cold-shower', 'workout', 'no-phone-am', 'bedtime'],
  },
  {
    id: 'mente-cuerpo',
    name: 'Mente y cuerpo',
    description: 'Energía, calma y salud de base.',
    icon: 'HeartPulse',
    color: '#2EE66B',
    keys: ['meditate', 'walk', 'water', 'sleep', 'journal', 'sunlight'],
  },
  {
    id: 'finanzas',
    name: 'Libertad financiera',
    description: 'Gasta consciente, ahorra primero, construye ingresos.',
    icon: 'PiggyBank',
    color: '#FF6B5B',
    keys: ['track-expenses', 'pay-yourself', 'no-impulse', 'weekly-finance', 'learn-invest', 'side-project'],
  },
]

export const templateByKey = (key: string) => LIBRARY.find((x) => x.key === key)!

/** Convierte una plantilla en datos de hábito (sin los campos propios del catálogo). */
export function fromTemplate({ key, category: _c, why: _w, ...h }: Template): Omit<Habit, 'id' | 'order' | 'createdAt'> {
  return { ...h, templateKey: key }
}
