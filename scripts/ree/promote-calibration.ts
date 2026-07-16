// ─────────────────────────────────────────────────────────────────────────────
// Promote a smoke calibration artifact to production calibration.
// Run: npx tsx scripts/ree/promote-calibration.ts \
//        --artifact=data/recursive-learning/offline-training-pack-paul-round7/smoke-calibration-artifact.json \
//        --reviewed-by="Paul (clinical reviewer)" --confirm
//
// This is THE promotion step — deliberately manual. It:
//   1. Refuses to run without --confirm.
//   2. Converts each pattern's prose safety boundary into deterministic
//      boundaryTerms via the catalog below. A pattern with no boundary-term
//      entry is REJECTED (fail closed: no deterministic blockers → no
//      promotion).
//   3. Stamps provenance (who reviewed, source artifact, date) and writes
//      data/calibration/promoted-calibration.json — the only file the
//      runtime calibration layer reads.
// After promoting: run the offline eval (gate P10) and the full 240 gate
// before trusting the result.
// ─────────────────────────────────────────────────────────────────────────────

import { promises as fs } from 'fs'
import path from 'path'

// Deterministic boundary terms per pattern, derived from the clinician-
// approved prose boundaries. Reviewed alongside the promotion. Matching is
// case-insensitive substring against NEGATION-STRIPPED text at runtime.
const BOUNDARY_TERMS: Record<string, string[]> = {
  home_allergic_rhinitis_without_infection_flags: [
    'fever', 'facial pain', 'severe headache', 'trouble breathing', 'short of breath',
    'sinus pain', 'purulent', 'green discharge', 'yellow discharge', 'ear pain',
  ],
  home_mild_eye_irritation_without_vision_or_trauma_flags: [
    'sudden eye pain', 'photophobia', 'light sensitivity', 'blurred vision', 'blurry vision',
    'vision loss', 'vision change', 'trauma', 'injury', 'contact lens', 'severe pain', 'halos',
  ],
  home_rash_without_infection_flags: [
    'fever', 'pus', 'spreading', 'red streak', 'streaking', 'severe pain',
    'immunocompromised', 'chemo', 'transplant', 'systemic', 'blister', 'open sore',
  ],
  // Paul batch-3 conditions (2026-07-16) added to both URI patterns: ANY fever
  // (not just high), shortness of breath, and >7-day duration phrasings block.
  home_uri_cold_without_lower_respiratory_flags: [
    'fever', 'high fever', 'shortness of breath', 'short of breath', 'chest pain', 'wheezing', 'immunocompromised', 'chemo',
    'more than a week', 'over a week', 'two weeks', 'three weeks', '10 days', 'ten days', 'for weeks',
  ],
  home_mild_pharyngitis_without_red_flags: [
    'fever', 'high fever', 'exudate', 'difficulty swallowing', 'drooling', 'muffled voice', 'neck swelling', 'rash',
    'shortness of breath', 'short of breath',
    'more than a week', 'over a week', 'two weeks', 'three weeks', '10 days', 'ten days', 'for weeks',
  ],
  home_recurrent_aphthous_ulcers: [
    'eye lesions present', 'genital lesions present', 'genital ulcer', 'weight loss', 'fever',
    'immunocompromised', 'not healing', 'getting bigger',
  ],
  home_stye_without_orbital_flags: [
    'vision change', 'severe eye pain', 'proptosis', 'fever', 'spreading redness', 'both eyelids', 'trauma',
  ],
  home_mechanical_back_pain_without_neuro_flags: [
    'weakness', 'foot drop', 'bladder', 'bowel', 'saddle', 'numbness', 'tingling',
    'fever', 'trauma', 'accident', 'fall from', 'cancer', 'injection drug', 'iv drug',
  ],
}

const args = process.argv.slice(2)
const get = (k: string) => args.find(a => a.startsWith(`--${k}=`))?.slice(k.length + 3)
const artifactPath = get('artifact')
const reviewedBy = get('reviewed-by')
const confirm = args.includes('--confirm')
const allowFromEr = (get('allow-from-er') ?? '').split(',').map(s => s.trim()).filter(Boolean)

async function main() {
  if (!artifactPath || !reviewedBy || !confirm) {
    console.error('Usage: promote-calibration.ts --artifact=<path> --reviewed-by="<name>" --confirm')
    console.error('Promotion is a human decision — all three arguments are required.')
    process.exit(1)
  }

  const artifact = JSON.parse(await fs.readFile(artifactPath, 'utf8'))
  const patterns = (artifact.patterns ?? artifact.learnedPatterns ?? artifact) as any[]
  if (!Array.isArray(patterns) || !patterns.length) {
    console.error('Artifact has no patterns array — refusing to promote.')
    process.exit(1)
  }

  const promoted: any[] = []
  const rejected: string[] = []
  for (const p of patterns) {
    const boundaryTerms = BOUNDARY_TERMS[p.name]
    if (!boundaryTerms) { rejected.push(p.name); continue }   // fail closed
    if (!Array.isArray(p.learnedFrom) || !p.learnedFrom.length) { rejected.push(`${p.name} (no clinician trace)`); continue }
    promoted.push({
      name: p.name,
      target: p.target,
      requiredAny: p.requiredAny,
      supporting: p.supporting,
      boundaryTerms,
      safetyBoundary: p.safetyBoundary,
      learnedFrom: p.learnedFrom,
      allowFromEr: allowFromEr.includes(p.name) || undefined,
    })
  }

  if (!promoted.length) {
    console.error('Nothing promotable (all patterns rejected):', rejected)
    process.exit(1)
  }

  const out = {
    version: `carevo-calibration-${new Date().toISOString().slice(0, 10)}.1`,
    promotedAt: new Date().toISOString(),
    promotedBy: 'promote-calibration.ts (manual --confirm)',
    reviewedBy,
    sourceArtifact: artifactPath,
    patterns: promoted,
  }
  const outPath = path.join(process.cwd(), 'data', 'calibration', 'promoted-calibration.json')
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, JSON.stringify(out, null, 2))

  console.log(JSON.stringify({
    promoted: promoted.map(p => p.name),
    rejected,
    version: out.version,
    output: outPath,
    next: 'Run offline eval (gate P10) and the full 240 gate before trusting this.',
  }, null, 2))
}

main()
