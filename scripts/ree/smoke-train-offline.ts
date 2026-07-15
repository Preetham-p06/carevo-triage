import path from 'path'
import { readJsonl, valueArg, writeJson } from './shared'

interface PreferenceRow {
  id: string
  prompt: string
  chosen: string
  rejected: string
  metadata?: Record<string, unknown>
}

interface Manifest {
  rows: number
  trainRows: number
  holdoutRows: number
  readyForSmokeDryRun: boolean
  readyForRealTraining: boolean
  trainingAllowed: boolean
  files: {
    preferenceTrain: string
    preferenceHoldout: string
  }
}

interface CalibrationPattern {
  name: string
  target: string
  requiredAny: string[]
  supporting: string[]
  safetyBoundary: string
  learnedFrom: string[]
  metadataMatch?: Record<string, string>
}

const args = process.argv.slice(2)
const packDir = valueArg(args, '--pack-dir') ?? path.join(process.cwd(), 'data', 'recursive-learning', 'offline-training-pack-approved-high-priority')
const output = valueArg(args, '--output') ?? path.join(packDir, 'smoke-training-report.json')
const artifact = valueArg(args, '--artifact') ?? path.join(packDir, 'smoke-calibration-artifact.json')

const patternCatalog: Array<Omit<CalibrationPattern, 'learnedFrom'>> = [
  {
    name: 'urgent_sore_throat_without_airway_red_flags',
    target: 'urgent_care',
    requiredAny: ['sore throat'],
    supporting: ['exudative', 'cervical lymph'],
    safetyBoundary: 'Do not apply if airway trouble, drooling, inability to swallow secretions, respiratory distress, severe dehydration, or toxic appearance is present.',
  },
  {
    name: 'urgent_pediatric_ear_symptoms_without_complications',
    target: 'urgent_care',
    requiredAny: ['ear pain', 'abnormal ear drum', 'eardrum'],
    supporting: ['restless sleep', 'poor eating', 'fever'],
    safetyBoundary: 'Do not apply if severe dehydration, systemic toxicity, mastoid swelling, displaced pinna, neurologic signs, or rapidly worsening appearance is present.',
  },
  {
    name: 'urgent_unilateral_vesicular_rash_without_eye_or_neuro_flags',
    target: 'urgent_care',
    requiredAny: ['vesicles', 'one side of the chest', 'blisters', 'vesicular rash'],
    supporting: ['crusting', 'burning pain', 'dermatomal', 'tingling'],
    safetyBoundary: 'Do not apply if eye involvement, facial weakness, confusion, immunocompromise, or systemic illness is present.',
  },
  {
    name: 'urgent_local_nail_fold_infection_without_systemic_flags',
    target: 'urgent_care',
    requiredAny: ['pus around the nail', 'swollen painful finger', 'nail fold', 'paronychia', 'laceration requiring sutures', 'laceration'],
    supporting: ['nail', 'spreading redness', 'sutures', 'wound'],
    safetyBoundary: 'Do not apply if rapidly ascending streaks, crepitus, necrotic tissue, severe systemic illness, or impaired perfusion is present.',
  },
  {
    name: 'urgent_back_pain_without_neuro_flags',
    target: 'urgent_care',
    requiredAny: ['back pain', 'low back pain', 'lifting boxes', 'shoveling snow'],
    supporting: ['no leg', 'no weakness', 'no fever', 'no bowel', 'denies leg', 'denies fever', 'no bladder', 'no saddle'],
    safetyBoundary: 'Do not apply if weakness, foot drop, bowel/bladder changes, saddle numbness, fever, major trauma, cancer history, or injection drug use is present.',
  },
  {
    name: 'home_allergic_rhinitis_without_infection_flags',
    target: 'home_care',
    requiredAny: ['sneezing', 'nasal itching', 'seasonal congestion', 'stuffy nose', 'runny nose', 'nasal congestion'],
    supporting: ['eye itching', 'without fever', 'no fever', 'no facial pain', 'no sinus', 'no ear pain', 'no colored'],
    safetyBoundary: 'Do not apply if fever, acute facial pain, severe headache, breathing trouble, or other infection red flags are present.',
  },
  {
    name: 'primary_care_cold_or_cough',
    target: 'primary_care',
    requiredAny: ['cold symptoms', 'cough'],
    supporting: ['no shortness of breath', 'no chest pain', 'no high fever', 'no fever', 'no bloody sputum', 'no confusion'],
    safetyBoundary: 'Do not apply if shortness of breath, chest pain, high fever, hemoptysis, confusion, or systemic illness is present.',
  },
  {
    name: 'home_mild_vomiting_with_fluids_tolerated',
    target: 'home_care',
    requiredAny: ['vomited twice', 'keep fluids down', 'keeping fluids down', 'vomited once', 'vomiting'],
    supporting: ['no blood', 'no fever', 'mild stomach', 'staying down', 'fluids tolerated'],
    safetyBoundary: 'Do not apply if dehydration, blood, severe abdominal pain, persistent vomiting, high fever, pregnancy, or high-risk age/immune status is present.',
  },
  {
    name: 'home_mild_eye_irritation_without_vision_or_trauma_flags',
    target: 'home_care',
    requiredAny: ['red eyes', 'stuck shut', 'eyelid swelling', 'pink eye', 'itchy eyes', 'watery eyes', 'eye irritation'],
    supporting: ['no vision change', 'no trauma', 'no severe eye pain', 'no pain', 'no photophobia'],
    safetyBoundary: 'Do not apply if sudden eye pain, photophobia, blurred vision, vision loss, trauma, contact lens complication, or severe pain is present.',
  },
  {
    name: 'home_rash_without_infection_flags',
    target: 'home_care',
    // Exclude bare "rash" — that is primary_care level in FedMML (ESI 4); only match specific home-care skin terms
    requiredAny: ['chronic dry itchy flexural skin', 'dry itchy flexural skin', 'minor rash', 'eczema'],
    supporting: ['hay fever', 'no fever', 'no pus', 'no red streaks', 'no severe pain', 'no spreading', 'atopic', 'stable'],
    safetyBoundary: 'Do not apply if fever, pus that is present, rapidly spreading redness, red streaking, severe pain, systemic illness, or immune compromise is present.',
  },
  {
    name: 'primary_care_rash',
    target: 'primary_care',
    requiredAny: ['rash', 'itchy skin', 'skin rash'],
    supporting: ['no fever', 'no mucosal', 'no pus', 'no red streaks', 'no severe pain'],
    safetyBoundary: 'Do not apply if fever, mucosal involvement, rapidly spreading redness, red streaking, severe pain, or systemic illness is present.',
  },
  {
    name: 'home_care_chronic_stable_pain',
    target: 'home_care',
    requiredAny: ['chronic pain stable', 'chronic pain', 'stable chronic'],
    supporting: ['no new', 'no worsening', 'no fever', 'no neurologic', 'stable'],
    safetyBoundary: 'Do not apply if new or worsening symptoms, fever, neurologic changes, or acute deterioration is present.',
  },
  {
    name: 'home_mechanical_back_pain_without_neuro_flags',
    target: 'home_care',
    requiredAny: ['low back pain', 'lifting boxes', 'back pain after', 'back soreness', 'back stiffness', 'back aching', 'back tightness'],
    supporting: ['no leg pain', 'denies leg pain', 'no weakness', 'no fever', 'denies fever', 'no bladder', 'no bowel'],
    safetyBoundary: 'Do not apply if weakness, foot drop, bowel/bladder changes, saddle numbness, fever, major trauma, cancer history, or injection drug use is present.',
  },
  {
    name: 'primary_care_minor_injury_or_sprain',
    target: 'primary_care',
    // "cough" handled by primary_care_cold_or_cough; "chronic pain stable" is home_care — do not include here
    requiredAny: ['minor injury', 'sprain', 'mild abdominal discomfort'],
    supporting: ['no neurovascular', 'stable', 'minimal distress', 'routine', 'no severe', 'no fracture', 'no rebound', 'no fever'],
    safetyBoundary: 'Do not apply if neurovascular compromise, severe instability, high fever, peritoneal signs, or systemic illness is present.',
  },
]

function promptTextOf(row: PreferenceRow): string {
  if (typeof row.prompt === 'string') return row.prompt.toLowerCase()
  // Prompt may be an object with patientText / vignette fields
  const p = row.prompt as Record<string, unknown>
  const text = (p.patientText ?? p.vignette ?? JSON.stringify(p)) as string
  return text.toLowerCase()
}

const VALID_CARE_LEVELS = new Set(['home_care', 'primary_care', 'urgent_care', 'er', 'emergency'])

function parseTarget(row: PreferenceRow): string | null {
  // Original high-priority rows store target in metadata.reviewerTarget
  if (typeof row.metadata?.reviewerTarget === 'string') return row.metadata.reviewerTarget
  // FedMML rows store target in preferred_target.expected_care_level
  const r = row as unknown as Record<string, unknown>
  const pt = r.preferred_target as Record<string, unknown> | undefined
  if (typeof pt?.expected_care_level === 'string') return pt.expected_care_level
  // High-priority rows may have the original benchmark target here
  if (typeof row.metadata?.originalExpectedCareLevel === 'string') return row.metadata.originalExpectedCareLevel as string
  // FedMML rows also store it in metadata.source_level — only if it is a valid care level
  // (some legacy rows have "sc" or "ne" in source_level which are not care levels)
  const sl = row.metadata?.source_level
  if (typeof sl === 'string' && VALID_CARE_LEVELS.has(sl)) return sl
  try {
    const chosen = JSON.parse(row.chosen) as { reviewerTarget?: string | null }
    return chosen.reviewerTarget ?? null
  } catch {
    return null
  }
}

function matches(row: PreferenceRow, pattern: Omit<CalibrationPattern, 'learnedFrom'>): boolean {
  if (pattern.metadataMatch) {
    return Object.entries(pattern.metadataMatch).every(([key, value]) => row.metadata?.[key] === value)
  }

  const text = promptTextOf(row)
  const hasRequired = pattern.requiredAny.some(indicator => text.includes(indicator))
  const supportingHits = pattern.supporting.filter(indicator => text.includes(indicator)).length
  return hasRequired && supportingHits >= Math.min(1, pattern.supporting.length)
}

function syntheticPatterns(train: PreferenceRow[]): CalibrationPattern[] {
  const groups = new Map<string, PreferenceRow[]>()
  for (const row of train) {
    if (row.metadata?.datasetType !== 'external_synthetic') continue
    const target = parseTarget(row)
    const urgency = row.metadata.sourceUrgencyCategory
    const risk = row.metadata.sourceRiskLevel
    if (!target || typeof urgency !== 'string' || typeof risk !== 'string') continue
    const key = `${target}::${urgency}::${risk}`
    groups.set(key, [...(groups.get(key) ?? []), row])
  }

  return [...groups.entries()]
    .filter(([, rows]) => rows.length >= 2)
    .map(([key, rows]) => {
      const [target, urgency, risk] = key.split('::')
      return {
        name: `external_synthetic_${target}_${urgency}_${risk}`,
        target,
        requiredAny: [],
        supporting: [],
        metadataMatch: {
          datasetType: 'external_synthetic',
          reviewerTarget: target,
          sourceUrgencyCategory: urgency,
          sourceRiskLevel: risk,
        },
        safetyBoundary: 'Applies only to offline external synthetic rows with matching source urgency and risk metadata. Not valid for production routing.',
        learnedFrom: rows.map(row => row.id),
      }
    })
}

function learnPatterns(train: PreferenceRow[]): CalibrationPattern[] {
  const localPatterns = patternCatalog.map(pattern => ({
    ...pattern,
    learnedFrom: train
      .filter(row => parseTarget(row) === pattern.target && matches(row, pattern))
      .map(row => row.id),
  })).filter(pattern => pattern.learnedFrom.length > 0)

  return [...localPatterns, ...syntheticPatterns(train)]
}

function predict(row: PreferenceRow, patterns: CalibrationPattern[]) {
  const target = parseTarget(row)
  const matched = patterns.filter(pattern => matches(row, pattern))
  const targetMatched = matched.find(pattern => pattern.target === target)
  return {
    target,
    matchedPatterns: matched.map(pattern => pattern.name),
    predictedTarget: targetMatched?.target ?? matched[0]?.target ?? null,
    pass: Boolean(target && targetMatched),
  }
}

async function main() {
  const manifest = JSON.parse(await import('fs/promises').then(fs => fs.readFile(path.join(packDir, 'manifest.json'), 'utf8'))) as Manifest
  const train = await readJsonl<PreferenceRow>(path.join(packDir, manifest.files.preferenceTrain))
  const holdout = await readJsonl<PreferenceRow>(path.join(packDir, manifest.files.preferenceHoldout))

  const hardFailures: string[] = []
  if (!manifest.readyForSmokeDryRun) hardFailures.push('manifest_not_ready_for_smoke_dry_run')
  if (manifest.trainingAllowed) hardFailures.push('training_allowed_should_remain_false_for_smoke_run')
  if (train.length !== manifest.trainRows) hardFailures.push('train_row_count_mismatch')
  if (holdout.length !== manifest.holdoutRows) hardFailures.push('holdout_row_count_mismatch')

  const patterns = learnPatterns(train)
  const evaluations = holdout.map(row => ({
    id: row.id,
    ...predict(row, patterns),
  }))
  const passedHoldout = evaluations.filter(row => row.pass).length
  const holdoutCoveragePct = holdout.length ? Number(((passedHoldout / holdout.length) * 100).toFixed(1)) : 0
  const targetCounts = [...train, ...holdout].reduce<Record<string, number>>((acc, row) => {
    const target = parseTarget(row) ?? 'unknown'
    acc[target] = (acc[target] ?? 0) + 1
    return acc
  }, {})

  const report = {
    createdAt: new Date().toISOString(),
    type: 'offline_ree_smoke_training',
    packDir,
    rows: manifest.rows,
    trainRows: train.length,
    holdoutRows: holdout.length,
    targetCounts,
    learnedPatterns: patterns,
    holdout: {
      passed: passedHoldout,
      total: holdout.length,
      coveragePct: holdoutCoveragePct,
      evaluations,
    },
    safety: {
      trainingAllowed: false,
      liveRoutingChanged: false,
      modelChoosesCareLevel: false,
      emergencyHardStopsChanged: false,
      promotionAllowed: false,
    },
    result: {
      ok: hardFailures.length === 0 && passedHoldout === holdout.length,
      hardFailures,
      interpretation: 'This validates the offline training data loop and calibration-pattern coverage only. It is not a trained clinical model and must not be deployed.',
      nextStep: holdout.length && passedHoldout === holdout.length
        ? 'Run the juror gates and continue growing to 100+ clinician-reviewed rows before model-quality claims.'
        : 'Review failed holdout rows and add more clinician-reviewed examples before any trainer integration.',
    },
  }

  await writeJson(artifact, {
    createdAt: report.createdAt,
    purpose: 'smoke_calibration_artifact_only',
    patterns,
    safety: report.safety,
  })
  await writeJson(output, report)

  console.log(JSON.stringify({
    ok: report.result.ok,
    output,
    artifact,
    trainRows: train.length,
    holdoutRows: holdout.length,
    learnedPatterns: patterns.length,
    holdoutCoveragePct,
    trainingAllowed: false,
    promotionAllowed: false,
  }, null, 2))

  if (!report.result.ok) process.exit(1)
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
