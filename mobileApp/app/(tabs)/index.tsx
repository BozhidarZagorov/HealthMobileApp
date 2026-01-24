import { Text, View, Button, Platform } from 'react-native'
import { useState } from 'react'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Calendar } from 'react-native-calendars'

export default function HomeScreen() {
  const [firstResupply, setFirstResupply] = useState<Date | null>(null)
  const [firstInjection, setFirstInjection] = useState<Date | null>(null)
  const [showPicker, setShowPicker] = useState<'resupply' | 'injection' | null>(null)
  const [markedDates, setMarkedDates] = useState<any>({})

  const generateCalendar = (resupplyDate: Date, injectionDate: Date) => {
    const marks: any = {}
    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + 5)

    // Resupplies every 28 days
    const resupply = new Date(resupplyDate)
    while (resupply <= endDate) {
      const str = resupply.toISOString().split('T')[0]
      marks[str] = { marked: true, dotColor: 'green' }
      resupply.setDate(resupply.getDate() + 28)
    }

    // Injections every 14 days
    const injection = new Date(injectionDate)
    while (injection <= endDate) {
      const str = injection.toISOString().split('T')[0]
      if (marks[str]) {
        // Already a resupply, show both dots
        marks[str].dots = [
          { key: 'resupply', color: 'green' },
          { key: 'injection', color: 'red' },
        ]
        delete marks[str].marked
        delete marks[str].dotColor
      } else {
        marks[str] = { marked: true, dotColor: 'red' }
      }
      injection.setDate(injection.getDate() + 14)
    }

    setMarkedDates(marks)
  }

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowPicker(null)
    if (!selectedDate) return

    if (showPicker === 'resupply') {
      setFirstResupply(selectedDate)
      // Auto-set first injection 1 day after resupply if not yet set
      const injectionDate = firstInjection ?? new Date(selectedDate)
      injectionDate.setDate(injectionDate.getDate() + 1)
      setFirstInjection(injectionDate)
      generateCalendar(selectedDate, injectionDate)
    } else if (showPicker === 'injection') {
      setFirstInjection(selectedDate)
      if (firstResupply) {
        generateCalendar(firstResupply, selectedDate)
      }
    }
  }

