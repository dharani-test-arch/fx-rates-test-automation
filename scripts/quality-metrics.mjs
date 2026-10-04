#!/usr/bin/env node
/**
 * Quality metrics from Allure results.
 *
 *   node scripts/quality-metrics.mjs record <results-dir> --history <file> [--run-id X] [--sha X] [--branch X]
 *   node scripts/quality-metrics.mjs report --history <file> [--out report.md]
 *
 * `record` reads every *-result.json in a results folder, works out each test's outcome
 * (passed / failed / flaky), and appends one compact record to a history file.
 * `report` turns that history into markdown: first-attempt pass rate, flaky rate,
 * and the tests that are flaking most.
 *
 * Flaky = at least one failed/broken attempt, but the final attempt passed.
 * Allure writes one result file per attempt, all sharing the same historyId.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const MAX_RUNS = 100;
const BAD = new Set(['failed', 'broken']);
const QUARANTINE_MIN_RUNS = 5;
const QUARANTINE_FLAKY_RATE = 0.05;

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const positional = [];
  const flags = {};
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith('--')) flags[rest[i].slice(2)] = rest[++i];
    else positional.push(rest[i]);
  }
  return { command, positional, flags };
}

function loadHistory(path) {
  if (!path || !existsSync(path)) return { runs: [], names: {} };
  try {
    const h = JSON.parse(readFileSync(path, 'utf8'));
    return { runs: Array.isArray(h.runs) ? h.runs : [], names: h.names ?? {} };
  } catch {
    console.error(`warning: could not parse ${path}, starting a new history`);
    return { runs: [], names: {} };
  }
}

function saveHistory(path, history) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(history));
}

/** Group Allure result files by test (historyId); each group is that test's attempts. */
function readAttempts(dir) {
  const byTest = new Map();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('-result.json')) continue;
    let result;
    try {
      result = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    } catch {
      continue;
    }
    if (!result.historyId || !result.status) continue;
    const attempts = byTest.get(result.historyId) ?? [];
    attempts.push({
      status: result.status,
      stop: result.stop ?? result.start ?? 0,
      name: result.fullName ?? result.name ?? result.historyId,
    });
    byTest.set(result.historyId, attempts);
  }
  return byTest;
}

/** 'p' passed first time, 'x' flaky (failed then passed), 'f' failed, 's' skipped, null = ignore. */
function classify(attempts) {
  const ordered = [...attempts].sort((a, b) => a.stop - b.stop);
  const final = ordered.at(-1).status;
  const hadFailure = ordered.some((a) => BAD.has(a.status));
  if (final === 'skipped') return 's';
  if (final === 'passed') return hadFailure ? 'x' : 'p';
  if (BAD.has(final)) return 'f';
  return null;
}

function record(dir, flags) {
  if (!dir || !existsSync(dir)) {
    console.error(`results folder not found: ${dir}`);
    process.exit(1);
  }
  const historyPath = flags.history ?? 'metrics/history.json';
  const history = loadHistory(historyPath);

  const tests = {};
  const counts = { p: 0, x: 0, f: 0, s: 0 };
  for (const [id, attempts] of readAttempts(dir)) {
    const outcome = classify(attempts);
    if (!outcome) continue;
    tests[id] = outcome;
    counts[outcome]++;
    if (outcome !== 'p') history.names[id] = attempts.at(-1).name;
  }

  const env = process.env;
  const runId =
    flags['run-id'] ??
    (env.GITHUB_RUN_ID ? `${env.GITHUB_RUN_ID}.${env.GITHUB_RUN_ATTEMPT ?? 1}` : `local-${Date.now()}`);

  const run = {
    runId,
    sha: (flags.sha ?? env.GITHUB_SHA ?? '').slice(0, 7),
    branch: flags.branch ?? env.GITHUB_REF_NAME ?? '',
    date: new Date().toISOString(),
    total: counts.p + counts.x + counts.f,
    passed: counts.p,
    flaky: counts.x,
    failed: counts.f,
    skipped: counts.s,
    tests,
  };

  history.runs = [...history.runs.filter((r) => r.runId !== runId), run].slice(-MAX_RUNS);
  saveHistory(historyPath, history);
  console.log(
    `recorded run ${runId}: ${run.total} tests, ${run.passed} passed first time, ${run.flaky} flaky, ${run.failed} failed`,
  );
}

const pct = (n, d) => (d === 0 ? '0.0%' : `${((n / d) * 100).toFixed(1)}%`);
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\s+/g, ' ').slice(0, 90);

function report(flags) {
  const { runs, names } = loadHistory(flags.history ?? 'metrics/history.json');
  const lines = ['## Quality metrics', ''];

  if (runs.length === 0) {
    lines.push('No history recorded yet. Metrics appear after the first run on `main`.');
  } else {
    const sum = (key) => runs.reduce((acc, r) => acc + r[key], 0);
    const executions = sum('total');
    const flakyRuns = runs.filter((r) => r.flaky > 0).length;
    const last = runs.at(-1);

    lines.push(
      `Based on the last **${runs.length}** recorded run(s).`,
      '',
      '| Metric | Value |',
      '|---|---|',
      `| First-attempt pass rate | ${pct(sum('passed'), executions)} |`,
      `| Flaky rate (flaky outcomes / all outcomes) | ${pct(sum('flaky'), executions)} |`,
      `| Runs containing at least one flaky test | ${flakyRuns} of ${runs.length} (${pct(flakyRuns, runs.length)}) |`,
      `| Runs with a real failure | ${runs.filter((r) => r.failed > 0).length} of ${runs.length} |`,
      `| Latest run | ${last.total} tests, ${last.flaky} flaky, ${last.failed} failed (${last.sha || last.runId}) |`,
      '',
    );

    // Per-test view
    const stats = new Map();
    for (const run of runs) {
      for (const [id, outcome] of Object.entries(run.tests)) {
        const s = stats.get(id) ?? { seen: 0, flaky: 0, failed: 0 };
        s.seen++;
        if (outcome === 'x') s.flaky++;
        if (outcome === 'f') s.failed++;
        stats.set(id, s);
      }
    }
    const unstable = [...stats.entries()]
      .filter(([, s]) => s.flaky > 0 || s.failed > 0)
      .sort((a, b) => b[1].flaky - a[1].flaky || b[1].failed - a[1].failed)
      .slice(0, 15);

    if (unstable.length === 0) {
      lines.push('### Unstable tests', '', 'None. Every test passed on its first attempt in every recorded run.', '');
    } else {
      lines.push(
        '### Unstable tests',
        '',
        '| Test | Runs | Flaky | Failed | Flaky rate | Action |',
        '|---|---|---|---|---|---|',
      );
      for (const [id, s] of unstable) {
        const rate = s.flaky / s.seen;
        const action =
          s.seen >= QUARANTINE_MIN_RUNS && rate >= QUARANTINE_FLAKY_RATE ? 'quarantine candidate' : '';
        lines.push(`| ${cell(names[id] ?? id)} | ${s.seen} | ${s.flaky} | ${s.failed} | ${pct(s.flaky, s.seen)} | ${action} |`);
      }
      lines.push('');
    }

    lines.push('### Recent runs', '', '| Run | Date | Tests | Flaky | Failed |', '|---|---|---|---|---|');
    for (const r of runs.slice(-10).reverse()) {
      lines.push(`| ${r.sha || r.runId} | ${r.date.slice(0, 10)} | ${r.total} | ${r.flaky} | ${r.failed} |`);
    }
  }

  const markdown = lines.join('\n') + '\n';
  if (flags.out) writeFileSync(flags.out, markdown);
  process.stdout.write(markdown);
}

const { command, positional, flags } = parseArgs(process.argv.slice(2));
if (command === 'record') record(positional[0], flags);
else if (command === 'report') report(flags);
else {
  console.error('usage: quality-metrics.mjs record <results-dir> --history <file> | report --history <file>');
  process.exit(1);
}
