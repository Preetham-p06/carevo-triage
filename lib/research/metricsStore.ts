// KV-backed metrics counters — durable, private, first-party aggregate only.
// No cookies, no PII, no third parties (keeps the "no trackers" privacy stance
// intact): we count events, never identify people. Falls back to a local file
// in dev; returns zeros when KV is absent in prod (fail-closed, never throws).
import { promises as fs } from 'fs'
import path from 'path'

const KV_URL = () => process.env.KV_REST_API_URL?.replace(/\/$/, '') || null
const KV_TOKEN = () => process.env.KV_REST_API_TOKEN || null
const LOCAL = path.join(process.cwd(), 'data', 'metrics.json')

async function kv(command: unknown[]): Promise<any | null> {
  const url = KV_URL(), token = KV_TOKEN()
  if (!url || !token) return null
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(4_000),
    })
    if (!res.ok) return null
    return (await res.json())?.result ?? null
  } catch { return null }
}

// ── local dev fallback ──
async function localRead(): Promise<Record<string, number>> {
  try { return JSON.parse(await fs.readFile(LOCAL, 'utf8')) } catch { return {} }
}
async function localWrite(o: Record<string, number>) {
  try { await fs.mkdir(path.dirname(LOCAL), { recursive: true }); await fs.writeFile(LOCAL, JSON.stringify(o)) } catch {}
}

/** Increment a named counter. Fire-and-forget safe (never throws). */
export async function bump(name: string, by = 1): Promise<void> {
  if (KV_URL() && KV_TOKEN()) { await kv(['INCRBY', `m:${name}`, by]); return }
  const o = await localRead(); o[name] = (o[name] ?? 0) + by; await localWrite(o)
}

/** Record a live heartbeat for presence counting (rolling 5-minute window). */
export async function heartbeat(sessionId: string): Promise<void> {
  const now = Date.now()
  if (KV_URL() && KV_TOKEN()) {
    await kv(['ZADD', 'm:presence', now, sessionId])
    await kv(['ZREMRANGEBYSCORE', 'm:presence', 0, now - 300_000])   // trim >5 min old
    return
  }
  // dev: no presence tracking, keep it simple
}

async function activeNow(): Promise<number> {
  if (KV_URL() && KV_TOKEN()) {
    const n = await kv(['ZCOUNT', 'm:presence', Date.now() - 300_000, '+inf'])
    return Number(n) || 0
  }
  return 0
}

async function counter(name: string): Promise<number> {
  if (KV_URL() && KV_TOKEN()) return Number(await kv(['GET', `m:${name}`])) || 0
  return (await localRead())[name] ?? 0
}

export interface MetricsSummary {
  activeNow: number
  pageViews: number
  triageSessions: number
  recommendations: number
  emergencyStops: number
  tokensUsed: number
  estCostUsd: number
}

export async function metricsSummary(): Promise<MetricsSummary> {
  const [activeN, pageViews, triage, recs, er, tokens] = await Promise.all([
    activeNow(), counter('pageviews'), counter('triage_sessions'),
    counter('recommendations'), counter('emergency_stops'), counter('tokens'),
  ])
  // gpt-4o-mini blended ~$0.30 / 1M tokens (rough — for a founder gut-check, not billing)
  const estCostUsd = Math.round((tokens / 1_000_000) * 0.30 * 100) / 100
  return { activeNow: activeN, pageViews, triageSessions: triage, recommendations: recs, emergencyStops: er, tokensUsed: tokens, estCostUsd }
}
