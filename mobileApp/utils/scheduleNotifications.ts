import * as Notifications from 'expo-notifications'

const setTime = (date: Date, hour = 9) => {
  const d = new Date(date)
  d.setHours(hour, 0, 0, 0)
  return d
}

export const scheduleInjectionNotifications = async (date: Date) => {
  const oneDayBefore = new Date(date)
  oneDayBefore.setDate(oneDayBefore.getDate() - 1)

  const beforeTrigger = setTime(oneDayBefore)
  const sameDayTrigger = setTime(date)

  if (beforeTrigger > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Injection tomorrow',
        body: 'You have an injection scheduled for tomorrow 💉',
      },
      trigger: beforeTrigger as any, // 👈 cast as any
    })
  }

  if (sameDayTrigger > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Injection today',
        body: 'Today is your injection day 💉',
      },
      trigger: sameDayTrigger as any, // 👈 cast as any
    })
  }
}
