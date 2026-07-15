// ─────────────────────────────────────────────────────────────────────────────
// Eligibility sources — where a BenefitsProfile can come from.
//
// Tier 1 (LIVE): manual entry. The user tells us payer type / copay /
//   deductible status on the results screen; we validate and pass it to the
//   deterministic cost engine. No PHI leaves Carevo, no keys needed.
//
// Tier 2 (READY, NOT ENABLED): a real-time 270/271 eligibility API. Adapter
//   interface below is what a provider must satisfy. Candidates evaluated
//   2026-07-15:
//     - Stedi   (stedi.com/eligibility-checks): per-transaction, no monthly
//       minimum, JSON API. Env: STEDI_API_KEY. Best fit for our stage.
//     - pVerify (pverify.com): ~$99/mo + per-check, REST/FHIR.
//   Enabling tier 2 is a business + compliance decision (BAA, member-ID
//   collection = PHI handling) — NOT a code flip. Do not add the key until
//   that review is done. The adapter fails closed to null → engine falls back
//   to typical-insured ranges, so the product degrades gracefully.
// ─────────────────────────────────────────────────────────────────────────────
import type { BenefitsProfile } from './engine'

export interface EligibilityQuery {
  payerName?: string
  memberId?: string
  dateOfBirth?: string
  serviceType?: string
}

export interface EligibilitySource {
  readonly name: string
  checkBenefits(q: EligibilityQuery): Promise<BenefitsProfile | null>
}

/** Tier 1: sanitize user-entered benefits. Deterministic, no network. */
export function manualBenefits(input: {
  payerType?: string
  copay?: unknown
  coinsurance?: unknown
  deductibleMet?: unknown
}): BenefitsProfile | null {
  const payerType = ['commercial', 'medicare', 'medicaid', 'uninsured'].includes(String(input.payerType))
    ? (input.payerType as BenefitsProfile['payerType'])
    : null
  if (!payerType) return null
  const num = (v: unknown, min: number, max: number): number | undefined => {
    const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
    return Number.isFinite(n) && n >= min && n <= max ? n : undefined
  }
  return {
    payerType,
    copay: num(input.copay, 0, 5000),
    coinsurance: num(input.coinsurance, 0, 1),
    deductibleMet: typeof input.deductibleMet === 'boolean' ? input.deductibleMet : undefined,
    source: 'manual',
  }
}

/**
 * Tier 2 stub: real 270/271 check via Stedi. Intentionally inert until
 * STEDI_API_KEY exists AND the compliance review is signed off. Fails closed.
 */
export const stediAdapter: EligibilitySource = {
  name: 'stedi',
  async checkBenefits(): Promise<BenefitsProfile | null> {
    if (!process.env.STEDI_API_KEY) return null
    // TODO(compliance-gated): POST /change/medicalnetwork/eligibility/v3 with
    // payer ID + member ID; map deductible remaining / copay / coinsurance
    // from the 271 response into BenefitsProfile { source: 'eligibility_api' }.
    return null
  },
}
