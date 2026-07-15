// ─────────────────────────────────────────────────────────────────────────────
// Carevo Knowledge Corpus v0 — seeded knowledge objects.
//
// Every chunk is a faithful plain-language rendering of guidance from the
// named organization, written for patients, and marked
// `seeded_pending_review`: a clinician must verify each against the source
// before enterprise deployment (same honesty contract as the rule layer).
// The corpus is versioned as a whole (KB_VERSION) and per-chunk (meta.version)
// so every recommendation is reproducible: it records exactly which chunk
// versions it showed.
// ─────────────────────────────────────────────────────────────────────────────

// Node runtime: overlay loaded from disk (compliance posture requires the
// full approved corpus in production, not just the seed set).
import { readFileSync, statSync } from 'fs'
import path from 'path'
import type { CorpusOverlay, KnowledgeChunk, KnowledgeDocument } from './types'
import { CITATIONS } from './citations'

/** Base version covers the hand-seeded corpus; the runtime KB version
 *  appends the overlay revision (kbVersion() below). */
export const KB_BASE_VERSION = 'carevo-kb-2026.07.0'
/** @deprecated use kbVersion() — kept for backward compatibility */
export const KB_VERSION = KB_BASE_VERSION

const OVERLAY_FILE = path.join(process.cwd(), 'data', 'knowledge', 'approved-chunks.json')

const SEEDED = 'seeded_pending_review' as const
const REVIEWED_ON = '2026-07-05'

export const DOCUMENTS: KnowledgeDocument[] = (
  [
    ['doc.aha.heart',      'aha-heart-attack-signs'],
    ['doc.cdc.stroke',     'cdc-stroke-signs'],
    ['doc.nih.breathing',  'medlineplus-breathing'],
    ['doc.nih.dehydration','medlineplus-dehydration'],
    ['doc.ninds.headache', 'ninds-headache'],
    ['doc.acog.pregnancy', 'acog-pregnancy-bleeding'],
    ['doc.acaai.allergy',  'acaai-anaphylaxis'],
    ['doc.988.crisis',     '988-lifeline'],
    ['doc.aap.infant',     'aap-febrile-infant'],
    ['doc.aap.fever',      'healthychildren-fever'],
    ['doc.acep.whentogo',  'acep-when-to-go'],
    ['doc.cdc.immuno',     'cdc-fever-immunocompromised'],
  ] as const
).map(([docId, citation]) => ({
  docId, citation,
  title: CITATIONS[citation].title,
  org: CITATIONS[citation].org,
  url: CITATIONS[citation].url,
  sourceContentHash: null,
}))

export const CHUNKS: KnowledgeChunk[] = [
  // ── Cardiac ────────────────────────────────────────────────────────────────
  {
    id: 'doc.aha.heart#1', docId: 'doc.aha.heart', citation: 'aha-heart-attack-signs',
    contentType: 'warning_signs', systems: ['cardiac', 'respiratory'], specialty: 'cardiology', ageGroup: 'all',
    topics: ['chest pain', 'pressure', 'heart attack', 'arm', 'jaw', 'sweating', 'shortness of breath'],
    text: 'Call 911 right away if chest discomfort feels like pressure, squeezing, or fullness; lasts more than a few minutes or goes away and comes back; or comes with shortness of breath, a cold sweat, nausea, lightheadedness, or pain spreading to the arm, jaw, neck, or back.',
    meta: { org: 'American Heart Association', publishedDate: '2022-12-05', lastReviewed: REVIEWED_ON, evidenceStrength: 'clinical_guideline', version: 1, reviewStatus: SEEDED },
  },
  {
    id: 'doc.aha.heart#2', docId: 'doc.aha.heart', citation: 'aha-heart-attack-signs',
    contentType: 'education', systems: ['cardiac'], specialty: 'cardiology', ageGroup: 'all',
    topics: ['chest pain', 'women', 'atypical symptoms'],
    text: 'Heart problems don\'t always feel dramatic. Women, older adults, and people with diabetes are more likely to have subtler signs — unusual fatigue, nausea, or discomfort in the back or jaw rather than classic chest pain. Taking mild but unusual symptoms seriously matters more if that describes you.',
    meta: { org: 'American Heart Association', publishedDate: '2022-12-05', lastReviewed: REVIEWED_ON, evidenceStrength: 'clinical_guideline', version: 1, reviewStatus: SEEDED },
  },

  // ── Stroke / neuro ─────────────────────────────────────────────────────────
  {
    id: 'doc.cdc.stroke#1', docId: 'doc.cdc.stroke', citation: 'cdc-stroke-signs',
    contentType: 'warning_signs', systems: ['neuro'], specialty: 'neurology', ageGroup: 'all',
    topics: ['stroke', 'face drooping', 'weakness', 'slurred speech', 'FAST', 'vision'],
    text: 'Act F.A.S.T. — call 911 immediately for sudden Face drooping, Arm weakness or numbness (especially one-sided), or Speech that is slurred or strange. Also treat sudden confusion, sudden trouble seeing, sudden severe headache, or sudden trouble walking as an emergency. Stroke treatment is time-critical.',
    meta: { org: 'CDC', publishedDate: '2024-05-15', lastReviewed: REVIEWED_ON, evidenceStrength: 'public_health_guidance', version: 1, reviewStatus: SEEDED },
  },
  {
    id: 'doc.ninds.headache#1', docId: 'doc.ninds.headache', citation: 'ninds-headache',
    contentType: 'warning_signs', systems: ['neuro'], specialty: 'neurology', ageGroup: 'all',
    topics: ['headache', 'worst headache', 'thunderclap', 'stiff neck', 'fever'],
    text: 'Seek emergency care for a headache that peaks within seconds ("worst headache of your life"), or one that comes with fever and a stiff neck, confusion, fainting, weakness, vision loss, or follows a head injury. These patterns need immediate evaluation.',
    meta: { org: 'NIH / NINDS', publishedDate: '2023-07-01', lastReviewed: REVIEWED_ON, evidenceStrength: 'public_health_guidance', version: 1, reviewStatus: SEEDED },
  },
  {
    id: 'doc.ninds.headache#2', docId: 'doc.ninds.headache', citation: 'ninds-headache',
    contentType: 'self_care', systems: ['neuro'], specialty: 'neurology', ageGroup: 'all',
    topics: ['headache', 'rest', 'hydration', 'triggers'],
    text: 'For a routine headache: rest in a quiet, dark room, stay hydrated, and limit screens. Track when headaches happen and what seems to trigger them — that record genuinely helps your clinician if headaches keep returning.',
    meta: { org: 'NIH / NINDS', publishedDate: '2023-07-01', lastReviewed: REVIEWED_ON, evidenceStrength: 'public_health_guidance', version: 1, reviewStatus: SEEDED },
  },

  // ── Breathing ──────────────────────────────────────────────────────────────
  {
    id: 'doc.nih.breathing#1', docId: 'doc.nih.breathing', citation: 'medlineplus-breathing',
    contentType: 'warning_signs', systems: ['respiratory', 'ent'], specialty: 'pulmonology', ageGroup: 'all',
    topics: ['breathing', 'shortness of breath', 'wheezing', 'blue lips'],
    text: 'Get emergency help for trouble breathing at rest, breathing that is getting rapidly worse, bluish lips or face, chest pain with breathing, or being unable to speak in full sentences. New breathing difficulty is never something to wait out at home.',
    meta: { org: 'NIH / MedlinePlus', publishedDate: '2024-01-10', lastReviewed: REVIEWED_ON, evidenceStrength: 'public_health_guidance', version: 1, reviewStatus: SEEDED },
  },

  // ── GI / dehydration ───────────────────────────────────────────────────────
  {
    id: 'doc.nih.dehydration#1', docId: 'doc.nih.dehydration', citation: 'medlineplus-dehydration',
    contentType: 'warning_signs', systems: ['gi', 'urinary'], specialty: 'gastroenterology', ageGroup: 'all',
    topics: ['dehydration', 'vomiting', 'diarrhea', 'urination', 'dizziness', 'blood in stool'],
    text: 'Seek urgent care if you can\'t keep fluids down for more than a day, urinate very little or not at all, feel dizzy when standing, or have a rapid heartbeat. Blood in vomit or stool, or black tarry stools, need emergency evaluation.',
    meta: { org: 'NIH / MedlinePlus', publishedDate: '2023-10-20', lastReviewed: REVIEWED_ON, evidenceStrength: 'public_health_guidance', version: 1, reviewStatus: SEEDED },
  },
  {
    id: 'doc.nih.dehydration#2', docId: 'doc.nih.dehydration', citation: 'medlineplus-dehydration',
    contentType: 'self_care', systems: ['gi'], specialty: 'gastroenterology', ageGroup: 'all',
    topics: ['stomach', 'fluids', 'bland diet', 'rest'],
    text: 'While your stomach settles: take small, frequent sips of clear fluids (water, broth, oral rehydration solution) rather than large amounts at once, and reintroduce bland foods gradually. Avoid alcohol, caffeine, and dairy until you\'re clearly improving.',
    meta: { org: 'NIH / MedlinePlus', publishedDate: '2023-10-20', lastReviewed: REVIEWED_ON, evidenceStrength: 'public_health_guidance', version: 1, reviewStatus: SEEDED },
  },

  // ── Pregnancy ──────────────────────────────────────────────────────────────
  {
    id: 'doc.acog.pregnancy#1', docId: 'doc.acog.pregnancy', citation: 'acog-pregnancy-bleeding',
    contentType: 'warning_signs', systems: ['gyn'], specialty: 'obgyn', ageGroup: 'adult',
    topics: ['pregnancy', 'bleeding', 'abdominal pain', 'cramping'],
    text: 'During pregnancy, any vaginal bleeding with pain or cramping, heavy bleeding, severe abdominal pain, dizziness, or fever should be evaluated urgently — the same day, and by emergency care if bleeding is heavy or pain is severe. Light spotting still deserves a call to your OB.',
    meta: { org: 'ACOG', publishedDate: '2022-08-01', lastReviewed: REVIEWED_ON, evidenceStrength: 'clinical_guideline', version: 1, reviewStatus: SEEDED },
  },

  // ── Allergy ────────────────────────────────────────────────────────────────
  {
    id: 'doc.acaai.allergy#1', docId: 'doc.acaai.allergy', citation: 'acaai-anaphylaxis',
    contentType: 'warning_signs', systems: ['skin', 'respiratory', 'ent'], specialty: 'general', ageGroup: 'all',
    topics: ['allergic reaction', 'hives', 'swelling', 'throat', 'anaphylaxis', 'epipen'],
    text: 'A rash or hives together with any of these is an emergency: swelling of the lips, tongue, or throat; trouble breathing or swallowing; vomiting; dizziness or fainting. Use an epinephrine auto-injector if prescribed and call 911 — anaphylaxis can worsen in minutes.',
    meta: { org: 'ACAAI', publishedDate: '2023-03-15', lastReviewed: REVIEWED_ON, evidenceStrength: 'professional_consensus', version: 1, reviewStatus: SEEDED },
  },

  // ── Mental health ──────────────────────────────────────────────────────────
  {
    id: 'doc.988.crisis#1', docId: 'doc.988.crisis', citation: '988-lifeline',
    contentType: 'education', systems: ['mental'], specialty: 'psychiatry', ageGroup: 'all',
    topics: ['crisis', 'support', 'mental health', '988'],
    text: 'If emotional distress ever feels like more than you can carry, the 988 Suicide & Crisis Lifeline (call or text 988, 24/7) connects you with a trained counselor. Reaching out early — before a crisis peaks — is a strength, not an overreaction.',
    meta: { org: '988 Suicide & Crisis Lifeline', publishedDate: '2022-07-16', lastReviewed: REVIEWED_ON, evidenceStrength: 'public_health_guidance', version: 1, reviewStatus: SEEDED },
  },

  // ── Pediatrics ─────────────────────────────────────────────────────────────
  {
    id: 'doc.aap.infant#1', docId: 'doc.aap.infant', citation: 'aap-febrile-infant',
    contentType: 'warning_signs', systems: ['general', 'ent'], specialty: 'pediatrics', ageGroup: 'infant',
    topics: ['infant', 'fever', 'newborn', 'temperature'],
    text: 'A rectal temperature of 100.4°F (38°C) or higher in a baby under 3 months old always needs same-day medical evaluation — go to the emergency department. Young infants can\'t localize infection, so fever alone is the signal, even if the baby seems okay.',
    meta: { org: 'American Academy of Pediatrics', publishedDate: '2021-08-01', lastReviewed: REVIEWED_ON, evidenceStrength: 'clinical_guideline', version: 1, reviewStatus: SEEDED },
  },
  {
    id: 'doc.aap.fever#1', docId: 'doc.aap.fever', citation: 'healthychildren-fever',
    contentType: 'warning_signs', systems: ['general', 'ent'], specialty: 'pediatrics', ageGroup: 'child',
    topics: ['child', 'fever', 'lethargy', 'rash', 'breathing'],
    text: 'For a child with fever, seek urgent care for: fever with a rash that doesn\'t fade when pressed, unusual sleepiness or difficulty waking, trouble breathing, signs of dehydration (no tears, few wet diapers), a stiff neck, or fever lasting more than 3 days.',
    meta: { org: 'AAP / HealthyChildren.org', publishedDate: '2023-09-01', lastReviewed: REVIEWED_ON, evidenceStrength: 'professional_consensus', version: 1, reviewStatus: SEEDED },
  },
  {
    id: 'doc.aap.fever#2', docId: 'doc.aap.fever', citation: 'healthychildren-fever',
    contentType: 'self_care', systems: ['general', 'ent'], specialty: 'pediatrics', ageGroup: 'child',
    topics: ['child', 'fever', 'comfort', 'fluids'],
    text: 'Fever itself is a normal immune response — treat the child, not the number. Keep them comfortable and offer fluids often. Watch how they behave when the fever comes down: a child who perks up is usually reassuring; one who stays listless is not.',
    meta: { org: 'AAP / HealthyChildren.org', publishedDate: '2023-09-01', lastReviewed: REVIEWED_ON, evidenceStrength: 'professional_consensus', version: 1, reviewStatus: SEEDED },
  },

  // ── Immunocompromised ──────────────────────────────────────────────────────
  {
    id: 'doc.cdc.immuno#1', docId: 'doc.cdc.immuno', citation: 'cdc-fever-immunocompromised',
    contentType: 'warning_signs', systems: ['general'], specialty: 'general', ageGroup: 'all',
    topics: ['immunocompromised', 'fever', 'chemotherapy', 'infection'],
    text: 'If your immune system is weakened (chemotherapy, transplant medicines, immune conditions), treat any fever of 100.4°F (38°C) or higher as urgent and contact care the same day. Infections can progress much faster when immune defenses are reduced.',
    meta: { org: 'CDC', publishedDate: '2024-02-01', lastReviewed: REVIEWED_ON, evidenceStrength: 'public_health_guidance', version: 1, reviewStatus: SEEDED },
  },

  // ── General / cross-cutting ────────────────────────────────────────────────
  {
    id: 'doc.acep.whentogo#1', docId: 'doc.acep.whentogo', citation: 'acep-when-to-go',
    contentType: 'warning_signs', systems: ['msk', 'skin'], specialty: 'orthopedics', ageGroup: 'all',
    topics: ['injury', 'fracture', 'wound', 'swelling', 'numbness'],
    text: 'For an injury, escalate to emergency care if the limb looks deformed or the bone may be exposed, you can\'t feel or move the area, it\'s cold or pale below the injury, or bleeding doesn\'t stop with firm pressure. Otherwise, urgent care can usually X-ray, splint, and stitch the same day.',
    meta: { org: 'American College of Emergency Physicians', publishedDate: '2023-05-01', lastReviewed: REVIEWED_ON, evidenceStrength: 'professional_consensus', version: 1, reviewStatus: SEEDED },
  },
  {
    id: 'doc.acep.whentogo#2', docId: 'doc.acep.whentogo', citation: 'acep-when-to-go',
    contentType: 'follow_up', systems: ['general', 'gi', 'ent', 'urinary', 'msk', 'skin', 'neuro', 'respiratory', 'cardiac', 'gyn', 'mental'], specialty: 'emergency_medicine', ageGroup: 'all',
    topics: ['worsening', 'follow up', 'return precautions', 'when to escalate'],
    text: 'Whatever level of care you choose, come back up a level if things change: symptoms clearly worsening, new symptoms appearing, fever that starts or climbs, or pain that stops responding to what worked before. A plan is only right until the picture changes.',
    meta: { org: 'American College of Emergency Physicians', publishedDate: '2023-05-01', lastReviewed: REVIEWED_ON, evidenceStrength: 'professional_consensus', version: 1, reviewStatus: SEEDED },
  },
  {
    id: 'doc.acep.whentogo#3', docId: 'doc.acep.whentogo', citation: 'acep-when-to-go',
    contentType: 'education', systems: ['general', 'ent', 'urinary', 'skin'], specialty: 'emergency_medicine', ageGroup: 'all',
    topics: ['urgent care', 'emergency room', 'telehealth', 'choosing care'],
    text: 'Urgent care handles most same-day needs — X-rays, stitches, infections, prescriptions — at a fraction of ER cost and wait. The ER is for threats to life, limb, or organ. Telehealth works well when a clinician mainly needs to look and listen, not touch or test.',
    meta: { org: 'American College of Emergency Physicians', publishedDate: '2023-05-01', lastReviewed: REVIEWED_ON, evidenceStrength: 'professional_consensus', version: 1, reviewStatus: SEEDED },
  },
]

// Overlay loading: seeds + approved ingested content. The overlay is written
// ONLY by scripts/approve-chunks.ts (the human gate). Reads are cached and
// invalidated by file mtime, so a promotion takes effect without a restart.
let overlayCache: { overlay: CorpusOverlay | null; mtimeMs: number } | null = null

function loadOverlay(): CorpusOverlay | null {
  let mtimeMs = -1
  try { mtimeMs = statSync(OVERLAY_FILE).mtimeMs } catch { /* no overlay yet */ }
  if (overlayCache && overlayCache.mtimeMs === mtimeMs) return overlayCache.overlay
  let overlay: CorpusOverlay | null = null
  if (mtimeMs >= 0) {
    try {
      const parsed = JSON.parse(readFileSync(OVERLAY_FILE, 'utf8')) as CorpusOverlay
      if (Array.isArray(parsed.chunks) && Array.isArray(parsed.documents)) overlay = parsed
    } catch (err) {
      console.error('Corpus overlay unreadable — serving seed corpus only:', err)
    }
  }
  overlayCache = { overlay, mtimeMs }
  return overlay
}

/** All chunks: hand-seeded + approved overlay. */
export function allChunks(): KnowledgeChunk[] {
  const overlay = loadOverlay()
  return overlay ? [...CHUNKS, ...overlay.chunks] : CHUNKS
}

/** All documents: hand-seeded + approved overlay. */
export function allDocuments(): KnowledgeDocument[] {
  const overlay = loadOverlay()
  return overlay ? [...DOCUMENTS, ...overlay.documents] : DOCUMENTS
}

/** Runtime KB version — reproducibility key recorded on every decision. */
export function kbVersion(): string {
  const overlay = loadOverlay()
  return overlay ? `${KB_BASE_VERSION}+r${overlay.rev}` : KB_BASE_VERSION
}
