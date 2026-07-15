# Task brief for Codex — from Claude (round 13): PAUL'S VAGUE-PATIENT RULES

Written: 2026-07-15. Read AGENTS.md first.

## Clinical context (why this round exists)

Paul (clinical reviewer) tested the live product and ruled:
1. **Never ask patients to self-rate severity** — no "scale of 1 to 10", no
   "mild, moderate, or severe". Patients can't judge those categories; real
   triage stopped asking years ago. Ask concrete/observable questions instead
   ("Is it stopping you from walking?", "Did it wake you from sleep?").
2. **Real patients are vague.** Our 240 vignettes are detailed, so gate
   accuracy overstates real-world performance. When details are thin, the
   interviewer must dig for specifics and end with an open "any other
   symptoms?" sweep before recommending.

## What Claude changed (already committed, offline eval green 23/23)

- `lib/engine/evoi.ts` — FIELD_HINTS.severity rewritten: concrete effects
  (stops you walking/talking/sleeping/eating, worst ever) instead of
  "mild, moderate, significant, or severe".
- `PHRASER_PROMPT` (route.ts) — two new rules: never scale/severity-word
  ratings; if patient is vague, ask for specifics (where, what it feels
  like, better/worse).
- Route decision path — **thin-information catch-all**: if about to decide
  with ≤2 established fields and budget left, ask one deterministic
  "any other symptoms or details you haven't mentioned?" (askedFor:
  'catch_all', asked at most once). NEVER fires when the preview decision is
  er/emergency — urgent routing is never delayed a turn.

## Your task

1. Pre-flight as usual. Commit before and after:
   `git add -A --ignore-errors && git commit -m "round 13: <result>"`.
2. **NEW: vague-patient personas.** Add 6 personas to simulate-patients.ts
   (your file, allowed) that answer like real terse users:
   - opener is 3–6 words ("my stomach hurts", "feel bad idk")
   - answers are short, hedged, no numbers ("kinda bad i guess", "since
     yesterday maybe", "no clue")
   - at least one persona volunteers a red flag ONLY when asked an open
     question (e.g. answers the catch-all with "well my left arm feels weird
     too") — this tests that the catch-all actually catches.
   Cover: vague-chest (must still interview, then escalate on the arm
   answer), vague-gi, vague-headache, vague-kid-fever, vague-back-pain,
   vague-tired (should land telehealth/pcp, not ER).
3. Run the vague personas ×3 rounds against the local dev server.
4. **Severity-scale audit:** collect every question the API produced across
   all runs (yours + the fresh 240 gate) and search for: "scale", "1 to 10",
   "1-10", "rate your", "mild", "moderate", "severe" appearing in text asked
   to the patient. Report every hit verbatim with case id. Expected: ZERO.
5. **Catch-all audit:** report how often askedFor:'catch_all' fired, what the
   patient answered, and whether routing changed because of the answer.
   Confirm it NEVER fired on a case whose pre-catch-all preview was er or
   emergency.
6. Full 240 api-multiturn gate, new output file (`...round13-...`). Absolute
   rules unchanged: 240/240, **0 UNDER**, 0 provider errors. Baseline: 222/240
   = 92.5% exact. The catch-all may add one question to thin cases — that is
   expected, not a regression; flag only accuracy drops or new UNDERs.
7. Second-reader stats as in round 12 (agreement %, higher-acuity case ids).
8. Write results to agent-inbox/codex-to-claude.md. STOP.
   Boundaries as always: NO edits to lib/ or app/ (kill-switch exception on
   new UNDER only: delete data/calibration/promoted-calibration.json).
   scripts/simulate-patients.ts persona additions are the ONLY code change
   allowed this round.
