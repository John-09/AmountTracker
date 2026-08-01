import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { CategoryRow, ExpenseCategory } from '@/types';

import { mapCategory } from './mappers';

export async function listCategories(
  db: SQLiteDatabase,
  includeArchived = false,
): Promise<ExpenseCategory[]> {
  const rows = await db.getAllAsync<CategoryRow>(
    `SELECT * FROM categories
     ${includeArchived ? '' : 'WHERE is_archived = 0'}
     ORDER BY is_archived ASC, sort_order ASC, name ASC`,
  );
  return rows.map(mapCategory);
}

export async function createCategory(
  db: SQLiteDatabase,
  input: Pick<ExpenseCategory, 'name' | 'icon' | 'color'>,
): Promise<ExpenseCategory> {
  const name = input.name.trim();
  if (!name) throw new Error('Category name is required.');

  const timestamp = new Date().toISOString();
  const id = randomUUID();
  const orderRow = await db.getFirstAsync<{ next_order: number }>(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM categories',
  );

  await db.runAsync(
    `INSERT INTO categories
      (id, name, icon, color, sort_order, is_default, is_archived, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)`,
    id,
    name,
    input.icon,
    input.color,
    orderRow?.next_order ?? 0,
    timestamp,
    timestamp,
  );

  const row = await db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', id);
  if (!row) throw new Error('Unable to create category.');
  return mapCategory(row);
}

export async function updateCategory(
  db: SQLiteDatabase,
  id: string,
  input: Pick<ExpenseCategory, 'name' | 'icon' | 'color'>,
): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error('Category name is required.');

  await db.runAsync(
    'UPDATE categories SET name = ?, icon = ?, color = ?, updated_at = ? WHERE id = ?',
    name,
    input.icon,
    input.color,
    new Date().toISOString(),
    id,
  );
}

export async function setCategoryArchived(
  db: SQLiteDatabase,
  id: string,
  archived: boolean,
): Promise<void> {
  await db.runAsync(
    'UPDATE categories SET is_archived = ?, updated_at = ? WHERE id = ?',
    archived ? 1 : 0,
    new Date().toISOString(),
    id,
  );
}

export async function deleteCategory(db: SQLiteDatabase, id: string): Promise<void> {
  const usage = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM ledger_entries WHERE category_id = ?',
    id,
  );
  if ((usage?.count ?? 0) > 0) {
    throw new Error('This category is used by expenses. Archive it instead.');
  }
  await db.runAsync('DELETE FROM categories WHERE id = ?', id);
}

export async function reorderCategories(db: SQLiteDatabase, orderedIds: string[]): Promise<void> {
  await db.withExclusiveTransactionAsync(async (transaction) => {
    for (const [index, id] of orderedIds.entries()) {
      await transaction.runAsync(
        'UPDATE categories SET sort_order = ?, updated_at = ? WHERE id = ?',
        index,
        new Date().toISOString(),
        id,
      );
    }
  });
}
