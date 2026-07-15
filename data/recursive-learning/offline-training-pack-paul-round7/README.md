# Carevo Offline Training Pack

This pack was generated from ER-partner-reviewed REE preference rows.

## Status

- Rows: 26
- Train rows: 20
- Holdout rows: 6
- Ready for smoke dry-run: yes
- Ready for real training: yes
- Training allowed: no

## What This Can Be Used For

- Testing that a future local training toolchain can read Carevo preference rows.
- Running a tiny smoke training job to validate formatting only.
- Reviewing what the extractor should learn: ask clarifying questions, avoid assuming severity, and preserve safety floors.

## What This Must Not Be Used For

- Do not deploy a model from this pack.
- Do not use model output to choose final care level.
- Do not weaken emergency hard stops or deterministic route rules.

## Next Real Data Goal

Collect at least 25 approved rows before a meaningful offline experiment, and preferably 100+ approved rows before judging model quality.
