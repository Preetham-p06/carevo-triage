// Carevo Route Engine — offline eval suite.
// Run: npx tsx scripts/eval-engine.ts  (or compile with tsc)
// Gates (all must pass):
//   1. Zero dangerous under-triage on red-flag cases  ← THE metric
//   2. Routing accuracy ≥ 85% (exact or clinically acceptable)
//   3. Clinical Rule Layer fires correctly on combination cases
//   4. EVOI interview policy behaves safely (red-flag screens first,
//      decides when confident, rounds UP when out of budget + ambiguous)

import { decide, type EngineLevel } from '../lib/engine/model'
import { planInterview } from '../lib/engine/evoi'
import { applyRules } from '../lib/engine/rules'
import { classifyEmergency, detectInfantFever, detectSelfHarm, detectSevereDehydration } from '../lib/emergency'
import { retrieveGuidance } from '../lib/knowledge/retrieval'
import { applyCalibration, loadPromotedCalibration } from '../lib/engine/calibration'
import { checkConsistency } from '../lib/knowledge/graph'
import { RED_FLAGS, type ExtractedFeatures, type RedFlag, type BodySystem } from '../lib/engine/features'

interface Case {
  name: string
  f: ExtractedFeatures
  risk?: string[]
  expected: EngineLevel
  /** acceptable alternatives (adjacent level judgment calls) */
  accept?: EngineLevel[]
}

const F = (over: Partial<ExtractedFeatures>): ExtractedFeatures => ({
  system: 'general', severity: 1, suddenOnset: false, duration: '6to48h',
  worsening: false, functionalImpact: 1, redFlags: [], possibleFracture: false,
  openWound: false, highFever: false, summary: 'test', ...over,
})

const RANK: Record<EngineLevel, number> = {
  home_care: 0, telehealth: 1, primary_care: 2, urgent_care: 3, er: 4, emergency: 5,
}

const CASES: Case[] = [
  // Home care / telehealth
  { name: 'Mild cold, 3 days', f: F({ system: 'ent', severity: 0, duration: '2to7d', functionalImpact: 0 }), expected: 'home_care', accept: ['telehealth'] },
  { name: 'Mild rash, week+', f: F({ system: 'skin', severity: 0, duration: 'over7d', functionalImpact: 0 }), expected: 'telehealth', accept: ['home_care', 'primary_care'] },
  { name: 'Prescription refill question', f: F({ system: 'general', severity: 0, duration: 'over7d', functionalImpact: 0 }), expected: 'home_care', accept: ['telehealth'] },
  { name: 'Mild UTI symptoms, 1 day', f: F({ system: 'urinary', severity: 1, duration: '6to48h' }), expected: 'telehealth', accept: ['primary_care', 'urgent_care'] },
  { name: 'Mild anxiety, weeks', f: F({ system: 'mental', severity: 1, duration: 'over7d' }), expected: 'telehealth', accept: ['primary_care'] },
  { name: 'Sore throat, low impact, 2 days', f: F({ system: 'ent', severity: 1, duration: '6to48h', functionalImpact: 1 }), expected: 'telehealth', accept: ['home_care', 'primary_care'] },

  // Primary care
  { name: 'Ongoing fatigue, 2 weeks', f: F({ system: 'general', severity: 1, duration: 'over7d', functionalImpact: 2 }), expected: 'primary_care', accept: ['telehealth', 'urgent_care'] },
  { name: 'Recurring headaches, week+', f: F({ system: 'neuro', severity: 1, duration: 'over7d', functionalImpact: 1 }), expected: 'primary_care', accept: ['telehealth', 'urgent_care'] },
  { name: 'Joint pain, gradual, weeks', f: F({ system: 'msk', severity: 1, duration: 'over7d', functionalImpact: 2 }), expected: 'primary_care', accept: ['urgent_care'] },

  // Urgent care
  { name: 'Possible sprain/fracture after fall', f: F({ system: 'msk', severity: 2, suddenOnset: true, duration: 'under6h', functionalImpact: 2, possibleFracture: true }), expected: 'urgent_care' },
  { name: 'Cut needing stitches', f: F({ system: 'skin', severity: 2, suddenOnset: true, duration: 'under6h', openWound: true }), expected: 'urgent_care' },
  { name: 'High fever + sore throat, adult', f: F({ system: 'ent', severity: 2, duration: '6to48h', highFever: true, functionalImpact: 2 }), expected: 'urgent_care' },
  { name: 'Severe vomiting, dehydration risk', f: F({ system: 'gi', severity: 2, duration: '6to48h', worsening: true, redFlags: ['severe_dehydration'], functionalImpact: 2 }), expected: 'urgent_care', accept: ['er'] },
  { name: 'Worsening ear pain, high fever, child', f: F({ system: 'ent', severity: 2, duration: '6to48h', worsening: true, highFever: true }), risk: ['age_under_2'], expected: 'urgent_care' },

  // ER
  { name: 'Severe abdominal pain, sudden, worsening', f: F({ system: 'gi', severity: 3, suddenOnset: true, duration: 'under6h', worsening: true, functionalImpact: 3 }), expected: 'er', accept: ['urgent_care'] },
  { name: 'Chest pressure on exertion (confirmed, sudden, significant → 911)', f: F({ system: 'cardiac', severity: 2, suddenOnset: true, duration: 'under6h', redFlags: ['chest_pressure'] }), expected: 'emergency' },
  { name: 'Chest pressure, gradual + mild-moderate (ER, not 911)', f: F({ system: 'cardiac', severity: 1, suddenOnset: false, duration: '2to7d', redFlags: ['chest_pressure'] }), expected: 'er' },
  { name: 'Breathing difficulty, asthma history', f: F({ system: 'respiratory', severity: 2, worsening: true, redFlags: ['breathing_difficulty'] }), risk: ['lung_condition'], expected: 'er' },
  { name: 'Fainting episode, elderly', f: F({ system: 'neuro', severity: 2, suddenOnset: true, redFlags: ['fainting_or_confusion'] }), risk: ['age_over_65'], expected: 'er' },
  { name: 'Worst headache of life', f: F({ system: 'neuro', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['worst_headache_of_life'], functionalImpact: 3 }), expected: 'er' },
  { name: 'Pregnancy bleeding', f: F({ system: 'gyn', severity: 2, suddenOnset: true, redFlags: ['pregnancy_bleeding_or_pain'] }), risk: ['pregnant'], expected: 'er' },
  { name: 'Infant under 3mo with fever', f: F({ system: 'general', severity: 1, highFever: true, redFlags: ['infant_under_3mo_fever'] }), risk: ['age_under_2'], expected: 'er' },
  { name: 'Facial/throat swelling after food', f: F({ system: 'skin', severity: 2, suddenOnset: true, duration: 'under6h', redFlags: ['allergic_swelling'] }), expected: 'er' },

  // Emergency (hard floor)
  { name: 'One-sided weakness (stroke signs)', f: F({ system: 'neuro', severity: 3, suddenOnset: true, redFlags: ['one_sided_weakness'], functionalImpact: 3 }), expected: 'emergency' },

  // ── Clinical Rule Layer combination cases (interactions, not single flags) ──
  { name: 'RULE cx.cardiac_highrisk: chest symptoms, 70yo, no red flag reported', f: F({ system: 'cardiac', severity: 2, suddenOnset: true, duration: 'under6h' }), risk: ['age_over_65'], expected: 'er' },
  { name: 'RULE cx.cardiac_highrisk: chest symptoms + heart disease history', f: F({ system: 'cardiac', severity: 2, duration: '6to48h' }), risk: ['heart_disease'], expected: 'er' },
  { name: 'RULE cx.immunocompromised_fever: chemo patient, high fever', f: F({ system: 'general', severity: 1, highFever: true, duration: '6to48h' }), risk: ['immunocompromised'], expected: 'urgent_care', accept: ['er'] },
  { name: 'RULE cx.toddler_high_fever: 18mo, high fever, otherwise mild', f: F({ system: 'ent', severity: 1, highFever: true }), risk: ['age_under_2'], expected: 'urgent_care', accept: ['er'] },
  { name: 'RULE cx.pregnancy_abdo: pregnant, significant abdominal pain', f: F({ system: 'gi', severity: 2, duration: 'under6h' }), risk: ['pregnant'], expected: 'urgent_care', accept: ['er'] },
  { name: 'RULE cx.diabetic_wound: diabetic with open wound, low severity', f: F({ system: 'skin', severity: 1, openWound: true, duration: 'under6h' }), risk: ['diabetes'], expected: 'urgent_care' },
  { name: 'RULE cx.sudden_severe_worsening: severe sudden worsening, unknown system', f: F({ system: 'general', severity: 3, suddenOnset: true, worsening: true, functionalImpact: 3, duration: 'under6h' }), expected: 'urgent_care', accept: ['er'] },
  { name: 'RULE cx.chemo_fever: any fever on active chemotherapy → ER (febrile neutropenia)', f: F({ system: 'general', severity: 1, highFever: true, duration: 'under6h' }), risk: ['immunocompromised', 'active_chemo'], expected: 'er', accept: ['emergency'] },

  // Behavioral health pins (trial finding: anxiety over-triaged to urgent care)
  { name: 'Severe anxiety, weeks, can\'t function — telehealth/PC, not urgent care', f: F({ system: 'mental', severity: 2, duration: 'over7d', functionalImpact: 3, worsening: true }), expected: 'primary_care', accept: ['telehealth'] },

  // ── Home care (new) ──────────────────────────────────────────────────────────
  { name: 'Pink eye, mild, no pain, 2 days', f: F({ system: 'ent', severity: 0, duration: '6to48h', functionalImpact: 0 }), expected: 'home_care', accept: ['telehealth'] },
  { name: 'Minor sunburn, no blistering', f: F({ system: 'skin', severity: 0, duration: 'under6h', functionalImpact: 0 }), expected: 'home_care', accept: ['telehealth'] },
  { name: 'Mild diarrhea, adult, no dehydration signs, 1 day', f: F({ system: 'gi', severity: 0, duration: '6to48h', functionalImpact: 0 }), expected: 'home_care', accept: ['telehealth'] },
  { name: 'Minor insect bite, local reaction only, no allergy history', f: F({ system: 'skin', severity: 0, duration: 'under6h', functionalImpact: 0 }), expected: 'home_care', accept: ['telehealth'] },
  { name: 'Very mild cold, day 1, no fever, no impact', f: F({ system: 'ent', severity: 0, duration: 'under6h', functionalImpact: 0 }), expected: 'home_care', accept: ['telehealth'] },

  // ── Telehealth (new) ─────────────────────────────────────────────────────────
  { name: 'Mild low back pain, gradual onset, weeks, can still walk', f: F({ system: 'msk', severity: 1, duration: 'over7d', functionalImpact: 1 }), expected: 'telehealth', accept: ['primary_care'] },
  { name: 'New skin lesion, no pain, week+, not changing fast', f: F({ system: 'skin', severity: 0, duration: 'over7d', functionalImpact: 0 }), expected: 'telehealth', accept: ['primary_care', 'home_care'] },
  { name: 'Mild insomnia, chronic, no other symptoms', f: F({ system: 'mental', severity: 0, duration: 'over7d', functionalImpact: 1 }), expected: 'telehealth', accept: ['primary_care'] },
  { name: 'Low-grade fever (99F), adult, 1 day, otherwise well', f: F({ system: 'general', severity: 1, duration: 'under6h', functionalImpact: 1 }), expected: 'telehealth', accept: ['home_care', 'primary_care'] },
  { name: 'Vaginal discharge, no pain, no fever, 2 days', f: F({ system: 'gyn', severity: 0, duration: '2to7d', functionalImpact: 0 }), expected: 'telehealth', accept: ['primary_care', 'home_care'] },

  // ── Primary care (new) ───────────────────────────────────────────────────────
  { name: 'Unexplained weight loss, 3 weeks, worsening', f: F({ system: 'general', severity: 1, duration: 'over7d', functionalImpact: 1, worsening: true }), expected: 'primary_care', accept: ['urgent_care'] },
  { name: 'Persistent cough, 3 weeks, no fever, no red flags', f: F({ system: 'respiratory', severity: 1, duration: 'over7d', functionalImpact: 1 }), expected: 'primary_care', accept: ['telehealth', 'urgent_care'] },
  { name: 'Blood in urine, painless, no fever', f: F({ system: 'urinary', severity: 1, duration: '6to48h', functionalImpact: 0 }), expected: 'primary_care', accept: ['urgent_care', 'telehealth'] },
  { name: 'Moderate depression, weeks, no crisis or suicidal ideation', f: F({ system: 'mental', severity: 2, duration: 'over7d', functionalImpact: 2 }), expected: 'primary_care', accept: ['telehealth'] },
  { name: 'Skin lesion changing color/shape, weeks', f: F({ system: 'skin', severity: 1, duration: 'over7d', functionalImpact: 0, worsening: true }), expected: 'primary_care', accept: ['urgent_care', 'telehealth'] },
  { name: 'Elevated BP reading at home, asymptomatic, known hypertension', f: F({ system: 'cardiac', severity: 1, duration: 'over7d', functionalImpact: 0 }), expected: 'primary_care', accept: ['urgent_care', 'telehealth'] },
  { name: 'Eating disorder concern, weeks of restricting', f: F({ system: 'mental', severity: 1, duration: 'over7d', functionalImpact: 2 }), expected: 'primary_care', accept: ['telehealth'] },

  // ── Urgent care (new) ────────────────────────────────────────────────────────
  { name: 'Dog bite, skin broken, low severity', f: F({ system: 'skin', severity: 2, suddenOnset: true, duration: 'under6h', openWound: true, functionalImpact: 1 }), expected: 'urgent_care' },
  { name: 'Minor 2nd-degree burn, small area, arm', f: F({ system: 'skin', severity: 2, suddenOnset: true, duration: 'under6h', functionalImpact: 2 }), expected: 'urgent_care' },
  { name: 'Eye: foreign object, pain, tearing', f: F({ system: 'general', severity: 2, suddenOnset: true, duration: 'under6h', functionalImpact: 2 }), expected: 'urgent_care', accept: ['er'] },
  { name: 'Dislocated finger, significant pain, won\'t bend', f: F({ system: 'msk', severity: 2, suddenOnset: true, duration: 'under6h', functionalImpact: 3 }), expected: 'urgent_care', accept: ['er'] },
  { name: 'High fever 103F+, adult, no red flags, 1 day', f: F({ system: 'general', severity: 2, duration: '6to48h', highFever: true, functionalImpact: 2 }), expected: 'urgent_care', accept: ['er'] },
  { name: 'UTI with low fever, adult female', f: F({ system: 'urinary', severity: 2, duration: '6to48h', highFever: true, functionalImpact: 2 }), expected: 'urgent_care', accept: ['er'] },
  { name: 'Severe sore throat, can\'t swallow, no breathing difficulty', f: F({ system: 'ent', severity: 2, duration: '6to48h', functionalImpact: 3 }), expected: 'urgent_care', accept: ['er'] },
  { name: 'Mild asthma flare, rescue inhaler partially worked', f: F({ system: 'respiratory', severity: 1, duration: '6to48h', functionalImpact: 1 }), expected: 'urgent_care', accept: ['telehealth', 'er'] },
  { name: 'Corneal abrasion, significant eye pain', f: F({ system: 'general', severity: 2, suddenOnset: true, duration: 'under6h', functionalImpact: 2 }), expected: 'urgent_care', accept: ['er'] },
  { name: 'Ankle sprain, can\'t bear weight, significant swelling', f: F({ system: 'msk', severity: 2, suddenOnset: true, duration: 'under6h', functionalImpact: 3 }), expected: 'urgent_care' },
  { name: 'Post-surgical wound: red, warm, swollen, 5 days post-op', f: F({ system: 'skin', severity: 2, duration: '2to7d', worsening: true, openWound: true, functionalImpact: 1 }), expected: 'urgent_care', accept: ['er'] },

  // ── ER (new) ─────────────────────────────────────────────────────────────────
  { name: 'Stiff neck + high fever, sudden (meningitis signs)', f: F({ system: 'neuro', severity: 2, suddenOnset: true, duration: 'under6h', redFlags: ['stiff_neck_with_fever'], highFever: true, functionalImpact: 3 }), expected: 'er', accept: ['emergency'] },
  { name: 'Sudden vision loss, one eye', f: F({ system: 'neuro', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['sudden_vision_loss'], functionalImpact: 3 }), expected: 'er', accept: ['emergency'] },
  { name: 'Severe abdominal pain, pregnant, cramping', f: F({ system: 'gi', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['pregnancy_bleeding_or_pain'], functionalImpact: 3 }), risk: ['pregnant'], expected: 'er', accept: ['emergency'] },
  { name: 'Head injury with brief loss of consciousness, now awake', f: F({ system: 'neuro', severity: 2, suddenOnset: true, duration: 'under6h', redFlags: ['fainting_or_confusion'], functionalImpact: 2 }), expected: 'er' },
  { name: 'Severe flank pain + vomiting, kidney stone likely', f: F({ system: 'urinary', severity: 3, suddenOnset: true, duration: 'under6h', worsening: true, functionalImpact: 3 }), expected: 'er', accept: ['urgent_care'] },
  { name: 'Breathing difficulty, sudden, young adult — PE concern', f: F({ system: 'respiratory', severity: 2, suddenOnset: true, duration: 'under6h', redFlags: ['breathing_difficulty'], functionalImpact: 2 }), expected: 'er', accept: ['emergency'] },
  { name: 'Severe dehydration: no fluids kept down 24h, very weak', f: F({ system: 'gi', severity: 2, duration: '6to48h', worsening: true, redFlags: ['severe_dehydration'], functionalImpact: 3 }), expected: 'er', accept: ['urgent_care'] },
  { name: 'Open fracture, bone visible', f: F({ system: 'msk', severity: 3, suddenOnset: true, duration: 'under6h', possibleFracture: true, openWound: true, functionalImpact: 3 }), expected: 'er' },
  { name: 'Anaphylaxis: throat tightening, hives, eaten allergen', f: F({ system: 'skin', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['allergic_swelling'], functionalImpact: 3 }), expected: 'er', accept: ['emergency'] },
  { name: 'Head injury, elderly, now confused', f: F({ system: 'neuro', severity: 2, suddenOnset: true, duration: 'under6h', redFlags: ['fainting_or_confusion'], functionalImpact: 2 }), risk: ['age_over_65'], expected: 'er' },
  { name: 'COPD flare, worsening breathlessness, 2 days', f: F({ system: 'respiratory', severity: 2, duration: '6to48h', worsening: true, redFlags: ['breathing_difficulty'], functionalImpact: 3 }), risk: ['lung_condition'], expected: 'er' },
  { name: 'Diabetic: nausea, vomiting, high glucose, lethargic — DKA risk', f: F({ system: 'gi', severity: 2, duration: '6to48h', worsening: true, functionalImpact: 3 }), risk: ['diabetes'], expected: 'er', accept: ['urgent_care'] },
  { name: 'Sudden visual changes + severe headache — neuro emergency', f: F({ system: 'neuro', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['sudden_vision_loss', 'worst_headache_of_life'], functionalImpact: 3 }), expected: 'er', accept: ['emergency'] },
  { name: 'High fever + petechial rash — meningococcemia concern', f: F({ system: 'skin', severity: 3, suddenOnset: true, duration: 'under6h', highFever: true, functionalImpact: 3 }), expected: 'er', accept: ['emergency'] },
  { name: 'Severe depression with suicidal ideation', f: F({ system: 'mental', severity: 3, duration: 'over7d', redFlags: ['suicidal_thoughts'], functionalImpact: 3 }), expected: 'er', accept: ['emergency'] },
  { name: 'Altered mental status, won\'t rouse, unknown cause', f: F({ system: 'neuro', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['fainting_or_confusion'], functionalImpact: 3 }), expected: 'er', accept: ['emergency'] },

  // ── Emergency / 911 (new) ────────────────────────────────────────────────────
  { name: 'Massive uncontrolled bleeding — 911', f: F({ system: 'general', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['uncontrolled_bleeding'], functionalImpact: 3 }), expected: 'emergency' },
  { name: 'Classic ACS: crushing chest pain radiating to jaw, sweating', f: F({ system: 'cardiac', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['chest_pressure'], functionalImpact: 3 }), expected: 'emergency' },
  { name: 'Stroke: facial droop + arm weakness + slurred speech', f: F({ system: 'neuro', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['one_sided_weakness'], functionalImpact: 3 }), expected: 'emergency' },
  { name: 'Severe anaphylaxis: can\'t breathe + throat swelling', f: F({ system: 'respiratory', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['breathing_difficulty', 'allergic_swelling'], functionalImpact: 3 }), expected: 'emergency' },
  { name: 'Thunderclap headache + neck stiffness — subarachnoid/meningitis', f: F({ system: 'neuro', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['worst_headache_of_life', 'stiff_neck_with_fever'], highFever: true, functionalImpact: 3 }), expected: 'emergency', accept: ['er'] },
  { name: 'Overdose: unresponsive, pinpoint pupils', f: F({ system: 'neuro', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['fainting_or_confusion'], functionalImpact: 3, worsening: true }), expected: 'emergency', accept: ['er'] },

  // ── Clinical rule combos (new) ───────────────────────────────────────────────
  { name: 'RULE rf.stiff_neck_with_fever: classic presentation, young adult', f: F({ system: 'neuro', severity: 2, suddenOnset: true, redFlags: ['stiff_neck_with_fever'], highFever: true }), expected: 'er' },
  { name: 'RULE rf.sudden_vision_loss: monocular, sudden, no pain', f: F({ system: 'neuro', severity: 2, suddenOnset: true, redFlags: ['sudden_vision_loss'] }), expected: 'er', accept: ['emergency'] },
  { name: 'RULE cx.cardiac_highrisk: elderly + heart disease + cardiac symptoms', f: F({ system: 'cardiac', severity: 1, duration: '6to48h' }), risk: ['age_over_65', 'heart_disease'], expected: 'er' },
  { name: 'RULE cx.cardiac_highrisk: diabetic + heart disease + cardiac symptoms (severity 2) — silent MI risk', f: F({ system: 'cardiac', severity: 2, duration: '6to48h' }), risk: ['diabetes', 'heart_disease'], expected: 'er' },
  { name: 'RULE: pregnant + respiratory symptoms, moderate', f: F({ system: 'respiratory', severity: 2, duration: '6to48h', functionalImpact: 2 }), risk: ['pregnant'], expected: 'urgent_care', accept: ['er'] },
  { name: 'RULE: diabetic + UTI + fever (urosepsis risk)', f: F({ system: 'urinary', severity: 2, highFever: true, duration: '6to48h', functionalImpact: 2 }), risk: ['diabetes'], expected: 'urgent_care', accept: ['er'] },
  { name: 'RULE: smoker + COPD + worsening respiratory, moderate', f: F({ system: 'respiratory', severity: 2, duration: '6to48h', worsening: true, functionalImpact: 2 }), risk: ['smoker', 'lung_condition'], expected: 'er', accept: ['urgent_care'] },
  { name: 'RULE cx.immunocompromised_fever: transplant patient, any fever', f: F({ system: 'general', severity: 1, highFever: true, duration: '6to48h' }), risk: ['immunocompromised'], expected: 'urgent_care', accept: ['er'] },

  // ── Pediatric (new) ──────────────────────────────────────────────────────────
  { name: '4-month-old, fever 100.5F (over 3mo — toddler rule, not infant ER floor)', f: F({ system: 'general', severity: 1, highFever: true, duration: 'under6h' }), risk: ['age_under_2'], expected: 'urgent_care', accept: ['er'] },
  { name: 'Child 5yo, high fever 104F, no red flags', f: F({ system: 'general', severity: 2, highFever: true, duration: '6to48h', functionalImpact: 2 }), risk: ['age_under_2'], expected: 'urgent_care', accept: ['er'] },
  { name: 'Toddler swallowed small object, now coughing, possible airway', f: F({ system: 'respiratory', severity: 2, suddenOnset: true, duration: 'under6h', redFlags: ['breathing_difficulty'], functionalImpact: 3 }), risk: ['age_under_2'], expected: 'er', accept: ['emergency'] },
  { name: 'Croup in toddler, moderate stridor, working to breathe', f: F({ system: 'respiratory', severity: 2, duration: '6to48h', redFlags: ['breathing_difficulty'], functionalImpact: 2 }), risk: ['age_under_2'], expected: 'er', accept: ['urgent_care'] },
  { name: 'Febrile seizure in child, now resolved, child alert', f: F({ system: 'neuro', severity: 2, suddenOnset: true, duration: 'under6h', functionalImpact: 2 }), risk: ['age_under_2'], expected: 'er', accept: ['urgent_care'] },

  // ── Behavioral health (new) ──────────────────────────────────────────────────
  { name: 'First panic attack: chest tight, racing heart, can\'t breathe — must screen cardiac', f: F({ system: 'cardiac', severity: 2, suddenOnset: true, duration: 'under6h', functionalImpact: 2 }), expected: 'urgent_care', accept: ['er'] },
  { name: 'Alcohol withdrawal: shaking, sweating, 24h since last drink', f: F({ system: 'general', severity: 2, duration: '6to48h', worsening: true, functionalImpact: 2 }), expected: 'er', accept: ['urgent_care'] },
  { name: 'PTSD flashback, significant distress, no self-harm', f: F({ system: 'mental', severity: 2, duration: 'under6h', functionalImpact: 2 }), expected: 'telehealth', accept: ['primary_care', 'urgent_care'] },

  // ── Boundary / edge cases (new) ──────────────────────────────────────────────
  { name: 'Cardiac + elderly + diabetes: mild chest discomfort — triple risk', f: F({ system: 'cardiac', severity: 1, duration: '6to48h' }), risk: ['age_over_65', 'diabetes', 'heart_disease'], expected: 'er' },
  { name: 'Mild chest discomfort in 25yo athlete after exercise, no red flags', f: F({ system: 'msk', severity: 1, duration: 'under6h', functionalImpact: 1 }), expected: 'telehealth', accept: ['primary_care', 'urgent_care'] },
  { name: 'Immunocompromised + significant flank pain + fever', f: F({ system: 'urinary', severity: 2, highFever: true, duration: '6to48h', worsening: true, functionalImpact: 2 }), risk: ['immunocompromised'], expected: 'er', accept: ['urgent_care'] },
  { name: 'Pregnant + new severe headache, sudden', f: F({ system: 'neuro', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['worst_headache_of_life'], functionalImpact: 3 }), risk: ['pregnant'], expected: 'er', accept: ['emergency'] },
  { name: 'Elderly sudden confusion, no history of dementia', f: F({ system: 'neuro', severity: 2, suddenOnset: true, duration: 'under6h', redFlags: ['fainting_or_confusion'], functionalImpact: 2 }), risk: ['age_over_65'], expected: 'er' },
]

let exact = 0, acceptable = 0, underTriage = 0, dangerous = 0
const failures: string[] = []

for (const c of CASES) {
  const risk = { modifiers: (c.risk ?? []) as any }
  const d = decide(c.f, risk)
  const ok = d.careLevel === c.expected
  const okAlt = c.accept?.includes(d.careLevel) ?? false
  if (ok) exact++
  else if (okAlt) acceptable++
  else {
    failures.push(`✗ ${c.name}: expected ${c.expected}, got ${d.careLevel} (conf ${d.confidence})`)
    if (RANK[d.careLevel] < RANK[c.expected]) {
      underTriage++
      // under-triaging a red-flag case is a hard safety failure
      if (c.f.redFlags.length > 0) dangerous++
    }
  }
}

const total = CASES.length
console.log(`\nCarevo Route Engine — eval`)
console.log(`  Cases:            ${total}`)
console.log(`  Exact match:      ${exact} (${Math.round((exact / total) * 100)}%)`)
console.log(`  Acceptable:       ${exact + acceptable} (${Math.round(((exact + acceptable) / total) * 100)}%)`)
console.log(`  Under-triaged:    ${underTriage}`)
console.log(`  SAFETY FAILURES:  ${dangerous} (red-flag cases under-triaged)`)
if (failures.length) { console.log('\nMisses:'); failures.forEach(f => console.log('  ' + f)) }

if (dangerous > 0) { console.error('\nFAIL: dangerous under-triage detected'); process.exit(1) }
if ((exact + acceptable) / total < 0.85) { console.error('\nFAIL: accuracy below 85%'); process.exit(1) }

// ── EVOI interview-policy gates ──────────────────────────────────────────────
console.log('\nEVOI interview policy:')
const policyFailures: string[] = []
const NO_RISK = { modifiers: [] as any }

// P1: vague cardiac complaint, nothing established → must ASK, and the top
// ask must be a cardiac red-flag screen (chest pressure / breathing / syncope).
{
  const f = F({ system: 'cardiac', severity: 1 })
  const plan = planInterview(f, new Set(['system']), new Set<RedFlag>(), NO_RISK, {}, 0)
  const top = plan.asks[0]?.target ?? 'none'
  const isRedFlagScreen = top.startsWith('redFlag:')
  if (plan.action !== 'ask' || !isRedFlagScreen) {
    policyFailures.push(`P1: cardiac vague case — expected ask/redFlag screen, got ${plan.action}/${top}`)
  } else console.log(`  ✓ P1 vague cardiac → asks first, targets ${top}`)
}

// P2: fully-established mild cold → must DECIDE with zero questions.
{
  const f = F({ system: 'ent', severity: 0, duration: '2to7d', functionalImpact: 0 })
  const known = new Set(['system', 'severity', 'duration', 'functionalImpact', 'worsening', 'suddenOnset', 'highFever'])
  const checked = new Set<RedFlag>(['breathing_difficulty', 'stiff_neck_with_fever'])
  const plan = planInterview(f, known, checked, NO_RISK, {}, 0)
  if (plan.action !== 'decide') {
    policyFailures.push(`P2: established mild cold — expected decide with 0 questions, got ask (${plan.asks[0]?.target})`)
  } else console.log(`  ✓ P2 fully-known mild case → decides immediately (conf ${plan.confidence.toFixed(2)})`)
}

// P3: budget exhausted + ambiguous → decides and rounds UP, never down.
{
  const f = F({ system: 'gi', severity: 2, duration: '6to48h', functionalImpact: 2 })
  const plan = planInterview(f, new Set(['system', 'severity']), new Set<RedFlag>(), NO_RISK, {}, 4)
  if (plan.action !== 'decide') {
    policyFailures.push('P3: budget exhausted — expected decide, got ask')
  } else if (plan.roundUp) {
    const d = decide(f, NO_RISK)
    if (RANK[plan.topLevel] < RANK[d.careLevel]) policyFailures.push('P3: round-up went DOWN — safety violation')
    else console.log(`  ✓ P3 out of budget + ambiguous → rounds up to ${plan.topLevel}`)
  } else console.log(`  ✓ P3 out of budget → decides (confident: ${plan.confidence.toFixed(2)})`)
}

// P4: an ER-floor red flag present → interview STOPS (no more questions).
{
  const f = F({ system: 'cardiac', severity: 2, redFlags: ['chest_pressure'] })
  const plan = planInterview(f, new Set(['system']), new Set<RedFlag>(), NO_RISK, {}, 0)
  if (plan.action !== 'decide') policyFailures.push('P4: chest_pressure red flag — interview must stop, but it asked')
  else console.log('  ✓ P4 ER red flag present → interview stops immediately')
}

// P5: mental-health system → EVOI never probes suicidal ideation.
{
  const f = F({ system: 'mental', severity: 1 })
  const plan = planInterview(f, new Set(['system']), new Set<RedFlag>(), NO_RISK, {}, 0)
  const probesSI = plan.asks.some(a => a.target === 'redFlag:suicidal_thoughts')
  if (probesSI) policyFailures.push('P5: EVOI probed suicidal ideation — forbidden')
  else console.log('  ✓ P5 mental-health case → never probes suicidal ideation')
}

// P7: emergency classifier tiers — bare "chest pain" must interview (high
// alert), classic ACS wording must hard-stop to 911, and negations must not
// blanket-911 someone describing a pulled muscle.
{
  const tiers: Array<[string, ReturnType<typeof classifyEmergency>]> = [
    ['I have chest pain', 'high_alert'],
    ['my chest hurts when I press on it after the gym', 'high_alert'],
    ['crushing chest pain and I am sweating', 'immediate'],
    ['chest pain spreading to my left arm', 'immediate'],
    ['chest tightness and shortness of breath', 'immediate'],
    ['short of breath while sitting still and can only speak a few words', 'immediate'],
    ['I think I am having a heart attack', 'immediate'],
    ['my ankle hurts', null],
    // Negation blindness — denials must NOT trigger the danger net
    ['chest pain but no sweating, no trouble breathing, not dizzy', 'high_alert'],
    ['my chest hurts when I press it, I was lifting weights. no shortness of breath', 'high_alert'],
    ['my hand feels numb', 'high_alert'],
    ['sudden numbness on one side with slurred speech', 'immediate'],
    ['abrupt trouble speaking and one-sided numbness', 'immediate'],
    ['suddenly cannot lift her right arm and has new confusion', 'immediate'],
    ['sudden vision trouble, one-sided weakness, and difficulty walking', 'immediate'],
    ['lip and tongue swelling with trouble breathing after peanuts', 'immediate'],
    ['I am wheezing and short of breath', 'high_alert'],
  ]
  const bad = tiers.filter(([text, want]) => classifyEmergency(text) !== want)
  if (bad.length) {
    bad.forEach(([text, want]) => policyFailures.push(`P7: "${text}" — expected ${want}, got ${classifyEmergency(text)}`))
  } else console.log('  ✓ P7 emergency tiers: bare chest pain interviews, ACS wording hard-stops')
}

// P7b: presentation-type EVOI ladders — isolated neuro symptoms should ask
// focused stroke/thunderclap/vision questions before routing.
{
  const f = F({ presentationType: 'neuro', system: 'neuro', severity: 1 })
  const plan = planInterview(f, new Set(['system']), new Set<RedFlag>(), NO_RISK, {}, 0)
  const topTargets = plan.asks.map(a => a.target)
  const hasNeuroScreen = topTargets.some(t =>
    t === 'redFlag:one_sided_weakness' ||
    t === 'redFlag:worst_headache_of_life' ||
    t === 'redFlag:sudden_vision_loss'
  )
  if (plan.action !== 'ask' || !hasNeuroScreen) {
    policyFailures.push(`P7b: neuro presentation — expected focused neuro red-flag screen, got ${plan.action}/${topTargets.join(',')}`)
  } else console.log(`  ✓ P7b neuro presentation → asks focused red-flag ladder (${topTargets[0]})`)
}

// P8: deterministic infant-fever backstop — the ER floor for a febrile
// infant <3mo must not depend on the extractor LLM (found by trial harness:
// "2 month old with fever of 100.8" was routed to urgent care).
{
  const cases: Array<[string, boolean]> = [
    ['my 2 month old baby has a fever of 100.8', true],
    ['my two-month-old feels hot and fussy', true],
    ['our 6 week old has a temperature of 101', true],
    ['newborn with a fever', true],
    ['my 2 year old has a fever', false],           // toddler — uc rule, not ER floor
    ['my baby was sick a month ago', false],        // "month" but not an age+fever
    ['my 8 month old has a fever', false],          // >3mo — toddler rule territory
  ]
  const bad = cases.filter(([text, want]) => detectInfantFever(text) !== want)
  if (bad.length) {
    bad.forEach(([text, want]) => policyFailures.push(`P8: "${text}" — expected ${want}, got ${detectInfantFever(text)}`))
  } else console.log('  ✓ P8 infant-fever backstop: deterministic detection, no LLM dependency')
}

// P9: softened self-harm phrasing — people in crisis rarely use clinical
// words. Indirect phrasings must reach the 988 crisis flow; ordinary
// distress language must NOT (false positives erode trust).
{
  const cases: Array<[string, boolean]> = [
    ['I do not want to be here anymore', true],
    ["I don't want to wake up tomorrow", true],
    ['there is no point in going on', true],
    ['everyone would be better off without me', true],
    ["I keep thinking about hurting myself", true],
    ["I can't do this anymore", true],
    ['my anxiety has been really bad, racing thoughts', false],
    ['I am so tired of this cold', false],
    ["I don't want to be here at this job any longer", true],  // conservative: escalates — a false 988 offer is acceptable, a miss is not
  ]
  const bad = cases.filter(([text, want]) => detectSelfHarm(text) !== want)
  if (bad.length) {
    bad.forEach(([text, want]) => policyFailures.push(`P9: "${text}" — expected ${want}, got ${detectSelfHarm(text)}`))
  } else console.log('  ✓ P9 softened self-harm phrasing reaches the crisis flow')
}

// P11: clinician-approved calibration — the only down-adjuster. Must apply
// on clean matches and refuse whenever anything clinical is present.
{
  const cal = loadPromotedCalibration()
  if (!cal) {
    console.log('  ⚠ P11 skipped — no promoted calibration file')
  } else {
    const eczema = 'A 12-year-old has chronic dry itchy flexural skin and a hay fever history. No fever, no pus, no red streaks.'
    const cleanF = F({ system: 'skin', severity: 2, functionalImpact: 2 })
    const p10: Array<[string, boolean, () => boolean]> = [
      ['applies on clean eczema match (pc → home)', true,
        () => applyCalibration(eczema, cleanF, 'primary_care', false)?.to === 'home_care'],
      ['blocked when boundary term present (fever)', true,
        () => applyCalibration(eczema.replace('No fever', 'She has a fever'), cleanF, 'primary_care', false) === null],
      ['blocked when red flag extracted', true,
        () => applyCalibration(eczema, { ...cleanF, redFlags: ['allergic_swelling'] }, 'primary_care', false) === null],
      ['blocked when a floor fired', true,
        () => applyCalibration(eczema, cleanF, 'primary_care', true) === null],
      ['lowers from ER only with human-granted allowFromEr (eczema has it)', true,
        () => applyCalibration(eczema, cleanF, 'er', false)?.to === 'home_care'],
      ['ER not lowered without allowFromEr (rhinitis)', true,
        () => applyCalibration('Years of sneezing, nasal itching and seasonal congestion. No fever, no facial pain.', F({ system: 'ent', severity: 1 }), 'er', false) === null],
      ['911/emergency untouchable, always', true,
        () => applyCalibration(eczema, cleanF, 'emergency', false) === null],
      ['never raises (decision already at target)', true,
        () => applyCalibration(eczema, cleanF, 'home_care', false) === null],
      ['every promoted pattern traces to clinician rows', true,
        () => cal.patterns.every(p => p.learnedFrom.length > 0 && p.boundaryTerms.length > 0)],
    ]
    const bad = p10.filter(([, want, fn]) => fn() !== want)
    if (bad.length) bad.forEach(([name]) => policyFailures.push(`P11: ${name}`))
    else console.log(`  ✓ P11 calibration: applies clean, refuses on boundary/red-flag/floor/ER (${cal.patterns.length} patterns, ${cal.version})`)
  }
}

// P6: rule layer sanity — combination rule fires with no red flags reported.
{
  const f = F({ system: 'cardiac', severity: 2 })
  const r = applyRules(f, { modifiers: ['heart_disease'] as any })
  if (r.floor !== 'er' || !r.fired.some(rule => rule.id === 'cx.cardiac_highrisk')) {
    policyFailures.push(`P6: cx.cardiac_highrisk did not fire (floor=${r.floor})`)
  } else console.log('  ✓ P6 combination rule fires without any reported red flag')
}

// P10: severe-dehydration backstop — "can't keep fluids down" + vomiting/
// orthostatic context must be detected deterministically (not LLM-dependent).
// Found: gi-dehydration under-triaged 2/3 live rounds despite clear language.
{
  const cases: Array<[string, boolean]> = [
    ["I've been vomiting since last night and can't keep any water down, and I've been dizzy every time I stand up", true],
    ["can't keep fluids down, throwing up everything", true],
    ["nothing will stay down, I vomit after every sip", true],
    ["unable to keep anything down and dizzy when I stand", true],
    ["I feel dizzy when I stand up and have been vomiting", true],
    // Should NOT trigger on mild symptoms
    ["I have a mild stomach ache but I can still eat", false],
    ["I feel a little nauseous but kept water down fine", false],
    ["I get dizzy sometimes when I stand up quickly", false],   // no vomiting context
    ["my stomach hurts after meals", false],
  ]
  const bad = cases.filter(([text, want]) => detectSevereDehydration(text) !== want)
  if (bad.length) {
    bad.forEach(([text, want]) => policyFailures.push(`P10: "${text.slice(0, 60)}…" — expected ${want}, got ${detectSevereDehydration(text)}`))
  } else console.log('  ✓ P10 severe-dehydration backstop: cant-keep-fluids-down + vomiting/orthostatic detected')
}

if (policyFailures.length) {
  console.error('\nFAIL: interview policy violations:')
  policyFailures.forEach(p => console.error('  ✗ ' + p))
  process.exit(1)
}

// ── Knowledge-retrieval gates ────────────────────────────────────────────────
console.log('\nKnowledge retrieval:')
const kbFailures: string[] = []
const NORISK = { modifiers: [] as any }

// R1: cardiac case retrieves AHA heart-attack warning signs
{
  const g = retrieveGuidance('warning_signs', F({ system: 'cardiac', severity: 2, redFlags: ['chest_pressure'] }), NORISK).guidance
  if (!g.some(x => x.chunkId.startsWith('doc.aha.heart'))) kbFailures.push(`R1: cardiac case did not retrieve AHA chunk (got ${g.map(x => x.chunkId).join(', ') || 'none'})`)
  else console.log(`  ✓ R1 cardiac → AHA warning signs (${g[0].chunkId}, score ${g[0].retrievalScore})`)
}

// R2: infant fever retrieves pediatric guidance, not adult-only content
{
  const g = retrieveGuidance('warning_signs', F({ system: 'general', severity: 1, highFever: true, redFlags: ['infant_under_3mo_fever'] }), { modifiers: ['age_under_2'] as any }).guidance
  const pediatric = g.some(x => x.chunkId.startsWith('doc.aap.'))
  if (!pediatric) kbFailures.push(`R2: infant fever did not retrieve AAP guidance (got ${g.map(x => x.chunkId).join(', ') || 'none'})`)
  else console.log(`  ✓ R2 infant fever → pediatric chunks (${g.map(x => x.chunkId).join(', ')})`)
}

// R3: content-type isolation — self_care retrieval never returns warning signs
{
  const g = retrieveGuidance('self_care', F({ system: 'gi', severity: 1 }), NORISK).guidance
  const leaked = g.some(x => x.chunkId === 'doc.nih.dehydration#1')
  if (leaked) kbFailures.push('R3: self_care retrieval leaked a warning_signs chunk')
  else console.log(`  ✓ R3 content-type isolation holds (self_care → ${g.map(x => x.chunkId).join(', ') || 'none'})`)
}

// R4: pregnancy case retrieves ACOG
{
  const g = retrieveGuidance('warning_signs', F({ system: 'gyn', severity: 2 }), { modifiers: ['pregnant'] as any }).guidance
  if (!g.some(x => x.chunkId.startsWith('doc.acog.'))) kbFailures.push(`R4: pregnancy case did not retrieve ACOG (got ${g.map(x => x.chunkId).join(', ') || 'none'})`)
  else console.log('  ✓ R4 pregnancy → ACOG guidance')
}

// R5: provenance completeness — every retrieved chunk carries full metadata
{
  const g = retrieveGuidance('warning_signs', F({ system: 'neuro', severity: 2 }), NORISK).guidance
  const incomplete = g.filter(x => !x.org || !x.url || !x.publishedDate || !x.evidenceStrength || !x.chunkVersion)
  if (incomplete.length) kbFailures.push(`R5: chunks missing provenance: ${incomplete.map(x => x.chunkId).join(', ')}`)
  else console.log('  ✓ R5 provenance complete on every retrieved chunk')
}

// R6: determinism — identical input retrieves identical chunks
{
  const f = F({ system: 'msk', severity: 2, possibleFracture: true })
  const a = retrieveGuidance('warning_signs', f, NORISK).guidance.map(x => x.chunkId).join('|')
  const b = retrieveGuidance('warning_signs', f, NORISK).guidance.map(x => x.chunkId).join('|')
  if (a !== b) kbFailures.push(`R6: retrieval not deterministic (${a} vs ${b})`)
  else console.log('  ✓ R6 retrieval deterministic')
}

if (kbFailures.length) {
  console.error('\nFAIL: knowledge retrieval violations:')
  kbFailures.forEach(p => console.error('  ✗ ' + p))
  process.exit(1)
}

// ── Knowledge-graph consistency gates ────────────────────────────────────────
console.log('\nKnowledge graph consistency:')
{
  const report = checkConsistency()
  console.log(`  ${report.stats.nodes} nodes · ${report.stats.edges} edges · ${report.stats.chunks} chunks · ${report.stats.rules} rules · warning-signs coverage ${report.stats.warningSignsCoverage}`)
  for (const w of report.warnings.slice(0, 6)) console.log(`  ⚠ ${w}`)
  if (report.warnings.length > 6) console.log(`  ⚠ …and ${report.warnings.length - 6} more warnings`)
  if (report.errors.length) {
    console.error('\nFAIL: knowledge graph wiring errors:')
    report.errors.forEach(e => console.error('  ✗ ' + e))
    process.exit(1)
  }
  console.log('  ✓ no wiring errors (every red flag floors, every screen routes, every citation resolves)')
}

// ── Property-based safety tests over the full feature grid ──────────────────
// Instead of hand-writing thousands of vignettes, assert SAFETY PROPERTIES
// that must hold for every point in feature space. Violations print the
// exact counterexample — each one is either a model bug or a labeled case
// to add to the vignette bank.
console.log('\nProperty-based safety (feature grid):')
{
  const SYSTEMS: BodySystem[] = ['cardiac', 'respiratory', 'neuro', 'gi', 'msk', 'skin', 'ent', 'urinary', 'gyn', 'mental', 'general']
  const DURATIONS = ['under6h', '6to48h', '2to7d', 'over7d'] as const
  const propViolations: string[] = []
  let gridCases = 0, monoChecks = 0, flagChecks = 0, riskChecks = 0

  const RISK_MODS = ['age_over_65', 'age_under_2', 'pregnant', 'diabetes', 'heart_disease', 'immunocompromised'] as const

  for (const system of SYSTEMS) {
    for (const severity of [0, 1, 2, 3] as const) {
      for (const duration of DURATIONS) {
        for (const worsening of [false, true]) {
          for (const suddenOnset of [false, true]) {
            const f = F({ system, severity, duration, worsening, suddenOnset, functionalImpact: severity })
            const base = decide(f, { modifiers: [] as any })
            gridCases++

            // PROPERTY 1 — severity monotonicity: more severe must never
            // route LOWER (holding everything else fixed).
            if (severity < 3) {
              monoChecks++
              const worse = decide(F({ ...f, severity: (severity + 1) as 0 | 1 | 2 | 3, functionalImpact: (severity + 1) as 0 | 1 | 2 | 3 }), { modifiers: [] as any })
              if (RANK[worse.careLevel] < RANK[base.careLevel]) {
                propViolations.push(`severity ${severity}→${severity + 1} LOWERED ${system}/${duration}/w=${worsening}/s=${suddenOnset}: ${base.careLevel}→${worse.careLevel}`)
              }
            }

            // PROPERTY 2 — red-flag dominance: adding any red flag must never
            // route lower, and must land at or above the flag's floor.
            for (const flag of ['chest_pressure', 'breathing_difficulty', 'uncontrolled_bleeding'] as RedFlag[]) {
              flagChecks++
              const flagged = decide({ ...f, redFlags: [flag] }, { modifiers: [] as any })
              if (RANK[flagged.careLevel] < RANK[base.careLevel]) {
                propViolations.push(`adding ${flag} LOWERED ${system}/sev${severity}: ${base.careLevel}→${flagged.careLevel}`)
              }
            }

            // PROPERTY 3 — risk modifiers never lower acuity (an elderly or
            // pregnant patient must never be routed BELOW the baseline adult).
            if (severity === 1 || severity === 2) {
              for (const mod of RISK_MODS) {
                riskChecks++
                const risky = decide(f, { modifiers: [mod] as any })
                if (RANK[risky.careLevel] < RANK[base.careLevel]) {
                  propViolations.push(`risk ${mod} LOWERED ${system}/sev${severity}/${duration}: ${base.careLevel}→${risky.careLevel}`)
                }
              }
            }
          }
        }
      }
    }
  }

  console.log(`  grid points: ${gridCases} · checks: ${monoChecks} severity + ${flagChecks} red-flag + ${riskChecks} risk-modifier = ${monoChecks + flagChecks + riskChecks}`)
  if (propViolations.length) {
    console.error(`\nFAIL: ${propViolations.length} property violations (first 10):`)
    propViolations.slice(0, 10).forEach(v => console.error('  ✗ ' + v))
    process.exit(1)
  }
  console.log('  ✓ severity monotonicity holds everywhere')
  console.log('  ✓ red-flag dominance holds everywhere')
  console.log('  ✓ risk modifiers never lower acuity')
}

console.log('\nPASS')
