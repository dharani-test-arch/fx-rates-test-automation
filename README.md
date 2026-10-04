# fx-rates-test-automation

A small React + GraphQL currency-rates app, and the test automation framework built around it.
The app is deliberately simple; the point of the repo is the quality engineering around it:
framework design, test strategy, CI optimization, performance, and quality analytics.

## Test strategy

```
        ▲   E2E + visual (real browser)          ~11 tests   whole system, what users see
       ╱ ╲
      ╱   ╲  API / contract (HTTP, no browser)    24 tests    server behaviour, schema, client↔server contract
     ╱     ╲
    ╱_______╲ Component (Vitest + RTL)            12 tests    UI states in isolation, mocked GraphQL
   ── performance (k6 API, Lighthouse frontend) runs alongside, not on the pyramid ──
```

| Layer | Tooling | Runs |
|---|---|---|
| Component | Vitest, React Testing Library, Apollo `MockedProvider` | every PR |
| API + contract | Playwright `request`, graphql-js schema validation | every PR |
| E2E | Playwright + TypeScript, page objects, fixtures, network mocking | every PR, 2 shards |
| Visual regression | Playwright screenshot comparison | every PR (Linux baselines) |
| API performance | k6: smoke on PRs, load nightly | PR / nightly |
| Frontend performance + a11y | Lighthouse CI | every PR |
| Reporting | Allure 3 on GitHub Pages | every run |
| Quality analytics | `scripts/quality-metrics.mjs` (flaky rate, first-attempt pass rate) | every run on `main` |

## Architecture

```
apps/graphql-server   Apollo Server, deterministic seed data (rates against USD)
apps/web              React + Apollo Client + Vite; proxies /graphql to the server
tests/api             GraphQL tests over HTTP: queries, errors, schema contract
tests/e2e             Browser tests (chromium project) and visual tests (visual project)
perf/                 k6 scripts and Lighthouse CI config
scripts/              Allure merge + quality-metrics analytics
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
npm run perf:smoke           # needs k6 and `npm run dev:server`; see perf/README.md
```

## Design decisions

1. **Own the backend.** The public sample this project started from depended on a hosted sandbox API
   that could disappear, making tests flaky for reasons unrelated to the code under test.
2. **Same-origin `/graphql` via the Vite proxy.** No CORS in dev, and tests have one stable URL to intercept.
3. **Mock one operation, keep the rest real** (`mockGraphQL`). Loading and error states are tested
   without a fragile backend.
4. **Contract test against the client's real queries.** `contract.spec.ts` introspects the live schema and
   validates the queries the web app ships. A breaking server change fails in seconds, with no browser.
5. **Independent oracle for API tests.** Expected currencies live in the tests, not imported from server code.
6. **Push logic down the pyramid.** State and formatting logic is covered by fast component tests;
   E2E keeps only journeys that need the full stack.
7. **API tests need no browser**, so that CI job skips the browser install entirely.
8. **Gate on stable signals, warn on noisy ones.** Lighthouse accessibility fails the build; performance
   and best-practices only warn, because scores vary on shared CI machines and a flaky gate gets ignored.
9. **Cheap checks on every PR, expensive ones nightly.** k6 smoke (1 VU, 15s) gates PRs; the 50-VU load
   test runs on a schedule.
10. **Performance checks assert correctness too.** k6 thresholds include `checks`, because a fast error is
    not a pass.

## Visual regression

Screenshots differ by operating system (fonts, anti-aliasing), so baselines are **Linux-only and generated in CI**.
The `visual` Playwright project is excluded from `npm run test:e2e` so it never fails on a developer's machine.

- Intentional UI change or first setup: run the **update visual baselines** workflow (Actions tab). It
  regenerates the images on the CI runner and commits them. Review them in the pull request diff.
- Unintentional change: the `visual` job fails and uploads expected / actual / diff images.
- A small pixel tolerance (`maxDiffPixelRatio: 0.002`) absorbs anti-aliasing noise without hiding layout changes.
- Until baselines exist the job passes with a warning, so a new clone isn't red.

## Quality metrics

Each run on `main` records every test's outcome to a history file published alongside the Allure report
(`/metrics/history.json`), so no database or bot commits are needed. `scripts/quality-metrics.mjs` reports:

- **First-attempt pass rate** and **flaky rate** (a test that failed then passed on retry counts as flaky)
- Runs containing at least one flaky test
- Tests ranked by flakiness, with a **quarantine candidate** flag (5+ runs observed, 5%+ flaky)

The report appears in each Actions run summary. CI retries hide flakiness from the pass/fail result;
this is what keeps it visible.

## Finding worth noting

The reciprocal-rate API test needs a 1% tolerance. Rates are rounded to 4 decimals, so small rates lose
precision (INR→USD is 0.0120 for a true 0.01203, about 0.3% off). In a real pricing service the fix is
returning more decimals or using a decimal type, not widening the tolerance.

## CI

| Workflow | Jobs |
|---|---|
| `ci.yml` | component, api, e2e (2 shards), visual, merged Playwright report, Allure report + metrics, Pages deploy |
| `perf.yml` | k6 smoke (PR), k6 load (nightly), Lighthouse (PR) |
| `update-visual-baselines.yml` | manual: regenerate and commit visual baselines |

| Setup | Wall-clock time |
|---|---|
| Single job, no cache | _TBD_ |
| 2 shards + browser cache | _TBD_ |

## Credits

Inspired by the Apollo/React getting-started example in
[Ebazhanov/react-graphql-example](https://github.com/Ebazhanov/react-graphql-example).
