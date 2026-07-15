// ─────────────────────────────────────────────────────────────────────────────
// Carevo Knowledge Ingestion Pipeline v0 — MedlinePlus connector.
// Run: npx tsx scripts/ingest-guidelines.ts [--topics=chest,fever] [--limit=N]
//
// Pipeline: fetch (NIH MedlinePlus health-topics API) → parse → chunk →
// auto-tag (system / specialty / age group / content type) → version →
// STAGE at data/knowledge/staging/. Staged content NEVER reaches production:
// scripts/approve-chunks.ts (the human gate) promotes reviewed documents
// into the corpus overlay.
//
// Why MedlinePlus first: NIH-maintained, patient-language, stable API,
// public-domain-friendly, and covers hundreds of triage-relevant topics.
// Additional connectors (CDC, AAP, ACOG…) plug in as parsers behind the
// same staging contract.
// ─────────────────────────────────────────────────────────────────────────────

import { promises as fs } from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import type { BodySystem } from '../lib/engine/features'
import type { AgeGroup, ContentType, KnowledgeChunk, KnowledgeDocument, Specialty } from '../lib/knowledge/types'

const STAGING_DIR = path.join(process.cwd(), 'data', 'knowledge', 'staging')
const API = 'https://wsearch.nlm.nih.gov/ws/query'

// ── Topic plan: what to ingest, and how to tag it ────────────────────────────
// Each entry: search term → default tagging. ~70 topics spanning every body
// system; each topic yields multiple chunks, growing the corpus toward 1,000.

interface TopicPlan { term: string; system: BodySystem; specialty: Specialty; ageGroup?: AgeGroup }

const TOPICS: TopicPlan[] = [
  // cardiac
  { term: 'chest pain', system: 'cardiac', specialty: 'cardiology' },
  { term: 'heart attack', system: 'cardiac', specialty: 'cardiology' },
  { term: 'palpitations', system: 'cardiac', specialty: 'cardiology' },
  { term: 'high blood pressure', system: 'cardiac', specialty: 'cardiology' },
  { term: 'heart failure', system: 'cardiac', specialty: 'cardiology' },
  // respiratory
  { term: 'asthma', system: 'respiratory', specialty: 'pulmonology' },
  { term: 'pneumonia', system: 'respiratory', specialty: 'pulmonology' },
  { term: 'bronchitis', system: 'respiratory', specialty: 'pulmonology' },
  { term: 'cough', system: 'respiratory', specialty: 'pulmonology' },
  { term: 'shortness of breath', system: 'respiratory', specialty: 'pulmonology' },
  { term: 'croup', system: 'respiratory', specialty: 'pediatrics', ageGroup: 'child' },
  { term: 'RSV', system: 'respiratory', specialty: 'pediatrics', ageGroup: 'child' },
  // neuro
  { term: 'headache', system: 'neuro', specialty: 'neurology' },
  { term: 'migraine', system: 'neuro', specialty: 'neurology' },
  { term: 'stroke', system: 'neuro', specialty: 'neurology' },
  { term: 'dizziness and vertigo', system: 'neuro', specialty: 'neurology' },
  { term: 'concussion', system: 'neuro', specialty: 'neurology' },
  { term: 'seizures', system: 'neuro', specialty: 'neurology' },
  { term: 'fainting', system: 'neuro', specialty: 'neurology' },
  // gi
  { term: 'abdominal pain', system: 'gi', specialty: 'gastroenterology' },
  { term: 'nausea and vomiting', system: 'gi', specialty: 'gastroenterology' },
  { term: 'diarrhea', system: 'gi', specialty: 'gastroenterology' },
  { term: 'constipation', system: 'gi', specialty: 'gastroenterology' },
  { term: 'food poisoning', system: 'gi', specialty: 'gastroenterology' },
  { term: 'gastrointestinal bleeding', system: 'gi', specialty: 'gastroenterology' },
  { term: 'appendicitis', system: 'gi', specialty: 'gastroenterology' },
  { term: 'heartburn', system: 'gi', specialty: 'gastroenterology' },
  { term: 'dehydration', system: 'gi', specialty: 'gastroenterology' },
  // msk
  { term: 'sprains and strains', system: 'msk', specialty: 'orthopedics' },
  { term: 'fractures', system: 'msk', specialty: 'orthopedics' },
  { term: 'back pain', system: 'msk', specialty: 'orthopedics' },
  { term: 'knee injuries', system: 'msk', specialty: 'orthopedics' },
  { term: 'shoulder injuries', system: 'msk', specialty: 'orthopedics' },
  { term: 'ankle injuries', system: 'msk', specialty: 'orthopedics' },
  // skin
  { term: 'rashes', system: 'skin', specialty: 'dermatology' },
  { term: 'hives', system: 'skin', specialty: 'dermatology' },
  { term: 'burns', system: 'skin', specialty: 'dermatology' },
  { term: 'cuts and puncture wounds', system: 'skin', specialty: 'dermatology' },
  { term: 'insect bites and stings', system: 'skin', specialty: 'dermatology' },
  { term: 'cellulitis', system: 'skin', specialty: 'dermatology' },
  { term: 'shingles', system: 'skin', specialty: 'dermatology' },
  // ent
  { term: 'sore throat', system: 'ent', specialty: 'ent' },
  { term: 'strep throat', system: 'ent', specialty: 'ent' },
  { term: 'ear infections', system: 'ent', specialty: 'ent' },
  { term: 'sinusitis', system: 'ent', specialty: 'ent' },
  { term: 'common cold', system: 'ent', specialty: 'ent' },
  { term: 'flu', system: 'ent', specialty: 'general' },
  { term: 'nosebleed', system: 'ent', specialty: 'ent' },
  // urinary
  { term: 'urinary tract infections', system: 'urinary', specialty: 'urology' },
  { term: 'kidney stones', system: 'urinary', specialty: 'urology' },
  { term: 'blood in urine', system: 'urinary', specialty: 'urology' },
  // gyn
  { term: 'vaginal bleeding', system: 'gyn', specialty: 'obgyn' },
  { term: 'pregnancy problems', system: 'gyn', specialty: 'obgyn' },
  { term: 'menstruation', system: 'gyn', specialty: 'obgyn' },
  { term: 'ectopic pregnancy', system: 'gyn', specialty: 'obgyn' },
  // mental
  { term: 'anxiety', system: 'mental', specialty: 'psychiatry' },
  { term: 'depression', system: 'mental', specialty: 'psychiatry' },
  { term: 'panic disorder', system: 'mental', specialty: 'psychiatry' },
  // general / pediatrics
  { term: 'fever', system: 'general', specialty: 'general' },
  { term: 'fever in children', system: 'general', specialty: 'pediatrics', ageGroup: 'child' },
  { term: 'fatigue', system: 'general', specialty: 'general' },
  { term: 'allergic reactions', system: 'general', specialty: 'general' },
  { term: 'sepsis', system: 'general', specialty: 'general' },
  { term: 'heat illness', system: 'general', specialty: 'general' },
  { term: 'hypothermia', system: 'general', specialty: 'general' },
]

// ── Auto-tagging heuristics ──────────────────────────────────────────────────

/** Sentences signalling "seek care now" become warning_signs chunks. */
const WARNING_RX = /(call 911|emergency|immediate medical|seek (medical )?(care|help)|see (a|your) (doctor|provider) right away|go to the (er|hospital)|urgent)/i
const SELF_CARE_RX = /(at home|self[- ]care|rest|drink|fluids|avoid|over[- ]the[- ]counter|ice|elevate|warm compress|humidifier)/i

function classifyContent(text: string): ContentType {
  if (WARNING_RX.test(text)) return 'warning_signs'
  if (SELF_CARE_RX.test(text)) return 'self_care'
  return 'education'
}

// ── Parsing & chunking ───────────────────────────────────────────────────────

const decode = (s: string) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&')

const stripTags = (s: string) => decode(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

/** Split a summary into chunks of 2–4 sentences, 150–600 chars. */
function chunkText(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()) ?? []
  const chunks: string[] = []
  let buf: string[] = []
  for (const s of sentences) {
    buf.push(s)
    const len = buf.join(' ').length
    if ((buf.length >= 2 && len >= 250) || buf.length >= 4 || len >= 550) {
      chunks.push(buf.join(' '))
      buf = []
    }
  }
  if (buf.length && buf.join(' ').length >= 120) chunks.push(buf.join(' '))
  return chunks.filter(c => c.length >= 120 && c.length <= 700)
}

interface ApiDoc { url: string; title: string; summary: string }

function parseApiResponse(xml: string): ApiDoc[] {
  const docs: ApiDoc[] = []
  const docRx = /<document rank="\d+" url="([^"]+)">([\s\S]*?)<\/document>/g
  let m: RegExpExecArray | null
  while ((m = docRx.exec(xml))) {
    const [, url, body] = m
    const title = stripTags(/<content name="title">([\s\S]*?)<\/content>/.exec(body)?.[1] ?? '')
    const summary = stripTags(/<content name="FullSummary">([\s\S]*?)<\/content>/.exec(body)?.[1] ?? '')
    if (url && title && summary) docs.push({ url, title, summary })
  }
  return docs
}

const sha8 = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 8)

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const topicFilter = args.find(a => a.startsWith('--topics='))?.slice(9).split(',').map(s => s.trim().toLowerCase())
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.slice(8) ?? '0', 10) || Infinity

  const plan = TOPICS
    .filter(t => !topicFilter || topicFilter.some(f => t.term.toLowerCase().includes(f)))
    .slice(0, limit === Infinity ? undefined : limit)

  await fs.mkdir(STAGING_DIR, { recursive: true })
  const today = new Date().toISOString().slice(0, 10)
  let totalChunks = 0, totalDocs = 0, failed = 0
  const seenUrls = new Set<string>()

  for (const topic of plan) {
    process.stdout.write(`  "${topic.term}" … `)
    let xml: string
    try {
      const res = await fetch(`${API}?db=healthTopics&retmax=1&term=${encodeURIComponent(topic.term)}`, {
        headers: { 'User-Agent': 'CarevoKnowledgeIngest/0.1' },
        signal: AbortSignal.timeout(20000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      xml = await res.text()
    } catch (err: any) {
      console.log(`FETCH FAILED (${err?.message ?? err})`)
      failed++
      continue
    }

    const apiDocs = parseApiResponse(xml).filter(d => !seenUrls.has(d.url))
    if (!apiDocs.length) { console.log('no new document'); continue }

    for (const d of apiDocs) {
      seenUrls.add(d.url)
      const slug = d.url.split('/').pop()?.replace(/\.html?$/, '') ?? sha8(d.url)
      const docId = `mlp.${slug}`

      const document: KnowledgeDocument = {
        docId,
        title: d.title,
        org: 'NIH / MedlinePlus',
        url: d.url,
        sourceContentHash: sha8(d.summary),
      }

      const chunks: KnowledgeChunk[] = chunkText(d.summary).map((text, i) => ({
        id: `${docId}#${i + 1}`,
        docId,
        contentType: classifyContent(text),
        systems: [topic.system],
        specialty: topic.specialty,
        ageGroup: topic.ageGroup ?? 'all',
        topics: [topic.term, d.title.toLowerCase()],
        text,
        meta: {
          org: 'NIH / MedlinePlus',
          publishedDate: today,          // API exposes no pub date; reviewer verifies
          lastReviewed: today,
          evidenceStrength: 'public_health_guidance',
          version: 1,
          reviewStatus: 'seeded_pending_review',
        },
      }))

      if (!chunks.length) { console.log(`"${d.title}": summary too short — skipped`); continue }

      const stagingFile = path.join(STAGING_DIR, `${docId}.json`)
      await fs.writeFile(stagingFile, JSON.stringify({ document, chunks, ingestedAt: new Date().toISOString(), topicPlan: topic }, null, 2))
      totalDocs++
      totalChunks += chunks.length
      console.log(`staged ${chunks.length} chunks from "${d.title}"`)
    }
  }

  console.log(`\nStaged ${totalChunks} chunks across ${totalDocs} documents (${failed} fetch failures).`)
  console.log(`Staging area: data/knowledge/staging/ — NOTHING is live yet.`)
  console.log(`Next: npx tsx scripts/approve-chunks.ts list   (review + promote)`)
}

main()
