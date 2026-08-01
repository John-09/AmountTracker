import type { SQLiteDatabase } from 'expo-sqlite';

const DEFAULT_CATEGORIES = [
  ['cat-food', 'Food', 'restaurant-outline', '#EF8354'],
  ['cat-groceries', 'Groceries', 'basket-outline', '#4FAD7A'],
  ['cat-transport', 'Transport', 'bus-outline', '#4F86C6'],
  ['cat-shopping', 'Shopping', 'bag-handle-outline', '#E15A87'],
  ['cat-rent', 'Rent', 'home-outline', '#9C6ADE'],
  ['cat-bills', 'Bills', 'receipt-outline', '#D9A441'],
  ['cat-health', 'Health', 'medkit-outline', '#D75252'],
  ['cat-entertainment', 'Entertainment', 'game-controller-outline', '#7A82AB'],
  ['cat-education', 'Education', 'school-outline', '#42A5A5'],
  ['cat-travel', 'Travel', 'airplane-outline', '#3A8DDE'],
  ['cat-personal-care', 'Personal Care', 'sparkles-outline', '#C56CCF'],
  ['cat-miscellaneous', 'Miscellaneous', 'ellipsis-horizontal-circle-outline', '#748078'],
] as const;

export async function seedDefaults(db: SQLiteDatabase): Promise<void> {
  const timestamp = new Date().toISOString();

  for (const [index, [id, name, icon, color]] of DEFAULT_CATEGORIES.entries()) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories
        (id, name, icon, color, sort_order, is_default, is_archived, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?)`,
      id,
      name,
      icon,
      color,
      index,
      timestamp,
      timestamp,
    );
  }

  await db.runAsync(
    `INSERT OR IGNORE INTO app_settings
      (id, currency, locale, reminder_enabled, reminder_hour, reminder_minute, reminder_message)
     VALUES (1, 'INR', 'en-IN', 0, 21, 0, 'Add expense for today.')`,
  );
}
