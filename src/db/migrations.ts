import type { SQLiteDatabase } from 'expo-sqlite';

import { seedDefaults } from './seed';
import { DATABASE_VERSION, INITIAL_SCHEMA_SQL } from './schema';

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = row?.user_version ?? 0;

  if (currentVersion === 0) {
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync(INITIAL_SCHEMA_SQL);
      await transaction.runAsync(
        'INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)',
        1,
        new Date().toISOString(),
      );
    });
    currentVersion = 1;
  }

  if (currentVersion > DATABASE_VERSION) {
    throw new Error('This database was created by a newer version of AmountTracker.');
  }

  await seedDefaults(db);
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
}
