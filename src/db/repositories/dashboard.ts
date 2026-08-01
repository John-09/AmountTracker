import type { SQLiteDatabase } from 'expo-sqlite';

import type { CategoryBreakdown, DailySpending, DashboardSummary, DateRange } from '@/types';
import { inclusiveDayCount, toLocalDateString } from '@/utils/dates';

import { getBalanceSummary, getExpenseSummaryForDate, listEntries } from './entries';

interface PeriodRow {
  credits: number;
  expenses: number;
  expense_count: number;
}

interface CategoryBreakdownRow {
  category_id: string;
  name: string;
  color: string;
  icon: string;
  total: number;
}

interface DailySpendingRow {
  date: string;
  total: number;
}

export async function getDashboardSummary(
  db: SQLiteDatabase,
  range: DateRange,
): Promise<DashboardSummary> {
  const balance = await getBalanceSummary(db);
  const today = await getExpenseSummaryForDate(db, toLocalDateString());
  const periodRow = await db.getFirstAsync<PeriodRow>(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'credit' THEN amount_paise ELSE 0 END), 0) AS credits,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_paise ELSE 0 END), 0) AS expenses,
      SUM(CASE WHEN type = 'expense' THEN 1 ELSE 0 END) AS expense_count
     FROM ledger_entries WHERE entry_date BETWEEN ? AND ?`,
    range.startDate,
    range.endDate,
  );

  const categoryRows = await db.getAllAsync<CategoryBreakdownRow>(
    `SELECT
      category.id AS category_id,
      category.name,
      category.color,
      category.icon,
      SUM(entry.amount_paise) AS total
     FROM ledger_entries entry
     JOIN categories category ON category.id = entry.category_id
     WHERE entry.type = 'expense' AND entry.entry_date BETWEEN ? AND ?
     GROUP BY category.id, category.name, category.color, category.icon
     ORDER BY total DESC`,
    range.startDate,
    range.endDate,
  );

  const dailyRows = await db.getAllAsync<DailySpendingRow>(
    `SELECT entry_date AS date, SUM(amount_paise) AS total
     FROM ledger_entries
     WHERE type = 'expense' AND entry_date BETWEEN ? AND ?
     GROUP BY entry_date
     ORDER BY entry_date ASC`,
    range.startDate,
    range.endDate,
  );

  const creditsPaise = periodRow?.credits ?? 0;
  const expensesPaise = periodRow?.expenses ?? 0;
  const expenseCount = periodRow?.expense_count ?? 0;
  const days = inclusiveDayCount(range.startDate, range.endDate);

  const categoryBreakdown: CategoryBreakdown[] = categoryRows.map((row) => ({
    categoryId: row.category_id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    totalPaise: row.total,
  }));
  const dailySpending: DailySpending[] = dailyRows.map((row) => ({
    date: row.date,
    totalPaise: row.total,
  }));

  return {
    balance,
    todayExpensesPaise: today.totalPaise,
    todayExpenseCount: today.count,
    period: {
      creditsPaise,
      expensesPaise,
      netPaise: creditsPaise - expensesPaise,
      expenseCount,
      averageDailyPaise: Math.round(expensesPaise / days),
    },
    categoryBreakdown,
    dailySpending,
    recentEntries: await listEntries(db, { dateRange: range, limit: 5 }),
  };
}
