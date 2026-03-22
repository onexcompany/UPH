export function formatCurrency(value: number | string, currency = 'BRL') {
  const amount = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function toNumber(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (value && typeof value === 'object' && 'toString' in value) {
    return Number(value.toString());
  }
  return 0;
}

export function distributeAmount(total: number, parts: number) {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / parts);
  const remainder = cents % parts;

  return Array.from({ length: parts }, (_, index) =>
    Number(((base + (index < remainder ? 1 : 0)) / 100).toFixed(2)),
  );
}
