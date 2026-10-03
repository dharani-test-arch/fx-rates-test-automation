import { test, expect } from '@playwright/test';
import {
  buildClientSchema,
  getIntrospectionQuery,
  isObjectType,
  validate,
  type IntrospectionQuery,
} from 'graphql';
import { gql } from '../helpers/graphql';
// The real queries the web app ships with, not copies of them.
import { GET_CURRENCIES, GET_RATES } from '../../../apps/web/src/queries';

async function fetchSchema(request: Parameters<typeof gql>[0]) {
  const { body } = await gql<IntrospectionQuery>(request, getIntrospectionQuery());
  expect(body.errors, 'introspection should be enabled in test environments').toBeUndefined();
  return buildClientSchema(body.data!);
}

test.describe('schema contract', () => {
  test('Query exposes the fields and argument types clients rely on', async ({ request }) => {
    const fields = (await fetchSchema(request)).getQueryType()!.getFields();

    expect(String(fields.currencies.type)).toBe('[String!]!');
    expect(String(fields.rates.type)).toBe('[ExchangeRate!]!');
    expect(fields.rates.args.map((a) => `${a.name}: ${a.type}`)).toEqual(['currency: String!']);
  });

  test('ExchangeRate has exactly the expected fields and types', async ({ request }) => {
    const type = (await fetchSchema(request)).getType('ExchangeRate');

    expect(isObjectType(type)).toBe(true);
    if (!isObjectType(type)) return;
    const shape = Object.fromEntries(
      Object.entries(type.getFields()).map(([name, f]) => [name, String(f.type)]),
    );
    expect(shape).toEqual({ currency: 'String!', rate: 'Float!' });
  });

  // Catches the failure that matters most in practice: a server change that
  // silently breaks a query the frontend already depends on.
  test('the web app queries are valid against the live schema', async ({ request }) => {
    const schema = await fetchSchema(request);

    expect(validate(schema, GET_CURRENCIES), 'GET_CURRENCIES').toEqual([]);
    expect(validate(schema, GET_RATES), 'GET_RATES').toEqual([]);
  });
});
