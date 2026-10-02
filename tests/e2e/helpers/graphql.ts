import type { Page } from '@playwright/test';

type MockOptions = {
  /** JSON body to return, e.g. { data: {...} } or { errors: [...] } */
  response: Record<string, unknown>;
  /** Artificial latency, useful for asserting loading states. */
  delayMs?: number;
  status?: number;
};

/**
 * Intercept one GraphQL operation by name. Every other operation falls through
 * to the real server, so a test can mock exactly one thing and keep the rest real.
 */
export async function mockGraphQL(page: Page, operationName: string, opts: MockOptions) {
  await page.route('**/graphql', async (route) => {
    const body = route.request().postDataJSON() as { operationName?: string } | null;
    if (body?.operationName !== operationName) {
      return route.fallback();
    }
    if (opts.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, opts.delayMs));
    }
    await route.fulfill({ status: opts.status ?? 200, json: opts.response });
  });
}
