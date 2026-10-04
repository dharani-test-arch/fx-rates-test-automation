// Load test: ramp up, hold, ramp down. Too slow for every PR, so it runs nightly or on demand.
// Thresholds are starting points based on a local run; tighten them from real baselines over time.
import { check, sleep } from 'k6';
import { pickCurrency, queryRates, ratesChecks } from './lib/graphql.js';

export const options = {
  stages: [
    { duration: '20s', target: 50 }, // ramp up
    { duration: '40s', target: 50 }, // hold
    { duration: '10s', target: 0 },  // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  check(queryRates(pickCurrency()), ratesChecks);
  sleep(0.5 + Math.random()); // think time between requests
}
