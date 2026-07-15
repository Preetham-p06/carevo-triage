import { promises as fs } from 'fs'
import path from 'path'
import https from 'https'
import { defaultOut, valueArg, writeJson, writeJsonl, type CareLevelLabel } from './shared'

interface SourceRow {
  case_id: string
  patient: {
    age: number
    gender: string
  }
  presentation: {
    symptoms: string[]
    symptom_count: number
    duration: string
    onset: string
    context: string
  }
  risk_assessment: {
    risk_level: 'low' | 'medium' | 'high'
    red_flags: string[]
  }
  triage_classification: {
    urgency_category: 'routine' | 'urgent' | 'immediate'
    urgency_reasoning: string
  }
  safety_notice?: string
}

interface PreferenceRow {
  id: string
  prompt: string
  chosen: string
  rejected: string
  metadata: Record<string, unknown>
}

const args = process.argv.slice(2)
const sourceUrl = valueArg(args, '--url') ?? 'https://huggingface.co/datasets/syntech-ai/medical-triage-500/raw/main/medical_triage_500.jsonl'
const input = valueArg(args, '--input')
const rawOut = valueArg(args, '--raw-output') ?? defaultOut('external-synthetic-triage-500.raw.jsonl')
const output = valueArg(args, '--output') ?? defaultOut('external-synthetic-triage-500.preferences.jsonl')
const report = valueArg(args, '--report') ?? output.replace(/\.jsonl$/, '.report.json')

function download(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, response => {
      const status = response.statusCode ?? 0
      if (status >= 300 && status < 400 && response.headers.location) {
        download(new URL(response.headers.location, url).toString()).then(resolve, reject)
        return
      }
      if (status < 200 || status >= 300) {
        reject(new Error(`Download failed with HTTP ${status}`))
        return
      }
      response.setEncoding('utf8')
      let body = ''
      response.on('data', chunk => { body += chunk })
      response.on('end', () => resolve(body))
    }).on('error', reject)
  })
}

function parseRows(text: string): SourceRow[] {
  return text.split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line) as SourceRow)
}

function mapUrgency(row: SourceRow): CareLevelLabel {
  const symptoms = row.presentation.symptoms.join(' ').toLowerCase()
  const redFlags = row.risk_assessment.red_flags.join(' ').toLowerCase()
  const combined = `${symptoms} ${redFlags}`

  if (row.triage_classification.urgency_category === 'immediate') {
    if (/(chest pain|shortness of breath|blurred vision|seizure|fainting|stroke|confusion|severe bleeding|unresponsive)/.test(combined)) {
      return 'emergency'
    }
    return 'er'
  }

  if (row.triage_classification.urgency_category === 'urgent') {
    if (row.risk_assessment.risk_level === 'high' || /(chest pain|shortness of breath|blurred vision|severe|fainting)/.test(combined)) {
      return 'er'
    }
    return 'urgent_care'
  }

  if (row.risk_assessment.risk_level === 'medium') return 'primary_care'
  return 'home_care'
}

function patientText(row: SourceRow): string {
  const symptoms = row.presentation.symptoms.join(', ')
  const redFlags = row.risk_assessment.red_flags.length
    ? ` Red flags listed by the synthetic source: ${row.risk_assessment.red_flags.join(', ')}.`
    : ' No red flags are listed by the synthetic source.'

  return [
    `${row.patient.age}-year-old ${row.patient.gender} patient reports ${symptoms}.`,
    `Symptoms have lasted ${row.presentation.duration}, started ${row.presentation.onset}, and occur ${row.presentation.context}.`,
    redFlags,
  ].join(' ')
}

function promptFor(row: SourceRow): string {
  return [
    'You are Carevo Layer 3a, the feature extractor.',
    'Extract structured routing features from the patient text.',
    'You do not choose the final care level.',
    'If details are vague or conflict, ask a clarifying-question signal instead of assuming severity.',
    '',
    `Patient text: ${patientText(row)}`,
  ].join('\n')
}

function chosenFor(row: SourceRow, careLevel: CareLevelLabel): string {
  return JSON.stringify({
    type: 'external_synthetic_extractor_guidance',
    reviewerTarget: careLevel,
    behavior: row.triage_classification.urgency_category === 'routine'
      ? 'Keep low-acuity synthetic presentations conservative when no red flags are listed.'
      : 'Extract listed red flags explicitly and preserve the deterministic safety floor.',
    extractionGuidance: [
      `Synthetic source urgency category: ${row.triage_classification.urgency_category}.`,
      `Synthetic source risk level: ${row.risk_assessment.risk_level}.`,
      row.risk_assessment.red_flags.length
        ? `Extract red flags: ${row.risk_assessment.red_flags.join(', ')}.`
        : 'Do not invent red flags not present in the patient text.',
      'If the symptom combination is too broad, prefer clarification over guessing.',
    ],
    safetyLimits: [
      'Offline experiment only; noncommercial dataset license does not allow production training use without permission.',
      'Do not weaken emergency hard stops.',
      'Do not let a model choose the final care level.',
      'Deterministic route engine remains the care-level authority.',
    ],
    note: 'Synthetic external benchmark row for REE experimentation only.',
  })
}

function rejectedFor(row: SourceRow): string {
  return JSON.stringify({
    type: 'unsafe_or_unhelpful_extraction_behavior',
    rejectedObservation: {
      behavior: 'Assumes missing severity details, ignores listed red flags, or treats the model as the final route decision-maker.',
      sourceUrgencyCategory: row.triage_classification.urgency_category,
      sourceRiskLevel: row.risk_assessment.risk_level,
    },
    reason: 'REE should learn extraction and clarification behavior only, not autonomous routing.',
  })
}

function toPreference(row: SourceRow): PreferenceRow {
  const careLevel = mapUrgency(row)
  return {
    id: `syntech-medical-triage-500-${row.case_id}`,
    prompt: promptFor(row),
    chosen: chosenFor(row, careLevel),
    rejected: rejectedFor(row),
    metadata: {
      dataset: 'syntech-ai/medical-triage-500',
      sourceCaseId: row.case_id,
      datasetType: 'external_synthetic',
      license: 'cc-by-nc-4.0',
      commercialUseAllowed: false,
      offlineExperimentOnly: true,
      trainingAllowed: false,
      promotionAllowed: false,
      reviewerTarget: careLevel,
      sourceUrgencyCategory: row.triage_classification.urgency_category,
      sourceRiskLevel: row.risk_assessment.risk_level,
      sourceRedFlags: row.risk_assessment.red_flags,
      patientAge: row.patient.age,
      patientGender: row.patient.gender,
    },
  }
}

function countBy<T>(rows: T[], pick: (row: T) => string): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const key = pick(row)
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
}

async function main() {
  const raw = input ? await fs.readFile(input, 'utf8') : await download(sourceUrl)
  const rows = parseRows(raw)
  const preferences = rows.map(toPreference)

  await fs.mkdir(path.dirname(rawOut), { recursive: true })
  await fs.writeFile(rawOut, raw.endsWith('\n') ? raw : `${raw}\n`)
  await writeJsonl(output, preferences)
  await writeJson(report, {
    source: input ?? sourceUrl,
    rawOut,
    output,
    rows: rows.length,
    preferenceRows: preferences.length,
    sourceUrgencyCounts: countBy(rows, row => row.triage_classification.urgency_category),
    mappedCareLevelCounts: countBy(preferences, row => String(row.metadata.reviewerTarget)),
    license: 'cc-by-nc-4.0',
    commercialUseAllowed: false,
    offlineExperimentOnly: true,
    trainingAllowed: false,
    promotionAllowed: false,
    safety: 'Use only for offline REE experiments and benchmark expansion unless commercial permission is granted.',
  })

  console.log(JSON.stringify({
    rawOut,
    output,
    report,
    rows: rows.length,
    mappedCareLevelCounts: countBy(preferences, row => String(row.metadata.reviewerTarget)),
    commercialUseAllowed: false,
    trainingAllowed: false,
  }, null, 2))
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
