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

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 16, marginTop:50 }}>
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
          value={
            showPicker === 'resupply'
              ? firstResupply ?? new Date()
              : firstInjection ?? new Date()
          }
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      <View style={{ marginTop: 20 }}>
        <Calendar markedDates={markedDates} />
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'column', justifyContent: 'center', marginTop: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 }}>
          <View
            style={{ width: 12, height: 12, backgroundColor: 'red', borderRadius: 6, marginRight: 5 }}
          />
          <Text>Injection</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 }}>
          <View
            style={{ width: 12, height: 12, backgroundColor: 'green', borderRadius: 6, marginRight: 5 }}
          />
          <Text>Resupply</Text>
        </View>
      </View>
    </View>
  )
}