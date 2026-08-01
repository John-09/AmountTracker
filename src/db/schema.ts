export const DATABASE_NAME = 'amount-tracker.db';
export const DATABASE_VERSION = 1;

export const INITIAL_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY NOT NULL,
    applied_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL COLLATE NOCASE UNIQUE,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
    is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ledger_entries (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'expense')),
    amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
    category_id TEXT,
    entry_date TEXT NOT NULL CHECK (length(entry_date) = 10),
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CHECK (
      (type = 'expense' AND category_id IS NOT NULL) OR
      (type = 'credit' AND category_id IS NULL)
    )
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
    currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
    locale TEXT NOT NULL DEFAULT 'en-IN' CHECK (locale = 'en-IN'),
    reminder_enabled INTEGER NOT NULL DEFAULT 0 CHECK (reminder_enabled IN (0, 1)),
    reminder_hour INTEGER NOT NULL DEFAULT 21 CHECK (reminder_hour BETWEEN 0 AND 23),
    reminder_minute INTEGER NOT NULL DEFAULT 0 CHECK (reminder_minute BETWEEN 0 AND 59),
    reminder_message TEXT NOT NULL DEFAULT 'Add expense for today.',
    last_backup_at TEXT
  );

  CREATE TABLE IF NOT EXISTS scheduled_reminders (
    local_date TEXT PRIMARY KEY NOT NULL,
    notification_id TEXT NOT NULL,
    scheduled_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_ledger_entry_date
    ON ledger_entries(entry_date DESC, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_ledger_type_date
    ON ledger_entries(type, entry_date DESC);
  CREATE INDEX IF NOT EXISTS idx_ledger_category_date
    ON ledger_entries(category_id, entry_date DESC);
  CREATE INDEX IF NOT EXISTS idx_categories_active_sort
    ON categories(is_archived, sort_order, name);
`;
