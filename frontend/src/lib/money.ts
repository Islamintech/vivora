// Formats an amount in a restaurant's currency. The default is Korean won
// (KRW), which Intl renders as ₩ with no decimals. Owners may also enter a
// non-ISO symbol (e.g. "kr"), which Intl's currency style would throw on - so
// anything that isn't a 3-letter ISO code falls back to a trailing symbol.
const ISO_CODE = /^[A-Z]{3}$/;

export function formatMoney(amount: number | null | undefined, currency = 'KRW'): string {
  const n = amount ?? 0;

  if (ISO_CODE.test(currency)) {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
    } catch {
      // Unknown ISO code - fall through to the symbol style.
    }
  }

  // Plain symbol (e.g. "kr"): trailing symbol.
  const num = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `${num} ${currency}`;
}
