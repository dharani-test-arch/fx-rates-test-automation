import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { describe, expect, it } from 'vitest';
import App from './App';
import { USD_RATES, currenciesMock, ratesMock } from './test/mocks';

const EUR_RATES = [
  { currency: 'USD', rate: 1.087 },
  { currency: 'GBP', rate: 0.8587 },
];

function renderApp() {
  return render(
    <MockedProvider
      mocks={[currenciesMock(), ratesMock('USD', USD_RATES), ratesMock('EUR', EUR_RATES)]}
    >
      <App />
    </MockedProvider>,
  );
}

describe('App (components working together)', () => {
  it('loads rates for the default USD base', async () => {
    renderApp();

    expect(await screen.findAllByTestId('rate-row')).toHaveLength(3);
  });

  it('refetches and re-renders when the base currency changes', async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole('option', { name: 'EUR' });

    await user.selectOptions(screen.getByTestId('currency-select'), 'EUR');

    expect(await screen.findByText('1.0870')).toBeInTheDocument();
    expect(screen.getAllByTestId('rate-row')).toHaveLength(2);
  });

  it('narrows the list as the user types in the filter', async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findAllByTestId('rate-row');

    await user.type(screen.getByTestId('rate-filter'), 'gbp');

    const rows = screen.getAllByTestId('rate-row');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveAttribute('data-currency', 'GBP');
  });
});
