import { type Locator, type Page, expect } from '@playwright/test';

export class RatesPage {
  readonly currencySelect: Locator;
  readonly filterInput: Locator;
  readonly rows: Locator;
  readonly loading: Locator;
  readonly error: Locator;
  readonly empty: Locator;

  constructor(private readonly page: Page) {
    this.currencySelect = page.getByTestId('currency-select');
    this.filterInput = page.getByTestId('rate-filter');
    this.rows = page.getByTestId('rate-row');
    this.loading = page.getByTestId('loading');
    this.error = page.getByTestId('error');
    this.empty = page.getByTestId('empty');
  }

  async goto() {
    await this.page.goto('/');
  }

  async selectCurrency(code: string) {
    await this.currencySelect.selectOption(code);
  }

  async filterBy(text: string) {
    await this.filterInput.fill(text);
  }

  rowFor(code: string): Locator {
    return this.page.locator(`[data-testid="rate-row"][data-currency="${code}"]`);
  }

  async expectRate(code: string, value: string) {
    await expect(this.rowFor(code).getByTestId('rate-value')).toHaveText(value);
  }
}
