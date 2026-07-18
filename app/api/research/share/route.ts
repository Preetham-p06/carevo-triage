// Consent-gated conversation sharing. Called ONLY when the user ticks the
// un-checked box and presses Share on the results screen. Stores the
// conversation + recommendation with NO identifiers; returns a share code
// the user can quote to request deletion. nodejs runtime (storage layer).
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { saveSharedConversation, researchStoreConfigured } from '@/lib/research/consentStore'
import { rateLimit, clientIp, TOO_MANY } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'

export async function POST(req: NextRequest) {
  if (!rateLimit(`research:${clientIp(req)}`, 5, 60_000)) return NextResponse.json(TOO_MANY, { status: 429 })
  if (!researchStoreConfigured()) return NextResponse.json({ configured: false })
  try {
    const body = await req.json()
    // Consent must be explicit in the payload — belt and suspenders with the UI.
    if (body?.consent !== true) return NextResponse.json({ error: 'consent required' }, { status: 400 })
    const messages = Array.isArray(body?.messages) ? body.messages : []
    if (!messages.length || messages.length > 40) return NextResponse.json({ error: 'invalid conversation' }, { status: 400 })
    const clean = messages.map((m: any) => ({
      role: m?.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: sanitize(String(m?.content ?? '')).slice(0, 2000),
    }))
    const shareCode = await saveSharedConversation({
      messages: clean,
      careLevel: typeof body?.careLevel === 'string' ? body.careLevel.slice(0, 30) : null,
      factors: Array.isArray(body?.factors) ? body.factors.slice(0, 5).map((f: any) => String(f).slice(0, 200)) : [],
      engineVersion: typeof body?.engineVersion === 'string' ? body.engineVersion.slice(0, 60) : null,
    })
    if (!shareCode) return NextResponse.json({ configured: false })
    return NextResponse.json({ ok: true, shareCode })
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
}
