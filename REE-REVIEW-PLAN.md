# REE Clinician Review Plan — training-row preparation

Status: 240-case live gate PASSED 2026-07-14 (240/240, 0 UNDER, 0 provider
errors) on the frozen config: OpenAI gpt-4o-mini · Node runtime ·
KB carevo-kb-2026.07.0+r1 · Route Engine v1.1 · rules 2026.07.0.
REE is cleared for reviewed training-row preparation. Nothing trains or
promotes until the review below happens.

## Why a clinician gates this

REE's training rows encode "the engine should have done X instead of Y."
If a wrong row gets in, the system learns a wrong preference at scale.
Rules and floors are untouchable by training, so the blast radius is
bounded — but the reviewer is what makes the training signal *clinical*
rather than statistical.

## The review session (Paul, ~60–90 min)

1. **Generate candidates first** (engineering, before the session):
   `npm run ree:coroner` on the round-7 gate results, then
   `npm run ree:architect -- --dry-run` → produces candidate rows, each with:
   case text, engine's answer, proposed better answer, and the evidence trail.
2. **Review batch size:** cap at 50 rows for the first session. Quality of
   the first batch matters more than volume — it calibrates the pipeline.
3. **Per-row decision:** approve / reject / edit. The one question per row:
   "Would the proposed routing have been safe AND appropriate for this
   patient?" When in doubt → reject (a rejected good row costs nothing;
   an approved bad row trains a mistake).
4. **Priority order for the first batch** (from round-7 quality notes —
   all over-triage reduction, since under-triage is at zero):
   - Home-care skin/eye/mouth over-routes to ER (8 cases: chronic eczema
     patterns, post-viral watery eyes) — clearest wins
   - MSK/eye over-routes to ER (6 cases: eye pain/photophobia, vertigo)
     — CAUTION: some of these may be clinically correct escalations
     (acute angle-closure glaucoma presents as sudden eye pain + blurred
     vision). Paul decides; this is exactly why he's in the loop.
   - Home-care URI over-routes to telehealth/urgent care (12 cases)
5. **Out of scope for training rows:** the chest/stroke blocks routing
   `emergency` instead of `er`. That's the deterministic hard-stop policy,
   not the trainable layer — changing it is a policy decision about the
   keyword nets, not a preference row. Do not create rows against it.
6. **Record decisions** with `npm run ree:apply-review-decisions` (or the
   prepare-mimic-review flow) so every approved row carries: reviewer id,
   date, and rationale — same signature contract as the rule layer.

## After the review

1. `npm run ree:juror` — must pass on the reviewed rows (typecheck, engine
   evals, dataset evals).
2. Offline smoke training only (`npm run ree` smoke-train path). No
   production pointer changes.
3. Any trained artifact goes through the same 240-case gate BEFORE and
   AFTER comparison; promotion requires: no new UNDER, exact accuracy not
   worse, and a human sign-off.

## Standing invariants (unchanged by any of this)

- Rules/floors are not trainable and not bypassable.
- The LLM never picks care levels.
- Emergency nets are not weakened to reduce over-triage — over-triage is
  tuned in the trainable layer only.
