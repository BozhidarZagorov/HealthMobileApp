import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import { STORAGE_KEYS, StoredScheduleItem } from '../../utils/injectionLog'
import { nanoid } from 'nanoid'

export type HistoryItem = StoredScheduleItem

export default function HistoryScreen() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [history, setHistory] = useState<HistoryItem[]>([])

  const loadHistory = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.INJECTION_LOG)
    if (!stored) return

    const parsed: StoredScheduleItem[] = JSON.parse(stored)

    setHistory(
      parsed.map(item => ({
        ...item,
        id: item.id, // trust storage
      }))
    )
  } catch (error) {
    console.log('Failed to load history', error)
  }
}


  useFocusEffect(useCallback(() => {
    loadHistory()
  }, []))

  const toggleDone = async (id: string) => {
    const updated = history.map(item => (item.id === id ? { ...item, done: !item.done } : item))
    setHistory(updated)
    await AsyncStorage.setItem(STORAGE_KEYS.INJECTION_LOG, JSON.stringify(updated))
  }

  const deleteEntry = async (id: string) => {
    const updated = history.filter(item => item.id !== id)
    setHistory(updated)
    await AsyncStorage.setItem(STORAGE_KEYS.INJECTION_LOG, JSON.stringify(updated))
  }

  return (
    <View style={{ flex: 1, padding: 16, marginTop: 40, backgroundColor: isDark ? '#000' : '#fff' }}>
      <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 12, color: isDark ? '#fff' : '#000' }}>
        Injection & Resupply History
      </Text>

      <FlatList
        data={[...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={{ color: isDark ? '#aaa' : '#666', marginTop: 20 }}>
            No injections or resupplies logged yet
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              padding: 16,
              marginVertical: 8,
              backgroundColor: isDark ? '#1e1e1e' : '#f2f2f2',
              borderRadius: 10
            }}
          >
            <Text style={{ color: isDark ? '#fff' : '#000', fontSize: 16, fontWeight: '500' }}>
              {item.type === 'injection' ? 'Injection' : 'Resupply'}: {new Date(item.date).toDateString()}
            </Text>

            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <TouchableOpacity onPress={() => toggleDone(item.id)}>
                <Text style={{ color: item.done ? '#2ecc71' : '#f39c12', fontWeight: '600' }}>
                  {item.done ? 'DONE' : 'MARK DONE'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => deleteEntry(item.id)} style={{ marginLeft: 24 }}>
                <Text style={{ color: '#e74c3c', fontWeight: '600' }}>DELETE</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  )
}
