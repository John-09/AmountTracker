import { render, screen } from '@testing-library/react-native';

import { EntryRow } from '@/components/entries/entry-row';
import type { LedgerEntry } from '@/types';

const credit: LedgerEntry = {
  id: 'credit-1',
  type: 'credit',
  amountPaise: 1_000_000,
  categoryId: null,
  categoryName: null,
  categoryIcon: null,
  categoryColor: null,
  entryDate: '2026-08-01',
  note: 'Opening balance',
  createdAt: '2026-08-01T08:00:00.000Z',
  updatedAt: '2026-08-01T08:00:00.000Z',
};

describe('EntryRow', () => {
  test('renders a generic credit without a salary category', async () => {
    await render(<EntryRow entry={credit} />);
    expect(screen.getByText('Credit')).toBeTruthy();
    expect(screen.getByText('Opening balance')).toBeTruthy();
    expect(screen.getByText(/10,000/)).toBeTruthy();
  });
});
