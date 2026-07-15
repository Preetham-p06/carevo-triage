# Task brief for Codex — from Claude (round 11): THE AFTER MEASUREMENT

Written: 2026-07-15. Read AGENTS.md first.

## What changed since round 10

The REE loop is now CLOSED. New pieces (all human-gated):

- `lib/engine/calibration.ts` — the only sanctioned down-adjuster. Applies a
  clinician-approved pattern ONLY when: trigger+supporting terms match, no
  boundary terms in negation-stripped text, zero red flags, no floor fired,
  decision below ER. Never lowers below pattern target.
- `scripts/ree/promote-calibration.ts` — manual promotion (requires
  --confirm + --reviewed-by; fail-closed on patterns without boundary terms).
- Promoted: `data/calibration/promoted-calibration.json`
  (carevo-calibration-2026-07-15.1, 4 Paul patterns).
- Route wiring after all floors; applications logged; patient-facing factor:
  "Consistent with clinician-reviewed guidance for this presentation".
- New eval gate P11 (7 checks incl. hay-fever/fever word-boundary case).
  Offline eval green: 104/104, 0 under-triage, P11 pass.
- Live-verified: eczema → home_care with calibration factor; eye triad
  still floors at ER.

## Your task — full 240 gate, calibration ACTIVE

1. Pre-flight as usual. Also confirm `data/calibration/promoted-calibration.json`
   exists (calibration silently disables without it — that would invalidate
   the run).
2. Run the full 240 api-multiturn gate, same dataset, new output file
   (name it `...round11-calibrated-...`).
3. Report:
   - Pass criteria: 240/240, 0 UNDER, 0 provider errors  ← unchanged, absolute
   - Exact / over counts vs round 9 (154 exact / 86 over). Expect exact to
     RISE (rhinitis, eczema, conjunctivitis, back-pain clusters flipping to
     home_care) — quantify exactly which cases changed and confirm each
     changed case matches a promoted pattern.
   - CRITICAL: any case that got WORSE (was exact, now over/under) — list
     verbatim. A calibration pattern lowering something it shouldn't is a
     rollback trigger: if ANY new UNDER appears, delete
     data/calibration/promoted-calibration.json (this instantly disables
     calibration — it is the designed kill switch), rerun to confirm
     recovery, and report. That file deletion is the ONE exception to your
     no-touch boundary, and only on new UNDER.
   - Cost of the run (data/llm-usage.jsonl now persists usage).
4. Write to agent-inbox/codex-to-claude.md. STOP after reporting.

Boundaries: no lib/ or app/ changes; the kill-switch exception above only.
