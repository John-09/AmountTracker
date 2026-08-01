import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/use-app-theme';
import { formatEntryDate, fromLocalDateString, toLocalDateString } from '@/utils/dates';

import { AppText } from './app-text';

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  error?: string;
}

export function DateField({
  label,
  value,
  onChange,
  maximumDate,
  minimumDate,
  error,
}: DateFieldProps) {
  const { colors } = useAppTheme();
  const date = fromLocalDateString(value);

  const openAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value: date,
      mode: 'date',
      maximumDate,
      minimumDate,
      onChange: (_, next) => {
        if (next) onChange(toLocalDateString(next));
      },
    });
  };

  return (
    <View style={styles.wrapper}>
      <AppText variant="label">{label}</AppText>
      {Platform.OS === 'android' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${formatEntryDate(value)}`}
          onPress={openAndroidPicker}
          style={[styles.field, { backgroundColor: colors.surface, borderColor: error ? colors.expense : colors.border }]}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <AppText>{formatEntryDate(value)}</AppText>
        </Pressable>
      ) : (
        <DateTimePicker
          value={date}
          mode="date"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={(_, next) => next && onChange(toLocalDateString(next))}
        />
      )}
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
  field: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
});
