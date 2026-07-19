# Codex Round 25 Report — `/triage` Inline Flow + Results Overlay

Date: 2026-07-19
Decision: **PARTIAL GREEN — implemented, build-passing, not pushed**

## Executive Summary

I implemented the requested UI-only redesign for `/triage`:

- `/triage` now reads as one centered page flow.
- The old embed-style framed product card is gone from `/triage`.
- The symptom checker sits directly under the hero copy and safeguard chips.
- Normal recommendations now open in an animated results overlay.
- Closing the overlay returns to the inline conversation, with a `See results again` affordance.
- Emergency hard-stop remains a full-screen red takeover, not a modal.
- `/triage-embed` still loads.

I did **not** push because the full release gate could not be completed in this environment: `npm run eval` needs `tsx`, this checkout does not have a local `node_modules/.bin/tsx`, and npm registry access failed with `ENOTFOUND registry.npmjs.org`.

## Files Changed

- `app/triage/page.tsx`
  - Rebuilt the route as a single centered column.
  - Hero copy, explanation, and safeguard chips remain at top.
  - `<HomePage presentation="inline" />` is mounted directly below the hero.
  - Removed the old visual shell with `Live product`, grid background, and nested card frame.

- `app/page.tsx`
  - Added `HomePagePresentation = 'full' | 'embed' | 'inline'`.
  - Added inline mode for `/triage`.
  - Inline mode shows chat bubbles directly on the page background.
  - Result state now opens a modal/bottom-sheet overlay in inline mode.
  - Added close button, backdrop close, Escape close, focus trap, focus return to input, `See results again`, and `Start over`.
  - Existing result page behavior remains for non-inline modes.
  - Existing emergency hard-stop remains a full takeover.

- `app/globals.css`
  - Added reduced-motion-safe CSS animations:
    - message fade/slide
    - backdrop fade
    - desktop modal scale/slide
    - mobile sheet slide-up
    - staggered result sections
    - emergency fade-in

- `CODEX_CHANGELOG.md`
  - Appended the round-25 implementation and verification status.

## Verification Completed

Passed:

- `npx tsc --noEmit`
- `npm run build`
  - Next compiled successfully.
  - TypeScript passed inside the production build.
  - Static generation completed for `/triage` and `/triage-embed`.
- Direct page checks:
  - `/triage` returns HTTP 200.
  - `/triage` contains `Start with one clear next step.`
  - `/triage` contains the symptom input.
  - `/triage` initial HTML does **not** contain the old `Live product` chip.
  - `/triage-embed` returns HTTP 200.
- `git diff --check`

Partially verified:

- Browser controller initial inspection confirmed:
  - `/triage` has the inline hero.
  - `/triage` has the inline symptom input.
  - `/triage` has no dialog initially.
  - `/triage` no longer shows the old `Live product` frame.

Blocked:

- Full browser flow verification was interrupted by browser safety policy after the first interaction sequence.
- `npm run eval` could not complete because `npx -y tsx scripts/eval-engine.ts` attempted to reach npm and failed with:
  - `ENOTFOUND registry.npmjs.org`
- Full 240-case, vague ×3, severity audit, and `/benchmarks` freshness gates were not run in this environment.

## Push Status

No push was performed.

Reason: the brief says to push only if all gates are green. The UI implementation and production build are green, but the full release gate could not be completed because of the local `tsx`/network issue.

## Recommended Next Step

Run this once network access or a local `tsx` binary is available:

```bash
cd ~/Developer/Carevo/triage-web
npm install
npm run eval
TRIAL_KEY=carevo-trials-x7k2 npm run trials -- --repeat=3
```

Then run the existing 240-case and vague-patient release commands from the prior round-24 gate. If they stay at 0 UNDER and the visual pass checks out, push the round-25 UI branch.
