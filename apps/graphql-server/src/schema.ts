import { GraphQLError } from 'graphql';
import { CURRENCIES, USD_RATES, ratesFor } from './data.js';

export const typeDefs = `#graphql
  type ExchangeRate {
    currency: String!
    rate: Float!
  }

  type Query {
    "All supported currency codes."
    currencies: [String!]!
    "Rates of every other currency against the given base currency."
    rates(currency: String!): [ExchangeRate!]!
  }
`;

export const resolvers = {
  Query: {
    currencies: () => CURRENCIES,
    rates: (_: unknown, { currency }: { currency: string }) => {
      const base = currency.toUpperCase();
      if (!(base in USD_RATES)) {
        throw new GraphQLError(`Unsupported currency: ${currency}`, {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      return ratesFor(base);
    },
  },
};
