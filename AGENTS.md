# Carevo triage-web — agent operating guide

Instructions for AI coding agents (Codex, Claude, etc.) working in this repo.

## What this app is

AI healthcare-navigation (triage) system. The LLM only extracts features and
phrases questions; routing decisions come from Carevo's own deterministic
engine (`lib/engine/`). Safety invariants are non-negotiable — see
"Hard rules" below.

## Running the test trials (the most common task)

Prerequisites: dev server running (`npm run dev`, port 3000). For full-speed
runs set `TRIAL_KEY` to any secret string in `.env.local` AND in your shell —
without it the harness self-throttles to ~9 requests/min to respect the
rate limiter.

```bash
npm run trials                                   # all 12 personas, 1 round
TRIAL_KEY=<secret> npm run trials -- --repeat=3  # 3 rounds, full speed
npm run trials -- --only=classic-mi,gym-chest-strain
npm run trials -- --base=https://<tunnel-url>    # against a remote instance
```

Output: one JSONL record per trial in `data/trials/trials-<timestamp>.jsonl`
containing the full transcript (questions, EVOI targets, answers), the final
recommendation with provenance (engine/ruleset/KB versions), timing, and a
verdict: `exact | acceptable | over | UNDER | forbidden-output | error`.

**How to read results:** `UNDER` on an emergency-truth persona and any
`forbidden-output` are release-blocking (exit code 1). `over` is safe but
costs patients money — track its rate over time. Compare runs by diffing
summaries across log files; the `provenance` block tells you exactly which
engine/rules/KB versions produced each result.

## Offline checks (no server needed)

```bash
npx tsc --noEmit     # types
npm run eval         # 31 vignettes + policy gates + retrieval gates
                     # + knowledge-graph consistency + 4,752 property checks
```

Both must pass before any commit that touches `lib/engine/`, `lib/knowledge/`,
or `app/api/`.

## When you find a failure

1. Reproduce it with `--only=<persona-id>`.
2. Read the transcript in the trial log — the `askedFor`/`rationale` fields
   show WHY the engine asked each question.
3. If the routing was wrong: add the case to `scripts/eval-engine.ts` CASES
   first (it should fail), then fix, then re-run both eval and trials.
4. Fix conversation bugs in deterministic server code, not by tweaking LLM
   prompts — prompts are a last resort. This is a project convention with a
   track record: every conversation bug so far came from over-trusting the
   extractor model.

## Hard rules — do not violate, do not "improve"

- The LLM must NEVER pick the care level, generate citations, or produce
  medical claims. Extraction and phrasing only.
- Clinical rules (`lib/engine/rules.ts`) are floors: they may only raise
  acuity. Never make them trainable or bypassable.
- Never weaken the emergency nets (`lib/emergency.ts`) or the eval gates.
- Evidence shown to patients is retrieved from the citation registry /
  knowledge corpus — never generated.
- Patient-facing text may only restate facts the conversation established
  (the `known` set). Inferred features may influence scoring, never wording.
- Do not commit `.env.local`, `data/trials/`, `data/decision-audit.jsonl`,
  or anything under `data/knowledge/staging/`.

## Repo map (the parts that matter)

- `app/api/triage/route.ts` — orchestration: safety nets → extract → EVOI → decide → retrieve → audit
- `lib/emergency.ts` — 3-tier keyword nets (immediate / high-alert / none)
- `lib/engine/` — rules (floors), model (scoring + monotonicity guard), evoi (question selection), audit (hash chain)
- `lib/knowledge/` — corpus + overlay, retrieval, citations, graph
- `scripts/` — eval-engine (offline gates), simulate-patients (live trials), ingest/approve/embed (KB pipeline)
