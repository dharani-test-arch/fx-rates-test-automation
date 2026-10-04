import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { describe, expect, it, vi } from 'vitest';
import { CurrencySelect } from './CurrencySelect';
import { GET_CURRENCIES } from '../queries';
import { ALL_CURRENCIES, currenciesMock } from '../test/mocks';

function renderSelect(mocks: MockedResponse[], onChange = vi.fn()) {
  render(
    <MockedProvider mocks={mocks}>
      <CurrencySelect value="USD" onChange={onChange} />
    </MockedProvider>,
  );
  return { onChange, select: screen.getByTestId('currency-select') };
}

describe('CurrencySelect', () => {
  it('is disabled while currencies load, then lists every currency', async () => {
    const { select } = renderSelect([currenciesMock()]);
    expect(select).toBeDisabled();

    await screen.findByRole('option', { name: 'EUR' });

    expect(select).toBeEnabled();
    expect(screen.getAllByRole('option')).toHaveLength(ALL_CURRENCIES.length);
  });

  it('reports the chosen currency through onChange', async () => {
    const user = userEvent.setup();
    const { select, onChange } = renderSelect([currenciesMock()]);
    await screen.findByRole('option', { name: 'GBP' });

    await user.selectOptions(select, 'GBP');

    expect(onChange).toHaveBeenCalledWith('GBP');
  });

  it('degrades gracefully when the currencies query fails', async () => {
    const { select } = renderSelect([
      { request: { query: GET_CURRENCIES }, error: new Error('boom') },
    ]);

    await waitFor(() => expect(select).toBeEnabled());
    expect(screen.getAllByRole('option')).toHaveLength(1); // falls back to the current value
  });
});
