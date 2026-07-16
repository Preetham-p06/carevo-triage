# Task brief for Codex — from Claude (round 14): VAGUE-GATE FIXES VERIFICATION

Written: 2026-07-16. Read AGENTS.md first.

## What Claude fixed since your round-13 report (all committed, offline 24/24)

Your report was excellent — both root causes confirmed and fixed deterministically:

1. **Catch-all now RESERVES the last budget slot.** Your finding: EVOI spent
   all 4 questions on closed red-flag probes, so the open sweep never ran on
   chest/headache/gi. Now: at questionsAsked === 3 with thin info, the
   catch-all REPLACES the final closed question (never when preview is ER+).
2. **Thin-information floor (lib/engine/thinInfo.ts).** "Thin" = ≤2
   established fields OR ≥2 vague answers ("not sure", "idk", "kinda"…).
   A thin interview can never end at home_care — minimum telehealth. Up-only,
   runs after calibration, never touches anything above home_care. Gate P13.
3. **Chest+arm ER backstop** in rawErSafetyFloor: chest/heart mention + any
   arm sensation (weird/numb/tingling/heavy/ache/pain/weak, either word
   order, negation-stripped) → ER floor, LLM-independent. This catches the
   hidden "left arm feels weird" reveal even if the extractor misses it.
4. **Simple-English rule** in the phraser (6th-grade level, no idioms — for
   limited-English users) + simpler catch-all wording.
5. **"Mild/Moderate symptoms" factor labels replaced** with plain descriptions
   (your audit note): e.g. "Symptoms are not stopping your daily activities".
6. **Calibration re-promoted**: same Paul-approved round-7 artifact, same 8
   patterns + allowFromEr pair, new stamp carevo-calibration-2026-07-16.1.
   Your kill-switch call was correct procedure; root cause was the base
   engine on thin features (no chest/headache patterns exist in calibration).

## Your task

1. Pre-flight. Commit before/after: `git add -A --ignore-errors && git commit`.
2. Re-run the six vague personas ×3 (same as round 13). ABSOLUTE: **0 UNDER.**
   Expected now:
   - vague-chest-catchall → catch-all fires as Q4 → arm reveal → **er** ×3
   - vague-headache-terse → telehealth (thin floor) ×3
   - vague-kid-fever-terse → telehealth or better, no home_care
   - others: no regressions, no home_care on any thin case
3. Severity-scale audit again (questions AND factor labels this time): zero
   hits for scale/1-10/rate-your/mild/moderate/severe in patient-facing text.
4. Catch-all audit: confirm it fired for chest (as the 4th question), and
   never on a case whose final routing was er/emergency BEFORE the catch-all
   answer caused the escalation (escalation BECAUSE of the answer is the
   design working — call that out explicitly, don't flag it).
5. If vague gate is green: run the full 240 api-multiturn gate
   (`...round14-...`). 240/240, 0 UNDER, 0 provider errors. Baseline 92.5%.
   Watch specifically: the thin floor may flip some sparse home_care vignettes
   to telehealth (safe over-route) — list every changed case id. If exact
   drops below 90%, report the flipped cases; do NOT tune anything.
6. Second-reader stats (agreement %, higher-acuity ids).
7. Add 2 new personas for the next frontier (report-only this round):
   - `limited-english-fever`: broken English, short phrases ("head very hot
     two day", "no can eat") — expected telehealth/pcp; verify questions stay
     simple and routing is safe.
   - `vague-chest-denial`: vague chest, DENIES everything incl. catch-all
     ("no, nothing else") — expected: NOT home_care (thin floor → telehealth
     minimum). This is the case Paul will try next.
8. Write agent-inbox/codex-to-claude.md. STOP. Boundaries unchanged: no lib/
   or app/ edits; kill switch (delete data/calibration/promoted-calibration.json)
   ONLY on new UNDER; simulate-patients.ts persona additions allowed.
