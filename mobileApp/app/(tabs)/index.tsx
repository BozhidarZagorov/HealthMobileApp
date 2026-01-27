import { Text, View, Button, Platform, Alert } from 'react-native'
import { useState, useEffect } from 'react'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Calendar } from 'react-native-calendars'
import AsyncStorage from '@react-native-async-storage/async-storage'
import 'react-native-get-random-values'
import { addInjectionToLog, addInjectionToMonth, STORAGE_KEYS, StoredScheduleItem } from '../../utils/injectionLog'

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
  await AsyncStorage.setItem(STORAGE_KEYS.RESUPPLY, resupply.toISOString())

  const injectionDate = firstInjection ?? new Date(resupply.getTime() + 14 * 24 * 60 * 60 * 1000)
  setFirstInjection(injectionDate)
  await AsyncStorage.setItem(STORAGE_KEYS.INJECTION, injectionDate.toISOString())

  generateCalendar(resupply, injectionDate)

  // ✅ Add the first resupply + first injection to month schedule
  await addInjectionToMonth({ date: resupply, type: 'resupply' })
  await addInjectionToMonth({ date: injectionDate, type: 'injection' })
}

  const saveInjectionAndGenerate = async (injection: Date) => {
  setFirstInjection(injection)
  await AsyncStorage.setItem(STORAGE_KEYS.INJECTION, injection.toISOString())

  if (firstResupply) generateCalendar(firstResupply, injection)

  // ✅ Add this injection to month schedule
  await addInjectionToMonth({ date: injection, type: 'injection' })
}


  const onDateChange = async (_: any, selectedDate?: Date) => {
    setShowPicker(null)
    if (!selectedDate) return
    if (showPicker === 'resupply') saveResupplyAndGenerate(selectedDate)
    if (showPicker === 'injection') saveInjectionAndGenerate(selectedDate)
  }

  const onDayPress = async (day: any) => {
    const date = new Date(day.dateString)

    if (showPicker === 'resupply') {
      saveResupplyAndGenerate(date)
      return
    }
    if (showPicker === 'injection') {
      saveInjectionAndGenerate(date)
      return
    }

    const isInjectionDay = markedDates[day.dateString]?.dots?.some(d => d.key === 'injection')
    if (!isInjectionDay) return

    await addInjectionToMonth({ date, type: 'injection' })
    Alert.alert(
      'Injection',
      'Add this injection to this month?',
      [
        { text: 'Cancel', style: 'cancel' },
        // { text: 'Done', onPress: () => addInjectionToMonth({ date, type: 'injection' }) },
        { text: 'Done'},

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
