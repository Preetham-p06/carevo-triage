// Deterministic patient-facing content — templated by the engine, not the LLM.

import type { ExtractedFeatures, BodySystem } from './features'
import type { EngineLevel } from './model'

const LEVEL_PHRASE: Record<EngineLevel, string> = {
  emergency: 'this needs emergency care right now — call 911.',
  er: 'the safest place for this is the emergency room, and you should go now.',
  urgent_care: 'an urgent care visit within the next few hours is the right level of care.',
  primary_care: 'this is best handled by a doctor within the next 1–3 days.',
  telehealth: 'a virtual visit today can handle this without leaving home.',
  home_care: 'this can be safely managed at home with rest and self-care for now.',
}

const DURATION_TEXT: Record<string, string> = {
  under6h: 'starting in the last few hours',
  '6to48h': 'over the last day or two',
  '2to7d': 'over the past few days',
  over7d: 'for more than a week',
}

/**
 * Patient-facing reasoning may only RESTATE facts the conversation actually
 * established (`known`). The engine may still SCORE on inferred/defaulted
 * features — dropping an inferred escalation signal would risk under-triage —
 * but it must never claim back to the patient something they didn't say.
 * (Clinical-reviewer feedback: "I said 2 days; it said 'several days' and
 * 'getting worse'" — both were fabricated restatements, not their words.)
 */
export function buildReasoning(
  f: ExtractedFeatures,
  level: EngineLevel,
  known: Set<string> = new Set(),
): string {
  const dur = known.has('duration') ? ` ${DURATION_TEXT[f.duration] ?? ''}` : ''
  const trend = known.has('worsening') && f.worsening ? ' and getting worse' : ''
  return `Based on what you've described — ${f.summary.replace(/\.$/, '')}${dur}${trend} — ${LEVEL_PHRASE[level]}`
}

export const WHAT_TO_EXPECT: Record<EngineLevel, string> = {
  emergency: 'Paramedics will assess you on scene and stabilize you on the way to the hospital.',
  er: 'Expect check-in and triage on arrival, vitals, and likely tests such as blood work or imaging. Waits vary — more urgent cases are seen first.',
  urgent_care: 'Expect a 15–45 minute wait, vitals, and an exam. Urgent care can do X-rays, stitches, and prescriptions on site.',
  primary_care: 'A standard office visit: history review, physical exam, and possibly labs. Book ahead — same-week slots are common.',
  telehealth: 'A 10–20 minute video call. The clinician can assess symptoms visually, answer questions, and send prescriptions to your pharmacy.',
  home_care: 'No visit needed for now. Rest, fluids, and over-the-counter options are appropriate — seek care if things change.',
}

export const SELF_CARE: Record<BodySystem, string> = {
  cardiac: 'Avoid exertion until you\'ve been seen, and have someone stay with you if possible.',
  respiratory: 'Sit upright, rest, and avoid smoke or other irritants until you\'re seen.',
  neuro: 'Rest in a quiet, dim space and avoid driving until you\'ve been seen.',
  gi: 'Small sips of clear fluids; avoid solid food until things settle.',
  msk: 'Rest and elevate the area; ice 15–20 minutes at a time can help swelling.',
  skin: 'Keep the area clean and dry; avoid scratching or picking.',
  ent: 'Warm fluids, rest, and a humidifier can ease symptoms in the meantime.',
  urinary: 'Drink plenty of water and avoid caffeine and alcohol until you\'re seen.',
  gyn: 'Rest and track any changes in symptoms so you can report them at your visit.',
  mental: 'Try to stay with or near someone you trust, and be kind to yourself today.',
  general: 'Rest, stay hydrated, and keep an eye on how symptoms change.',
}

export function urgencyFor(level: EngineLevel): 'critical' | 'high' | 'medium' | 'low' {
  if (level === 'emergency') return 'critical'
  if (level === 'er') return 'critical'
  if (level === 'urgent_care') return 'high'
  if (level === 'home_care') return 'low'
  return 'medium'
}

/**
 * A short escalation note shown alongside the recommendation — tells the
 * patient what to watch for and when to escalate. Content is deterministic
 * (never LLM-generated) and scoped to what the engine can assert safely.
 */
const ALTERNATIVE_NOTE_SYSTEM: Partial<Record<BodySystem, string>> = {
  cardiac: 'Go to the ER immediately if you develop chest pain, pressure, or tightness; pain spreading to your arm or jaw; sweating; or difficulty breathing.',
  respiratory: 'Go to the ER immediately if breathing becomes difficult, you turn bluish, or you cannot speak in full sentences.',
  neuro: 'Call 911 immediately if you develop sudden facial drooping, arm weakness, slurred speech, or vision loss.',
  gi: 'Go to the ER if you vomit blood, your abdomen becomes rigid, or pain becomes severe and constant.',
}

const ALTERNATIVE_NOTE_LEVEL: Record<EngineLevel, string> = {
  emergency: '',
  er: '',
  urgent_care: 'If you cannot be seen within a few hours or your condition worsens rapidly — especially chest pain, difficulty breathing, or confusion — go to the ER.',
  primary_care: 'If symptoms worsen significantly before your appointment, or you develop difficulty breathing, chest pain, or a high fever (above 103°F / 39.4°C), go to urgent care or an ER the same day.',
  telehealth: 'If your symptoms worsen before your virtual visit or you develop difficulty breathing, chest pain, or confusion, go to urgent care or an ER instead.',
  home_care: 'Seek care if symptoms worsen, a fever develops or rises above 103°F / 39.4°C, or any new or alarming symptoms appear.',
}

export function alternativeNoteFor(level: EngineLevel, system: BodySystem): string {
  // For already-urgent levels, no escalation note is needed
  if (level === 'emergency' || level === 'er') return ''
  // System-specific note takes precedence when available; fall back to level note
  return ALTERNATIVE_NOTE_SYSTEM[system] ?? ALTERNATIVE_NOTE_LEVEL[level]
}
