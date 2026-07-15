// ─────────────────────────────────────────────────────────────────────────────
// Carevo Cost Estimation Engine v1.0 — DETERMINISTIC. Same house rule as
// routing: the LLM never computes or phrases a dollar figure. Every number
// comes from the versioned rates table (data/cost/rates-seed.json) and pure
// arithmetic; every estimate carries provenance (source URL + access date).
//
// Design decisions (product + safety):
//   1. RANGES, never point estimates. Real bills vary by facility and payer.
//   2. NO estimate for 'emergency' (911). A dollar figure on a 911 screen
//      could deter someone from calling. Enforced here and in eval gate P12.
//   3. 'er' estimates always ship with an EMTALA safety note: hospitals must
//      treat emergencies regardless of ability to pay — cost must never be a
//      reason to skip the ER when we've routed someone there.
//   4. Benefit math ladder (deterministic, most-specific wins):
//        uninsured            → cash price range
//        copay known + deductible met → copay (exact, from the user's plan)
//        deductible NOT met   → allowed-amount range (user pays until met)
//        otherwise            → typical insured out-of-pocket range from table
//   5. Estimates are informational, not a quote — GFE-style disclaimer on all.
// ─────────────────────────────────────────────────────────────────────────────
import { promises as fs } from 'fs'
import path from 'path'
import type { CareLevel } from '../types'

export const COST_ENGINE_VERSION = 'carevo-cost-2026.07.0'

export interface BenefitsProfile {
  payerType: 'commercial' | 'medicare' | 'medicaid' | 'uninsured'
  /** Plan copay for this care setting, in dollars, if the user knows it. */
  copay?: number
  /** Coinsurance fraction after deductible (0–1), if known. */
  coinsurance?: number
  deductibleMet?: boolean
  /** Where these benefits came from. 'eligibility_api' = verified 270/271. */
  source: 'manual' | 'eligibility_api'
}

export interface CostRange { low: number; high: number }

export interface CostEstimate {
  careLevel: CareLevel
  serviceDescription: string
  /** Typical billing codes for this setting — for the future MRF/API lookup. */
  billingCodes: string[]
  cash: CostRange
  insured: CostRange
  /** Which rung of the benefit ladder produced `insured`. */
  basis: 'cash_uninsured' | 'plan_copay' | 'deductible_not_met' | 'typical_insured'
  safetyNote?: string
  disclaimer: string
  provenance: { version: string; ratesVersion: string; sources: { label: string; url: string; accessed: string }[] }
}

interface RatesEntry {
  serviceDescription: string
  billingCodes: string[]
  cash: CostRange
  typicalInsured: CostRange
  /** Allowed-amount proxy used for the deductible-not-met rung. */
  allowedAmount: CostRange
  sources: { label: string; url: string; accessed: string }[]
}

export interface RatesTable {
  version: string
  region: string
  levels: Partial<Record<CareLevel, RatesEntry>>
}

const DISCLAIMER =
  'Estimate only — not a quote or a guarantee. Actual charges depend on your plan, ' +
  'the facility, and the care you receive. You can request a Good Faith Estimate ' +
  'from any provider before non-emergency care.'

const ER_SAFETY_NOTE =
  'If we recommended the ER, go — do not let cost stop you. By law (EMTALA), ' +
  'emergency departments must evaluate and stabilize you regardless of ability ' +
  'to pay, and hospitals offer payment plans and financial assistance.'

// Rates table is read once and cached by mtime, same pattern as calibration.
let cached: { table: RatesTable; mtimeMs: number } | null = null
async function loadRates(): Promise<RatesTable | null> {
  const p = path.join(process.cwd(), 'data', 'cost', 'rates-seed.json')
  try {
    const stat = await fs.stat(p)
    if (cached && cached.mtimeMs === stat.mtimeMs) return cached.table
    const table = JSON.parse(await fs.readFile(p, 'utf8')) as RatesTable
    cached = { table, mtimeMs: stat.mtimeMs }
    return table
  } catch {
    return null   // fail closed: no table → no estimate (never invent numbers)
  }
}

const round5 = (n: number) => Math.round(n / 5) * 5
const clampRange = (r: CostRange): CostRange => ({
  low: Math.max(0, round5(Math.min(r.low, r.high))),
  high: Math.max(0, round5(Math.max(r.low, r.high))),
})

export async function estimateCost(
  careLevel: CareLevel,
  benefits?: BenefitsProfile,
): Promise<CostEstimate | null> {
  const table = await loadRates()
  if (!table) return null
  return estimateCostFromTable(table, careLevel, benefits)
}

/** Pure, synchronous core — used by the runtime wrapper above and by the
 *  offline eval gates (P12), which are synchronous by design. */
export function estimateCostFromTable(
  table: RatesTable,
  careLevel: CareLevel,
  benefits?: BenefitsProfile,
): CostEstimate | null {
  // Rule 2: never attach money to a 911 recommendation.
  if (careLevel === 'emergency') return null

  const entry = table.levels?.[careLevel]
  if (!entry) return null

  // Benefit ladder (rule 4).
  let insured: CostRange
  let basis: CostEstimate['basis']
  if (benefits?.payerType === 'uninsured') {
    insured = entry.cash
    basis = 'cash_uninsured'
  } else if (benefits?.copay != null && benefits.copay >= 0 && benefits.deductibleMet) {
    insured = { low: benefits.copay, high: benefits.copay }
    basis = 'plan_copay'
  } else if (benefits && benefits.deductibleMet === false) {
    // User pays the allowed amount until the deductible is met; coinsurance
    // narrows the top of the range if known.
    const co = benefits.coinsurance
    insured = co != null && co > 0 && co < 1
      ? { low: entry.allowedAmount.low * co, high: entry.allowedAmount.high }
      : entry.allowedAmount
    basis = 'deductible_not_met'
  } else {
    insured = entry.typicalInsured
    basis = 'typical_insured'
  }

  return {
    careLevel,
    serviceDescription: entry.serviceDescription,
    billingCodes: entry.billingCodes,
    cash: clampRange(entry.cash),
    insured: clampRange(insured),
    basis,
    safetyNote: careLevel === 'er' ? ER_SAFETY_NOTE : undefined,
    disclaimer: DISCLAIMER,
    provenance: { version: COST_ENGINE_VERSION, ratesVersion: table.version, sources: entry.sources },
  }
}
