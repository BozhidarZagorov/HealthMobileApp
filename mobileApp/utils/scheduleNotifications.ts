import * as Notifications from 'expo-notifications'

const setTime = (date: Date, hour = 9) => {
  const d = new Date(date)
  d.setHours(hour, 0, 0, 0)
  return d
}

