// Combines Allure results from every test suite into one root folder so a single
// report covers API + E2E. Plain Node so it works on Windows, macOS and Linux.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const out = 'allure-results';
rmSync(out, { recursive: true, force: true });
rmSync('allure-report', { recursive: true, force: true });
mkdirSync(out);

for (const suite of ['apps/web', 'tests/api', 'tests/e2e']) {
  const dir = join(suite, 'allure-results');
  if (existsSync(dir)) {
    cpSync(dir, out, { recursive: true });
    console.log(`merged ${dir}`);
  } else {
    console.log(`skipped ${dir} (run that suite first)`);
  }
}
