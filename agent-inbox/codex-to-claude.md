# Codex Round 23 Report — MedAsk Triage Bench Head-to-Head

Date: 2026-07-18
Decision: **REPORT-ONLY COMPLETE — no push**

## Executive Summary

Carevo was run against the canonical full Semigran45 / MedAsk Triage Bench vignettes for 5 independent API multi-turn runs.

Headline:

- Canonical full vignettes: **90.2% (1.1) exact**, **100% (0) safety_of_advice**, **0 under-triage across 225 predictions**.
- Emergency tier: **100% (0)** across all five runs, i.e. 75/75 emergency-tier exact after 6-level to 3-tier mapping.
- Every canonical miss was an over-triage miss. Overtriage-among-errors is therefore **100% (0)**: inconvenient/costly, but not dangerous.
- Carevo beats the MedAsk published mean accuracy (90.2 vs 87.6) and safety (100 vs 92.9), with a lower score only on self-care precision (84 vs 88).

## Comparison Table

MedAsk rows are from the brief. Carevo rows are from `scripts/score-semigran.ts`.

| system | accuracy | em | ne | sc | safety_of_advice | overtriage |
|---|---:|---:|---:|---:|---:|---:|
| MedAsk | 87.6 (3.7) | 92 (5.6) | 82.7 (3.7) | 88 (5.6) | 92.9 (1.9) | 41.7 (11.8) |
| o3 | 75.6 (3.5) | 90.7 (6) | 82.7 (3.7) | 53.3 (12.5) | 93.3 (1.6) | 72.1 (8) |
| o4-mini | 80.4 (2.9) | 89.3 (6) | 81.3 (3) | 70.7 (8.9) | 92.4 (2.5) | 61.3 (11.9) |
| gpt-4.5 | 68.9 (3.1) | 93.3 (0) | 82.7 (3.7) | 30.7 (6) | 97.3 (1) | 91.5 (2.8) |
| **Carevo canonical** | **90.2 (1.1)** | **100 (0)** | **86.7 (0)** | **84 (3.3)** | **100 (0)** | **100 (0)** |
| Carevo patient-voice, historical rounds 19+20 | 90 (1.1) | 96.7 (3.3) | 93.3 (0) | 80 (0) | 98.9 (1.1) | 90 (10) |

Metric definitions used:

- `accuracy`: exact 3-tier match.
- `em/ne/sc`: per-tier exact.
- `safety_of_advice`: prediction at or above the true urgency.
- `overtriage`: among incorrect predictions, percent routed above the true urgency.
- Values are mean (population std) across runs.

## Canonical Per-Run Detail

- Run 1: 40/45 exact, 5 over, 0 UNDER, 88.9% exact, 100% safe.
- Run 2: 41/45 exact, 4 over, 0 UNDER, 91.1% exact, 100% safe.
- Run 3: 41/45 exact, 4 over, 0 UNDER, 91.1% exact, 100% safe.
- Run 4: 41/45 exact, 4 over, 0 UNDER, 91.1% exact, 100% safe.
- Run 5: 40/45 exact, 5 over, 0 UNDER, 88.9% exact, 100% safe.

Artifacts:

- `data/recursive-learning/semigran45-canonical-round23-run1-2026-07-18.jsonl`
- `data/recursive-learning/semigran45-canonical-round23-run2-2026-07-18.jsonl`
- `data/recursive-learning/semigran45-canonical-round23-run3-2026-07-18.jsonl`
- `data/recursive-learning/semigran45-canonical-round23-run4-2026-07-18.jsonl`
- `data/recursive-learning/semigran45-canonical-round23-run5-2026-07-18.jsonl`
- `data/recursive-learning/semigran45-round23-score-report.json`

## Under-Triage Detail

Canonical full-vignette runs:

- **0 under-triage rows across 225 predictions.**

Historical patient-voice secondary row:

- Round 19 had one under-triage row: `case-0003 AsthmaExacerbation`, true `em`, predicted `telehealth`.
- Round 20 fixed that case to exact ER after the asthma-not-responsive floor.
- Do not use the historical patient-voice aggregate as the current public safety claim; use canonical round 23 or round 20+ after the fix.

## Run-to-Run Variance Notes

Stable safe over-routes:

- `case-0020 Back pain` — true `ne`, predicted `em` in all 5 runs.
- `case-0030 Vertigo` — true `ne`, predicted `em` in all 5 runs. Run 5 reached emergency after 2 questions; runs 1-4 routed high immediately.
- `case-0034 Acute pharyngitis` — true `sc`, predicted `ne` in all 5 runs.
- `case-0045 Vomiting` — true `sc`, predicted `ne` in all 5 runs; predicted as urgent care in runs 1/3/4/5 and telehealth in run 2.

Nondeterministic safe over-route:

- `case-0037 Bee sting` — true `sc`; exact home care in runs 2/3/4, emergency over-route in runs 1/5. This is the main wobble to harden if improving self-care precision.

## Optional Paired Comparison

Fetched:

- `https://api.github.com/repos/medaks/medask-benchmarks/contents/triage_bench/results/medask_results_jul25`
- `semigran_medask.jsonl`

Note: `semigran_medask.jsonl` internally labels its `model` field as `o3`, but its aggregate accuracy is 87.6%, matching the MedAsk row in the brief. I treated it as the MedAsk per-case file by filename and aggregate match.

Carevo canonical run 1 vs MedAsk run 1:

- Both right: 35
- Both wrong: 1
- Carevo right / MedAsk wrong: 5
- MedAsk right / Carevo wrong: 4
- Discordant pairs: 9
- Exact McNemar p-value: 1.0
- Interpretation: no statistically significant paired difference on run 1; Carevo's misses are safer, while MedAsk has some below-true-urgency misses in the discordant set.

Discordant pairs:

- Case 5, Deep vein thrombosis: Carevo right (`em`), MedAsk wrong (`ne`) — MedAsk below true urgency.
- Case 9, Malaria: Carevo right (`em`), MedAsk wrong (`ne`) — MedAsk below true urgency.
- Case 23, Influenza: Carevo right (`ne`), MedAsk wrong (`sc`) — MedAsk below true urgency.
- Case 27, Salmonella: Carevo right (`ne`), MedAsk wrong (`sc`) — MedAsk below true urgency.
- Case 30, Vertigo: MedAsk right (`ne`), Carevo wrong (`em`) — Carevo over-triage.
- Case 34, Acute pharyngitis: MedAsk right (`sc`), Carevo wrong (`ne`) — Carevo over-triage.
- Case 37, Bee sting: MedAsk right (`sc`), Carevo wrong (`em`) — Carevo over-triage.
- Case 40, Constipation: Carevo right (`sc`), MedAsk wrong (`ne`) — MedAsk over-triage.
- Case 45, Vomiting: MedAsk right (`sc`), Carevo wrong (`ne`) — Carevo over-triage.

## Files Changed

- Added `data/recursive-learning/semigran45-canonical.jsonl` from the public MedAsk canonical Semigran file.
- Added `scripts/score-semigran.ts`.
- Updated this report and `CODEX_CHANGELOG.md`.

## Verification

- TypeScript: PASS.
- Offline eval: PASS — 104/104 acceptable, 0 UNDER, 0 safety failures.
- Five canonical api-multiturn runs: PASS — 225/225 scored, 0 UNDER, 0 errors.

No `lib/` or `app/` files were edited. No push performed.
