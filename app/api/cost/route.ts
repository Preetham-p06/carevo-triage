// Cost estimate endpoint. Deterministic: careLevel (+ optional user-entered
// benefits) → range estimate from the versioned rates table. No LLM anywhere
// in this path. nodejs runtime — the engine reads data/cost/rates-seed.json
// from disk (edge would silently break it, same trap as the triage route).
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import type { CareLevel } from '@/lib/types'
import { estimateCost } from '@/lib/cost/engine'
import { manualBenefits } from '@/lib/cost/eligibility'

const VALID_LEVELS: CareLevel[] = ['emergency', 'er', 'urgent_care', 'primary_care', 'telehealth', 'home_care']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const careLevel = body?.careLevel as CareLevel
    if (!VALID_LEVELS.includes(careLevel)) {
      return NextResponse.json({ error: 'invalid careLevel' }, { status: 400 })
    }
    const benefits = body?.benefits ? manualBenefits(body.benefits) : undefined
    const estimate = await estimateCost(careLevel, benefits ?? undefined)
    // estimate === null is a valid answer (emergency, or rates table absent):
    // the UI simply shows no cost card. Never invent a number.
    return NextResponse.json({ estimate })
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
}
