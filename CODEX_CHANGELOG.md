# CODEX Changelog

## 2026-07-08

- Polished `public/landing-v2.html` mobile responsiveness without changing the section order or page structure.
  - Tightened the fixed nav for small screens.
  - Added mobile-specific hero spacing, card stacking, and isometric SVG scaling.
  - Converted the dashboard table into readable card rows on phones.
  - Added focus states and reduced-motion support for production accessibility.
- Updated `app/layout.tsx` metadata copy to avoid banned medical-labeling wording.
- Created `app/triage/page.tsx` as a lightweight landing link target for the Carevo intake flow.
- Created `app/contact/page.tsx` as a lightweight landing link target for book-a-call traffic.
- Created `app/company/page.tsx` as a lightweight landing link target for company overview traffic.

## 2026-07-08

- Reworked `public/landing-v2.html` toward the Vela-inspired direction requested by the user while preserving the existing section order.
  - Replaced skinny hero/section typography with heavier Plus Jakarta Sans styling.
  - Changed the hero highlight from always-blue text to a black text shimmer that passes through on load.
  - Strengthened the faded healthcare-facility background treatment.
  - Added Products and How-it-works dropdown menus in the floating nav.
  - Rebuilt the platform section as a horizontal cycling product suite with role-specific cards.
  - Made the marquee more visible with a soft gradient band, stronger type, and darker text.
  - Updated stats, workflow, privacy, and CTA sections to feel smoother and more business-facing.
  - Replaced placeholder landing links with real in-page or Carevo route targets.
  - Adjusted the hero shimmer so it appears on load and then settles back to black text.
  - Replaced skinny serif text in the hero workflow cards with heavier product-site typography.
- Expanded `app/company/page.tsx` into a full Carevo company page using the provided founder and mission material.
- Expanded `app/contact/page.tsx` into a minimal business contact page using `hello@carevoai.com`.

## 2026-07-08

- Upgraded the linked marketing pages into finished pages.
  - Expanded `app/triage/page.tsx` into a polished Try Carevo page with demo preview, safety flow, care levels, and launch CTA.
  - Expanded `app/contact/page.tsx` with inquiry categories, business-facing walkthrough copy, and `hello@carevoai.com` email actions.
  - Added more visual structure to `app/company/page.tsx`, including signal tags for regulated software, autonomous systems, clinical operations, and patient workflows.
- Touched `app/globals.css` with a harmless comment to prompt the already-running dev server to regenerate its App Router CSS after production build validation.

## 2026-07-08

- Fixed `app/triage/page.tsx` so `/triage` renders the actual Carevo triage app instead of a marketing explainer page.
  - This makes the landing page `Try it` links open the real AI triage experience.

## 2026-07-09

- Completed a route and publish-readiness pass for the marketing site and triage entrypoint.
  - Added `app/privacy/page.tsx` so the landing footer Privacy link no longer goes to a missing page.
  - Added `app/terms/page.tsx` so the landing footer Terms link no longer goes to a missing page.
  - Confirmed `/company`, `/contact`, `/triage`, `/privacy`, `/terms`, and `/landing-v2.html` load successfully in the browser.
- Hardened site-wide security headers in `next.config.mjs`.
  - Added HSTS, CSP, cross-origin opener policy, DNS prefetch control, and cross-domain policy restrictions.
  - Kept microphone and geolocation available for same-origin Carevo features while blocking camera and payment access.
  - Allowed `127.0.0.1` and `localhost` as development origins so Next 16 hot reload works on the local Mac browser.
  - Made the CSP development-aware so React local debugging can run without weakening the production script policy.
- Cleaned old restricted medical-label wording from live app copy and triage prompts.
  - Updated `app/page.tsx`, `app/api/triage/route.ts`, `app/avs/page.tsx`, `lib/store.ts`, and `lib/validation.ts`.
  - Renamed the after-visit summary field to `visitSummary`.
- Upgraded publish dependencies to clear security audit findings.
  - Updated `next` to `16.2.10`.
  - Added a `postcss` override and pinned the direct dev dependency to the patched `8.5.16` range.
  - Refreshed `package-lock.json`.
- Fixed production CSS compatibility for the newer Next compiler by moving the Google Fonts import before Tailwind directives in `app/globals.css`.
- Restarted the existing port 3000 dev server in polling mode because the Mac hit the file-watcher limit after the upgrade.

## 2026-07-09

- Separated the marketing navigation from the triage app navigation.
  - Updated `components/Nav.tsx` so `/company`, `/contact`, `/privacy`, and `/terms` use a marketing-style header instead of the app header.
  - Changed the app header `Home` tab to `AI Triage`, pointing to `/triage`.
  - Changed the app logo link to return to `/landing-v2.html` instead of the triage app.
  - Updated `public/landing-v2.html` so the logo stays on the landing page and `AI Triage` appears as its own top-level header link.
  - Kept `Try it` pointed at `/triage`, where the actual AI triage system loads.
- Polished the marketing header in `components/Nav.tsx` so Company, Contact, Privacy, and Terms visually match the landing page header.
  - Added the same Carevo logo mark treatment.
  - Matched the floating rounded navigation shell.
  - Switched the marketing `Try it` CTA to the same blue product-site styling.

## 2026-07-09

- Embedded the live AI triage experience into the main landing page instead of sending marketing visitors to a separate-looking app page.
  - Added a new `#ai-triage` section to `public/landing-v2.html`.
  - Added an embedded product frame that loads `/triage-embed` inside the landing page.
  - Created `app/triage-embed/page.tsx` as the app experience without the app navigation bar.
  - Updated landing page `AI Triage`, `Try it`, hero CTA, and platform footer links to scroll to the embedded section.
  - Updated marketing-page navigation in `components/Nav.tsx` so `AI Triage` and `Try it` return to `/landing-v2.html#ai-triage`.
  - Added `frame-src 'self'` to `next.config.mjs` so the same-origin product embed is explicitly allowed.

## 2026-07-09

- Restored the marketing site and triage app as two clear experiences.
  - Removed the embedded triage section from `public/landing-v2.html` so the homepage keeps its original product flow, including the "One coordinated suite" section.
  - Shortened the marketing navigation label from `AI Triage` to `Triage` for a cleaner Vela-style header.
  - Updated landing page `Triage`, `Try it`, hero CTA, and footer platform links to open `/triage`.
  - Rebuilt `app/triage/page.tsx` as a polished dedicated product page that embeds the live Carevo intake flow.
  - Kept `app/triage-embed/page.tsx` as the hidden-navigation app surface used inside the dedicated triage page.
  - Updated `next.config.mjs` so `/triage-embed` can be framed only by the same site while the rest of the app keeps strict frame blocking.

## 2026-07-09

- Unified the marketing navigation island across the homepage, Triage, Company, and Contact pages.
  - Updated `public/landing-v2.html` to use the same cleaner pill navigation style as the React marketing routes.
  - Updated `components/Nav.tsx` so the React marketing header matches the homepage width, spacing, and CTA treatment.
- Rebuilt `app/company/page.tsx` in the Vela-inspired company-page style using Carevo-specific copy.
  - Added a concise origin story around Paul, Preetham, and Krish's three perspectives.
  - Added institution cards for The Ohio State University, American Regent, and Nationwide / Memorial Health.
  - Added the requested principles section and founder cards with circular portraits.
- Rebuilt `app/contact/page.tsx` as a minimal Vela-inspired contact page.
  - Changed the contact email to `usecarevoai@gmail.com`.
  - Kept the page focused on general inquiries only for now.
- Added founder portrait assets:
  - `public/founders/krish-panicker.png`
  - `public/founders/preetham-prabhu.png`
  - `public/founders/paul-alexander.png`
- Added lightweight marketing reveal animation utilities in `app/globals.css`.

## 2026-07-09

- Replaced Carevo logo marks with the provided new logo asset.
  - Added `public/brand/carevo-logo.png`.
  - Updated the React navigation logo in `components/Nav.tsx`.
  - Updated the homepage header and footer logos in `public/landing-v2.html`.
- Refined `app/company/page.tsx` to more closely match the Vela-style company hero reference.
  - Centered the hero section with a small Company pill.
  - Split the headline into black and blue lines.
  - Reordered the founders to Preetham, Paul, then Krish.
  - Added scroll-reveal animation classes through the Company page sections.
- Added the `scroll-reveal` utility in `app/globals.css` for smoother section entrance animations.

## 2026-07-09

- Completed a mobile-web compatibility pass for the marketing and triage entry pages.
  - Removed the viewport maximum-scale lock in `app/layout.tsx` so phone users can pinch-zoom.
  - Added a global horizontal-overflow guard in `app/globals.css`.
  - Added a fallback for scroll reveal animations on mobile browsers that do not support view timelines.
  - Tightened phone typography, spacing, badges, and frame sizing on `app/triage/page.tsx`.
  - Tightened phone typography, hero spacing, cards, and CTA widths on `app/company/page.tsx`.
  - Tightened phone typography, card padding, email wrapping, and CTA widths on `app/contact/page.tsx`.

## 2026-07-09

- Added mobile navigation access for the marketing site.
  - Added a mobile `Menu` button and slide-out sidebar to `components/Nav.tsx` for `/triage`, `/company`, `/contact`, `/privacy`, and `/terms`.
  - Added the same mobile `Menu` button and sidebar to `public/landing-v2.html`.
  - Included direct mobile links for Products, Triage, How it works, Company, Contact, and Try it.

## 2026-07-09

- Fixed the mobile triage experience.
  - Updated `app/triage/page.tsx` so phones render the real triage app directly instead of inside the embedded iframe wrapper.
  - Kept the polished embedded product frame for tablet and desktop layouts.
  - Updated `app/page.tsx` input behavior with `enterKeyHint="send"` for mobile keyboards.
  - Increased the mobile send button tap target so the triage input is easier to use on phones.

## 2026-07-09

- Fixed the mobile triage send button tap behavior.
  - Changed the arrow button in `app/page.tsx` to trigger the send action directly instead of relying only on form submission.
  - Added mobile touch-action handling to make taps more reliable in phone browsers and message-app previews.
  - Added a DOM-value fallback so the send action reads the visible text box value even if mobile input state lags behind.
  - Kept the button tappable while empty and let the send handler safely ignore empty input, preventing stale disabled states on phones.

## 2026-07-09

- Added presentation-type routing support for the clinical interview layer.
  - Added `presentationType` to `lib/engine/features.ts` with deterministic fallback inference.
  - Updated the extractor contract in `app/api/triage/route.ts` so the LLM can label the interview lane, while the server still recomputes the safe fallback.
  - Added presentation-specific EVOI question ladders in `lib/engine/evoi.ts` for cardiac, neuro, respiratory, GI, MSK, urinary, skin, pediatric, allergic, eye, dental, and mental-health presentations.
  - Added required critical-info guards so high-risk presentation lanes ask focused red-flag questions before deciding unless an ER/emergency floor has already fired.
  - Expanded `lib/emergency.ts` high-alert classification beyond chest symptoms so isolated numbness/weakness and breathing complaints trigger focused interviews, while clustered emergency wording still hard-stops.
  - Added offline eval coverage for isolated numbness vs. clustered stroke symptoms and neuro-specific EVOI question selection.

## 2026-07-09

- Added a clinical dataset ingestion and evaluation utility.
  - Created `scripts/run-clinical-dataset.ts` to read JSONL or CSV vignette datasets with urgency labels.
  - Added `npm run dataset:eval` for running the utility.
  - Added API evaluation mode that posts cases to `/api/triage`, computes exact/over/under/error counts, and immediately flags under-triage.
  - Added prep mode that writes structured JSONL for future local-model training experiments while preserving Carevo's rule that live routing stays deterministic.
  - Generated `data/dataset-evals/attached-carevo-prep.jsonl` from the attached 45-case dataset.

## 2026-07-09

- Added multi-turn simulated-patient support to the clinical dataset evaluator.
  - Added `--mode=api-multiturn` to `scripts/run-clinical-dataset.ts`.
  - The evaluator now keeps the Carevo API conversation alive when the API asks follow-up questions.
  - Added a separate simulated patient answerer that answers each follow-up from the original vignette, with a deterministic fallback if no answerer API key is available.
  - Capped the simulated loop at 5 follow-ups so requests stay within the triage API's 12-message validation limit.
  - Added clean handling for backend provider degradation so those cases are reported as API-provider errors instead of fake patient turns.

## 2026-07-09

- Added the first safe Recursive Experience Engine pipeline scaffold.
  - Added `db/migrations/20260709_create_carevo_ree_telemetry.sql` for future PostgreSQL telemetry storage.
  - Added `scripts/ree/coroner.ts` to isolate sessions with too many turns or marked over-triage review.
  - Added `scripts/ree/architect.ts` to generate reviewable candidate preference-training rows from anomalous sessions.
  - Added `scripts/ree/juror.ts` to run typecheck, engine evals, and optional multi-turn dataset gates before any model promotion is considered.
  - Added `scripts/ree/README.md` with operating instructions.
  - Added `data/recursive-learning/sample-telemetry.jsonl` so the offline pipeline can be smoke-tested before PostgreSQL telemetry is live.
  - Added `npm run ree:coroner`, `npm run ree:architect`, and `npm run ree:juror` shortcuts.
  - Generated smoke-test outputs under `data/recursive-learning/`: `anomalies-smoke.jsonl`, `coroner-smoke-report.json`, `dpo-candidates-smoke.jsonl`, `architect-smoke-report.json`, and `juror-smoke-report.json`.
  - Kept model promotion manual: the juror writes a promotion-ready report but does not change production model pointers.

## 2026-07-09

- Wired the REE pipeline into the live triage API behind production-safe flags.
  - Added `lib/ree/telemetry.ts` to emit final-session telemetry only when `REE_TELEMETRY_ENABLED=1`.
  - The telemetry sender posts to `REE_TELEMETRY_ENDPOINT` with an optional bearer secret and does not log patient conversation text by default.
  - Added final-outcome telemetry calls for self-harm support, hard emergency stops, engine emergency outcomes, and standard recommendations.
  - Added token accumulation for extractor/phraser usage so REE can track session cost.
  - Added `scripts/ree/readiness.ts` and `npm run ree:readiness` for production readiness checks across typecheck, engine eval, core pages, and emergency hard-stop API behavior.
  - Updated `.env.local.example` with model-provider, trial, metrics, and REE telemetry environment variables.
  - Updated `scripts/ree/README.md` with production wiring and launch-gate instructions.
  - Generated `data/recursive-learning/production-readiness-smoke.json`.

## 2026-07-09

- Hardened provider configuration after local keys were exposed in chat.
  - Updated `app/api/triage/route.ts` so the server prefers OpenAI first, then NVIDIA, then GitHub Models.
  - Scrubbed exposed local `.env.local` provider values into placeholders.
  - Left `OPENAI_API_KEY=REPLACE_WITH_NEW_OPENAI_KEY` as the intended active provider slot.
  - Disabled Anthropic, Google Places, NVIDIA, and GitHub token entries locally until fresh keys are generated.

## 2026-07-09

- Fixed local environment and no-key API readiness behavior.
  - Replaced a malformed raw provider-key line in `.env.local` with the proper `OPENAI_API_KEY=REPLACE_WITH_NEW_OPENAI_KEY` placeholder.
  - Updated `app/api/triage/route.ts` so missing provider keys no longer crash module initialization before deterministic emergency hard stops can run.

## 2026-07-09

- Switched local placeholder provider configuration to NVIDIA Build.
  - Disabled the local OpenAI placeholder variable.
  - Added the requested fake NVIDIA placeholder key under `NVIDIA_API_KEY`.
  - Set `LLM_MODEL=meta/llama-3.1-8b-instruct` so local testing uses the NVIDIA-compatible model name.

## 2026-07-10

- Hardened the multi-turn clinical dataset evaluator and REE juror gate.
  - Improved simulated-patient answers for red-flag follow-up questions so the harness answers short yes/no safety questions from the original vignette instead of pasting noisy case text.
  - Added progress streaming for dataset evals and the REE juror dataset step so long multi-turn runs show live case-by-case status in Terminal.
  - Added raw-text ER safety floors in `app/api/triage/route.ts` for low oxygen saturation, fever with travel or mosquito exposure, child fever with rash/systemic symptoms, unilateral painful swollen leg with clot risk factors, and child bloody diarrhea with systemic risk markers.
  - Added raw-text urgent-care safety floors for upper abdominal pain that wakes the patient at night, older adult painful vesicular rash, prolonged sinus symptoms with facial pain or discharge, and child foodborne GI symptoms with systemic findings.
  - Generated dataset gate artifacts under `data/recursive-learning/`, including `harness-full-after-all-urgent-floors.jsonl` and `juror-dataset-2026-07-10T00-58-40-130Z.jsonl`.
  - REE juror now passes the attached 45-case multi-turn dataset with zero under-triage.

## 2026-07-10

- Tuned over-triage after the zero-under-triage safety pass.
  - Added a narrow raw-text feature correction layer for clearly benign presentations after emergency screening but before engine scoring.
  - Corrected extractor overstatement for uncomplicated viral URI, bronchitis, conjunctivitis, allergic rhinitis, mechanical back pain without neurologic signs, local bee sting, recurrent canker sore, uncomplicated stye, uncomplicated eczema, uncomplicated constipation, and uncomplicated yeast symptoms.
  - Added bounded urgent-care corrections for ear infection, high-Centor sore throat, back pain with foot drop, and shingles so those patterns remain same-day care without being pushed to ER by noisy severity/impact extraction.
  - Preserved all emergency hard stops and ER safety floors.
  - REE juror now passes the attached 45-case multi-turn dataset with 36 exact, 9 over, 0 under-triage, 80% exact accuracy, and 100% safe-or-exact.
  - Generated `data/recursive-learning/harness-full-after-second-benign-pass.jsonl` and `data/recursive-learning/juror-dataset-2026-07-10T04-15-31-098Z.jsonl`.

## 2026-07-10

- Added and started a larger 240-case synthetic benchmark pass.
  - Added `scripts/generate-large-clinical-benchmark.ts` to generate a reusable 240-case JSONL suite across ER, urgent care, and home-care presentations.
  - Generated `data/recursive-learning/synthetic-240-benchmark.jsonl`.
  - First 240-case run produced 132 exact, 93 over, 15 under-triage.
  - Added additional raw-text floors for fever during chemotherapy, pediatric bloody diarrhea spelling variants, toddler ear infection wording, diabetic open sores with surrounding redness, deep cuts that may need stitches, productive cough with fever and focal lung findings, urinary symptoms with flank/lower abdominal discomfort, and injuries with deformity/marked swelling/inability to bear weight.
  - Second 240-case run improved to 151 exact, 85 over, 3 under-triage, and 1 timeout/provider error.
  - Patched the remaining observed under-route patterns; final full 240-case rerun is still pending because the Codex usage limit blocked the last local API run.

## 2026-07-10

- Hardened the 240-case benchmark after the clean rerun.
  - Added a narrow urgent-care raw-text floor for lower-leg redness, swelling, tenderness, and fever after one remaining cellulitis-style case routed too low.
  - Updated the clinical dataset runner to retry transient timeout/fetch errors once before counting a case as an error.
  - Removed old forbidden clinical-label wording from the patient simulation guardrail text.
  - Preserved emergency hard stops and all existing safety floors.
  - Final 240-case rerun produced 155 exact, 85 over, 0 under-triage, 0 errors, 64.6% exact accuracy, and 100% safe-or-exact.

## 2026-07-10

- Prepared the first offline recursive-learning candidate dataset.
  - Added `scripts/ree/prepare-training-from-benchmark.ts` to convert clean benchmark over-triage rows into human-review-required extractor correction candidates.
  - Added `npm run ree:prepare-training` as the shortcut for rerunning this preparation step.
  - Generated `data/recursive-learning/training-candidates-overtriage-240.jsonl` with 85 candidates from the clean 240-case benchmark.
  - Generated `data/recursive-learning/training-candidates-overtriage-240.report.json`; 14 candidates are high priority, 71 are medium priority, and promotion remains explicitly disabled.

## 2026-07-10

- Added a human-readable high-priority review sheet for recursive-learning candidates.
  - Created `data/recursive-learning/HIGH-PRIORITY-TRAINING-REVIEW.md` with the 14 high-priority over-triage cases.
  - Each row includes the patient text, expected route, Carevo route, extracted factors, feature keys, correction goal, and reviewer decision boxes.
  - The sheet is for human approval only and does not train or promote any model.

## 2026-07-10

- Applied ER-partner feedback to the high-priority recursive-learning review set.
  - Added `data/recursive-learning/high-priority-review-decisions.json` to record approve/reject/needs-clinician/duplicate decisions.
  - Added `scripts/ree/apply-review-decisions.ts` and `npm run ree:apply-review`.
  - Generated `data/recursive-learning/approved-training-prep-reviewed-high-priority.jsonl` with 4 approved offline training-prep rows.
  - Generated `data/recursive-learning/approved-training-prep-reviewed-high-priority.report.json` and `.md` notes.
  - Added `scripts/ree/export-approved-preference-rows.ts` and `npm run ree:export-preferences`.
  - Generated `data/recursive-learning/dpo-preference-approved-high-priority.jsonl` with 4 DPO-style preference rows for offline extractor calibration experiments.
  - Training and promotion remain disabled until offline training, full eval gates, and human review are complete.

## 2026-07-10

- Created the first offline REE training pack for smoke testing only.
  - Added `scripts/ree/create-offline-training-pack.ts` and `npm run ree:create-training-pack`.
  - Generated `data/recursive-learning/offline-training-pack-approved-high-priority/` with preference train/holdout rows and SFT smoke-test rows.
  - The pack contains 4 approved rows split into 3 train rows and 1 holdout row.
  - The manifest marks smoke dry-run as ready, real training as not ready, and training promotion as disabled.
  - Added `scripts/ree/check-training-pack.ts` and `npm run ree:check-training-pack`.
  - Generated `data/recursive-learning/offline-training-pack-approved-high-priority/pack-check-report.json`, confirming the pack is valid and real training is blocked correctly.

## 2026-07-11

- Applied the expanded clinical review to the high-priority REE training candidates.
  - Updated `data/recursive-learning/high-priority-review-decisions.json` from 4 approved rows to 13 approved rows and 1 rejected row.
  - Rejected `case-0171` because new foot drop must remain ER-level and should not teach lower routing.
  - Approved benign over-triage patterns for sore throat, conjunctivitis-style eye symptoms, eyelid swelling, allergic rhinitis, eczema-style symptoms with denied infection red flags, and mechanical low back pain without neurologic red flags.
  - Regenerated `data/recursive-learning/approved-training-prep-reviewed-high-priority.jsonl` with 13 approved offline preparation rows.
  - Regenerated `data/recursive-learning/dpo-preference-approved-high-priority.jsonl` with 13 preference rows.
  - Regenerated `data/recursive-learning/offline-training-pack-approved-high-priority/` with 10 train rows and 3 holdout rows.
  - Re-ran the training pack checker; the pack is valid for smoke dry-run and still correctly blocks real training.

## 2026-07-11

- Applied the next clinically verified REE candidate batch.
  - Added 13 approved over-triage correction rows for pediatric strep-pattern sore throat, pediatric acute otitis media, uncomplicated shingles, localized paronychia, chronic allergic rhinitis, and mild vomiting with tolerated fluids.
  - Marked sudden eye-pain/photophobia/blurred-vision rows and severe spinning-dizziness rows as `needs_clinician` so they cannot enter training without additional review.
  - Expanded `scripts/ree/apply-review-decisions.ts` guidance for ear infection, shingles-style rash, nail-fold infection, allergic rhinitis, and mild vomiting patterns.
  - Regenerated `data/recursive-learning/approved-training-prep-reviewed-high-priority.jsonl` with 26 approved rows.
  - Regenerated `data/recursive-learning/dpo-preference-approved-high-priority.jsonl` with 26 preference rows.
  - Regenerated `data/recursive-learning/offline-training-pack-approved-high-priority/` with 20 train rows and 6 holdout rows.
  - Re-ran the training pack checker; the pack is valid, smoke dry-run ready, structurally over the 25-row real-training minimum, and still blocks live training/promotion through `trainingAllowed: false`.

## 2026-07-11

- Added and ran the first offline REE smoke-training dry run.
  - Added `scripts/ree/smoke-train-offline.ts` and `npm run ree:smoke-train`.
  - Updated `scripts/ree/create-offline-training-pack.ts` to use a balanced holdout split by source pattern and reviewer target instead of holding out only the highest-sorted case IDs.
  - Generated `data/recursive-learning/offline-training-pack-approved-high-priority/smoke-training-report.json`.
  - Generated `data/recursive-learning/offline-training-pack-approved-high-priority/smoke-calibration-artifact.json`.
  - Smoke dry run used 20 train rows and 6 holdout rows.
  - Learned 9 offline calibration patterns and covered 6/6 holdout rows.
  - No live routing, emergency hard stops, deterministic route rules, or model pointers were changed.
  - `trainingAllowed` and `promotionAllowed` remain false; this validates the offline data loop only.

## 2026-07-11

- Continued REE post-smoke gate checks.
  - Ran the offline REE juror gate with `--skip-dataset`; it passed with no failed steps.
  - Ran production build verification; Next.js build completed successfully and compiled `/company`, `/contact`, `/triage`, and `/api/triage`.
  - Ran readiness against the already-running local dev server; `/landing-v2.html` passed but `/company`, `/contact`, `/triage`, and `/api/triage` returned 500 from that live process.
  - Added `data/recursive-learning/offline-training-pack-approved-high-priority/POST-SMOKE-GATE-REPORT.md` to separate the passing offline REE/build gates from the stale/unhealthy local dev-server readiness failure.
  - No live routing, emergency hard stops, deterministic route rules, or model pointers were changed.

## 2026-07-11

- Continued REE gate hardening after the local dev server was restarted.
  - Re-ran readiness successfully after restart; pages and emergency hard-stop API passed.
  - Ran the full 45-case multi-turn juror dataset after the REE smoke artifact; first run found one under-triage on uncomplicated urinary symptoms.
  - Added a narrow urgent-care raw-text floor in `app/api/triage/route.ts` for painful urination with urgency or frequency.
  - Re-ran the 45-case multi-turn juror dataset; it passed with 32 exact, 13 over, 0 under-triage, 100% safe-or-exact.
  - Ran a 240-case benchmark pass; it found one under-triage on upper abdominal gnawing pain that wakes the patient at night.
  - Tightened the existing night-epigastric urgent-care floor so it catches wording like "upper abdominal gnawing pain".
  - TypeScript and the offline engine eval passed after the urinary and GI floor changes.
  - A final 240-case rerun is still required; Codex usage limits blocked the localhost/API rerun before completion.

## 2026-07-13

- Recorded the final 240-case REE smoke safety gate result.
  - User reran `scripts/run-clinical-dataset.ts` against `data/recursive-learning/synthetic-240-benchmark.jsonl`.
  - Output file: `data/recursive-learning/synthetic-240-results-after-ree-smoke-final-gate.jsonl`.
  - Result: 240 total, 240 scored, 145 exact, 95 over, 0 under-triage, 60.4% exact accuracy, 100% safe-or-exact.
  - Updated `data/recursive-learning/offline-training-pack-approved-high-priority/POST-SMOKE-GATE-REPORT.md` to mark the 45-case and 240-case safety gates complete.
  - REE remains offline only; `trainingAllowed` and `promotionAllowed` stay false.

## 2026-07-13

- Added MIMIC-IV-ED demo ingestion for REE review candidates.
  - Added `scripts/ree/import-mimic-ed-demo.ts` to read the local MIMIC-IV-ED demo zip and convert ED intake rows into Carevo review-candidate rows.
  - Added `npm run ree:import-mimic-demo` as the command shortcut.
  - Generated `data/recursive-learning/mimic-ed-demo-candidates.jsonl` with 222 external review candidates.
  - Generated `data/recursive-learning/mimic-ed-demo-candidates.report.json` with counts by suggested care level, source acuity, confidence, and ED disposition.
  - Generated `data/recursive-learning/MIMIC-ED-DEMO-REVIEW-CANDIDATES.md` as a readable first-pass review sheet.
  - Kept all rows blocked from training and promotion by default; they are external review material only until approved.

## 2026-07-13

- Added a prioritized MIMIC ED demo review queue for the REE training path.
  - Added `scripts/ree/prepare-mimic-review.ts` to rank imported ED demo rows by review urgency.
  - Added `npm run ree:prepare-mimic-review` as the command shortcut.
  - Generated `data/recursive-learning/MIMIC-ED-DEMO-TOP-REVIEW-QUEUE.md` with the top 100 rows to review first.
  - Generated `data/recursive-learning/mimic-ed-demo-review-decisions.template.json` as a pending decision file.
  - Generated `data/recursive-learning/mimic-ed-demo-review-queue.report.json` with review queue counts.
  - Kept every row pending and blocked from training by default; approval must be explicit before any row enters offline training prep.

## 2026-07-13

- Expanded REE into a 526-row offline experimental pack.
  - Added `scripts/ree/import-synthetic-triage-500.ts` to import the `syntech-ai/medical-triage-500` dataset as external synthetic preference rows.
  - Added `scripts/ree/merge-preference-rows.ts` to combine internally reviewed rows with external synthetic rows.
  - Added `npm run ree:import-synthetic-500` and `npm run ree:merge-preferences`.
  - Generated `data/recursive-learning/external-synthetic-triage-500.raw.jsonl`.
  - Generated `data/recursive-learning/external-synthetic-triage-500.preferences.jsonl` with 500 offline-only preference rows.
  - Generated `data/recursive-learning/ree-experimental-combined.preferences.jsonl` with 526 total preference rows.
  - Generated `data/recursive-learning/offline-training-pack-ree-experimental-526/` with 395 train rows and 131 holdout rows.
  - Updated the smoke trainer to learn external synthetic metadata calibration patterns while keeping them offline-only.
  - Re-ran smoke training successfully: 14 learned patterns, 131/131 holdout rows covered, 100% smoke holdout coverage.
  - Added `data/recursive-learning/REE-EXPERIMENTAL-526-STATUS.md` summarizing the experimental pack and remaining production blockers.
  - Kept `trainingAllowed`, `promotionAllowed`, and commercial-use permission blocked because the external dataset is noncommercial synthetic data.

## 2026-07-13

- Ran REE offline readiness gates against the 526-row experimental pack.
  - Re-ran pack validation for `data/recursive-learning/offline-training-pack-ree-experimental-526/`; it passed with 526 rows, 395 train rows, 131 holdout rows, and `trainingAllowed: false`.
  - Re-ran smoke training; it passed with 14 learned calibration patterns and 131/131 holdout rows covered.
  - Re-ran the juror gate with dataset skipped; TypeScript and engine eval passed.
  - Restarted the stale local dev server with the webpack dev path because the existing Turbopack process returned HTTP 500 for `/api/triage`.
  - Re-ran the 45-case live multi-turn API gate; it failed with 12 under-triage, 27 exact, 6 over, 60% exact accuracy, and 73.3% safe-or-exact.
  - Did not rerun the 240-case API gate because the 45-case gate already failed the zero-under-triage requirement.
  - Added `data/recursive-learning/REE-OFFLINE-READINESS-REPORT-2026-07-13.md` documenting the failure list and next safety-floor hardening targets.
  - Kept REE promotion blocked; next work is deterministic safety-floor hardening, not model promotion.

## 2026-07-13

- Added deterministic raw-text safety floors for the 45-case REE under-triage findings.
  - Added ER floors in `app/api/triage/route.ts` for altered mental status with liver/coagulation danger signs, pediatric severe abdominal pain with guarding, asthma worsening despite rescue inhaler use, severe COPD flare wording, sudden severe flank pain, fever with headache plus neck stiffness/light sensitivity, and lockjaw/spasms after wound exposure.
  - Added urgent-care floors for worsening febrile sore throat, COPD/smoking history with worsening cough or breathing symptoms, flu-like systemic illness, pediatric asthma with fever/cough, and older-adult severe/recurrent vertigo.
  - These are floors-only backstops for extractor fallback cases; they do not weaken emergency hard stops, engine rules, or REE gates.
  - Re-ran the live 45-case multi-turn gate after the first safety-floor pass; it passed with 38 exact, 7 over, 0 under-triage, 84.4% exact accuracy, and 100% safe-or-exact.
  - Tightened the pediatric asthma urgent-care floor after observing one benign eczema overcatch from family-history/hay-fever wording.
  - Started a second 45-case rerun after tightening; stopped it when network/provider connectivity became unreliable. Saved resume notes in `data/recursive-learning/REE-CHECKPOINT-2026-07-13.md`.
  - Re-ran the tightened 45-case live gate cleanly; it passed with 37 exact, 8 over, 0 under-triage, 0 provider errors, 82.2% exact accuracy, and 100% safe-or-exact.
  - Began the 240-case live gate; it exposed synthetic stroke wording gaps, so `lib/emergency.ts` now hard-stops clearer FAST-style phrases such as abrupt trouble speaking, one-sided numbness/weakness, suddenly unable to lift an arm, sudden vision trouble, and difficulty walking.
  - Added regression coverage in `scripts/eval-engine.ts` for the newly covered stroke phrases.
  - Re-ran the 240-case live gate; the stroke block passed, then severe-breathing wording gaps appeared. Added emergency detection for breathlessness with only a few words spoken and expanded the asthma ER floor for repeated rescue inhaler use.
  - Added regression coverage for the severe-breathing "few words" phrase.
  - TypeScript and offline eval passed after the stroke and breathing patches.
  - A subsequent 240-case run passed the chest, stroke, and severe-breathing blocks without under-triage, then was stopped during repeated provider/API errors in the high-risk fever block. A clean 240-case rerun is still required before REE promotion.

## 2026-07-14

- Added deterministic safety backstops for the next 240-case REE failure cluster.
  - Added ER raw-text floors for pregnancy with abdominal pain plus vaginal bleeding, and for vomiting blood or black tarry stools with dizziness.
  - Added a 911 hard-stop emergency-net phrase for lip/tongue/facial swelling with trouble breathing.
  - Expanded the urgent-care sore-throat floor to catch pediatric fever plus exudative pharyngitis and enlarged cervical lymph nodes.
  - Added regression coverage for the allergic-airway emergency phrase.
  - These changes are floors-only and do not weaken the emergency net, engine rules, or REE gates.

## 2026-07-14

- Ran the Paul-batch REE offline smoke-training pass without changing production routing code.
  - Created `data/recursive-learning/offline-training-pack-paul-round7/` from `data/recursive-learning/approved-training-paul-round7.jsonl`.
  - Generated a 26-row pack with 20 train rows and 6 holdout rows.
  - Generated `manifest.json`, `pack-check-report.json`, `smoke-training-report.json`, and `smoke-calibration-artifact.json` inside the pack directory.
  - Smoke training passed with 4 learned home-care calibration patterns and 100% holdout coverage.
  - Confirmed `trainingAllowed` and `promotionAllowed` remain false.
  - Confirmed the six Paul-rejected cases are absent from the generated pack.
  - Wrote the handoff report to `agent-inbox/codex-to-claude.md`.

## 2026-07-15

- Ran the round 11 calibration-active 240-case live API gate.
  - Confirmed `data/calibration/promoted-calibration.json` exists before the run.
  - Re-ran TypeScript, offline eval, and a live emergency smoke test against port 3000.
  - Generated `data/recursive-learning/synthetic-240-results-round11-calibrated-2026-07-15.jsonl`.
  - Result: 240 total, 240 scored, 161 exact, 79 over, 0 UNDER, 0 provider errors, 67.1% exact accuracy, 100% safe-or-exact.
  - Compared against the round 9 baseline of 154 exact and 86 over; exact improved by 7.
  - Reported changed cases, non-calibration regressions, and run token usage in `agent-inbox/codex-to-claude.md`.
  - No `lib/` or `app/` files were changed.

## 2026-07-15

- Ran the round 12 8-pattern calibration gate with second-reader logging enabled.
  - Confirmed `data/calibration/promoted-calibration.json` has 8 promoted patterns before the run.
  - Created before-run checkpoint commit `5885bce`.
  - Re-ran TypeScript, offline eval, and a live emergency smoke test against port 3000.
  - First 240-case attempt produced 239 scored, 1 provider error, 0 UNDER, and was not accepted as the final gate.
  - Clean rerun generated `data/recursive-learning/synthetic-240-results-round12-8pattern-secondreader-clean-2026-07-15.jsonl`.
  - Clean rerun result: 240 total, 240 scored, 222 exact, 18 over, 0 UNDER, 0 provider errors, 92.5% exact accuracy, 100% safe-or-exact.
  - Exact improved by 5 versus the rescored round-11 baseline of 217 exact and 23 over.
  - Reported changed cases, second-reader disagreement stats, and clean-run token usage in `agent-inbox/codex-to-claude.md`.
  - No `lib/` or `app/` files were changed.

## 2026-07-15

- Started round 13 vague-patient gate work for Paul's interview-quality feedback.
  - Added six terse/vague patient personas to `scripts/simulate-patients.ts` covering chest, GI, headache, pediatric fever, back pain, and fatigue.
  - Included one chest persona that only volunteers the left-arm symptom during the open catch-all sweep.
  - Re-ran TypeScript successfully.
  - Re-ran offline eval successfully: 104 acceptable cases, 0 under-triage, 0 safety failures.
  - Could not run the live vague-persona gate or full 240-case API gate because the already-running port 3000 dev server returned HTTP 500 for `/triage` and `/api/triage`.
  - Logged the Turbopack endpoint-build failure and rerun commands in `agent-inbox/codex-to-claude.md`.
  - No `lib/` or `app/` files were changed.

## 2026-07-16

- Retried the round 13 vague-patient live gate without changing production code.
  - Re-read `agent-inbox/claude-to-codex.md` and `AGENTS.md`.
  - Confirmed the six vague-patient personas from the prior round 13 checkpoint are already present.
  - Re-ran TypeScript successfully.
  - Re-ran offline eval successfully: 104 acceptable cases, 0 under-triage, 0 safety failures.
  - Confirmed the existing port 3000 server still returns HTTP 500 for `/triage` and `/api/triage`, while `/landing-v2.html` returns HTTP 200.
  - Documented the continuing Turbopack endpoint-build failure and exact rerun commands in `agent-inbox/codex-to-claude.md`.
  - Did not start another dev server and did not edit `lib/` or `app/`.

## 2026-07-16

- Ran the round 13 vague-patient live gate after the existing port 3000 server recovered.
  - Created a before-run checkpoint commit `d0d1459`.
  - Confirmed the API accepted the correct trial request shape with HTTP 200.
  - Ran six vague-patient personas for three rounds against the live local server.
  - Result: 18 trials, 7 exact, 5 acceptable, 6 UNDER, 0 over-triage, 0 forbidden-output, 0 errors.
  - New UNDER repeated in `vague-chest-catchall` and `vague-headache-terse` across all three rounds.
  - Applied the round brief's kill-switch exception by deleting `data/calibration/promoted-calibration.json`.
  - Skipped the full 240-case gate because the vague gate already violated the absolute 0-UNDER rule.
  - Wrote the failure analysis, severity-word audit, catch-all audit, and next fix target to `agent-inbox/codex-to-claude.md`.
  - No `lib/` or `app/` files were edited.
