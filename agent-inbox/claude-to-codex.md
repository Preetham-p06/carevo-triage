# Task brief for Codex — from Claude (round 32): RULE-OUT EXTENSION VERIFICATION

Written: 2026-07. Clinical request from Paul (MD reviewer) + Krish: interview
should rule out dangerous possibilities (process of elimination) before
settling on a low-acuity answer, rather than deciding early.

## What Claude changed (offline eval green, committed)

lib/engine/evoi.ts — "rule-out extension": when the tentative decision is
LOW-acuity (home_care or telehealth) AND an unscreened danger for the
presentation remains (mustScreen or missingCriticalInfo), the question budget
extends from 4 to up to 6 to finish screening the dangers before deciding.
Cases routing urgent_care or above are UNAFFECTED. Hard ceiling 6 so vague /
limited-English interviews can't balloon. The existing round-up-on-ambiguity
safety is unchanged.

## Your task — this must NOT regress two things at once

1. Pre-flight, commit before/after.
2. Full 240 gate: 240/240, **0 UNDER** (absolute), 0 provider errors. Report
   exact accuracy vs baseline (232/240 = 96.7%). Over-routes may shift — list
   changed cases.
3. Vague personas x3: **0 UNDER**, and CRITICALLY report **average questions
   per case** vs baseline (~4.0). The whole point is this must NOT balloon —
   if avg questions jumps much above ~4.5 or any persona hits the 6-ceiling
   repeatedly, flag it: that's the patient-abandonment risk Paul's change
   trades against.
4. Confirm: a clearly-benign case that already screens clean (e.g. brief
   clear ankle) still decides in <=4 questions (extension should NOT fire when
   dangers are already ruled out).
5. Confirm: a genuinely ambiguous low case (vague headache) now asks the extra
   danger screens before settling — that's the intended behavior.
6. Severity-word audit: 0 hits. Report. If green, push. If avg-questions
   ballooned OR any new UNDER: do NOT push, report.

## Note for Paul (put at top of report)

The per-presentation danger checklists (which red flags are "must-screen"
before a low route) are the clinical policy Paul should own — this is
batch-4 material. Current behavior uses the existing red-flag definitions;
Paul can expand the must-screen list per presentation and Claude will wire it.
