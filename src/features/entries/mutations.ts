import type { SQLiteDatabase } from 'expo-sqlite';

import {
  createEntry,
  deleteEntry,
  getEntryById,
  updateEntry,
} from '@/db/repositories/entries';
import { reconcileReminderForDate } from '@/services/notifications';
import type { EntryDraft, LedgerEntry } from '@/types';

async function safelyReconcile(db: SQLiteDatabase, dates: string[]): Promise<void> {
  for (const date of new Set(dates)) {
    try {
      await reconcileReminderForDate(db, date);
    } catch (error) {
      console.warn('Unable to update the reminder schedule.', error);
    }
  }
}

export async function createLedgerEntry(
  db: SQLiteDatabase,
  draft: EntryDraft,
): Promise<LedgerEntry> {
  const entry = await createEntry(db, draft);
  if (entry.type === 'expense') await safelyReconcile(db, [entry.entryDate]);
  return entry;
}

export async function updateLedgerEntry(
  db: SQLiteDatabase,
  id: string,
  draft: EntryDraft,
): Promise<LedgerEntry> {
  const previous = await getEntryById(db, id);
  if (!previous) throw new Error('This entry no longer exists.');
  const entry = await updateEntry(db, id, draft);
  const dates = [previous.entryDate, entry.entryDate];
  if (previous.type === 'expense' || entry.type === 'expense') await safelyReconcile(db, dates);
  return entry;
}

export async function deleteLedgerEntry(
  db: SQLiteDatabase,
  id: string,
): Promise<LedgerEntry | null> {
  const deleted = await deleteEntry(db, id);
  if (deleted?.type === 'expense') await safelyReconcile(db, [deleted.entryDate]);
  return deleted;
}
