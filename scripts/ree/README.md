# Carevo REE Pipeline

Recursive Experience Engine is an offline learning loop for reducing wasted
questions and token cost while preserving the hard safety rule: no under-triage.

The pipeline has four parts:

1. `db/migrations/20260709_create_carevo_ree_telemetry.sql`
   creates the PostgreSQL telemetry table.
2. `npm run ree:coroner`
   finds expensive sessions: too many turns or sessions marked for over-triage review.
3. `npm run ree:architect`
   converts those sessions into candidate preference-training rows.
4. `npm run ree:juror`
   blocks promotion unless typecheck, engine evals, and dataset evals pass.

Promotion is intentionally manual. The juror writes a promotion-ready report, but
does not change production model pointers.

## Example

```bash
npm run ree:coroner -- --input=data/recursive-learning/sample-telemetry.jsonl
npm run ree:architect -- --dry-run
TRIAL_KEY=carevo-trials-x7k2 npm run ree:juror -- \
  --dataset=/Users/preethamprabhu/.codex/attachments/954a6282-84ba-4032-bceb-3d272972bc73/pasted-text.txt
```

Use `DATABASE_URL` instead of `--input` when Postgres telemetry is live.

## Production Wiring

The live triage API emits REE telemetry only when:

```bash
REE_TELEMETRY_ENABLED=1
REE_TELEMETRY_ENDPOINT=https://your-secure-backend.example.com/ree/telemetry
REE_TELEMETRY_SECRET=long-random-secret
```

The endpoint must write to encrypted PostgreSQL using the migration in
`db/migrations/20260709_create_carevo_ree_telemetry.sql`.

Do not point `REE_TELEMETRY_ENDPOINT` at a general logging service. The payload
contains health conversation text and must stay inside the protected data store.

Before launch, run:

```bash
npm run build
npm run ree:readiness
TRIAL_KEY=carevo-trials-x7k2 npm run ree:juror -- --dataset=/path/to/semigran-45.jsonl
```

`ree:juror` must pass before any extractor/model change is considered. It still
does not promote models automatically.
