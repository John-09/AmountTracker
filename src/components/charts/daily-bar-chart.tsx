import { ScrollView, StyleSheet, View } from 'react-native';

import { radius, spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/use-app-theme';
import type { DailySpending, DateRange } from '@/types';
import { enumerateDates, formatShortDate } from '@/utils/dates';

import { AppText } from '../ui/app-text';
import { EmptyState } from '../ui/states';

export function DailyBarChart({ data, range }: { data: DailySpending[]; range: DateRange }) {
  const { colors } = useAppTheme();
  const byDate = new Map(data.map((item) => [item.date, item.totalPaise]));
  const allDates = enumerateDates(range.startDate, range.endDate);
  const dates = allDates.slice(Math.max(0, allDates.length - 31));
  const maximum = Math.max(...dates.map((date) => byDate.get(date) ?? 0), 0);

  if (maximum === 0) {
    return <EmptyState title="No daily spending" message="Daily totals will appear after you record an expense." icon="bar-chart-outline" />;
  }

  return (
    <View style={styles.wrapper}>
      {allDates.length > 31 ? (
        <AppText variant="caption" color="muted">
          Showing the latest 31 days of this range
        </AppText>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chart}>
        {dates.map((date, index) => {
          const value = byDate.get(date) ?? 0;
          const height = Math.max(value === 0 ? 3 : 12, Math.round((value / maximum) * 108));
          const showLabel = dates.length <= 10 || index % 5 === 0 || index === dates.length - 1;
          return (
            <View key={date} style={styles.barColumn}>
              <View
                accessibilityLabel={`${formatShortDate(date)} spending ${value / 100} rupees`}
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: value === 0 ? colors.surfaceMuted : colors.primary,
                  },
                ]}
              />
              <AppText variant="caption" color="muted" style={styles.label}>
                {showLabel ? formatShortDate(date) : ' '}
              </AppText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  chart: { minHeight: 150, alignItems: 'flex-end', gap: 7, paddingTop: spacing.md },
  barColumn: { width: 26, alignItems: 'center', justifyContent: 'flex-end', gap: spacing.sm },
  bar: { width: 20, borderRadius: radius.sm },
  label: { width: 48, textAlign: 'center', transform: [{ rotate: '-35deg' }] },
});
