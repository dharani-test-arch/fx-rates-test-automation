import { test, expect } from '../fixtures';
import { mockGraphQL } from '../helpers/graphql';

test.describe('Exchange rates', () => {
  test('shows rates for the default USD base, excluding USD itself', async ({ ratesPage }) => {
    await expect(ratesPage.rows).toHaveCount(6);
    await expect(ratesPage.rowFor('USD')).toHaveCount(0);
    await ratesPage.expectRate('EUR', '0.9200');
    await ratesPage.expectRate('INR', '83.1000');
  });

  test('recalculates rates when the base currency changes', async ({ ratesPage }) => {
    await ratesPage.selectCurrency('EUR');

    await expect(ratesPage.rowFor('EUR')).toHaveCount(0);
    await ratesPage.expectRate('USD', '1.0870'); // 1 / 0.92
  });

  test('filters the list by currency code, case-insensitively', async ({ ratesPage }) => {
    await ratesPage.filterBy('eur');

    await expect(ratesPage.rows).toHaveCount(1);
    await expect(ratesPage.rowFor('EUR')).toBeVisible();
  });

  test('shows an empty state when the filter matches nothing', async ({ ratesPage }) => {
    await ratesPage.filterBy('zzz');

    await expect(ratesPage.empty).toBeVisible();
    await expect(ratesPage.rows).toHaveCount(0);
  });

  test('shows a loading state while rates are in flight', async ({ page, freshRatesPage }) => {
    await mockGraphQL(page, 'GetRates', {
      delayMs: 1000,
      response: { data: { rates: [{ __typename: 'ExchangeRate', currency: 'EUR', rate: 0.92 }] } },
    });
    await freshRatesPage.goto();

    await expect(freshRatesPage.loading).toBeVisible();
    await expect(freshRatesPage.rows).toHaveCount(1);
    await expect(freshRatesPage.loading).toBeHidden();
  });

  test('shows an error state when the GraphQL API returns errors', async ({ page, freshRatesPage }) => {
    await mockGraphQL(page, 'GetRates', {
      response: { errors: [{ message: 'Internal server error' }], data: null },
    });
    await freshRatesPage.goto();

    await expect(freshRatesPage.error).toBeVisible();
    await expect(freshRatesPage.rows).toHaveCount(0);
  });
});
