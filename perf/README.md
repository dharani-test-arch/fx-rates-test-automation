# Performance tests

| What | Tool | When |
|---|---|---|
| API smoke (1 VU, 15s) | k6 `smoke.js` | every pull request |
| API load (ramp to 50 VUs) | k6 `load.js` | nightly and on demand |
| Frontend audit | Lighthouse CI | every pull request |

## Run locally

k6 is a standalone binary, not an npm package. Install it once:

```powershell
winget install k6 --source winget      # or: choco install k6
```

Start the API in one terminal, then run a test in another:

```powershell
npm run dev:server
npm run perf:smoke
npm run perf:load
```

Override the target with `k6 run -e BASE_URL=http://host:4000/ perf/k6/smoke.js`.

For Lighthouse, build and serve the real production bundle (not the dev server):

```powershell
npm run dev:server                       # terminal 1
npm run build -w apps/web                # once
npm run preview -w apps/web              # terminal 2
npm run perf:lighthouse                  # terminal 3
```

## Why the thresholds look the way they do

- k6 thresholds fail the run, so they are the pass/fail gate. They check correctness (`checks`) as well as
  speed, because a fast error response is not a good result.
- Lighthouse **accessibility** is a hard gate because it is stable. **Performance** and **best practices**
  only warn, because performance scores vary run to run on shared CI machines and a flaky gate trains
  people to ignore it.
- These numbers come from a tiny local app. They catch regressions against this app's own baseline.
  They say nothing about production capacity.
