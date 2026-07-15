import path from 'path'
import { readJsonl, valueArg, writeJson, writeJsonl } from './shared'

interface ApprovedTrainingRow {
  id: string
  caseNumber: number
  task: 'extractor_calibration' | 'clarify_when_uncertain'
  prompt: {
    instruction: string
    patientText: string
    conversationTurns: unknown[]
  }
  rejected: Record<string, unknown>
  chosen: {
    reviewerTarget: string | null
    extractionGuidance: string[]
    preferredBehavior: string
    safetyLimits: string[]
  }
  reviewerNote: string
  metadata: Record<string, unknown>
}

interface PreferenceRow {
  id: string
  prompt: string
  chosen: string
  rejected: string
  metadata: {
    task: string
    reviewerTarget: string | null
    reviewerNote: string
    sourceCaseNumber: number
    safety: string
  } & Record<string, unknown>
}

const args = process.argv.slice(2)
const input = valueArg(args, '--input') ?? path.join(process.cwd(), 'data', 'recursive-learning', 'approved-training-prep-reviewed-high-priority.jsonl')
const output = valueArg(args, '--output') ?? path.join(process.cwd(), 'data', 'recursive-learning', 'dpo-preference-approved-high-priority.jsonl')
const report = valueArg(args, '--report') ?? output.replace(/\.jsonl$/, '.report.json')

function promptFor(row: ApprovedTrainingRow): string {
  return [
    'You are Carevo Layer 3a, the feature extractor.',
    'Extract structured routing features from the patient text.',
    'You do not choose the final care level.',
    'If the text is vague, do not assume high severity or major functional impairment.',
    'Prefer a clarifying-question signal when details are insufficient.',
    '',
    `Patient text: ${row.prompt.patientText}`,
  ].join('\n')
}

function chosenFor(row: ApprovedTrainingRow): string {
  return JSON.stringify({
    type: row.task === 'clarify_when_uncertain' ? 'clarification_or_conservative_features' : 'features',
    reviewerTarget: row.chosen.reviewerTarget,
    behavior: row.chosen.preferredBehavior,
    extractionGuidance: row.chosen.extractionGuidance,
    safetyLimits: row.chosen.safetyLimits,
    note: 'Training target is for extractor calibration only. Deterministic route engine still chooses care level.',
  })
}

function rejectedFor(row: ApprovedTrainingRow): string {
  return JSON.stringify({
    type: 'overaggressive_extraction_observation',
    rejectedObservation: row.rejected,
    reason: 'Reviewer marked this as too aggressive, unclear, or needing lower-assumption extraction.',
  })
}

async function main() {
  const approved = await readJsonl<ApprovedTrainingRow>(input)
  const rows: PreferenceRow[] = approved.map(row => ({
    id: row.id,
    prompt: promptFor(row),
    chosen: chosenFor(row),
    rejected: rejectedFor(row),
    metadata: {
      ...row.metadata,
      task: row.task,
      reviewerTarget: row.chosen.reviewerTarget,
      reviewerNote: row.reviewerNote,
      sourceCaseNumber: row.caseNumber,
      safety: 'Offline preference row only. Do not promote without juror gates and zero under-triage.',
    },
  }))

  await writeJsonl(output, rows)
  await writeJson(report, {
    input,
    output,
    rows: rows.length,
    format: 'dpo_style_prompt_chosen_rejected_jsonl',
    trainingAllowed: false,
    use: 'Offline extractor calibration experiment only.',
    nextStep: 'Choose the local model/trainer, run a dry training job, then evaluate against 45-case and 240-case gates before any shadow mode.',
  })

  console.log(JSON.stringify({ input, output, rows: rows.length, trainingAllowed: false }, null, 2))
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
