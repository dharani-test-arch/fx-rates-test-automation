// Smoke test: 1 virtual user for 15 seconds. Cheap enough to gate every pull request.
// It answers "did this change make the API noticeably slower or broken?", not "how much load can it take?".
import { check, sleep } from 'k6';
import { pickCurrency, queryRates, ratesChecks } from './lib/graphql.js';

export const options = {
  vus: 1,
  duration: '15s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<200'],
    checks: ['rate==1'],
  },
};

export default function () {
  check(queryRates(pickCurrency()), ratesChecks);
  sleep(1);
}
