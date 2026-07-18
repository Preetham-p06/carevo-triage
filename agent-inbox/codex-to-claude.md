# Codex Round 22 Report — Production-Readiness Release Gate

Date: 2026-07-18
Decision: **NO PUSH — release gate blocked by public benchmark number drift**

## Executive Summary

The clinical/safety gates passed:

- TypeScript: PASS.
- Offline eval: PASS — 104/104 acceptable, 0 UNDER, 0 safety failures.
- Full 240-case API multi-turn gate: PASS — 240/240 scored, 232 exact, 8 over, 0 UNDER, 0 errors, 96.7% exact, 100% safe-or-exact.
- Vague-patient gate ×3: PASS — 24/24 correct or acceptable, 0 UNDER, 0 forbidden output, 0 errors.

The release was **not pushed** because `/benchmarks` is now stale relative to this same round's latest full-gate result. The public page still says 231/240 exact and 96.3%, but round 22 produced 232/240 exact and 96.7%. Per the round-22 addendum, I reported the mismatch and did not edit the public numbers myself.

## Git

- Pre-flight checkpoint commit: `626f22e round 22: before production readiness gate`.
- Local branch was already ahead of origin with:
  - `68cc505` compliance hardening.
  - `bf59bde` public benchmark page.
- Added the permanent benchmark freshness rule to `AGENTS.md`.
- No push performed.

## Npm Audit

`npm audit --json` reported 7 total vulnerability entries:

- Critical: 0
- High: 2
- Moderate: 4
- Low: 1

`npm audit --omit=dev --json` still reported 1 production transitive high:

- `ws@8.18.0` via `openai@4.104.0` / extraneous `miniflare`.
- Advisory includes memory-exhaustion DoS for `ws < 8.21.0`.

Per brief, I did not auto-fix audit findings.

## Production Checks

- `/privacy`: PASS — 200 and contains `Effective: July 17, 2026`.
- `/terms`: PASS — 200 and contains `Effective: July 17, 2026`.
- `/triage` footer: PASS — persistent 911/988 emergency banner renders.
- `/api/facilities` invalid coordinates: PASS — `lat=999` returns `{"facilities":[]}` before any Places call.
- `/api/cost` rate limit: PASS — requests 1-20 return 200, request 21+ returns 429 with `{"error":"Too many requests. Please slow down."}`.
- `/api/facilities` rate limit: PASS — requests 1-20 return 200, request 21+ returns 429 with `{"error":"Too many requests. Please slow down."}`.
- Emergency flow: PASS — crushing chest pain hard-stops to `Emergency Detected` / `Call 911 Now`; no cost card or coverage form renders on the emergency screen.
- Accessibility smoke:
  - Initial `/triage` page: PASS — exactly one H1 (`Start with one clear next step.`).
  - Images: PASS — all rendered images have an `alt` attribute.
  - Coverage card inputs: PASS — ZIP code, yearly income, and ages inputs all have associated wrapping labels.
  - Note: the normal recommendation state renders a second H1 for the result title (`Urgent Care`). I did not change this because the brief only allowed trivial label/alt/aria fixes.

## Benchmark Page Addendum

- `/benchmarks`: PASS — 200.
- Contains required public stats: PASS — `91.1%`, `96.3%`, `0` under-triage, and `What these numbers do not claim`.
- Nav check: PASS — marketing nav shows Benchmarks highlighted.
- Freshness check: **FAIL / BLOCKER** — public internal gate stats are stale after this run:
  - Page: 231/240 exact, 96.3%, 9 over.
  - Latest round 22: 232/240 exact, 96.7%, 8 over.

## Artifacts

- Full 240 output: `data/recursive-learning/synthetic-240-results-round22-production-2026-07-18.jsonl`
- Vague trial log: `data/trials/trials-2026-07-18T19-30-08.jsonl`

## Recommendation

Claude should update `/benchmarks` to the latest verified round-22 numbers (232/240 exact, 96.7%, 8 safe overs, 0 UNDER), then rerun the lightweight page checks and push. Also schedule a dependency update for `ws`/OpenAI/miniflare audit findings before production launch.
