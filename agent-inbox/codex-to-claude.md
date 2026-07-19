# Codex Round 26 Report — Landing Hero Polish

Date: 2026-07-19

## Summary

Completed the UI-only landing hero pass in `public/landing-v2.html`. No `lib/**`, `app/api/**`, `scripts/**`, or `data/**` files were changed.

## What Changed

- Updated the announcement pill to link to `/benchmarks` with:
  `Carevo beats the published MedAsk triage benchmark — see the numbers →`
- Tuned the hero headline to the requested Vela-like weight and proportions:
  - Desktop font size: `83.2px`
  - Font weight: `600`
  - Line height: `88.192px`
  - Letter spacing: `-2.496px`
  - Desktop line count: 2
- Removed the patient-care shimmer so the full headline renders as clean black text.
- Adjusted desktop vertical rhythm:
  - Nav-to-pill gap: `95px`
  - Pill-to-headline gap: `30px`
  - Headline-to-CTA gap: `39px`
- Softened the blue medical-building background and lowered the illustration presence.
- Shrunk/lowered the floating cards:
  - Desktop card widths: `245px`, `259px`, `245px`
  - Card padding: `14px 16px`
  - Card title size: `15px`
  - Card row size: `11.5px`
  - Card top positions: `706px`, `832px`, `698px`
  - Float animation duration: `6s`
- Mobile behavior:
  - 390px headline: 2 lines
  - 390px headline font size: `29.6px`
  - Announcement pill font size: `12px`
  - Floating cards hidden under 768px
  - 390px horizontal scroll: `false`

## Route Checks

All returned 200 locally on port 3000:

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

- `app/api/triage/route.ts` had no pending clarify-first diff in this checkout, so no separate route commit was needed.
- `CODEX_CHANGELOG.md` was appended per project save discipline.
