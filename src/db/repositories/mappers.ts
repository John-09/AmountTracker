import type { AppSettings, CategoryRow, ExpenseCategory, LedgerEntry, LedgerEntryRow } from '@/types';

export function mapEntry(row: LedgerEntryRow): LedgerEntry {
  return {
    id: row.id,
    type: row.type,
    amountPaise: row.amount_paise,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categoryIcon: row.category_icon,
    categoryColor: row.category_color,
    entryDate: row.entry_date,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCategory(row: CategoryRow): ExpenseCategory {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sort_order,
    isDefault: row.is_default === 1,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface AppSettingsRow {
  currency: 'INR';
  locale: 'en-IN';
  reminder_enabled: number;
  reminder_hour: number;
  reminder_minute: number;
  reminder_message: string;
  last_backup_at: string | null;
}

export function mapSettings(row: AppSettingsRow): AppSettings {
  return {
    currency: row.currency,
    locale: row.locale,
    reminderEnabled: row.reminder_enabled === 1,
    reminderHour: row.reminder_hour,
    reminderMinute: row.reminder_minute,
    reminderMessage: row.reminder_message,
    lastBackupAt: row.last_backup_at,
  };
}
