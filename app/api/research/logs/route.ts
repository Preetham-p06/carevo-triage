// Admin-only viewer API for consent-shared conversations. Gated by
// METRICS_KEY (same pattern as the metrics dashboard). Also handles
// deletion by share code (user deletion requests come through you).
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { listSharedConversations, deleteSharedConversation } from '@/lib/research/consentStore'
import { metricsSummary } from '@/lib/research/metricsStore'
import { rateLimit, clientIp, TOO_MANY } from '@/lib/ratelimit'

function authorized(req: NextRequest): boolean {
  const key = process.env.METRICS_KEY
  if (!key) return false   // fail closed: no admin key configured → no access
  const provided = req.headers.get('x-metrics-key') ?? new URL(req.url).searchParams.get('key') ?? ''
  return provided === key
}

export async function GET(req: NextRequest) {
  if (!rateLimit(`research-admin:${clientIp(req)}`, 30, 60_000)) return NextResponse.json(TOO_MANY, { status: 429 })
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const [logs, metrics] = await Promise.all([listSharedConversations(200), metricsSummary()])
  return NextResponse.json({ count: logs.length, logs, metrics })
}

export async function DELETE(req: NextRequest) {
  if (!rateLimit(`research-admin:${clientIp(req)}`, 30, 60_000)) return NextResponse.json(TOO_MANY, { status: 429 })
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const shareCode = new URL(req.url).searchParams.get('code') ?? ''
  const ok = await deleteSharedConversation(shareCode)
  return NextResponse.json({ deleted: ok })
}
