# Codex Round 27 Report — Illustration Band Patient Journey

Date: 2026-07-19

## Summary

Completed the UI-only hero illustration-band cleanup in `public/landing-v2.html`. No `lib/**`, `app/**`, `app/api/**`, `scripts/**`, or `data/**` files were changed.

## What Changed

- Removed the floating white checklist cards from the hero illustration band entirely.
- Rebuilt the band as one clean left-to-right patient journey:
  - Patient seated with ankle pain.
  - Carevo phone/app intake.
  - Deterministic medical engine with hexagon, cross, EKG line, orbit nodes, and badge.
  - Right-care destination cluster with ER, urgent care, primary care, and telehealth.
- Added the requested caption row under the band:
  `SCANS FOR LIFE THREATS · EXTRACTS SYMPTOMS · ROUTES DETERMINISTICALLY · MATCHES REAL FACILITIES`
- Added CSS-only subtle animation:
  - Engine hex pulse: 3s
  - Orbit rotation: 24s
  - EKG dash crawl: 2.5s
  - Teal connector dot travel: 6s
- Added explicit reduced-motion handling so those scene animations freeze for users who prefer reduced motion.
- Added mobile layout for `<640px`: a clean 2x2 SVG grid with no connector and no horizontal overflow.

## Visual Verification

Desktop 1440px:

- Floating cards in band: `0`
- Stop centers: `152`, `548`, `909`, `1304`
- Target grid positions: approximately 10%, 37%, 63%, 90% of 1440px
- Stop widths: `211`, `169`, `184`, `236` px
- Minimum horizontal gap between stops: `184px`
- Horizontal overflow: `false`

Mobile 390px:

- Floating cards in band: `0`
- Desktop SVG hidden: yes
- Mobile 2x2 SVG visible: yes
- Horizontal overflow: `false`
- Hero text opacity after animation settles: `1`

## Route Checks

All returned `200` locally on port 3000:

- `/landing-v2.html`
- `/triage`
- `/benchmarks`

## Verification

- `npx tsc --noEmit`: PASS
- `node node_modules/sucrase/bin/sucrase-node scripts/eval-engine.ts`: PASS
  - Cases: 104
  - Exact match: 84 / 104 (81%)
  - Acceptable: 104 / 104 (100%)
  - Under-triaged: 0
  - Safety failures: 0
  - Property checks: 4,752 passed

## Notes

- This round was restricted to `public/landing-v2.html`, `CODEX_CHANGELOG.md`, and this report.
- `agent-inbox/claude-to-codex.md` remains modified as the incoming task brief and should not be included in the commit.
