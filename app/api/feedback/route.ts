export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { applyFeedback, isValidFeatureKey, type EngineLevel } from '@/lib/engine/model'
import { loadAdjustments, saveAdjustments } from '@/lib/engine/persistence'
import { rateLimit, clientIp, TOO_MANY } from '@/lib/ratelimit'
import { feedbackSchema, getFieldErrors } from '@/lib/validation'

// Learning loop: outcome feedback nudges the routing model's weights.
// Hardened against poisoning: rate-limited, keys validated against the model's
// known vocabulary, capped count, deltas clamped. Safety floors are untouchable.
export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`fb:${clientIp(req)}`, 10, 60_000)) {
      return NextResponse.json(TOO_MANY, { status: 429 })
    }

    // Server-side re-validation (never trust the client)
    const parsed = feedbackSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: getFieldErrors(parsed.error) },
        { status: 400 },
      )
    }
    const { featureKeys, careLevel, outcome } = parsed.data

    if (outcome === 'did_not_go') {
      return NextResponse.json({ ok: true, learned: false })
    }

    // Only accept feature keys the model actually knows — no arbitrary writes
    const keys = featureKeys.filter(isValidFeatureKey).slice(0, 20)

    if (!keys.length) {
      return NextResponse.json({ ok: true, learned: false })
    }

    const adjustments = await loadAdjustments()
    const next = applyFeedback(adjustments, keys, careLevel as EngineLevel, outcome as 'right_place' | 'wrong_place')
    await saveAdjustments(next)

    return NextResponse.json({ ok: true, learned: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
