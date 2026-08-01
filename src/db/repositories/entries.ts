import { randomUUID } from 'expo-crypto';
import type { SQLiteBindValue, SQLiteDatabase } from 'expo-sqlite';

import type {
  BalanceSummary,
  EntryDraft,
  EntryFilters,
  LedgerEntry,
  LedgerEntryRow,
} from '@/types';
import { isValidLocalDate } from '@/utils/dates';

import { mapEntry } from './mappers';

const ENTRY_SELECT = `
  SELECT
    entry.id,
    entry.type,
    entry.amount_paise,
    entry.category_id,
    category.name AS category_name,
    category.icon AS category_icon,
    category.color AS category_color,
    entry.entry_date,
    entry.note,
    entry.created_at,
    entry.updated_at
  FROM ledger_entries entry
  LEFT JOIN categories category ON category.id = entry.category_id
`;

function validateDraft(draft: EntryDraft): void {
  if (!Number.isSafeInteger(draft.amountPaise) || draft.amountPaise <= 0) {
    throw new Error('Enter an amount greater than zero.');
  }
  if (!isValidLocalDate(draft.entryDate)) {
    throw new Error('Choose a valid date.');
  }
  if (draft.type === 'expense' && !draft.categoryId) {
    throw new Error('Choose an expense category.');
  }
  if (draft.type === 'credit' && draft.categoryId) {
    throw new Error('Credits do not use an expense category.');
  }
}

export async function createEntry(db: SQLiteDatabase, draft: EntryDraft): Promise<LedgerEntry> {
  validateDraft(draft);
  const id = randomUUID();
  const timestamp = new Date().toISOString();
  const note = draft.note?.trim() || null;

  await db.runAsync(
    `INSERT INTO ledger_entries
      (id, type, amount_paise, category_id, entry_date, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    draft.type,
    draft.amountPaise,
    draft.categoryId,
    draft.entryDate,
    note,
    timestamp,
    timestamp,
  );

  const entry = await getEntryById(db, id);
  if (!entry) throw new Error('Unable to create entry.');
  return entry;
}

export async function updateEntry(
  db: SQLiteDatabase,
  id: string,
  draft: EntryDraft,
): Promise<LedgerEntry> {
  validateDraft(draft);
  const result = await db.runAsync(
    `UPDATE ledger_entries
     SET type = ?, amount_paise = ?, category_id = ?, entry_date = ?, note = ?, updated_at = ?
     WHERE id = ?`,
    draft.type,
    draft.amountPaise,
    draft.categoryId,
    draft.entryDate,
    draft.note?.trim() || null,
    new Date().toISOString(),
    id,
  );

  if (result.changes === 0) throw new Error('This entry no longer exists.');
  const entry = await getEntryById(db, id);
  if (!entry) throw new Error('Unable to update entry.');
  return entry;
}

export async function deleteEntry(db: SQLiteDatabase, id: string): Promise<LedgerEntry | null> {
  const entry = await getEntryById(db, id);
  if (!entry) return null;
  await db.runAsync('DELETE FROM ledger_entries WHERE id = ?', id);
  return entry;
}

export async function getEntryById(db: SQLiteDatabase, id: string): Promise<LedgerEntry | null> {
  const row = await db.getFirstAsync<LedgerEntryRow>(`${ENTRY_SELECT} WHERE entry.id = ?`, id);
  return row ? mapEntry(row) : null;
}

export async function listEntries(db: SQLiteDatabase, filters: EntryFilters = {}): Promise<LedgerEntry[]> {
  const conditions: string[] = [];
  const params: SQLiteBindValue[] = [];

  if (filters.dateRange) {
    conditions.push('entry.entry_date BETWEEN ? AND ?');
    params.push(filters.dateRange.startDate, filters.dateRange.endDate);
  }
  if (filters.type && filters.type !== 'all') {
    conditions.push('entry.type = ?');
    params.push(filters.type);
  }
  if (filters.categoryId) {
    conditions.push('entry.category_id = ?');
    params.push(filters.categoryId);
  }
  if (filters.search?.trim()) {
    conditions.push("LOWER(COALESCE(entry.note, '')) LIKE ?");
    params.push(`%${filters.search.trim().toLowerCase()}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit ? 'LIMIT ? OFFSET ?' : '';
  if (filters.limit) params.push(filters.limit, filters.offset ?? 0);

  const rows = await db.getAllAsync<LedgerEntryRow>(
    `${ENTRY_SELECT}
     ${where}
     ORDER BY entry.entry_date DESC, entry.created_at DESC
     ${limit}`,
    params,
  );
  return rows.map(mapEntry);
}

export async function getBalanceSummary(db: SQLiteDatabase): Promise<BalanceSummary> {
  const row = await db.getFirstAsync<{ credits: number; expenses: number }>(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'credit' THEN amount_paise ELSE 0 END), 0) AS credits,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_paise ELSE 0 END), 0) AS expenses
    FROM ledger_entries
  `);

  const totalCreditsPaise = row?.credits ?? 0;
  const totalExpensesPaise = row?.expenses ?? 0;
  return {
    totalCreditsPaise,
    totalExpensesPaise,
    balancePaise: totalCreditsPaise - totalExpensesPaise,
  };
}

export async function getExpenseSummaryForDate(
  db: SQLiteDatabase,
  date: string,
): Promise<{ totalPaise: number; count: number }> {
  const row = await db.getFirstAsync<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(amount_paise), 0) AS total, COUNT(*) AS count
     FROM ledger_entries WHERE type = 'expense' AND entry_date = ?`,
    date,
  );
  return { totalPaise: row?.total ?? 0, count: row?.count ?? 0 };
}

export async function hasExpenseOnDate(db: SQLiteDatabase, date: string): Promise<boolean> {
  const row = await db.getFirstAsync<{ exists_flag: number }>(
    `SELECT EXISTS(
      SELECT 1 FROM ledger_entries WHERE type = 'expense' AND entry_date = ?
    ) AS exists_flag`,
    date,
  );
  return row?.exists_flag === 1;
}
