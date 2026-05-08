# Post-merge fixes — review feedback round 1

The reviewer flagged three classes of issue after merging `feat/support-consolidation` into a local copy of `master`. None of them were merge conflicts — they were latent issues in the merged code/test setup. All three are fixed in this update.

## 1. Duplicate `executePythonScript` declaration

**File:** `services/aiExecutionService.js`

**Symptom:**
```
SyntaxError: Identifier 'executePythonScript' has already been declared
```

**Root cause:** the file had two function declarations: a stub mock at the top (lines 1–18, positional signature, hardcoded responses for "non-existent" and "hello-from-stdin") and the real implementation below it (object-signature, real Python child-process spawn). They were stitched together by an earlier merge — the stub was probably a temporary test fixture that should never have been committed.

**Fix:** removed the stub. The real implementation (with retry, circuit-breaker, JSON normalisation, monitoring hooks) is now the single canonical export. The corresponding test file `test/aiExecutionService.test.js` already targets the real signature, so this is the correct version to keep.

**Verification:**
```bash
node -e "console.log(Object.keys(require('./services/aiExecutionService')))"
# → [ 'DEFAULT_TIMEOUT_MS', 'DEFAULT_PYTHON_COMMAND', 'executePythonScript' ]
```

## 2. AggregateError in `foodData*`, `auth.test.js`, `be26_consolidation.test.js`, etc.

**Symptom:** Multiple test suites fail with `AggregateError` when run via `npm test`.

**Root cause:** these are **integration tests**, not unit tests. They use supertest against `http://localhost:80` (or `:3001`), expecting a live server. When `npm test` runs without a server up, every request fails — Node throws `AggregateError` because both the IPv4 and IPv6 connection attempts are refused.

This is not a regression from the support PR — these tests would fail in the same way on `master` if you run `npm test` without first running `npm run dev`. But the reviewer wants a clean test state, so we should keep them out of the default unit-test run.

**Fix:** updated `jest.config.js` to exclude the live-server tests from the default run. Added a new `npm run test:integration` script for when you want to run them against a live server.

The 14 affected files are listed explicitly in `jest.config.js` under `LIVE_SERVER_TESTS` so it's obvious what's being skipped and why. Setting `RUN_INTEGRATION=1` flips them back on.

**Verification:**
```bash
npm test                 # runs only unit tests, no live-server requirement
npm run dev              # in another shell
npm run test:integration # then runs the full set including live-server suite
```

## 3. Empty `security/test.js` suite

**Symptom:**
```
FAIL security/test.js — Your test suite must contain at least one test
```

**Root cause:** `security/test.js` is a CLI script (`if (require.main === module) testSecuritySystem()`), not a Jest test. Its filename matches Jest's default test glob, so Jest auto-discovers it and rejects it for having no `describe`/`test` blocks.

**Fix:** added `/security/` to `testPathIgnorePatterns` in `jest.config.js`. The script remains usable as a CLI tool (`node security/test.js`) but Jest no longer tries to run it.

## Net diff this round

```
modified:  services/aiExecutionService.js   (-18 lines, removed duplicate stub)
modified:  jest.config.js                   (+25 lines, ignore patterns + integration toggle)
modified:  package.json                     (+1 line,  test:integration script)
new:       POST_MERGE_FIXES.md              (this file)
```

## How to run after pulling

```bash
npm install
npm test
```

Expected: every remaining suite runs and passes (or the failure is a real test bug unrelated to the support PR — none should be `AggregateError` connection failures).

For the integration suite:

```bash
npm run dev               # in shell 1
npm run test:integration  # in shell 2
```
