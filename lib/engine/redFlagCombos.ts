import { stripNegatedClauses } from '../emergency'
import type { RedFlag } from './features'

export interface RedFlagComboAsk {
  target: `redFlag:${RedFlag}`
  evoi: number
  dangerMass: number
  hint: string
  rationale: string
}

interface RedFlagCombo {
  id: string
  family: string
  target: RedFlag
  base: RegExp
  modifier: RegExp
  hint: string
}

const BODILY_PAIN = /\b(pain|ache|hurt(?:s|ing)?|sore|pressure|tight(?:ness)?|discomfort|cramp(?:ing)?)\b/i
const CARDIAC_REFERRAL_PAIN = /(?:\b(?:left\s+)?(?:shoulder|arm|jaw|neck|upper back)\b[^.!?]{0,30}\b(?:pain|ache|hurt(?:s|ing)?|sore|pressure|tight(?:ness)?|discomfort)\b|\b(?:pain|ache|hurt(?:s|ing)?|sore|pressure|tight(?:ness)?|discomfort)\b[^.!?]{0,30}\b(?:left\s+)?(?:shoulder|arm|jaw|neck|upper back)\b)/i
const SUDDEN_OR_SYSTEMIC = /\b(sudden(?:ly)?|out of nowhere|all at once|acute|new|sweat(?:ing|y|iness)?|clammy|cold sweat|diaphor(?:esis|etic)|nausea|vomit(?:ing)?|dizz(?:y|iness)|lightheaded|faint(?:ed|ing)?|short(?:ness)? of breath|trouble breathing|exertion|stairs|walking|exercise)\b/i

/** Dangerous symptom + modifier combinations that should ask a focused
 *  safety question before final routing. These are question guards, not
 *  diagnosis rules: they do not choose a care level, they only make sure the
 *  right red-flag question happens when a user reveals a concerning clue. */
export const RED_FLAG_COMBOS: RedFlagCombo[] = [
  {
    id: 'combo.cardiac_referred_pain_systemic',
    family: 'cardiac',
    target: 'chest_pressure',
    base: CARDIAC_REFERRAL_PAIN,
    modifier: SUDDEN_OR_SYSTEMIC,
    hint: 'because they mentioned shoulder, arm, jaw, neck, or upper-back discomfort with a concerning clue, ask whether there is any chest pressure, squeezing, tightness, trouble breathing, nausea, dizziness, or pain spreading anywhere',
  },
  {
    id: 'combo.cardiac_referred_pain_breathing',
    family: 'cardiac',
    target: 'breathing_difficulty',
    base: CARDIAC_REFERRAL_PAIN,
    modifier: SUDDEN_OR_SYSTEMIC,
    hint: 'because they mentioned shoulder, arm, jaw, neck, or upper-back discomfort with sweating or sudden symptoms, ask whether breathing feels normal at rest and whether they can speak comfortably',
  },
  {
    id: 'combo.neuro_headache_sudden_or_deficit',
    family: 'neuro',
    target: 'worst_headache_of_life',
    base: /\b(headache|head\s+(hurts?|pain|pounding)|migraine)\b/i,
    modifier: /\b(sudden(?:ly)?|thunderclap|worst|vision|confus(?:ed|ion)|slurred|weak|numb|neck stiff|stiff neck|faint(?:ed|ing)?)\b/i,
    hint: 'about the headache they mentioned — ask whether it came on suddenly at full strength, is the worst they have had, or comes with vision changes, weakness, confusion, or a stiff neck',
  },
  {
    id: 'combo.neuro_weakness_speech',
    family: 'neuro',
    target: 'one_sided_weakness',
    base: /\b(face|arm|leg|hand|side|speech|speaking|walking|balance)\b/i,
    modifier: /\b(weak|numb|droop(?:ing)?|slurr(?:ed|ing)|confus(?:ed|ion)|sudden(?:ly)?|one[-\s]?sided|trouble)\b/i,
    hint: 'because they mentioned a possible nerve or movement change, ask about face drooping, weakness or numbness on one side, slurred speech, or sudden trouble walking',
  },
  {
    id: 'combo.breathing_symptom_distress',
    family: 'breathing',
    target: 'breathing_difficulty',
    base: /\b(cough|wheez(?:e|ing)|breath(?:ing)?|short(?:ness)? of breath|asthma|copd)\b/i,
    modifier: /\b(at rest|can(?:not|'?t) speak|blue|lips|worsening|rescue inhaler|albuterol|chest pain|chest pressure|gasp(?:ing)?)\b/i,
    hint: 'about the breathing symptoms they mentioned — ask whether they are short of breath at rest, struggling to speak, turning blue, or not improving with their usual breathing medicine',
  },
  {
    id: 'combo.abdominal_bleeding_or_collapse',
    family: 'abdominal',
    target: 'uncontrolled_bleeding',
    base: /\b(stomach|belly|abdominal|abdomen|pelvic|flank)\b/i,
    modifier: /\b(blood|black stool|tarry|vomit(?:ing)? blood|faint(?:ed|ing)?|dizz(?:y|iness)|rigid|guarding|severe|sudden(?:ly)?)\b/i,
    hint: 'about the belly or pelvic symptoms they mentioned — ask whether there is blood in vomit or stool, black/tarry stool, fainting, or sudden severe pain',
  },
  {
    id: 'combo.abdominal_vomiting_dehydration',
    family: 'abdominal',
    target: 'severe_dehydration',
    base: /\b(vomit(?:ing|ed)?|throw(?:ing)? up|diarrh(?:ea|oea)|stomach bug|belly|abdominal)\b/i,
    modifier: /\b(can(?:not|'?t) keep|nothing stays down|no urine|not peeing|dizz(?:y|iness)|weak|dry mouth|very thirsty)\b/i,
    hint: 'about the vomiting or stomach symptoms they mentioned — ask whether they can keep fluids down, are peeing much less, or feel dizzy when standing',
  },
  {
    id: 'combo.pregnancy_pain_or_bleeding',
    family: 'pregnancy',
    target: 'pregnancy_bleeding_or_pain',
    base: /\b(pregnan(?:t|cy)|weeks?\s+pregnant|postpartum)\b/i,
    modifier: /\b(bleed(?:ing)?|spotting|abdominal|belly|pelvic|cramp(?:ing)?|shoulder pain|faint(?:ed|ing)?|dizz(?:y|iness))\b/i,
    hint: 'because they mentioned pregnancy or postpartum symptoms, ask whether there is vaginal bleeding, severe belly or pelvic pain, shoulder pain, fainting, or dizziness',
  },
  {
    id: 'combo.pediatric_fever_danger',
    family: 'pediatric fever',
    target: 'severe_dehydration',
    base: /\b(baby|infant|toddler|child|kid|newborn|month[-\s]old|year[-\s]old|y\/o)\b/i,
    modifier: /\b(fever|hot|temperature|not drinking|no wet diapers?|not peeing|lethargic|hard to wake|stiff neck|rash|breath(?:ing)?)\b/i,
    hint: 'about the child they mentioned — ask whether they are drinking, making wet diapers or peeing normally, hard to wake, breathing normally, or have a stiff neck or rash',
  },
  {
    id: 'combo.infection_fever_neuro_rash',
    family: 'infection',
    target: 'stiff_neck_with_fever',
    base: /\b(fever|temperature|chills|rigors|hot)\b/i,
    modifier: /\b(stiff neck|neck stiff|confus(?:ed|ion)|rash|purple spots|petechial|worst headache|immunocompromised|chemo|transplant)\b/i,
    hint: 'about the fever they mentioned — ask whether there is a stiff neck, bad headache, confusion, rash or purple spots, or a weakened immune system such as chemo or transplant medicines',
  },
  {
    id: 'combo.allergic_reaction_airway',
    family: 'allergic reaction',
    target: 'allergic_swelling',
    base: /\b(hives|rash|allerg(?:y|ic)|bee sting|peanut|shellfish|medicine|antibiotic|swelling)\b/i,
    modifier: /\b(lips?|tongue|face|throat|breath(?:ing)?|wheez(?:e|ing)|dizz(?:y|iness)|faint(?:ed|ing)?|rapid(?:ly)? spreading)\b/i,
    hint: 'about the possible allergic reaction they mentioned — ask whether the lips, tongue, face, or throat are swelling, breathing is hard, or they feel faint',
  },
  {
    id: 'combo.trauma_head_or_bleeding',
    family: 'trauma',
    target: 'fainting_or_confusion',
    base: /\b(fell|fall|hit (my|his|her|their)?\s*head|head injury|crash|accident|collision|trauma)\b/i,
    modifier: /\b(pass(?:ed)? out|lost consciousness|faint(?:ed|ing)?|confus(?:ed|ion)|vomit(?:ing)?|blood thinner|severe headache|won'?t wake)\b/i,
    hint: 'about the injury they mentioned — ask whether they passed out, seem confused, vomited, have a severe headache, or take blood thinners',
  },
  {
    id: 'combo.back_pain_neuro_bladder',
    family: 'back pain',
    target: 'one_sided_weakness',
    base: /\b(back pain|low back|spine|sciatica)\b/i,
    modifier: /\b(weak(?:ness)?|numb(?:ness)?|tingl(?:ing)?|groin|saddle|bladder|bowel|can(?:not|'?t) pee|foot drop|fever|trauma)\b/i,
    hint: 'about the back pain they mentioned — ask whether there is new leg weakness, numbness in the groin area, trouble peeing, loss of bowel control, fever, or a recent injury',
  },
  {
    id: 'combo.eye_pain_vision',
    family: 'eye symptoms',
    target: 'sudden_vision_loss',
    base: /\b(eye|vision|sight)\b/i,
    modifier: /\b(pain|injury|chemical|blurry|blurred|double|loss|halos?|light sensitivity|photophobia|sudden(?:ly)?)\b/i,
    hint: 'about the eye symptom they mentioned — ask whether vision suddenly changed or decreased, there is severe eye pain, light sensitivity, halos, or a chemical or injury exposure',
  },
  {
    id: 'combo.mental_health_medical_mimic',
    family: 'mental health',
    target: 'chest_pressure',
    base: /\b(anxiety|panic|panic attack|racing heart|heart racing|scared|overwhelmed)\b/i,
    modifier: /\b(chest|breath(?:ing)?|short(?:ness)? of breath|sweat(?:ing|y)?|dizz(?:y|iness)|faint(?:ed|ing)?|left arm|jaw)\b/i,
    hint: 'because panic-like symptoms can overlap with body warning signs, ask whether there is chest pressure or tightness, trouble breathing at rest, fainting, or pain spreading to the arm or jaw',
  },
]

export function pickRedFlagComboQuestion(
  rawText: string,
  opts: {
    askedTargets?: Set<string>
    checkedRedFlags?: Set<RedFlag>
  } = {},
): RedFlagComboAsk | null {
  const text = stripNegatedClauses(rawText).replace(/\s+/g, ' ')
  if (!text.trim()) return null

  if (
    !opts.askedTargets?.has('redFlag:stiff_neck_with_fever') &&
    !opts.checkedRedFlags?.has('stiff_neck_with_fever') &&
    /\b(fever|temperature|chills|rigors|hot)\b/i.test(text) &&
    /\b(stiff neck|neck stiff|confus(?:ed|ion)|rash|purple spots|petechial|worst headache|bad headache|immunocompromised|chemo|transplant)\b/i.test(text)
  ) {
    return {
      target: 'redFlag:stiff_neck_with_fever',
      evoi: 10,
      dangerMass: 1,
      hint: 'about the fever they mentioned — ask whether there is a stiff neck, bad headache, confusion, rash or purple spots, or a weakened immune system such as chemo or transplant medicines',
      rationale: 'raw red-flag combo (infection: fever + neurologic/rash/immunocompromise clue) — focused safety screen before routing',
    }
  }

  for (const combo of RED_FLAG_COMBOS) {
    const target = `redFlag:${combo.target}` as const
    if (opts.askedTargets?.has(target) || opts.checkedRedFlags?.has(combo.target)) continue
    if (!combo.base.test(text) || !combo.modifier.test(text)) continue

    return {
      target,
      evoi: 10,
      dangerMass: 1,
      hint: combo.hint,
      rationale: `raw red-flag combo (${combo.family}: ${combo.id}) — focused safety screen before routing`,
    }
  }

  // A broad fallback for pain in cardiac referral zones plus systemic danger.
  // Kept after the table so specific family wording wins first.
  if (
    !opts.askedTargets?.has('redFlag:chest_pressure') &&
    !opts.checkedRedFlags?.has('chest_pressure') &&
    CARDIAC_REFERRAL_PAIN.test(text) &&
    BODILY_PAIN.test(text) &&
    SUDDEN_OR_SYSTEMIC.test(text)
  ) {
    return {
      target: 'redFlag:chest_pressure',
      evoi: 10,
      dangerMass: 1,
      hint: 'because they mentioned pain in a cardiac referral area with a concerning clue, ask whether there is chest pressure, trouble breathing, nausea, sweating, dizziness, or pain spreading anywhere',
      rationale: 'raw red-flag combo (cardiac referral pain + systemic clue) — focused safety screen before routing',
    }
  }

  return null
}
