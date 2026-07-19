# Codex Round 24 Report — Consent-Shared Conversations Release Gate

Date: 2026-07-18
Decision: **GREEN — pushed after report commit**

## Note for Preetham

Production durable storage needs one dashboard action: Vercel → Storage → Create Database → KV (Upstash) → connect to the `usecarevoai` project. That auto-adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`, and the share feature goes live on the next deploy. Until then the card hides in production, which is the safe fail-closed behavior.

## Executive Summary

Claude's opt-in conversation-sharing implementation passed the release gate.

- Normal recommendation flow: share card renders only after the result, with the checkbox present and **unchecked**.
- Emergency hard-stop flow: no share card, no checkbox, no cost, no coverage.
- Consent API: rejects missing consent, saves only explicit `consent:true`, returns a 10-character deletion code, and stores the entry locally in dev.
- Admin API: rejects missing `METRICS_KEY`, lists with key, deletes by share code, and confirms the entry is gone.
- Rate limit: 6th share within a minute returns 429.
- Privacy and research pages load with the required content.
- Clinical gates are unchanged: 240-case gate remains **232/240 exact, 8 over, 0 UNDER, 0 errors, 96.7% exact, 100% safe-or-exact**.
- Vague-patient gate remains **24/24 correct or acceptable, 0 UNDER, 0 forbidden output, 0 errors**.

No `lib/` or `app/` code-side fixes were needed during this round.

## Functional Checks

UI:

- Full chat to recommendation: PASS.
  - Result reached urgent care.
  - `Help make Carevo better` card appeared.
  - Consent checkbox existed and was unchecked.
- Emergency probe: PASS.
  - Input: crushing chest pain, sweating, left-arm pain.
  - `Emergency Detected` / `Call 911 Now` rendered.
  - Share card absent.
  - Checkbox absent.
  - Cost and coverage sections absent.

API:

- `POST /api/research/share` without `consent:true`: PASS — HTTP 400 `{ error: "consent required" }`.
- No-consent write suppression: PASS — local `data/research-logs.jsonl` unchanged.
- `POST /api/research/share` with `consent:true`: PASS — HTTP 200, `{ ok: true, shareCode }`, share code length 10.
- Dev storage: PASS — entry appeared in `data/research-logs.jsonl`.
- `GET /api/research/logs` without key: PASS — HTTP 401.
- `GET /api/research/logs` with `METRICS_KEY`: PASS — entry listed.
- `DELETE /api/research/logs?code=<shareCode>` with `METRICS_KEY`: PASS — `{ deleted: true }`.
- Re-list after delete: PASS — entry gone.
- Rate limit: PASS — share statuses `[200, 200, 200, 200, 200, 429]`.
- Test cleanup: PASS — all round-24 test share rows removed from the dev log.

Pages:

- `/privacy`: PASS — contains `Optional conversation sharing`.
- `/research`: PASS — HTTP 200 and admin viewer content present.

## Standard Gates

- TypeScript: PASS — `npx tsc --noEmit`.
- Offline eval: PASS.
  - 104 cases.
  - 104/104 acceptable.
  - 0 UNDER.
  - 0 safety failures.
  - 4,752 property checks passed.
- Full 240-case API multi-turn gate: PASS.
  - Output: `data/recursive-learning/synthetic-240-results-round24-consent-sharing-2026-07-18.jsonl`.
  - 240/240 scored.
  - 232 exact.
  - 8 over.
  - 0 UNDER.
  - 0 errors.
  - 96.7% exact.
  - 100% safe-or-exact.
- Vague-patient personas ×3: PASS.
  - Log: `data/trials/trials-2026-07-19T01-57-47.jsonl`.
  - 8 personas × 3 rounds = 24 trials.
  - 24/24 correct or acceptable.
  - 0 over.
  - 0 UNDER.
  - 0 forbidden output.
  - 0 errors.
  - Average questions: 4.0.
- Patient-facing severity audit: PASS.
  - Audited the new vague trial log plus the new 240-case output.
  - 0 hits for 1-to-10, one-to-ten, mild, moderate, or severe in patient questions/factor labels.

## Benchmark Freshness

`/benchmarks` is fresh:

- Round-22 internal gate numbers present: `232 of 240 exact`, `96.7%`.
- Round-23 MedAsk/Semigran numbers present: Carevo `90.2`, MedAsk `87.6`.
- Safety messaging present: `100%` safe-or-exact / safety-of-advice language.

## Npm Audit

Full audit report:

- Total: 7 findings.
- Critical: 0.
- High: 2.
- Moderate: 4.
- Low: 1.

Production-only audit:

- Total: 1 finding.
- High: 1.
- Package: transitive `ws`.
- Main advisory: memory-exhaustion DoS range `<8.21.0`.

No audit fix was applied in this round. This is the same dependency-audit class already seen in round 22 and should be handled as a dependency-maintenance task, not mixed into this consent-flow release gate.

## Git

- Pre-flight checkpoint commit: `1b16d0f round 24: before consent-sharing release gate`.
- Report/changelog commit: created after this report.
- Push: performed after all functional and clinical gates passed.

## Files Changed By Codex This Round

- `agent-inbox/codex-to-claude.md` — this report.
- `CODEX_CHANGELOG.md` — appended round-24 gate summary.

No generated logs were committed. No `lib/` or `app/` files were edited by Codex in this round.
