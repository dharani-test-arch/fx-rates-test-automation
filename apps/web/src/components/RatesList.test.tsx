import { render, screen, within } from '@testing-library/react';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { describe, expect, it } from 'vitest';
import { RatesList } from './RatesList';
import { GET_RATES } from '../queries';
import { USD_RATES, ratesErrorMock, ratesMock } from '../test/mocks';

function renderList(mocks: MockedResponse[], filter = '') {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <RatesList base="USD" filter={filter} />
    </MockedProvider>,
  );
}

describe('RatesList', () => {
  it('shows a loading state before data arrives', async () => {
    renderList([ratesMock('USD', USD_RATES)]);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(await screen.findByTestId('rates-table')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  it('renders one row per rate, formatted to 4 decimals', async () => {
    renderList([ratesMock('USD', USD_RATES)]);

    const rows = await screen.findAllByTestId('rate-row');
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByTestId('rate-currency')).toHaveTextContent('EUR');
    expect(within(rows[0]).getByTestId('rate-value')).toHaveTextContent('0.9200');
    expect(within(rows[2]).getByTestId('rate-value')).toHaveTextContent('83.1000');
  });

  it('filters rows by currency code, ignoring case', async () => {
    renderList([ratesMock('USD', USD_RATES)], 'eUr');

    const rows = await screen.findAllByTestId('rate-row');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveAttribute('data-currency', 'EUR');
  });

  it('shows an empty state that echoes the filter when nothing matches', async () => {
    renderList([ratesMock('USD', USD_RATES)], 'zzz');

    expect(await screen.findByTestId('empty')).toHaveTextContent('zzz');
    expect(screen.queryByTestId('rate-row')).not.toBeInTheDocument();
  });

  it('shows an error alert when the network request fails', async () => {
    renderList([ratesErrorMock('USD', new Error('Network down'))]);

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be loaded/i);
  });

  it('shows an error alert when GraphQL returns errors', async () => {
    renderList([
      {
        request: { query: GET_RATES, variables: { currency: 'USD' } },
        result: { errors: [new GraphQLError('Unsupported currency: USD')] },
      },
    ]);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
