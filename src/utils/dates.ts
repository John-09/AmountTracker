import type { DatePreset, DateRange } from '@/types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function toLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromLocalDateString(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function addDays(value: string | Date, days: number): Date {
  const date = typeof value === 'string' ? fromLocalDateString(value) : new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

export function isValidLocalDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toLocalDateString(fromLocalDateString(value)) === value;
}

export function getDateRange(preset: Exclude<DatePreset, 'custom'>, now = new Date()): DateRange {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === 'today') {
    const date = toLocalDateString(today);
    return { startDate: date, endDate: date, label: 'Today', preset };
  }

  if (preset === 'week') {
    const mondayOffset = (today.getDay() + 6) % 7;
    const start = new Date(today);
    start.setDate(today.getDate() - mondayOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      startDate: toLocalDateString(start),
      endDate: toLocalDateString(end),
      label: 'This week',
      preset,
    };
  }

  if (preset === 'previousMonth') {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return {
      startDate: toLocalDateString(start),
      endDate: toLocalDateString(end),
      label: start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      preset,
    };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    startDate: toLocalDateString(start),
    endDate: toLocalDateString(end),
    label: start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    preset,
  };
}

export function createCustomRange(startDate: string, endDate: string): DateRange {
  if (!isValidLocalDate(startDate) || !isValidLocalDate(endDate) || startDate > endDate) {
    throw new Error('Choose a valid start and end date.');
  }

  return { startDate, endDate, label: 'Custom range', preset: 'custom' };
}

export function inclusiveDayCount(startDate: string, endDate: string): number {
  return Math.max(
    1,
    Math.round((fromLocalDateString(endDate).getTime() - fromLocalDateString(startDate).getTime()) / DAY_MS) +
      1,
  );
}

export function enumerateDates(startDate: string, endDate: string, maximum = 366): string[] {
  const result: string[] = [];
  let current = fromLocalDateString(startDate);
  const end = fromLocalDateString(endDate);
  while (current <= end && result.length < maximum) {
    result.push(toLocalDateString(current));
    current = addDays(current, 1);
  }
  return result;
}

export function formatEntryDate(value: string): string {
  const date = fromLocalDateString(value);
  const today = toLocalDateString();
  const yesterday = toLocalDateString(addDays(today, -1));
  if (value === today) return 'Today';
  if (value === yesterday) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatShortDate(value: string): string {
  return fromLocalDateString(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function combineLocalDateAndTime(date: string, hour: number, minute: number): Date {
  const result = fromLocalDateString(date);
  result.setHours(hour, minute, 0, 0);
  return result;
}
