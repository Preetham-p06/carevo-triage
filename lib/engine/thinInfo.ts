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
  // Limited-English hedge forms — round-16 finding: "not know, feel hot"
  // wasn't counted as vague, so the thin floor never fired for a
  // limited-English fever patient. Hedging sounds different in broken
  // English; these forms are hedges all the same.
  /\b(not\s+know|no\s+know|no\s+understand|not\s+understand|no\s+can\s+say|cannot\s+say\s+how|how\s+to\s+say)\b/i,
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

/** When to spend a question slot on the open "anything else?" sweep — kept
 *  GENEROUS on purpose: an extra open question is cheap and good practice. */
export function shouldSweep(establishedFieldCount: number, vagueAnswerCount: number): boolean {
  return establishedFieldCount <= 2 || vagueAnswerCount >= 1
}

/** The interview is "thin" — for the never-home-care FLOOR — only when the
 *  patient actually HEDGED: ≥2 vague answers, or 1 vague answer with almost
 *  nothing established. Field count alone NEVER triggers the floor.
 *
 *  Round-14 lesson (2026-07-16): flooring on "≤2 fields established" flipped
 *  44 detailed-but-brief home-care benchmark cases to telehealth (92.5% →
 *  74.2% exact). Live testing showed the extractor is conservative about
 *  marking fields established even on clearly described cases — so low field
 *  count is normal for simple presentations, not evidence of vagueness.
 *  Clear answers and denials are SIGNAL (house philosophy: never
 *  blanket-escalate; interview like a nurse). Hedging is the real marker. */
export function isThinInformation(establishedFieldCount: number, vagueAnswerCount: number): boolean {
  return vagueAnswerCount >= 2 || (vagueAnswerCount >= 1 && establishedFieldCount <= 1)
}

export interface ThinInfoAdjustment {
  from: CareLevel
  to: CareLevel
  reason: string
}

/**
 * Up-only floor: thin information can never route home_care, and CARDIAC
 * presentations never route home_care at all (a chest complaint always
 * deserves at least a virtual clinician, even when every red flag is
 * denied — the deny-everything patient is exactly who under-reports).
 * Returns the adjustment to apply, or null. Never lowers a level, never
 * fires on anything above home_care — provably safe by construction.
 */
export function applyThinInfoFloor(
  careLevel: CareLevel,
  establishedFieldCount: number,
  vagueAnswerCount: number,
  presentationType?: string,
): ThinInfoAdjustment | null {
  if (careLevel !== 'home_care') return null
  if (presentationType === 'cardiac') {
    return {
      from: 'home_care',
      to: 'telehealth',
      reason: 'Chest symptoms are worth a quick talk with a clinician, even when nothing else seems wrong — a virtual visit is a safe next step.',
    }
  }
  if (!isThinInformation(establishedFieldCount, vagueAnswerCount)) return null
  return {
    from: 'home_care',
    to: 'telehealth',
    reason: 'We could not confirm enough details to safely recommend home care, so we suggest at least a virtual visit — a clinician can ask what we could not.',
  }
}

/**
 * Fever-language floor (round-16 fix, 2026-07-16): if the patient described
 * feeling feverish anywhere in the conversation (checked on negation-stripped
 * text, so "no fever" doesn't count) the decision can never be home_care —
 * minimum telehealth. Deterministic, up-only, LLM-independent: it holds even
 * when the extractor misses limited-English fever phrasing ("head very hot
 * two day"). Caller supplies detectFeverMention(stripNegatedClauses(text)).
 */
export function applyFeverLanguageFloor(
  careLevel: CareLevel,
  feverMentioned: boolean,
): ThinInfoAdjustment | null {
  if (careLevel !== 'home_care' || !feverMentioned) return null
  return {
    from: 'home_care',
    to: 'telehealth',
    reason: 'You mentioned feeling hot or feverish — a quick virtual visit is the safe next step so a clinician can check.',
  }
}
