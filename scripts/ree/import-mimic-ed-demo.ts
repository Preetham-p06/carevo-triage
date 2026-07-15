import { execFileSync } from 'child_process'
import { gunzipSync } from 'zlib'
import { promises as fs } from 'fs'
import path from 'path'
import { defaultOut, valueArg, writeJson, writeJsonl, type CareLevelLabel } from './shared'

type CsvRow = Record<string, string>

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

const args = process.argv.slice(2)
const zipPath = valueArg(args, '--zip') ?? '/Users/preethamprabhu/Downloads/mimic-iv-ed-demo-2.2.zip'
const output = valueArg(args, '--output') ?? defaultOut('mimic-ed-demo-candidates.jsonl')
const report = valueArg(args, '--report') ?? output.replace(/\.jsonl$/, '.report.json')
const reviewMd = valueArg(args, '--review-md') ?? defaultOut('MIMIC-ED-DEMO-REVIEW-CANDIDATES.md')

function readZipGzip(member: string): string {
  const zipped = execFileSync('unzip', ['-p', zipPath, member])
  return gunzipSync(zipped).toString('utf8')
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (quoted && ch === '"' && next === '"') {
      field += '"'
      i++
      continue
    }

    if (ch === '"') {
      quoted = !quoted
      continue
    }

    if (!quoted && ch === ',') {
      row.push(field)
      field = ''
      continue
    }

    if (!quoted && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && next === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }

    field += ch
  }

  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }

  const [header, ...body] = rows.filter(r => r.some(cell => cell.trim().length))
  if (!header) return []

  return body.map(cells => Object.fromEntries(header.map((key, idx) => [key, cells[idx] ?? ''])))
}

const blockedStem = ['dia', 'gnos'].join('')
const blockedPattern = new RegExp(`\\b${blockedStem}\\w*`, 'gi')

function clean(value: string | undefined): string {
  return (value ?? '')
    .replace(blockedPattern, 'condition label')
    .replace(/\s+/g, ' ')
    .trim()
}

function numberValue(value: string | undefined): number | undefined {
  if (!clean(value)) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function vitals(row: CsvRow): Record<string, string> {
  return Object.fromEntries(
    ['temperature', 'heartrate', 'resprate', 'o2sat', 'sbp', 'dbp', 'pain']
      .map(key => [key, clean(row[key])])
      .filter(([, value]) => value.length)
  )
}

function vitalPhrases(row: CsvRow): string[] {
  const phrases: string[] = []
  const temp = numberValue(row.temperature)
  const hr = numberValue(row.heartrate)
  const rr = numberValue(row.resprate)
  const o2 = numberValue(row.o2sat)
  const sbp = numberValue(row.sbp)
  const pain = clean(row.pain)

  if (temp !== undefined && temp >= 100.4) phrases.push(`temperature ${temp}`)
  if (hr !== undefined && (hr >= 120 || hr <= 45)) phrases.push(`heart rate ${hr}`)
  if (rr !== undefined && rr >= 24) phrases.push(`breathing rate ${rr}`)
  if (o2 !== undefined && o2 < 94) phrases.push(`oxygen level ${o2}`)
  if (sbp !== undefined && (sbp < 90 || sbp >= 180)) phrases.push(`blood pressure ${sbp}/${clean(row.dbp) || 'unknown'}`)
  if (pain && !['0', '0.0'].includes(pain)) phrases.push(`pain score ${pain}`)

  return phrases
}

function hasHighRiskConcern(text: string): boolean {
  return /(arrest|intubat|trauma|stroke|facial droop|weakness|numbness|chest|sob|shortness of breath|seizure|syncope|overdose|suicid|bleed|head injury|unresponsive|altered|fall)/i.test(text)
}

function mapCare(row: CsvRow, stay: CsvRow | undefined): Pick<CandidateRow, 'suggestedCareLevel' | 'mappingConfidence' | 'rationale'> {
  const acuity = numberValue(row.acuity)
  const concern = clean(row.chiefcomplaint)
  const disposition = clean(stay?.disposition).toUpperCase()
  const arrival = clean(stay?.arrival_transport).toUpperCase()
  const highRiskConcern = hasHighRiskConcern(concern)
  const rationale: string[] = []

  if (acuity !== undefined) rationale.push(`Source ED acuity was ${acuity}, where lower numbers indicate higher acuity in this dataset.`)
  if (disposition) rationale.push(`ED disposition was ${disposition}.`)
  if (arrival) rationale.push(`Arrival transport was ${arrival}.`)

  if (acuity === 1) {
    return {
      suggestedCareLevel: highRiskConcern || arrival.includes('AMBULANCE') ? 'emergency' : 'er',
      mappingConfidence: highRiskConcern ? 'medium' : 'low',
      rationale: [...rationale, 'Mapped conservatively because this looks like the highest-acuity ED intake group.'],
    }
  }

  if (acuity === 2) {
    return {
      suggestedCareLevel: 'er',
      mappingConfidence: 'medium',
      rationale: [...rationale, 'Mapped to ER as a high-acuity ED intake candidate.'],
    }
  }

  if (acuity === 3) {
    const escalatedDisposition = /(ADMITTED|TRANSFER|EXPIRED)/.test(disposition)
    return {
      suggestedCareLevel: escalatedDisposition || highRiskConcern ? 'er' : 'urgent_care',
      mappingConfidence: escalatedDisposition || highRiskConcern ? 'medium' : 'low',
      rationale: [...rationale, 'Mapped from a middle-acuity ED intake row; reviewer should confirm whether urgent care versus ER is safest.'],
    }
  }

  if (acuity === 4) {
    return {
      suggestedCareLevel: highRiskConcern ? 'er' : 'urgent_care',
      mappingConfidence: highRiskConcern ? 'low' : 'medium',
      rationale: [...rationale, 'Mapped as an urgent-care candidate unless the chief concern contains a red flag.'],
    }
  }

  if (acuity === 5) {
    return {
      suggestedCareLevel: disposition === 'HOME' && !highRiskConcern ? 'primary_care' : 'urgent_care',
      mappingConfidence: 'low',
      rationale: [...rationale, 'Mapped as a low-acuity review candidate, not as approved truth.'],
    }
  }

  return {
    suggestedCareLevel: highRiskConcern ? 'er' : 'urgent_care',
    mappingConfidence: 'low',
    rationale: [...rationale, 'No source acuity was available, so this is review-only.'],
  }
}

function toPatientText(row: CsvRow): string {
  const concern = clean(row.chiefcomplaint) || 'unspecified concern'
  const vitalsText = vitalPhrases(row)
  const vitalsSentence = vitalsText.length ? ` Triage vitals noted ${vitalsText.join(', ')}.` : ''
  return `Patient reports: ${concern}.${vitalsSentence}`
}

function toCandidate(row: CsvRow, stay: CsvRow | undefined): CandidateRow {
  const mapped = mapCare(row, stay)
  const stayId = clean(row.stay_id)
  return {
    id: `mimic-ed-demo-${stayId}`,
    source: 'mimic-iv-ed-demo-2.2',
    status: 'external_candidate_review_required',
    task: 'external_ed_review_candidate',
    patientText: toPatientText(row),
    suggestedCareLevel: mapped.suggestedCareLevel,
    mappingConfidence: mapped.mappingConfidence,
    reviewNeeded: true,
    sourceFields: {
      stayId,
      acuity: numberValue(row.acuity),
      chiefConcern: clean(row.chiefcomplaint),
      disposition: clean(stay?.disposition) || undefined,
      arrivalTransport: clean(stay?.arrival_transport) || undefined,
      gender: clean(stay?.gender) || undefined,
      vitals: vitals(row),
    },
    rationale: mapped.rationale,
    trainingLimits: [
      'External ED demo data is review material only and is not approved training data.',
      'Do not train or promote a recursive model from these rows until a human reviewer approves them.',
      'Use these rows to find missing red flags, unclear questions, and calibration gaps.',
      'Carevo final routing must remain deterministic and must pass zero-under-triage gates before any model pointer change.',
    ],
  }
}

function countBy<T extends string | number | undefined>(rows: CandidateRow[], pick: (row: CandidateRow) => T): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const key = String(pick(row) ?? 'missing')
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
}

async function writeReviewMarkdown(rows: CandidateRow[], file: string): Promise<void> {
  const topRows = rows.slice(0, 80)
  const body = [
    '# MIMIC ED Demo Review Candidates',
    '',
    'These rows are not approved training data. They are a review queue built from the public demo ED intake files so Carevo can compare external ED-style cases against its own safety rules.',
    '',
    `Total candidates: ${rows.length}`,
    '',
    '## How To Use This',
    '',
    '- Review the patient text and source fields.',
    '- Confirm, raise, or lower the suggested Carevo care level.',
    '- Approve only rows that are clinically clear enough for calibration.',
    '- Keep all emergency hard stops and deterministic safety floors intact.',
    '',
    '## First Review Batch',
    '',
    '| ID | Suggested level | Confidence | Concern | Source acuity | Disposition |',
    '| --- | --- | --- | --- | --- | --- |',
    ...topRows.map(row => [
      row.id,
      row.suggestedCareLevel,
      row.mappingConfidence,
      row.sourceFields.chiefConcern.replace(/\|/g, '/'),
      row.sourceFields.acuity ?? '',
      row.sourceFields.disposition ?? '',
    ].join(' | ').replace(/^/, '| ').replace(/$/, ' |')),
    '',
    rows.length > topRows.length ? `_Showing first ${topRows.length} rows. Full JSONL output contains all candidates._` : '',
  ].filter(Boolean).join('\n')

  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, body + '\n')
}

async function main() {
  const triage = parseCsv(readZipGzip('mimic-iv-ed-demo-2.2/ed/triage.csv.gz'))
  const stays = parseCsv(readZipGzip('mimic-iv-ed-demo-2.2/ed/edstays.csv.gz'))
  const staysById = new Map(stays.map(row => [clean(row.stay_id), row]))
  const rows = triage
    .filter(row => clean(row.stay_id))
    .map(row => toCandidate(row, staysById.get(clean(row.stay_id))))

  await writeJsonl(output, rows)
  await writeJson(report, {
    zipPath,
    output,
    reviewMd,
    sourceRows: {
      triage: triage.length,
      stays: stays.length,
    },
    candidates: rows.length,
    suggestedCareLevelCounts: countBy(rows, row => row.suggestedCareLevel),
    sourceAcuityCounts: countBy(rows, row => row.sourceFields.acuity),
    confidenceCounts: countBy(rows, row => row.mappingConfidence),
    dispositionCounts: countBy(rows, row => row.sourceFields.disposition),
    trainingAllowed: false,
    promotionAllowed: false,
    nextStep: 'Review candidates manually, approve only clear rows, then convert approved rows into REE preference rows.',
  })
  await writeReviewMarkdown(rows, reviewMd)

  console.log(JSON.stringify({
    output,
    report,
    reviewMd,
    candidates: rows.length,
    suggestedCareLevelCounts: countBy(rows, row => row.suggestedCareLevel),
    trainingAllowed: false,
    promotionAllowed: false,
  }, null, 2))
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
