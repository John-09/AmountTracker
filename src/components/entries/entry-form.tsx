import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { spacing } from '@/theme/tokens';
import type { EntryDraft, EntryType, ExpenseCategory } from '@/types';
import { paiseToInput, parseAmountToPaise } from '@/utils/currency';
import { isValidLocalDate, toLocalDateString } from '@/utils/dates';

import { AppText } from '../ui/app-text';
import { Button } from '../ui/button';
import { DateField } from '../ui/date-field';
import { Screen } from '../ui/screen';
import { TextField } from '../ui/text-field';
import { CategoryPicker } from './category-picker';

const entryFormSchema = z.object({
  amount: z.string().refine((value) => parseAmountToPaise(value) !== null, 'Enter a valid amount.'),
  entryDate: z.string().refine(isValidLocalDate, 'Choose a valid date.'),
  note: z.string().max(120, 'Keep the note within 120 characters.'),
  categoryId: z.string().nullable(),
});

type EntryFormValues = z.infer<typeof entryFormSchema>;

interface EntryFormProps {
  type: EntryType;
  categories?: ExpenseCategory[];
  initial?: Partial<EntryDraft>;
  submitLabel: string;
  onSubmit: (draft: EntryDraft) => Promise<void>;
  onDelete?: () => void;
  deleting?: boolean;
}

export function EntryForm({
  type,
  categories = [],
  initial,
  submitLabel,
  onSubmit,
  onDelete,
  deleting = false,
}: EntryFormProps) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      amount: initial?.amountPaise ? paiseToInput(initial.amountPaise) : '',
      entryDate: initial?.entryDate ?? toLocalDateString(),
      note: initial?.note ?? '',
      categoryId: initial?.categoryId ?? (type === 'expense' ? categories[0]?.id ?? null : null),
    },
  });

  const submit = handleSubmit(async (values) => {
    if (type === 'expense' && !values.categoryId) {
      setError('categoryId', { message: 'Choose an expense category.' });
      return;
    }

    try {
      await onSubmit({
        type,
        amountPaise: parseAmountToPaise(values.amount)!,
        categoryId: type === 'expense' ? values.categoryId : null,
        entryDate: values.entryDate,
        note: values.note.trim() || null,
      });
    } catch (caught) {
      setError('root', {
        message: caught instanceof Error ? caught.message : 'Unable to save this entry.',
      });
    }
  });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen scroll includeBottomInset contentStyle={styles.content}>
        <View style={styles.intro}>
          <AppText variant="title">{type === 'expense' ? 'Record expense' : 'Add credit'}</AppText>
          <AppText color="muted">
            {type === 'expense'
              ? 'Your balance and reports update as soon as you save.'
              : 'Add money received without assigning an income category.'}
          </AppText>
        </View>

        <Controller
          control={control}
          name="amount"
          render={({ field: { onBlur, onChange, value } }) => (
            <TextField
              autoFocus={!initial?.amountPaise}
              label="Amount"
              placeholder="₹ 0.00"
              keyboardType="decimal-pad"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.amount?.message}
            />
          )}
        />

        {type === 'expense' ? (
          <Controller
            control={control}
            name="categoryId"
            render={({ field: { onChange, value } }) => (
              <CategoryPicker
                categories={categories}
                value={value}
                onChange={onChange}
                error={errors.categoryId?.message}
              />
            )}
          />
        ) : null}

        <Controller
          control={control}
          name="entryDate"
          render={({ field: { onChange, value } }) => (
            <DateField
              label="Date"
              value={value}
              onChange={onChange}
              maximumDate={new Date()}
              error={errors.entryDate?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="note"
          render={({ field: { onBlur, onChange, value } }) => (
            <TextField
              label="Note (optional)"
              placeholder={type === 'expense' ? 'Lunch, auto ride…' : 'Opening balance, refund…'}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.note?.message}
              maxLength={120}
              returnKeyType="done"
            />
          )}
        />

        {errors.root?.message ? (
          <AppText color="expense">{errors.root.message}</AppText>
        ) : null}
        <Button
          onPress={() => void submit()}
          loading={isSubmitting}
          icon={type === 'expense' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
        >
          {submitLabel}
        </Button>
        {onDelete ? (
          <Button variant="danger" icon="trash-outline" onPress={onDelete} loading={deleting}>
            Delete entry
          </Button>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: spacing.xl },
  intro: { gap: spacing.sm },
});
