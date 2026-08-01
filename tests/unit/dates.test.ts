import {
  createCustomRange,
  enumerateDates,
  getDateRange,
  inclusiveDayCount,
  toLocalDateString,
} from '@/utils/dates';

describe('date range helpers', () => {
  const saturday = new Date(2026, 7, 1, 10, 0, 0);

  test('uses Monday through Sunday for weekly reports', () => {
    expect(getDateRange('week', saturday)).toMatchObject({
      startDate: '2026-07-27',
      endDate: '2026-08-02',
    });
  });

  test('creates current and previous calendar months', () => {
    expect(getDateRange('month', saturday)).toMatchObject({
      startDate: '2026-08-01',
      endDate: '2026-08-31',
    });
    expect(getDateRange('previousMonth', saturday)).toMatchObject({
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });
  });

  test('validates custom ranges and counts dates inclusively', () => {
    expect(inclusiveDayCount('2026-08-01', '2026-08-03')).toBe(3);
    expect(enumerateDates('2026-08-01', '2026-08-03')).toEqual([
      '2026-08-01',
      '2026-08-02',
      '2026-08-03',
    ]);
    expect(() => createCustomRange('2026-08-03', '2026-08-01')).toThrow();
  });

  test('uses the device-local calendar date', () => {
    expect(toLocalDateString(new Date(2026, 7, 1, 23, 30))).toBe('2026-08-01');
  });
});
