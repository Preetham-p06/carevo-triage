# Task brief for Codex — from Claude (round 19): NEJM45 EXTERNAL BENCHMARK + REGRESSION GATE

Written: 2026-07-17. Read AGENTS.md first.

## Context

Preetham supplied the NEJM45 external benchmark (45 published vignettes,
15 emergency / 15 doctor-visit / 15 self-care). It's converted at
data/recursive-learning/nejm45-benchmark.jsonl (labels em/ne/sc; the CSV's
prior-system results are kept per-row in `baseline_prior_system`).

First run (results committed, 0fba243): fair 3-tier score 35/45 with 5 real
UNDERs — ALL traced to raw-floor phrasing gaps, not clinical logic:
"8 y/o" not matching age-gated floors, "one leg" missing the DVT pattern,
"symptoms not responding" missing the asthma net, COPD plain wording, plus
one false ER from "NO fever or neck stiffness" firing the meningitis floor.

## What Claude changed (offline 27/27 green, commit 0fba243)

- rawErSafetyFloor/rawUrgentCareSafetyFloor MOVED to lib/engine/rawFloors.ts
  (pure extraction + the fixes below; route.ts imports them; floors are now
  offline-gateable — gate P16 pins every NEJM phrasing).
- Fixes: age abbreviations (y/o|yo|y.o.) in all pediatric/elderly floors;
  "one leg" in the DVT floor; asthma "not responding|no relief|not helping|
  not improving"; COPD "worsening shortness of breath|green sputum";
  meningitis floor fever+stiffness components negation-stripped; NEW ER
  floor: 65+ with fever AND productive cough (pneumonia risk, case-0011).

## Your task

1. Pre-flight (dev server up; TRIAL_KEY works locally). Commit before/after.
2. **NEJM45 rerun**: 
   TRIAL_KEY=... run-clinical-dataset.ts --input=data/recursive-learning/nejm45-benchmark.jsonl
   --mode=api-multiturn --base=http://127.0.0.1:3000
   --output=data/recursive-learning/nejm45-results-round19-<date>.jsonl
   Score it TWO ways and report both:
   a) harness verdicts as-is;
   b) FAIR 3-tier rubric (this is the headline): Emergency≡{emergency,er},
      DoctorVisit≡{urgent_care,primary_care,telehealth}, SelfCare≡{home_care}.
   Expected: the 5 UNDERs (case-0003/0004/0005/0011/0013) flip → ~40/45,
   **0 UNDER**. Baseline to beat/match: prior system 40/45 with under-triages
   among its 5 misses. List every remaining miss verbatim with factors.
3. **Full 240 gate** (`...round19-...`): floor changes are a regression
   surface. 240/240, **0 UNDER**, 0 provider errors, ≥95% exact (round-18
   baseline 235/240). New floors may add safe over-routes — list any changed
   case + which floor reason it carries (especially the new elderly
   fever+cough floor and the meningitis negation fix).
4. **Vague personas ×3** (all 8): 0 UNDER absolute.
5. Severity-word audit: 0 hits.
6. **If ALL green (0 UNDER everywhere, 240 ≥95%, audit clean): `git push`**
   and confirm in the report. Anything red: no push, report.
7. Write agent-inbox/codex-to-claude.md. STOP. Boundaries unchanged (no lib/
   or app/ edits; kill switches only on new UNDER).
