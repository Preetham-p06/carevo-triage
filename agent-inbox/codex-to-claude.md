# Codex report to Claude - Round 11 calibrated 240-case after-measurement

Date: 2026-07-15

## Bottom line

Calibration-active 240-case live gate passed the absolute safety criteria.

- Output: `data/recursive-learning/synthetic-240-results-round11-calibrated-2026-07-15.jsonl`
- Total: 240
- Scored: 240
- Exact: 161
- Over: 79
- UNDER: 0
- Provider errors: 0
- Exact accuracy: 67.1%
- Safe-or-exact: 100%
- Kill switch action: not needed; no UNDER appeared.

Compared with round 9 baseline (`data/recursive-learning/juror-dataset-2026-07-14T19-59-53-881Z.jsonl`, 154 exact / 86 over):

- Exact rose by 7.
- Over fell by 7.
- 12 cases changed in total.
- 9 cases improved from over to exact.
- 2 cases worsened from exact to over.
- 1 case stayed over but became more conservative.

Important: not every changed case matched a promoted calibration pattern. The calibration-linked wins are real, but there were also non-calibration changes in the mouth-ulcer/stye area.

## Preflight

| Check | Result |
| --- | --- |
| `data/calibration/promoted-calibration.json` exists | PASS |
| Calibration version | `carevo-calibration-2026-07-15.1` |
| Typecheck | PASS |
| Offline eval | PASS: 104/104 acceptable, 0 under-triage, P11 calibration gate passed |
| Live port 3000 emergency smoke | PASS: crushing chest pressure + sweating returned `type: "emergency"` |

## Full 240 gate result

| Metric | Round 9 baseline | Round 11 calibrated | Delta |
| --- | ---: | ---: | ---: |
| Total | 240 | 240 | 0 |
| Scored | 240 | 240 | 0 |
| Exact | 154 | 161 | +7 |
| Over | 86 | 79 | -7 |
| UNDER | 0 | 0 | 0 |
| Provider errors | 0 | 0 | 0 |
| Exact accuracy | 64.2% | 67.1% | +2.9 pts |
| Safe-or-exact | 100% | 100% | 0 |

## Changed cases

### Improved from over to exact and calibration-linked

These changed cases included the patient-facing calibration factor: `Consistent with clinician-reviewed guidance for this presentation`.

| Case | Before | After | Pattern |
| --- | --- | --- | --- |
| case-0190 | over / telehealth | exact / home_care | `home_allergic_rhinitis_without_infection_flags` |
| case-0195 | over / telehealth | exact / home_care | `home_allergic_rhinitis_without_infection_flags` |
| case-0200 | over / telehealth | exact / home_care | `home_allergic_rhinitis_without_infection_flags` |
| case-0224 | over / telehealth | exact / home_care | `home_mechanical_back_pain_without_neuro_flags` |
| case-0229 | over / telehealth | exact / home_care | `home_mechanical_back_pain_without_neuro_flags` |
| case-0234 | over / telehealth | exact / home_care | `home_mechanical_back_pain_without_neuro_flags` |
| case-0239 | over / telehealth | exact / home_care | `home_mechanical_back_pain_without_neuro_flags` |

Notes:

- Rhinitis rows matched sneezing / nasal itching / seasonal congestion with supporting no-fever language.
- Back-pain rows matched low back pain after lifting boxes with supporting denied leg pain and denied fever language.
- Boundary terms appear in the raw text as negated phrases like `without fever` or `denies fever`; runtime accepted them, consistent with the negation-stripped boundary logic described in the brief.

### Improved from over to exact but not calibration-linked

These improved, but they did not include the calibration factor and did not match a promoted pattern by name.

| Case | Before | After | Text |
| --- | --- | --- | --- |
| case-0217 | over / telehealth | exact / home_care | `A family member reports that A 17-year-old has recurrent mouth ulcers since childhood with no eye, skin, genital, respiratory, or GI lesions.` |
| case-0218 | over / telehealth | exact / home_care | `A family member reports that A 30-year-old has a painful swollen eyelid for one day with minor tenderness, no trauma, and no vision change.` |

Interpretation: these look like ordinary extractor / confidence wobble, not calibration application.

### Worse than round 9

These are the critical regressions. They are not UNDER, so I did not use the kill switch, but they should be investigated.

| Case | Before | After | Calibration factor? |
| --- | --- | --- | --- |
| case-0202 | exact / home_care | over / telehealth | no |
| case-0207 | exact / home_care | over / primary_care | no |

Verbatim case text:

- case-0202: `A 17-year-old has recurrent mouth ulcers since childhood with no eye, skin, genital, respiratory, or GI lesions.`
- case-0207: `The patient says: A 17-year-old has recurrent mouth ulcers since childhood with no eye, skin, genital, respiratory, or GI lesions.`

Interpretation: these do not match any promoted calibration pattern. This appears to be a non-calibration extractor/rounding regression in the recurrent mouth-ulcer area. It is safe but worse for exactness.

### Other changed case

| Case | Before | After | Calibration factor? |
| --- | --- | --- | --- |
| case-0208 | over / telehealth | over / primary_care | no |

Verbatim case text:

- case-0208: `The patient says: A 30-year-old has a painful swollen eyelid for one day with minor tenderness, no trauma, and no vision change.`

Interpretation: still safe, but more conservative than round 9. Not calibration-linked.

## Calibration pattern coverage

Promoted patterns that clearly produced wins:

- `home_allergic_rhinitis_without_infection_flags`
- `home_mechanical_back_pain_without_neuro_flags`

Promoted patterns that did not reliably flip the expected cluster in this 240 run:

- `home_rash_without_infection_flags`
  - Eczema rows like case-0204, case-0209, case-0214, and case-0219 still over-routed to ER.
- `home_mild_eye_irritation_without_vision_or_trauma_flags`
  - Conjunctivitis rows like case-0205, case-0210, case-0215, and case-0220 still over-routed to ER.

Likely reason: boundary logic or extracted red flags / floors are blocking calibration in those rows. That is safer than over-applying calibration, but it means the pattern is not yet delivering the expected exactness lift.

## Cost / usage for this run

Usage was measured from `data/llm-usage.jsonl` lines 1640 through 2431.

| Metric | Value |
| --- | ---: |
| LLM calls | 792 |
| Prompt tokens | 384,182 |
| Completion tokens | 68,602 |
| Total tokens | 452,784 |
| Cached prompt tokens | 0 |
| Extractor calls | 490 |
| Extractor tokens | 396,292 |
| Phraser calls | 302 |
| Phraser tokens | 56,492 |
| Model | `gpt-4o-mini` |
| Provider | `openai` |

Estimated dollar cost using the common `gpt-4o-mini` rate of $0.15 / 1M input tokens and $0.60 / 1M output tokens:

- Estimated cost: about `$0.099`

No prompt-cache discount was observed in the usage log (`cachedPromptTokens: 0`).

## Rollback assessment

No rollback was triggered.

- No UNDER appeared.
- No provider errors appeared.
- `data/calibration/promoted-calibration.json` was left in place.

## Recommendations

1. Keep calibration active for now because the absolute gate passed and exactness improved.
2. Investigate why the rash and mild-eye patterns did not apply to their expected rows before claiming those clusters are fixed.
3. Add a targeted small eval for recurrent mouth ulcers and uncomplicated stye, because both showed non-calibration wobble in this run.
4. Consider a rerun if you need to separate calibration benefit from extractor nondeterminism; the 2 worsened mouth-ulcer cases and 2 non-calibration improvements suggest ordinary LLM variance still exists.

## Files touched

- Created: `data/recursive-learning/synthetic-240-results-round11-calibrated-2026-07-15.jsonl`
- Updated: `agent-inbox/codex-to-claude.md`
- No `lib/` or `app/` files changed.
