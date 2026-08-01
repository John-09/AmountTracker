import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { EntryForm } from '@/components/entries/entry-form';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { Screen } from '@/components/ui/screen';
import { useDataRevision } from '@/db/data-context';
import { listCategories } from '@/db/repositories/categories';
import { getEntryById } from '@/db/repositories/entries';
import { deleteLedgerEntry, updateLedgerEntry } from '@/features/entries/mutations';
import { useAsyncData } from '@/hooks/use-async-data';

export default function EditEntryScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { revision, refreshData } = useDataRevision();
  const [deleting, setDeleting] = useState(false);
  const result = useAsyncData(
    async () => ({
      entry: await getEntryById(db, id),
      categories: await listCategories(db, true),
    }),
    { entry: null, categories: [] },
    `${id}:${revision}`,
  );

  if (result.loading && !result.data.entry) {
    return (
      <Screen>
        <LoadingState label="Loading entry…" />
      </Screen>
    );
  }
  if (result.error || !result.data.entry) {
    return (
      <Screen>
        <ErrorState message={result.error?.message ?? 'This entry no longer exists.'} />
      </Screen>
    );
  }

  const entry = result.data.entry;
  const confirmDelete = () => {
    Alert.alert('Delete entry?', 'Your balance and reports will update immediately.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setDeleting(true);
          void deleteLedgerEntry(db, entry.id)
            .then(async () => {
              refreshData();
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            })
            .catch((error) => Alert.alert('Couldn’t delete entry', error.message))
            .finally(() => setDeleting(false));
        },
      },
    ]);
  };

  return (
    <EntryForm
      key={entry.updatedAt}
      type={entry.type}
      categories={result.data.categories}
      initial={entry}
      submitLabel="Save changes"
      deleting={deleting}
      onDelete={confirmDelete}
      onSubmit={async (draft) => {
        await updateLedgerEntry(db, entry.id, draft);
        refreshData();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }}
    />
  );
}
