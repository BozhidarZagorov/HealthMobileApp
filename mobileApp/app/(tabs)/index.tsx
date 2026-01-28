import { Text, View, Button, Platform, Alert } from 'react-native'
import { useState, useEffect } from 'react'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Calendar } from 'react-native-calendars'
import AsyncStorage from '@react-native-async-storage/async-storage'
import 'react-native-get-random-values'
import { normalizeDate, addInjectionToMonth, STORAGE_KEYS, StoredScheduleItem } from '../../utils/injectionLog'
import {scheduleInjectionNotifications} from '../../utils/scheduleNotifications'

type MarkedDates = {
  [date: string]: { marked: boolean; dots: { key: string; color: string }[] }
}

export default function HomeScreen() {
  const [firstResupply, setFirstResupply] = useState<Date | null>(null)
  const [firstInjection, setFirstInjection] = useState<Date | null>(null)
  const [showPicker, setShowPicker] = useState<'resupply' | 'injection' | null>(null)
  const [markedDates, setMarkedDates] = useState<MarkedDates>({})

  useEffect(() => {
    const loadSavedDates = async () => {
      try {
        const resupplyStr = await AsyncStorage.getItem(STORAGE_KEYS.RESUPPLY)
        const injectionStr = await AsyncStorage.getItem(STORAGE_KEYS.INJECTION)

        if (resupplyStr && injectionStr) {
          const resupplyDate = new Date(resupplyStr)
          const injectionDate = new Date(injectionStr)
          setFirstResupply(resupplyDate)
          setFirstInjection(injectionDate)
          generateCalendar(resupplyDate, injectionDate)
        }
      } catch (error) {
        console.log('Failed to load saved dates', error)
      }
    }
    loadSavedDates()
  }, [])

  const generateCalendar = (resupplyDate: Date, injectionDate: Date) => {
    const marks: MarkedDates = {}
    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + 5)

    const resupply = new Date(resupplyDate)
    while (resupply <= endDate) {
      const str = resupply.toISOString().split('T')[0]
      marks[str] = { marked: true, dots: [{ key: 'resupply', color: 'green' }] }
      resupply.setDate(resupply.getDate() + 28)
    }

    const injection = new Date(injectionDate)
    while (injection <= endDate) {
      const str = injection.toISOString().split('T')[0]
      if (marks[str]) marks[str].dots.push({ key: 'injection', color: 'red' })
      else marks[str] = { marked: true, dots: [{ key: 'injection', color: 'red' }] }
      injection.setDate(injection.getDate() + 14)
    }

    setMarkedDates(marks)
  }

 const saveResupplyAndGenerate = async (resupply: Date) => {
  setFirstResupply(resupply)
  await AsyncStorage.setItem(
    STORAGE_KEYS.RESUPPLY,
    resupply.toISOString()
  )

  // Generate calendar dots (only if injection exists)
  if (firstInjection) {
    generateCalendar(resupply, firstInjection)
  }

  // Add ALL resupplies for this month (every 28 days)
  const month = resupply.getMonth()
  const year = resupply.getFullYear()
  const endOfMonth = new Date(year, month + 1, 0)

  const stored = await AsyncStorage.getItem(STORAGE_KEYS.MONTH_SCHEDULE)
  const existing: StoredScheduleItem[] = stored ? JSON.parse(stored) : []

  let current = normalizeDate(resupply)

  while (current <= endOfMonth) {
    if (
      current.getMonth() === month &&
      current.getFullYear() === year
    ) {
      const exists = existing.some(
        i =>
          i.type === 'resupply' &&
          i.date.slice(0, 10) === current.toISOString().slice(0, 10)
      )

      if (!exists) {
        await addInjectionToMonth({
          date: normalizeDate(current),
          type: 'resupply',
        })
        await scheduleInjectionNotifications(normalizeDate(current))
      }
    }

    current.setDate(current.getDate() + 28)
  }
}


  const saveInjectionAndGenerate = async (injection: Date) => {
  setFirstInjection(injection)
  await AsyncStorage.setItem(
    STORAGE_KEYS.INJECTION,
    injection.toISOString()
  )

  // Generate calendar dots
  if (firstResupply) {
    generateCalendar(firstResupply, injection)
  }

  // Add ALL injections for this month
  const month = injection.getMonth()
  const year = injection.getFullYear()

  const endOfMonth = new Date(year, month + 1, 0)

  const stored = await AsyncStorage.getItem(STORAGE_KEYS.MONTH_SCHEDULE)
  const existing: StoredScheduleItem[] = stored ? JSON.parse(stored) : []

  let current = normalizeDate(injection)

  while (current <= endOfMonth) {
    if (
      current.getMonth() === month &&
      current.getFullYear() === year
    ) {
      const exists = existing.some(
        i =>
          i.type === 'injection' &&
          i.date.slice(0, 10) === current.toISOString().slice(0, 10)
      )

      if (!exists) {
        await addInjectionToMonth({
          date: normalizeDate(current),
          type: 'injection',
        })
        await scheduleInjectionNotifications(normalizeDate(current))
      }
    }

    current.setDate(current.getDate() + 14)
  }
}



  const onDateChange = (event: any, selectedDate?: Date) => {
  // Android cancel
  if (Platform.OS === 'android' && event.type === 'dismissed') {
    setShowPicker(null)
    return
  }

  if (!selectedDate) {
    setShowPicker(null)
    return
  }

  setShowPicker(null)

  if (showPicker === 'resupply') {
    saveResupplyAndGenerate(selectedDate)
  }

  if (showPicker === 'injection') {
    saveInjectionAndGenerate(selectedDate)
  }
}


  const onDayPress = async (day: any) => {
  const date = normalizeDate(day.dateString)

  if (showPicker === 'resupply') {
    saveResupplyAndGenerate(date)
    return
  }

  if (showPicker === 'injection') {
    saveInjectionAndGenerate(date)
    return
  }

  const isInjectionDay = markedDates[day.dateString]?.dots?.some(
    d => d.key === 'injection'
  )

  if (!isInjectionDay) return

  Alert.alert(
    'Injection',
    'Add this injection to this month?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Done',
        onPress: async () => {
          await addInjectionToMonth({ date, type: 'injection' })
        },
      },
    ]
  )
}


  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 16, marginTop: 50 }}>
      <Text style={{ fontSize: 24, textAlign: 'center', marginBottom: 10, color: '#000' }}>
        Injection Tracker
      </Text>

      <View style={{ marginBottom: 10 }}>
        <Button title="Select first resupply" onPress={() => setShowPicker('resupply')} />
      </View>
      <View style={{ marginBottom: 10 }}>
        <Button title="Select first injection" onPress={() => setShowPicker('injection')} />
      </View>

      {showPicker && (
        <DateTimePicker
          value={showPicker === 'resupply' ? firstResupply ?? new Date() : firstInjection ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      <View style={{ marginTop: 20 }}>
        <Calendar markedDates={markedDates} markingType="multi-dot" onDayPress={onDayPress} />
      </View>

      <View style={{ flexDirection: 'column', justifyContent: 'center', marginTop: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 }}>
          <View style={{ width: 12, height: 12, backgroundColor: 'red', borderRadius: 6, marginRight: 5 }} />
          <Text>Injection</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 }}>
          <View style={{ width: 12, height: 12, backgroundColor: 'green', borderRadius: 6, marginRight: 5 }} />
          <Text>Resupply</Text>
        </View>
      </View>
    </View>
  )
}
