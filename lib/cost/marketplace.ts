// ─────────────────────────────────────────────────────────────────────────────
// CMS Marketplace API adapter (developer.cms.gov/marketplace-api) — the API
// that powers HealthCare.gov. Free key, auto-rotates every 60 days via email.
//
// Role in Carevo: DATA SOURCE ONLY, same house rule as everything else — the
// API supplies plan/eligibility facts; Carevo's deterministic cost engine
// does all math and the Route Engine owns all routing. Nothing here can
// affect a care-level decision.
//
// What it covers: ACA exchange plans + Medicaid/CHIP eligibility estimates.
// What it does NOT cover: employer plans, real-time 270/271 deductible
// status (that's the compliance-gated Stedi tier in eligibility.ts).
//
// Env: MARKETPLACE_API_KEY. Fail-closed: no key or any error → null, callers
// degrade gracefully (feature simply doesn't render).
// ─────────────────────────────────────────────────────────────────────────────

const BASE = 'https://marketplace.api.healthcare.gov/api/v1'
const key = () => process.env.MARKETPLACE_API_KEY?.replace(/["']/g, '').replace(/\s+/g, '') || null

async function mkFetch(path: string, init?: RequestInit): Promise<any | null> {
  const k = key()
  if (!k) return null
  try {
    const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}apikey=${k}`
    const res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      // A slow upstream must never hang a Carevo request.
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null   // fail closed, never throw into the caller
  }
}

export interface HouseholdInput {
  income: number          // annual household income, dollars
  people: { age: number; aptc_eligible?: boolean; gender?: string; uses_tobacco?: boolean }[]
}

export interface CoverageOptions {
  /** county FIPS used for the lookup (first county of the ZIP) */
  countyfips: string
  state: string
  zipcode: string
  /** CMS estimates: is the household likely Medicaid/CHIP eligible, and
   *  estimated premium tax credit for marketplace plans */
  eligibility: {
    likelyMedicaidOrChip: boolean
    estimatedMonthlyCredit: number | null
    raw: unknown
  } | null
  /** cheapest silver + cheapest overall plan as reference points */
  samplePlans: { name: string; issuer: string; metalLevel: string; monthlyPremium: number; deductible: number | null }[]
  provenance: { source: 'CMS Marketplace API (healthcare.gov)'; retrievedAt: string }
}

/** ZIP → county FIPS (marketplace lookups are county-based). */
export async function countyForZip(zipcode: string): Promise<{ fips: string; state: string } | null> {
  const j = await mkFetch(`/counties/by/zip/${encodeURIComponent(zipcode)}`)
  const c = j?.counties?.[0]
  return c ? { fips: c.fips, state: c.state } : null
}

/**
 * One call for the product feature: "you finished triage, you're uninsured —
 * here's what coverage could look like for you." Returns null when the key
 * is missing or anything upstream fails.
 */
export async function coverageOptions(zipcode: string, household: HouseholdInput, year?: number): Promise<CoverageOptions | null> {
  const county = await countyForZip(zipcode)
  if (!county) return null
  const planYear = year ?? new Date().getFullYear()

  const eligBody = {
    household: { income: household.income, people: household.people },
    market: 'Individual',
    place: { countyfips: county.fips, state: county.state, zipcode },
    year: planYear,
  }
  const [elig, plans] = await Promise.all([
    mkFetch('/households/eligibility/estimates', { method: 'POST', body: JSON.stringify(eligBody) }),
    mkFetch('/plans/search', {
      method: 'POST',
      body: JSON.stringify({ ...eligBody, limit: 5, order: 'asc', sort: 'premium' }),
    }),
  ])

  const estimates = Array.isArray(elig?.estimates) ? elig.estimates : elig?.estimates ? [elig.estimates] : []
  const anyMedicaid = estimates.some((e: any) => e?.is_medicaid_chip === true) ||
    (Array.isArray(elig?.people) && elig.people.some((p: any) => p?.is_medicaid_chip === true))
  const credit = estimates.length ? (estimates[0]?.aptc ?? null) : (elig?.estimates?.aptc ?? null)

  const samplePlans = (plans?.plans ?? []).slice(0, 5).map((p: any) => ({
    name: String(p?.name ?? 'Plan'),
    issuer: String(p?.issuer?.name ?? 'Issuer'),
    metalLevel: String(p?.metal_level ?? ''),
    monthlyPremium: Number(p?.premium ?? 0),
    deductible: p?.deductibles?.[0]?.amount != null ? Number(p.deductibles[0].amount) : null,
  }))

  if (!elig && !samplePlans.length) return null
  return {
    countyfips: county.fips,
    state: county.state,
    zipcode,
    eligibility: elig ? { likelyMedicaidOrChip: !!anyMedicaid, estimatedMonthlyCredit: credit != null ? Number(credit) : null, raw: elig } : null,
    samplePlans,
    provenance: { source: 'CMS Marketplace API (healthcare.gov)', retrievedAt: new Date().toISOString() },
  }
}

/** True when the adapter is configured (used by routes to advertise the feature). */
export const marketplaceConfigured = () => !!key()
