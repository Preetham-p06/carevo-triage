# Codex Round 20 Report — FINAL NEJM45 FIX RELEASE GATE

Date: 2026-07-17
Repo: `/Users/preethamprabhu/Developer/Carevo/triage-web`
Before-run checkpoint: `e573a60 round 20: before final NEJM45 release gate`
Decision: **GREEN — pushed after report commit**

## Bottom Line

Round 20 passed the release gate.

The final asthma phrasing fix worked: NEJM45 `case-0003 AsthmaExacerbation` now routes exact `er` instead of under-triaging to `telehealth`.

Headline NEJM45 fair 3-tier result: **41/45 = 91.1%, 0 UNDER**.

This beats the prior system's published 40/45 benchmark while also removing the under-triage problem in the miss set. Carevo's four remaining NEJM45 misses are all safe over-triage.

## Gate Summary

| Gate | Result | Notes |
|---|---:|---|
| TypeScript | PASS | `npx tsc --noEmit` completed cleanly |
| Offline eval | PASS | 104/104 acceptable, 0 UNDER, 0 safety failures |
| NEJM45 raw Carevo scoring | PASS | 45 scored: 41 exact, 4 over, 0 UNDER; 91.1% exact, 100% safe-or-exact |
| NEJM45 fair 3-tier scoring | PASS | 41/45 exact-equivalent, 4 over, 0 UNDER; 91.1% |
| Synthetic 240 regression | PASS | 231 exact, 9 over, 0 UNDER, 0 errors; 96.3% exact, 100% safe-or-exact |
| Vague persona gate | PASS | 24/24 correct or acceptable, 0 UNDER, 0 forbidden output, 0 errors |
| Severity wording audit | PASS | 0 patient-facing hits for 1-to-10 or mild/moderate/severe wording |

No `lib/` or `app/` files were edited by Codex in this round. Claude's prior fix was tested only.

## NEJM45 Results

Output: `data/recursive-learning/nejm45-results-round20-2026-07-17.jsonl`

Counts:

- exact: 41
- over: 4
- UNDER: 0
- exact accuracy: 91.1%
- safe-or-exact: 100%

Fair 3-tier scoring used:

- Emergency = `emergency` or `er`
- DoctorVisit = `urgent_care`, `primary_care`, or `telehealth`
- SelfCare = `home_care`

Fair 3-tier result: 41 exact-equivalent, 4 over, 0 UNDER, 91.1%.

## Final Asthma Fix Confirmed

### case-0003 — AsthmaExacerbation

- Vignette: `27 y/o f, Hx of asthma, mild shortness of breath, wheezing, 3 days cough, symptoms not responsive to inhalers, recent cold`
- Round 19: predicted `telehealth`, verdict `UNDER`
- Round 20: predicted `er`, verdict `exact`

The new asthma floor now catches `not responsive to inhalers` and related isn't-working phrasing without broadening into unrelated mild respiratory cases.

## Remaining NEJM45 Misses — Over-Triage Only

| Case | Label | Expected | Predicted | Notes |
|---|---|---:|---:|---|
| case-0030 | Vertigo | urgent_care | er | Older patient with sudden recurrent dizziness; conservative ER route |
| case-0032 | AcuteBronchitisResolved | home_care | telehealth | Resolved fever + cough/sputum kept at telehealth |
| case-0040 | Constipation | home_care | er | Infant constipation with occasional blood spots triggered bleeding red flag |
| case-0045 | Vomiting | home_care | urgent_care | Toddler vomiting case; simulated patient answered unable to keep food/drink down |

These are all safe over-routes. case-0040 remains worth future precision review because `occasional spots of blood` from hard stool should likely not map to uncontrolled bleeding.

## Synthetic 240 Regression

Output: `data/recursive-learning/synthetic-240-results-round20-final-2026-07-17.jsonl`

Counts:

- exact: 231
- over: 9
- UNDER: 0
- errors: 0
- exact accuracy: 96.3%
- safe-or-exact: 100%

This matches round 19 headline performance and remains above the 95% exact threshold.

Changed versus round 19:

| Case | Expected | Round 19 | Round 20 | Notes |
|---|---:|---|---|---|
| case-0161 | urgent_care | over emergency | exact urgent_care | Improved; now factors are functional impact/limiting activity rather than emergency route |
| case-0211 | home_care | exact home_care | over er | Safe over-route; factor: `Red flag: Swelling of the face, lips, or throat` |

The home-care upper-respiratory block stayed exact, which is the key regression check for the new asthma phrasing floor.

## Vague Persona Gate

Log: `data/trials/trials-2026-07-17T19-50-02.jsonl`

Totals:

- 24 trials
- 21 exact
- 3 acceptable
- 0 over
- 0 UNDER
- 0 forbidden output
- 0 errors
- average questions: 4.0

Per persona:

| Persona | 3-round result | Final levels |
|---|---:|---|
| vague-chest-catchall | 3 exact | er x3 |
| vague-gi-terse | 3 exact | telehealth x3 |
| vague-headache-terse | 3 exact | telehealth x3 |
| vague-kid-fever-terse | 3 exact | telehealth x3 |
| vague-back-pain-terse | 3 acceptable | telehealth x3 |
| vague-tired-terse | 3 exact | telehealth x3 |
| limited-english-fever | 3 exact | telehealth x3 |
| vague-chest-denial | 3 exact | telehealth x3 |

## Severity Wording Audit

Audited patient-facing questions and response text in:

- `data/recursive-learning/nejm45-results-round20-2026-07-17.jsonl`
- `data/recursive-learning/synthetic-240-results-round20-final-2026-07-17.jsonl`
- `data/trials/trials-2026-07-17T19-50-02.jsonl`

Result: **0 hits** for:

- `1 to 10` / `1-10`
- `scale of 1 to 10`
- `mild, moderate, or severe`
- `mild moderate severe`

## Recommendation

Round 20 is release-green. Push is appropriate and was performed after this report commit.

Next precision work, not release-blocking:

1. Refine constipation/anal-fissure blood-spot handling so occasional hard-stool blood does not become uncontrolled bleeding.
2. Review vertigo over-triage wording for safe urgent-care precision.
3. Keep NEJM45 plus the 240 gate as the public benchmark pair: external comparison plus internal safety regression.
