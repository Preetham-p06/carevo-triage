# Task brief for Codex — from Claude (round 16): PAUL BATCH 3 IMPLEMENTED — TARGET 95%+

Written: 2026-07-16. Read AGENTS.md first.

## Clinical authority for this round

Paul signed batch 3 (all 18 round-15 over-routes) on 2026-07-16 — full record:
data/recursive-learning/review-decisions-paul-batch3.json. Decisions:
- Cluster A (8 URI cases): approve home_care IF fever absent + no shortness
  of breath + under 7 days.
- Cluster B (8 eczema/conjunctivitis cases): approve home_care via
  DOWNWARD-GUARDING deterministic rules with explicit-absence conditions.
- Cluster C (2 cases): engine right — his ER floors stand; benchmark labels
  corrected ne→em with label_note (synthetic-0169, synthetic-0180).

## What Claude implemented (offline 25/25 green)

1. **Cluster A root-cause fix**: rawUrgentCareSafetyFloor `fluLikeSystemic`
   was matching "fever" inside "NO fever" — fever component now tested on
   negation-stripped text (route.ts). Plus Paul's conditions added to the URI
   and pharyngitis calibration boundary terms (fever [any], short of breath,
   >7-day phrasings) — re-promoted as carevo-calibration-2026-07-16.1.
2. **Cluster B**: NEW lib/engine/homeGuard.ts (carevo-home-guards-2026.07.16-
   paul-batch3): two raw-text downward guards (pediatric flexural eczema;
   post-cold conjunctivitis). Fail-closed semantics: every listed danger
   AFFIRMED anywhere → refuse; minimum count of EXPLICIT denials required
   (silence ≠ absence); unparseable negations ("don't have a fever") count
   as affirmed → refuse; never over emergency; skipped when any raw-text
   ER/urgent floor matched. Kill switch: HOME_GUARDS=0 env var. Gate P14
   (9 checks incl. "no fever BUT severe pain" adversarial case).
3. **Cluster C**: 2 benchmark labels corrected with Paul attribution.

## Your task

1. Pre-flight (server restart procedure from round 15 if needed).
   Commit before/after.
2. Full 240 gate (`...round16-...`). Absolutes: 240/240, **0 UNDER**,
   0 provider errors. Baseline 222/240 (92.5%). Expected flips to exact:
   - Cluster A (8): flu-floor no longer fires on negated fever → engine or
     calibration lands home_care.
   - Cluster B (8): home guards fire (factor text: "Consistent with
     clinician-reviewed guidance ... dangers you told us are absent").
   - Cluster C (2): labels now em → engine's er/emergency = exact.
   **Target: ≥ 235/240 (97.9%) — flag anything below 95%.**
   List every case where a home guard fired; confirm each carried the
   explicit-denial factor. Any NEW over/under vs round 15 — verbatim.
3. Vague personas ×3 (all 8). ABSOLUTE 0 UNDER. The home guards require
   explicit denials, so vague personas must NOT trigger them — confirm zero
   guard factors in vague-persona outputs.
4. Severity-word audit (questions + factors): 0 hits expected.
5. Second-reader stats.
6. Write agent-inbox/codex-to-claude.md. STOP. Boundaries unchanged (no lib/
   or app/ edits; NEW kill switches: delete data/calibration/
   promoted-calibration.json AND/OR set HOME_GUARDS=0 — use ONLY on new
   UNDER, and report which mechanism caused it).
