// ─────────────────────────────────────────────────────────────────────────────
// Carevo Review Workbench v0 — the human gate between staging and production.
// Usage:
//   npx tsx scripts/approve-chunks.ts list                 — show staged docs
//   npx tsx scripts/approve-chunks.ts show <docId>         — full chunk text
//   npx tsx scripts/approve-chunks.ts approve <docId>...   — promote to overlay
//   npx tsx scripts/approve-chunks.ts approve --all        — promote everything
//   npx tsx scripts/approve-chunks.ts reject <docId>...    — delete from staging
//
// Promoting bumps the overlay revision, which changes the runtime KB version
// (kbVersion()) — every subsequent recommendation records the new version,
// and the retrieval index rebuilds automatically. Nothing else in the
// system can write the overlay file.
// ─────────────────────────────────────────────────────────────────────────────

import { promises as fs } from 'fs'
import path from 'path'
import type { CorpusOverlay, KnowledgeChunk, KnowledgeDocument } from '../lib/knowledge/types'

const STAGING_DIR = path.join(process.cwd(), 'data', 'knowledge', 'staging')
const OVERLAY_FILE = path.join(process.cwd(), 'data', 'knowledge', 'approved-chunks.json')

interface StagedDoc {
  document: KnowledgeDocument
  chunks: KnowledgeChunk[]
  ingestedAt: string
}

async function readStaging(): Promise<Map<string, StagedDoc>> {
  const out = new Map<string, StagedDoc>()
  let files: string[] = []
  try { files = await fs.readdir(STAGING_DIR) } catch { return out }
  for (const f of files.filter(f => f.endsWith('.json'))) {
    try {
      const staged = JSON.parse(await fs.readFile(path.join(STAGING_DIR, f), 'utf8')) as StagedDoc
      if (staged.document?.docId && Array.isArray(staged.chunks)) out.set(staged.document.docId, staged)
    } catch { console.error(`  (unreadable staging file skipped: ${f})`) }
  }
  return out
}

async function readOverlay(): Promise<CorpusOverlay> {
  try { return JSON.parse(await fs.readFile(OVERLAY_FILE, 'utf8')) } catch {
    return { rev: 0, promotedAt: '', documents: [], chunks: [] }
  }
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2)
  const staging = await readStaging()

  if (cmd === 'list' || !cmd) {
    if (!staging.size) { console.log('Staging area is empty. Run scripts/ingest-guidelines.ts first.'); return }
    console.log(`Staged documents (${staging.size}):\n`)
    for (const [docId, s] of staging) {
      const types = s.chunks.reduce<Record<string, number>>((a, c) => { a[c.contentType] = (a[c.contentType] ?? 0) + 1; return a }, {})
      console.log(`  ${docId}`)
      console.log(`    "${s.document.title}" — ${s.document.org}`)
      console.log(`    ${s.chunks.length} chunks (${Object.entries(types).map(([t, n]) => `${n} ${t}`).join(', ')}) · systems: ${[...new Set(s.chunks.flatMap(c => c.systems))].join(', ')}`)
    }
    console.log('\nReview with: approve-chunks.ts show <docId>   Promote with: approve-chunks.ts approve <docId>')
    return
  }

  if (cmd === 'show') {
    const s = staging.get(rest[0])
    if (!s) { console.error(`Not staged: ${rest[0]}`); process.exit(1) }
    console.log(`${s.document.title} — ${s.document.url}\n`)
    for (const c of s.chunks) {
      console.log(`[${c.id}] ${c.contentType} · ${c.systems.join(',')} · ${c.ageGroup}`)
      console.log(`  ${c.text}\n`)
    }
    return
  }

  if (cmd === 'reject') {
    for (const docId of rest) {
      if (!staging.has(docId)) { console.error(`  not staged: ${docId}`); continue }
      await fs.unlink(path.join(STAGING_DIR, `${docId}.json`))
      console.log(`  rejected + removed: ${docId}`)
    }
    return
  }

  if (cmd === 'approve') {
    const ids = rest.includes('--all') ? [...staging.keys()] : rest
    if (!ids.length) { console.error('Nothing to approve. Pass docIds or --all.'); process.exit(1) }

    const overlay = await readOverlay()
    const existingDocs = new Set(overlay.documents.map(d => d.docId))
    const existingChunks = new Set(overlay.chunks.map(c => c.id))
    let promotedDocs = 0, promotedChunks = 0

    for (const docId of ids) {
      const s = staging.get(docId)
      if (!s) { console.error(`  not staged: ${docId}`); continue }
      if (existingDocs.has(docId)) {
        // Re-approval of an updated doc: replace its chunks (version bump expected upstream)
        overlay.documents = overlay.documents.filter(d => d.docId !== docId)
        overlay.chunks = overlay.chunks.filter(c => c.docId !== docId)
      }
      overlay.documents.push(s.document)
      for (const c of s.chunks) {
        if (existingChunks.has(c.id)) continue
        overlay.chunks.push(c)
        promotedChunks++
      }
      promotedDocs++
      await fs.unlink(path.join(STAGING_DIR, `${docId}.json`))
      console.log(`  approved: ${docId} (${s.chunks.length} chunks)`)
    }

    if (promotedDocs > 0) {
      overlay.rev += 1
      overlay.promotedAt = new Date().toISOString()
      await fs.mkdir(path.dirname(OVERLAY_FILE), { recursive: true })
      await fs.writeFile(OVERLAY_FILE, JSON.stringify(overlay, null, 2))
      console.log(`\nOverlay revision → r${overlay.rev} (${overlay.chunks.length} overlay chunks total).`)
      console.log('The runtime KB version has changed; retrieval indexes rebuild on next request.')
      console.log('If embeddings are in use, re-run: npx tsx scripts/embed-corpus.ts')
    }
    return
  }

  console.error(`Unknown command: ${cmd}. Use list | show | approve | reject.`)
  process.exit(1)
}

main()
