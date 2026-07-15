// ─────────────────────────────────────────────────────────────────────────────
// Carevo Guideline Update Detector v0.
// Run: npx tsx scripts/check-guideline-updates.ts        (manually or in CI)
//
// For every source document in the knowledge corpus:
//   1. Fetch the source page.
//   2. Hash its text content (whitespace-normalized).
//   3. Compare with the stored hash in data/knowledge/source-hashes.json.
//   4. On change: add the doc, its chunks, and every CLINICAL RULE citing the
//      same source to data/knowledge/review-queue.json.
//
// It NEVER modifies rules, chunks, or routing. Its only output is a review
// queue for a human. (V2 architecture: guideline → AI-drafted diff →
// clinician sign-off → production. This script is step zero: noticing.)
// ─────────────────────────────────────────────────────────────────────────────

import { promises as fs } from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { DOCUMENTS, CHUNKS, KB_VERSION } from '../lib/knowledge/corpus'
import { CLINICAL_RULES } from '../lib/engine/rules'

const HASHES_FILE = path.join(process.cwd(), 'data', 'knowledge', 'source-hashes.json')
const QUEUE_FILE = path.join(process.cwd(), 'data', 'knowledge', 'review-queue.json')

interface ReviewItem {
  docId: string
  url: string
  org: string
  detectedAt: string
  previousHash: string | null
  newHash: string
  affectedChunks: string[]
  affectedRules: string[]
  status: 'pending_review'
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

/** Crude but stable text extraction: strip tags/scripts, collapse whitespace. */
function pageText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function loadJson<T>(file: string, fallback: T): Promise<T> {
  try { return JSON.parse(await fs.readFile(file, 'utf8')) } catch { return fallback }
}

async function main() {
  const hashes = await loadJson<Record<string, string>>(HASHES_FILE, {})
  const queue = await loadJson<ReviewItem[]>(QUEUE_FILE, [])
  const queuedDocs = new Set(queue.filter(q => q.status === 'pending_review').map(q => q.docId))

  let checked = 0, changed = 0, failed = 0

  for (const doc of DOCUMENTS) {
    process.stdout.write(`  ${doc.docId} … `)
    let body: string
    try {
      const res = await fetch(doc.url, {
        headers: { 'User-Agent': 'CarevoGuidelineMonitor/0.1 (+clinical content update detection)' },
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      body = await res.text()
    } catch (err: any) {
      console.log(`FETCH FAILED (${err?.message ?? err}) — skipped, not treated as a change`)
      failed++
      continue
    }

    checked++
    const newHash = sha256(pageText(body))
    const prev = hashes[doc.docId] ?? null

    if (prev === newHash) { console.log('unchanged'); continue }
    if (prev === null) {
      // First observation: record baseline, nothing to review yet.
      hashes[doc.docId] = newHash
      console.log('baseline recorded')
      continue
    }

    changed++
    hashes[doc.docId] = newHash
    if (queuedDocs.has(doc.docId)) { console.log('CHANGED (already queued)'); continue }

    queue.push({
      docId: doc.docId,
      url: doc.url,
      org: doc.org,
      detectedAt: new Date().toISOString(),
      previousHash: prev,
      newHash,
      affectedChunks: CHUNKS.filter(c => c.docId === doc.docId).map(c => `${c.id}@v${c.meta.version}`),
      affectedRules: CLINICAL_RULES.filter(r => r.citation === doc.citation).map(r => r.id),
      status: 'pending_review',
    })
    console.log('CHANGED → queued for clinician review')
  }

  await fs.mkdir(path.dirname(HASHES_FILE), { recursive: true })
  await fs.writeFile(HASHES_FILE, JSON.stringify(hashes, null, 2))
  await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2))

  const pending = queue.filter(q => q.status === 'pending_review').length
  console.log(`\nKB ${KB_VERSION} — checked ${checked}, changed ${changed}, fetch-failed ${failed}`)
  console.log(`Review queue: ${pending} item(s) pending at data/knowledge/review-queue.json`)
  if (changed > 0) {
    console.log('\nNOTE: source changes NEVER alter routing automatically.')
    console.log('A clinician must review each queued item and bump chunk/rule versions manually.')
  }
}

main()
