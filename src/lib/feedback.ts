import confetti from 'canvas-confetti'
import { useStore } from './store'

const BRAND = ['#2EE6C8', '#FF6B5B', '#2EE66B', '#FFD600']
// escala pentatónica: cada hábito del día suena un poco más agudo
const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5]

let ctx: AudioContext | null = null
const audio = () => (ctx ??= new AudioContext())

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function tone(freq: number, start = 0, dur = 0.14, gain = 0.12) {
  if (!useStore.getState().settings.sound) return
  try {
    const a = audio()
    const t = a.currentTime + start
    const osc = a.createOscillator()
    const g = a.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(gain, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g).connect(a.destination)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  } catch {
    /* audio no disponible */
  }
}

function vibrate(pattern: number | number[]) {
  if (useStore.getState().settings.haptics) navigator.vibrate?.(pattern)
}

export const feedback = {
  check(nthToday: number) {
    tone(NOTES[Math.min(nthToday, NOTES.length - 1)])
    vibrate(12)
  },
  tick(ratio: number) {
    tone(392 + ratio * 400, 0, 0.08, 0.07)
    vibrate(6)
  },
  uncheck() {
    tone(260, 0, 0.1, 0.06)
  },
  perfectDay() {
    ;[0, 0.12, 0.24, 0.42].forEach((s, i) => tone([523.25, 659.25, 783.99, 1046.5][i], s, 0.4))
    vibrate([20, 40, 20, 40, 60])
    if (reducedMotion()) return
    const burst = (x: number, angle: number) =>
      confetti({ particleCount: 90, angle, spread: 70, origin: { x, y: 0.7 }, colors: BRAND, scalar: 1.1, disableForReducedMotion: true })
    burst(0.1, 60)
    burst(0.9, 120)
    setTimeout(() => confetti({ particleCount: 120, spread: 120, origin: { y: 0.35 }, colors: ['#FFD600', '#FFF3A3'], shapes: ['star'], disableForReducedMotion: true }), 250)
  },
  completeDay() {
    ;[0, 0.12, 0.26].forEach((s, i) => tone([523.25, 659.25, 783.99][i], s, 0.3))
    vibrate([20, 40, 40])
    if (reducedMotion()) return
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: ['#CBD5E1', '#F1F5F9', '#2EE6C8'], disableForReducedMotion: true })
  },
  levelUp() {
    ;[0, 0.1, 0.2, 0.3, 0.5].forEach((s, i) => tone([392, 523.25, 659.25, 783.99, 1046.5][i], s, 0.35))
    vibrate([30, 30, 30, 30, 80])
    if (reducedMotion()) return
    confetti({ particleCount: 200, spread: 160, startVelocity: 45, origin: { y: 0.4 }, colors: BRAND, disableForReducedMotion: true })
  },
  achievement() {
    tone(880, 0, 0.2)
    tone(1318.5, 0.12, 0.35)
    if (!reducedMotion()) confetti({ particleCount: 60, spread: 60, origin: { y: 0.3 }, colors: ['#FFD600', '#2EE6C8'], disableForReducedMotion: true })
  },
}
