// Emergency keyword detection — runs BEFORE any AI call.
// If ANY of these terms appear, we hard-stop and show 911 CTA.

const EMERGENCY_PATTERNS = [
  /can'?t\s*breathe/i,
  /difficulty\s*breath/i,
  /not\s*breathing/i,
  /stop(ped)?\s*breathing/i,
  /\b(short\s+of\s+breath|trouble\s+breathing|hard\s+to\s+breathe)\b[^.]{0,80}\b(can\s+only|only\s+able\s+to)\s+(speak|say)\s+(a\s+)?few\s+words\b/i,
  /\b(can\s+only|only\s+able\s+to)\s+(speak|say)\s+(a\s+)?few\s+words\b[^.]{0,80}\b(short\s+of\s+breath|trouble\s+breathing|hard\s+to\s+breathe)\b/i,
  /heart\s*attack/i,
  /stroke/i,
  /unconscious/i,
  /unresponsive/i,
  /loss\s*of\s*consciousness/i,
  /passed?\s*out/i,
  /severe\s*bleed/i,
  /won'?t\s*stop\s*bleed/i,
  /bleed(ing)?\s*(a\s*lot|heavily|won'?t\s*stop)/i,
  /choking/i,
  /can'?t\s*swallow/i,
  /overdose/i,
  /took\s*too\s*many/i,
  /poison/i,
  /seiz(ure|ing)/i,
  /skull\s*fracture/i,
  /paralyz/i,
  // Stroke signs (FAST) — unambiguous, time-critical
  /face\s*(is\s*)?(droop|numb)/i,
  /droop(ing|y)?\s*face/i,
  /facial\s*droop/i,
  /slurred?\s*speech/i,
  /slurring/i,
  /\b(abrupt|sudden(?:ly)?|new)\s+(trouble|difficulty)\s+(speaking|talking|understanding)\b/i,
  /(weak|numb|droop)\w*\s*(on\s*)?(one|the\s*(left|right))\s*side/i,
  /(one|left|right)\s*side\s*(of\s*(my|his|her|their)?\s*(body|face)\s*)?(is\s*)?(weak|numb|droop)/i,
  /\b(one[-\s]?sided|right[-\s]?sided|left[-\s]?sided)\s+(weakness|numbness|numb|weak)\b/i,
  /\b(sudden(?:ly)?|new)\s+can(?:'?t|not)\s+lift\s+(my|his|her|their)?\s*(left|right)?\s*arm\b/i,
  /\b(sudden(?:ly)?|new)\s+(vision trouble|trouble seeing|difficulty walking)\b/i,
  // Paralysis-suggestive only — NOT a single immobile limb (a hurt wrist/ankle
  // is routed by the engine, not the 911 net). Allows an optional adjective
  // like "left"/"right" before the body part.
  /can(?:'?t|not)\s*move\s*(my\s*)?(left|right)?\s*(face|arm|leg|side|body|arms|legs)/i,
  /can(?:'?t|not)\s*move\s*at\s*all/i,
  /severe\s*allergic/i,
  /anaphylax/i,
  /epipen/i,
  /throat\s*(clos|swell)/i,
  /\b(lip|tongue|face|facial)\s+swelling\b[^.]{0,100}\b(trouble\s+breathing|difficulty\s+breath|hard\s+to\s+breathe|shortness\s+of\s+breath|wheez(?:e|ing))\b/i,
  /\b(trouble\s+breathing|difficulty\s+breath|hard\s+to\s+breathe|shortness\s+of\s+breath|wheez(?:e|ing))\b[^.]{0,100}\b(lip|tongue|face|facial)\s+swelling\b/i,
]

// Head-injury needs its own rule so "no head injury" / "didn't hit my head"
// don't trip the net.
const HEAD_INJURY = /\bhead\s*(injury|trauma|wound)\b|\bhit\s*(my|his|her|their)?\s*head\b/i
const HEAD_NEGATION = /\b(no|not|n'?t|without|denies?|didn'?t|never)\b[^.]{0,20}\bhead\b/i

// Self-harm / suicidal ideation gets its own path: the right response is the
// 988 Suicide & Crisis Lifeline (call/text 988), not the generic 911 CTA.
const SELF_HARM_PATTERNS = [
  /suicid/i,
  /kill\s*(my)?self/i,
  /self[-\s]?harm/i,
  /hurt(ing)?\s*myself/i,
  /end(ing)?\s*(my\s*life|it\s*all)/i,
  /(don'?t|do\s*not)\s*want\s*to\s*(live|be\s*alive|be\s*here|exist|wake\s*up|go\s*on)/i,
  /want\s*to\s*die/i,
  // Softened / indirect phrasings — people in crisis rarely use clinical words
  /no\s*(reason|point)\s*(to|in)\s*(liv|go(ing)?\s*on)/i,
  /better\s*off\s*(dead|without\s*me|gone)/i,
  /(thinking|thought)s?\s*(about|of)\s*(hurting|harming)\s*(myself|me)\b/i,
  /can'?t\s*(do\s*this|go\s*on)\s*anymore/i,
]

export function detectSelfHarm(text: string): boolean {
  return SELF_HARM_PATTERNS.some(pattern => pattern.test(text))
}

export function detectEmergency(text: string): boolean {
  if (EMERGENCY_PATTERNS.some(pattern => pattern.test(text))) return true
  if (HEAD_INJURY.test(text) && !HEAD_NEGATION.test(text)) return true
  return false
}

// ── Three-tier emergency classification ──────────────────────────────────────
// 'immediate'  → unambiguous: hard-stop to 911, no questions.
// 'high_alert' → ambiguous but dangerous-if-confirmed (e.g. bare "chest pain"):
//                do NOT hard-stop. Interview continues with a shortened budget
//                and red-flag screens first; any confirmed danger feature
//                escalates through the rule layer. A bare mention of chest
//                pain is most often musculoskeletal or reflux — blanket 911
//                is massive over-triage — but it deserves a nurse-grade
//                screen before any reassurance.

export type EmergencyClass = 'immediate' | 'high_alert' | null

/** Any mention of chest pain/discomfort/tightness/pressure */
const CHEST_SYMPTOM = /chest\s*(pain|discomfort|tight|pressure|hurt|ache|burn)/i
// Bare "weakness", "numbness", "tingling" fire too broadly on benign contexts
// ("feel weak from not eating", "hand numb from sleeping wrong").
// Require sudden-onset qualifier, body-part laterality, or a higher-specificity
// alarm pattern. Vision change and severe/worst headache stand alone.
const NEURO_HIGH_ALERT = new RegExp(
  [
    /\b(sudden(ly)?|new\s+onset)\s+(numb(ness)?|weak(ness)?|tingling)\b/.source,
    /\b(numb(ness)?|weak(ness)?|tingling)\s+(in|on|of)\s+(my\s+)?(face|arm|leg|hand|foot|feet|side|body)\b/.source,
    /\b(face|arm|leg|hand|foot|feet|one\s+side)\s+(is\s+|feels?\s+|went\s+|has\s+(gone|become)\s+)?(numb|weak|tingling)\b/.source,
    /\bvision\s*(loss|change|blurry|blurred)\b/.source,
    /\b(severe|worst|thunderclap|sudden\s+severe)\s*headache\b/.source,
    /\bworst\s*(headache|head\s*pain)\b/.source,
  ].join('|'),
  'i',
)
const RESP_HIGH_ALERT = /\b(short(ness)?\s*of\s*breath|hard\s*to\s*breathe|wheez(ing)?|trouble\s*breathing)\b/i

/** Context that converts ambiguous chest symptoms into an immediate 911:
 *  classic ACS accompaniments per AHA warning signs. */
const CHEST_DANGER_CONTEXT =
  /(crush|squeez|elephant|vice|sweat|clammy|radiat|spread(ing)?\s*to|left\s*arm|\bjaw\b|short(ness)?\s*of\s*breath|hard\s*to\s*breathe|nause|light\s*head|dizz|faint|pass(ing|ed)?\s*out)/i

/** Remove negated clauses ("no sweating", "not dizzy", "without chest pain",
 *  "denies nausea") so a patient DENYING a symptom can't trigger the danger
 *  net with the very words of their denial. Scope: from the negation word to
 *  the next punctuation break, max 40 chars. Does not touch contractions
 *  like "can't breathe" (no word boundary inside "can't"). */
export function stripNegatedClauses(text: string): string {
  return text.replace(/\b(no|not|without|denies?|denied|never)\b[^.,;!?]{0,40}/gi, ' ')
}

// ── Deterministic infant-fever detection ────────────────────────────────────
// AAP: fever ≥100.4°F (38°C) in an infant under 3 months always warrants
// emergency evaluation. The extractor LLM is supposed to emit the
// infant_under_3mo_fever red flag, but a missed extraction here is a
// missed sepsis workup — so we ALSO detect it from the raw text and OR the
// results (found by trial harness: 2mo + 100.8°F was routed to urgent care).

const INFANT_AGE = new RegExp(
  [
    /\b(newborn|neonate)\b/.source,
    // "2 month old", "2-month-old", "two months old" (≤3 months)
    /\b(one|two|three|1|2|3)[\s-]*(month|mo)s?[\s-]*old\b/.source,
    // "6 week old", "10-week-old" (≤13 weeks ≈ 3 months)
    /\b([1-9]|1[0-3])[\s-]*(week|wk)s?[\s-]*old\b/.source,
  ].join('|'), 'i',
)
const FEVER_MENTION = /\bfever|febrile|temp(erature)?\b|\b10[0-9](\.\d)?\s*(°|degrees|f\b)|burning up|feels? hot\b/i

export function detectInfantFever(text: string): boolean {
  return INFANT_AGE.test(text) && FEVER_MENTION.test(text)
}

/** Any fever mention — used for populations where ANY fever is significant
 *  (active chemotherapy: the 100.4°F neutropenic threshold, not the general
 *  "high fever ~103°F" bar the extractor is calibrated to). */
export function detectFeverMention(text: string): boolean {
  return FEVER_MENTION.test(text)
}

// ── Deterministic severe-dehydration detection ───────────────────────────────
// The extractor sometimes misses severe_dehydration when it gets confused by
// fallback rounds (found: gi-dehydration under-triaged 2/3 rounds despite
// "can't keep water down" + "dizzy when I stand up" in every transcript).
// Patterns: inability to keep fluids down is unambiguous; orthostatic dizziness
// paired with vomiting context confirms dehydration severity.

const CANT_KEEP_DOWN =
  /can'?t\s+keep\s+(any\s+)?(water|fluids?|liquids?|anything|food|it)\s+down|unable\s+to\s+keep\s+(anything|fluids?|water|it)\s+down|can'?t\s+hold\s+(anything|water|fluids?|it)\s+down|nothing\s+(will?\s+)?stays?\s+down/i

const ORTHOSTATIC =
  /dizz(y|iness|ied)\s+(when|every\s+time|if)\s+(i\s+)?(stand|get\s+up|sit\s+up)|dizz\w*\s+(on\s+)?(standing|getting\s+up)|lightheaded\s+(when|every\s+time)\s+(i\s+)?(stand|get\s+up)|orthostatic/i

const VOMIT_CONTEXT =
  /vomit(ing)?|throw(ing)?\s+up|puke|nausea/i

/** Detect language strongly indicative of significant dehydration.
 *  Used as a backstop: if the extractor misses `severe_dehydration` from
 *  natural text, this ensures the red flag is OR'd in deterministically. */
export function detectSevereDehydration(text: string): boolean {
  if (CANT_KEEP_DOWN.test(text)) return true
  if (ORTHOSTATIC.test(text) && VOMIT_CONTEXT.test(text)) return true
  return false
}

export function classifyEmergency(text: string): EmergencyClass {
  if (detectEmergency(text)) return 'immediate'
  const scrubbed = stripNegatedClauses(text)
  if (CHEST_SYMPTOM.test(scrubbed)) {
    return CHEST_DANGER_CONTEXT.test(scrubbed) ? 'immediate' : 'high_alert'
  }
  if (NEURO_HIGH_ALERT.test(scrubbed) || RESP_HIGH_ALERT.test(scrubbed)) return 'high_alert'
  return null
}
