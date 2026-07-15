# REE Experimental 526-Row Status

Date: 2026-07-13

## Summary

Carevo now has a larger offline Recursive Experience Engine experiment pack.

This pack combines:

- 26 Carevo internally reviewed preference rows
- 500 external synthetic triage rows from `syntech-ai/medical-triage-500`

The pack is useful for offline REE experimentation, formatting validation, and smoke training. It is not cleared for production model training or commercial deployment because the external synthetic dataset is licensed `cc-by-nc-4.0`.

## Dataset Counts

- Total preference rows: 526
- Internal reviewed rows: 26
- External synthetic rows: 500
- Commercial use allowed: no
- Offline experiment only: yes
- Training allowed: no
- Promotion allowed: no

## Synthetic Dataset Mapping

The 500 external synthetic rows were mapped conservatively into Carevo-style targets:

- emergency: 224
- er: 103
- urgent_care: 98
- home_care: 75

The source synthetic urgency labels were:

- immediate: 230
- urgent: 195
- routine: 75

## Experimental Pack

Generated pack:

`data/recursive-learning/offline-training-pack-ree-experimental-526/`

Pack split:

- Train rows: 395
- Holdout rows: 131
- Ready for smoke dry-run: yes
- Structurally ready for real offline experiment: yes
- Real production training allowed: no

## Smoke Training Result

Smoke training passed after adding external synthetic metadata calibration patterns.

- Learned calibration patterns: 14
- Holdout passed: 131 / 131
- Holdout coverage: 100%
- Live routing changed: no
- Emergency hard stops changed: no
- Model chooses care level: no
- Promotion allowed: no

## What This Means

This is a working offline REE experiment loop. It proves that Carevo can:

- ingest external synthetic benchmark rows
- convert them into extractor/interview preference rows
- merge them with internally reviewed rows
- create a larger offline training pack
- run smoke training against a holdout set
- keep production blocked by policy flags

## What This Does Not Mean

This is not a deployable clinical model.

Reasons:

- The 500-row external dataset is noncommercial.
- The external rows are synthetic, not clinician-approved.
- The smoke trainer validates formatting and calibration coverage, not clinical correctness.
- Production still requires zero under-triage on the full Carevo safety gates.

## Next Gate

Before anything moves beyond offline experimentation:

1. Run juror gates.
2. Run the 45-case multi-turn dataset gate.
3. Run the 240-case safety gate.
4. Keep under-triage at 0.
5. Get commercial permission or replace the 500 synthetic rows with commercial-safe / reviewed data.

