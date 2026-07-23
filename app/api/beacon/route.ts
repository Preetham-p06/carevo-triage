// Privacy-preserving presence + pageview beacon. No cookies, no PII — the
// client sends a random per-tab id only so we can count distinct live tabs.
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { bump, heartbeat } from '@/lib/research/metricsStore'
import { rateLimit, clientIp } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  // generous limit — heartbeats fire every ~45s per open tab
  if (!rateLimit(`beacon:${clientIp(req)}`, 120, 60_000)) return NextResponse.json({ ok: false })
  try {
    const { id, firstView } = await req.json()
    const sid = typeof id === 'string' ? id.slice(0, 40).replace(/[^a-z0-9-]/gi, '') : ''
    if (sid) await heartbeat(sid)
    if (firstView === true) await bump('pageviews')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
