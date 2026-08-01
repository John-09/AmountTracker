import type { SQLiteDatabase } from 'expo-sqlite';

import type { AppSettings, ReminderSettings } from '@/types';

import { type AppSettingsRow, mapSettings } from './mappers';

export async function getSettings(db: SQLiteDatabase): Promise<AppSettings> {
  const row = await db.getFirstAsync<AppSettingsRow>('SELECT * FROM app_settings WHERE id = 1');
  if (!row) throw new Error('App settings are unavailable.');
  return mapSettings(row);
}

export async function updateReminderSettings(
  db: SQLiteDatabase,
  settings: ReminderSettings,
): Promise<void> {
  if (settings.reminderHour < 0 || settings.reminderHour > 23) {
    throw new Error('Choose a valid reminder hour.');
  }
  if (settings.reminderMinute < 0 || settings.reminderMinute > 59) {
    throw new Error('Choose a valid reminder minute.');
  }
  const message = settings.reminderMessage.trim() || 'Add expense for today.';
  await db.runAsync(
    `UPDATE app_settings
     SET reminder_enabled = ?, reminder_hour = ?, reminder_minute = ?, reminder_message = ?
     WHERE id = 1`,
    settings.reminderEnabled ? 1 : 0,
    settings.reminderHour,
    settings.reminderMinute,
    message,
  );
}

export async function setLastBackupAt(db: SQLiteDatabase, timestamp: string): Promise<void> {
  await db.runAsync('UPDATE app_settings SET last_backup_at = ? WHERE id = 1', timestamp);
}
