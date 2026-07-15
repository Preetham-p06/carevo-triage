// ─────────────────────────────────────────────────────────────────────────────
// Carevo Clinical Rule Layer v0 — deterministic safety floors.
//
// Design contract (Carevo V2 architecture §6–7):
//  • Rules set acuity FLOORS. They can only raise the recommendation, never
//    lower it. They are NOT trainable — outcome feedback cannot touch them.
//  • Every rule carries a citation into the knowledge registry, a version,
//    and a review status. Rules marked `reviewed: false` are clinically
//    seeded by engineering and MUST be reviewed by a clinician before any
//    enterprise deployment. This field exists so that gap is visible, not
//    hidden in code comments.
//  • Rules are pure functions of (features, risk) — deterministic and
//    replayable given the ruleset version.
// ─────────────────────────────────────────────────────────────────────────────

import type { ExtractedFeatures, PatientRisk, RedFlag } from './features'
import type { EngineLevel } from './levels'
import { LEVEL_RANK } from './levels'
import type { CitationKey } from '../knowledge/citations'

export const RULESET_VERSION = 'carevo-rules-2026.07.0'

export interface ClinicalRule {
  id: string
  /** Plain-language description, shown to clinicians/auditors */
  description: string
  when: (f: ExtractedFeatures, risk: PatientRisk) => boolean
  floor: EngineLevel
  citation: CitationKey
  /** Guideline the rule is derived from */
  source: string
  /** Clinician sign-off. false = engineering-seeded, pending clinical review. */
  reviewed: boolean
}

// ── Red-flag floors (migrated from model.ts hard-coded map, now cited) ───────

const RED_FLAG_RULES: Array<{ flag: RedFlag; floor: EngineLevel; citation: CitationKey; source: string }> = [
  { flag: 'breathing_difficulty',        floor: 'er',        citation: 'medlineplus-breathing',   source: 'NIH/MedlinePlus — breathing problems' },
  { flag: 'chest_pressure',              floor: 'er',        citation: 'aha-heart-attack-signs',  source: 'AHA heart attack warning signs' },
  { flag: 'fainting_or_confusion',       floor: 'er',        citation: 'medlineplus-fainting',    source: 'NIH/MedlinePlus — syncope' },
  { flag: 'one_sided_weakness',          floor: 'emergency', citation: 'cdc-stroke-signs',        source: 'CDC stroke signs (FAST)' },
  { flag: 'worst_headache_of_life',      floor: 'er',        citation: 'ninds-headache',          source: 'NINDS — thunderclap headache' },
  { flag: 'uncontrolled_bleeding',       floor: 'er',        citation: 'stop-the-bleed',          source: 'ACS Stop the Bleed' },
  { flag: 'severe_dehydration',          floor: 'urgent_care', citation: 'medlineplus-dehydration', source: 'NIH/MedlinePlus — dehydration' },
  { flag: 'stiff_neck_with_fever',       floor: 'er',        citation: 'cdc-meningitis',          source: 'CDC meningitis symptoms' },
  { flag: 'sudden_vision_loss',          floor: 'er',        citation: 'aao-vision',              source: 'AAO urgent eye symptoms' },
  { flag: 'pregnancy_bleeding_or_pain',  floor: 'er',        citation: 'acog-pregnancy-bleeding', source: 'ACOG — bleeding in pregnancy' },
  { flag: 'allergic_swelling',           floor: 'er',        citation: 'acaai-anaphylaxis',       source: 'ACAAI anaphylaxis' },
  { flag: 'suicidal_thoughts',           floor: 'er',        citation: '988-lifeline',            source: '988 Suicide & Crisis Lifeline' },
  { flag: 'infant_under_3mo_fever',      floor: 'er',        citation: 'aap-febrile-infant',      source: 'AAP 2021 febrile infant CPG' },
]

const redFlagRules: ClinicalRule[] = RED_FLAG_RULES.map(r => ({
  id: `rf.${r.flag}`,
  description: `Red flag "${r.flag.replace(/_/g, ' ')}" — floor ${r.floor}`,
  when: (f) => f.redFlags.includes(r.flag),
  floor: r.floor,
  citation: r.citation,
  source: r.source,
  reviewed: false,
}))

// ── Combination rules — interactions a linear scorer cannot represent ────────
// These fire on feature × risk-context combinations. All are floors-only.

const combinationRules: ClinicalRule[] = [
  {
    id: 'cx.chest_pressure_acute',
    description: 'Confirmed chest pressure with sudden onset and significant severity — classic ACS picture, floor emergency (911)',
    when: (f) => f.redFlags.includes('chest_pressure') && f.suddenOnset && f.severity >= 2,
    floor: 'emergency',
    citation: 'aha-heart-attack-signs',
    source: 'AHA heart attack warning signs',
    reviewed: false,
  },
  {
    id: 'cx.cardiac_highrisk',
    description: 'Significant cardiac-system symptoms in a patient with known heart disease or age 65+ — floor ER',
    when: (f, r) => f.system === 'cardiac' && f.severity >= 2 &&
      (r.modifiers.includes('heart_disease') || r.modifiers.includes('age_over_65')),
    floor: 'er',
    citation: 'aha-heart-attack-signs',
    source: 'AHA — atypical presentation risk in older/cardiac patients',
    reviewed: false,
  },
  {
    id: 'cx.immunocompromised_fever',
    description: 'High fever in an immunocompromised patient — floor urgent care (same-day evaluation)',
    when: (f, r) => f.highFever && r.modifiers.includes('immunocompromised'),
    floor: 'urgent_care',
    citation: 'cdc-fever-immunocompromised',
    source: 'CDC — infections in immunocompromised patients',
    reviewed: false,
  },
  {
    id: 'cx.chemo_fever',
    description: 'ANY fever during active chemotherapy — floor ER (febrile neutropenia is an oncologic emergency; 100.4°F threshold, not the general high-fever bar)',
    when: (f, r) => f.highFever && r.modifiers.includes('active_chemo'),
    floor: 'er',
    citation: 'cdc-fever-immunocompromised',
    source: 'CDC / oncology consensus — neutropenic fever requires emergency evaluation',
    reviewed: false,
  },
  {
    id: 'cx.toddler_high_fever',
    description: 'High fever in a child under 2 — floor urgent care (infants <3mo are covered by the ER red flag)',
    when: (f, r) => f.highFever && r.modifiers.includes('age_under_2') &&
      !f.redFlags.includes('infant_under_3mo_fever'),
    floor: 'urgent_care',
    citation: 'healthychildren-fever',
    source: 'AAP fever guidance for young children',
    reviewed: false,
  },
  {
    id: 'cx.pregnancy_abdo',
    description: 'Significant abdominal/pelvic symptoms during pregnancy — floor urgent care',
    when: (f, r) => (f.system === 'gi' || f.system === 'gyn') && f.severity >= 2 &&
      r.modifiers.includes('pregnant') && !f.redFlags.includes('pregnancy_bleeding_or_pain'),
    floor: 'urgent_care',
    citation: 'acog-pregnancy-bleeding',
    source: 'ACOG — abdominal pain in pregnancy warrants prompt evaluation',
    reviewed: false,
  },
  {
    id: 'cx.diabetic_wound',
    description: 'Open wound in a diabetic patient — floor urgent care (infection/healing risk)',
    when: (f, r) => f.openWound && r.modifiers.includes('diabetes'),
    floor: 'urgent_care',
    citation: 'acep-when-to-go',
    source: 'Standard wound-care escalation for diabetic patients',
    reviewed: false,
  },
  {
    id: 'cx.sudden_severe_worsening',
    description: 'Severe, sudden-onset, worsening symptoms with major functional impact — floor urgent care regardless of system',
    when: (f) => f.severity === 3 && f.suddenOnset && f.worsening && f.functionalImpact === 3,
    floor: 'urgent_care',
    citation: 'acep-when-to-go',
    source: 'ACEP — rapid trajectory is an escalation signal',
    reviewed: false,
  },
  {
    id: 'cx.anaphylaxis_airway',
    description: 'Airway-compromising anaphylaxis: allergic swelling AND breathing difficulty present simultaneously — floor emergency (911). This combination indicates anaphylaxis with airway involvement, which is immediately life-threatening.',
    when: (f) => f.redFlags.includes('allergic_swelling') && f.redFlags.includes('breathing_difficulty'),
    floor: 'emergency',
    citation: 'acaai-anaphylaxis',
    source: 'ACAAI — anaphylaxis with airway compromise requires immediate 911 response',
    reviewed: false,
  },
  {
    id: 'cx.hemorrhage_severe',
    description: 'Severe (severity 3) uncontrolled bleeding — floor emergency (911). Major hemorrhage from trauma, arterial injury, or internal bleeding is immediately life-threatening.',
    when: (f) => f.redFlags.includes('uncontrolled_bleeding') && f.severity >= 3,
    floor: 'emergency',
    citation: 'stop-the-bleed',
    source: 'ACS Stop the Bleed — major hemorrhage requires immediate emergency response',
    reviewed: false,
  },
  {
    id: 'cx.open_fracture',
    description: 'Open wound with possible or confirmed fracture — floor ER. Open fractures carry osteomyelitis risk and typically require IV antibiotics, wound irrigation, and orthopedic consultation regardless of severity.',
    when: (f) => f.openWound && f.possibleFracture,
    floor: 'er',
    citation: 'acep-when-to-go',
    source: 'ACEP / orthopedic consensus — open fractures require emergent evaluation',
    reviewed: false,
  },
]

export const CLINICAL_RULES: ClinicalRule[] = [...redFlagRules, ...combinationRules]

export interface RuleResult {
  /** Highest floor demanded by any fired rule, or null */
  floor: EngineLevel | null
  /** All rules that fired, highest floor first */
  fired: ClinicalRule[]
}

/** Evaluate all rules. Pure, deterministic, floors-only. */
export function applyRules(f: ExtractedFeatures, risk: PatientRisk): RuleResult {
  const fired = CLINICAL_RULES
    .filter(rule => rule.when(f, risk))
    .sort((a, b) => LEVEL_RANK[b.floor] - LEVEL_RANK[a.floor])
  return { floor: fired.length ? fired[0].floor : null, fired }
}

/** Citation keys for every fired rule — feeds the evidence section. */
export function citationKeysFor(fired: ClinicalRule[]): CitationKey[] {
  return [...new Set(fired.map(r => r.citation))]
}
