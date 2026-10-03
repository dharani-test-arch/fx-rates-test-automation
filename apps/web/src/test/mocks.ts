import type { MockedResponse } from '@apollo/client/testing';
import { GET_CURRENCIES, GET_RATES } from '../queries';

export type Rate = { currency: string; rate: number };

export const ALL_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'];

export const currenciesMock = (currencies = ALL_CURRENCIES): MockedResponse => ({
  request: { query: GET_CURRENCIES },
  result: { data: { currencies } },
});

export const ratesMock = (currency: string, rates: Rate[]): MockedResponse => ({
  request: { query: GET_RATES, variables: { currency } },
  result: { data: { rates } },
});

export const ratesErrorMock = (currency: string, error: Error): MockedResponse => ({
  request: { query: GET_RATES, variables: { currency } },
  error,
});

export const USD_RATES: Rate[] = [
  { currency: 'EUR', rate: 0.92 },
  { currency: 'GBP', rate: 0.79 },
  { currency: 'INR', rate: 83.1 },
];
