export type EntryType = 'credit' | 'expense';

export type DatePreset = 'today' | 'week' | 'month' | 'previousMonth' | 'custom';

export interface LedgerEntry {
  id: string;
  type: EntryType;
  amountPaise: number;
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  entryDate: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntryRow {
  id: string;
  type: EntryType;
  amount_paise: number;
  category_id: string | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  entry_date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntryDraft {
  type: EntryType;
  amountPaise: number;
  categoryId: string | null;
  entryDate: string;
  note?: string | null;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  is_default: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
  preset: DatePreset;
}

export interface EntryFilters {
  dateRange?: Pick<DateRange, 'startDate' | 'endDate'>;
  type?: EntryType | 'all';
  categoryId?: string | null;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface BalanceSummary {
  totalCreditsPaise: number;
  totalExpensesPaise: number;
  balancePaise: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  totalPaise: number;
}

export interface DailySpending {
  date: string;
  totalPaise: number;
}

export interface PeriodSummary {
  creditsPaise: number;
  expensesPaise: number;
  netPaise: number;
  expenseCount: number;
  averageDailyPaise: number;
}

export interface DashboardSummary {
  balance: BalanceSummary;
  todayExpensesPaise: number;
  todayExpenseCount: number;
  period: PeriodSummary;
  categoryBreakdown: CategoryBreakdown[];
  dailySpending: DailySpending[];
  recentEntries: LedgerEntry[];
}

export interface AppSettings {
  currency: 'INR';
  locale: 'en-IN';
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  reminderMessage: string;
  lastBackupAt: string | null;
}

export type ReminderSettings = Pick<
  AppSettings,
  'reminderEnabled' | 'reminderHour' | 'reminderMinute' | 'reminderMessage'
>;

export interface ScheduledReminder {
  localDate: string;
  notificationId: string;
  scheduledAt: string;
}

export interface BackupPayload {
  schemaVersion: 1;
  exportedAt: string;
  categories: ExpenseCategory[];
  entries: LedgerEntry[];
  settings: AppSettings;
}
