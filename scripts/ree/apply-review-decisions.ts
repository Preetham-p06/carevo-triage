import { promises as fs } from 'fs'
import path from 'path'
import { readJsonl, valueArg, writeJson, writeJsonl } from './shared'

interface ReviewDecision {
  caseNumber: number
  id: string
  decision: 'approve' | 'reject' | 'needs_clinician' | 'reject_duplicate'
  reviewerTarget: string | null
  reviewerNote: string
}

interface ReviewFile {
  reviewedAt: string
  reviewSource: string
  summary: string
  globalLearningGoal: string
  decisions: ReviewDecision[]
}

interface Candidate {
  id: string
  priority: string
  prompt: {
    role: string
    vignette: string
    conversation_turns: unknown[]
  }
  rejected_observation: {
    predicted_care_level: string
    response_type?: string
    feature_keys: string[]
    factors: string[]
    rules_fired: string[]
    reasoning?: string
  }
  preferred_target: {
    expected_care_level: string
    correction_goal: string
    safety_floor: string
  }
  metadata: Record<string, unknown>
}

interface ApprovedTrainingRow {
  id: string
  caseNumber: number
  status: 'approved_for_offline_training_prep'
  task: 'extractor_calibration' | 'clarify_when_uncertain'
  prompt: {
    instruction: string
    patientText: string
    conversationTurns: unknown[]
  }
  rejected: Candidate['rejected_observation']
  chosen: {
    reviewerTarget: string | null
    extractionGuidance: string[]
    preferredBehavior: string
    safetyLimits: string[]
  }
  reviewerNote: string
  metadata: Candidate['metadata'] & {
    originalExpectedCareLevel: string
    originalPredictedCareLevel: string
  }
}

const args = process.argv.slice(2)
const candidatesPath = valueArg(args, '--candidates') ?? path.join(process.cwd(), 'data', 'recursive-learning', 'training-candidates-overtriage-240.jsonl')
const decisionsPath = valueArg(args, '--decisions') ?? path.join(process.cwd(), 'data', 'recursive-learning', 'high-priority-review-decisions.json')
const output = valueArg(args, '--output') ?? path.join(process.cwd(), 'data', 'recursive-learning', 'approved-training-prep-reviewed-high-priority.jsonl')
const report = valueArg(args, '--report') ?? output.replace(/\.jsonl$/, '.report.json')
const notes = valueArg(args, '--notes') ?? output.replace(/\.jsonl$/, '.md')

function guidanceFor(candidate: Candidate, decision: ReviewDecision): string[] {
  const text = candidate.prompt.vignette.toLowerCase()
  const guidance = [
    'Do not infer high severity or major functional impact unless the patient text explicitly supports it.',
    'If the case is vague, ask a clarifying question instead of escalating based on assumptions.',
  ]

  if (text.includes('sore throat') || text.includes('exudative')) {
    guidance.push('Sore throat with fever, exudate, and cervical nodes can be urgent care when airway, severe dehydration, breathing trouble, and toxic appearance are absent.')
  }
  if (text.includes('ear pain') || text.includes('abnormal ear drum') || text.includes('eardrum')) {
    guidance.push('Pediatric ear pain or abnormal eardrum with fever can be urgent care when toxicity, severe dehydration, mastoid swelling, and neurologic red flags are absent.')
  }
  if (text.includes('vesicles') || text.includes('crusting') || text.includes('one side of the chest')) {
    guidance.push('Unilateral burning pain followed by a vesicular rash can be urgent care for time-sensitive treatment when eye, facial, neurologic, or systemic red flags are absent.')
  }
  if (text.includes('pus around the nail') || text.includes('swollen painful finger')) {
    guidance.push('Localized nail-fold pus and spreading local redness can be urgent care when rapidly ascending streaks, systemic toxicity, crepitus, and necrotizing infection signs are absent.')
  }
  if (text.includes('sneezing') || text.includes('nasal itching') || text.includes('seasonal congestion')) {
    guidance.push('Years of seasonal sneezing, nasal itching, eye itching, and congestion should remain low acuity when fever, acute facial pain, and other infection red flags are absent.')
  }
  if (text.includes('vomited twice') || text.includes('keep fluids down') || text.includes('keeping fluids down')) {
    guidance.push('Mild vomiting after food exposure with fluids tolerated and no blood, fever, or severe pain should remain low acuity unless dehydration or abdominal red flags appear.')
  }
  if (text.includes('foot drop')) {
    guidance.push('Foot drop should stay same-day/urgent at minimum; escalate higher only if additional emergency neurologic or systemic signs are present.')
  }
  if (text.includes('red eyes') || text.includes('vision change') || text.includes('eye pain')) {
    guidance.push('Eye cases without vision change, trauma, or severe eye pain should not be treated as ER solely because of discharge or morning crusting.')
  }
  if (text.includes('low back pain')) {
    guidance.push('Mechanical back pain without weakness, fever, trauma severity, bowel/bladder changes, or progressive neurologic signs should not be escalated based only on pain wording.')
  }
  if (decision.reviewerTarget === 'not_er') {
    guidance.push('Reviewer only approved learning that the route was too high; final target still needs caution if future eye red flags are present.')
  }

  return guidance
}

function preferredBehavior(decision: ReviewDecision): string {
  if (decision.reviewerTarget === 'not_er') {
    return 'Avoid ER extraction unless explicit ER red flags are present; ask a clarification if the text is insufficient.'
  }
  if (decision.reviewerTarget) {
    return `Calibrate extracted severity/impact so the deterministic engine can route toward ${decision.reviewerTarget} when no higher-acuity red flags are present.`
  }
  return 'Do not use until a clinician resolves the target.'
}

function toApprovedRow(candidate: Candidate, decision: ReviewDecision): ApprovedTrainingRow {
  const task = decision.reviewerTarget === 'not_er' ? 'clarify_when_uncertain' : 'extractor_calibration'
  return {
    id: candidate.id,
    caseNumber: decision.caseNumber,
    status: 'approved_for_offline_training_prep',
    task,
    prompt: {
      instruction: 'Extract structured features from the patient text. Do not choose the final care level. When details are unclear, prefer asking for clarification over assuming high severity.',
      patientText: candidate.prompt.vignette,
      conversationTurns: candidate.prompt.conversation_turns,
    },
    rejected: candidate.rejected_observation,
    chosen: {
      reviewerTarget: decision.reviewerTarget,
      extractionGuidance: guidanceFor(candidate, decision),
      preferredBehavior: preferredBehavior(decision),
      safetyLimits: [
        'Do not weaken emergency hard stops.',
        'Do not lower true ER or emergency red flags.',
        'Do not let a model choose the final care level.',
        'Use only after offline eval gates pass with zero under-triage.',
      ],
    },
    reviewerNote: decision.reviewerNote,
    metadata: {
      ...candidate.metadata,
      originalExpectedCareLevel: candidate.preferred_target.expected_care_level,
      originalPredictedCareLevel: candidate.rejected_observation.predicted_care_level,
    },
  }
}

async function main() {
  const candidates = await readJsonl<Candidate>(candidatesPath)
  const review = JSON.parse(await fs.readFile(decisionsPath, 'utf8')) as ReviewFile
  const byId = new Map(candidates.map(candidate => [candidate.id, candidate]))
  const approved: ApprovedTrainingRow[] = []
  const missing: string[] = []

  for (const decision of review.decisions) {
    const candidate = byId.get(decision.id)
    if (!candidate) {
      missing.push(decision.id)
      continue
    }
    if (decision.decision === 'approve') approved.push(toApprovedRow(candidate, decision))
  }

  const counts = review.decisions.reduce<Record<string, number>>((acc, decision) => {
    acc[decision.decision] = (acc[decision.decision] ?? 0) + 1
    return acc
  }, {})

  await writeJsonl(output, approved)
  await writeJson(report, {
    candidates: candidatesPath,
    decisions: decisionsPath,
    output,
    reviewedAt: review.reviewedAt,
    reviewSource: review.reviewSource,
    globalLearningGoal: review.globalLearningGoal,
    decisionCounts: counts,
    approvedRows: approved.length,
    missing,
    trainingAllowed: false,
    offlineTrainingPrepReady: approved.length > 0 && missing.length === 0,
    nextStep: 'Convert approved rows into the final provider-specific SFT/DPO format after confirming the chosen local model and training toolchain.',
    safety: 'Rows are approved for offline training preparation only. They do not promote a model or alter live routing.',
  })

  const approvedLines = approved.map(row => [
    `### ${row.caseNumber}. ${row.id}`,
    '',
    `- Reviewer target: ${row.chosen.reviewerTarget}`,
    `- Task: ${row.task}`,
    `- Original expected: ${row.metadata.originalExpectedCareLevel}`,
    `- Carevo routed: ${row.metadata.originalPredictedCareLevel}`,
    `- Reviewer note: ${row.reviewerNote}`,
    `- Patient text: ${row.prompt.patientText}`,
    '',
  ].join('\n'))

  await fs.writeFile(notes, [
    '# Approved REE Training-Prep Rows',
    '',
    `Reviewed at: ${review.reviewedAt}`,
    '',
    review.summary,
    '',
    `Global learning goal: ${review.globalLearningGoal}`,
    '',
    `Approved rows: ${approved.length}`,
    '',
    'These rows are approved for offline training preparation only. They must not change live routing until juror gates pass.',
    '',
    ...approvedLines,
  ].join('\n'))

  console.log(JSON.stringify({
    output,
    report,
    notes,
    approvedRows: approved.length,
    decisionCounts: counts,
    trainingAllowed: false,
    offlineTrainingPrepReady: approved.length > 0 && missing.length === 0,
  }, null, 2))
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
