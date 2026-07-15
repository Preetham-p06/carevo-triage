# REE Checkpoint - 2026-07-13

## Current Status

The deterministic safety-floor hardening pass is in progress and saved.

Completed checkpoint:

- Offline engine eval passed.
- TypeScript check passed.
- Live 45-case multi-turn gate passed after safety-floor additions.
- Completed 45-case output:
  - `data/recursive-learning/juror-dataset-2026-07-13T19-36-00-038Z.jsonl`
  - `data/recursive-learning/juror-ree-experimental-526-45case-after-floors.json`
- Completed 45-case metrics:
  - Total: 45
  - Scored: 45
  - Exact: 38
  - Over: 7
  - UNDER: 0
  - Exact accuracy: 84.4%
  - Safe-or-exact: 100%
  - Promotion-ready for this gate: true

## Code Changes Saved

Updated `app/api/triage/route.ts` with raw-text safety floors for cases where the extractor fell into fallback/default features:

- Altered mental status with liver/coagulation danger signs -> ER
- Pediatric severe abdominal pain with fever/guarding signs -> ER
- Asthma worsening despite rescue inhaler use -> ER
- Severe COPD flare wording with purulent sputum/rescue-medicine escalation -> ER
- Sudden severe flank pain with vomiting or groin radiation -> ER
- Fever with headache plus neck stiffness/light sensitivity -> ER
- Lockjaw or muscle spasms after wound exposure -> ER
- Worsening febrile sore throat or trouble swallowing -> urgent care
- COPD/smoking history with worsening cough or breathing symptoms -> urgent care
- Flu-like systemic illness -> urgent care
- Pediatric asthma with fever/cough -> urgent care
- Older adult severe/recurrent vertigo -> urgent care

Also tightened the pediatric asthma floor so family-history/hay-fever eczema cases do not accidentally match.

## Interrupted Work

A second live 45-case rerun was started after tightening the pediatric asthma floor, but it was interrupted when internet/provider connectivity became unreliable.

Visible progress before interruption:

- Case 1 exact ER
- Case 2 exact ER
- Case 3 exact ER
- Case 4 exact ER
- Case 5 exact ER
- Case 6 over emergency
- Case 7 exact ER
- Case 8 exact ER
- Case 9 exact ER
- Case 10 exact ER
- Case 11 exact ER
- Case 12 over emergency
- Case 13 exact ER
- Case 14 over emergency
- Case 15 exact ER
- Case 16 exact urgent care
- Case 17 exact urgent care
- Case 18 was interrupted

The dev server was stopped cleanly after interruption.

## Resume Steps

When internet is stable again:

1. Start the dev server.
2. Re-run the 45-case live gate after the tightened floor.
3. If it passes with 0 UNDER and no provider errors, run the 240-case API gate.
4. If the 240-case gate also passes with 0 UNDER, update the REE status report and keep the recursive model offline until data-license and human-review gates are satisfied.

Recommended commands:

```bash
cd ~/Documents/Claude/Projects/Carevo/triage-web
set -a
source .env.local
set +a
npm run dev -- --webpack
```

In a second terminal:

```bash
cd ~/Documents/Claude/Projects/Carevo/triage-web
set -a
source .env.local
set +a
TRIAL_KEY=carevo-trials-x7k2 npm_config_cache=.codex-npm-cache npm run ree:juror -- \
  --dataset=/Users/preethamprabhu/.codex/attachments/954a6282-84ba-4032-bceb-3d272972bc73/pasted-text.txt \
  --output=data/recursive-learning/juror-ree-experimental-526-45case-after-tightened-floors.json
```

If that passes:

```bash
cd ~/Documents/Claude/Projects/Carevo/triage-web
set -a
source .env.local
set +a
TRIAL_KEY=carevo-trials-x7k2 node_modules/.bin/sucrase-node scripts/run-clinical-dataset.ts \
  --input=data/recursive-learning/synthetic-240-benchmark.jsonl \
  --mode=api-multiturn \
  --output=data/recursive-learning/synthetic-240-results-after-floors-2026-07-13.jsonl
```

## Resume Update - 2026-07-13 Late Session

The tightened 45-case live gate was re-run successfully after the pediatric asthma floor was narrowed.

Clean tightened 45-case output:

- `data/recursive-learning/juror-dataset-2026-07-14T01-00-46-103Z.jsonl`
- `data/recursive-learning/juror-ree-experimental-526-45case-after-tightened-floors-retry.json`

Clean tightened 45-case metrics:

- Total: 45
- Scored: 45
- Exact: 37
- Over: 8
- UNDER: 0
- Provider/API errors: 0
- Exact accuracy: 82.2%
- Safe-or-exact: 100%
- Promotion-ready for this gate: true

The 240-case live API gate was attempted after the 45-case pass.

First 240 attempt found a stroke-like wording gap:

- Missed rows included synthetic stroke phrases such as one-sided numbness, suddenly cannot lift an arm, abrupt trouble speaking, sudden vision trouble, and difficulty walking.
- Added stronger stroke FAST-style emergency detection in `lib/emergency.ts`.
- Added eval regressions for those exact phrases in `scripts/eval-engine.ts`.

Second 240 attempt confirmed the stroke block was fixed, then found a breathing wording gap:

- Missed rows included asthma symptoms worsening despite repeated rescue inhaler use.
- Missed rows included severe breathlessness at rest where the patient could only speak a few words.
- Added stronger breathing hard-stop patterns in `lib/emergency.ts`.
- Expanded the asthma raw ER floor in `app/api/triage/route.ts`.
- Added an eval regression for the "can only speak a few words" breathing pattern.

After these patches:

- TypeScript passed.
- Offline engine eval passed with 0 under-triage and 0 safety failures.
- The restarted 240-case run passed the chest-pain block, the full stroke block, and the full severe-breathing/low-oxygen block without under-triage.
- The run then became provider-unstable in the high-risk fever/infection block, producing repeated API/provider errors.
- The run was stopped around case 74 because provider errors make the promotion gate invalid even when clinical routing is safe.

Current next step:

1. Wait for provider stability or switch to a more reliable provider/key.
2. Re-run the full 240-case API gate from the beginning.
3. The target is still 240/240 scored, 0 UNDER, 0 provider/API errors.
4. Do not promote or train the recursive model until that clean 240-case gate passes.

## Resume Update - 2026-07-14 240-Case Failure Cluster

A later 240-case run progressed past the chest, stroke, severe-breathing, and high-risk fever blocks, then exposed a new clustered failure pattern.

Observed under-triage clusters:

- Pregnancy with abdominal pain plus vaginal bleeding was sometimes routed below ER.
- Lip/tongue swelling with trouble breathing after peanuts was sometimes routed below ER/emergency.
- Vomiting blood plus black tarry stools with dizziness was sometimes routed below ER.
- Pediatric fever/sore throat with exudative pharyngitis and enlarged cervical lymph nodes was sometimes routed to telehealth instead of urgent care.

Patches added:

- ER raw-text floor for pregnancy with abdominal pain plus vaginal bleeding.
- ER raw-text floor for vomiting blood or black tarry stools with dizziness.
- Emergency hard-stop phrase for lip/tongue/facial swelling with trouble breathing.
- Urgent-care raw-text floor expansion for pediatric exudative sore throat with cervical nodes.
- Regression coverage for the allergic-airway phrase.

Required next gate:

1. Run TypeScript and offline eval.
2. Re-run the full 240-case API gate from the beginning.
3. Accept the run only if it finishes with 240 scored, 0 UNDER, and 0 provider/API errors.
