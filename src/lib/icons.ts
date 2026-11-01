import {
  AlarmClock, Apple, Bed, Bike, BookOpen, Brain, Brush, Code, Coffee, Dumbbell, Footprints, GlassWater,
  Guitar, Heart, Languages, Leaf, Moon, Music, NotebookPen, PenLine, PiggyBank, Pill, Salad, Smartphone,
  Sun, Target, Timer, Wallet, Waves, Wind, Zap, Star, Flame, Sunrise, Sparkles, CalendarCheck, Gem,
  RotateCcw, Snowflake, Shield, Crown, Trophy, Mountain, Ban, Droplets, HandHeart, Feather,
  ShowerHead, PhoneOff, ListTodo, BedDouble, Receipt, ChartLine, Briefcase, Headphones, Lightbulb, MonitorOff,
  Sunset, Phone, Handshake, Users, Focus, WineOff, CircleDollarSign, HeartPulse,
  type LucideIcon,
} from 'lucide-react'
import type { HabitColor } from '../core/types'

// Mapa curado: el hábito guarda el nombre como string (portable a lucide-react-native)
export const ICONS: Record<string, LucideIcon> = {
  AlarmClock, Apple, Bed, Bike, BookOpen, Brain, Brush, Code, Coffee, Dumbbell, Footprints, GlassWater,
  Guitar, Heart, Languages, Leaf, Moon, Music, NotebookPen, PenLine, PiggyBank, Pill, Salad, Smartphone,
  Sun, Target, Timer, Wallet, Waves, Wind, Zap, Droplets, HandHeart, Ban,
  ShowerHead, PhoneOff, ListTodo, BedDouble, Receipt, ChartLine, Briefcase, Headphones, Lightbulb, MonitorOff,
  Sunset, Phone, Handshake, Users, Focus, WineOff, CircleDollarSign, HeartPulse,
  // usados por logros
  Star, Flame, Sunrise, Sparkles, CalendarCheck, Gem, RotateCcw, Snowflake, Shield, Crown, Trophy, Mountain, Feather,
}

export const HABIT_ICON_CHOICES = [
  'AlarmClock', 'Brain', 'BookOpen', 'Apple', 'Dumbbell', 'GlassWater', 'Footprints', 'Bike', 'Bed', 'Moon',
  'Sun', 'Salad', 'Pill', 'Droplets', 'Coffee', 'Ban', 'Smartphone', 'Code', 'Languages', 'Guitar', 'Music',
  'Brush', 'PenLine', 'NotebookPen', 'PiggyBank', 'Wallet', 'Heart', 'HandHeart', 'Leaf', 'Wind', 'Waves',
  'Timer', 'Target', 'Zap', 'ShowerHead', 'PhoneOff', 'ListTodo', 'BedDouble', 'Receipt', 'ChartLine', 'Briefcase',
  'Headphones', 'Lightbulb', 'MonitorOff', 'Sunset', 'Phone', 'Handshake', 'Users', 'Focus', 'WineOff', 'CircleDollarSign', 'HeartPulse',
]

export const iconFor = (name: string): LucideIcon => ICONS[name] ?? Target

export type PaletteId = 'vivid' | 'accessible'

const VIVID: Record<HabitColor, string> = {
  teal: '#2EE6C8',
  coral: '#FF6B5B',
  green: '#2EE66B',
  gold: '#FFD600',
  violet: '#A78BFA',
  sky: '#7DD3FC',
  pink: '#F472B6',
  orange: '#FB923C',
}

// Paleta para daltonismo: optimizada en OKLCH sobre la tarjeta #151A2E.
// ΔE mínimo (OKLab ×100): protanopía 12.7 · deuteranopía 13.1 · tritanopía 12.9 (la vívida: 4.3 · 5.8 · 3.0).
// Contraste ≥ 4.5:1 sobre la tarjeta. Los estados además llevan patrón/icono, así que nunca dependen solo del color.
const ACCESSIBLE: Record<HabitColor, string> = {
  teal: '#49FCFB',
  coral: '#EA9BA3',
  green: '#E0FE81',
  gold: '#B2CD11',
  violet: '#3B7EFC',
  sky: '#76C1FA',
  pink: '#AB789C',
  orange: '#E95A33',
}

/** Colores activos. Se mutan en sitio con applyPalette para que todos los componentes los lean igual. */
export const COLORS: Record<HabitColor, string> = { ...VIVID }

// Colores por semana del mes (cuadrícula Mes)
export const WEEK_COLORS: string[] = []

export function applyPalette(p: PaletteId) {
  const src = p === 'accessible' ? ACCESSIBLE : VIVID
  Object.assign(COLORS, src)
  WEEK_COLORS.splice(0, WEEK_COLORS.length, src.green, src.coral, src.teal, src.gold, src.violet)
}
applyPalette('vivid')
