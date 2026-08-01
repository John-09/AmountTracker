import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

import { listEntries } from '@/db/repositories/entries';
import type { EntryFilters, LedgerEntry } from '@/types';

function escapeCsv(value: string | number | null): string {
  if (value === null) return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function entriesToCsv(entries: LedgerEntry[]): string {
  const header = ['Date', 'Type', 'Category', 'Note', 'Amount (INR)'];
  const rows = entries.map((entry) => [
    entry.entryDate,
    entry.type,
    entry.categoryName,
    entry.note,
    (entry.amountPaise / 100).toFixed(2),
  ]);
  return [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
}

export async function exportLedgerCsv(db: SQLiteDatabase, filters: EntryFilters = {}): Promise<void> {
  const entries = await listEntries(db, { ...filters, limit: undefined, offset: undefined });
  const date = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `amounttracker-${date}.csv`);
  file.create({ overwrite: true, intermediates: true });
  file.write(entriesToCsv(entries));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('File sharing is unavailable on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export AmountTracker CSV',
    UTI: 'public.comma-separated-values-text',
  });
}
