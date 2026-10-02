// Deterministic seed data: every rate is expressed against USD.
// Fixed values keep tests stable and make expected results easy to compute.
export const USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.1,
  JPY: 149.5,
  AUD: 1.52,
  CAD: 1.36,
};

export const CURRENCIES = Object.keys(USD_RATES);

export function ratesFor(base: string) {
  const baseRate = USD_RATES[base];
  return CURRENCIES.filter((c) => c !== base).map((currency) => ({
    currency,
    rate: Number((USD_RATES[currency] / baseRate).toFixed(4)),
  }));
}
