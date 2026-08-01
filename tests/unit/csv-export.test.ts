import { entriesToCsv } from '@/services/csv-export';
import type { LedgerEntry } from '@/types';

const baseEntry: LedgerEntry = {
  id: 'entry-1',
  type: 'expense',
  amountPaise: 25_050,
  categoryId: 'cat-food',
  categoryName: 'Food',
  categoryIcon: 'restaurant-outline',
  categoryColor: '#EF8354',
  entryDate: '2026-08-01',
  note: 'Lunch, with team',
  createdAt: '2026-08-01T08:00:00.000Z',
  updatedAt: '2026-08-01T08:00:00.000Z',
};

describe('CSV export', () => {
  test('exports readable rupee values and escapes commas', () => {
    const csv = entriesToCsv([baseEntry]);
    expect(csv).toContain('Date,Type,Category,Note,Amount (INR)');
    expect(csv).toContain('2026-08-01,expense,Food,"Lunch, with team",250.50');
  });

  test('escapes quotes and new lines', () => {
    const csv = entriesToCsv([{ ...baseEntry, note: 'Cafe "A"\nReceipt' }]);
    expect(csv).toContain('"Cafe ""A""\nReceipt"');
  });
});
