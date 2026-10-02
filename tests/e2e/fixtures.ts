import { test as base } from '@playwright/test';
import { RatesPage } from './pages/rates.page';

type Fixtures = {
  /** A RatesPage that has already navigated to the app. */
  ratesPage: RatesPage;
  /** A RatesPage that has NOT navigated yet, for tests that mock the network first. */
  freshRatesPage: RatesPage;
};

export const test = base.extend<Fixtures>({
  ratesPage: async ({ page }, use) => {
    const ratesPage = new RatesPage(page);
    await ratesPage.goto();
    await use(ratesPage);
  },
  freshRatesPage: async ({ page }, use) => {
    await use(new RatesPage(page));
  },
});

export { expect } from '@playwright/test';
