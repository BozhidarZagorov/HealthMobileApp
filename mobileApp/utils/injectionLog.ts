import AsyncStorage from '@react-native-async-storage/async-storage'
import { nanoid } from 'nanoid'

export const STORAGE_KEYS = {
  INJECTION_LOG: 'injection_log',
  MONTH_SCHEDULE: 'month_schedule',
  RESUPPLY: 'first_resupply_date',
  INJECTION: 'first_injection_date',
}

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

