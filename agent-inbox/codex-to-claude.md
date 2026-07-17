# Codex Round 21 Report — Unified /triage page + coverage card UI

Date: 2026-07-17
Decision: **GREEN locally — commit made, not pushed**

## What changed

Built `/triage` as one integrated page instead of an iframe wrapper.

Files changed:

- `app/triage/page.tsx`
  - Removed the `/triage-embed` iframe.
  - Kept the existing Live Triage hero, gradient background, safeguard chips, rounded product shell, and Carevo visual language.
  - Mounted the product inline with `<HomePage embedded />`.

- `app/page.tsx`
  - Added an `embedded` mode to `HomePage` so `/triage` can render the chat/recommendation product inline while `/triage-embed` remains untouched.
  - Added a results-only coverage card: ZIP, yearly income, and household ages; posts to `/api/coverage`; hides cleanly when the backend says `configured:false`.
  - Coverage results show estimated help paying, Medicaid/CHIP callout when applicable, and up to 3 HealthCare.gov plan rows.
  - Added a titled `Care near you` section around `NearbyFacilities`, including a clean map-ready container for a future full map.
  - Emergency/911 screen remains separate and shows no coverage card or cost figures.

## Verification

- TypeScript: PASS — `npx tsc --noEmit`.
- Offline eval: PASS — 104/104 acceptable, 0 UNDER, 0 safety failures.
- `/triage` DOM check: PASS — iframe count is 0.
- Normal chat flow: PASS — ankle injury flow reached an inline `Urgent Care` recommendation.
- Cost row: PASS — displayed insured and cash cost estimates.
- Coverage card: PASS — submitted ZIP `43054`, income `32000`, age `28`; rendered estimated help paying `$269/month` plus 3 sample HealthCare.gov plan rows.
- Facilities section: PASS — `Care near you` section and map-ready container rendered; `NearbyFacilities` mounted below it.
- Emergency probe: PASS — crushing chest pain hard-stopped to `Emergency Detected` / `Call 911 Now`; coverage card absent; cost figures absent.
- Screenshot-level review: PASS on desktop — visual style matches the existing Carevo island/nav, gradient background, rounded white cards, slate borders, and carevo/accent colors.

## Notes / choices

- I did not edit `/triage-embed`; it still exports the default product page for third-party embedding.
- I kept the coverage card inside the result screen only. It never appears on the emergency screen and never changes routing.
- I used the existing `/api/coverage` contract and did not touch `app/api/**` or `lib/**`.
- Browser viewport override did not actually resize the in-app browser during the mobile check, so I did not claim a full phone-device browser verification. The layout uses single-column mobile-friendly Tailwind classes and 44px form/button targets in the edited components.
- No push was performed; this is ready for Preetham visual review first.
