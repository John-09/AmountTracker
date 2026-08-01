import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/use-app-theme';
import type { LedgerEntry } from '@/types';
import { formatCurrency } from '@/utils/currency';

import { AppText } from '../ui/app-text';

interface EntryRowProps {
  entry: LedgerEntry;
  onPress?: () => void;
}

export function EntryRow({ entry, onPress }: EntryRowProps) {
  const { colors } = useAppTheme();
  const isExpense = entry.type === 'expense';
  const color = isExpense ? entry.categoryColor ?? colors.expense : colors.credit;
  const icon = isExpense ? entry.categoryIcon ?? 'wallet-outline' : 'arrow-down-outline';

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : null]}
    >
      <View style={[styles.icon, { backgroundColor: `${color}20` }]}>
        <Ionicons
          name={icon as React.ComponentProps<typeof Ionicons>['name']}
          color={color}
          size={21}
        />
      </View>
      <View style={styles.details}>
        <AppText weight="700">{isExpense ? entry.categoryName : 'Credit'}</AppText>
        <AppText variant="caption" color="muted" numberOfLines={1}>
          {entry.note || (isExpense ? 'Expense' : 'Money added')}
        </AppText>
      </View>
      <AppText variant="label" color={isExpense ? 'expense' : 'credit'}>
        {isExpense ? '−' : '+'}
        {formatCurrency(entry.amountPaise)}
      </AppText>
      {onPress ? <Ionicons name="chevron-forward" size={17} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  pressed: { opacity: 0.65 },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { flex: 1 },
});
