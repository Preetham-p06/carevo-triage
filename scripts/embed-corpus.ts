// ─────────────────────────────────────────────────────────────────────────────
// Carevo Corpus Embedder — generates FROZEN vectors for hybrid retrieval.
// Run: npx tsx scripts/embed-corpus.ts     (requires OPENAI_API_KEY or NVIDIA_API_KEY)
//
// Embeds (a) every corpus chunk and (b) every canonical query — the query
// vocabulary is finite because queries derive from structured features
// (contentType × body system × age group), so BOTH sides of the similarity
// are precomputed here. Runtime retrieval does pure vector math with no
// model calls: deterministic, replayable, and free.
//
// Vectors are keyed by chunkId@version and stored with the model id, so a
// re-embed with a different model is an explicit, auditable KB change.
// Re-run after every overlay promotion.
// ─────────────────────────────────────────────────────────────────────────────

import { promises as fs } from 'fs'
import path from 'path'
import { allChunks, kbVersion } from '../lib/knowledge/corpus'
import { queryEmbeddingKey, queryEmbeddingText } from '../lib/knowledge/retrieval'
import type { ContentType, AgeGroup } from '../lib/knowledge/types'

const OUT_FILE = path.join(process.cwd(), 'data', 'knowledge', 'embeddings.json')

const useNvidia = !!process.env.NVIDIA_API_KEY && !process.env.OPENAI_API_KEY
const API_KEY = process.env.OPENAI_API_KEY ?? process.env.NVIDIA_API_KEY
const BASE = useNvidia ? 'https://integrate.api.nvidia.com/v1' : 'https://api.openai.com/v1'
const MODEL = process.env.EMBED_MODEL ?? (useNvidia ? 'baai/bge-m3' : 'text-embedding-3-small')

const SYSTEMS = ['cardiac','respiratory','neuro','gi','msk','skin','ent','urinary','gyn','mental','general']
const CONTENT_TYPES: ContentType[] = ['warning_signs', 'self_care', 'follow_up', 'education']
const AGE_GROUPS: AgeGroup[] = ['infant', 'child', 'adult', 'older_adult']

function normalize(v: number[]): number[] {
  const n = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1
  return v.map(x => Math.round((x / n) * 1e6) / 1e6)
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await fetch(`${BASE}/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, input: texts, ...(useNvidia ? { input_type: 'passage' } : {}) }),
    signal: AbortSignal.timeout(60000),
  })
  if (!res.ok) throw new Error(`Embedding API ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const json = await res.json() as { data: Array<{ index: number; embedding: number[] }> }
  return json.data
    .sort((a: any, b: any) => a.index - b.index)
    .map((d: any) => normalize(d.embedding))
}

async function main() {
  if (!API_KEY) {
    console.error('No OPENAI_API_KEY or NVIDIA_API_KEY set — embeddings not generated.')
    console.error('Retrieval continues in BM25-only mode (fully functional).')
    process.exit(1)
  }

  const chunks = allChunks()
  console.log(`Embedding ${chunks.length} chunks + canonical queries with ${MODEL}…`)

  const chunkVectors: Record<string, number[]> = {}
  const BATCH = 32
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH)
    const vecs = await embedBatch(batch.map(c => `${c.topics.join(', ')}. ${c.text}`))
    batch.forEach((c, j) => { chunkVectors[`${c.id}@v${c.meta.version}`] = vecs[j] })
    process.stdout.write(`  chunks ${Math.min(i + BATCH, chunks.length)}/${chunks.length}\r`)
  }
  console.log()

  const queryKeys: string[] = []
  const queryTexts: string[] = []
  for (const ct of CONTENT_TYPES) for (const sys of SYSTEMS) for (const age of AGE_GROUPS) {
    queryKeys.push(queryEmbeddingKey(ct, sys, age))
    queryTexts.push(queryEmbeddingText(ct, sys, age))
  }
  const queryVectors: Record<string, number[]> = {}
  for (let i = 0; i < queryTexts.length; i += BATCH) {
    const vecs = await embedBatch(queryTexts.slice(i, i + BATCH))
    vecs.forEach((v, j) => { queryVectors[queryKeys[i + j]] = v })
    process.stdout.write(`  queries ${Math.min(i + BATCH, queryTexts.length)}/${queryTexts.length}\r`)
  }
  console.log()

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true })
  await fs.writeFile(OUT_FILE, JSON.stringify({
    model: MODEL,
    generatedAt: new Date().toISOString(),
    kbVersion: kbVersion(),
    chunks: chunkVectors,
    queries: queryVectors,
  }))
  console.log(`Wrote ${Object.keys(chunkVectors).length} chunk vectors + ${Object.keys(queryVectors).length} query vectors → data/knowledge/embeddings.json`)
  console.log('Hybrid retrieval is now active (BM25 + cosine + authority boost).')
}

main()
