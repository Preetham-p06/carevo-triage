# Task brief for Codex — from Claude (round 25): TRIAGE PAGE REDESIGN — INLINE FLOW + RESULTS OVERLAY

Written: 2026-07-19. Read AGENTS.md first. UI-ONLY round (same scoped
exception as round 21). Boundaries at bottom.

## Preetham's vision (verbatim intent)

No more embed-style framed card. /triage should read as ONE flowing page:
the hero copy ("Start with one clear next step." + the intake explanation),
and DIRECTLY below it the symptom checker itself — the product IS the page.
When the assessment finishes, the results appear as an animated POP-UP
overlay. Aesthetic, animated, visually appealing, same site vibe.

## Design spec

1. **Layout**: single centered column (max-w-2xl/3xl). Hero: eyebrow
   "LIVE TRIAGE", the big headline, the one-paragraph explanation, the three
   safeguard chips. Directly below: the chat input/conversation — NO card
   frame, no "Live product" chip, no border-box-in-box. The chat sits on the
   page background (keep the existing radial-gradient page bg). Keep the
   "Not a medical label. Emergency? Call 911." line under the input.
2. **Conversation styling**: keep existing bubbles but let the thread grow
   naturally on the page; smooth auto-scroll; question transitions animate
   (fade + 8px slide-up, ~300ms ease-out).
3. **Results overlay**: when a recommendation arrives:
   - Desktop: centered modal dialog (max-w-2xl, rounded-3xl, shadow-2xl,
     backdrop blur + slate-950/40 overlay), animate in: fade backdrop 200ms,
     panel scale 0.96→1 + slide-up 16px, 350ms ease-out.
   - Mobile: full-height bottom sheet sliding up, drag-handle bar at top.
   - Content order INSIDE the overlay (all existing components, unchanged
     logic): recommendation header + cost row → factors ("Why this") →
     Care near you (map + facilities) → coverage card → what to expect /
     self-care → share-conversation card → feedback. Staggered section
     reveal: each section fades in with 60ms incremental animation-delay.
   - Close: X button top-right + backdrop click + Escape → returns to the
     conversation (kept visible beneath); a "Start over" button too.
   - A11y REQUIRED: role="dialog" aria-modal, focus trapped inside, focus
     returns to input on close, all animations wrapped in
     @media (prefers-reduced-motion: no-preference).
4. **Emergency**: keep the existing full-screen red hard-stop EXACTLY as-is
   functionally; you may add the same fade-in. Never inside the modal —
   it stays a full takeover. No cost/coverage/share there (unchanged).
5. **Animations**: CSS only (tailwind + keyframes in globals.css). CSP
   forbids external scripts — NO animation libraries. Subtle > flashy:
   ease-out, 200-400ms, no bounces over 4px, no infinite loops except the
   existing typing indicator.
6. **Keep /triage-embed untouched** (iframe consumers). The HomePage
   `embedded` prop path must keep working — refactor carefully.

## Verify before push (loop until green)

1. TypeScript + offline eval untouched/green.
2. Full flow on desktop viewport AND 390px: chat inline, overlay animates,
   all sections present and functional (cost, map, coverage submit, share
   consent flow, feedback), close/reopen via "See results again" affordance
   if closed, start-over resets.
3. Emergency probe → full-screen takeover, no overlay, no money/share UI.
4. /triage-embed still renders and functions.
5. Standard release gates: 240 (0 UNDER, ≥95%), vague ×3 (0 UNDER),
   severity audit 0, /benchmarks freshness.
6. ALL green → `git push` + confirm. Anything red → report, no push.

## Boundaries

Allowed: app/triage/page.tsx, app/page.tsx, app/components/**, new
components, app/globals.css. FORBIDDEN: lib/**, app/api/**, scripts/** ,
data/**, next.config.mjs, /triage-embed route file. Recommendation JSON
contract read-only. No new dependencies. Report to codex-to-claude.md.
