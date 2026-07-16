# Codex → Claude Round 13 Report

Date: 2026-07-15
Task: Paul's vague-patient rules gate
Status: BLOCKED on live server preflight

## Bottom line

I added the six requested vague-patient personas to `scripts/simulate-patients.ts` and verified the repo still passes local static/offline checks. I could not run the required live vague-persona x3 gate or the full 240-case API gate because the already-running dev server on port 3000 returns HTTP 500 for both `/triage` and `/api/triage`.

This is not a routing failure from the new personas. The Next dev log shows a Turbopack internal error while building app endpoints, caused by a timeout reading:

`node_modules/next/dist/lib/default-transpiled-packages.json`

Affected endpoints in the log include `/api/triage/route` and `/triage/page`.

## Changes made

Only one code file was changed:

- `scripts/simulate-patients.ts`

Added six Round 13 personas:

| Persona | Purpose | Expected | Accepts |
|---|---:|---:|---:|
| `vague-chest-catchall` | Terse chest complaint; left-arm symptom only appears during catch-all | ER | emergency |
| `vague-gi-terse` | Vague stomach pain without volunteered red flags | telehealth | primary care, urgent care |
| `vague-headache-terse` | Vague headache; denies neuro/meningitis red flags when asked | telehealth | primary care, urgent care |
| `vague-kid-fever-terse` | Vague pediatric fever; not infant, no danger signs | telehealth | primary care, urgent care, home care |
| `vague-back-pain-terse` | Vague back pain without trauma/infection/neuro red flags | home care | telehealth, primary care |
| `vague-tired-terse` | Terse fatigue; should not jump to ER without red flags | telehealth | primary care |

The chest persona specifically tests Paul's point that vague patients may only reveal important symptoms when asked an open catch-all question.

## Completed checks

| Check | Result | Notes |
|---|---:|---|
| Before-run checkpoint commit | PASS | Created `be55100 round 13: before vague-patient gate` |
| TypeScript | PASS | `tsc --noEmit` completed cleanly |
| Offline engine eval | PASS | 104 cases, 84 exact, 104 acceptable, 0 under-triage, 0 safety failures |
| Port 3000 landing page | PASS | `/landing-v2.html` returned HTTP 200 |
| Port 3000 triage page | FAIL | `/triage` returned HTTP 500 |
| Port 3000 triage API | FAIL | `/api/triage` returned HTTP 500 |

## Live gate status

Not run because the live app was unavailable. Required live checks still pending:

1. Vague personas x3 against port 3000.
2. Severity-scale audit across vague runs and fresh 240 gate.
3. Catch-all audit: count, answers, routing impact, and confirmation it never fires before ER/emergency preview.
4. Full 240 `api-multiturn` gate with output file containing `round13`.
5. Second-reader stats.
6. Token/cost usage for the live round.

## Server failure evidence

Observed HTTP responses from the existing port-3000 server:

- `GET /triage` → 500
- `POST /api/triage` → 500
- `GET /landing-v2.html` → 200

Relevant log summary from `.next/dev/logs/next-development.log`:

- `TurbopackInternalError: Failed to write app endpoint /api/triage/route`
- `TurbopackInternalError: Failed to write app endpoint /triage/page`
- Cause: operation timed out while reading `node_modules/next/dist/lib/default-transpiled-packages.json`

## Commands to rerun after the dev server is healthy

Use the already-running port 3000 server once it is restarted or fixed:

```bash
cd ~/Documents/Claude/Projects/Carevo/triage-web

TRIAL_KEY=carevo-trials-x7k2 npm run trials -- \
  --only=vague-chest-catchall,vague-gi-terse,vague-headache-terse,vague-kid-fever-terse,vague-back-pain-terse,vague-tired-terse \
  --repeat=3 \
  --inter-round-delay-ms=0 \
  --max-errors=0

TRIAL_KEY=carevo-trials-x7k2 node_modules/.bin/sucrase-node scripts/run-clinical-dataset.ts \
  --input=data/recursive-learning/synthetic-240-benchmark.jsonl \
  --mode=api-multiturn \
  --output=data/recursive-learning/synthetic-240-results-round13-vague-rules-2026-07-15.jsonl
```

Acceptance criteria remain unchanged:

- 240/240 scored
- 0 UNDER
- 0 provider errors
- no new severity-scale phrasing hits
- no accuracy drop from the round-12 baseline of 222/240 exact unless explainable and safe

## Notes

No `lib/` or `app/` files were changed. No emergency net, rules, extractor, phraser, calibration, or routing logic was edited.
