import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import {
  getMonthSchedule,
  getMonthAdded,
  getCompletedForMonth,
  ScheduleItem,
  StoredScheduleItem,
  addInjectionToLog,
  STORAGE_KEYS,
} from '../../utils/injectionLog'
import { scheduleInjectionNotifications } from '../../utils/scheduleNotifications'



export default function ExploreScreen() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [schedule, setSchedule] = useState<ScheduleItem[]>([])

const syncBaseScheduleToMonth = async () => {
  const resupplyStr = await AsyncStorage.getItem(STORAGE_KEYS.RESUPPLY)
  const injectionStr = await AsyncStorage.getItem(STORAGE_KEYS.INJECTION)
  if (!resupplyStr || !injectionStr) return

  const firstResupply = new Date(resupplyStr)
  const firstInjection = new Date(injectionStr)

  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()

  const baseSchedule = getMonthSchedule(firstResupply, firstInjection, month, year)

  const monthAddedRaw: StoredScheduleItem[] = (await getMonthAdded()).filter(item => {
    const d = new Date(item.date)
    return d.getMonth() === month && d.getFullYear() === year
  })

  const completedForMonth = await getCompletedForMonth(month, year)

  const merged: StoredScheduleItem[] = [...monthAddedRaw]

  const toDateKey = (d: Date | string) =>
    (typeof d === 'string' ? new Date(d) : d).toISOString().slice(0, 10)

  for (const item of baseSchedule) {
    const key = toDateKey(item.date)
    const inSchedule = monthAddedRaw.some(
      i => toDateKey(i.date) === key && i.type === item.type
    )
    const alreadyDone = completedForMonth.some(
      i => toDateKey(i.date) === key && i.type === item.type
    )

    if (!inSchedule && !alreadyDone) {
      merged.push({
        id: item.id,
        date: item.date.toISOString(),
        type: item.type,
      })

      await scheduleInjectionNotifications(item.date)
    }
  }

  await AsyncStorage.setItem(STORAGE_KEYS.MONTH_SCHEDULE, JSON.stringify(merged))
}
  const loadSchedule = async () => {
    const monthScheduleRaw: StoredScheduleItem[] = await getMonthAdded()

    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()

    const schedule: ScheduleItem[] = monthScheduleRaw
      .map(item => ({
        id: item.id,
        date: new Date(item.date),
        type: item.type,
      }))
      .filter(item => item.date.getMonth() === month && item.date.getFullYear() === year)

    setSchedule(schedule.sort((a, b) => a.date.getTime() - b.date.getTime()))
  }

  useFocusEffect(
    useCallback(() => {
      ;(async () => {
        await syncBaseScheduleToMonth()
        await loadSchedule()
      })()
    }, [])
  )

  const markAsDone = async (item: ScheduleItem) => {
    const monthScheduleRaw = await getMonthAdded()
    const updated = monthScheduleRaw.filter(i => i.id !== item.id)
    await AsyncStorage.setItem(STORAGE_KEYS.MONTH_SCHEDULE, JSON.stringify(updated))
    await addInjectionToLog({ date: item.date, type: item.type })
    loadSchedule()
  }
  return (
    <View style={{ flex: 1, padding: 16, marginTop: 50, backgroundColor: isDark ? '#000' : '#fff' }}>
      <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 12, color: isDark ? '#fff' : '#000' }}>
        This Month's Schedule
      </Text>

      {schedule.length === 0 ? (
        <Text style={{ color: isDark ? '#aaa' : '#666', marginTop: 20 }}>
          No injections or resupplies left for this month.
        </Text>
      ) : (
        <FlatList
          data={schedule}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View
              style={{
                padding: 12,
                marginVertical: 6,
                backgroundColor: item.type === 'injection' ? '#f9c0c0' : '#c0f9c3',
                borderRadius: 8,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Text style={{ fontSize: 16 }}>
                {item.type === 'injection' ? 'Injection' : 'Resupply'}: {item.date.toDateString()}
              </Text>

              <TouchableOpacity
                onPress={() => markAsDone(item)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: '#3498db',
                  borderRadius: 6
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Mark Done</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  )
}
