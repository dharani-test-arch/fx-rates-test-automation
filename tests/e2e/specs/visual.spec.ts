import { test, expect } from '../fixtures';
import { mockGraphQL } from '../helpers/graphql';

// Visual baselines are platform specific (fonts and anti-aliasing differ per OS), so they are
// generated and compared on the Linux CI runner. See README: "Visual regression".

test.describe('Visual regression: desktop', () => {
  test('rates page with data', async ({ page, ratesPage }) => {
    await expect(ratesPage.rows).toHaveCount(6);
    await expect(page).toHaveScreenshot('rates-default.png', { fullPage: true });
  });

  test('rates table only', async ({ page, ratesPage }) => {
    await expect(ratesPage.rows).toHaveCount(6);
    await expect(page.getByTestId('rates-table')).toHaveScreenshot('rates-table.png');
  });

  test('empty state', async ({ page, ratesPage }) => {
    await ratesPage.filterBy('zzz');
    await expect(ratesPage.empty).toBeVisible();
    await expect(page).toHaveScreenshot('rates-empty.png', { fullPage: true });
  });

  test('error state', async ({ page, freshRatesPage }) => {
    await mockGraphQL(page, 'GetRates', {
      response: { errors: [{ message: 'Internal server error' }], data: null },
    });
    await freshRatesPage.goto();
    await expect(freshRatesPage.error).toBeVisible();
    await expect(page).toHaveScreenshot('rates-error.png', { fullPage: true });
  });
});

test.describe('Visual regression: mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('rates page on a phone-sized screen', async ({ page, ratesPage }) => {
    await expect(ratesPage.rows).toHaveCount(6);
    await expect(page).toHaveScreenshot('rates-mobile.png', { fullPage: true });
  });
});
