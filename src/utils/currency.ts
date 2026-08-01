const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const INR_COMPACT_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatCurrency(amountPaise: number): string {
  return INR_FORMATTER.format(amountPaise / 100);
}

export function formatCompactCurrency(amountPaise: number): string {
  return INR_COMPACT_FORMATTER.format(amountPaise / 100);
}

export function parseAmountToPaise(input: string): number | null {
  const normalized = input.trim().replace(/,/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) {
    return null;
  }

  const [rupees, paise = ''] = normalized.split('.');
  const amount = Number(rupees) * 100 + Number(paise.padEnd(2, '0'));

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

export function paiseToInput(amountPaise: number): string {
  const rupees = Math.floor(amountPaise / 100);
  const paise = amountPaise % 100;
  return paise === 0 ? String(rupees) : `${rupees}.${String(paise).padStart(2, '0')}`;
}
