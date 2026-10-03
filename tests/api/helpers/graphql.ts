import type { APIRequestContext, APIResponse } from '@playwright/test';

export type GraphQLError = {
  message: string;
  extensions?: { code?: string; [key: string]: unknown };
};

export type GraphQLBody<T> = { data: T | null; errors?: GraphQLError[] };

/** POST a GraphQL operation and return both the HTTP response and the parsed body. */
export async function gql<T = unknown>(
  request: APIRequestContext,
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ response: APIResponse; body: GraphQLBody<T> }> {
  const response = await request.post('/', { data: { query, variables } });
  const body = (await response.json()) as GraphQLBody<T>;
  return { response, body };
}
