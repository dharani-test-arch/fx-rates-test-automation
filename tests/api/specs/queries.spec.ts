import { test, expect } from '@playwright/test';
import { gql } from '../helpers/graphql';
import { CURRENCIES } from '../helpers/expected';

const RATES = `
  query Rates($currency: String!) {
    rates(currency: $currency) { currency rate }
  }`;

type Rate = { currency: string; rate: number };
type RatesData = { rates: Rate[] };

const toMap = (rates: Rate[]) => Object.fromEntries(rates.map((r) => [r.currency, r.rate]));

test.describe('currencies query', () => {
  test('returns every supported currency code', async ({ request }) => {
    const { response, body } = await gql<{ currencies: string[] }>(request, '{ currencies }');

    expect(response.status()).toBe(200);
    expect(body.errors).toBeUndefined();
    expect(body.data?.currencies).toEqual(CURRENCIES);
  });
});

test.describe('rates query', () => {
  test('USD base returns the other six currencies with known values', async ({ request }) => {
    const { body } = await gql<RatesData>(request, RATES, { currency: 'USD' });

    expect(body.errors).toBeUndefined();
    expect(toMap(body.data!.rates)).toEqual({
      EUR: 0.92, GBP: 0.79, INR: 83.1, JPY: 149.5, AUD: 1.52, CAD: 1.36,
    });
  });

  test('derives cross rates from the USD rates', async ({ request }) => {
    const { body } = await gql<RatesData>(request, RATES, { currency: 'EUR' });
    const rates = toMap(body.data!.rates);

    expect(rates.USD).toBe(1.087);   // 1 / 0.92
    expect(rates.GBP).toBe(0.8587);  // 0.79 / 0.92
  });

  test('accepts the base currency in any letter case', async ({ request }) => {
    const upper = await gql<RatesData>(request, RATES, { currency: 'USD' });
    const lower = await gql<RatesData>(request, RATES, { currency: 'usd' });

    expect(lower.body.errors).toBeUndefined();
    expect(lower.body.data).toEqual(upper.body.data);
  });

  for (const base of CURRENCIES) {
    test(`${base} base excludes itself and returns the rest`, async ({ request }) => {
      const { body } = await gql<RatesData>(request, RATES, { currency: base });
      const codes = body.data!.rates.map((r) => r.currency);

      expect(codes).not.toContain(base);
      expect(codes.sort()).toEqual(CURRENCIES.filter((c) => c !== base).sort());
      for (const r of body.data!.rates) expect(r.rate).toBeGreaterThan(0);
    });
  }

  test('rates are reciprocal: A→B multiplied by B→A is about 1', async ({ request }) => {
    const matrix: Record<string, Record<string, number>> = {};
    for (const base of CURRENCIES) {
      const { body } = await gql<RatesData>(request, RATES, { currency: base });
      matrix[base] = toMap(body.data!.rates);
    }

    for (const a of CURRENCIES) {
      for (const b of CURRENCIES) {
        if (a === b) continue;
        const product = matrix[a][b] * matrix[b][a];
        // Tolerance is 1% because rates are rounded to 4 decimals, which costs
        // up to ~0.3% for small rates such as INR→USD (0.0120).
        expect(Math.abs(product - 1), `${a}↔${b}`).toBeLessThan(0.01);
      }
    }
  });
});
