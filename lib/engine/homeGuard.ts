// ─────────────────────────────────────────────────────────────────────────────
// Clinician-approved DOWNWARD guards — Paul, batch 3, signed 2026-07-16.
//
// Problem they solve: two exact presentations (pediatric flexural eczema;
// post-cold conjunctivitis) that Paul has now approved for home care TWICE,
// but where the LLM extractor over-reads certain phrasings as high-severity
// and routes ER. Calibration correctly refuses to act there (it defers to
// extracted red flags) — so Paul approved a stronger mechanism: RAW-TEXT
// rules, the same trust level as his upward ER floors (eye triad, vertigo),
// pointing down.
//
// Safety semantics (strict, fail-closed):
//   1. The presentation trigger must match the raw conversation text.
//   2. NONE of the listed dangers may be AFFIRMED anywhere in the text
//      (checked on negation-stripped text: "no fever" doesn't count as
//      fever; "has a fever" blocks).
//   3. At least `minExplicitDenials` of the dangers must be EXPLICITLY
//      DENIED in the conversation (mentioned, but only inside negated
//      clauses) — Paul's "explicitly absent" condition. Silence about a
//      danger is not evidence of absence.
//   4. Guards NEVER apply over an `emergency` decision, and the route
//      additionally skips them whenever a raw-text ER/urgent-care floor
//      matched (raw-text evidence of danger beats a raw-text guard;
//      extraction never beats either).
// Kill switch: set HOME_GUARDS=0 (env) — checked in the route.
// ─────────────────────────────────────────────────────────────────────────────
import type { CareLevel } from '../types'

export const HOME_GUARDS_VERSION = 'carevo-home-guards-2026.07.16-paul-batch3'

interface HomeGuard {
  name: string
  /** Every trigger regex must match the raw text. */
  triggers: RegExp[]
  /** Dangers: affirmed anywhere → guard refuses. Explicitly denied → counts. */
  dangers: { label: string; re: RegExp }[]
  minExplicitDenials: number
  approvedBy: string
}

export const HOME_GUARDS: HomeGuard[] = [
  {
    name: 'paul3_pediatric_flexural_eczema',
    triggers: [
      /\b(eczema|atopic dermatitis|flexural)\b|\bdry\b[^.!?]{0,40}\bitchy\b[^.!?]{0,40}\bskin\b|\bitchy\b[^.!?]{0,40}\bdry\b[^.!?]{0,40}\bskin\b/i,
      /\b(chronic|weeks|months|long[-\s]?standing|hay fever|allerg)/i,
    ],
    dangers: [
      { label: 'fever', re: /\b(fever|febrile|temperature over|hot to the touch)\b/i },
      { label: 'pus', re: /\b(pus|purulent|oozing|weeping|infected)\b/i },
      { label: 'red streaks', re: /\b(red streaks?|streaking|spreading redness)\b/i },
      { label: 'severe pain', re: /\b(severe|intense|unbearable|extreme)\s+(pain|discomfort)|\bpain(?:ful)?\b[^.!?]{0,20}\b(severe|intense|unbearable)\b/i },
      { label: 'facial or airway swelling', re: /\b(face|facial|lip|tongue|throat|airway)\b[^.!?]{0,30}\bswell|\bswelling\b[^.!?]{0,30}\b(face|facial|lips?|tongue|throat|airway)\b|\btrouble breathing\b/i },
    ],
    minExplicitDenials: 3,
    approvedBy: 'Paul (MD, Clinical Informatics Lead) — batch 3, 2026-07-16',
  },
  {
    name: 'paul3_postcold_conjunctivitis',
    triggers: [
      /\beyes?\b[^.!?]{0,60}\b(stuck shut|crust(?:ed|ing|y)?|gooey|matted)\b|\b(stuck shut|crusted)\b[^.!?]{0,40}\beyes?\b/i,
      /\b(watery|red|pink|bloodshot)\b[^.!?]{0,40}\beyes?\b|\beyes?\b[^.!?]{0,40}\b(watery|red|pink|bloodshot)\b/i,
    ],
    dangers: [
      { label: 'vision change or loss', re: /\b(vision (?:change|changes|loss)|blurr?(?:y|ed) vision|double vision|can'?t see|sight (?:change|loss))\b/i },
      { label: 'eye trauma', re: /\b(trauma|injur(?:y|ed)|hit|struck|scratch(?:ed)?|foreign body|chemical)\b/i },
      { label: 'severe or deep eye pain', re: /\b(severe|intense|deep|unbearable)\b[^.!?]{0,20}\b(eye )?pain\b|\beye pain\b[^.!?]{0,20}\b(severe|intense|deep)\b/i },
    ],
    minExplicitDenials: 2,
    approvedBy: 'Paul (MD, Clinical Informatics Lead) — batch 3, 2026-07-16',
  },
]

export interface HomeGuardResult {
  name: string
  to: CareLevel
  deniedDangers: string[]
  approvedBy: string
  version: string
}

/** "hay fever" is an allergy, not a fever — same substitution gate P11 uses. */
const neutralize = (t: string) => t.replace(/\bhay\s+fever\b/gi, 'hay allergy')

/**
 * List-aware negation stripper, LOCAL to the downward guards. The global
 * stripNegatedClauses (which the upward emergency nets use — deliberately
 * untouched) only strips the first item of "no fever, pus, red streaks, or
 * severe pain". Here the whole enumerated span after a negation word is
 * removed, stopping at sentence breaks or a new affirmative clause ("but",
 * "is/are/has/have/feels") so "no fever but severe pain" keeps the pain.
 */
const stripNegatedLists = (t: string) =>
  t.replace(/\b(?:no|without|denies|denied|not having)\b(?:(?!\.|;|!|\?|\bbut\b|\bis\b|\bare\b|\bhas\b|\bhave\b|\bfeels?\b)[^.;!?])*/gi, ' ')

/**
 * Pure check: rawText is the full patient-side conversation. strippedText
 * (lib/emergency.stripNegatedClauses output) is accepted for interface
 * stability but the danger model here is stripNegatedLists ALONE — it is the
 * stricter model, and any negation form it cannot parse ("don't have a
 * fever") leaves the danger looking affirmed, which REFUSES the downgrade.
 * Errors can only point up. Returns the guard to apply, or null. Callers
 * must also enforce rule 4 (never over emergency / raw floors).
 */
export function applyHomeGuard(
  rawText: string,
  _strippedText: string,
  decisionLevel: CareLevel,
): HomeGuardResult | null {
  if (decisionLevel === 'emergency' || decisionLevel === 'home_care') return null
  const raw = neutralize(rawText)
  const listStripped = stripNegatedLists(raw)
  for (const g of HOME_GUARDS) {
    if (!g.triggers.every(re => re.test(raw))) continue
    let affirmed = false
    const denied: string[] = []
    for (const d of g.dangers) {
      const inRaw = d.re.test(raw)
      if (d.re.test(listStripped)) { affirmed = true; break }   // AFFIRMED (or unparseable) → refuse
      if (inRaw) denied.push(d.label)                           // mentioned only negated → explicit denial
    }
    if (affirmed) continue
    if (denied.length < g.minExplicitDenials) continue          // silence ≠ absence
    return { name: g.name, to: 'home_care', deniedDangers: denied, approvedBy: g.approvedBy, version: HOME_GUARDS_VERSION }
  }
  return null
}
