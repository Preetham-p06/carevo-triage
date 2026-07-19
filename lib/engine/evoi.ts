// ─────────────────────────────────────────────────────────────────────────────
// Carevo EVOI v0 — engine-driven question selection.
//
// This inverts the V1 interview: the LLM no longer chooses what to ask.
// The engine computes, for every feature it doesn't yet know, the expected
// reduction in routing uncertainty if the patient answered it (expected value
// of information), with a safety asymmetry: questions that could RULE IN an
// emergency outrank questions that could only rule one out. The LLM's job is
// reduced to phrasing the engine's chosen question empathetically.
//
// Why: the question policy becomes explainable ("asked because it separates
// urgent-care vs ER in this posterior"), auditable, and — once outcome data
// accumulates — trainable. A prompt-driven interview is none of those.
// ─────────────────────────────────────────────────────────────────────────────

import type { ExtractedFeatures, PatientRisk, RedFlag, BodySystem, PresentationType } from './features'
import { inferPresentationType } from './features'
import { distribution, type Adjustments } from './model'
import { applyRules } from './rules'
import { SCORED_LEVELS, LEVEL_RANK, type EngineLevel } from './levels'

/** Feature fields the extractor can mark as established vs. defaulted. */
export const KNOWABLE_FIELDS = [
  'system', 'severity', 'suddenOnset', 'duration', 'worsening',
  'functionalImpact', 'possibleFracture', 'openWound', 'highFever',
] as const
export type KnowableField = (typeof KNOWABLE_FIELDS)[number]

export interface AskTarget {
  /** 'severity' | 'duration' | ... | 'redFlag:chest_pressure' */
  target: string
  evoi: number
  /** Probability mass on "this answer would escalate to ER+" */
  dangerMass: number
  /** What the LLM should elicit — the LLM phrases this, it doesn't choose it */
  hint: string
  /** Why the engine picked it — for the audit log and clinician view */
  rationale: string
}

export interface InterviewPlan {
  action: 'decide' | 'ask'
  /** Ranked ask candidates (top 3) — present even when deciding, for audit */
  asks: AskTarget[]
  /** True if the budget ran out with an ambiguous posterior → round up (I5) */
  roundUp: boolean
  entropy: number
  topLevel: EngineLevel
  confidence: number
  margin: number
}

const MAX_QUESTIONS = 4
const CONFIDENCE_TO_DECIDE = 0.5
const MARGIN_TO_DECIDE = 0.12
const MIN_USEFUL_EVOI = 0.04
/** Safety asymmetry: mass on "this answer would escalate to ER+" is worth this
 *  many nats of entropy reduction. Under-triage is far costlier than a question. */
const DANGER_WEIGHT = 2.0

// ── Priors over unanswered fields (cold-start; V2 learns these from data) ────
const FIELD_VALUES: Record<KnowableField, Array<{ v: unknown; p: number }>> = {
  system: [],                                             // never asked via EVOI — extractor infers it
  severity: [0, 1, 2, 3].map((v, i) => ({ v, p: [0.2, 0.35, 0.3, 0.15][i] })),
  suddenOnset: [{ v: true, p: 0.25 }, { v: false, p: 0.75 }],
  duration: (['under6h', '6to48h', '2to7d', 'over7d'] as const).map((v, i) => ({ v, p: [0.3, 0.35, 0.2, 0.15][i] })),
  worsening: [{ v: true, p: 0.35 }, { v: false, p: 0.65 }],
  functionalImpact: [0, 1, 2, 3].map((v, i) => ({ v, p: [0.25, 0.3, 0.3, 0.15][i] })),
  possibleFracture: [{ v: true, p: 0.3 }, { v: false, p: 0.7 }],
  openWound: [{ v: true, p: 0.2 }, { v: false, p: 0.8 }],
  highFever: [{ v: true, p: 0.2 }, { v: false, p: 0.8 }],
}

/** Unscreened red flags with at least this much escalation mass BLOCK a
 *  confident decide — a triage nurse doesn't skip the chest-pain questions
 *  because the patient "sounds fine". Budget exhaustion still decides. */
const MUST_SCREEN_DANGER = 0.05

/** P(red flag present) conditioned on severity and body system — replaces a
 *  flat prior so a sniffle doesn't force screening but chest symptoms do. */
const FLAG_PRIOR_BY_SEVERITY = [0.03, 0.08, 0.15, 0.25]
const FLAG_PRIOR_SYSTEM_MULT: Record<BodySystem, number> = {
  cardiac: 1.5, neuro: 1.5, respiratory: 1.3, gi: 1.0, gyn: 1.0, urinary: 0.8,
  general: 1.0, ent: 0.6, skin: 0.6, msk: 0.5, mental: 1.0,
}
function redFlagPrior(f: ExtractedFeatures): number {
  return Math.min(0.35, FLAG_PRIOR_BY_SEVERITY[f.severity] * (FLAG_PRIOR_SYSTEM_MULT[f.system] ?? 1))
}

/** Red flags worth actively screening for, per body system.
 *  Deliberately excluded: suicidal_thoughts (handled by the safety nets and
 *  crisis flow — never probed by a routing questionnaire) and
 *  infant_under_3mo_fever (derived from age + fever, not asked directly).
 *  Exported: the knowledge graph derives system→flag edges from this map. */
export const SCREENABLE_RED_FLAGS: Record<BodySystem, RedFlag[]> = {
  cardiac: ['chest_pressure', 'breathing_difficulty', 'fainting_or_confusion'],
  respiratory: ['breathing_difficulty', 'chest_pressure'],
  neuro: ['one_sided_weakness', 'worst_headache_of_life', 'fainting_or_confusion', 'sudden_vision_loss', 'stiff_neck_with_fever'],
  gi: ['severe_dehydration', 'uncontrolled_bleeding'],
  msk: ['uncontrolled_bleeding'],
  skin: ['allergic_swelling', 'uncontrolled_bleeding'],
  ent: ['breathing_difficulty', 'stiff_neck_with_fever'],
  urinary: ['severe_dehydration'],
  gyn: ['pregnancy_bleeding_or_pain', 'severe_dehydration'],
  mental: [],
  general: ['fainting_or_confusion', 'breathing_difficulty'],
}

const FIELD_HINTS: Record<KnowableField, string> = {
  system: '',
  // Clinician rule (Paul, 2026-07-15): NEVER ask patients to self-rate
  // severity (1–10 scales, mild/moderate/severe) — people can't judge those
  // categories. Ask about concrete, observable effects; the extractor maps
  // the answer onto the internal 0–3 severity feature.
  // (This text also serves as the deterministic fallback question when the
  // LLM phraser is down, so it must read cleanly to a patient as-is.)
  severity: 'what the symptom is stopping you from doing right now — walking, talking, sleeping, eating — and whether it is the worst you have ever had',
  suddenOnset: 'whether it came on suddenly or built up gradually',
  duration: 'when it started and how long it has been going on',
  worsening: 'whether it is getting better, worse, or staying about the same',
  functionalImpact: 'how much it is limiting normal activities (working, walking, sleeping, eating)',
  possibleFracture: 'whether the injured area looks deformed or swollen, or cannot bear weight — signs it might be broken',
  openWound: 'whether there is an open cut, and how deep or wide it is',
  highFever: 'whether there is a high fever — around 103°F / 39.4°C or above',
}

const PRESENTATION_RED_FLAGS: Partial<Record<PresentationType, RedFlag[]>> = {
  cardiac: ['chest_pressure', 'breathing_difficulty', 'fainting_or_confusion'],
  neuro: ['one_sided_weakness', 'worst_headache_of_life', 'sudden_vision_loss', 'fainting_or_confusion', 'stiff_neck_with_fever'],
  respiratory: ['breathing_difficulty', 'chest_pressure', 'fainting_or_confusion'],
  gi: ['severe_dehydration', 'uncontrolled_bleeding'],
  msk: ['uncontrolled_bleeding'],
  urinary: ['severe_dehydration'],
  skin: ['allergic_swelling', 'uncontrolled_bleeding'],
  pediatric: ['breathing_difficulty', 'severe_dehydration', 'stiff_neck_with_fever'],
  allergic: ['allergic_swelling', 'breathing_difficulty', 'fainting_or_confusion'],
  eye: ['sudden_vision_loss'],
  mental_health: [],
  dental: ['breathing_difficulty'],
  general: ['fainting_or_confusion', 'breathing_difficulty'],
}

const FIELD_PRIORITY_BY_PRESENTATION: Partial<Record<PresentationType, KnowableField[]>> = {
  cardiac: ['severity', 'suddenOnset', 'duration', 'functionalImpact', 'worsening'],
  neuro: ['suddenOnset', 'severity', 'functionalImpact', 'worsening', 'duration'],
  respiratory: ['severity', 'functionalImpact', 'suddenOnset', 'highFever', 'duration'],
  gi: ['severity', 'functionalImpact', 'highFever', 'duration', 'worsening'],
  msk: ['possibleFracture', 'openWound', 'functionalImpact', 'severity', 'suddenOnset'],
  urinary: ['highFever', 'severity', 'duration', 'functionalImpact'],
  skin: ['openWound', 'severity', 'worsening', 'duration'],
  pediatric: ['severity', 'highFever', 'functionalImpact', 'duration'],
  allergic: ['suddenOnset', 'severity', 'functionalImpact'],
  eye: ['suddenOnset', 'severity', 'functionalImpact'],
  dental: ['severity', 'highFever', 'duration', 'functionalImpact'],
  mental_health: ['severity', 'functionalImpact', 'duration', 'worsening'],
  // 'general' is where bare fever / malaise / "feel sick" land. Without a
  // tuned lane these cases got the generic danger ladder (faint? breathing?)
  // and never the questions a nurse leads with: how long, the meningitis
  // screen, fluids staying down, trajectory. (User-reported, 2026-07-19.)
  general: ['duration', 'highFever', 'worsening', 'functionalImpact', 'severity'],
}

const REQUIRED_FIELDS_BY_PRESENTATION: Partial<Record<PresentationType, string[]>> = {
  cardiac: ['severity', 'duration', 'suddenOnset', 'redFlag:chest_pressure', 'redFlag:breathing_difficulty'],
  neuro: ['suddenOnset', 'severity', 'redFlag:one_sided_weakness', 'redFlag:worst_headache_of_life'],
  respiratory: ['severity', 'functionalImpact', 'redFlag:breathing_difficulty'],
  gi: ['severity', 'functionalImpact', 'redFlag:severe_dehydration'],
  msk: ['severity', 'functionalImpact', 'possibleFracture'],
  allergic: ['redFlag:allergic_swelling', 'redFlag:breathing_difficulty'],
  eye: ['suddenOnset', 'redFlag:sudden_vision_loss'],
  pediatric: ['severity', 'highFever', 'redFlag:breathing_difficulty'],
  general: ['duration', 'redFlag:stiff_neck_with_fever', 'redFlag:severe_dehydration'],
}

function isTargetEstablished(target: string, known: Set<string>, checkedRedFlags: Set<RedFlag>, f: ExtractedFeatures): boolean {
  if (target.startsWith('redFlag:')) {
    const flag = target.slice('redFlag:'.length) as RedFlag
    return f.redFlags.includes(flag) || checkedRedFlags.has(flag)
  }
  return known.has(target)
}

/** System-specific hint overrides — the same red flag presents differently
 *  in different contexts (external bleeding vs GI bleeding, etc.). */
const RED_FLAG_HINTS_BY_SYSTEM: Partial<Record<BodySystem, Partial<Record<RedFlag, string>>>> = {
  gi: {
    uncontrolled_bleeding: 'whether they have seen any blood in vomit or stool, or very dark/black stools',
  },
  urinary: {
    uncontrolled_bleeding: 'whether there is visible blood in the urine',
  },
}

const RED_FLAG_HINTS: Partial<Record<RedFlag, string>> = {
  chest_pressure: 'whether they feel pressure, squeezing, or tightness in the chest — especially with sweating, nausea, or pain spreading to the arm or jaw',
  breathing_difficulty: 'whether they are having trouble breathing while at rest',
  one_sided_weakness: 'any face drooping, weakness or numbness on one side, or slurred speech',
  worst_headache_of_life: 'whether this is the worst headache of their life or hit its peak within seconds',
  fainting_or_confusion: 'any fainting, near-fainting, or new confusion',
  sudden_vision_loss: 'any sudden change or loss of vision',
  stiff_neck_with_fever: 'a stiff neck together with fever',
  severe_dehydration: 'signs of serious dehydration — unable to keep fluids down, very little urination, or dizziness when standing',
  uncontrolled_bleeding: 'whether any bleeding stops when firm pressure is applied',
  pregnancy_bleeding_or_pain: 'any vaginal bleeding or severe abdominal pain',
  allergic_swelling: 'any swelling of the face, lips, or tongue, or a feeling of the throat closing',
}

function entropy(probs: Record<EngineLevel, number>): number {
  let h = 0
  for (const l of SCORED_LEVELS) {
    const p = probs[l]
    if (p > 1e-9) h -= p * Math.log(p)
  }
  return h
}

function topTwo(probs: Record<EngineLevel, number>): [EngineLevel, EngineLevel] {
  const sorted = [...SCORED_LEVELS].sort((a, b) => probs[b] - probs[a])
  return [sorted[0], sorted[1]]
}

/** Posterior for a hypothetical completed feature vector, floors folded in:
 *  a fired floor collapses the distribution onto the floor level (a decisive
 *  answer), which is exactly why floor-triggering questions carry high EVOI. */
function hypotheticalDist(
  f: ExtractedFeatures, risk: PatientRisk, adjustments: Adjustments,
): { probs: Record<EngineLevel, number>; decidedLevel: EngineLevel } {
  const { probs } = distribution(f, risk, adjustments)
  const rules = applyRules(f, risk)
  let best: EngineLevel = SCORED_LEVELS[0]
  for (const l of SCORED_LEVELS) if (probs[l] > probs[best]) best = l
  if (rules.floor && LEVEL_RANK[rules.floor] > LEVEL_RANK[best]) {
    const collapsed = { home_care: 0, telehealth: 0, primary_care: 0, urgent_care: 0, er: 0, emergency: 0 } as Record<EngineLevel, number>
    // 'emergency' floor mass is accounted under 'er' for entropy purposes
    collapsed[rules.floor === 'emergency' ? 'er' : rules.floor] = 1
    return { probs: collapsed, decidedLevel: rules.floor }
  }
  return { probs, decidedLevel: best }
}

/**
 * The engine's interview policy: given what is known so far, either decide
 * or return the single most valuable thing to ask next.
 */
export function planInterview(
  f: ExtractedFeatures,
  known: Set<string>,
  checkedRedFlags: Set<RedFlag>,
  risk: PatientRisk,
  adjustments: Adjustments,
  questionsAsked: number,
  /** High-alert presentations (e.g. ambiguous chest pain) get a shorter
   *  budget: screen fast, then decide — don't chat. */
  maxQuestions: number = MAX_QUESTIONS,
): InterviewPlan {
  const now = hypotheticalDist(f, risk, adjustments)
  const hNow = entropy(now.probs)
  const [top1, top2] = topTwo(now.probs)
  const confidence = now.probs[top1]
  const margin = now.probs[top1] - now.probs[top2]
  const currentRank = LEVEL_RANK[now.decidedLevel]
  const presentationType = inferPresentationType(f, risk)
  const requiredTargets = REQUIRED_FIELDS_BY_PRESENTATION[presentationType] ?? []

  // A fired ER/emergency floor ends the interview immediately — no question
  // is worth delaying that recommendation.
  if (LEVEL_RANK[now.decidedLevel] >= LEVEL_RANK.er) {
    return { action: 'decide', asks: [], roundUp: false, entropy: hNow, topLevel: now.decidedLevel, confidence, margin }
  }

  // ── Score every candidate question ─────────────────────────────────────────
  const candidates: AskTarget[] = []

  const evaluate = (target: string, hint: string, hypos: Array<{ f: ExtractedFeatures; p: number }>) => {
    let expectedH = 0
    let dangerMass = 0
    for (const { f: hf, p } of hypos) {
      const hd = hypotheticalDist(hf, risk, adjustments)
      expectedH += p * entropy(hd.probs)
      if (LEVEL_RANK[hd.decidedLevel] >= LEVEL_RANK.er && currentRank < LEVEL_RANK.er) dangerMass += p
    }
    const evoi = (hNow - expectedH) + DANGER_WEIGHT * dangerMass
    if (evoi > 0) {
      candidates.push({
        target, evoi, dangerMass, hint,
        rationale: dangerMass > 0
          ? `could rule an emergency in or out (P≈${dangerMass.toFixed(2)} of answers would escalate)`
          : `best separates ${top1.replace('_', ' ')} vs ${top2.replace('_', ' ')} in the current posterior`,
      })
    }
  }

  // Red-flag screens for the active body system (highest clinical value).
  // List order in SCREENABLE_RED_FLAGS is a clinical priority: earlier flags
  // get a small EVOI tiebreak so e.g. the chest-pressure/character question
  // precedes the syncope screen for chest complaints, as a nurse would ask.
  const pFlag = redFlagPrior(f)
  const screenList = PRESENTATION_RED_FLAGS[presentationType] ?? SCREENABLE_RED_FLAGS[f.system] ?? []
  screenList.forEach((flag, idx) => {
    if (f.redFlags.includes(flag) || checkedRedFlags.has(flag)) return
    const hint = RED_FLAG_HINTS_BY_SYSTEM[f.system]?.[flag] ?? RED_FLAG_HINTS[flag]
    if (!hint) return
    evaluate(`redFlag:${flag}`, hint, [
      { f: { ...f, redFlags: [...f.redFlags, flag] }, p: pFlag },
      { f, p: 1 - pFlag },
    ])
    const added = candidates[candidates.length - 1]
    if (added?.target === `redFlag:${flag}`) {
      added.evoi += (screenList.length - idx) * 0.005
      if (requiredTargets.includes(added.target)) added.evoi += 0.18
    }
  })

  // Scalar/boolean fields not yet established by the conversation
  const fieldPriority = FIELD_PRIORITY_BY_PRESENTATION[presentationType] ?? []
  for (const field of KNOWABLE_FIELDS) {
    if (field === 'system' || known.has(field)) continue
    if (field === 'possibleFracture' && f.system !== 'msk') continue
    if (field === 'openWound' && f.system !== 'skin' && f.system !== 'msk') continue
    const values = FIELD_VALUES[field]
    if (!values.length) continue
    evaluate(field, FIELD_HINTS[field], values.map(({ v, p }) => ({ f: { ...f, [field]: v } as ExtractedFeatures, p })))
    const added = candidates[candidates.length - 1]
    if (added?.target === field) {
      const priorityIndex = fieldPriority.indexOf(field)
      if (priorityIndex !== -1) added.evoi += (fieldPriority.length - priorityIndex) * 0.01
      if (requiredTargets.includes(field)) added.evoi += 0.12
    }
  }

  candidates.sort((a, b) => b.evoi - a.evoi)
  const asks = candidates.slice(0, 3)
  const maxEvoi = asks[0]?.evoi ?? 0

  // ── Decide-or-ask gate ─────────────────────────────────────────────────────
  const budgetExhausted = questionsAsked >= maxQuestions
  const confident = confidence >= CONFIDENCE_TO_DECIDE && margin >= MARGIN_TO_DECIDE
  const nothingUseful = maxEvoi < MIN_USEFUL_EVOI
  // Safety: an unscreened red flag with meaningful escalation mass overrides
  // statistical confidence — confidence in the WRONG posterior is the classic
  // under-triage failure mode.
  const mustScreen = candidates.some(c => c.dangerMass >= MUST_SCREEN_DANGER)
  const missingCriticalInfo = requiredTargets.some(target =>
    !isTargetEstablished(target, known, checkedRedFlags, f) &&
    candidates.some(c => c.target === target),
  )

  if ((!mustScreen && !missingCriticalInfo && (confident || nothingUseful)) || budgetExhausted) {
    // Abstention escalates (invariant I5): out of budget with an ambiguous
    // posterior → recommend the higher-acuity of the top two, and say so.
    const roundUp = budgetExhausted && !confident && margin < 0.1
    const topLevel = roundUp
      ? (LEVEL_RANK[top1] >= LEVEL_RANK[top2] ? top1 : top2)
      : now.decidedLevel
    return { action: 'decide', asks, roundUp, entropy: hNow, topLevel, confidence, margin }
  }

  return { action: 'ask', asks, roundUp: false, entropy: hNow, topLevel: now.decidedLevel, confidence, margin }
}
