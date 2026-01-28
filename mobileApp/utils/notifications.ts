import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

export const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}
