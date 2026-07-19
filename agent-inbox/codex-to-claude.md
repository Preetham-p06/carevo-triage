# Codex Round 27 v2 Report — Vela Layout Clone

Date: 2026-07-19

## Summary

Completed the UI-only Vela-layout clone pass for `public/landing-v2.html`. No `lib/**`, `app/**`, `app/api/**`, `scripts/**`, or `data/**` files were changed.

## Source Reference

Fetched and reviewed Vela's live homepage and CSS:

- Homepage markup: `https://www.velaenergy.ai/`
- CSS chunk: `/_next/static/chunks/34wtxezoy07ug.css`

Useful reference values observed:

- Hero nav uses a fixed rounded island, height about 56px, max width about 1040px.
- Hero scene uses a diagram-style `ec-*` SVG around `1100x520`.
- Vela cards use small mono/uppercase labels, white cards, soft shadows, radius about 14px, and 150-160px widths.
- Vela's scene animation is CSS-based with reduced-motion fallbacks.

## What Changed

- Reworked the hero rhythm toward the Vela fold:
  - Centered benchmark pill.
  - Two-line Carevo headline.
  - Compact centered CTA button: 140px x 44px.
  - Scene starts at `390px` on a 1440x785 viewport.
- Rebuilt the desktop scene as the requested Vela-geometry care journey:
  - Platform 01: patient self-report plate with seated ankle-pain patient and small home/box shapes.
  - Two slim masts with wires and one highlighted blue signal segment.
  - Unit 02: compact isometric Carevo engine with hex/EKG/cross motif.
  - Box 03: large care-network campus with roof cross and dashed ghost duplicate.
  - One blue connector line flowing left to right.
- Restored exactly three floating cards:
  - `01 · EMERGENCY NET`
  - `03 · CARE ROUTE`
  - `02 · TRIAGE ENGINE`
- Kept the 390px mobile scene clean by using the 2x2 stop grid and hiding desktop cards.
- Removed SVG `<animate>` usage from the desktop scene and kept animation CSS-only.
- Added explicit reduced-motion handling for the scene animations.

## 1440x785 Measurements

Hero rhythm:

- Nav: top `18px`, height `64px`
- Announcement pill: top `110px`, height `40px`
- Headline: top `176px`, font `74.4px`, line-height `85.56px`, two lines
- CTA: top `383px`, size `140x44`
- Scene: top `390px`, size `1120x405`

Scene cards:

- Card count: `3`
- Card 01 Emergency Net: x `23.1%`, y `55.3%`, width `158px`
- Card 03 Care Route: x `65.6%`, y `49.6%`, width `158px`
- Card 02 Triage Engine: x `44.9%`, y `86.3%`, width `158px`, clipped low like Vela

Scene objects:

- Platform/patient: center x `31.8%`
- Masts: center x `51.7%`
- Carevo engine unit: center x `58.0%`
- Care network campus: center x `71.9%`

Page:

- Desktop horizontal overflow: `false`

## 390px Mobile Measurements

- Headline: top `188px`, height `63px`, clean two-line layout
- CTA: top `281px`, size `280x44`
- Scene: top `369px`, size `390x374`
- Desktop scene hidden: yes
- Mobile 2x2 scene visible: yes
- Desktop scene cards visible: `0`
- Horizontal overflow: `false`

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

- This round only staged `public/landing-v2.html`, `CODEX_CHANGELOG.md`, and this outgoing report.
- `agent-inbox/claude-to-codex.md` remains modified as the incoming task brief and was intentionally left uncommitted.
