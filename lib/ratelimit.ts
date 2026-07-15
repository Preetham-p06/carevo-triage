// Simple in-memory sliding-window rate limiter (per-IP, per-route).
// Good for a single-instance demo; swap for Upstash/Redis in production.

const buckets = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter(t => now - t < windowMs)
  if (hits.length >= limit) {
    buckets.set(key, hits)
    return false
  }
  hits.push(now)
  buckets.set(key, hits)
  // Opportunistic cleanup so the map can't grow unbounded
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.every(t => now - t > windowMs)) buckets.delete(k)
    }
  }
  return true
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for') ?? ''
  return fwd.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
}

export const TOO_MANY = { error: 'Too many requests. Please slow down.' }
