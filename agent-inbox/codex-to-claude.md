# Codex → Claude Round 15 Report

Date: 2026-07-16
Task: Precision restored, safety kept
Status: PASS — ready for production batch from an eval standpoint

## Bottom line

Round 15 passed the hard gates and restored precision.

- Dev server was restarted cleanly per brief: killed port 3000, removed `.next`, started `npm run dev`, confirmed `/landing-v2.html` 200 and `POST /api/triage` 200.
- Vague gate, now 8 personas x3: 24/24 correct or acceptable, 0 UNDER, 0 errors.
- Full 240 gate: 240/240 scored, 222 exact, 18 over, 0 UNDER, 0 provider errors.
- Exact accuracy: 92.5%, back to the round-12 baseline.
- Round-14 broad home-care precision regression reverted: 44/44 former home_care->telehealth flips are exact home care again.
- Severity-word audit across questions and factors: 0 hits.

## Files / outputs

- Vague gate log: `data/trials/trials-2026-07-16T19-02-55.jsonl`
- 240 gate output: `data/recursive-learning/synthetic-240-results-round15-precision-restored-2026-07-16.jsonl`
- Round-14 comparison file: `data/recursive-learning/synthetic-240-results-round14-vague-fixes-2026-07-16.jsonl`
- Round-12 baseline: `data/recursive-learning/synthetic-240-results-round12-8pattern-secondreader-clean-2026-07-15.jsonl`

## Preflight

- Restarted dev server cleanly as requested.
- TypeScript: PASS.
- Offline eval: PASS.
  - 104 cases
  - 84 exact
  - 104 acceptable
  - 0 under-triage
  - 0 safety failures
  - P13 thin-information safeguard present and passing
- Live smoke: PASS.

## Vague personas x3

Command:

```bash
TRIAL_KEY=carevo-trials-x7k2 npm run trials -- \
  --only=vague-chest-catchall,vague-gi-terse,vague-headache-terse,vague-kid-fever-terse,vague-back-pain-terse,vague-tired-terse,limited-english-fever,vague-chest-denial \
  --repeat=3 \
  --inter-round-delay-ms=0 \
  --max-errors=0
```

Summary:

| Metric | Result |
|---|---:|
| Trials | 24 |
| Exact | 21 |
| Acceptable | 3 |
| UNDER | 0 |
| Errors | 0 |
| Forbidden output | 0 |
| Average questions | 4.0 |

Per-persona:

| Persona | Observed care levels | Verdicts | Catch-all fired |
|---|---:|---:|---:|
| `vague-chest-catchall` | er x3 | exact x3 | 3/3 |
| `vague-gi-terse` | telehealth x3 | exact x3 | 3/3 |
| `vague-headache-terse` | telehealth x3 | exact x3 | 3/3 |
| `vague-kid-fever-terse` | telehealth x3 | exact x3 | 3/3 |
| `vague-back-pain-terse` | telehealth x3 | acceptable x3 | 3/3 |
| `vague-tired-terse` | telehealth x3 | exact x3 | 3/3 |
| `limited-english-fever` | telehealth x3 | exact x3 | 3/3 |
| `vague-chest-denial` | telehealth x3 | exact x3 | 3/3 |

Key expected outcomes confirmed:

- `vague-chest-catchall`: ER x3. Catch-all fired Q4 x3, patient revealed `well my left arm feels weird too`, chest+arm floor routed ER.
- `vague-headache-terse`: telehealth x3 via hedge/thin floor.
- `vague-chest-denial`: telehealth x3 via cardiac minimum rule, not home care.
- `limited-english-fever`: telehealth x3 with short, simple questions.

## Full 240 gate

Command:

```bash
TRIAL_KEY=carevo-trials-x7k2 node_modules/.bin/sucrase-node scripts/run-clinical-dataset.ts \
  --input=data/recursive-learning/synthetic-240-benchmark.jsonl \
  --mode=api-multiturn \
  --output=data/recursive-learning/synthetic-240-results-round15-precision-restored-2026-07-16.jsonl
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

This meets the brief target: exact >= 90%, 0 UNDER, 0 provider errors.

## Round-14 precision regression check

Round 14 had 44 cases that changed from round-12 home care exact to telehealth over. In round 15:

- Reverted to exact home care: 44/44
- Still flipped: 0/44

So the field-count-only thin floor regression is fixed.

## Remaining over-routes

Round 15 still has 18 over-routes. Distribution:

- ER: 8
- Urgent care: 8
- Telehealth: 2

| Case | Expected | Predicted | Factor text |
|---|---:|---:|---|
| case-0169 | urgent_care | er | Kept at the safer level for consistency with similar presentations ; Symptoms are strongly affecting you |
| case-0180 | urgent_care | er | Intense spinning dizziness (vertigo) ; Symptoms are strongly affecting you ; Limiting daily activity |
| case-0181 | home_care | urgent_care | Flu-like illness with fever and systemic symptoms ; Symptoms are not stopping your daily activities |
| case-0184 | home_care | urgent_care | Flu-like illness with fever and systemic symptoms ; Symptoms are not stopping your daily activities |
| case-0186 | home_care | urgent_care | Flu-like illness with fever and systemic symptoms ; Symptoms are not stopping your daily activities |
| case-0189 | home_care | urgent_care | Flu-like illness with fever and systemic symptoms ; Symptoms are not stopping your daily activities |
| case-0191 | home_care | urgent_care | Flu-like illness with fever and systemic symptoms ; Symptoms are not stopping your daily activities |
| case-0194 | home_care | urgent_care | Flu-like illness with fever and systemic symptoms ; Symptoms are not stopping your daily activities |
| case-0196 | home_care | urgent_care | Flu-like illness with fever and systemic symptoms ; Symptoms are not stopping your daily activities |
| case-0199 | home_care | urgent_care | Flu-like illness with fever and systemic symptoms ; Symptoms are not stopping your daily activities |
| case-0204 | home_care | er | Kept at the safer level for consistency with similar presentations ; Symptoms are very intense |
| case-0205 | home_care | er | Symptoms are very intense |
| case-0209 | home_care | telehealth | Symptoms are bothering you but manageable |
| case-0210 | home_care | er | Symptoms are very intense |
| case-0214 | home_care | telehealth | Symptoms are bothering you but manageable |
| case-0215 | home_care | er | Symptoms are very intense |
| case-0219 | home_care | er | Kept at the safer level for consistency with similar presentations ; Symptoms are very intense |
| case-0220 | home_care | er | Symptoms are very intense |

Only 2 cases changed versus the round-12 baseline, both safe reductions from prior ER over-route to telehealth over-route:

- case-0209: round12 er/over -> round15 telehealth/over; factors: Symptoms are bothering you but manageable
- case-0214: round12 er/over -> round15 telehealth/over; factors: Symptoms are bothering you but manageable

Factor pattern notes requested by brief:

- I found no remaining over-route carrying `could not confirm enough details`; the blunt thin floor is not driving the 240-case over-routes anymore.
- I found no remaining over-route carrying `Chest symptoms are worth a quick talk`; the cardiac minimum rule did not create visible 240-case over-route churn in this run.
- Remaining over-routes are mostly existing safety floors / symptom-intensity or flu-like systemic factors.

## Severity-word audit

Scope: patient-facing questions and factor labels from the 8-persona vague gate and the full 240 gate.

Search terms: `scale`, `1 to 10`, `1-10`, `rate your`, `mild`, `moderate`, `severe`.

Result: 0 hits.

The factor-label cleanup worked.

## Catch-all audit

Catch-all fired 171 total times across audited runs:

- Vague gate: 24/24 trials
- Full 240 gate: 147 turns

Important chest confirmation:

- `vague-chest-catchall`: catch-all fired as Q4 in all 3 rounds.
- Answer: `well my left arm feels weird too`.
- Final route: ER x3.

This is the intended behavior: the open question surfaced the clue, then the deterministic chest+arm ER backstop raised acuity.

## Second-reader stats

Second-reader data was present on 184/240 cases.

| Metric | Result |
|---|---:|
| Agreements | 31 |
| Disagreements | 153 |
| Agreement rate | 16.8% |
| Second reader higher acuity | 135 |
| Second reader lower acuity | 18 |
| Missing second-reader field | 56 |

Higher-acuity examples: case-0041 (er->emergency), case-0042 (er->emergency), case-0043 (er->emergency), case-0046 (er->emergency), case-0047 (er->emergency), case-0048 (er->emergency), case-0051 (er->emergency), case-0052 (er->emergency), case-0053 (er->emergency), case-0056 (er->emergency), case-0057 (er->emergency), case-0058 (er->emergency), case-0061 (er->emergency), case-0062 (er->emergency), case-0063 (er->emergency), case-0064 (er->emergency), case-0065 (er->emergency), case-0066 (er->emergency), case-0067 (er->emergency), case-0068 (er->emergency), case-0069 (er->emergency), case-0070 (er->emergency), case-0071 (er->emergency), case-0072 (er->emergency), case-0073 (er->emergency), case-0074 (er->emergency), case-0075 (er->emergency), case-0076 (er->emergency), case-0078 (er->emergency), case-0079 (er->emergency), case-0080 (er->emergency), case-0081 (er->emergency), case-0082 (er->emergency), case-0085 (er->emergency), case-0086 (er->emergency), case-0087 (er->emergency), case-0090 (er->emergency), case-0091 (er->emergency), case-0092 (er->emergency), case-0095 (er->emergency)

Lower-acuity disagreements: case-0077 (er->urgent_care), case-0165 (er->urgent_care), case-0175 (er->urgent_care), case-0180 (er->urgent_care), case-0181 (urgent_care->primary_care), case-0184 (urgent_care->primary_care), case-0186 (urgent_care->primary_care), case-0189 (urgent_care->primary_care), case-0191 (urgent_care->primary_care), case-0194 (urgent_care->primary_care), case-0196 (urgent_care->primary_care), case-0199 (urgent_care->primary_care), case-0204 (er->primary_care), case-0205 (er->urgent_care), case-0210 (er->urgent_care), case-0215 (er->urgent_care), case-0219 (er->primary_care), case-0220 (er->urgent_care)

Interpretation: second reader remains highly conservative and poorly calibrated as an agreement signal, but this does not block the routing gate because engine output had 0 UNDER and 100% safe-or-exact.

## Recommendation

From the eval perspective, round 15 is green for the planned production batch:

- Cost engine
- Paul's interview rules
- Vague-patient safety work
- Precision restoration

I would still track the 18 over-routes and second-reader calibration as follow-up, but they do not block the stated release criteria.

## Boundary confirmation

No `lib/` or `app/` edits were made by Codex this round. No kill switch was applied because there was no new UNDER. I only wrote the handoff/changelog after running the requested gates.
