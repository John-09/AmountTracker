import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { CategoryDonut } from '@/components/charts/category-donut';
import { DailyBarChart } from '@/components/charts/daily-bar-chart';
import { EntryRow } from '@/components/entries/entry-row';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateRangeSelector } from '@/components/ui/date-range-selector';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { Screen } from '@/components/ui/screen';
import { useDataRevision } from '@/db/data-context';
import { getDashboardSummary } from '@/db/repositories/dashboard';
import { useAsyncData } from '@/hooks/use-async-data';
import { radius, spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/use-app-theme';
import type { DashboardSummary } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { getDateRange } from '@/utils/dates';

const EMPTY_SUMMARY: DashboardSummary = {
  balance: { totalCreditsPaise: 0, totalExpensesPaise: 0, balancePaise: 0 },
  todayExpensesPaise: 0,
  todayExpenseCount: 0,
  period: { creditsPaise: 0, expensesPaise: 0, netPaise: 0, expenseCount: 0, averageDailyPaise: 0 },
  categoryBreakdown: [],
  dailySpending: [],
  recentEntries: [],
};

function MetricCard({
  label,
  value,
  icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tone?: 'default' | 'credit' | 'expense';
}) {
  const { colors } = useAppTheme();
  const color = tone === 'credit' ? colors.credit : tone === 'expense' ? colors.expense : colors.primary;
  return (
    <Card style={styles.metricCard}>
      <Ionicons name={icon} size={20} color={color} />
      <AppText variant="caption" color="muted">
        {label}
      </AppText>
      <AppText variant="heading" style={{ color }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
    </Card>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { revision } = useDataRevision();
  const { colors } = useAppTheme();
  const [range, setRange] = useState(() => getDateRange('month'));
  const { data, loading, error, refresh } = useAsyncData(
    () => getDashboardSummary(db, range),
    EMPTY_SUMMARY,
    `${range.startDate}:${range.endDate}:${revision}`,
  );

  if (loading && data === EMPTY_SUMMARY) {
    return (
      <Screen>
        <LoadingState label="Calculating your balance…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState message={error.message} onRetry={() => void refresh()} />
      </Screen>
    );
  }

  const topCategory = data.categoryBreakdown[0];
  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  return (
    <Screen scroll contentStyle={styles.screen}>
      <View style={styles.header}>
        <View>
          <AppText variant="caption" color="muted">
            {todayLabel}
          </AppText>
          <AppText variant="title">Your money, clearly.</AppText>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="wallet-outline" size={25} color={colors.primary} />
        </View>
      </View>

      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <AppText variant="caption" color="inverse">
          Current balance
        </AppText>
        <AppText variant="display" color="inverse" numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(data.balance.balancePaise)}
        </AppText>
        <View style={styles.balanceMeta}>
          <View>
            <AppText variant="caption" color="inverse">
              Total credits
            </AppText>
            <AppText variant="label" color="inverse">
              {formatCurrency(data.balance.totalCreditsPaise)}
            </AppText>
          </View>
          <View>
            <AppText variant="caption" color="inverse">
              Total spent
            </AppText>
            <AppText variant="label" color="inverse">
              {formatCurrency(data.balance.totalExpensesPaise)}
            </AppText>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.todayRow}>
        <MetricCard label="Spent today" value={formatCurrency(data.todayExpensesPaise)} icon="today-outline" tone="expense" />
        <MetricCard
          label="Today's entries"
          value={`${data.todayExpenseCount}`}
          icon="list-outline"
        />
      </View>

      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <Button icon="remove-circle-outline" onPress={() => router.push('/add-expense')}>
            Add expense
          </Button>
        </View>
        <View style={styles.actionButton}>
          <Button icon="add-circle-outline" variant="secondary" onPress={() => router.push('/add-credit')}>
            Add credit
          </Button>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <AppText variant="heading">Spending report</AppText>
          <AppText variant="caption" color="muted">
            {range.label}
          </AppText>
        </View>
      </View>
      <DateRangeSelector value={range} onChange={setRange} />

      <View style={styles.metricsGrid}>
        <MetricCard label="Spent" value={formatCurrency(data.period.expensesPaise)} icon="trending-down-outline" tone="expense" />
        <MetricCard label="Credited" value={formatCurrency(data.period.creditsPaise)} icon="trending-up-outline" tone="credit" />
        <MetricCard
          label="Net change"
          value={formatCurrency(data.period.netPaise)}
          icon="swap-vertical-outline"
          tone={data.period.netPaise >= 0 ? 'credit' : 'expense'}
        />
        <MetricCard
          label="Expense count"
          value={`${data.period.expenseCount}`}
          icon="list-circle-outline"
        />
        <MetricCard label="Daily average" value={formatCurrency(data.period.averageDailyPaise)} icon="analytics-outline" />
      </View>

      <Card style={styles.insightCard}>
        <View style={styles.insightIcon}>
          <Ionicons name="sparkles-outline" color={colors.primary} size={22} />
        </View>
        <View style={styles.flex}>
          <AppText variant="label">Period insight</AppText>
          <AppText color="muted" variant="caption">
            {topCategory
              ? `${topCategory.name} is your highest category at ${formatCurrency(topCategory.totalPaise)} across ${data.period.expenseCount} expense${data.period.expenseCount === 1 ? '' : 's'}.`
              : 'Add an expense to see useful spending insights here.'}
          </AppText>
        </View>
      </Card>

      <Card style={styles.chartCard}>
        <AppText variant="heading">By category</AppText>
        <CategoryDonut data={data.categoryBreakdown} />
      </Card>

      <Card style={styles.chartCard}>
        <AppText variant="heading">Daily spending</AppText>
        <DailyBarChart data={data.dailySpending} range={range} />
      </Card>

      <View style={styles.sectionHeader}>
        <AppText variant="heading">Recent in this period</AppText>
        <Button compact variant="ghost" onPress={() => router.push('/transactions')}>
          View all
        </Button>
      </View>
      <Card>
        {data.recentEntries.length ? (
          data.recentEntries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onPress={() => router.push({ pathname: '/edit-entry', params: { id: entry.id } })}
            />
          ))
        ) : (
          <View style={styles.emptyRecent}>
            <AppText color="muted">No entries in {range.label.toLowerCase()}.</AppText>
          </View>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.lg },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  balanceCard: { padding: spacing.xl, borderRadius: radius.lg, gap: spacing.sm, overflow: 'hidden' },
  balanceMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  todayRow: { flexDirection: 'row', gap: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md },
  actionButton: { flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metricCard: { width: '48%', flexGrow: 1, minWidth: 145, gap: spacing.xs },
  insightCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  insightIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  chartCard: { gap: spacing.lg },
  emptyRecent: { paddingVertical: spacing.xl, alignItems: 'center' },
});
