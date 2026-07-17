# Codex -> Claude Round 17 Report

Date: 2026-07-16/17
Task: Limited-English fever fix, final gate before push
Status: FAIL / DO NOT PUSH - vague gate passed and audit is clean, but full 240 exact accuracy fell below the 95% release threshold.

## Bottom line

Round 17 fixed the round-16 safety blocker, but it did not pass the release gate.

- TypeScript: PASS.
- Offline eval: PASS - 104/104 acceptable, 0 under-triage, 0 safety failures, P15 limited-English fever safety present.
- Vague personas x3: PASS - 24/24 correct or acceptable, 0 UNDER, 0 errors.
- limited-english-fever: telehealth x3, exact x3.
- Severity-word audit: PASS - 0 question hits and 0 factor-label hits.
- Full 240 API gate: FAIL by precision threshold - 240/240 scored, 222 exact, 18 over, 0 UNDER, 0 provider errors.
- Exact accuracy: 92.5%, below the 95% release threshold.
- Safe-or-exact: 100%.
- No production push was performed.

## Files / outputs

- Vague gate log: data/trials/trials-2026-07-17T02-59-49.jsonl
- 240 gate output: data/recursive-learning/synthetic-240-results-round17-limited-english-fever-2026-07-16.jsonl
- 240 gate summary: data/recursive-learning/synthetic-240-results-round17-limited-english-fever-2026-07-16.summary.json
- Round 16 comparison baseline: data/recursive-learning/synthetic-240-results-round16-paul-batch3-2026-07-16.jsonl

## Preflight

- Created before-run checkpoint commit: 39294e1 round 17: before release gate.
- Port 3000 was not running, so I started npm run dev from /Users/preethamprabhu/Developer/Carevo/triage-web.
- TypeScript passed: npx tsc --noEmit.
- Offline eval passed: npm run eval.

Offline eval highlights:

- 104 eval cases.
- 104 acceptable.
- 0 under-triage.
- 0 safety failures.
- P15 limited-English fever safety passed.

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
| 9be03fb9 | exact | telehealth | We could not confirm enough details to safely recommend home care... |
| 54682f6d | exact | telehealth | Symptoms are bothering you but manageable |
| 99d51d87 | exact | telehealth | We could not confirm enough details to safely recommend home care... |

The round-16 blocker is fixed: limited-English fever no longer falls to home care.

## Full 240 gate

Command:

```bash
TRIAL_KEY=carevo-trials-x7k2 node_modules/.bin/sucrase-node scripts/run-clinical-dataset.ts   --input=data/recursive-learning/synthetic-240-benchmark.jsonl   --mode=api-multiturn   --output=data/recursive-learning/synthetic-240-results-round17-limited-english-fever-2026-07-16.jsonl
```

Summary:

| Metric | Result |
|---|---:|
| Total | 240 |
| Scored | 240 |
| Exact | 222 |
| Over | 18 |
| UNDER | 0 |
| Provider errors | 0 |
| Exact accuracy | 92.5% |
| Safe-or-exact | 100% |

This fails the brief release condition because exact accuracy is below 95%.

## Changed cases versus round 16

Round 16 was 236 exact / 4 over. Round 17 is 222 exact / 18 over. The 14 added over-routes are safe, but they push exact below threshold.

| Case | Expected | Round 16 | Round 17 | Factor / note |
|---|---|---|---|---|
| case-0161 | urgent_care | exact urgent_care | over emergency | emergency hard stop; low back pain with new foot drop |
| case-0171 | urgent_care | exact urgent_care | over emergency | emergency hard stop; low back pain with new foot drop |
| case-0182 | home_care | exact home_care | over telehealth | fever floor: You mentioned feeling hot or feverish... |
| case-0187 | home_care | exact home_care | over telehealth | fever floor: You mentioned feeling hot or feverish... |
| case-0192 | home_care | exact home_care | over telehealth | fever floor: You mentioned feeling hot or feverish... |
| case-0197 | home_care | exact home_care | over telehealth | fever floor: You mentioned feeling hot or feverish... |
| case-0204 | home_care | exact home_care | over telehealth | fever floor plus Paul home guard |
| case-0209 | home_care | exact home_care | over telehealth | fever floor plus Paul home guard |
| case-0214 | home_care | exact home_care | over telehealth | fever floor plus Paul home guard |
| case-0219 | home_care | exact home_care | over telehealth | fever floor plus Paul home guard |
| case-0225 | home_care | exact home_care | over telehealth | fever floor: You mentioned feeling hot or feverish... |
| case-0230 | home_care | exact home_care | over telehealth | fever floor: You mentioned feeling hot or feverish... |
| case-0235 | home_care | exact home_care | over telehealth | fever floor: You mentioned feeling hot or feverish... |
| case-0240 | home_care | exact home_care | over telehealth | fever floor: You mentioned feeling hot or feverish... |

Existing round-16 over-routes still present:

- case-0223 home_care -> telehealth
- case-0228 home_care -> telehealth
- case-0233 home_care -> telehealth
- case-0238 home_care -> telehealth

## Severity-word audit

Scope: patient-facing questions and factor labels in the round 17 240 output plus the vague gate log.

Search terms: 1-10, 1 to 10, one to ten, rate your/the, mild, moderate, severe.

Result: 0 hits.

This confirms the factor-label cleanup worked.

## Second-reader stats

Second-reader data was present on 182/240 cases.

| Metric | Result |
|---|---:|
| Agreements | 29 |
| Disagreements | 153 |
| Agreement rate | 15.9% |
| Second reader higher acuity | 150 |
| Second reader lower acuity | 3 |
| Missing second-reader field | 58 |

Higher-acuity examples: case-0041 (er to emergency), case-0042 (er to emergency), case-0043 (er to emergency), case-0046 (er to emergency), case-0047 (er to emergency), case-0048 (er to emergency), case-0051 (er to emergency), case-0052 (er to emergency), case-0053 (er to emergency), case-0056 (er to emergency).

Lower-acuity disagreements: case-0165 (er to urgent_care), case-0175 (er to urgent_care), case-0180 (er to urgent_care).

## Recommendation

Do not push yet.

The safety blocker is fixed, but the fever-language floor is too broad for the release target. It appears to catch benign home-care benchmark cases where feverish/hot language is present but already appropriately bounded. The next fix should keep limited-English ambiguous fever from going home care while narrowing the floor so clearly benign, well-specified home-care cases do not all become telehealth.

Suggested next target:

- Make the fever-language telehealth floor conditional on ambiguity/thin info, limited-English hedges, missing key clarifications, or non-benign fever context.
- Avoid applying it to Paul-approved home-care cases that explicitly deny dangers and have a benign URI/skin/GI pattern.
- Re-run the same round 17 gates afterward.

## Boundary confirmation

- No lib/ or app/ files were edited by Codex this round.
- No kill switch was applied.
- No production push was performed because exact accuracy was 92.5%, below the 95% release condition.
