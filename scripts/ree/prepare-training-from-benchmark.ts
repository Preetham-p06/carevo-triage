import { promises as fs } from 'fs'
import path from 'path'
import { careRank, readJsonl, valueArg, writeJson, writeJsonl, type CareLevelLabel } from './shared'

interface BenchmarkRow {
  id: string
  expected: CareLevelLabel
  predicted: CareLevelLabel
  verdict: 'exact' | 'over' | 'UNDER' | 'error' | 'needs_more_info'
  responseType?: string
  turns?: Array<{ question: string; askedFor?: string; answer: string; source: string }>
  finalResponse?: {
    careLevel?: CareLevelLabel
    reasoning?: string
    factors?: string[]
    featureKeys?: string[]
    rulesFired?: string[]
    provenance?: Record<string, unknown>
  }
  sourceLevel?: string
  sourceLabel?: string
  text: string
  error?: string
}

interface TrainingCandidate {
  id: string
  source: string
  status: 'human_review_required'
  task: 'extractor_correction_candidate'
  priority: 'high' | 'medium' | 'low'
  prompt: {
    role: string
    vignette: string
    conversation_turns: BenchmarkRow['turns']
  }
  rejected_observation: {
    predicted_care_level: CareLevelLabel
    response_type?: string
    feature_keys: string[]
    factors: string[]
    rules_fired: string[]
    reasoning?: string
  }
  preferred_target: {
    expected_care_level: CareLevelLabel
    correction_goal: string
    safety_floor: string
  }
  training_limits: string[]
  metadata: {
    source_label?: string
    source_level?: string
    over_rank_delta: number
    provenance?: Record<string, unknown>
  }
}

const args = process.argv.slice(2)
const input = valueArg(args, '--input') ?? path.join(process.cwd(), 'data', 'recursive-learning', 'synthetic-240-results-clean-rerun-2.jsonl')
const output = valueArg(args, '--output') ?? path.join(process.cwd(), 'data', 'recursive-learning', 'training-candidates-overtriage-240.jsonl')
const report = valueArg(args, '--report') ?? output.replace(/\.jsonl$/, '.report.json')

function priority(row: BenchmarkRow): TrainingCandidate['priority'] {
  const delta = careRank(row.predicted) - careRank(row.expected)
  if (row.expected === 'home_care' && careRank(row.predicted) >= careRank('urgent_care')) return 'high'
  if (delta >= 2) return 'high'
  if (delta === 1) return 'medium'
  return 'low'
}

function correctionGoal(row: BenchmarkRow): string {
  if (row.expected === 'er' && row.predicted === 'emergency') {
    return 'Preserve ER-level routing while avoiding 911 language unless the emergency hard-stop criteria are explicit.'
  }
  if (row.expected === 'urgent_care') {
    return 'Preserve same-day care routing while avoiding escalation to ER unless ER red flags are present in the text.'
  }
  if (row.expected === 'home_care') {
    return 'Keep clearly mild self-care presentations low acuity after red flags are denied or absent.'
  }
  return 'Reduce unnecessary acuity escalation while preserving all safety floors.'
}

function safetyFloor(row: BenchmarkRow): string {
  if (row.expected === 'er') return 'Never lower below ER for this row during review.'
  if (row.expected === 'urgent_care') return 'Never lower below urgent care for this row during review.'
  return 'Only use for low-acuity calibration when emergency and ER red flags are absent.'
}

function toCandidate(row: BenchmarkRow): TrainingCandidate {
  return {
    id: row.id,
    source: input,
    status: 'human_review_required',
    task: 'extractor_correction_candidate',
    priority: priority(row),
    prompt: {
      role: 'Extract structured routing features from the patient text. Do not choose the final care level.',
      vignette: row.text,
      conversation_turns: row.turns ?? [],
    },
    rejected_observation: {
      predicted_care_level: row.predicted,
      response_type: row.responseType,
      feature_keys: row.finalResponse?.featureKeys ?? [],
      factors: row.finalResponse?.factors ?? [],
      rules_fired: row.finalResponse?.rulesFired ?? [],
      reasoning: row.finalResponse?.reasoning,
    },
    preferred_target: {
      expected_care_level: row.expected,
      correction_goal: correctionGoal(row),
      safety_floor: safetyFloor(row),
    },
    training_limits: [
      'Candidate is not approved training data until reviewed by a human clinical reviewer.',
      'Do not train a model to override emergency hard stops or deterministic safety floors.',
      'Use this only to improve extraction calibration, question efficiency, or over-triage review.',
      'Run juror gates with zero under-triage before any model pointer change.',
    ],
    metadata: {
      source_label: row.sourceLabel,
      source_level: row.sourceLevel,
      over_rank_delta: careRank(row.predicted) - careRank(row.expected),
      provenance: row.finalResponse?.provenance,
    },
  }
}

async function main() {
  const rows = await readJsonl<BenchmarkRow>(input)
  const over = rows.filter(row => row.verdict === 'over')
  const exact = rows.filter(row => row.verdict === 'exact').length
  const under = rows.filter(row => row.verdict === 'UNDER')
  const errors = rows.filter(row => row.verdict === 'error' || row.verdict === 'needs_more_info')
  const candidates = over.map(toCandidate)

  await writeJsonl(output, candidates)
  await writeJson(report, {
    input,
    output,
    totalRows: rows.length,
    exact,
    over: over.length,
    under: under.length,
    errors: errors.length,
    candidates: candidates.length,
    priorityCounts: candidates.reduce<Record<string, number>>((acc, row) => {
      acc[row.priority] = (acc[row.priority] ?? 0) + 1
      return acc
    }, {}),
    expectedLevelCounts: candidates.reduce<Record<string, number>>((acc, row) => {
      acc[row.preferred_target.expected_care_level] = (acc[row.preferred_target.expected_care_level] ?? 0) + 1
      return acc
    }, {}),
    readyForOfflineTrainingPrep: under.length === 0 && errors.length === 0,
    promotionAllowed: false,
    nextReviewStep: 'Review high-priority candidates first, then convert approved rows into the training format for the chosen local model.',
    safety: 'These rows are candidates only and must not change live routing without human review and juror gates.',
  })

  console.log(JSON.stringify({
    input,
    output,
    report,
    candidates: candidates.length,
    highPriority: candidates.filter(c => c.priority === 'high').length,
    readyForOfflineTrainingPrep: under.length === 0 && errors.length === 0,
    promotionAllowed: false,
  }, null, 2))
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
