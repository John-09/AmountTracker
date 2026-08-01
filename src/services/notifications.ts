import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { SQLiteDatabase } from 'expo-sqlite';

import { hasExpenseOnDate } from '@/db/repositories/entries';
import {
  clearScheduledReminders,
  getScheduledReminder,
  listScheduledReminders,
  removeScheduledReminder,
  saveScheduledReminder,
} from '@/db/repositories/reminders';
import { getSettings } from '@/db/repositories/settings';
import { addDays, combineLocalDateAndTime, toLocalDateString } from '@/utils/dates';

const CHANNEL_ID = 'daily-expense-reminders';
const SCHEDULE_DAYS = 60;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily expense reminders',
    description: 'Reminds you to record an expense when the day has no expense entry.',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: '#14804A',
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureNotificationChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function cancelTrackedReminder(db: SQLiteDatabase, date: string): Promise<void> {
  const existing = await getScheduledReminder(db, date);
  if (!existing) return;
  await Notifications.cancelScheduledNotificationAsync(existing.notificationId).catch(() => undefined);
  await removeScheduledReminder(db, date);
}

async function scheduleDate(
  db: SQLiteDatabase,
  date: string,
  hour: number,
  minute: number,
  message: string,
): Promise<void> {
  const dueAt = combineLocalDateAndTime(date, hour, minute);
  if (dueAt.getTime() <= Date.now()) {
    await cancelTrackedReminder(db, date);
    return;
  }

  const existing = await getScheduledReminder(db, date);
  const scheduledAt = dueAt.toISOString();
  if (existing?.scheduledAt === scheduledAt) return;
  if (existing) await cancelTrackedReminder(db, date);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'AmountTracker',
      body: message,
      sound: 'default',
      data: { route: `/add-expense?date=${date}` },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dueAt,
      channelId: CHANNEL_ID,
    },
  });
  await saveScheduledReminder(db, { localDate: date, notificationId, scheduledAt });
}

export async function cancelAllTrackedReminders(db: SQLiteDatabase): Promise<void> {
  const reminders = await listScheduledReminders(db);
  await Promise.all(
    reminders.map((item) =>
      Notifications.cancelScheduledNotificationAsync(item.notificationId).catch(() => undefined),
    ),
  );
  await clearScheduledReminders(db);
}

export async function reconcileReminderForDate(
  db: SQLiteDatabase,
  date: string,
): Promise<void> {
  const today = toLocalDateString();
  if (date < today) return;

  const settings = await getSettings(db);
  if (!settings.reminderEnabled || (await hasExpenseOnDate(db, date))) {
    await cancelTrackedReminder(db, date);
    return;
  }

  await ensureNotificationChannel();
  await scheduleDate(
    db,
    date,
    settings.reminderHour,
    settings.reminderMinute,
    settings.reminderMessage,
  );
}

export async function syncReminderSchedule(db: SQLiteDatabase): Promise<void> {
  const settings = await getSettings(db);
  if (!settings.reminderEnabled) {
    await cancelAllTrackedReminders(db);
    return;
  }

  await ensureNotificationChannel();
  const scheduledBySystem = new Set(
    (await Notifications.getAllScheduledNotificationsAsync()).map((item) => item.identifier),
  );
  const tracked = await listScheduledReminders(db);
  for (const item of tracked) {
    if (!scheduledBySystem.has(item.notificationId)) {
      await removeScheduledReminder(db, item.localDate);
    }
  }

  const today = toLocalDateString();
  const lastDate = toLocalDateString(addDays(today, SCHEDULE_DAYS - 1));
  for (const item of await listScheduledReminders(db)) {
    if (item.localDate < today || item.localDate > lastDate) {
      await cancelTrackedReminder(db, item.localDate);
    }
  }

  for (let offset = 0; offset < SCHEDULE_DAYS; offset += 1) {
    const date = toLocalDateString(addDays(today, offset));
    if (await hasExpenseOnDate(db, date)) {
      await cancelTrackedReminder(db, date);
    } else {
      await scheduleDate(
        db,
        date,
        settings.reminderHour,
        settings.reminderMinute,
        settings.reminderMessage,
      );
    }
  }
}

export async function resetReminderSchedule(db: SQLiteDatabase): Promise<void> {
  await cancelAllTrackedReminders(db);
  await syncReminderSchedule(db);
}

export async function sendTestNotification(): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) throw new Error('Notification permission was not granted.');
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'AmountTracker',
      body: 'Your daily expense reminder is working.',
      sound: 'default',
      data: { route: '/add-expense' },
    },
    trigger: null,
  });
}
