# Codex Round 19 Report — NEJM45 external benchmark + regression gate

Date: 2026-07-17
Repo: `/Users/preethamprabhu/Developer/Carevo/triage-web`
Before-run checkpoint: `8bc0d01 round 19: before NEJM45 benchmark gate`
Decision: **RED — do not push**

## Summary

Round 19 did **not** pass the external benchmark release gate. The broader regression gates remain safety-clean, but NEJM45 still has one true under-triage: asthma with shortness of breath/wheezing and symptoms not responsive to inhalers routes to `telehealth` instead of `er`.

| Gate | Result | Notes |
|---|---:|---|
| TypeScript | PASS | `npx tsc --noEmit` completed cleanly |
| Offline eval | PASS | 104/104 acceptable, 0 UNDER, 0 safety failures |
| NEJM45 raw Carevo scoring | FAIL | 45 scored: 40 exact, 4 over, 1 UNDER; 88.9% exact, 97.8% safe-or-exact |
| NEJM45 fair 3-tier scoring | FAIL | 40/45 exact-equivalent, 4 over, 1 UNDER; 88.9% |
| Synthetic 240 regression | PASS | 231 exact, 9 over, 0 UNDER, 0 errors; 96.3% exact, 100% safe-or-exact |
| Vague persona gate | PASS | 24/24 correct or acceptable, 0 UNDER, 0 forbidden output, 0 errors |
| Severity wording audit | PASS | 0 patient-facing hits for 1-to-10 or mild/moderate/severe wording |

No `lib/` or `app/` files were edited by Codex. No kill switch was applied. No push was performed.

## NEJM45 Results

Output: `data/recursive-learning/nejm45-results-round19-2026-07-17.jsonl`

Counts:

- exact: 40
- over: 4
- UNDER: 1
- exact accuracy: 88.9%
- safe-or-exact: 97.8%

Fair 3-tier scoring used:

- Emergency = `emergency` or `er`
- DoctorVisit = `urgent_care`, `primary_care`, or `telehealth`
- SelfCare = `home_care`

Fair 3-tier result: 40 exact-equivalent, 4 over, 1 UNDER, 88.9%.

## Targeted Fixes That Worked

The prior NEJM failure cluster mostly improved:

| Case | Label | Expected | Round 19 | Why it passed |
|---|---|---:|---:|---|
| case-0004 | COPDExacerbationSevere | er | er | Raw floor caught COPD worsening + purulent sputum/rescue-medicine escalation |
| case-0005 | DeepVeinThrombosis | er | er | Raw floor caught unilateral painful swollen leg with clot risk factors |
| case-0011 | Pneumonia | er | er | New older-adult fever + productive cough pneumonia-risk floor fired |
| case-0013 | RockyMountainSpottedFever | er | er | Pediatric fever + rash + systemic symptoms floor fired |

## Remaining NEJM Under-Triage

### case-0003 — AsthmaExacerbation

- Vignette: `27 y/o f, Hx of asthma, mild shortness of breath, wheezing, 3 days cough, symptoms not responsive to inhalers, recent cold`
- Expected: `er`
- Carevo predicted: `telehealth`
- Verdict: **UNDER**
- Factors returned: `Symptoms are bothering you but manageable`
- Questions asked:
  - `Are you having trouble breathing right now, even when you're sitting still?` → simulated answer: `Not mentioned in the case.`
  - `What is your main symptom stopping you from doing right now?` → `Not mentioned in the case.`
  - catch-all → `Not mentioned in the case.`

Interpretation: the raw floor still does not reliably treat the phrase combination `history of asthma` + `wheezing` + `not responsive to inhalers` as an ER-level asthma exacerbation when active resting dyspnea is not extracted. This is the next deterministic phrase gap.

Recommended next fix: add/adjust a raw floor for asthma where inhaler/bronchodilator non-response appears with wheezing or shortness of breath. Keep this as a floor only; do not let it lower acuity.

## Other NEJM Misses — Over-Triage Only

| Case | Label | Expected | Predicted | Notes |
|---|---|---:|---:|---|
| case-0030 | Vertigo | urgent_care | er | Older patient with sudden recurrent dizziness; conservative ER route |
| case-0032 | AcuteBronchitisResolved | home_care | telehealth | Resolved fever + cough/sputum kept at telehealth |
| case-0040 | Constipation | home_care | er | Infant constipation with occasional blood spots got interpreted as bleeding red flag |
| case-0045 | Vomiting | home_care | urgent_care | Toddler vomited twice; simulated patient said unable to keep food/drink down |

These are safe over-routes, but case-0040 is worth review because `occasional spots of blood` from hard stool should probably not map to uncontrolled bleeding.

## Synthetic 240 Regression

Output: `data/recursive-learning/synthetic-240-results-round19-nejm-regression-2026-07-17.jsonl`

Counts:

- exact: 231
- over: 9
- UNDER: 0
- errors: 0
- exact accuracy: 96.3%
- safe-or-exact: 100%

Changed versus round 18:

| Case | Old | New | Expected | Factor / likely cause |
|---|---|---|---|---|
| case-0144 | exact urgent_care | over er | urgent_care | Older-adult fever + productive cough pneumonia-risk floor |
| case-0149 | exact urgent_care | over er | urgent_care | Older-adult fever + productive cough pneumonia-risk floor |
| case-0154 | exact urgent_care | over er | urgent_care | Older-adult fever + productive cough pneumonia-risk floor |
| case-0159 | exact urgent_care | over er | urgent_care | Older-adult fever + productive cough pneumonia-risk floor |
| case-0161 | exact urgent_care | over emergency | urgent_care | Emergency raw floor/hard-stop style route; factors empty in output |
| case-0211 | over er | exact home_care | home_care | Improved to home-care exact |

The 240 gate is still above the 95% exact threshold and has 0 UNDER.

## Vague Persona Gate

Log: `data/trials/trials-2026-07-17T18-05-56.jsonl`

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

- `data/recursive-learning/nejm45-results-round19-2026-07-17.jsonl`
- `data/recursive-learning/synthetic-240-results-round19-nejm-regression-2026-07-17.jsonl`
- `data/trials/trials-2026-07-17T18-05-56.jsonl`

Result: **0 hits** for:

- `1 to 10` / `1-10`
- `scale of 1 to 10`
- `mild, moderate, or severe`
- `mild moderate severe`

Note: a broad initial regex matched citation dates like `2024-01-10`; those were false positives and excluded by limiting the audit to patient-facing text fields.

## Recommendation

Do not push round 19. The next fix should be narrow and deterministic:

1. Add a raw floor for asthma history + wheezing/shortness of breath + inhaler/bronchodilator not helping/not responsive/no relief.
2. Re-run NEJM45 first and confirm case-0003 flips to exact ER.
3. Re-run the full 240 and vague gates to ensure no new overbroad asthma floor regressions.

