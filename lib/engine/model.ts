// ─────────────────────────────────────────────────────────────────────────────
// Carevo Route Engine v1.1 — the routing model.
// A transparent, trainable linear scoring model. Every feature contributes
// weight toward one or more care levels; softmax gives a level distribution.
// Hard safety floors now live in the Clinical Rule Layer (rules.ts): versioned,
// cited, floors-only, and never trainable.
// ─────────────────────────────────────────────────────────────────────────────

import type { ExtractedFeatures, PatientRisk } from './features'
import { SCORED_LEVELS, LEVEL_RANK, type EngineLevel } from './levels'
import { applyRules, RULESET_VERSION, type ClinicalRule } from './rules'

export const ENGINE_VERSION = 'Carevo Route Engine v1.1'
export type { EngineLevel } from './levels'

const LEVELS = SCORED_LEVELS

type LevelWeights = Partial<Record<EngineLevel, number>>

/** Weight adjustments learned from outcome feedback: featureKey -> level -> delta */
export type Adjustments = Record<string, LevelWeights>

// ── Base weights (clinically seeded; the trainable part of the model) ────────
const BASE_WEIGHTS: Record<string, LevelWeights> = {
  // Severity
  'severity:0': { home_care: 2.0, telehealth: 1.0 },
  'severity:1': { home_care: 0.8, telehealth: 1.5, primary_care: 0.8 },
  'severity:2': { primary_care: 0.5, urgent_care: 1.5, er: 0.4 },
  'severity:3': { urgent_care: 1.0, er: 2.0 },

  // Onset / trajectory
  'onset:sudden': { urgent_care: 0.4, er: 0.8 },
  'trend:worsening': { urgent_care: 0.8, er: 0.4 },

  // Duration
  'duration:under6h': { urgent_care: 0.5, er: 0.3 },
  'duration:6to48h': { telehealth: 0.3, urgent_care: 0.5 },
  'duration:2to7d': { telehealth: 0.5, primary_care: 1.0 },
  'duration:over7d': { home_care: 0.2, telehealth: 0.3, primary_care: 1.5 },

  // Functional impact
  'impact:0': { home_care: 1.0, telehealth: 0.5 },
  'impact:1': { home_care: 0.3, telehealth: 0.8 },
  'impact:2': { primary_care: 0.5, urgent_care: 0.8 },
  'impact:3': { urgent_care: 0.8, er: 1.0 },

  // Body system priors
  'system:cardiac': { urgent_care: 0.5, er: 1.5 },
  'system:respiratory': { urgent_care: 0.8, er: 0.5 },
  'system:neuro': { urgent_care: 0.4, er: 1.2 },
  'system:gi': { telehealth: 0.3, urgent_care: 0.5 },
  'system:msk': { primary_care: 0.4, urgent_care: 0.6 },
  'system:skin': { telehealth: 0.6, urgent_care: 0.4 },
  'system:ent': { home_care: 0.3, telehealth: 0.8, primary_care: 0.5 },
  'system:urinary': { telehealth: 0.6, primary_care: 0.6, urgent_care: 0.3 },
  'system:gyn': { primary_care: 0.6, urgent_care: 0.4 },
  // Mental health: non-crisis presentations route to telehealth/primary care
  // even at higher severity — urgent care adds little for behavioral health
  // (trial finding: anxiety consistently over-triaged to urgent care). Crisis
  // presentations are handled by the self-harm net + suicidal_thoughts floor.
  'system:mental': { telehealth: 1.5, primary_care: 1.2 },
  'system:general': { telehealth: 0.4, primary_care: 0.4 },

  // Procedure needs
  'flag:possibleFracture': { urgent_care: 2.0 },
  'flag:openWound': { urgent_care: 1.5 },
  'flag:highFever': { urgent_care: 1.0, er: 0.3 },

  // Patient risk modifiers
  'risk:age_over_65': { urgent_care: 0.4, er: 0.4 },
  'risk:age_under_2': { urgent_care: 0.5 },
  'risk:pregnant': { urgent_care: 0.4 },
  'risk:diabetes': { urgent_care: 0.3 },
  'risk:heart_disease': { er: 0.5 },
  'risk:immunocompromised': { urgent_care: 0.5, er: 0.3 },
  'risk:lung_condition_resp': { urgent_care: 0.5, er: 0.4 },   // only when respiratory
  'risk:smoker_cardioresp': { er: 0.4 },                        // only when cardiac/respiratory
}

const FACTOR_LABELS: Record<string, string> = {
  // Patient-facing wording, not clinical severity words (Paul's rule +
  // simple-English requirement — patients can't judge "mild/moderate").
  'severity:3': 'Symptoms are very intense', 'severity:2': 'Symptoms are strongly affecting you',
  'severity:1': 'Symptoms are bothering you but manageable', 'severity:0': 'Symptoms are not stopping your daily activities',
  'onset:sudden': 'Sudden onset', 'trend:worsening': 'Getting worse',
  'impact:3': 'Unable to function normally', 'impact:2': 'Limiting daily activity',
  'flag:possibleFracture': 'Possible fracture (needs imaging)',
  'flag:openWound': 'Open wound (may need stitches)',
  'flag:highFever': 'High fever',
  'risk:age_over_65': 'Age 65+', 'risk:age_under_2': 'Very young child',
  'risk:pregnant': 'Pregnancy', 'risk:diabetes': 'Diabetes history',
  'risk:heart_disease': 'Heart condition history',
  'risk:immunocompromised': 'Weakened immune system',
  'risk:lung_condition_resp': 'Existing lung condition',
  'risk:smoker_cardioresp': 'Smoking history with chest/breathing symptoms',
}

export interface EngineDecision {
  careLevel: EngineLevel
  confidence: number
  factors: string[]
  featureKeys: string[]
  /** id of the highest-floor clinical rule that fired, or null */
  floorApplied: string | null
  /** all clinical rules that fired (floors-only, cited, versioned) */
  rulesFired: ClinicalRule[]
  /** softmax distribution over the five scored levels (pre-floor) */
  distribution: Record<EngineLevel, number>
  version: string
  rulesetVersion: string
}

/**
 * The model's posterior over the five scored levels for a feature vector.
 * Exposed separately so EVOI question selection (evoi.ts) can query
 * hypothetical completions cheaply without assembling a full decision.
 */
export function distribution(
  f: ExtractedFeatures,
  risk: PatientRisk,
  adjustments: Adjustments = {},
): { probs: Record<EngineLevel, number>; keys: string[] } {
  const keys = featureKeys(f, risk)
  const scores: Record<EngineLevel, number> = {
    home_care: 0, telehealth: 0, primary_care: 0, urgent_care: 0, er: 0, emergency: -Infinity,
  }
  for (const key of keys) {
    const base = BASE_WEIGHTS[key] ?? {}
    const adj = adjustments[key] ?? {}
    for (const level of LEVELS) {
      scores[level] += (base[level] ?? 0) + clamp(adj[level] ?? 0, -1, 1)
    }
  }
  const max = Math.max(...LEVELS.map(l => scores[l]))
  const exps = LEVELS.map(l => Math.exp(scores[l] - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  const probs = {
    home_care: 0, telehealth: 0, primary_care: 0, urgent_care: 0, er: 0, emergency: 0,
  } as Record<EngineLevel, number>
  LEVELS.forEach((l, i) => { probs[l] = exps[i] / sum })
  return { probs, keys }
}

/** Turn features + risk into the active feature keys for scoring. */
export function featureKeys(f: ExtractedFeatures, risk: PatientRisk): string[] {
  const keys: string[] = [
    `severity:${f.severity}`,
    `system:${f.system}`,
    `duration:${f.duration}`,
    `impact:${f.functionalImpact}`,
  ]
  if (f.suddenOnset) keys.push('onset:sudden')
  if (f.worsening) keys.push('trend:worsening')
  if (f.possibleFracture) keys.push('flag:possibleFracture')
  if (f.openWound) keys.push('flag:openWound')
  if (f.highFever) keys.push('flag:highFever')

  for (const m of risk.modifiers) {
    if (m === 'smoker') {
      if (f.system === 'cardiac' || f.system === 'respiratory') keys.push('risk:smoker_cardioresp')
    } else if (m === 'lung_condition') {
      if (f.system === 'respiratory') keys.push('risk:lung_condition_resp')
    } else {
      keys.push(`risk:${m}`)
    }
  }
  return keys
}

function argmaxLevel(probs: Record<EngineLevel, number>): EngineLevel {
  let best: EngineLevel = LEVELS[0]
  for (const l of LEVELS) if (probs[l] > probs[best]) best = l
  return best
}

export function decide(
  f: ExtractedFeatures,
  risk: PatientRisk,
  adjustments: Adjustments = {},
): EngineDecision {
  const { probs, keys } = distribution(f, risk, adjustments)

  let best: EngineLevel = argmaxLevel(probs)
  let confidence = probs[best]

  // ── Monotonicity guard ─────────────────────────────────────────────────────
  // A linear softmax can route a MORE severe presentation LOWER than a milder
  // one (weight mass shifting between adjacent levels) — caught by the
  // property-based eval. Clinical requirement: a presentation must never
  // route below any strictly milder version of itself, and risk modifiers
  // must never lower acuity. Enforced by envelope: evaluate milder variants
  // and take the highest level. (A GBM with monotone constraints replaces
  // this structurally in Phase 2.)
  // Envelope = every milder (severity, impact) pair × {with modifiers,
  // without modifiers}. The without-modifier axis matters: decide(f, mods)
  // must dominate decide(f, {}) INCLUDING the raises {}'s own envelope finds.
  let guardRaised = false
  const variants: Array<{ vf: ExtractedFeatures; vr: PatientRisk }> = []
  const NO_RISK: PatientRisk = { modifiers: [] }
  for (let s = 0; s <= f.severity; s++) {
    for (let i = 0; i <= f.functionalImpact; i++) {
      const isSelf = s === f.severity && i === f.functionalImpact
      const vf = isSelf ? f : { ...f, severity: s as 0 | 1 | 2 | 3, functionalImpact: i as 0 | 1 | 2 | 3 }
      if (!isSelf) variants.push({ vf, vr: risk })
      if (risk.modifiers.length) variants.push({ vf, vr: NO_RISK })
    }
  }
  for (const { vf, vr } of variants) {
    const vProbs = distribution(vf, vr, adjustments).probs
    const vBest = argmaxLevel(vProbs)
    if (LEVEL_RANK[vBest] > LEVEL_RANK[best]) {
      best = vBest
      confidence = vProbs[vBest]
      guardRaised = true
    }
  }

  // Clinical Rule Layer — deterministic floors. Upgrade only, never downgrade.
  const ruleResult = applyRules(f, risk)
  let floorApplied: string | null = null
  if (ruleResult.floor && LEVEL_RANK[ruleResult.floor] > LEVEL_RANK[best]) {
    best = ruleResult.floor
    confidence = Math.max(confidence, 0.9)
    floorApplied = ruleResult.fired[0].id
  }

  // Human-readable factors (red flags first, then top contributors).
  // Patient-facing flag names use plain words — no clinical severity buckets
  // (round-14 audit caught "Red flag: severe dehydration" reaching patients).
  const FLAG_PATIENT_LABELS: Partial<Record<string, string>> = {
    severe_dehydration: 'Signs of serious dehydration (fluids not staying down)',
    breathing_difficulty: 'Trouble breathing',
    chest_pressure: 'Chest pressure or tightness',
    fainting_or_confusion: 'Fainting or new confusion',
    one_sided_weakness: 'Weakness on one side of the body',
    worst_headache_of_life: 'Unusually intense sudden headache',
    uncontrolled_bleeding: 'Bleeding that will not stop',
    stiff_neck_with_fever: 'Stiff neck together with fever',
    sudden_vision_loss: 'Sudden change or loss of vision',
    pregnancy_bleeding_or_pain: 'Bleeding or pain during pregnancy',
    allergic_swelling: 'Swelling of the face, lips, or throat',
    infant_under_3mo_fever: 'Fever in a baby under 3 months',
  }
  const factors: string[] = []
  for (const flag of f.redFlags) factors.push(`Red flag: ${FLAG_PATIENT_LABELS[flag] ?? flag.replace(/_/g, ' ')}`)
  if (guardRaised) factors.push('Kept at the safer level for consistency with similar presentations')
  for (const rule of ruleResult.fired) {
    if (!rule.id.startsWith('rf.')) factors.push(rule.description.split(' — ')[0])
  }
  const contributions = keys
    .map(k => ({ k, w: (BASE_WEIGHTS[k]?.[best] ?? 0) + (adjustments[k]?.[best] ?? 0) }))
    .filter(c => c.w > 0.25 && FACTOR_LABELS[c.k])
    .sort((a, b) => b.w - a.w)
    .slice(0, 4)
  for (const c of contributions) factors.push(FACTOR_LABELS[c.k])

  return {
    careLevel: best,
    confidence: Math.round(confidence * 100) / 100,
    factors: factors.slice(0, 5),
    featureKeys: keys,
    floorApplied,
    rulesFired: ruleResult.fired,
    distribution: probs,
    version: ENGINE_VERSION,
    rulesetVersion: RULESET_VERSION,
  }
}

/** Online learning from outcome feedback. Safety floors are untouched. */
export function applyFeedback(
  adjustments: Adjustments,
  keys: string[],
  careLevel: EngineLevel,
  outcome: 'right_place' | 'wrong_place',
  learningRate = 0.05,
): Adjustments {
  if (careLevel === 'emergency') return adjustments
  const delta = outcome === 'right_place' ? learningRate : -learningRate
  const next: Adjustments = { ...adjustments }
  for (const key of keys) {
    next[key] = { ...(next[key] ?? {}) }
    next[key][careLevel] = clamp((next[key][careLevel] ?? 0) + delta, -1, 1)
  }
  return next
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}

/** True if this is a real feature key the model knows — rejects arbitrary input. */
export function isValidFeatureKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(BASE_WEIGHTS, key)
}

export function isValidLevel(level: string): level is EngineLevel {
  return ['home_care', 'telehealth', 'primary_care', 'urgent_care', 'er', 'emergency'].includes(level)
}
