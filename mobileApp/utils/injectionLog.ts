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
