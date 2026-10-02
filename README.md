# fx-rates-test-automation

A small React + GraphQL currency-rates app, and the test automation framework built around it.
The app is deliberately simple; the point of the repo is the quality engineering around it:
framework design, test strategy, CI optimization, and reporting.

## Status

| Layer | Tooling | Status |
|---|---|---|
| E2E | Playwright + TypeScript, page objects, fixtures, network mocking | ✅ Week 1 |
| CI | GitHub Actions, sharding, browser caching, merged reports | ✅ Week 1 |
| GraphQL contract / integration | | Week 2 |
| Component tests | Vitest + React Testing Library | Week 2 |
| Reporting | Allure on GitHub Pages | Week 2 |

## Architecture

```
apps/graphql-server   Apollo Server, deterministic seed data (rates against USD)
apps/web              React + Apollo Client + Vite; proxies /graphql to the server
tests/e2e             Playwright suite, page objects, fixtures, GraphQL mock helper
```

## Run it

```bash
nvm use                      # Node 20
npm install
npm exec -w tests/e2e -- playwright install chromium

npm run dev:server           # http://localhost:4000
npm run dev:web              # http://localhost:5173
npm run test:e2e             # starts both servers automatically if needed
```

## Design decisions

1. **Own the backend.** The public sample this project started from depended on a hosted sandbox API that
   could disappear or change, which makes tests flaky for reasons unrelated to the code under test.
   A local server with fixed data makes every assertion deterministic.
2. **Same-origin `/graphql` via the Vite proxy.** No CORS in dev, and tests have a single stable URL to intercept.
3. **Mock one operation, keep the rest real.** `mockGraphQL(page, 'GetRates', ...)` intercepts by operation name
   and lets everything else hit the real server. Loading and error states are tested without a fragile backend.
4. **Test IDs on state elements** (`loading`, `error`, `empty`) so the framework asserts behavior, not copy.
5. **Page objects + fixtures.** Specs read as intent; locators live in one place.

## CI

`e2e.yml` runs on every PR in 2 shards, caches Playwright browsers, uploads traces and videos on failure,
and merges shard reports into a single HTML report.

| Setup | Wall-clock time |
|---|---|
| Single job, no cache | _TBD, record after first runs_ |
| 2 shards + browser cache | _TBD_ |

## Credits

Inspired by the Apollo/React getting-started example in
[Ebazhanov/react-graphql-example](https://github.com/Ebazhanov/react-graphql-example).
=======
