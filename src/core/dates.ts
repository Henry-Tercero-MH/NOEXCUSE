import { addDays, format, parseISO } from 'date-fns'
import type { ISODate } from './types'

export const toISO = (d: Date): ISODate => format(d, 'yyyy-MM-dd')
export const fromISO = (s: ISODate): Date => parseISO(s)
export const todayISO = (): ISODate => toISO(new Date())

export function eachDay(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = []
  for (let d = fromISO(from); toISO(d) <= to; d = addDays(d, 1)) out.push(toISO(d))
  return out
}

export const key = (habitId: string, date: ISODate) => `${habitId}|${date}`
