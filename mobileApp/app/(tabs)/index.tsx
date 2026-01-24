import { Text, View, Button, Platform } from 'react-native'
import { useState } from 'react'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Calendar } from 'react-native-calendars'

export default function HomeScreen() {
  const [firstResupply, setFirstResupply] = useState<Date | null>(null)
  const [firstInjection, setFirstInjection] = useState<Date | null>(null)
  const [showPicker, setShowPicker] = useState<'resupply' | 'injection' | null>(null)
  const [markedDates, setMarkedDates] = useState<any>({})

