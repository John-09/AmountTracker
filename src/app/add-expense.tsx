import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { EntryForm } from '@/components/entries/entry-form';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { Screen } from '@/components/ui/screen';
import { useDataRevision } from '@/db/data-context';
import { listCategories } from '@/db/repositories/categories';
import { createLedgerEntry } from '@/features/entries/mutations';
import { useAsyncData } from '@/hooks/use-async-data';
import { isValidLocalDate, toLocalDateString } from '@/utils/dates';

export default function AddExpenseScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const { revision, refreshData } = useDataRevision();
  const categories = useAsyncData(() => listCategories(db), [], revision);
  const requestedDate = typeof params.date === 'string' && isValidLocalDate(params.date) ? params.date : toLocalDateString();

  if (categories.loading && categories.data.length === 0) {
    return (
      <Screen>
        <LoadingState label="Loading categories…" />
      </Screen>
    );
  }
  if (categories.error) {
    return (
      <Screen>
        <ErrorState message={categories.error.message} onRetry={() => void categories.refresh()} />
      </Screen>
    );
  }

  return (
    <EntryForm
      type="expense"
      categories={categories.data}
      initial={{ entryDate: requestedDate }}
      submitLabel="Save expense"
      onSubmit={async (draft) => {
        await createLedgerEntry(db, draft);
        refreshData();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }}
    />
  );
}
