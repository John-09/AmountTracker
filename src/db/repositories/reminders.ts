import type { SQLiteDatabase } from 'expo-sqlite';

import type { ScheduledReminder } from '@/types';

interface ScheduledReminderRow {
  local_date: string;
  notification_id: string;
  scheduled_at: string;
}

function mapReminder(row: ScheduledReminderRow): ScheduledReminder {
  return {
    localDate: row.local_date,
    notificationId: row.notification_id,
    scheduledAt: row.scheduled_at,
  };
}

export async function listScheduledReminders(db: SQLiteDatabase): Promise<ScheduledReminder[]> {
  const rows = await db.getAllAsync<ScheduledReminderRow>(
    'SELECT * FROM scheduled_reminders ORDER BY local_date ASC',
  );
  return rows.map(mapReminder);
}

export async function getScheduledReminder(
  db: SQLiteDatabase,
  date: string,
): Promise<ScheduledReminder | null> {
  const row = await db.getFirstAsync<ScheduledReminderRow>(
    'SELECT * FROM scheduled_reminders WHERE local_date = ?',
    date,
  );
  return row ? mapReminder(row) : null;
}

export async function saveScheduledReminder(
  db: SQLiteDatabase,
  reminder: ScheduledReminder,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO scheduled_reminders (local_date, notification_id, scheduled_at)
     VALUES (?, ?, ?)
     ON CONFLICT(local_date) DO UPDATE SET
       notification_id = excluded.notification_id,
       scheduled_at = excluded.scheduled_at`,
    reminder.localDate,
    reminder.notificationId,
    reminder.scheduledAt,
  );
}

export async function removeScheduledReminder(db: SQLiteDatabase, date: string): Promise<void> {
  await db.runAsync('DELETE FROM scheduled_reminders WHERE local_date = ?', date);
}

export async function clearScheduledReminders(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM scheduled_reminders');
}
