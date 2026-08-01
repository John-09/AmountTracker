import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import { z } from 'zod';

import { listCategories } from '@/db/repositories/categories';
import { listEntries } from '@/db/repositories/entries';
import { getSettings, setLastBackupAt } from '@/db/repositories/settings';
import { cancelAllTrackedReminders, syncReminderSchedule } from '@/services/notifications';
import type { BackupPayload } from '@/types';
import { isValidLocalDate } from '@/utils/dates';

const timestampSchema = z.string().refine((value) => Number.isFinite(Date.parse(value)), {
  message: 'Backup contains an invalid timestamp.',
});

const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Backup contains an invalid category color.'),
  sortOrder: z.number().int().nonnegative(),
  isDefault: z.boolean(),
  isArchived: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
}).strict();

const entrySchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(['credit', 'expense']),
    amountPaise: z.number().int().positive(),
    categoryId: z.string().nullable(),
    categoryName: z.string().nullable(),
    categoryIcon: z.string().nullable(),
    categoryColor: z.string().nullable(),
    entryDate: z.string().refine(isValidLocalDate, 'Backup contains an invalid entry date.'),
    note: z.string().nullable(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict()
  .refine(
    (entry) =>
      (entry.type === 'expense' && entry.categoryId !== null) ||
      (entry.type === 'credit' && entry.categoryId === null),
    { message: 'Backup contains an invalid entry category.' },
  );

const settingsSchema = z.object({
  currency: z.literal('INR'),
  locale: z.literal('en-IN'),
  reminderEnabled: z.boolean(),
  reminderHour: z.number().int().min(0).max(23),
  reminderMinute: z.number().int().min(0).max(59),
  reminderMessage: z.string(),
  lastBackupAt: timestampSchema.nullable(),
}).strict();

const backupSchema = z
  .object({
    schemaVersion: z.literal(1),
    exportedAt: timestampSchema,
    categories: z.array(categorySchema),
    entries: z.array(entrySchema),
    settings: settingsSchema,
  })
  .strict()
  .superRefine((backup, context) => {
    const categoryIds = new Set(backup.categories.map((category) => category.id));
    if (categoryIds.size !== backup.categories.length) {
      context.addIssue({ code: 'custom', message: 'Backup contains duplicate category IDs.' });
    }
    const categoryNames = new Set(backup.categories.map((category) => category.name.trim().toLowerCase()));
    if (categoryNames.size !== backup.categories.length) {
      context.addIssue({ code: 'custom', message: 'Backup contains duplicate category names.' });
    }
    const uniqueEntryIds = new Set(backup.entries.map((entry) => entry.id));
    if (uniqueEntryIds.size !== backup.entries.length) {
      context.addIssue({ code: 'custom', message: 'Backup contains duplicate entry IDs.' });
    }
    for (const entry of backup.entries) {
      if (entry.categoryId && !categoryIds.has(entry.categoryId)) {
        context.addIssue({ code: 'custom', message: 'An expense references a missing category.' });
      }
    }
  });

async function buildBackupPayload(db: SQLiteDatabase): Promise<BackupPayload> {
  const exportedAt = new Date().toISOString();
  const [categories, entries, settings] = await Promise.all([
    listCategories(db, true),
    listEntries(db),
    getSettings(db),
  ]);

  return {
    schemaVersion: 1,
    exportedAt,
    categories,
    entries,
    settings: { ...settings, lastBackupAt: exportedAt },
  };
}

function writeBackupFile(payload: BackupPayload, filename: string): File {
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true, intermediates: true });
  file.write(JSON.stringify(payload, null, 2));
  return file;
}

export async function exportFullBackup(db: SQLiteDatabase): Promise<void> {
  const payload = await buildBackupPayload(db);
  const date = payload.exportedAt.slice(0, 10);
  const file = writeBackupFile(payload, `amounttracker-backup-${date}.json`);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('File sharing is unavailable on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Back up AmountTracker',
    UTI: 'public.json',
  });
  await setLastBackupAt(db, payload.exportedAt);
}

async function createSafetyBackup(db: SQLiteDatabase): Promise<void> {
  const payload = await buildBackupPayload(db);
  writeBackupFile(payload, 'amounttracker-before-restore.json');
}

async function replaceFromBackup(db: SQLiteDatabase, payload: BackupPayload): Promise<void> {
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync('DELETE FROM scheduled_reminders');
    await transaction.runAsync('DELETE FROM ledger_entries');
    await transaction.runAsync('DELETE FROM categories');

    for (const category of payload.categories) {
      await transaction.runAsync(
        `INSERT INTO categories
          (id, name, icon, color, sort_order, is_default, is_archived, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        category.id,
        category.name,
        category.icon,
        category.color,
        category.sortOrder,
        category.isDefault ? 1 : 0,
        category.isArchived ? 1 : 0,
        category.createdAt,
        category.updatedAt,
      );
    }

    for (const entry of payload.entries) {
      await transaction.runAsync(
        `INSERT INTO ledger_entries
          (id, type, amount_paise, category_id, entry_date, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        entry.id,
        entry.type,
        entry.amountPaise,
        entry.categoryId,
        entry.entryDate,
        entry.note,
        entry.createdAt,
        entry.updatedAt,
      );
    }

    await transaction.runAsync(
      `UPDATE app_settings SET
        currency = ?, locale = ?, reminder_enabled = ?, reminder_hour = ?,
        reminder_minute = ?, reminder_message = ?, last_backup_at = ?
       WHERE id = 1`,
      payload.settings.currency,
      payload.settings.locale,
      payload.settings.reminderEnabled ? 1 : 0,
      payload.settings.reminderHour,
      payload.settings.reminderMinute,
      payload.settings.reminderMessage || 'Add expense for today.',
      payload.settings.lastBackupAt,
    );
  });
}

export async function pickAndRestoreBackup(db: SQLiteDatabase): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return false;

  const text = await new File(result.assets[0].uri).text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON.');
  }

  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'This is not a valid AmountTracker backup.');
  }

  await createSafetyBackup(db);
  await cancelAllTrackedReminders(db);
  try {
    await replaceFromBackup(db, parsed.data as BackupPayload);
  } finally {
    await syncReminderSchedule(db).catch(() => undefined);
  }
  return true;
}
