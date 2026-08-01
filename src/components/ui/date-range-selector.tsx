import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';
import type { DatePreset, DateRange } from '@/types';
import { createCustomRange, getDateRange } from '@/utils/dates';

import { AppText } from './app-text';
import { Button } from './button';
import { Card } from './card';
import { DateField } from './date-field';

const PRESETS: { key: Exclude<DatePreset, 'custom'>; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'previousMonth', label: 'Last month' },
];

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [showCustom, setShowCustom] = useState(value.preset === 'custom');
  const [startDate, setStartDate] = useState(value.startDate);
  const [endDate, setEndDate] = useState(value.endDate);
  const [error, setError] = useState<string | null>(null);

  const applyCustom = () => {
    try {
      onChange(createCustomRange(startDate, endDate));
      setError(null);
      setShowCustom(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Choose a valid range.');
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
        {PRESETS.map((preset) => (
          <Button
            key={preset.key}
            compact
            variant={value.preset === preset.key ? 'primary' : 'ghost'}
            onPress={() => {
              setShowCustom(false);
              onChange(getDateRange(preset.key));
            }}
          >
            {preset.label}
          </Button>
        ))}
        <Button
          compact
          variant={value.preset === 'custom' ? 'primary' : 'ghost'}
          onPress={() => setShowCustom((visible) => !visible)}
        >
          Custom
        </Button>
      </ScrollView>

      {showCustom ? (
        <Card style={styles.customCard}>
          <AppText variant="heading">Custom range</AppText>
          <DateField label="From" value={startDate} onChange={setStartDate} />
          <DateField label="To" value={endDate} onChange={setEndDate} />
          {error ? (
            <AppText color="expense" variant="caption">
              {error}
            </AppText>
          ) : null}
          <Button onPress={applyCustom}>Apply range</Button>
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.md },
  pills: { gap: spacing.sm, paddingRight: spacing.lg },
  customCard: { gap: spacing.md },
});
