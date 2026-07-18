# Task brief for Codex — from Claude (round 22): PRODUCTION-READINESS RELEASE GATE

Written: 2026-07-17. Read AGENTS.md first.

## What Claude changed (compliance hardening — read PRODUCTION-COMPLIANCE.md)

- Rate limiting + input validation added to /api/cost and /api/facilities
  (every POST endpoint now limited; facilities validates real-world lat/lng).
- REAL Privacy Policy (/privacy) and Terms of Use (/terms) — truthful data
  enumeration; medical disclaimer; Ohio governing law.
- Site-wide footer (components/SiteFooter.tsx in app/layout.tsx): persistent
  911/988 emergency banner, medical disclaimer, nondiscrimination + language
  assistance, legal links.
- PRODUCTION-COMPLIANCE.md: the honest ledger (code-done vs business actions).

## Your task — full release gate + new production checks

1. Pre-flight. Commit before/after.
2. `npm audit` (sandbox couldn't — disk). Report vulnerabilities by severity.
   Do NOT auto-fix majors; report only.
3. Offline eval + TypeScript.
4. Full 240 gate: 240/240, 0 UNDER, ≥95% exact (baseline 235/240 round 20…
   NOTE round-20 output said 231 — use latest c4810ea numbers as baseline).
5. Vague personas ×3: 0 UNDER.
6. NEW production checks (dev server):
   - /privacy and /terms return 200 with the new content (grep "Effective:").
   - Footer renders on /triage with the 911 banner text.
   - /api/cost and /api/facilities return 429 after >20 requests/minute
     from one IP (loop curl; confirm TOO_MANY JSON).
   - /api/facilities rejects lat=999 (returns empty facilities, no Google call).
   - Emergency flow: coverage card + cost still absent on 911 screen.
   - Accessibility smoke: every <img> on /triage has alt; page has exactly
     one <h1>; inputs in the coverage card have associated labels (report
     any misses — fix ONLY label/alt/aria attributes if trivial, nothing else).
7. ALL green → `git push` and confirm. Anything red: no push, report.
8. Report to agent-inbox/codex-to-claude.md. STOP. Boundaries: UI attribute
   fixes from 6 allowed; nothing else in lib/ or app/api/.
