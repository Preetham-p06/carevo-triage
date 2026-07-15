import path from 'path'
import { promises as fs } from 'fs'
import { defaultOut, readJsonl, valueArg, writeJson } from './shared'

type CareLevelLabel = 'home_care' | 'telehealth' | 'primary_care' | 'urgent_care' | 'er' | 'emergency'

interface CandidateRow {
  id: string
  source: string
  status: 'external_candidate_review_required'
  task: 'external_ed_review_candidate'
  patientText: string
  suggestedCareLevel: CareLevelLabel
  mappingConfidence: 'high' | 'medium' | 'low'
  reviewNeeded: true
  sourceFields: {
    stayId: string
    acuity?: number
    chiefConcern: string
    disposition?: string
    arrivalTransport?: string
    gender?: string
    vitals: Record<string, string>
  }
  rationale: string[]
  trainingLimits: string[]
}

interface RankedCandidate extends CandidateRow {
  reviewRank: number
  reviewScore: number
  reviewReasons: string[]
}

interface ReviewDecisionTemplate {
  id: string
  source: string
  reviewRank: number
  suggestedCareLevel: CareLevelLabel
  reviewerCareLevel: CareLevelLabel | null
  decision: 'pending' | 'approve' | 'reject' | 'needs_more_context'
  reviewerNotes: string
  safeForTrainingPrep: false
}

const args = process.argv.slice(2)
const input = valueArg(args, '--input') ?? defaultOut('mimic-ed-demo-candidates.jsonl')
const outputMd = valueArg(args, '--output-md') ?? defaultOut('MIMIC-ED-DEMO-TOP-REVIEW-QUEUE.md')
const outputJson = valueArg(args, '--output-json') ?? defaultOut('mimic-ed-demo-review-decisions.template.json')
const report = valueArg(args, '--report') ?? defaultOut('mimic-ed-demo-review-queue.report.json')
const limit = Math.max(1, Math.min(Number(valueArg(args, '--limit') ?? 100), 222))

function hasText(row: CandidateRow, pattern: RegExp): boolean {
  return pattern.test(`${row.patientText} ${row.sourceFields.chiefConcern}`)
}

function score(row: CandidateRow): Pick<RankedCandidate, 'reviewScore' | 'reviewReasons'> {
  let reviewScore = 0
  const reviewReasons: string[] = []
  const disposition = row.sourceFields.disposition ?? ''

  if (row.mappingConfidence === 'low') {
    reviewScore += 5
    reviewReasons.push('low-confidence mapping')
  }
  if (row.suggestedCareLevel === 'emergency') {
    reviewScore += 5
    reviewReasons.push('possible emergency routing')
  }
  if (row.suggestedCareLevel === 'er') {
    reviewScore += 3
    reviewReasons.push('ER-level routing candidate')
  }
  if (row.sourceFields.acuity === undefined) {
    reviewScore += 3
    reviewReasons.push('missing source acuity')
  }
  if (/(ADMITTED|TRANSFER|LEFT|ELOPED|OTHER)/i.test(disposition)) {
    reviewScore += 2
    reviewReasons.push(`non-home ED disposition: ${disposition}`)
  }
  if (hasText(row, /(facial droop|weakness|numbness|stroke|seizure|arrest|intubat|trauma|head bleed|shortness|sob|chest|neutropenia|dka|fall|altered)/i)) {
    reviewScore += 2
    reviewReasons.push('red-flag wording present')
  }
  if (Object.keys(row.sourceFields.vitals).length > 0) {
    reviewScore += 1
    reviewReasons.push('vitals available')
  }

  return { reviewScore, reviewReasons }
}

function rankRows(rows: CandidateRow[]): RankedCandidate[] {
  return rows
    .map(row => ({ ...row, ...score(row), reviewRank: 0 }))
    .sort((a, b) => {
      if (b.reviewScore !== a.reviewScore) return b.reviewScore - a.reviewScore
      if (a.suggestedCareLevel !== b.suggestedCareLevel) return b.suggestedCareLevel.localeCompare(a.suggestedCareLevel)
      return a.id.localeCompare(b.id)
    })
    .map((row, idx) => ({ ...row, reviewRank: idx + 1 }))
}

function levelCounts(rows: CandidateRow[]): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.suggestedCareLevel] = (acc[row.suggestedCareLevel] ?? 0) + 1
    return acc
  }, {})
}

function toDecisionTemplate(row: RankedCandidate): ReviewDecisionTemplate {
  return {
    id: row.id,
    source: row.source,
    reviewRank: row.reviewRank,
    suggestedCareLevel: row.suggestedCareLevel,
    reviewerCareLevel: null,
    decision: 'pending',
    reviewerNotes: '',
    safeForTrainingPrep: false,
  }
}

function mdFor(rows: RankedCandidate[], allRows: CandidateRow[]): string {
  const tableRows = rows.map(row => [
    row.reviewRank,
    row.id,
    row.suggestedCareLevel,
    row.mappingConfidence,
    row.sourceFields.acuity ?? 'missing',
    row.sourceFields.disposition ?? '',
    row.sourceFields.chiefConcern.replace(/\|/g, '/'),
    row.reviewReasons.join('; ').replace(/\|/g, '/'),
  ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'))

  return [
    '# MIMIC ED Demo Top Review Queue',
    '',
    'This is a prioritized review queue, not approved training data. Use it to decide which rows are clear enough to become REE calibration rows.',
    '',
    `Total imported candidates: ${allRows.length}`,
    `Rows in this review queue: ${rows.length}`,
    '',
    '## Counts In This Queue',
    '',
    ...Object.entries(levelCounts(rows)).map(([level, count]) => `- ${level}: ${count}`),
    '',
    '## Reviewer Instructions',
    '',
    '- Confirm whether the suggested Carevo care level is acceptable, too high, or too low.',
    '- Mark only clear rows as approve.',
    '- Keep vague rows as needs_more_context.',
    '- Never approve a row that would teach the model to lower true emergency or ER red flags.',
    '- Approved rows are still offline only until juror gates pass with zero under-triage.',
    '',
    '## Top Rows',
    '',
    '| Rank | ID | Suggested | Confidence | Source acuity | Disposition | Concern | Why review first |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...tableRows,
    '',
  ].join('\n')
}

async function main() {
  const rows = await readJsonl<CandidateRow>(input)
  const ranked = rankRows(rows).slice(0, limit)
  const decisions = ranked.map(toDecisionTemplate)

  await fs.mkdir(path.dirname(outputMd), { recursive: true })
  await fs.writeFile(outputMd, mdFor(ranked, rows))
  await writeJson(outputJson, {
    createdAt: new Date().toISOString(),
    source: input,
    summary: 'Pending review decisions for external ED demo candidates. Nothing in this file is approved by default.',
    decisions,
  })
  await writeJson(report, {
    input,
    outputMd,
    outputJson,
    totalCandidates: rows.length,
    queuedForReview: ranked.length,
    queueCounts: levelCounts(ranked),
    allCandidateCounts: levelCounts(rows),
    trainingAllowed: false,
    promotionAllowed: false,
    nextStep: 'Fill reviewerCareLevel, decision, and reviewerNotes for clear rows only. Then run a converter for approved rows.',
  })

  console.log(JSON.stringify({
    outputMd,
    outputJson,
    report,
    totalCandidates: rows.length,
    queuedForReview: ranked.length,
    queueCounts: levelCounts(ranked),
    trainingAllowed: false,
    promotionAllowed: false,
  }, null, 2))
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
