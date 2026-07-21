// Review store — same pattern as consentStore: Vercel KV (private, REST) in
// prod, local jsonl fallback in dev (gitignored), fail-closed without KV.
import { promises as fs } from 'fs'
import path from 'path'
import { randomBytes } from 'crypto'

const KV_URL = () => process.env.KV_REST_API_URL?.replace(/\/$/, '') || null
const KV_TOKEN = () => process.env.KV_REST_API_TOKEN || null
const LOCAL_FILE = path.join(process.cwd(), 'data', 'reviews.jsonl')
const IS_VERCEL = !!process.env.VERCEL

export interface Review {
  id: string
  createdAt: string
  rating: number        // 1-5
  text: string
  name: string | null   // optional display name
}

async function kv(command: unknown[]): Promise<any | null> {
  const url = KV_URL(), token = KV_TOKEN()
  if (!url || !token) return null
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(6_000),
    })
    if (!res.ok) return null
    return (await res.json())?.result ?? null
  } catch { return null }
}

export const reviewStoreConfigured = () => !!(KV_URL() && KV_TOKEN()) || !IS_VERCEL

export async function saveReview(rating: number, text: string, name: string | null): Promise<string | null> {
  const id = randomBytes(5).toString('hex')
  const review: Review = { id, createdAt: new Date().toISOString(), rating, text, name }
  if (KV_URL() && KV_TOKEN()) {
    const set = await kv(['SET', `review:${id}`, JSON.stringify(review)])
    if (set === null) return null
    await kv(['LPUSH', 'review:index', id])
    await kv(['LTRIM', 'review:index', 0, 4999])
    return id
  }
  if (IS_VERCEL) return null
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
  await fs.appendFile(LOCAL_FILE, JSON.stringify(review) + '\n')
  return id
}

export async function listReviews(limit = 200): Promise<Review[]> {
  if (KV_URL() && KV_TOKEN()) {
    const ids: string[] = (await kv(['LRANGE', 'review:index', 0, limit - 1])) ?? []
    if (!ids.length) return []
    const raw = await kv(['MGET', ...ids.map(i => `review:${i}`)])
    return (raw ?? []).filter(Boolean).map((r: string) => { try { return JSON.parse(r) } catch { return null } }).filter(Boolean)
  }
  try {
    const lines = (await fs.readFile(LOCAL_FILE, 'utf8')).trim().split('\n')
    return lines.slice(-limit).reverse().map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean) as Review[]
  } catch { return [] }
}
