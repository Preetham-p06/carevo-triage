# Codex -> Claude Round 16 Report

Date: 2026-07-16/17
Task: Paul batch 3 verification, target 95%+
Status: FAIL / DO NOT PUSH - 240-case precision target passed, but vague-persona absolute gate failed.

## Bottom line

Round 16 produced the precision improvement expected on the full 240-case benchmark, but it is not green because the vague gate produced 2 UNDER-triage results.

- TypeScript: PASS.
- Offline eval: PASS - 104/104 acceptable, 0 under-triage, 0 safety failures.
- Full 240 API gate: PASS - 240/240 scored, 236 exact, 4 over, 0 UNDER, 0 provider errors.
- Exact accuracy: 98.3% (above the 95% flag line and above the 235/240 target floor).
- Safe-or-exact: 100%.
- Vague personas x3: FAIL - 24 trials, 22 correct/acceptable, 2 UNDER, 0 errors.
- Severity-word audit: FAIL for factor labels - 0 question hits, but 7 factor hits from explicit-denial text containing severe pain / severe or deep eye pain.
- Vague personas triggered zero home-guard factors, as expected.
- No lib/ or app/ edits were made by Codex this round. No push was performed.

## Files / outputs

- 240 gate output: data/recursive-learning/synthetic-240-results-round16-paul-batch3-2026-07-16.jsonl
- 240 gate summary: data/recursive-learning/synthetic-240-results-round16-paul-batch3-2026-07-16.summary.json
- Vague gate log: data/trials/trials-2026-07-17T01-59-57.jsonl
- Prior baseline: data/recursive-learning/synthetic-240-results-round15-precision-restored-2026-07-16.jsonl

## Preflight

- Repo path used: /Users/preethamprabhu/Developer/Carevo/triage-web
- The old ~/Documents/Claude/Projects/Carevo/triage-web path is gone.
- Worktree was clean before testing; there was no pre-round change to commit.
- Port 3000 was not running, so I started npm run dev from the moved repo.
- TypeScript passed: npx tsc --noEmit.
- Offline eval passed: npm run eval.

## Full 240 gate

Command:

```bash
TRIAL_KEY=carevo-trials-x7k2 node_modules/.bin/sucrase-node scripts/run-clinical-dataset.ts   --input=data/recursive-learning/synthetic-240-benchmark.jsonl   --mode=api-multiturn   --output=data/recursive-learning/synthetic-240-results-round16-paul-batch3-2026-07-16.jsonl
```

| Metric | Result |
|---|---:|
| Total | 240 |
| Scored | 240 |
| Exact | 236 |
| Over | 4 |
| UNDER | 0 |
| Provider errors | 0 |
| Exact accuracy | 98.3% |
| Safe-or-exact | 100% |

This gate passed the brief target. It improved from round 15 by +14 exact cases: 222/240 -> 236/240.

## Round 15 -> Round 16 changes

Expected Paul batch flips were confirmed:

- Cluster A URI cases: 8 former urgent-care over-routes flipped to exact home care.
- Cluster B eczema/conjunctivitis cases: 8 former ER/telehealth over-routes flipped to exact home care.
- Cluster C corrected labels: case-0169 and case-0180 are now exact ER.

Changed cases versus round 15:

| Case | Round 15 | Round 16 | Note |
|---|---|---|---|
| case-0169 | over er | exact er | label corrected / engine right |
| case-0180 | over er | exact er | label corrected / engine right |
| case-0181 | over urgent_care | exact home_care | Cluster A fixed |
| case-0184 | over urgent_care | exact home_care | Cluster A fixed |
| case-0186 | over urgent_care | exact home_care | Cluster A fixed |
| case-0189 | over urgent_care | exact home_care | Cluster A fixed |
| case-0191 | over urgent_care | exact home_care | Cluster A fixed |
| case-0194 | over urgent_care | exact home_care | Cluster A fixed |
| case-0196 | over urgent_care | exact home_care | Cluster A fixed |
| case-0199 | over urgent_care | exact home_care | Cluster A fixed |
| case-0204 | over er | exact home_care | Cluster B fixed |
| case-0205 | over er | exact home_care | Cluster B fixed |
| case-0209 | over telehealth | exact home_care | Cluster B fixed |
| case-0210 | over er | exact home_care | Cluster B fixed |
| case-0214 | over telehealth | exact home_care | Cluster B fixed |
| case-0215 | over er | exact home_care | Cluster B fixed |
| case-0219 | over er | exact home_care | Cluster B fixed |
| case-0220 | over er | exact home_care | Cluster B fixed |
| case-0223 | exact home_care | over telehealth | new safe over-route |
| case-0228 | exact home_care | over telehealth | new safe over-route |
| case-0233 | exact home_care | over telehealth | new safe over-route |
| case-0238 | exact home_care | over telehealth | new safe over-route |

Remaining non-exact cases:

| Case | Expected | Predicted | Verdict |
|---|---|---|---|
| case-0223 | home_care | telehealth | over |
| case-0228 | home_care | telehealth | over |
| case-0233 | home_care | telehealth | over |
| case-0238 | home_care | telehealth | over |

These are safe over-routes and do not block the 240 gate.

## Home-guard factor audit

I found 20 cases with clinician-reviewed guidance factor wording. Of those, the explicit-denial guard text appeared on 7 cases:

- case-0204: dangers absent: fever, pus, red streaks, severe pain
- case-0205: dangers absent: vision change or loss, eye trauma, severe or deep eye pain
- case-0209: dangers absent: fever, pus, red streaks, severe pain
- case-0214: dangers absent: fever, pus, red streaks, severe pain
- case-0215: dangers absent: vision change or loss, eye trauma, severe or deep eye pain
- case-0219: dangers absent: fever, pus, red streaks, severe pain
- case-0220: dangers absent: vision change or loss, eye trauma, severe or deep eye pain

The remaining clinician-reviewed guidance hits did not carry explicit-denial text, so I treat them as broader calibration wording, not proof that the new downward home guards fired.

## Vague personas x3

Command:

```bash
TRIAL_KEY=carevo-trials-x7k2 npm run trials --   --only=vague-chest-catchall,vague-gi-terse,vague-headache-terse,vague-kid-fever-terse,vague-back-pain-terse,vague-tired-terse,limited-english-fever,vague-chest-denial   --repeat=3   --inter-round-delay-ms=0   --max-errors=0
```

| Metric | Result |
|---|---:|
| Trials | 24 |
| Correct/acceptable | 22 |
| UNDER | 2 |
| Over | 0 |
| Forbidden output | 0 |
| Errors | 0 |
| Average questions | 4.0 |

The harness process exited 0 and printed PASS, but the summary contains UNDER-triage: 2, so this must be treated as a failed gate because the brief required absolute 0 UNDER.

Under-triage details:

| Persona | Trials | Expected | Predicted | Pattern |
|---|---:|---|---|---|
| limited-english-fever | 2/3 | telehealth | home_care | reproducible in rounds 1 and 2 |

Transcript pattern for both failures:

- Q: Have you felt faint or confused at all? A: not know, feel hot
- Q: breathing difficulty at rest/sitting still? A: breath okay
- Q: walking/doing things? A: not know, feel hot
- Q: catch-all? A: no can eat good
- Final: home_care
- Factor: Symptoms are not stopping your daily activities
- Reasoning: head very hot two day ... safely managed at home

Interpretation: this is not a home-guard problem. Vague personas had 0 home-guard factor hits. The problem is the limited-English fever case can say feel hot and not know without the engine preserving a minimum telehealth floor for ambiguous fever/limited-information illness.

## Severity-word audit

Scope: patient-facing questions and factors in the round 16 240 output plus vague gate log.

Search terms: 1-10, 1 to 10, one to ten, rate your/the, mild, moderate, severe.

Results:

- Questions: 0 hits.
- Vague gate factors: 0 hits.
- 240 gate factors: 7 hits, all from explicit-denial danger text in home-guard factors: severe pain / severe or deep eye pain.

This means Pauls no-severity-question rule still holds for questions. The remaining audit issue is factor-label language inside the explicit-denial guard explanation.

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

Lower-acuity disagreements: case-0170 (er to urgent_care), case-0175 (er to urgent_care).

## Recommendation

Do not push this batch yet. The 240-case benchmark is strong enough for the CareRoute head-to-head, but the vague gate must be fixed first.

Suggested next fix target:

- Add or tighten a deterministic limited-information fever safeguard so ambiguous feel hot / head hot / hot two days plus inability to clarify does not fall to home_care.
- Keep it narrow so it does not undo the Paul batch 3 home-care precision gains.
- Re-run exactly the same round 16 gates afterward.

## Boundary confirmation

- No lib/ or app/ files were edited by Codex this round.
- No kill switch was applied.
- No production push was performed because the vague gate failed.
