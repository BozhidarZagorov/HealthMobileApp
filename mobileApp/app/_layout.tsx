import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'

import { useColorScheme } from '@/hooks/use-color-scheme'
import { requestNotificationPermission } from '@/utils/notifications'

export const unstable_settings = {
  anchor: '(tabs)',
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // New recommended fields
    shouldShowAlert: true,    // still works, optional
    shouldShowBanner: true,   // required now
    shouldShowList: true,     // required now
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export default function RootLayout() {
  const colorScheme = useColorScheme()

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}
