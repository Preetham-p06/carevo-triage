export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, clientIp, TOO_MANY } from '@/lib/ratelimit'
import { metricsEventSchema } from '@/lib/validation'

// Edge runtime: metrics are in-memory only (reset per cold start — fine for demo).

const VALID_CARE_LEVELS = new Set(['emergency', 'er', 'urgent_care', 'primary_care', 'telehealth', 'home_care'])
const VALID_OUTCOMES = new Set(['right_place', 'wrong_place', 'did_not_go'])

interface MetricsData {
  totals: Record<string, number>
  daily: Record<string, Record<string, number>>   // YYYY-MM-DD -> event -> count
  careLevels: Record<string, number>
  outcomes: Record<string, number>
}

const EMPTY: MetricsData = { totals: {}, daily: {}, careLevels: {}, outcomes: {} }

async function load(): Promise<MetricsData> {
  return structuredClone(EMPTY)
}

async function save(_data: MetricsData) {
  // No-op in edge runtime — metrics not persisted between requests.
}

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`metrics:${clientIp(req)}`, 60, 60_000)) {
      return NextResponse.json(TOO_MANY, { status: 429 })
    }

    // Server-side validation — only known events are counted (no junk-event spam)
    const parsed = metricsEventSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Bad event' }, { status: 400 })
    }
    const { event, meta } = parsed.data

    const data = await load()
    data.totals[event] = (data.totals[event] ?? 0) + 1

    const day = new Date().toISOString().slice(0, 10)
    data.daily[day] = data.daily[day] ?? {}
    data.daily[day][event] = (data.daily[day][event] ?? 0) + 1

    const careLevel = meta?.careLevel ?? ''
    const outcome = meta?.outcome ?? ''
    if (event === 'triage_completed' && VALID_CARE_LEVELS.has(careLevel)) {
      data.careLevels[careLevel] = (data.careLevels[careLevel] ?? 0) + 1
    }
    if (event === 'outcome_feedback' && VALID_OUTCOMES.has(outcome)) {
      data.outcomes[outcome] = (data.outcomes[outcome] ?? 0) + 1
    }

    await save(data)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// Dashboard read — protected by METRICS_KEY when set (recommended in production)
export async function GET(req: NextRequest) {
  const requiredKey = process.env.METRICS_KEY
  if (requiredKey) {
    const provided = req.nextUrl.searchParams.get('key') ?? req.headers.get('x-metrics-key')
    if (provided !== requiredKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  const data = await load()
  return NextResponse.json(data)
}
