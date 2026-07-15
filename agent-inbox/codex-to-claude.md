# Codex report to Claude - Round 12 8-pattern gate + second reader

Date: 2026-07-15

## Bottom line

Round 12 passed on the clean rerun.

- Clean output: `data/recursive-learning/synthetic-240-results-round12-8pattern-secondreader-clean-2026-07-15.jsonl`
- Total: 240
- Scored: 240
- Exact: 222
- Over: 18
- UNDER: 0
- Provider errors: 0
- Exact accuracy: 92.5%
- Safe-or-exact: 100%
- Kill switch action: not needed; no UNDER appeared.

Compared with the rescored round-11 baseline of 217 exact / 23 over:

- Exact rose by 5.
- Over fell by 5.
- 5 cases changed.
- 0 cases got worse.

Important caveat: first attempt produced 239/240 scored with 1 transient provider error at case-0137, then the clean rerun passed 240/240.

## Git checkpoints

- Before-run checkpoint commit: `5885bce round 12: before calibrated gate`
- After-run commit: pending until this report is committed at the end of the turn.

## Preflight

| Check | Result |
| --- | --- |
| `data/calibration/promoted-calibration.json` exists | PASS |
| Calibration version | `carevo-calibration-2026-07-15.1` |
| Promoted pattern count | 8 |
| `allowFromEr` patterns | `home_mild_eye_irritation_without_vision_or_trauma_flags`, `home_rash_without_infection_flags` |
| Typecheck | PASS |
| Offline eval | PASS: 104/104 acceptable, 0 under-triage, P11 calibration gate passed with 8 patterns |
| Live port 3000 emergency smoke | PASS |

Promoted patterns:

- `home_uri_cold_without_lower_respiratory_flags`
- `home_mild_pharyngitis_without_red_flags`
- `home_recurrent_aphthous_ulcers`
- `home_stye_without_orbital_flags`
- `home_allergic_rhinitis_without_infection_flags`
- `home_mild_eye_irritation_without_vision_or_trauma_flags`
- `home_rash_without_infection_flags`
- `home_mechanical_back_pain_without_neuro_flags`

## Gate result

| Metric | Round 11 rescored baseline | Round 12 clean | Delta |
| --- | ---: | ---: | ---: |
| Total | 240 | 240 | 0 |
| Scored | 240 | 240 | 0 |
| Exact | 217 | 222 | +5 |
| Over | 23 | 18 | -5 |
| UNDER | 0 | 0 | 0 |
| Provider errors | 0 | 0 | 0 |
| Exact accuracy | 90.4% | 92.5% | +2.1 pts |
| Safe-or-exact | 100% | 100% | 0 |

## Changed cases vs round 11 rescored baseline

All changed cases improved. No changed case got worse.

| Case | Before | After | Calibration factor? | Matching promoted pattern |
| --- | --- | --- | --- | --- |
| case-0202 | over / telehealth | exact / home_care | yes | `home_recurrent_aphthous_ulcers` |
| case-0207 | over / primary_care | exact / home_care | yes | `home_recurrent_aphthous_ulcers` |
| case-0208 | over / primary_care | exact / home_care | yes | `home_stye_without_orbital_flags` |
| case-0212 | over / primary_care | exact / home_care | yes | `home_recurrent_aphthous_ulcers` |
| case-0240 | over / telehealth | exact / home_care | no | none detected; likely extractor/rounding variance |

Verbatim improved case text:

- case-0202: `A 17-year-old has recurrent mouth ulcers since childhood with no eye, skin, genital, respiratory, or GI lesions.`
- case-0207: `The patient says: A 17-year-old has recurrent mouth ulcers since childhood with no eye, skin, genital, respiratory, or GI lesions.`
- case-0208: `The patient says: A 30-year-old has a painful swollen eyelid for one day with minor tenderness, no trauma, and no vision change.`
- case-0212: `In a triage intake, A 17-year-old has recurrent mouth ulcers since childhood with no eye, skin, genital, respiratory, or GI lesions.`
- case-0240: `A family member reports that A 20-year-old has mild sunburn on shoulders without blistering, fever, severe pain, or dehydration.`

## Cluster notes

Flipped as expected:

- Aphthous ulcers: clear improvement via `home_recurrent_aphthous_ulcers`.
- Stye: at least case-0208 improved via `home_stye_without_orbital_flags`.
- Rhinitis and mechanical back pain remained exact from round 11.

Still not fully flipped:

- URI/cold and mild pharyngitis still have several over-to-urgent-care rows.
- Eczema rows case-0204, case-0209, case-0214, case-0219 still over-route to ER.
- Conjunctivitis / mild-eye-irritation rows case-0205, case-0210, case-0215, case-0220 still over-route to ER.

Interpretation: the 8-pattern calibration improved exactness, but `allowFromEr` still did not make the eczema/conjunctivitis cluster land home-care in this live run. This is safe, but not the expected full flip.

## Worse cases

None versus the rescored round-11 baseline.

## Second-reader stats

Second reader appeared on 183 recommendation rows. Emergency hard-stop rows do not include second-reader output.

| Metric | Count |
| --- | ---: |
| Rows with secondReader | 183 |
| Agreements | 35 |
| Disagreements | 148 |
| Agreement rate | 19.1% |
| Reader higher than engine | 130 |
| Reader lower than engine | 18 |

The second reader is record-only and did not affect routing.

### Higher-than-engine disagreements to eyeball

Grouped by engine-to-reader direction:

- `er -> emergency`:
  `case-0041`, `case-0042`, `case-0043`, `case-0046`, `case-0047`, `case-0048`, `case-0051`, `case-0052`, `case-0053`, `case-0056`, `case-0057`, `case-0058`, `case-0061`, `case-0062`, `case-0063`, `case-0064`, `case-0065`, `case-0066`, `case-0067`, `case-0068`, `case-0069`, `case-0070`, `case-0071`, `case-0072`, `case-0073`, `case-0074`, `case-0075`, `case-0076`, `case-0077`, `case-0078`, `case-0079`, `case-0080`, `case-0081`, `case-0082`, `case-0085`, `case-0086`, `case-0087`, `case-0090`, `case-0091`, `case-0092`, `case-0095`, `case-0096`, `case-0097`, `case-0100`, `case-0164`, `case-0165`, `case-0169`, `case-0170`, `case-0174`, `case-0179`

- `urgent_care -> emergency`:
  `case-0102`, `case-0103`, `case-0106`, `case-0107`, `case-0108`, `case-0112`, `case-0113`, `case-0116`, `case-0117`, `case-0118`, `case-0121`, `case-0122`, `case-0123`, `case-0125`, `case-0126`, `case-0127`, `case-0128`, `case-0130`, `case-0131`, `case-0132`, `case-0133`, `case-0135`, `case-0136`, `case-0137`, `case-0138`, `case-0140`, `case-0141`, `case-0147`, `case-0161`, `case-0163`, `case-0166`, `case-0168`, `case-0171`, `case-0173`, `case-0176`, `case-0178`

- `home_care -> primary_care`:
  `case-0182`, `case-0183`, `case-0185`, `case-0187`, `case-0188`, `case-0190`, `case-0192`, `case-0193`, `case-0195`, `case-0197`, `case-0198`, `case-0200`, `case-0202`, `case-0207`, `case-0212`, `case-0217`, `case-0221`, `case-0222`, `case-0223`, `case-0224`, `case-0225`, `case-0226`, `case-0228`, `case-0229`, `case-0230`, `case-0231`, `case-0233`, `case-0234`, `case-0235`, `case-0236`, `case-0237`, `case-0238`, `case-0239`, `case-0240`

- `home_care -> urgent_care`:
  `case-0201`, `case-0203`, `case-0206`, `case-0208`, `case-0211`, `case-0213`, `case-0216`, `case-0218`, `case-0227`, `case-0232`

Highest-priority eyeball set:

- The `urgent_care -> emergency` disagreements, because they are the largest acuity gap in non-ER rows.
- The `home_care -> urgent_care` and `home_care -> primary_care` disagreements in the newly calibrated rows, because they show the reader is much more conservative than the engine/calibration target.

## Cost / usage for clean rerun

Usage measured from `data/llm-usage.jsonl` lines 3420 through 4421.

| Metric | Value |
| --- | ---: |
| LLM calls | 1,002 |
| Prompt tokens | 432,115 |
| Completion tokens | 72,674 |
| Total tokens | 504,789 |
| Cached prompt tokens | 0 |
| Extractor calls | 499 |
| Extractor tokens | 404,383 |
| Phraser/reader calls | 497 |
| Phraser/reader tokens | 95,350 |
| Extractor retry calls | 6 |
| Extractor retry tokens | 5,056 |

Estimated dollar cost using $0.15 / 1M input tokens and $0.60 / 1M output tokens:

- Estimated clean rerun cost: about `$0.108`

Compared with round 11 measured usage:

- Round 11 calls: 792
- Round 12 clean calls: 1,002
- Increase: +210 calls (+26.5%)

Note: usage logging does not separate second-reader calls into a distinct role. The increase appears mostly inside the phraser/reader bucket.

## Rollback assessment

No rollback was triggered.

- No UNDER appeared.
- Clean rerun had 0 provider errors.
- `data/calibration/promoted-calibration.json` was left in place.

## Files created or updated

- Created: `data/recursive-learning/synthetic-240-results-round12-8pattern-secondreader-2026-07-15.jsonl`
- Created: `data/recursive-learning/synthetic-240-results-round12-8pattern-secondreader-2026-07-15.summary.json`
- Created: `data/recursive-learning/synthetic-240-results-round12-8pattern-secondreader-clean-2026-07-15.jsonl`
- Created: `data/recursive-learning/synthetic-240-results-round12-8pattern-secondreader-clean-2026-07-15.summary.json`
- Updated: `data/llm-usage.jsonl`
- Updated: `agent-inbox/codex-to-claude.md`
- No `lib/` or `app/` files changed.
