# Codex -> Claude Round 18 Report

Date: 2026-07-17
Task: Scoped fever-floor release gate, take 2
Status: PASS - release gate green. Push will be performed after this report commit.

## Bottom line

Round 18 passed the release criteria.

- TypeScript: PASS.
- Offline eval: PASS - 104/104 acceptable, 0 under-triage, 0 safety failures, P15 scoped fever safety present.
- Vague personas x3: PASS - 24/24 correct or acceptable, 0 UNDER, 0 errors.
- limited-english-fever: telehealth x3, exact x3.
- Full 240 API gate: PASS - 240/240 scored, 235 exact, 5 over, 0 UNDER, 0 provider errors.
- Exact accuracy: 97.9%, above the 95% release threshold.
- Safe-or-exact: 100%.
- Severity-word audit: PASS - 0 question hits and 0 factor-label hits.
- Fever-floor factor audit on 240: 0 hits. The broad round-17 fever floor false positives are gone.

## Files / outputs

- Vague gate log: data/trials/trials-2026-07-17T04-09-46.jsonl
- 240 gate output: data/recursive-learning/synthetic-240-results-round18-scoped-fever-2026-07-17.jsonl
- 240 gate summary: data/recursive-learning/synthetic-240-results-round18-scoped-fever-2026-07-17.summary.json
- Round 17 comparison baseline: data/recursive-learning/synthetic-240-results-round17-limited-english-fever-2026-07-16.jsonl

## Preflight

- Created before-run checkpoint commit: e24b39b round 18: before scoped fever release gate.
- Port 3000 was not running, so I started npm run dev from /Users/preethamprabhu/Developer/Carevo/triage-web.
- TypeScript passed: npx tsc --noEmit.
- Offline eval passed: npm run eval.

Offline eval highlights:

- 104 eval cases.
- 104 acceptable.
- 0 under-triage.
- 0 safety failures.
- P15 limited-English fever safety passed with scoped detector regressions.

## Vague personas x3

Command:

```bash
TRIAL_KEY=carevo-trials-x7k2 npm run trials --   --only=vague-chest-catchall,vague-gi-terse,vague-headache-terse,vague-kid-fever-terse,vague-back-pain-terse,vague-tired-terse,limited-english-fever,vague-chest-denial   --repeat=3   --inter-round-delay-ms=0   --max-errors=0
```

Summary:

| Metric | Result |
|---|---:|
| Trials | 24 |
| Correct/acceptable | 24 |
| UNDER | 0 |
| Over | 0 |
| Forbidden output | 0 |
| Errors | 0 |
| Average questions | 4.0 |

limited-english-fever results:

| Trial | Verdict | Care level | Relevant factor |
|---|---|---|---|
| facc9b73 | exact | telehealth | Symptoms are bothering you but manageable |
| 71b2429d | exact | telehealth | We could not confirm enough details to safely recommend home care... |
| 759e9eff | exact | telehealth | We could not confirm enough details to safely recommend home care... |

The original round-16 safety blocker remains fixed: limited-English fever no longer falls to home care.

## Full 240 gate

Command:

```bash
TRIAL_KEY=carevo-trials-x7k2 node_modules/.bin/sucrase-node scripts/run-clinical-dataset.ts   --input=data/recursive-learning/synthetic-240-benchmark.jsonl   --mode=api-multiturn   --output=data/recursive-learning/synthetic-240-results-round18-scoped-fever-2026-07-17.jsonl
```

Summary:

| Metric | Result |
|---|---:|
| Total | 240 |
| Scored | 240 |
| Exact | 235 |
| Over | 5 |
| UNDER | 0 |
| Provider errors | 0 |
| Exact accuracy | 97.9% |
| Safe-or-exact | 100% |

This passes the release condition: 0 UNDER, 0 provider errors, exact accuracy above 95%.

## Changed cases versus round 17

Round 17 was 222 exact / 18 over. Round 18 is 235 exact / 5 over. Net improvement: +13 exact.

The 14 round-17 false-positive flips mostly reverted. One new safe over-route appeared at case-0211.

| Case | Expected | Round 17 | Round 18 | Factor / note |
|---|---|---|---|---|
| case-0161 | urgent_care | over emergency | exact urgent_care | emergency detector bug fixed; back pain with new foot drop |
| case-0171 | urgent_care | over emergency | exact urgent_care | emergency detector bug fixed; back pain with new foot drop |
| case-0182 | home_care | over telehealth | exact home_care | fever-floor false positive reverted |
| case-0187 | home_care | over telehealth | exact home_care | fever-floor false positive reverted |
| case-0192 | home_care | over telehealth | exact home_care | fever-floor false positive reverted |
| case-0197 | home_care | over telehealth | exact home_care | fever-floor false positive reverted |
| case-0204 | home_care | over telehealth | exact home_care | fever-floor false positive reverted; Paul home guard still clean |
| case-0209 | home_care | over telehealth | exact home_care | fever-floor false positive reverted; Paul home guard still clean |
| case-0211 | home_care | exact home_care | over er | new safe over-route; factor: Red flag: Swelling of the face, lips, or throat |
| case-0214 | home_care | over telehealth | exact home_care | fever-floor false positive reverted; Paul home guard still clean |
| case-0219 | home_care | over telehealth | exact home_care | fever-floor false positive reverted; Paul home guard still clean |
| case-0225 | home_care | over telehealth | exact home_care | fever-floor false positive reverted |
| case-0230 | home_care | over telehealth | exact home_care | fever-floor false positive reverted |
| case-0235 | home_care | over telehealth | exact home_care | fever-floor false positive reverted |
| case-0240 | home_care | over telehealth | exact home_care | fever-floor false positive reverted |

Remaining non-exact cases:

| Case | Expected | Predicted | Verdict | Factor |
|---|---|---|---|---|
| case-0211 | home_care | er | over | Red flag: Swelling of the face, lips, or throat |
| case-0223 | home_care | telehealth | over | Symptoms are bothering you but manageable |
| case-0228 | home_care | telehealth | over | Symptoms are bothering you but manageable |
| case-0233 | home_care | telehealth | over | Symptoms are bothering you but manageable |
| case-0238 | home_care | telehealth | over | Symptoms are bothering you but manageable |

All non-exact cases are safe over-routes.

## Fever-floor factor audit

Scope: round 18 full 240 output.

Search terms: feeling hot or feverish, fever floor, could not confirm enough details.

Result: 0 hits in the 240 output.

This confirms the scoped fever floor no longer blanket-escalates clear benign benchmark cases.

## Severity-word audit

Scope: patient-facing questions and factor labels in the round 18 240 output plus the vague gate log.

Search terms: 1-10, 1 to 10, one to ten, rate your/the, mild, moderate, severe.

Result: 0 hits.

## Second-reader stats

Second-reader data was present on 184/240 cases.

| Metric | Result |
|---|---:|
| Agreements | 28 |
| Disagreements | 156 |
| Agreement rate | 15.2% |
| Second reader higher acuity | 154 |
| Second reader lower acuity | 2 |
| Missing second-reader field | 56 |

Higher-acuity examples: case-0041 (er to emergency), case-0042 (er to emergency), case-0043 (er to emergency), case-0046 (er to emergency), case-0047 (er to emergency), case-0048 (er to emergency), case-0051 (er to emergency), case-0052 (er to emergency), case-0053 (er to emergency), case-0056 (er to emergency).

Lower-acuity disagreements: case-0175 (er to urgent_care), case-0211 (er to urgent_care).

## Recommendation

Round 18 is green under the stated release rule.

- Safety is clean: 0 UNDER in both live gates.
- Precision is above threshold: 97.9% exact on the 240 benchmark.
- Audit is clean: 0 severity-word hits.
- Provider stability is clean: 0 provider errors.

Proceed with git push from main.

## Boundary confirmation

- No lib/ or app/ files were edited by Codex this round.
- No kill switch was applied.
- Push is allowed by the brief because all green conditions passed.
