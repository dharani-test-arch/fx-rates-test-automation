import { test, expect } from '@playwright/test';
import { gql } from '../helpers/graphql';

test.describe('error handling', () => {
  test('unknown currency returns BAD_USER_INPUT and no data', async ({ request }) => {
    const { response, body } = await gql(
      request,
      'query($c: String!) { rates(currency: $c) { currency rate } }',
      { c: 'XXX' },
    );

    expect(response.status()).toBe(200); // resolver errors are still HTTP 200 in GraphQL
    expect(body.data).toBeNull();
    expect(body.errors).toHaveLength(1);
    expect(body.errors![0].extensions?.code).toBe('BAD_USER_INPUT');
    expect(body.errors![0].message).toContain('Unsupported currency');
  });

  test('missing required variable is rejected with an error and no data', async ({ request }) => {
    const { response, body } = await gql(
      request,
      'query($currency: String!) { rates(currency: $currency) { currency } }',
    );
  
    expect(response.status()).toBeLessThan(500); // a client error, not a server crash
    expect(body.data ?? null).toBeNull();
    expect(body.errors?.[0].message).toContain('$currency');
  });

  test('unknown field fails validation', async ({ request }) => {
    const { response, body } = await gql(request, '{ doesNotExist }');

    expect(response.status()).toBe(400);
    expect(body.errors?.[0].extensions?.code).toBe('GRAPHQL_VALIDATION_FAILED');
  });

  test('malformed query fails to parse', async ({ request }) => {
    const { response, body } = await gql(request, '{ rates(');

    expect(response.status()).toBe(400);
    expect(body.errors?.[0].extensions?.code).toBe('GRAPHQL_PARSE_FAILED');
  });
});
