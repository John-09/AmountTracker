import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { radius, spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/use-app-theme';
import type { ExpenseCategory } from '@/types';

import { AppText } from '../ui/app-text';

interface CategoryPickerProps {
  categories: ExpenseCategory[];
  value: string | null;
  onChange: (categoryId: string) => void;
  error?: string;
}

export function CategoryPicker({ categories, value, onChange, error }: CategoryPickerProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.wrapper}>
      <AppText variant="label">Category</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {categories.map((category) => {
          const selected = category.id === value;
          return (
            <Pressable
              key={category.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(category.id)}
              style={[
                styles.category,
                {
                  backgroundColor: selected ? category.color : colors.surface,
                  borderColor: selected ? category.color : colors.border,
                },
              ]}
            >
              <Ionicons
                name={category.icon as React.ComponentProps<typeof Ionicons>['name']}
                size={21}
                color={selected ? colors.white : category.color}
              />
              <AppText
                variant="caption"
                weight="700"
                style={{ color: selected ? colors.white : colors.text }}
              >
                {category.name}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
      {error ? (
        <AppText variant="caption" color="expense">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  row: { gap: spacing.sm, paddingRight: spacing.lg },
  category: {
    minWidth: 86,
    minHeight: 70,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
