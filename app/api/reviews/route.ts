// Public review submission (rate-limited, sanitized) + admin listing
// (METRICS_KEY-gated, same auth pattern as /api/research/logs).
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { saveReview, listReviews, reviewStoreConfigured } from '@/lib/research/reviewStore'
import { rateLimit, clientIp, TOO_MANY } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'

export async function POST(req: NextRequest) {
  if (!rateLimit(`reviews:${clientIp(req)}`, 3, 60_000)) return NextResponse.json(TOO_MANY, { status: 429 })
  if (!reviewStoreConfigured()) return NextResponse.json({ configured: false })
  try {
    const body = await req.json()
    const rating = Number(body?.rating)
    const text = sanitize(String(body?.text ?? '')).trim().slice(0, 600)
    const name = body?.name ? sanitize(String(body.name)).trim().slice(0, 60) : null
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || text.length < 3) {
      return NextResponse.json({ error: 'rating (1-5) and a short review are required' }, { status: 400 })
    }
    const id = await saveReview(rating, text, name || null)
    if (!id) return NextResponse.json({ configured: false })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  if (!rateLimit(`reviews-admin:${clientIp(req)}`, 30, 60_000)) return NextResponse.json(TOO_MANY, { status: 429 })
  const key = process.env.METRICS_KEY
  const provided = req.headers.get('x-metrics-key') ?? new URL(req.url).searchParams.get('key') ?? ''
  if (!key || provided !== key) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const reviews = await listReviews(200)
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null
  return NextResponse.json({ count: reviews.length, average: avg ? Math.round(avg * 10) / 10 : null, reviews })
}
