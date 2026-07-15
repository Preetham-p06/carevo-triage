// ─────────────────────────────────────────────────────────────────────────────
// Carevo Route Engine — feature schema
// The LLM's ONLY job is to interview the patient and fill in these features.
// It never picks a care level and never names a condition. The decision is
// made by Carevo's own routing model (model.ts).
// ─────────────────────────────────────────────────────────────────────────────

export type BodySystem =
  | 'cardiac' | 'respiratory' | 'neuro' | 'gi' | 'msk' | 'skin'
  | 'ent' | 'urinary' | 'gyn' | 'mental' | 'general'

export const PRESENTATION_TYPES = [
  'cardiac',
  'neuro',
  'respiratory',
  'gi',
  'msk',
  'urinary',
  'skin',
  'pediatric',
  'mental_health',
  'allergic',
  'eye',
  'dental',
  'general',
] as const

export type PresentationType = (typeof PRESENTATION_TYPES)[number]

export type DurationBucket = 'under6h' | '6to48h' | '2to7d' | 'over7d'

export const RED_FLAGS = [
  'breathing_difficulty',
  'chest_pressure',
  'fainting_or_confusion',
  'one_sided_weakness',
  'worst_headache_of_life',
  'uncontrolled_bleeding',
  'severe_dehydration',
  'stiff_neck_with_fever',
  'sudden_vision_loss',
  'pregnancy_bleeding_or_pain',
  'allergic_swelling',
  'suicidal_thoughts',
  'infant_under_3mo_fever',
] as const

export type RedFlag = (typeof RED_FLAGS)[number]

export interface ExtractedFeatures {
  /** Presentation-specific interview lane; routing still comes from the engine */
  presentationType?: PresentationType
  /** Primary body system involved */
  system: BodySystem
  /** 0 mild · 1 moderate · 2 significant · 3 severe */
  severity: 0 | 1 | 2 | 3
  suddenOnset: boolean
  duration: DurationBucket
  worsening: boolean
  /** 0 none · 1 annoying · 2 limits activity · 3 can't function */
  functionalImpact: 0 | 1 | 2 | 3
  redFlags: RedFlag[]
  possibleFracture: boolean
  openWound: boolean
  highFever: boolean
  /** One-line symptom summary in the patient's words — NO condition names */
  summary: string
}

/** Risk modifiers derived from the patient's saved health history. */
export type RiskModifier =
  | 'age_over_65' | 'age_under_2' | 'pregnant' | 'diabetes'
  | 'heart_disease' | 'immunocompromised' | 'smoker' | 'lung_condition'
  | 'active_chemo'   // subset of immunocompromised with a stricter fever floor (febrile neutropenia risk)

export interface PatientRisk {
  modifiers: RiskModifier[]
}

/** Derive risk modifiers from the free-text guest health history. */
export function deriveRisk(h: {
  age?: string; conditions?: string; smoking?: string; vaping?: string; periodHistory?: string
} | null | undefined): PatientRisk {
  const modifiers: RiskModifier[] = []
  if (!h) return { modifiers }

  const age = parseInt(h.age ?? '', 10)
  if (!isNaN(age) && age >= 65) modifiers.push('age_over_65')
  if (!isNaN(age) && age < 2) modifiers.push('age_under_2')

  const cond = (h.conditions ?? '').toLowerCase()
  if (/diabet/.test(cond)) modifiers.push('diabetes')
  if (/heart|cardiac|hypertension|blood pressure|afib|arrhythm/.test(cond)) modifiers.push('heart_disease')
  if (/immuno|chemo|transplant|hiv|lupus/.test(cond)) modifiers.push('immunocompromised')
  if (/chemo/.test(cond)) modifiers.push('active_chemo')
  if (/asthma|copd|emphysema/.test(cond)) modifiers.push('lung_condition')

  if (h.smoking === 'current' || h.vaping === 'current') modifiers.push('smoker')
  if (/pregnan/i.test(h.periodHistory ?? '')) modifiers.push('pregnant')

  return { modifiers }
}

/** Deterministic fallback for the presentation-specific interview lane.
 *  The extractor may set `presentationType`, but EVOI never depends on that
 *  alone. Red flags and risk context can override the generic body system so
 *  high-risk patterns get the right question ladder. */
export function inferPresentationType(
  f: ExtractedFeatures,
  risk: PatientRisk = { modifiers: [] },
): PresentationType {
  if (f.redFlags.includes('allergic_swelling')) return 'allergic'
  if (f.redFlags.includes('sudden_vision_loss')) return 'eye'
  if (f.redFlags.includes('suicidal_thoughts') || f.system === 'mental') return 'mental_health'
  if (risk.modifiers.includes('age_under_2') || f.redFlags.includes('infant_under_3mo_fever')) return 'pediatric'
  if (f.presentationType && PRESENTATION_TYPES.includes(f.presentationType)) return f.presentationType

  switch (f.system) {
    case 'cardiac': return 'cardiac'
    case 'respiratory': return 'respiratory'
    case 'neuro': return 'neuro'
    case 'gi':
    case 'gyn':
      return 'gi'
    case 'msk': return 'msk'
    case 'urinary': return 'urinary'
    case 'skin': return 'skin'
    default: return 'general'
  }
}
