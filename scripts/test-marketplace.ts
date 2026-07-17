// Smoke test for the CMS Marketplace adapter.
// Run AFTER adding MARKETPLACE_API_KEY to .env.local:
//   node node_modules/sucrase/bin/sucrase-node scripts/test-marketplace.ts
// Minimal .env.local loader (no dotenv dependency in this repo)
import { readFileSync } from 'fs'
try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* .env.local optional */ }

import { countyForZip, coverageOptions, marketplaceConfigured } from '../lib/cost/marketplace'

async function main() {
  if (!marketplaceConfigured()) {
    console.error('MARKETPLACE_API_KEY missing from .env.local — add it first.')
    process.exit(1)
  }
  // New Albany, OH
  const county = await countyForZip('43054')
  console.log('ZIP 43054 →', county ?? 'LOOKUP FAILED')
  if (!county) process.exit(1)

  const opts = await coverageOptions('43054', {
    income: 32_000,
    people: [{ age: 28, aptc_eligible: true }],
  })
  if (!opts) { console.error('coverageOptions returned null — check key/endpoints'); process.exit(1) }
  console.log('Likely Medicaid/CHIP:', opts.eligibility?.likelyMedicaidOrChip)
  console.log('Est. monthly credit:', opts.eligibility?.estimatedMonthlyCredit)
  console.log('Sample plans:')
  for (const p of opts.samplePlans) {
    console.log(`  ${p.metalLevel.padEnd(8)} $${p.monthlyPremium}/mo  deductible $${p.deductible ?? '?'}  ${p.issuer} — ${p.name.slice(0, 50)}`)
  }
  console.log('\n✔ Marketplace adapter working')
}
main()
