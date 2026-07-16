# Codex → Claude Round 14 Report

Date: 2026-07-16
Task: Vague-gate fixes verification
Status: SAFETY PASS, but exact accuracy + factor-wording regressions to review

## Bottom line

Round 14 fixed the dangerous round-13 vague-patient failures. The six vague personas passed 18/18 with 0 UNDER and 0 errors. The full 240-case live gate also passed the absolute safety bar: 240/240 scored, 0 UNDER, 0 provider errors, 100% safe-or-exact.

However, the thin-information floor caused a large exactness drop in sparse home-care cases: exact fell from the round-12 baseline of 222/240 (92.5%) to 178/240 (74.2%). This is safe over-triage, not under-triage, but it is a cost/user-friction regression.

Also, the expanded severity-word audit found 5 factor-label hits in the 240 gate. Questions were clean, but factor labels still include severity words in a few red-flag descriptions.

## Files / outputs

- Vague gate log: `data/trials/trials-2026-07-16T15-11-28.jsonl`
- Frontier persona log: `data/trials/trials-2026-07-16T15-17-48.jsonl`
- 240 gate output: `data/recursive-learning/synthetic-240-results-round14-vague-fixes-2026-07-16.jsonl`
- Baseline compared: `data/recursive-learning/synthetic-240-results-round12-8pattern-secondreader-clean-2026-07-15.jsonl`

## Preflight

- TypeScript: PASS
- Offline eval: PASS
  - 104 cases
  - 84 exact
  - 104 acceptable
  - 0 under-triage
  - 0 safety failures
  - P13 thin-information safeguard present and passing
- Live API smoke: PASS, `POST /api/triage` returned HTTP 200 with the correct trial request shape

## Vague-persona gate

Command:

```bash
TRIAL_KEY=carevo-trials-x7k2 npm run trials -- \
  --only=vague-chest-catchall,vague-gi-terse,vague-headache-terse,vague-kid-fever-terse,vague-back-pain-terse,vague-tired-terse \
  --repeat=3 \
  --inter-round-delay-ms=0 \
  --max-errors=0
```

Summary:

| Metric | Result |
|---|---:|
| Trials | 18 |
| Exact | 14 |
| Acceptable | 4 |
| UNDER | 0 |
| Errors | 0 |
| Forbidden output | 0 |
| Average questions | 4.0 |

Per-persona:

| Persona | Expected | Observed | Verdicts |
|---|---:|---:|---:|
| `vague-chest-catchall` | ER | ER x3 | exact x3 |
| `vague-gi-terse` | telehealth | telehealth x3 | exact x3 |
| `vague-headache-terse` | telehealth | telehealth x3 | exact x3 |
| `vague-kid-fever-terse` | telehealth | telehealth x3 | exact x3 |
| `vague-back-pain-terse` | home care | telehealth x3 | acceptable x3 |
| `vague-tired-terse` | telehealth | telehealth x2, primary care x1 | exact x2, acceptable x1 |

## Catch-all audit

Catch-all fired 18/18 times in the vague gate.

Most important confirmation: `vague-chest-catchall` fired catch-all as question 4 in all three rounds. The patient answered `well my left arm feels weird too`, and final routing became ER all three times. That is the intended design: the case was not already ER before the answer; the catch-all answer caused the escalation.

Catch-all also fired in both report-only frontier personas and 146 times in the 240 gate, for 166 total catch-all turns across the audited runs.

No final ER/emergency case had catch-all except the intended chest escalation after the catch-all answer revealed arm symptoms. The transcript format does not expose the internal pre-catch-all preview, but observed behavior matches the design: catch-all did not delay a known ER/emergency route; it surfaced the ER clue.

## Severity-scale / factor-word audit

Scope: patient-facing questions and factor labels from vague gate, two frontier personas, and full 240 gate.

Search terms: `scale`, `1 to 10`, `1-10`, `rate your`, `mild`, `moderate`, `severe`.

Questions: 0 hits.

Factor labels: 5 hits.

- case-0145 factor: `Red flag: severe dehydration`
- case-0150 factor: `Red flag: severe dehydration`
- case-0155 factor: `Red flag: severe dehydration`
- case-0160 factor: `Red flag: severe dehydration`
- case-0180 factor: `Severe spinning vertigo`

So the phraser/question fix worked, but factor labels still need a plain-language cleanup for those red-flag names.

## Full 240 gate

Summary:

| Metric | Result |
|---|---:|
| Total | 240 |
| Scored | 240 |
| Exact | 178 |
| Over | 62 |
| UNDER | 0 |
| Provider errors | 0 |
| Exact accuracy | 74.2% |
| Safe-or-exact | 100% |

Compared with round 12 baseline: exact dropped from 222/240 (92.5%) to 178/240 (74.2%), a drop of 44 exact cases. All losses were safe over-routes.

Over-route distribution in round 14:

- ER: 7 cases (case-0169, case-0180, case-0205, case-0210, case-0215, case-0219, case-0220)
- Urgent care: 10 cases (case-0181, case-0184, case-0186, case-0189, case-0191, case-0194, case-0196, case-0199, case-0204, case-0209)
- Telehealth: 45 cases (case-0182, case-0183, case-0185, case-0187, case-0188, case-0190, case-0192, case-0193, case-0195, case-0197, case-0198, case-0200, case-0201, case-0202, case-0203, case-0206, case-0207, case-0208, case-0211, case-0212, case-0213, case-0214, case-0216, case-0217, case-0218, case-0221, case-0222, case-0223, case-0224, case-0225, case-0226, case-0227, case-0228, case-0229, case-0230, case-0231, case-0232, case-0233, case-0234, case-0235, case-0236, case-0237, case-0238, case-0239, case-0240)

## Changed cases vs round 12

Changed cases: 47.

- home_care/exact -> telehealth/over: 44 cases — case-0182, case-0183, case-0185, case-0187, case-0188, case-0190, case-0192, case-0193, case-0195, case-0197, case-0198, case-0200, case-0201, case-0202, case-0203, case-0206, case-0207, case-0208, case-0211, case-0212, case-0213, case-0216, case-0217, case-0218, case-0221, case-0222, case-0223, case-0224, case-0225, case-0226, case-0227, case-0228, case-0229, case-0230, case-0231, case-0232, case-0233, case-0234, case-0235, case-0236, case-0237, case-0238, case-0239, case-0240
- er/over -> urgent_care/over: 2 cases — case-0204, case-0209
- er/over -> telehealth/over: 1 cases — case-0214

The main pattern is exactly what the brief warned about: sparse home-care vignettes now floor to telehealth. That is safe, but it accounts for most of the exactness drop.

## Second-reader stats

Second-reader data was present on 184/240 cases.

| Metric | Result |
|---|---:|
| Agreements | 29 |
| Disagreements | 155 |
| Agreement rate | 15.8% |
| Second reader higher acuity | 134 |
| Second reader lower acuity | 21 |
| Missing second-reader field | 56 |

Higher-acuity case IDs:

- case-0041 (er->emergency)
- case-0042 (er->emergency)
- case-0043 (er->emergency)
- case-0046 (er->emergency)
- case-0047 (er->emergency)
- case-0048 (er->emergency)
- case-0051 (er->emergency)
- case-0052 (er->emergency)
- case-0053 (er->emergency)
- case-0056 (er->emergency)
- case-0057 (er->emergency)
- case-0058 (er->emergency)
- case-0061 (er->emergency)
- case-0062 (er->emergency)
- case-0063 (er->emergency)
- case-0064 (er->emergency)
- case-0065 (er->emergency)
- case-0066 (er->emergency)
- case-0067 (er->emergency)
- case-0068 (er->emergency)
- case-0069 (er->emergency)
- case-0070 (er->emergency)
- case-0071 (er->emergency)
- case-0072 (er->emergency)
- case-0073 (er->emergency)
- case-0074 (er->emergency)
- case-0075 (er->emergency)
- case-0076 (er->emergency)
- case-0078 (er->emergency)
- case-0079 (er->emergency)
- case-0080 (er->emergency)
- case-0081 (er->emergency)
- case-0082 (er->emergency)
- case-0085 (er->emergency)
- case-0086 (er->emergency)
- case-0087 (er->emergency)
- case-0090 (er->emergency)
- case-0091 (er->emergency)
- case-0092 (er->emergency)
- case-0095 (er->emergency)
- case-0096 (er->emergency)
- case-0097 (er->emergency)
- case-0100 (er->emergency)
- case-0101 (urgent_care->emergency)
- case-0102 (urgent_care->emergency)
- case-0103 (urgent_care->emergency)
- case-0106 (urgent_care->emergency)
- case-0107 (urgent_care->emergency)
- case-0108 (urgent_care->emergency)
- case-0112 (urgent_care->emergency)
- case-0113 (urgent_care->emergency)
- case-0117 (urgent_care->emergency)
- case-0118 (urgent_care->emergency)
- case-0121 (urgent_care->emergency)
- case-0122 (urgent_care->emergency)
- case-0123 (urgent_care->emergency)
- case-0125 (urgent_care->emergency)
- case-0126 (urgent_care->emergency)
- case-0127 (urgent_care->emergency)
- case-0128 (urgent_care->emergency)
- case-0130 (urgent_care->emergency)
- case-0131 (urgent_care->emergency)
- case-0132 (urgent_care->emergency)
- case-0133 (urgent_care->emergency)
- case-0135 (urgent_care->emergency)
- case-0136 (urgent_care->emergency)
- case-0137 (urgent_care->emergency)
- case-0138 (urgent_care->emergency)
- case-0140 (urgent_care->emergency)
- case-0141 (urgent_care->emergency)
- case-0142 (urgent_care->emergency)
- case-0146 (urgent_care->emergency)
- case-0147 (urgent_care->emergency)
- case-0151 (urgent_care->emergency)
- case-0152 (urgent_care->emergency)
- case-0156 (urgent_care->emergency)
- case-0157 (urgent_care->emergency)
- case-0161 (urgent_care->emergency)
- case-0163 (urgent_care->emergency)
- case-0164 (er->emergency)
- case-0166 (urgent_care->emergency)
- case-0168 (urgent_care->emergency)
- case-0169 (er->emergency)
- case-0171 (urgent_care->emergency)
- case-0173 (urgent_care->emergency)
- case-0174 (er->emergency)
- case-0176 (urgent_care->emergency)
- case-0178 (urgent_care->emergency)
- case-0179 (er->emergency)
- case-0182 (telehealth->primary_care)
- case-0183 (telehealth->primary_care)
- case-0185 (telehealth->primary_care)
- case-0187 (telehealth->primary_care)
- case-0188 (telehealth->primary_care)
- case-0190 (telehealth->primary_care)
- case-0192 (telehealth->primary_care)
- case-0193 (telehealth->primary_care)
- case-0195 (telehealth->primary_care)
- case-0197 (telehealth->primary_care)
- case-0198 (telehealth->primary_care)
- case-0200 (telehealth->primary_care)
- case-0201 (telehealth->urgent_care)
- case-0202 (telehealth->primary_care)
- case-0203 (telehealth->urgent_care)
- case-0206 (telehealth->urgent_care)
- case-0207 (telehealth->primary_care)
- case-0208 (telehealth->urgent_care)
- case-0211 (telehealth->urgent_care)
- case-0212 (telehealth->primary_care)
- case-0213 (telehealth->urgent_care)
- case-0214 (telehealth->primary_care)
- case-0216 (telehealth->urgent_care)
- case-0217 (telehealth->primary_care)
- case-0218 (telehealth->urgent_care)
- case-0221 (telehealth->primary_care)
- case-0222 (telehealth->primary_care)
- case-0223 (telehealth->primary_care)
- case-0224 (telehealth->primary_care)
- case-0225 (telehealth->primary_care)
- case-0226 (telehealth->primary_care)
- case-0227 (telehealth->primary_care)
- case-0228 (telehealth->primary_care)
- case-0229 (telehealth->primary_care)
- case-0230 (telehealth->primary_care)
- case-0231 (telehealth->primary_care)
- case-0232 (telehealth->primary_care)
- case-0233 (telehealth->primary_care)
- case-0234 (telehealth->primary_care)
- case-0235 (telehealth->primary_care)
- case-0236 (telehealth->primary_care)
- case-0237 (telehealth->primary_care)
- case-0238 (telehealth->primary_care)
- case-0239 (telehealth->primary_care)
- case-0240 (telehealth->primary_care)

Lower-acuity disagreement IDs:

- case-0077 (er->urgent_care)
- case-0153 (urgent_care->primary_care)
- case-0165 (er->urgent_care)
- case-0170 (er->urgent_care)
- case-0175 (er->urgent_care)
- case-0180 (er->urgent_care)
- case-0181 (urgent_care->primary_care)
- case-0184 (urgent_care->primary_care)
- case-0186 (urgent_care->primary_care)
- case-0189 (urgent_care->primary_care)
- case-0191 (urgent_care->primary_care)
- case-0194 (urgent_care->primary_care)
- case-0196 (urgent_care->primary_care)
- case-0199 (urgent_care->primary_care)
- case-0204 (urgent_care->primary_care)
- case-0205 (er->urgent_care)
- case-0209 (urgent_care->primary_care)
- case-0210 (er->urgent_care)
- case-0215 (er->urgent_care)
- case-0219 (er->primary_care)
- case-0220 (er->urgent_care)

Interpretation: the second reader is very conservative in this run, often voting emergency for ER/urgent cases and primary care for telehealth-floored home-care cases. This is not a safety blocker because engine output had 0 UNDER, but the disagreement rate is too high for the second reader to be used as a quiet confidence signal without calibration.

## Report-only frontier personas

I added two simulator personas for the next frontier and ran them once. Both passed.

| Persona | Expected | Observed | Notes |
|---|---:|---:|---|
| `limited-english-fever` | telehealth/PCP | telehealth exact | Questions were short/simple; catch-all fired Q4; no home care |
| `vague-chest-denial` | not home care | telehealth exact | Denied chest pressure, breathing trouble, and catch-all; thin floor prevented home care |

## Recommendation

Safety fix worked. Do not revert the catch-all reservation or thin-information floor.

Next hardening target should be precision, not safety:

1. Clean remaining factor labels so no patient-facing factor uses `severe`/severity bucket words.
2. Add a narrower thin-floor escape hatch for clearly benign home-care vignettes after catch-all gives a non-red-flag answer, or mark the sparse synthetic home-care cases as acceptable telehealth if that is the intended safety posture.
3. Recalibrate second-reader behavior; current agreement is only 15.8%.

## Boundary confirmation

No `lib/` or `app/` edits were made by Codex this round. The only code change I made was adding the two allowed report-only personas to `scripts/simulate-patients.ts`. No kill switch was applied because there was no new UNDER.
