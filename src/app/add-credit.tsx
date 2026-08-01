import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { EntryForm } from '@/components/entries/entry-form';
import { useDataRevision } from '@/db/data-context';
import { createLedgerEntry } from '@/features/entries/mutations';

export default function AddCreditScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { refreshData } = useDataRevision();

  return (
    <EntryForm
      type="credit"
      submitLabel="Add credit"
      onSubmit={async (draft) => {
        await createLedgerEntry(db, draft);
        refreshData();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }}
    />
  );
}
