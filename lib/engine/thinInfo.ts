// ─────────────────────────────────────────────────────────────────────────────
// Thin-information safeguards. Round-13 finding (2026-07-16): vague patients
// ("not sure", "idk", "kinda") sailed through the red-flag interview with
// nothing established and landed on home_care — the LOWEST care level — twice
// (vague-headache, vague-chest). Paul's rule: a nurse never says "stay home"
// to someone she couldn't get real answers from.
//
// Two deterministic pieces, both LLM-independent:
//   1. Vague-answer detection — counts patient replies that carry no usable
//      clinical signal. Used to decide when the interview is "thin".
//   2. An UP-ONLY floor — thin information can never produce home_care; the
//      minimum becomes telehealth (cheap, accessible, and a clinician gets
//      eyes on the case). It never lowers, never touches ER/emergency logic.
// ─────────────────────────────────────────────────────────────────────────────
import type { CareLevel } from '../types'
import type { Message } from '../types'

/** Replies that acknowledge the question but establish nothing. Kept broad on
 *  purpose: hedges are how real people (and limited-English speakers) answer. */
const VAGUE_PATTERNS: RegExp[] = [
  /\b(not\s+sure|unsure|no\s+idea|no\s+clue|dunno|don'?t\s+know|dont\s+know)\b/i,
  /\b(idk|idc|iunno)\b/i,
  /\b(maybe|i\s+guess|i\s+think\s*\??|kinda|kind\s+of|sort\s+of|sorta)\b/i,
  /\b(hard\s+to\s+(say|tell|explain|describe))\b/i,
  /\b(can'?t\s+(really\s+)?(tell|say|describe|explain))\b/i,
  /\b(it'?s?\s+just\s+weird|feels?\s+weird|feels?\s+strange|feels?\s+off|feels?\s+funny)\b/i,
]

export function isVagueAnswer(text: string): boolean {
  const t = (text ?? '').trim()
  if (!t) return true
  // Very short non-committal replies ("ok", "ya", "hm") carry no signal either.
  if (t.length <= 3 && !/\b(no|yes)\b/i.test(t)) return true
  return VAGUE_PATTERNS.some(re => re.test(t))
}

/** Count vague patient replies AFTER the opener (the opener being vague is
 *  normal — that's why we interview). */
export function countVagueAnswers(messages: Message[]): number {
  const userReplies = messages.filter(m => m.role === 'user').slice(1)
  return userReplies.filter(m => isVagueAnswer(m.content)).length
}

/** The interview is "thin" when we established almost nothing, or the patient
 *  hedged through it. Either alone is enough. */
export function isThinInformation(establishedFieldCount: number, vagueAnswerCount: number): boolean {
  return establishedFieldCount <= 2 || vagueAnswerCount >= 2
}

export interface ThinInfoAdjustment {
  from: CareLevel
  to: CareLevel
  reason: string
}

/**
 * Up-only floor: thin information can never route home_care. Returns the
 * adjustment to apply, or null when nothing changes. Never lowers a level,
 * never fires on anything above home_care — provably safe by construction.
 */
export function applyThinInfoFloor(
  careLevel: CareLevel,
  establishedFieldCount: number,
  vagueAnswerCount: number,
): ThinInfoAdjustment | null {
  if (careLevel !== 'home_care') return null
  if (!isThinInformation(establishedFieldCount, vagueAnswerCount)) return null
  return {
    from: 'home_care',
    to: 'telehealth',
    reason: 'We could not confirm enough details to safely recommend home care, so we suggest at least a virtual visit — a clinician can ask what we could not.',
  }
}
