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
const inputs = args
  .filter(arg => arg.startsWith('--input='))
  .map(arg => arg.slice('--input='.length))
const output = valueArg(args, '--output') ?? path.join(process.cwd(), 'data', 'recursive-learning', 'ree-experimental-combined.preferences.jsonl')
const report = valueArg(args, '--report') ?? output.replace(/\.jsonl$/, '.report.json')

function ensureInputs(): string[] {
  if (inputs.length) return inputs
  return [
    path.join(process.cwd(), 'data', 'recursive-learning', 'dpo-preference-approved-high-priority.jsonl'),
    path.join(process.cwd(), 'data', 'recursive-learning', 'external-synthetic-triage-500.preferences.jsonl'),
  ]
}

function datasetOf(row: PreferenceRow): string {
  if (typeof row.metadata?.dataset === 'string') return row.metadata.dataset
  if (typeof row.metadata?.source_label === 'string') return row.metadata.source_label
  return 'carevo-approved-internal'
}

function targetOf(row: PreferenceRow): string {
  if (typeof row.metadata?.reviewerTarget === 'string') return row.metadata.reviewerTarget
  try {
    const chosen = JSON.parse(row.chosen) as { reviewerTarget?: unknown }
    if (typeof chosen.reviewerTarget === 'string') return chosen.reviewerTarget
  } catch {}
  return 'unknown'
}

function countBy(rows: PreferenceRow[], pick: (row: PreferenceRow) => string): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const key = pick(row)
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
}

async function main() {
  const inputPaths = ensureInputs()
  const seen = new Set<string>()
  const rows: PreferenceRow[] = []
  const duplicateIds: string[] = []

  for (const input of inputPaths) {
    const batch = await readJsonl<PreferenceRow>(input)
    for (const row of batch) {
      if (seen.has(row.id)) {
        duplicateIds.push(row.id)
        continue
      }
      seen.add(row.id)
      rows.push({
        ...row,
        metadata: {
          ...row.metadata,
          mergedInto: output,
        },
      })
    }
  }

  rows.sort((a, b) => datasetOf(a).localeCompare(datasetOf(b)) || a.id.localeCompare(b.id))

  const containsNoncommercial = rows.some(row => row.metadata?.commercialUseAllowed === false)
  const containsExternalSynthetic = rows.some(row => row.metadata?.datasetType === 'external_synthetic')

  await writeJsonl(output, rows)
  await writeJson(report, {
    inputs: inputPaths,
    output,
    rows: rows.length,
    duplicateIds,
    datasetCounts: countBy(rows, datasetOf),
    targetCounts: countBy(rows, targetOf),
    containsNoncommercial,
    containsExternalSynthetic,
    commercialUseAllowed: !containsNoncommercial,
    offlineExperimentOnly: containsNoncommercial || containsExternalSynthetic,
    trainingAllowed: false,
    promotionAllowed: false,
    safety: 'Merged pack is for offline REE experiments only when it includes noncommercial or external synthetic rows.',
  })

  console.log(JSON.stringify({
    output,
    report,
    rows: rows.length,
    datasetCounts: countBy(rows, datasetOf),
    commercialUseAllowed: !containsNoncommercial,
    trainingAllowed: false,
    promotionAllowed: false,
  }, null, 2))
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
