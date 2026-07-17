# Task brief for Codex — from Claude (round 21): UNIFIED TRIAGE PAGE + COVERAGE CARD UI

Written: 2026-07-17. Read AGENTS.md first. THIS IS A UI-ONLY ROUND — a
deliberate exception to the no-app-edits rule, scoped below. Preetham asked
for this build directly.

## Goal (Preetham's words, translated)

Rebuild /triage as ONE integrated page — kill the iframe embed. The product
(chat → recommendation) renders inline, with two additions users can't see
today: the insurance coverage card and a proper home for the facilities map.
Keep the EXACT current aesthetic.

## Current structure (read these first)

- app/triage/page.tsx (51 lines): hero + `<iframe src="/triage-embed">` on
  desktop; renders `<HomePage />` directly on mobile. HomePage is exported
  from app/page.tsx (796 lines) — the full product: chat flow,
  recommendation card w/ cost row, factors, NearbyFacilities, feedback.
- NearbyFacilities (in app/page.tsx) already calls /api/facilities (Google
  Places; mock data without GOOGLE_PLACES_API_KEY).
- Theme: tailwind tokens carevo-*, accent-*, ink (#164e63); white rounded-2xl
  cards, border-slate-200, shadow-sm; font-display headings; uppercase
  tracking-wide chips; the radial-gradient page background on /triage.

## Build spec

1. **De-embed**: app/triage/page.tsx renders the product inline (import
   HomePage or extracted components) inside the existing hero layout —
   same gradient background, same "Live Triage" hero (can slim it), same
   safeguards chips. Delete the iframe. KEEP /triage-embed route untouched
   (it's for third-party embedding).
2. **Coverage card ("Uninsured? See what coverage could cost")** — NEW
   component, shown on the RESULTS screen only (after a recommendation,
   never on the emergency/911 screen):
   - Small form: ZIP (5 digits), yearly household income, ages (comma or
     chips, 1–8 people). Simple-English labels (house rule: 6th-grade
     English, no jargon).
   - POST /api/coverage with {zipcode, income, ages:[...]}. Response:
     {configured, options:{eligibility:{likelyMedicaidOrChip,
     estimatedMonthlyCredit}, samplePlans:[{name, issuer, metalLevel,
     monthlyPremium, deductible}], provenance}}.
   - configured:false → render nothing (feature hides cleanly).
   - Results: if likelyMedicaidOrChip → prominent "You may qualify for free
     or low-cost coverage (Medicaid/CHIP)" callout; show estimatedMonthlyCredit
     as "Estimated help paying: $X/month"; list up to 3 samplePlans as rows
     (issuer, metal level chip, $premium/mo, deductible).
   - Footer line: "Live data from HealthCare.gov · estimates only, not an
     enrollment decision" + link healthcare.gov. This card NEVER affects
     routing and shows no severity words.
   - Client-side validation mirroring the API (5-digit ZIP etc.); loading +
     error states in-theme; rate-limit (429) → friendly "try again in a
     minute".
3. **Facilities map slot**: give NearbyFacilities a proper titled section in
   the results layout ("Care near you") consistent with the new page — same
   component, no logic changes. Leave a clean container so a full map render
   can drop in later.
4. Mobile: single column, same components; no horizontal scroll; tap targets
   ≥44px (existing patterns already do this).

## Hard boundaries

- Allowed to edit/create: app/triage/page.tsx, app/page.tsx (extraction into
  app/components/* or colocated components is fine), new component files,
  app/globals.css if strictly needed.
- FORBIDDEN: lib/** (engine, floors, guards, cost, marketplace), app/api/**,
  scripts/**, data/**, next.config.mjs, anything routing-related. The
  recommendation JSON contract is read-only to you.
- No new dependencies. No localStorage for health data (existing patterns
  only). CSP allows self + inline styles only — no external scripts.

## Verification before you report

1. TypeScript + offline eval still green (they must be untouched by a UI round).
2. Dev server: /triage loads with NO iframe; complete one full chat →
   recommendation; cost row renders; coverage card: submit ZIP 43054 /
   income 32000 / age 28 → shows $ credit + plans (key is in .env.local).
   Emergency probe ("crushing chest pain...") → hard-stop screen, NO
   coverage card, NO cost figures.
3. Screenshot-level self-review: spacing/theme consistent with the rest.
4. Commit. **DO NOT PUSH** — Preetham reviews the page visually first.
5. Report to agent-inbox/codex-to-claude.md: what changed, file list, and
   anything you chose differently than specced (with why). STOP.
