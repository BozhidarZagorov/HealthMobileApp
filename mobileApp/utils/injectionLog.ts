import AsyncStorage from '@react-native-async-storage/async-storage'
import { nanoid } from 'nanoid'

export const STORAGE_KEYS = {
  INJECTION_LOG: 'injection_log',
  MONTH_SCHEDULE: 'month_schedule',
  RESUPPLY: 'first_resupply_date',
  INJECTION: 'first_injection_date',
}

export const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

// Schedule item used in memory
export type ScheduleItem = {
  id: string
  date: Date
  type: 'injection' | 'resupply'
  done?: boolean
}

// Stored schedule item (for AsyncStorage) — dates are strings
export type StoredScheduleItem = {
  id: string
  date: string
  type: 'injection' | 'resupply'
  done?: boolean
}

// Add an injection/resupply to this month (for Explore page)
export const addInjectionToMonth = async (item: Omit<ScheduleItem, 'id'>) => {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.MONTH_SCHEDULE)
  const existing: StoredScheduleItem[] = stored ? JSON.parse(stored) : []

  const entry: StoredScheduleItem = {
    id: nanoid(),
    date: item.date.toISOString(),
    type: item.type,
  }

  await AsyncStorage.setItem(
    STORAGE_KEYS.MONTH_SCHEDULE,
    JSON.stringify([entry, ...existing])
  )
}

// Add injection/resupply to history log
export const addInjectionToLog = async (item: Omit<ScheduleItem, 'id'>) => {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.INJECTION_LOG)
  const existing: StoredScheduleItem[] = stored ? JSON.parse(stored) : []

  const entry: StoredScheduleItem = {
    id: nanoid(),
    date: item.date.toISOString(),
    type: item.type,
    done: true,
  }

  await AsyncStorage.setItem(
    STORAGE_KEYS.INJECTION_LOG,
    JSON.stringify([entry, ...existing])
  )
}

// Get month-added items from AsyncStorage
export const getMonthAdded = async (): Promise<StoredScheduleItem[]> => {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.MONTH_SCHEDULE)
  return stored ? JSON.parse(stored) : []
}

// Get completed items for a month from history (to avoid re-adding when syncing)
export const getCompletedForMonth = async (
  month: number,
  year: number
): Promise<StoredScheduleItem[]> => {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.INJECTION_LOG)
  const all: StoredScheduleItem[] = stored ? JSON.parse(stored) : []
  return all.filter(item => {
    const d = new Date(item.date)
    return d.getMonth() === month && d.getFullYear() === year
  })
}

// Generate base month schedule
export const getMonthSchedule = (
  firstResupply: Date,
  firstInjection: Date,
  month: number,
  year: number
): ScheduleItem[] => {
  const items: ScheduleItem[] = []

  const endDate = new Date(year, month + 1, 0) // last day of month

  // Resupplies every 28 days
  let resupply = new Date(firstResupply)
  while (resupply <= endDate) {
    if (resupply.getMonth() === month && resupply.getFullYear() === year) {
      items.push({
        id: nanoid(),
        date: new Date(resupply),
        type: 'resupply',
      })
    }
    resupply.setDate(resupply.getDate() + 28)
  }

  // Injections every 14 days
  let injection = new Date(firstInjection)
  while (injection <= endDate) {
    if (injection.getMonth() === month && injection.getFullYear() === year) {
      items.push({
        id: nanoid(),
        date: new Date(injection),
        type: 'injection',
      })
    }
    injection.setDate(injection.getDate() + 14)
  }

  return items.sort((a, b) => a.date.getTime() - b.date.getTime())
}
