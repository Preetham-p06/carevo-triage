// Coverage options for uninsured users — CMS Marketplace API behind Carevo's
// own endpoint (the key stays server-side; the browser never sees it).
// Informational only: no routing influence, no PHI stored. nodejs runtime.
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { coverageOptions, marketplaceConfigured } from '@/lib/cost/marketplace'
import { rateLimit, clientIp, TOO_MANY } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  if (!rateLimit(`coverage:${clientIp(req)}`, 10, 60_000)) return NextResponse.json(TOO_MANY, { status: 429 })
  if (!marketplaceConfigured()) {
    return NextResponse.json({ configured: false, options: null })
  }
  try {
    const body = await req.json()
    const zipcode = String(body?.zipcode ?? '').trim()
    const income = Number(body?.income)
    const ages: number[] = Array.isArray(body?.ages) ? body.ages.map(Number).filter((n: number) => n >= 0 && n <= 120) : []
    if (!/^\d{5}$/.test(zipcode) || !Number.isFinite(income) || income < 0 || income > 5_000_000 || !ages.length || ages.length > 8) {
      return NextResponse.json({ error: 'zipcode (5 digits), income, and ages[] required' }, { status: 400 })
    }
    const options = await coverageOptions(zipcode, {
      income,
      people: ages.map(age => ({ age, aptc_eligible: true })),
    })
    return NextResponse.json({ configured: true, options })
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
}
