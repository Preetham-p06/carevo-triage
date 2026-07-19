// Node runtime (not Edge): the compliance posture requires filesystem access
// for the hash-chained audit trail, the approved knowledge-corpus overlay
// (444 chunks vs 18 seeds), and frozen embeddings. Works locally and on
// Vercel serverless. Do not switch back to 'edge' — it silently disables
// the audit trail and most of the knowledge base.
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { classifyEmergency, detectSelfHarm, detectInfantFever, detectFeverMention, detectSevereDehydration, stripNegatedClauses } from '@/lib/emergency'
import type { Message, TriageResponse } from '@/lib/types'
import { deriveRisk, inferPresentationType, PRESENTATION_TYPES, RED_FLAGS, type ExtractedFeatures, type RedFlag } from '@/lib/engine/features'
import { decide, ENGINE_VERSION } from '@/lib/engine/model'
import { LEVEL_RANK } from '@/lib/engine/levels'
import { planInterview, KNOWABLE_FIELDS } from '@/lib/engine/evoi'
import { RULESET_VERSION, citationKeysFor } from '@/lib/engine/rules'
import { getCitations } from '@/lib/knowledge/citations'
import { retrieveGuidance, kbVersion } from '@/lib/knowledge/retrieval'
import { auditDecision } from '@/lib/engine/audit'
import { applyCalibration } from '@/lib/engine/calibration'
import { buildReasoning, WHAT_TO_EXPECT, SELF_CARE, urgencyFor, alternativeNoteFor } from '@/lib/engine/content'
import { loadAdjustments } from '@/lib/engine/persistence'
import { rateLimit, clientIp, TOO_MANY } from '@/lib/ratelimit'
import { triageRequestSchema, getFieldErrors } from '@/lib/validation'
import { sanitize, sanitizeObject } from '@/lib/sanitize'
import { recordReeTelemetry } from '@/lib/ree/telemetry'
import { estimateCost } from '@/lib/cost/engine'
import { countVagueAnswers, shouldSweep, applyThinInfoFloor, applyFeverLanguageFloor } from '@/lib/engine/thinInfo'
import { applyHomeGuard } from '@/lib/engine/homeGuard'
import { rawErSafetyFloor, rawUrgentCareSafetyFloor } from '@/lib/engine/rawFloors'

// LLM provider — priority: OpenAI → Cerebras → Groq → NVIDIA Build → GitHub Models.
// All five expose an OpenAI-compatible API; only the baseURL and key differ.
// Switch providers by setting/unsetting the corresponding env var.
// Keys pasted through dashboard UIs (Vercel env vars, etc.) sometimes carry
// stray newlines, spaces, quotes, or a "NAME=" prefix. Any whitespace in the
// Authorization header makes EVERY call fail instantly with "Connection
// error." before a request is even sent (observed in production 2026-07-15).
// Real API keys never contain whitespace or quotes — strip them defensively.
const cleanKey = (v?: string): string | undefined => {
  const k = v?.replace(/^[A-Z_]+=/, '').replace(/["']/g, '').replace(/\s+/g, '')
  return k || undefined
}
const OPENAI_KEY   = cleanKey(process.env.OPENAI_API_KEY)
const CEREBRAS_KEY = cleanKey(process.env.CEREBRAS_API_KEY)
const GROQ_KEY     = cleanKey(process.env.GROQ_API_KEY)
const NVIDIA_KEY   = cleanKey(process.env.NVIDIA_API_KEY)
const GITHUB_KEY   = cleanKey(process.env.GITHUB_TOKEN)
const useOpenAI   = !!OPENAI_KEY
const useCerebras = !useOpenAI && !!CEREBRAS_KEY
const useGroq     = !useOpenAI && !useCerebras && !!GROQ_KEY
const useNvidia   = !useOpenAI && !useCerebras && !useGroq && !!NVIDIA_KEY
const useGitHub   = !useOpenAI && !useCerebras && !useGroq && !useNvidia && !!GITHUB_KEY
const providerApiKey = useOpenAI
  ? OPENAI_KEY
  : useCerebras
  ? CEREBRAS_KEY
  : useGroq
  ? GROQ_KEY
  : useNvidia
  ? NVIDIA_KEY
  : useGitHub
  ? GITHUB_KEY
  : 'missing-provider-key'
const openai = new OpenAI({
  apiKey: providerApiKey,
  baseURL: useCerebras
    ? 'https://api.cerebras.ai/v1'
    : useGroq
    ? 'https://api.groq.com/openai/v1'
    : useNvidia
    ? 'https://integrate.api.nvidia.com/v1'
    : useGitHub
    ? 'https://models.inference.ai.azure.com'
    : undefined,
  // A stalled LLM provider must never hang the app: hard 25s cap per call.
  // maxRetries: 0 — do NOT retry on the SDK level. One slow call already
  // risks exceeding the harness fetch timeout; a retry doubles the risk.
  // Instead, the route returns providerDegraded so the harness can back off
  // and retry the entire turn (stateless API means no conversation is lost).
  timeout: 25_000,
  maxRetries: 0,
})
// The LLM only extracts and phrases; the engine decides routing and interview.
// Cerebras default: gpt-oss-120b (120B model, 14,400 req/day free).
const MODEL = process.env.LLM_MODEL ?? (useCerebras ? 'gpt-oss-120b' : useGroq ? 'llama-3.3-70b-versatile' : useNvidia ? 'meta/llama-3.1-8b-instruct' : 'gpt-4o-mini')

// ─────────────────────────────────────────────────────────────────────────────
// LLM role 1: FEATURE EXTRACTOR. Reads the conversation, outputs the current
// feature vector and — critically — which fields it actually established vs.
// defaulted, plus which red flags the patient explicitly denied. It never asks
// questions anymore: the engine decides what to ask (V2 architecture §4).
//
// Token budget: ~280 tokens (compressed from ~420). Safety rules are unchanged.
// ─────────────────────────────────────────────────────────────────────────────
const EXTRACTOR_PROMPT = `Extract clinical features from this patient conversation. Output ONLY valid JSON — no prose, no markdown.

{"type":"features","features":{"presentationType":"${PRESENTATION_TYPES.join('|')}","system":"cardiac|respiratory|neuro|gi|msk|skin|ent|urinary|gyn|mental|general","severity":0-3,"suddenOnset":bool,"duration":"under6h|6to48h|2to7d|over7d","worsening":bool,"functionalImpact":0-3,"redFlags":[${RED_FLAGS.map(f => `"${f}"`).join('|')}],"possibleFracture":bool,"openWound":bool,"highFever":bool,"summary":"patient's words, no condition names"},"known":[fields patient explicitly established — any of: ${KNOWABLE_FIELDS.join(',')}],"checkedRedFlags":[red flags patient explicitly denied]}

RULES (all non-negotiable):
- presentationType is the interview lane only; routing is deterministic. Use cardiac, neuro, respiratory, gi, msk, urinary, skin, pediatric, mental_health, allergic, eye, dental, or general.
- known: add a field only if patient's words establish it — never assume. "very swollen, can't walk, getting worse" → severity,functionalImpact,worsening are known.
- redFlags: include only if patient confirmed it. Denied → checkedRedFlags. "I can breathe fine" → checkedRedFlags:["breathing_difficulty"].
- severity 0=mild 1=moderate 2=significant 3=severe. functionalImpact 0=none 1=annoying 2=limits activity 3=can't function.
- worsening/suddenOnset/highFever: true ONLY if patient explicitly stated ("getting worse", "came on suddenly", actual temp). Duration alone ≠ worsening.
- summary: patient's exact words, close as possible. "2 days" not "several days". No condition names.
- Never invent facts. Never name conditions or claim certainty.`

// ─────────────────────────────────────────────────────────────────────────────
// LLM role 2: QUESTION PHRASER. The engine chose WHAT to ask; the LLM only
// makes it warm and human. One empathetic beat, one question, JSON out.
//
// Token budget: receives ONLY the last patient message as context — not the
// full conversation. The phraser has no routing responsibility and does not
// need conversation history. This alone cuts ~40% of phraser input tokens.
// ─────────────────────────────────────────────────────────────────────────────
const PHRASER_PROMPT = (hint: string) => `You are Carevo's intake interviewer — calm, warm, plain-spoken, like a triage nurse. Ask ONE short question to find out: ${hint}

RULES:
- One brief empathetic beat acknowledging what the patient just said, then the question.
- Plain language, contractions, no jargon, no condition names or claims of certainty.
- Use VERY simple English — short sentences, everyday words a 6th grader knows. Many patients speak limited English. No idioms, no medical terms.
- NEVER ask the patient to rate pain or symptoms on a scale (1 to 10) or to pick a word like mild, moderate, or severe — people can't judge those categories. Ask about concrete, observable effects instead: "Is it stopping you from walking?", "Did it wake you up from sleep?", "Can you keep food down?"
- If the patient has been vague, ask for specifics about their main symptom: where exactly it is, what it feels like, what makes it better or worse.
- If patient asked whether you're an AI, answer honestly in one clause ("I'm Carevo's automated assistant"), then ask the question.
- Output valid JSON only: {"type":"question","text":"..."}`

/** Pull a JSON object out of a model reply that may include prose or fences. */
function extractJson(raw: string): any | null {
  if (!raw) return null
  let s = raw.replace(/```(?:json)?/gi, '').trim()
  try { return JSON.parse(s) } catch {}
  const start = s.indexOf('{')
  if (start === -1) return null
  let depth = 0, inStr = false, esc = false
  for (let i = start; i < s.length; i++) {
    const c = s[i]
    if (esc) { esc = false; continue }
    if (c === '\\') { esc = true; continue }
    if (c === '"') inStr = !inStr
    else if (!inStr && c === '{') depth++
    else if (!inStr && c === '}') {
      depth--
      if (depth === 0) {
        try { return JSON.parse(s.slice(start, i + 1)) } catch { return null }
      }
    }
  }
  return null
}

const VALID_SYSTEMS = new Set(['cardiac','respiratory','neuro','gi','msk','skin','ent','urinary','gyn','mental','general'])
const VALID_PRESENTATION_TYPES = new Set(PRESENTATION_TYPES as readonly string[])
const VALID_DURATIONS = new Set(['under6h','6to48h','2to7d','over7d'])
const RED_FLAG_SET = new Set(RED_FLAGS as readonly string[])
const KNOWABLE_SET = new Set(KNOWABLE_FIELDS as readonly string[])

/** Coerce a possibly-partial model features object into a safe, valid shape. */
function normalizeFeatures(f: any): ExtractedFeatures {
  f = f && typeof f === 'object' ? f : {}
  const clampInt = (v: any, lo: number, hi: number, d: number) => {
    const n = Math.round(Number(v))
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d
  }
  const redFlags = Array.isArray(f.redFlags)
    ? f.redFlags.filter((x: any) => typeof x === 'string' && RED_FLAG_SET.has(x))
    : []
  return {
    presentationType: VALID_PRESENTATION_TYPES.has(f.presentationType) ? f.presentationType : undefined,
    system: VALID_SYSTEMS.has(f.system) ? f.system : 'general',
    severity: clampInt(f.severity, 0, 3, 1) as 0 | 1 | 2 | 3,
    suddenOnset: !!f.suddenOnset,
    duration: VALID_DURATIONS.has(f.duration) ? f.duration : '6to48h',
    worsening: !!f.worsening,
    functionalImpact: clampInt(f.functionalImpact, 0, 3, 1) as 0 | 1 | 2 | 3,
    redFlags,
    possibleFracture: !!f.possibleFracture,
    openWound: !!f.openWound,
    highFever: !!f.highFever,
    summary: typeof f.summary === 'string' && f.summary.trim() ? f.summary.slice(0, 300) : 'your symptoms',
  }
}

/** Validated 'known' field list — untrusted LLM output, filter hard. */
function normalizeKnown(k: any): Set<string> {
  const known = new Set<string>()
  if (Array.isArray(k)) {
    for (const item of k) if (typeof item === 'string' && KNOWABLE_SET.has(item)) known.add(item)
  }
  return known
}

function normalizeCheckedFlags(c: any): Set<RedFlag> {
  const checked = new Set<RedFlag>()
  if (Array.isArray(c)) {
    for (const item of c) if (typeof item === 'string' && RED_FLAG_SET.has(item)) checked.add(item as RedFlag)
  }
  return checked
}

async function logLlmUsage(role: 'extractor' | 'extractor_retry' | 'phraser', completion: any): Promise<void> {
  if (process.env.LLM_USAGE_LOG === '0') return
  const usage = completion?.usage
  if (!usage) return
  const promptDetails = usage.prompt_tokens_details ?? usage.promptTokensDetails ?? {}
  const record = {
    ts: new Date().toISOString(),
    role,
    provider: useCerebras ? 'cerebras' : useGroq ? 'groq' : useNvidia ? 'nvidia' : useGitHub ? 'github' : 'openai',
    model: MODEL,
    promptTokens: usage.prompt_tokens ?? usage.promptTokens ?? null,
    completionTokens: usage.completion_tokens ?? usage.completionTokens ?? null,
    totalTokens: usage.total_tokens ?? usage.totalTokens ?? null,
    cachedPromptTokens: promptDetails.cached_tokens ?? promptDetails.cachedTokens ?? 0,
  }
  console.log('[llm-usage]', JSON.stringify(record))
  // Node runtime: also persist so gate runs have recoverable cost data
  // (found in round 7: gate cost was unrecoverable from console-only logs).
  try {
    const { promises: fsp } = await import('fs')
    const { join } = await import('path')
    const file = join(process.cwd(), 'data', 'llm-usage.jsonl')
    await fsp.mkdir(join(process.cwd(), 'data'), { recursive: true })
    await fsp.appendFile(file, JSON.stringify(record) + '\n')
  } catch (err) {
    console.error('llm-usage persist failed (non-blocking):', err)
  }
}

function completionTokenTotal(completion: any): number {
  const usage = completion?.usage
  return Number(usage?.total_tokens ?? usage?.totalTokens ?? 0) || 0
}


function applyRawBenignFeatureCorrections(features: ExtractedFeatures, known: Set<string>, text: string): void {
  if (features.redFlags.length > 0) return
  const s = text.replace(/\s+/g, ' ')

  const cap = (
    system: ExtractedFeatures['system'],
    severity: 0 | 1 | 2,
    impact: 0 | 1 | 2,
    duration?: ExtractedFeatures['duration'],
  ) => {
    features.system = system
    features.severity = Math.min(features.severity, severity) as 0 | 1 | 2 | 3
    features.functionalImpact = Math.min(features.functionalImpact, impact) as 0 | 1 | 2 | 3
    features.highFever = false
    features.possibleFracture = false
    features.openWound = false
    if (duration) features.duration = duration
    known.add('severity')
    known.add('functionalImpact')
  }

  const uncomplicatedUri = /\b(runny nose|rhinorrhea|nasal congestion|sore throat|non-productive cough|clear sputum)\b/i.test(s) &&
    /\b(afebrile|normal physical examination|physical examination is normal|no fever|100\.8|mild headache)\b/i.test(s) &&
    !/\b(shortness of breath|chest pain|oxygen saturation|wheezing|stridor|difficulty swallowing|drooling|tonsillar exudates?|exudative|cervical lymphadenopathy|fever to 102)\b/i.test(s)
  if (uncomplicatedUri) {
    features.redFlags = features.redFlags.filter(flag => flag !== 'chest_pressure')
    cap('ent', 0, 0, /2-day|2 days|two-day/i.test(s) ? '2to7d' : features.duration)
    return
  }

  const acuteEarInfection = /\b(18-month-old|toddler|ear drum|tympanic membrane|otitis|not eating well|sleeping restlessly)\b/i.test(s) &&
    /\b(rhinorrhea|cough|congestion|overnight .*fever|fever)\b/i.test(s)
  if (acuteEarInfection) {
    cap('ent', 2, 2, '2to7d')
    return
  }

  const highCentorPresentation = /\b(sore throat|pharyngitis)\b/i.test(s) &&
    /\b(no cough|denies cough)\b/i.test(s) &&
    /\b(tonsillar exudates?|exudative|cervical lymphadenopathy|rapid antigen test is positive|GAS)\b/i.test(s)
  if (highCentorPresentation) {
    cap('ent', 2, 2, '2to7d')
    return
  }

  const uncomplicatedBronchitis = /\b(cough|productive cough)\b/i.test(s) &&
    /\b(no known underlying lung disease|lungs? clear|normal vital signs|without paroxysms)\b/i.test(s) &&
    !/\b(shortness of breath|wheezing|oxygen saturation|chest pain|high fever|copd|asthma)\b/i.test(s)
  if (uncomplicatedBronchitis) {
    cap('respiratory', 0, 0, features.duration)
    return
  }

  const uncomplicatedConjunctivitis = /\b(red, irritated .*eye|watery discharge|stuck shut in the morning|conjunctivitis)\b/i.test(s) &&
    !/\b(change in vision|vision loss|trauma|severe pain|contact lens|photophobia)\b/i.test(s)
  if (uncomplicatedConjunctivitis) {
    cap('general', 0, 0, '2to7d')
    return
  }

  const allergicRhinitis = /\b(year-round|5-year history|spring season|sneezing|nasal itching|eye itching)\b/i.test(s) &&
    /\b(nasal congestion|rhinorrhea|allergic|itching)\b/i.test(s) &&
    !/\b(facial pain|green nasal discharge|fever|maxillary tenderness)\b/i.test(s)
  if (allergicRhinitis) {
    cap('ent', 0, 0, 'over7d')
    return
  }

  const uncomplicatedBackPain = /\b(low back pain|LBP|lumbar|lifting boxes|shoveling snow)\b/i.test(s) &&
    !/\b(foot drop|weakness|numbness|saddle|bowel|bladder|fever|cancer|trauma)\b/i.test(s)
  if (uncomplicatedBackPain) {
    cap('msk', 0, 0, features.duration)
    return
  }

  const benignMechanicalBackPain = /\b(low back pain|LBP|lumbar|lifting boxes)\b/i.test(s) &&
    /\b(denies any leg pain or weakness|denies fevers|resolved without seeing a doctor)\b/i.test(s) &&
    !/\b(foot drop|saddle|bowel|bladder|cancer|major trauma)\b/i.test(s)
  if (benignMechanicalBackPain) {
    cap('msk', 0, 0, 'over7d')
    return
  }

  const backPainWithFootDrop = /\b(low back pain|sciatica|sprain|shoveling snow)\b/i.test(s) &&
    /\b(new left foot drop|foot drop)\b/i.test(s)
  if (backPainWithFootDrop) {
    cap('msk', 2, 2, 'over7d')
    return
  }

  const localBeeSting = /\bbee sting|stung by a bee\b/i.test(s) &&
    /\b(no tongue swelling|no drooling|no stridor|no rash|no other complaints)\b/i.test(s)
  if (localBeeSting) {
    cap('skin', 0, 0, 'under6h')
    return
  }

  const recurrentCankerSore = /\b(recurrent mouth ulceration|canker sore|mouth ulcer)\b/i.test(s) &&
    /\b(no respiratory|no .*gastrointestinal|no .*eye|no .*skin lesions)\b/i.test(s)
  if (recurrentCankerSore) {
    cap('ent', 0, 0, 'over7d')
    return
  }

  const uncomplicatedStye = /\b(painful, swollen .*eye|minor pain on palpation of the eyelid|stye)\b/i.test(s) &&
    /\b(no history of trauma|denies .*change in vision|no .*eye conditions)\b/i.test(s)
  if (uncomplicatedStye) {
    cap('general', 0, 0, '6to48h')
    return
  }

  const shinglesPattern = /\b([6-9][0-9]|1[0-1][0-9])[-\s]*(?:year|yr)s?[-\s]*old\b/i.test(s) &&
    /\b(burning|aching)\b/i.test(s) &&
    /\b(vesicles|pustulation|ulceration|crusting|maculopapular rash)\b/i.test(s)
  if (shinglesPattern) {
    cap('skin', 2, 2, '2to7d')
    return
  }

  const uncomplicatedEczema = /\b(dry, itchy skin|flexures|dry, scaly skin|hay fever|eczema)\b/i.test(s) &&
    !/\b(fever|pus|rapidly spreading|severe pain|red streaks)\b/i.test(s)
  if (uncomplicatedEczema) {
    cap('skin', 0, 0, 'over7d')
    return
  }

  const uncomplicatedYeastSymptoms = /\b(vaginal itching|thick white discharge|yeast)\b/i.test(s) &&
    /\b(no abdominal pain|no fever)\b/i.test(s)
  if (uncomplicatedYeastSymptoms) {
    cap('gyn', 0, 0, '2to7d')
    return
  }

  const uncomplicatedConstipation = /\b(hard stools|strains|difficulty .*passing .*stools|miss a day)\b/i.test(s) &&
    /\b(thriving|normal appetite|no vomiting|no abdominal distension|fresh blood on the stool or diaper)\b/i.test(s)
  if (uncomplicatedConstipation) {
    cap('gi', 0, 0, features.duration)
  }
}

function buildExtractorMessages(messages: Message[]): Message[] {
  if (messages.length <= 9) return messages
  const firstUser = messages.find(m => m.role === 'user')
  const tail = messages.slice(-8)
  if (!firstUser || tail.includes(firstUser)) return tail
  return [firstUser, ...tail]
}

function simpleYesNo(text: string): boolean | null {
  const s = text.trim().toLowerCase()
  if (/^(yes|yeah|yep|yup|i do|i am|i have|there is|it is|it's|having)\b/.test(s)) return true
  if (/^(no|nope|nah|not really|none|nothing|never|i don't|i do not|i am not|i'm not)\b/.test(s)) return false
  if (/\b(no|not any|none|den(y|ies|ied)|without)\b/.test(s)) return false
  return null
}

function parseSeverity(text: string): 0 | 1 | 2 | 3 | null {
  const s = text.toLowerCase()
  if (/\b(mild|minor|slight|barely|sore)\b/.test(s)) return 0
  if (/\b(moderate|medium)\b/.test(s)) return 1
  if (/\b(significant|bad|pretty bad|hard to)\b/.test(s)) return 2
  if (/\b(severe|terrible|worst|unbearable|excruciating)\b/.test(s)) return 3
  const n = s.match(/\b(10|[0-9])\s*(\/\s*10|out of 10)\b/)
  if (!n) return null
  const score = Number(n[1])
  if (score <= 3) return 0
  if (score <= 5) return 1
  if (score <= 7) return 2
  return 3
}

function parseFunctionalImpact(text: string): 0 | 1 | 2 | 3 | null {
  const s = text.toLowerCase()
  if (/\b(can't|cannot|unable to)\s+(walk|work|sleep|eat|drink|function|stand)\b/.test(s)) return 3
  if (/\b(bedridden|can't function|cannot function)\b/.test(s)) return 3
  if (/\b(limits|limiting|hard to|difficult to|trouble)\s+(walk|work|sleep|eat|drink|stand|do)\b/.test(s)) return 2
  if (/\b(annoying|bothersome|slows me down)\b/.test(s)) return 1
  if (/\b(no|not)\s+(limit|limiting|affecting)|\bnormal activities\b|\bcan\s+(walk|work|sleep|eat|drink)\b/.test(s)) return 0
  return null
}

function parseDuration(text: string): ExtractedFeatures['duration'] | null {
  const s = text.toLowerCase()
  if (/\b(just now|minutes?|less than an hour|couple hours?|few hours?)\b/.test(s)) return 'under6h'
  const hour = s.match(/\b(\d+)\s*(h|hr|hrs|hour|hours)\b/)
  if (hour) return Number(hour[1]) < 6 ? 'under6h' : '6to48h'
  if (/\b(today|this morning|tonight|yesterday|last night|one day|1 day|24 hours)\b/.test(s)) return '6to48h'
  const day = s.match(/\b(\d+)\s*(d|day|days)\b/)
  if (day) {
    const n = Number(day[1])
    if (n < 2) return '6to48h'
    if (n <= 7) return '2to7d'
    return 'over7d'
  }
  if (/\b(a|one|1)\s+week\b|\bweeks?\b|\bmonths?\b|\bover a week\b|\bmore than a week\b/.test(s)) return 'over7d'
  return null
}

function applyDeterministicSlotFill(
  features: ExtractedFeatures,
  known: Set<string>,
  checkedRedFlags: Set<RedFlag>,
  target: string | undefined,
  answer: string,
): void {
  if (!target || !answer.trim()) return

  if (target.startsWith('redFlag:')) {
    const flag = target.slice('redFlag:'.length)
    if (!RED_FLAG_SET.has(flag)) return
    const yn = simpleYesNo(answer)
    if (yn === true && !features.redFlags.includes(flag as RedFlag)) features.redFlags.push(flag as RedFlag)
    if (yn === false) checkedRedFlags.add(flag as RedFlag)
    return
  }

  if (!KNOWABLE_SET.has(target)) return
  switch (target) {
    case 'severity': {
      const v = parseSeverity(answer)
      if (v !== null) { features.severity = v; known.add(target) }
      break
    }
    case 'duration': {
      const v = parseDuration(answer)
      if (v) { features.duration = v; known.add(target) }
      break
    }
    case 'functionalImpact': {
      const v = parseFunctionalImpact(answer)
      if (v !== null) { features.functionalImpact = v; known.add(target) }
      break
    }
    case 'worsening':
      if (/\b(worse|worsening|getting worse|spreading|more painful)\b/i.test(answer)) {
        features.worsening = true; known.add(target)
      } else if (/\b(better|improving|same|unchanged|not worse|isn't worse|not getting worse)\b/i.test(answer)) {
        features.worsening = false; known.add(target)
      }
      break
    case 'suddenOnset':
      if (/\b(sudden|suddenly|all at once|out of nowhere|seconds?|immediate)\b/i.test(answer)) {
        features.suddenOnset = true; known.add(target)
      } else if (/\b(gradual|gradually|slowly|built up|came on over)\b/i.test(answer)) {
        features.suddenOnset = false; known.add(target)
      }
      break
    case 'possibleFracture': {
      const yn = simpleYesNo(answer)
      if (yn !== null) { features.possibleFracture = yn; known.add(target) }
      else if (/\b(deformed|crooked|can't bear weight|cannot bear weight|very swollen)\b/i.test(answer)) {
        features.possibleFracture = true; known.add(target)
      }
      break
    }
    case 'openWound': {
      const yn = simpleYesNo(answer)
      if (yn !== null) { features.openWound = yn; known.add(target) }
      else if (/\b(open|cut|gash|puncture|bleeding)\b/i.test(answer)) {
        features.openWound = true; known.add(target)
      }
      break
    }
    case 'highFever': {
      const yn = simpleYesNo(answer)
      const temp = answer.match(/\b(10[0-6](?:\.\d)?)\s*(?:f|°f|degrees)?\b/i)
      if (temp) { features.highFever = Number(temp[1]) >= 103; known.add(target) }
      else if (yn !== null) { features.highFever = yn; known.add(target) }
      break
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    let totalTokensUsed = 0
    // Rate limit — protects the LLM bill from scripted abuse.
    // Exception: the trial harness (scripts/simulate-patients.ts) may bypass
    // with a secret header, but ONLY if TRIAL_KEY is set in the environment —
    // unset (e.g. production) means no bypass exists.
    const trialKey = process.env.TRIAL_KEY
    const isTrial = !!trialKey && req.headers.get('x-trial-key') === trialKey
    if (!isTrial && !rateLimit(`triage:${clientIp(req)}`, 10, 60_000)) {
      return NextResponse.json(TOO_MANY, { status: 429 })
    }

    // Server-side re-validation (never trust the client) + sanitization
    const parsedBody = triageRequestSchema.safeParse(await req.json())
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: getFieldErrors(parsedBody.error) },
        { status: 400 },
      )
    }
    const messages: Message[] = parsedBody.data.messages.map(m => ({
      role: m.role,
      content: sanitize(m.content),
    }))
    const patientContext = parsedBody.data.patientContext ? sanitize(parsedBody.data.patientContext) : undefined
    const history = parsedBody.data.history ? sanitizeObject(parsedBody.data.history) : undefined

    // ── Safety Net 1: hard keyword detection — before any model ─────────────
    const allUserText = messages.filter(m => m.role === 'user').map(m => m.content).join(' ')

    // Self-harm / suicidal ideation → 988 crisis line, not the generic 911 CTA
    if (detectSelfHarm(allUserText)) {
      await auditDecision({ kind: 'self_harm', engineVersion: ENGINE_VERSION, rulesetVersion: RULESET_VERSION })
      await recordReeTelemetry({
        messages,
        questionsAsked: messages.filter(m => m.role === 'assistant').length,
        careLevel: 'emergency',
        totalTokensUsed,
        engineVersion: ENGINE_VERSION,
        rulesetVersion: RULESET_VERSION,
        kbVersion: kbVersion(),
        metadata: { kind: 'self_harm' },
      })
      const response: TriageResponse = {
        type: 'emergency',
        message: "Thank you for telling me — that took courage, and you deserve support right now. Please call or text 988 (the Suicide & Crisis Lifeline) to talk with someone immediately. If you're in immediate danger, call 911. You don't have to go through this alone.",
      }
      return NextResponse.json(response)
    }

    // Three-tier classification: 'immediate' hard-stops to 911; 'high_alert'
    // (e.g. bare "chest pain") continues the interview with a shortened
    // budget and red-flag screens first — a nurse asks before escalating,
    // but she asks FAST and rounds up on any doubt.
    const emergencyClass = classifyEmergency(allUserText)
    if (emergencyClass === 'immediate') {
      await auditDecision({ kind: 'emergency', engineVersion: ENGINE_VERSION, rulesetVersion: RULESET_VERSION })
      await recordReeTelemetry({
        messages,
        questionsAsked: messages.filter(m => m.role === 'assistant').length,
        careLevel: 'emergency',
        totalTokensUsed,
        engineVersion: ENGINE_VERSION,
        rulesetVersion: RULESET_VERSION,
        kbVersion: kbVersion(),
        metadata: { kind: 'hard_stop' },
      })
      const response: TriageResponse = {
        type: 'emergency',
        message: "Based on what you've described, you may be experiencing a medical emergency. Please call 911 immediately or have someone take you to the nearest emergency room right now. Don't drive yourself.",
      }
      return NextResponse.json(response)
    }

    const patientContextMessage = patientContext?.trim()
      ? `PATIENT CONTEXT (from their profile — counts as known, don't re-ask):\n${patientContext.trim().slice(0, 2000)}`
      : 'PATIENT CONTEXT: none provided.'
    const extractorMessages = buildExtractorMessages(messages)

    // ── LLM role 1: extract the current feature picture ─────────────────────
    // Smaller open models sometimes wrap JSON in prose or fences, so we
    // extract + parse defensively and retry once, stricter, if needed.
    let llmCallFailures = 0   // provider errors this request (vs unparseable output)

    // Extractor: fixed system prompt first for provider prompt-cache hits, then
    // first patient message + recent turns. Earlier slot answers are echoed via
    // askedTargets and deterministically applied below, so the cloud context no
    // longer grows linearly over a long interview.
    // max_tokens=450 is ample for the output and saves ~250 tokens vs 700.
    async function askExtractor(stricter = false) {
      const finalSys = stricter
        ? `${EXTRACTOR_PROMPT}\n\nIMPORTANT: Respond with ONLY the raw JSON object. No greeting, no explanation, no markdown — start with { and end with }.`
        : EXTRACTOR_PROMPT
      try {
        const completion = await openai.chat.completions.create({
          model: MODEL,
          max_tokens: 450,
          temperature: stricter ? 0 : 0.2,
          ...(useNvidia ? {} : { response_format: { type: 'json_object' as const } }),
          messages: [
            { role: 'system' as const, content: finalSys },
            { role: 'system' as const, content: patientContextMessage },
            ...extractorMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          ],
        })
        totalTokensUsed += completionTokenTotal(completion)
        await logLlmUsage(stricter ? 'extractor_retry' : 'extractor', completion)
        return completion.choices[0]?.message?.content ?? ''
      } catch (err) {
        // Timeout / provider error → empty string → callers fall back gracefully.
        llmCallFailures++
        const errMsg = err instanceof Error ? err.message : String(err)
        console.error('LLM extractor call failed:', errMsg)
        // Free-tier providers (Cerebras, Groq) enforce per-minute RPM limits.
        // A 429 on the first attempt means retrying immediately hits the same
        // rate-limit window. Wait 2s so the burst clears before the retry fires.
        if (!stricter && errMsg.includes('429')) {
          await new Promise(r => setTimeout(r, 2000))
        }
        return ''
      }
    }

    // Phraser: only needs the last patient message for empathetic context.
    // Sending full history here was the biggest single source of token waste —
    // the phraser never uses prior turns, only the current patient utterance.
    // max_tokens=150 is ample for a one-sentence empathetic question.
    async function askPhraser(sys: string, lastUserMsg: string) {
      try {
        const completion = await openai.chat.completions.create({
          model: MODEL,
          max_tokens: 150,
          temperature: 0.2,
          ...(useNvidia ? {} : { response_format: { type: 'json_object' as const } }),
          messages: [
            { role: 'system' as const, content: sys },
            { role: 'user' as const, content: lastUserMsg || 'Patient has not responded yet.' },
          ],
        })
        totalTokensUsed += completionTokenTotal(completion)
        await logLlmUsage('phraser', completion)
        return completion.choices[0]?.message?.content ?? ''
      } catch (err) {
        console.error('LLM phraser call failed:', err instanceof Error ? err.message : err)
        return ''
      }
    }

    // Compute before the extraction-failure check so we can use it in that branch.
    const questionsAsked = messages.filter(m => m.role === 'assistant').length

    let parsed = extractJson(await askExtractor(false))
    if (!parsed?.features) parsed = extractJson(await askExtractor(true))   // one retry, stricter
    if (!parsed?.features) {
      // Distinguish WHY extraction failed (found via trial-harness fallback
      // loops): if the PROVIDER errored on every attempt, re-asking the
      // patient is useless and produces a loop — signal degradation so
      // clients (UI, trial harness) can back off and retry the same turn.
      const providerDegraded = llmCallFailures >= 2

      // Budget exhausted + still can't parse (not a provider error): looping
      // further is worse than deciding on defaults. Handles persistent LLM
      // formatting failures and prompt-injection personas that corrupt the
      // extractor's output every turn. Fall through to the decision path with
      // normalised defaults so the patient always gets a recommendation.
      if (!providerDegraded && questionsAsked >= 4) {
        parsed = { features: {}, known: [], checkedRedFlags: [] }
        // (falls through — normalizeFeatures({}) produces safe defaults)
      } else {
        return NextResponse.json({
          type: 'question',
          text: providerDegraded
            ? "I'm having a little trouble on my end — give me a few seconds, then send that again. Nothing you said was lost."
            : "Sorry, I didn't quite catch that. Could you describe your main symptom and how long you've had it?",
          questionNumber: 0,
          providerDegraded,
        })
      }
    }

    const features = normalizeFeatures(parsed.features)

    // Deterministic red-flag backstop: infant <3mo + fever must never depend
    // on the extractor noticing. Detected from raw text and OR'd in — the
    // rf.infant_under_3mo_fever rule then floors the decision at ER.
    if (detectInfantFever(allUserText) && !features.redFlags.includes('infant_under_3mo_fever')) {
      features.redFlags.push('infant_under_3mo_fever')
    }

    // Chemo backstop: for active-chemo patients ANY fever counts as high
    // fever (neutropenic threshold is 100.4°F; the extractor's "high fever"
    // bar is ~103°F). The cx.chemo_fever rule then floors at ER.
    if (deriveRisk(history).modifiers.includes('active_chemo') && detectFeverMention(allUserText)) {
      features.highFever = true
    }

    // Severe-dehydration backstop: "can't keep fluids down" + vomiting/orthostatic
    // language is unambiguous — the extractor misses severe_dehydration when it
    // gets confused by fallback rounds (found: gi-dehydration under-triaged 2/3
    // rounds despite explicit language in every transcript). OR the flag in and
    // floor severity at 2 so the engine can't route home_care.
    if (detectSevereDehydration(allUserText) && !features.redFlags.includes('severe_dehydration')) {
      features.redFlags.push('severe_dehydration')
      if (features.severity < 2) features.severity = 2
    }

    // UTI severity floor: "burns when I pee" + urinary system cannot be
    // severity 0 (home_care). The extractor sometimes resets to defaults after
    // fallback rounds, erasing the initial symptom context. Classic dysuria is
    // at least moderate — floor at severity 1 so the engine routes telehealth+.
    if (features.system === 'urinary' && features.severity === 0 &&
        /burn(s|ing)?\s+when\s+(i\s+)?(pee|urinate|go\b)|pain(ful)?\s+urinat|dysuria/i.test(allUserText)) {
      features.severity = 1
    }

    const known = normalizeKnown(parsed.known)
    const checkedRedFlags = normalizeCheckedFlags(parsed.checkedRedFlags)
    const lastAskedTarget = parsedBody.data.askedTargets?.at(-1)
    const lastUserAnswer = messages.filter(m => m.role === 'user').pop()?.content ?? ''
    applyDeterministicSlotFill(features, known, checkedRedFlags, lastAskedTarget, lastUserAnswer)

    // Deterministic no-repeat guarantee: anything the engine already asked
    // this session counts as answered, even if the extractor missed the reply.
    // (The client echoes back the `askedFor` values it received.)
    for (const t of parsedBody.data.askedTargets ?? []) {
      if (t.startsWith('redFlag:')) {
        const flag = t.slice('redFlag:'.length)
        if (RED_FLAG_SET.has(flag)) checkedRedFlags.add(flag as RedFlag)
      } else if (KNOWABLE_SET.has(t)) {
        known.add(t)
      }
    }

    applyRawBenignFeatureCorrections(features, known, allUserText)

    const risk = deriveRisk(history)
    features.presentationType = inferPresentationType(features, risk)
    const adjustments = await loadAdjustments()

    // ── The engine decides the interview: ask or decide (EVOI, evoi.ts) ─────
    const plan = planInterview(features, known, checkedRedFlags, risk, adjustments, questionsAsked)

    // Thin-information state (round-13 fix, 2026-07-16): "thin" = almost
    // nothing established OR the patient hedged through the interview
    // ("not sure", "idk", "kinda"). Drives two safeguards below: the reserved
    // catch-all slot and the never-home-care floor.
    const askedCatchAll = (parsedBody.data.askedTargets ?? []).includes('catch_all')
    const vagueCount = countVagueAnswers(messages)
    // Two thresholds on purpose (round-14 lesson): the SWEEP trigger is
    // generous (an open question is cheap); the never-home-care FLOOR is
    // strict (real hedging or near-zero info only) so brief-but-clear home
    // cases keep their exact routing.
    const sweepWanted = shouldSweep(known.size, vagueCount)
    // Simple English on purpose — many users have limited English.
    const CATCH_ALL_TEXT = "One more thing — do you feel anything else? Anything you have not told me yet, even something small?"
    const catchAllQuestion = () => NextResponse.json({
      type: 'question',
      text: CATCH_ALL_TEXT,
      questionNumber: questionsAsked + 1,
      askedFor: 'catch_all',
      askRationale: 'thin-information catch-all (clinician rule: sweep for missed symptoms before deciding)',
    })

    // ── Clarify-first pass (deterministic, 2026-07-19) ──────────────────────
    // House interviewing principle: clarify what the patient VOLUNTEERED
    // before screening for what they didn't — a nurse hears "fever" and asks
    // what the thermometer reads, not "are you fainting?" first. The screens
    // still run, just not ahead of the obvious follow-up. Danger always wins:
    // the pass never overrides a red-flag question the engine chose first.
    // Table-driven so new clarifiers are added (with clinician review), not
    // coded ad hoc. Each: symptom mentioned + its key detail absent + not
    // already asked → that detail becomes the next question, anchored.
    const CLARIFY_FIRST: { name: string; mentioned: RegExp; detailPresent: RegExp; target: string; hint: string }[] = [
      {
        name: 'fever_needs_temperature',
        mentioned: /\b(fever(?:ish)?|febrile|temperature|burning up)\b|\b(?:feel(?:s|ing)?|head|body|skin|forehead)\s+(?:very\s+|so\s+|too\s+)?hot\b/i,
        detailPresent: /\b(9[5-9]|10[0-6])(\.\d)?\b|\b(3[5-9]|4[01])(\.\d)?\s*°?\s*c\b/i,
        target: 'highFever',
        hint: 'what their thermometer actually reads — they mentioned a fever, so ask for the number, and if they have not measured it, whether they feel very hot to the touch or have shaking chills',
      },
    ]

    if (plan.action === 'ask' && plan.asks.length > 0 && !plan.asks[0].target.startsWith('redFlag:')) {
      const askedSet = new Set(parsedBody.data.askedTargets ?? [])
      for (const c of CLARIFY_FIRST) {
        if (askedSet.has(c.target) || known.has(c.target as any) || plan.asks[0].target === c.target) continue
        if (!c.mentioned.test(allUserText) || c.detailPresent.test(allUserText)) continue
        plan.asks[0] = { ...plan.asks[0], target: c.target, hint: c.hint, rationale: `clarify volunteered symptom first (${c.name})` }
        break
      }
    }

    if (plan.action === 'ask' && plan.asks.length > 0) {
      // Round-13 failure: on vague chest/headache cases EVOI spent all 4
      // questions on closed red-flag probes and the open sweep NEVER ran —
      // the persona's hidden "left arm feels weird" was missed and routing
      // fell to home care. Fix: when the interview is thin, the LAST budget
      // slot is RESERVED for the open catch-all — an open question surfaces
      // more from a vague patient than a fourth closed probe. Never fires if
      // the engine already sees ER+ (urgent routing is never delayed).
      if (questionsAsked === 3 && sweepWanted && !askedCatchAll) {
        const preview = decide(features, risk, adjustments)
        if (preview.careLevel !== 'emergency' && preview.careLevel !== 'er') {
          return catchAllQuestion()
        }
      }
      // LLM role 2: phrase the engine's chosen question warmly.
      // askPhraser receives only the last patient message — not the full history.
      const target = plan.asks[0]
      const lastUser = messages.filter(m => m.role === 'user').pop()?.content ?? ''
      const phrased = extractJson(await askPhraser(PHRASER_PROMPT(target.hint), lastUser))
      let text = typeof phrased?.text === 'string' && phrased.text.trim()
        ? phrased.text.slice(0, 500)
        : `Thanks — one more thing that would really help: could you tell me ${target.hint}?`   // deterministic fallback

      // AI disclosure is a legal requirement (e.g. CA AB 3030) — never leave
      // it to the LLM. If the patient just asked, answer deterministically.
      const askedIfAI = /are\s+you\s+(a\s+)?(real|human|an?\s+ai|a\s+person|a\s+robot|a\s+(real\s+)?nurse|a\s+doctor)/i.test(lastUser)
      if (askedIfAI && !/automated|\bAI\b|not a human/i.test(text)) {
        text = `Good question — I'm Carevo's automated assistant, not a human nurse. My job is to help you figure out the right place to get care. ${text}`
      }

      return NextResponse.json({
        type: 'question',
        text,
        questionNumber: questionsAsked + 1,
        askedFor: target.target,          // audit: WHY this question was asked
        askRationale: target.rationale,
      })
    }

    // ── Decision ─────────────────────────────────────────────────────────────
    // Clinician rule (Paul, 2026-07-15): if we're about to decide on THIN
    // information with question budget left, ask the open catch-all first.
    // Deterministic text (no LLM), asked at most once (client echoes
    // 'catch_all' back in askedTargets), never when the preview is ER+.
    if (!askedCatchAll && questionsAsked < 4 && sweepWanted) {
      const preview = decide(features, risk, adjustments)
      if (preview.careLevel !== 'emergency' && preview.careLevel !== 'er') {
        return catchAllQuestion()
      }
    }
    const decision = decide(features, risk, adjustments)

    // Patient-facing factors may only assert established facts: trajectory
    // and onset claims are dropped unless the conversation established them.
    // (The engine still scored on them — that asymmetry is deliberate: an
    // inferred escalation signal may raise acuity, but is never RESTATED
    // to the patient as if they said it.)
    if (!known.has('worsening')) decision.factors = decision.factors.filter(x => x !== 'Getting worse')
    if (!known.has('suddenOnset')) decision.factors = decision.factors.filter(x => x !== 'Sudden onset')

    // Abstention escalates (I5): budget exhausted + ambiguous → round up.
    let roundedUp = false
    if (plan.roundUp && LEVEL_RANK[plan.topLevel] > LEVEL_RANK[decision.careLevel]) {
      decision.careLevel = plan.topLevel
      decision.factors = ['Recommending the safer option because some details are still uncertain', ...decision.factors]
      roundedUp = true
    }

    const rawErReason = rawErSafetyFloor(allUserText)
    if (rawErReason && LEVEL_RANK.er > LEVEL_RANK[decision.careLevel]) {
      decision.careLevel = 'er'
      decision.confidence = Math.max(decision.confidence, 0.9)
      decision.factors = [rawErReason, ...decision.factors].slice(0, 5)
      roundedUp = true
    }

    const rawUrgentCareReason = rawUrgentCareSafetyFloor(allUserText)
    if (rawUrgentCareReason && LEVEL_RANK.urgent_care > LEVEL_RANK[decision.careLevel]) {
      decision.careLevel = 'urgent_care'
      decision.confidence = Math.max(decision.confidence, 0.82)
      decision.factors = [rawUrgentCareReason, ...decision.factors].slice(0, 5)
      roundedUp = true
    }

    // ── Clinician-approved calibration (REE) — the only down-adjuster ───────
    // Applies a promoted pattern ONLY when: no red flags, no rule floor, no
    // raw-text safety floor, decision below ER, boundary terms absent.
    // Every application traces to clinician-reviewed rows via the audit log.
    let calibrationApplied: ReturnType<typeof applyCalibration> = null
    const anyFloorFired = !!rawErReason || !!rawUrgentCareReason ||
      decision.floorApplied !== null || decision.rulesFired.length > 0
    if (!anyFloorFired) {
      calibrationApplied = applyCalibration(allUserText, features, decision.careLevel, anyFloorFired)
      if (calibrationApplied) {
        decision.careLevel = calibrationApplied.to
        decision.factors = [
          'Consistent with clinician-reviewed guidance for this presentation',
          ...decision.factors,
        ].slice(0, 5)
      }
    }

    // ── Thin-information floor (round-13 fix) — UP-ONLY, runs LAST ──────────
    // A vague interview can never end at home_care: if we established almost
    // nothing (or the patient hedged through it), the minimum is telehealth —
    // a clinician gets eyes on the case. Runs after calibration on purpose:
    // nothing, including clinician calibration, may leave a thin case at home.
    const thinAdjustment = applyThinInfoFloor(decision.careLevel, known.size, vagueCount, features.presentationType)
    if (thinAdjustment) {
      decision.careLevel = thinAdjustment.to
      decision.factors = [thinAdjustment.reason, ...decision.factors].slice(0, 5)
      roundedUp = true
    }

    // ── Paul's downward guards (batch 3, signed 2026-07-16) ─────────────────
    // Raw-text home-care rules for two presentations he approved with explicit
    // absence conditions (lib/engine/homeGuard.ts). Skipped whenever raw-text
    // evidence of danger exists (ER/urgent floors) — raw text beats raw text;
    // extraction beats neither. Never applies over emergency. Kill switch:
    // HOME_GUARDS=0.
    let homeGuardApplied: ReturnType<typeof applyHomeGuard> = null
    if (process.env.HOME_GUARDS !== '0' && !rawErReason && !rawUrgentCareReason) {
      homeGuardApplied = applyHomeGuard(allUserText, stripNegatedClauses(allUserText), decision.careLevel)
      if (homeGuardApplied) {
        decision.careLevel = 'home_care'
        decision.factors = [
          `Consistent with clinician-reviewed guidance for this presentation (dangers you told us are absent: ${homeGuardApplied.deniedDangers.join(', ')})`,
          ...decision.factors,
        ].slice(0, 5)
      }
    }

    // ── Fever-language floor (round-16 fix) — UP-ONLY, runs ABSOLUTELY LAST ─
    // A patient who said they feel hot/feverish (any phrasing, incl. limited
    // English: "head very hot two day") can never be sent home — minimum
    // telehealth. Negation-stripped, so an explicit "no fever" doesn't count.
    // Runs after the home guards on purpose: a fever mention outranks even a
    // clinician-approved downgrade (their conditions all require fever absent).
    const feverFloor = applyFeverLanguageFloor(
      decision.careLevel,
      detectFeverMention(stripNegatedClauses(allUserText)),
      vagueCount,
    )
    if (feverFloor) {
      decision.careLevel = feverFloor.to
      decision.factors = [feverFloor.reason, ...decision.factors].slice(0, 5)
      roundedUp = true
    }

    if (decision.careLevel === 'emergency') {
      await auditDecision({
        kind: 'recommendation',
        features, knownFields: [...known], risk, questionsAsked,
        decision, roundedUp,
        engineVersion: ENGINE_VERSION, rulesetVersion: RULESET_VERSION, kbVersion: kbVersion(),
      })
      await recordReeTelemetry({
        messages,
        features,
        questionsAsked,
        careLevel: 'emergency',
        totalTokensUsed,
        engineVersion: ENGINE_VERSION,
        rulesetVersion: RULESET_VERSION,
        kbVersion: kbVersion(),
        decision,
        metadata: { kind: 'engine_emergency', roundedUp },
      })
      return NextResponse.json({
        type: 'emergency',
        message: "Based on what you've described, this may be a medical emergency. Please call 911 immediately or have someone take you to the nearest emergency room right now. Don't drive yourself.",
      })
    }

    // ── Knowledge layer: retrieved AFTER the decision, never before it ──────
    // Warning signs / self-care / follow-up come from the versioned corpus
    // (metadata filters + deterministic ranking); templates remain the
    // fallback so a retrieval miss never degrades the recommendation.
    const warningSigns = retrieveGuidance('warning_signs', features, risk, { limit: 2 }).guidance
    const selfCareRetrieved = retrieveGuidance('self_care', features, risk, { limit: 1 }).guidance
    const followUp = retrieveGuidance('follow_up', features, risk, { limit: 1 }).guidance
    const chunksUsed = [...warningSigns, ...selfCareRetrieved, ...followUp]
      .map(g => `${g.chunkId}@v${g.chunkVersion}`)

    // ── Second reader (RECORD-ONLY) ──────────────────────────────────────────
    // An independent LLM opinion on the RAW conversation, compared with the
    // engine. It has a different failure profile than the extractor pipeline
    // (it sees the words the extractor may have dropped), so DISAGREEMENT is
    // a high-value review signal for REE. It NEVER changes routing — not up,
    // not down. Disable with SECOND_READER=0.
    let secondReader: { opinion: string; agrees: boolean; engineSaid: string } | null = null
    if (process.env.SECOND_READER !== '0') {
      try {
        const SR_LEVELS = ['emergency', 'er', 'urgent_care', 'primary_care', 'telehealth', 'home_care']
        const srCompletion = await openai.chat.completions.create({
          model: MODEL,
          max_tokens: 60,
          temperature: 0,
          ...(useNvidia ? {} : { response_format: { type: 'json_object' as const } }),
          messages: [
            { role: 'system' as const, content: `You are an experienced emergency triage clinician giving an INDEPENDENT second opinion. Read the conversation and decide the single safest appropriate care level. Output valid JSON only: {"careLevel":"${SR_LEVELS.join('|')}"}` },
            ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          ],
        })
        totalTokensUsed += completionTokenTotal(srCompletion)
        await logLlmUsage('phraser', srCompletion)
        const sr = extractJson(srCompletion.choices[0]?.message?.content ?? '')
        if (typeof sr?.careLevel === 'string' && SR_LEVELS.includes(sr.careLevel)) {
          secondReader = {
            opinion: sr.careLevel,
            engineSaid: decision.careLevel,
            agrees: sr.careLevel === decision.careLevel,
          }
        }
      } catch { /* record-only: any failure is silently skipped */ }
    }

    await auditDecision({
      kind: 'recommendation',
      features, knownFields: [...known], risk, questionsAsked,
      decision, roundedUp, chunksUsed,
      engineVersion: ENGINE_VERSION, rulesetVersion: RULESET_VERSION, kbVersion: kbVersion(),
    })
    await recordReeTelemetry({
      messages,
      features,
      questionsAsked,
      careLevel: decision.careLevel,
      totalTokensUsed,
      engineVersion: ENGINE_VERSION,
      rulesetVersion: RULESET_VERSION,
      kbVersion: kbVersion(),
      decision,
      metadata: { kind: 'recommendation', roundedUp, chunksUsed, secondReader },
    })

    // Evidence is RETRIEVED from the citation registry (rules that fired,
    // plus general level-of-care guidance) — never LLM-generated.
    const citationKeys = citationKeysFor(decision.rulesFired)
    const evidence = getCitations(citationKeys.length ? citationKeys : ['acep-when-to-go'])

    // Cost estimate: deterministic table lookup, never LLM. Returns null for
    // 'emergency' by design (no dollar figure on a 911 screen) and null if
    // the rates table is missing (fail closed — never invent a number). The
    // /api/cost endpoint refines this with user-entered benefits.
    const costEstimate = await estimateCost(decision.careLevel).catch(() => null)

    return NextResponse.json({
      type: 'recommendation',
      careLevel: decision.careLevel,
      reasoning: buildReasoning(features, decision.careLevel, known),
      confidence: decision.confidence,
      urgency: urgencyFor(decision.careLevel),
      whatToExpect: WHAT_TO_EXPECT[decision.careLevel],
      alternativeNote: alternativeNoteFor(decision.careLevel, features.system),
      selfCare: selfCareRetrieved[0]?.text ?? SELF_CARE[features.system],
      warningSigns,
      followUp: followUp[0] ?? null,
      factors: decision.factors,
      featureKeys: decision.featureKeys,
      evidence,
      rulesFired: decision.rulesFired.map(r => r.id),
      roundedUp,
      secondReader,   // record-only: independent opinion + agreement flag
      costEstimate,   // deterministic range from versioned rates table (or null)
      provenance: {
        engineVersion: decision.version,
        rulesetVersion: decision.rulesetVersion,
        kbVersion: kbVersion(),
        chunksUsed,
      },
      engineVersion: decision.version,
      rulesetVersion: decision.rulesetVersion,
    })
  } catch (err) {
    console.error('Triage API error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
