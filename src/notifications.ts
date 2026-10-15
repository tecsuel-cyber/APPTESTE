import * as Notifications from 'expo-notifications';
import { messages, messageForDay } from './messages';

export const CHANNEL = 'daily-encouragement';
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});
export async function prepareNotifications() {
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Mensagem de autocuidado', importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Permita as notificações nas configurações do Android para receber os lembretes.');
}
export async function scheduleDaily(hour: number, minute: number) {
  await prepareNotifications();
  // Each weekday gets a different message, repeating weekly without a server.
  // Create replacements first: a failure preserves the previous schedule.
  const previous = await Notifications.getAllScheduledNotificationsAsync();
  const created: string[] = [];
  try {
    for (let weekday = 1; weekday <= 7; weekday++) {
      const message = messages[weekday - 1];
      created.push(await Notifications.scheduleNotificationAsync({
        content: { title: 'Seu momento · Passo Firme', body: message.text, sound: 'default', data: { messageId: message.id, daily: true } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour, minute, channelId: CHANNEL },
      }));
    }
  } catch (error) {
    await Promise.all(created.map(id => Notifications.cancelScheduledNotificationAsync(id)));
    throw error;
  }
  await Promise.all(previous.filter(item => item.content.data?.daily === true).map(item => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}
export async function cancelDaily() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter(item => item.content.data?.daily === true).map(item => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}
export async function testNotification() {
  await prepareNotifications();
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Passo Firme', body: messageForDay().text, sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: CHANNEL },
  });
}
