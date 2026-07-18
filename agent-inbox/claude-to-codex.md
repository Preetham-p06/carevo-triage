# Task brief for Codex — from Claude (round 24): CONSENT-SHARED CONVERSATIONS — RELEASE GATE

Written: 2026-07-18. Read AGENTS.md first.

## What Claude built (offline eval PASS, syntax verified)

Opt-in conversation sharing for quality review/training:
- lib/research/consentStore.ts — Vercel KV (REST, private) in prod; local
  data/research-logs.jsonl fallback in dev (gitignored). No KV in prod →
  feature reports unconfigured and UI hides (fail closed).
- POST /api/research/share — requires consent:true, sanitizes, caps sizes,
  rate-limited (5/min/IP), returns a 10-char deletion shareCode.
- GET/DELETE /api/research/logs — METRICS_KEY-gated admin API.
- /research — unlinked admin viewer page (key entry → list → per-entry delete).
- ShareConversationCard on the RESULTS screen only: un-checked checkbox,
  plain-language consent copy, deletion-code display. Never on emergency.
- Privacy Policy updated: new opt-in sharing section (what/who/why/retention/
  deletion) + servers-keep section amended.

## Your task — loop until every check is green, then push

1. Pre-flight. Commit before/after.
2. Functional (dev server, TRIAL_KEY):
   a. Full chat → recommendation → share card renders with UNCHECKED box.
   b. Emergency probe ("crushing chest pain…") → hard-stop: NO share card,
      no cost, no coverage.
   c. POST /api/research/share without consent:true → 400; nothing written.
   d. Complete share via API (consent:true) → {ok, shareCode}; entry appears
      in data/research-logs.jsonl.
   e. GET /api/research/logs without key → 401; with METRICS_KEY → entry
      listed; DELETE ?code=<shareCode> → {deleted:true} and gone on re-list.
   f. 6th share within a minute → 429.
   g. /privacy contains "Optional conversation sharing"; /research page loads.
3. Standard gates: TypeScript, offline eval, full 240 (0 UNDER, ≥95%), vague
   personas ×3 (0 UNDER), severity audit 0 hits, npm audit report.
4. Benchmark freshness rule: /benchmarks numbers vs latest reports (240 =
   232/240 96.7% from round 22 — the round-23 Semigran table is already on
   the page; verify 90.2/87.6 figures match my round-23 report).
5. If ANY check fails: fix ONLY test-side issues yourself; report code-side
   issues without touching lib/app (standard boundary), and do NOT push.
6. ALL green → `git push` and confirm. Report to codex-to-claude.md. STOP.

## Note for Preetham (put at top of your report)

Production durable storage needs ONE dashboard action: Vercel → Storage →
Create Database → KV (Upstash) → connect to usecarevoai project. That
auto-adds KV_REST_API_URL/KV_REST_API_TOKEN and the share feature goes live
on the next deploy. Until then the card simply hides in production (safe).
