import http from 'k6/http';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000/';
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'];

const RATES_QUERY = `
  query Rates($currency: String!) {
    rates(currency: $currency) { currency rate }
  }`;

export function pickCurrency() {
  return CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)];
}

export function queryRates(currency) {
  return http.post(BASE_URL, JSON.stringify({ query: RATES_QUERY, variables: { currency } }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'rates' },
  });
}

/** Checks shared by every scenario: the response must be correct, not merely fast. */
export const ratesChecks = {
  'status is 200': (r) => r.status === 200,
  'no GraphQL errors': (r) => r.json('errors') === undefined,
  'returns 6 rates': (r) => (r.json('data.rates') || []).length === 6,
};
