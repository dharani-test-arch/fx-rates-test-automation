# fx-rates-test-automation

A small React + GraphQL currency-rates app, and the test automation framework built around it.
The app is deliberately simple; the point of the repo is the quality engineering around it:
framework design, test strategy, CI optimization, and reporting.

## Test pyramid

```
        ▲   E2E (Playwright, real browser)      6 tests   whole system, user-visible behaviour
       ╱ ╲
      ╱   ╲  API / contract (Playwright request) ~20 tests  server behaviour, schema, client↔server contract
     ╱     ╲
    ╱_______╲ Component (Vitest + RTL)           12 tests  UI states in isolation, mocked GraphQL
```

| Layer | Tooling | Runs on |
|---|---|---|
| Component | Vitest, React Testing Library, Apollo `MockedProvider` | every PR |
| API + contract | Playwright `request`, graphql-js schema validation | every PR |
| E2E | Playwright + TypeScript, page objects, fixtures, network mocking | every PR, 2 shards |
| Reporting | Allure 3, published to GitHub Pages from `main` | every run |

## Architecture

```
apps/graphql-server   Apollo Server, deterministic seed data (rates against USD)
apps/web              React + Apollo Client + Vite; proxies /graphql to the server
tests/api             GraphQL tests over HTTP: queries, errors, schema contract
tests/e2e             Browser tests: page objects, fixtures, GraphQL mock helper
```

## Run it

```bash
nvm use                      # Node 20
npm install
npm exec -w tests/e2e -- playwright install chromium   # or set PW_CHANNEL=msedge

npm run test:component       # Vitest
npm run test:api             # starts the GraphQL server itself
npm run test:e2e             # starts both servers itself
npm test                     # all three layers

npm run report:allure        # merge results + build the combined report
npm run report:allure:open
```

## Design decisions

1. **Own the backend.** The public sample this project started from depended on a hosted sandbox API
   that could disappear, making tests flaky for reasons unrelated to the code under test.
   A local server with fixed data makes every assertion deterministic.
2. **Same-origin `/graphql` via the Vite proxy.** No CORS in dev, and tests have one stable URL to intercept.
3. **Mock one operation, keep the rest real** (`mockGraphQL`). Loading and error states are tested
   without a fragile backend, and everything else still hits the real server.
4. **Contract test against the client's real queries.** `contract.spec.ts` introspects the live schema and
   validates the queries the web app actually ships (`apps/web/src/queries.ts`). A server change that
   would break the frontend fails here in seconds, with no browser.
5. **Independent oracle for API tests.** Expected currencies live in the tests, not imported from server
   code, so a data bug can't make the tests agree with it.
6. **Push logic down the pyramid.** Loading, error, empty, and filter behaviour is covered by fast component
   tests; E2E keeps only the journeys that need the full stack.
7. **API tests need no browser**, so that CI job skips the browser install entirely.
8. **Allure results from every suite are merged** into one report so quality is visible in one place.

## Finding worth noting

The reciprocal-rate test needs a 1% tolerance. Rates are rounded to 4 decimals, so small rates lose
precision (INR→USD is 0.0120 for a true 0.01203, about 0.3% off). If this were a real pricing service the
fix would be returning more decimals or using a decimal type, not widening the tolerance.

## CI

`ci.yml` runs component, API, and sharded E2E jobs in parallel on every PR, caches Playwright browsers,
uploads traces and videos on failure, merges shard reports, and publishes the Allure report to GitHub Pages
from `main`.

| Setup | Wall-clock time |
|---|---|
| Single job, no cache | _TBD_ |
| 2 shards + browser cache | _TBD_ |

## Credits

Inspired by the Apollo/React getting-started example in
[Ebazhanov/react-graphql-example](https://github.com/Ebazhanov/react-graphql-example).
