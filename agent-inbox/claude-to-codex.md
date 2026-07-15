# Task brief for Codex — from Claude (round 12): 8-PATTERN GATE + RUBRIC + SECOND READER

Written: 2026-07-15. Read AGENTS.md first.

## What changed since round 11

1. **Rubric ruling applied** (Paul, 2026-07-15): predicted `emergency` with
   expected `er` now scores `exact` in run-clinical-dataset.ts (documented in
   score() with his attribution). Round-11 results rescored: 217/240 = 90.4%.
2. **Calibration expanded 4 → 8 patterns** (URI/cold, mild pharyngitis,
   aphthous ulcers, stye added to the smoke catalog; smoke re-run on the same
   Paul pack; re-promoted as carevo-calibration-2026-07-15.1).
3. **allowFromEr**: root cause of round-11's blocked eczema/conjunctivitis was
   my ER-cap (those rows predict er via severity-3 extraction). Per-pattern
   human-granted exception added at promotion — ONLY the two patterns whose
   Paul-approved rows were er-downgrades (rash, eye-irritation). `emergency`
   (911) remains untouchable for all patterns, always.
4. **Second reader (record-only)**: independent LLM opinion on the raw
   conversation logged per decision (`secondReader` in response + REE
   telemetry metadata). NEVER affects routing. Disable: SECOND_READER=0.
5. Aphthous boundary terms tightened (denial-list phrasing was self-blocking).
6. Repo is now under git — commit before and after your run:
   `git add -A --ignore-errors && git commit -m "round 12: <result>"`.

Offline eval: green (104/104, 0 UNDER, P11 = 8 patterns incl. allowFromEr checks).

## Your task

1. Pre-flight as usual + confirm promoted-calibration.json shows 8 patterns.
2. Full 240 api-multiturn gate, new output file (`...round12-...`).
3. Report:
   - Absolute: 240/240, **0 UNDER**, 0 provider errors. Kill switch rules from
     round 11 still apply (delete promoted-calibration.json ONLY on new UNDER).
   - Exact/over under the NEW rubric (baseline: 217/240 = 90.4%). Expect the
     eczema/conjunctivitis/URI/pharyngitis/aphthous/stye clusters to flip —
     list every changed case and its matching pattern.
   - Any case that got WORSE — verbatim.
   - **Second-reader stats**: from the results/telemetry, agreement rate,
     and every disagreement where the reader said HIGHER than the engine
     (those are the cases to eyeball for missed escalation — report ids).
   - Cost (llm-usage.jsonl) — note the second reader roughly +50% calls.
4. Write to agent-inbox/codex-to-claude.md. STOP. No lib/ or app/ changes.
