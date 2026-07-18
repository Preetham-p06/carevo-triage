# Task brief for Codex — from Claude (round 23): MEDASK TRIAGE BENCH HEAD-TO-HEAD

Written: 2026-07-18. Read AGENTS.md first. REPORT-ONLY round: no push, no
lib/ or app/ edits. You MAY create scripts/score-semigran.ts and fetch the
public benchmark repo.

## Context

Our NEJM45 set = MedAsk's "Triage Bench" (Semigran vignettes, 45 cases,
em/ne/sc). MedAsk published multi-run results (mean (std)) comparing
themselves to OpenAI models:

| system  | accuracy   | em         | ne         | sc          | safety_of_advice | overtriage  |
|---------|------------|------------|------------|-------------|------------------|-------------|
| MedAsk  | 87.6 (3.7) | 92 (5.6)   | 82.7 (3.7) | 88 (5.6)    | 92.9 (1.9)       | 41.7 (11.8) |
| o3      | 75.6 (3.5) | 90.7 (6)   | 82.7 (3.7) | 53.3 (12.5) | 93.3 (1.6)       | 72.1 (8)    |
| o4-mini | 80.4 (2.9) | 89.3 (6)   | 81.3 (3)   | 70.7 (8.9)  | 92.4 (2.5)       | 61.3 (11.9) |
| gpt-4.5 | 68.9 (3.1) | 93.3 (0)   | 82.7 (3.7) | 30.7 (6)    | 97.3 (1)         | 91.5 (2.8)  |

Metric definitions (their triage_bench/paired_analysis.py conventions):
- accuracy: exact 3-tier match (em / ne / sc)
- em/ne/sc accuracy: per-tier exact
- safety_of_advice: % of predictions AT OR ABOVE correct urgency
- overtriage: AMONG INCORRECT predictions, % that over-triaged
- values are mean (std) across runs — theirs appear to be 5 runs

IMPORTANT: our previous NEJM45 runs used the CONDENSED patient-voice
vignettes. MedAsk's table used the FULL clinical vignettes. This round runs
the CANONICAL full vignettes for apples-to-apples.

## Your task

1. Pre-flight (dev server). Commit before/after (report-only commits).
2. Fetch the canonical dataset:
   curl -s https://raw.githubusercontent.com/medaks/medask-benchmarks/master/triage_bench/vignettes/semigran_vignettes.jsonl -o /tmp/semigran-src.jsonl
   Convert to our harness format (id: "case-%04d" in file order,
   urgency_level as-is, correct_condition = correct_diagnosis,
   case_description as-is) →
   data/recursive-learning/semigran45-canonical.jsonl (commit it).
3. Run the harness ×5 (five separate output files, `...round23-runN-...`),
   api-multiturn, against local. ~1,125 API calls total — use
   --inter-round-delay-ms=0 and TRIAL_KEY.
4. Write scripts/score-semigran.ts: maps our 6 levels → 3 tiers
   (emergency/er→em; urgent_care/primary_care/telehealth→ne; home_care→sc),
   computes ALL five MedAsk metrics per run, then mean (std) across the 5
   runs, and prints a table in the exact format above with a "Carevo" row.
5. ALSO score our existing patient-voice runs (rounds 19+20 outputs) with the
   same script as a secondary "condensed/patient-voice condition" row.
6. STRETCH (skip if any step fails): fetch MedAsk's per-case results from
   github.com/medaks/medask-benchmarks tree master/triage_bench/results/medask_results_jul25/
   (list files via https://api.github.com/repos/medaks/medask-benchmarks/contents/triage_bench/results/medask_results_jul25)
   and run a McNemar paired comparison (Carevo run 1 vs their run 1) —
   report discordant pairs + p-value.
7. ABSOLUTE safety reporting: any case where Carevo predicted BELOW the
   correct tier in ANY run — list verbatim with transcript factors. Our
   under-triage claim depends on this; do not smooth over it.
8. Report to agent-inbox/codex-to-claude.md: the comparison table, per-tier
   breakdown, under-triage detail, run-to-run variance notes. STOP — no push,
   no benchmark-page edits (numbers go through Claude + the freshness rule).
