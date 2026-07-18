// ─────────────────────────────────────────────────────────────────────────────
// Consent-gated conversation sharing — the ONLY way a conversation is ever
// stored durably. Users explicitly opt in AFTER seeing their own conversation
// (un-checked box, plain-language copy). No identifiers are collected; each
// share gets a random share code the user can quote to request deletion.
//
// Storage: Vercel KV (Upstash REST) when KV_REST_API_URL/KV_REST_API_TOKEN
// exist — private, token-gated, never public URLs. Local dev falls back to
// data/research-logs.jsonl. If neither is available in production the
// feature reports unconfigured and the UI hides (fail closed, like the
// marketplace adapter).
// ─────────────────────────────────────────────────────────────────────────────
import { promises as fs } from 'fs'
import path from 'path'
import { randomBytes } from 'crypto'

const KV_URL = () => process.env.KV_REST_API_URL?.replace(/\/$/, '') || null
const KV_TOKEN = () => process.env.KV_REST_API_TOKEN || null
const LOCAL_FILE = path.join(process.cwd(), 'data', 'research-logs.jsonl')
const IS_VERCEL = !!process.env.VERCEL

export interface SharedConversation {
  shareCode: string
  consentedAt: string
  schema: 'carevo-research-v1'
  messages: { role: 'user' | 'assistant'; content: string }[]
  careLevel: string | null
  factors: string[]
  engineVersion: string | null
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

export const researchStoreConfigured = () => !!(KV_URL() && KV_TOKEN()) || !IS_VERCEL

export async function saveSharedConversation(
  entry: Omit<SharedConversation, 'shareCode' | 'consentedAt' | 'schema'>,
): Promise<string | null> {
  const shareCode = randomBytes(5).toString('hex')   // 10 chars, user-quotable
  const full: SharedConversation = {
    shareCode, consentedAt: new Date().toISOString(), schema: 'carevo-research-v1', ...entry,
  }
  if (KV_URL() && KV_TOKEN()) {
    const set = await kv(['SET', `research:${shareCode}`, JSON.stringify(full)])
    if (set === null) return null
    await kv(['LPUSH', 'research:index', shareCode])
    await kv(['LTRIM', 'research:index', 0, 4999])
    return shareCode
  }
  if (IS_VERCEL) return null   // no durable store in prod → refuse, UI hides
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
  await fs.appendFile(LOCAL_FILE, JSON.stringify(full) + '\n')
  return shareCode
}

export async function listSharedConversations(limit = 100): Promise<SharedConversation[]> {
  if (KV_URL() && KV_TOKEN()) {
    const codes: string[] = (await kv(['LRANGE', 'research:index', 0, limit - 1])) ?? []
    if (!codes.length) return []
    const raw = await kv(['MGET', ...codes.map(c => `research:${c}`)])
    return (raw ?? []).filter(Boolean).map((r: string) => { try { return JSON.parse(r) } catch { return null } }).filter(Boolean)
  }
  try {
    const lines = (await fs.readFile(LOCAL_FILE, 'utf8')).trim().split('\n')
    return lines.slice(-limit).reverse().map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean) as SharedConversation[]
  } catch { return [] }
}

export async function deleteSharedConversation(shareCode: string): Promise<boolean> {
  if (!/^[a-f0-9]{10}$/.test(shareCode)) return false
  if (KV_URL() && KV_TOKEN()) {
    const n = await kv(['DEL', `research:${shareCode}`])
    return n === 1
  }
  try {
    const lines = (await fs.readFile(LOCAL_FILE, 'utf8')).trim().split('\n')
    const kept = lines.filter(l => !l.includes(`"shareCode":"${shareCode}"`))
    if (kept.length === lines.length) return false
    await fs.writeFile(LOCAL_FILE, kept.join('\n') + (kept.length ? '\n' : ''))
    return true
  } catch { return false }
}
