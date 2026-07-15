import { promises as fs } from 'fs'
import path from 'path'
import { readJsonl, valueArg, writeJson, writeJsonl } from './shared'

interface PreferenceRow {
  id: string
  prompt: string
  chosen: string
  rejected: string
  metadata?: Record<string, unknown>
}

const args = process.argv.slice(2)
const input = valueArg(args, '--input') ?? path.join(process.cwd(), 'data', 'recursive-learning', 'dpo-preference-approved-high-priority.jsonl')
const outDir = valueArg(args, '--out-dir') ?? path.join(process.cwd(), 'data', 'recursive-learning', 'offline-training-pack-approved-high-priority')
const minRowsForRealTraining = parseInt(valueArg(args, '--min-rows') ?? '25', 10)

function stableRows(rows: PreferenceRow[]): PreferenceRow[] {
  return [...rows].sort((a, b) => a.id.localeCompare(b.id))
}

function splitRows(rows: PreferenceRow[]) {
  if (rows.length <= 1) return { train: rows, holdout: [] as PreferenceRow[] }
  const holdoutCount = Math.max(1, Math.floor(rows.length * 0.25))
  const groups = new Map<string, PreferenceRow[]>()
  for (const row of rows) {
    const sourceLabel = typeof row.metadata?.source_label === 'string' ? row.metadata.source_label : 'unknown'
    const target = typeof row.metadata?.reviewerTarget === 'string' ? row.metadata.reviewerTarget : 'unknown'
    const key = `${sourceLabel}::${target}`
    groups.set(key, [...(groups.get(key) ?? []), row])
  }

  const holdoutIds = new Set<string>()
  for (const group of [...groups.values()].sort((a, b) => b.length - a.length)) {
    if (holdoutIds.size >= holdoutCount) break
    if (group.length < 3) continue
    holdoutIds.add(group[group.length - 1].id)
  }

  for (let i = rows.length - 1; holdoutIds.size < holdoutCount && i >= 0; i -= 1) {
    const row = rows[i]
    const group = groups.get(`${typeof row.metadata?.source_label === 'string' ? row.metadata.source_label : 'unknown'}::${typeof row.metadata?.reviewerTarget === 'string' ? row.metadata.reviewerTarget : 'unknown'}`) ?? []
    const remainingInTrain = group.filter(candidate => !holdoutIds.has(candidate.id) && candidate.id !== row.id).length
    if (remainingInTrain > 0) holdoutIds.add(row.id)
  }

  if (holdoutIds.size > 0) {
    return {
      train: rows.filter(row => !holdoutIds.has(row.id)),
      holdout: rows.filter(row => holdoutIds.has(row.id)),
    }
  }

  return {
    train: rows.slice(0, rows.length - holdoutCount),
    holdout: rows.slice(rows.length - holdoutCount),
  }
}

function toSftSmokeRow(row: PreferenceRow) {
  return {
    messages: [
      { role: 'system', content: 'You are Carevo Layer 3a, the feature extractor. Do not choose the final care level.' },
      { role: 'user', content: row.prompt },
      { role: 'assistant', content: row.chosen },
    ],
    metadata: {
      ...row.metadata,
      sourcePreferenceId: row.id,
      purpose: 'smoke_test_only',
    },
  }
}

async function main() {
  const rows = stableRows(await readJsonl<PreferenceRow>(input))
  const { train, holdout } = splitRows(rows)
  const readyForRealTraining = rows.length >= minRowsForRealTraining
  const readyForSmokeDryRun = rows.length > 0

  await fs.mkdir(outDir, { recursive: true })
  await writeJsonl(path.join(outDir, 'preferences.train.jsonl'), train)
  await writeJsonl(path.join(outDir, 'preferences.holdout.jsonl'), holdout)
  await writeJsonl(path.join(outDir, 'sft-smoke.train.jsonl'), train.map(toSftSmokeRow))
  await writeJsonl(path.join(outDir, 'sft-smoke.holdout.jsonl'), holdout.map(toSftSmokeRow))

  await writeJson(path.join(outDir, 'manifest.json'), {
    createdAt: new Date().toISOString(),
    source: input,
    rows: rows.length,
    trainRows: train.length,
    holdoutRows: holdout.length,
    minRowsForRealTraining,
    readyForSmokeDryRun,
    readyForRealTraining,
    trainingAllowed: false,
    recommendedUse: readyForRealTraining
      ? 'Offline experiment only; still requires full juror gates before any shadow mode.'
      : 'Smoke-test the training pipeline only. Collect more approved rows before real model training.',
    modelRole: 'Extractor calibration only. The model must not choose the final care level.',
    hardSafetyLimits: [
      'Emergency hard stops remain deterministic and pre-model.',
      'Deterministic route engine remains the care-level authority.',
      'No model output can weaken ER or emergency safety floors.',
      'Promotion requires zero under-triage on the 45-case and 240-case gates.',
    ],
    suggestedNextDataGoal: {
      minimumApprovedRows: minRowsForRealTraining,
      preferredApprovedRowsBeforeRealTraining: 100,
      neededPatterns: [
        'clarify instead of assuming severity',
        'mild eye symptoms without red flags',
        'mechanical back pain without red flags',
        'urgent-care sore throat without emergency signs',
        'safe over-triage examples from real user sessions after review',
      ],
    },
    files: {
      preferenceTrain: 'preferences.train.jsonl',
      preferenceHoldout: 'preferences.holdout.jsonl',
      sftSmokeTrain: 'sft-smoke.train.jsonl',
      sftSmokeHoldout: 'sft-smoke.holdout.jsonl',
      readme: 'README.md',
    },
  })

  await fs.writeFile(path.join(outDir, 'README.md'), [
    '# Carevo Offline Training Pack',
    '',
    'This pack was generated from ER-partner-reviewed REE preference rows.',
    '',
    '## Status',
    '',
    `- Rows: ${rows.length}`,
    `- Train rows: ${train.length}`,
    `- Holdout rows: ${holdout.length}`,
    `- Ready for smoke dry-run: ${readyForSmokeDryRun ? 'yes' : 'no'}`,
    `- Ready for real training: ${readyForRealTraining ? 'yes' : 'no'}`,
    '- Training allowed: no',
    '',
    '## What This Can Be Used For',
    '',
    '- Testing that a future local training toolchain can read Carevo preference rows.',
    '- Running a tiny smoke training job to validate formatting only.',
    '- Reviewing what the extractor should learn: ask clarifying questions, avoid assuming severity, and preserve safety floors.',
    '',
    '## What This Must Not Be Used For',
    '',
    '- Do not deploy a model from this pack.',
    '- Do not use model output to choose final care level.',
    '- Do not weaken emergency hard stops or deterministic route rules.',
    '',
    '## Next Real Data Goal',
    '',
    `Collect at least ${minRowsForRealTraining} approved rows before a meaningful offline experiment, and preferably 100+ approved rows before judging model quality.`,
    '',
  ].join('\n'))

  console.log(JSON.stringify({
    outDir,
    rows: rows.length,
    trainRows: train.length,
    holdoutRows: holdout.length,
    readyForSmokeDryRun,
    readyForRealTraining,
    trainingAllowed: false,
  }, null, 2))
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
