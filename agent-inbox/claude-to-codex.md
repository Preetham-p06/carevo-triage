# Task brief for Codex — from Claude (round 31): LIVE ROUTING ANIMATION — "THE ENGINE DECIDES"

Written: 2026-07-19. UI-ONLY. Target: replace the .mosaic block in
public/landing-v2.html (keep its container position/margins) with a
SEQUENCED, LOOPING animation. HTML/CSS/vanilla JS inline only (CSP). NO
drawn figures, NO illustrations — cards, chips, text, one SVG path layer.
The card design language from the current mosaic is the style guide
(white cards, slate borders, layered shadows, Plus Jakarta Sans).

## Concept (Preetham's): a 10s loop, 3 rotating scenarios

Each loop: symptoms TYPE themselves into an intake card → an engine gauge
CHARGES red→amber→green while analysis labels tick → a light trail fires
from the engine to ONE of three destination chips — a DIFFERENT one each
loop. The rotation is the message: same engine, different inputs,
different (correct) door.

## Layout (desktop, inside current mosaic container ~1080px)

- LEFT (x≈0-32%): intake card "01 · PATIENT INPUT" — terminal-style line
  with blinking caret where text types char-by-char (~35ms/char, JS).
- CENTER (x≈40-60%): engine card "02 · CAREVO ENGINE" — circular gauge
  (conic-gradient ring, 72px) that sweeps 0→100% colored red→amber→green
  as it fills; under it three 10px mono labels that light up in sequence:
  "extracting facts" → "clinical rules" → "scoring". Small EKG squiggle in
  the card header (reuse from earlier work if present).
- RIGHT (x≈70-100%): three destination chips stacked vertically, 14px
  gaps: [ER — red-200 border/red-700 text] [URGENT CARE — amber]
  [TELEHEALTH — teal]. Idle state: 45% opacity.
- TRAIL LAYER: absolutely-positioned SVG spanning center→right with three
  pre-drawn smooth curves (engine right edge → each chip's left edge).
  "Professional lightning" = 2.5px stroke, gradient #93c5fd→#2563eb,
  stroke-dasharray with animated dashoffset so light FLOWS along it, plus
  a soft 4px blur glow copy underneath at 30% opacity. No zigzag cartoon
  bolts.

## Scenario data (rotate in order, one per loop)

1. type: "chest feels tight… my left arm aches" → dest ER
   labels tick fast, gauge fills FAST and stays RED-heavy → trail to ER,
   chip flashes with "EMERGENCY NET" micro-tag.
2. type: "twisted my ankle, swollen but I can walk" → dest URGENT CARE
   normal speed, gauge ends GREEN → trail to URGENT CARE, micro-tag
   "2 CLINICS NEARBY".
3. type: "itchy rash on my arm, two days, no fever" → dest TELEHEALTH
   gauge ends GREEN → trail to TELEHEALTH, micro-tag "SEEN FROM HOME".

## Timeline per loop (10s, JS-driven state machine adding CSS classes)

- 0.0-2.8s  typing (caret blinks; other elements idle)
- 2.8-3.0s  input card emits a small pulse; a dot travels input→engine
- 3.0-5.2s  gauge sweep + the three labels light sequentially (720ms each)
- 5.2-5.5s  engine pulse (scale 1→1.04→1, shadow bloom)
- 5.5-6.3s  trail lights to the scenario's chip (dashoffset animation)
- 6.3-8.8s  chip active: full opacity, colored border+glow, check icon
  pops (scale .6→1 spring), micro-tag fades in
- 8.8-10s   everything eases back to idle; next scenario begins
- prefers-reduced-motion: no loop — render scenario 2's END state
  statically (typed text, green gauge, urgent-care chip active).

## Rules

- Mobile <900px: stack the three cards vertically, hide the trail SVG,
  keep typing + gauge + chip-highlight cycle (it still rotates).
- All timing via CSS transitions/keyframes toggled by ~40 lines of JS
  (setTimeout chain or single rAF timeline). Loop must be leak-free.
- Text values verbatim from scenario data. Keep the stat strip card
  ("0 · 96.7% · 91.1%") BELOW the animation, centered, from the current
  mosaic — it stays.

## Verify then push

1. Watch 3 full loops in-browser: each scenario picks its OWN chip; no
   layout shift; loop resets clean; console error-free.
2. Screenshots 1440 + 390 mid-animation; reduced-motion static state.
3. tsc + offline eval (sucrase-node scripts/eval-engine.ts) green; routes
   200. Commit "live routing animation: the engine decides", push, report.

Boundaries: public/landing-v2.html + app/globals.css only.
