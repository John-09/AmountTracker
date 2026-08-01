import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/use-app-theme';
import type { CategoryBreakdown } from '@/types';
import { formatCompactCurrency, formatCurrency } from '@/utils/currency';

import { AppText } from '../ui/app-text';
import { EmptyState } from '../ui/states';

const SIZE = 172;
const RADIUS = 58;
const STROKE = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CategoryDonut({ data }: { data: CategoryBreakdown[] }) {
  const { colors } = useAppTheme();
  const total = data.reduce((sum, item) => sum + item.totalPaise, 0);
  if (total === 0) {
    return <EmptyState title="No category data" message="Add an expense in this period to see the breakdown." icon="pie-chart-outline" />;
  }

  const segments = data.map((item, index) => {
    const offset = data
      .slice(0, index)
      .reduce((sum, previous) => sum + (previous.totalPaise / total) * CIRCUMFERENCE, 0);
    return {
      item,
      length: (item.totalPaise / total) * CIRCUMFERENCE,
      dashOffset: -offset,
    };
  });
  return (
    <View style={styles.wrapper}>
      <View style={styles.chartWrap} accessibilityLabel={`Category spending total ${formatCurrency(total)}`}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.surfaceMuted}
            strokeWidth={STROKE}
            fill="none"
          />
          {segments.map(({ item, length, dashOffset }) => {
            return (
              <Circle
                key={item.categoryId}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke={item.color}
                strokeWidth={STROKE}
                fill="none"
                strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                rotation="-90"
                origin={`${SIZE / 2}, ${SIZE / 2}`}
              />
            );
          })}
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <AppText variant="caption" color="muted">
            Spent
          </AppText>
          <AppText variant="heading">{formatCompactCurrency(total)}</AppText>
        </View>
      </View>
      <View style={styles.legend}>
        {data.slice(0, 6).map((item) => (
          <View key={item.categoryId} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <AppText variant="caption" style={styles.legendName} numberOfLines={1}>
              {item.name}
            </AppText>
            <AppText variant="caption" weight="700">
              {Math.round((item.totalPaise / total) * 100)}%
            </AppText>
          </View>
        ))}
        {data.length > 6 ? (
          <AppText variant="caption" color="muted">
            +{data.length - 6} more categories
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  chartWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  legend: { flex: 1, gap: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendName: { flex: 1 },
  dot: { width: 9, height: 9, borderRadius: 5 },
});
