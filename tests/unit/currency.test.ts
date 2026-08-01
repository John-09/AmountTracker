import { formatCurrency, paiseToInput, parseAmountToPaise } from '@/utils/currency';

describe('currency helpers', () => {
  test('parses rupees and paise without floating point arithmetic', () => {
    expect(parseAmountToPaise('10,000')).toBe(1_000_000);
    expect(parseAmountToPaise('250.5')).toBe(25_050);
    expect(parseAmountToPaise('0.01')).toBe(1);
  });

  test('rejects invalid or non-positive values', () => {
    expect(parseAmountToPaise('0')).toBeNull();
    expect(parseAmountToPaise('-20')).toBeNull();
    expect(parseAmountToPaise('12.345')).toBeNull();
    expect(parseAmountToPaise('hello')).toBeNull();
  });

  test('formats INR and converts stored paise back to form input', () => {
    expect(formatCurrency(1_000_050)).toContain('10,000.5');
    expect(paiseToInput(25_050)).toBe('250.50');
    expect(paiseToInput(25_000)).toBe('250');
  });
});
