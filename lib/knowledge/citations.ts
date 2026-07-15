// ─────────────────────────────────────────────────────────────────────────────
// Carevo Knowledge Layer v0 — curated citation registry.
//
// Evidence shown to patients is RETRIEVED from this registry, never generated
// by the LLM. This structurally eliminates hallucinated citations. Every
// clinical rule (lib/engine/rules.ts) must reference a key in this registry.
//
// Sources are limited to trusted organizations: CDC, NIH/MedlinePlus, AHA,
// ACEP, AAP, ACOG, ACAAI, AAO, 988 Lifeline, Stop the Bleed. URLs point at
// stable topic pages (not deep links) to minimize link rot.
// ─────────────────────────────────────────────────────────────────────────────

export interface Citation {
  /** Issuing organization, as shown to the patient */
  org: string
  title: string
  url: string
}

export const CITATIONS = {
  'aha-heart-attack-signs': {
    org: 'American Heart Association',
    title: 'Warning Signs of a Heart Attack',
    url: 'https://www.heart.org/en/health-topics/heart-attack/warning-signs-of-a-heart-attack',
  },
  'cdc-stroke-signs': {
    org: 'CDC',
    title: 'Signs and Symptoms of Stroke',
    url: 'https://www.cdc.gov/stroke/signs-symptoms/',
  },
  'medlineplus-breathing': {
    org: 'NIH / MedlinePlus',
    title: 'Breathing Problems',
    url: 'https://medlineplus.gov/breathingproblems.html',
  },
  'medlineplus-fainting': {
    org: 'NIH / MedlinePlus',
    title: 'Fainting',
    url: 'https://medlineplus.gov/fainting.html',
  },
  'ninds-headache': {
    org: 'NIH / NINDS',
    title: 'Headache: Hope Through Research',
    url: 'https://www.ninds.nih.gov/health-information/disorders/headache',
  },
  'stop-the-bleed': {
    org: 'Stop the Bleed (ACS)',
    title: 'Severe Bleeding Response',
    url: 'https://www.stopthebleed.org/',
  },
  'medlineplus-dehydration': {
    org: 'NIH / MedlinePlus',
    title: 'Dehydration',
    url: 'https://medlineplus.gov/dehydration.html',
  },
  'cdc-meningitis': {
    org: 'CDC',
    title: 'Meningitis Signs and Symptoms',
    url: 'https://www.cdc.gov/meningitis/',
  },
  'aao-vision': {
    org: 'American Academy of Ophthalmology',
    title: 'Eye Symptoms That Need Urgent Care',
    url: 'https://www.aao.org/eye-health/symptoms',
  },
  'acog-pregnancy-bleeding': {
    org: 'ACOG',
    title: 'Bleeding During Pregnancy',
    url: 'https://www.acog.org/womens-health/faqs/bleeding-during-pregnancy',
  },
  'acaai-anaphylaxis': {
    org: 'ACAAI',
    title: 'Anaphylaxis Symptoms',
    url: 'https://acaai.org/allergies/symptoms/anaphylaxis/',
  },
  '988-lifeline': {
    org: '988 Suicide & Crisis Lifeline',
    title: 'Call or Text 988',
    url: 'https://988lifeline.org/',
  },
  'aap-febrile-infant': {
    org: 'American Academy of Pediatrics',
    title: 'Febrile Infants 8–60 Days Old (Clinical Practice Guideline, 2021)',
    url: 'https://publications.aap.org/pediatrics/article/148/2/e2021052228/179783',
  },
  'acep-when-to-go': {
    org: 'American College of Emergency Physicians',
    title: 'Know When to Go: Emergency vs. Urgent Care',
    url: 'https://www.emergencyphysicians.org/article/know-when-to-go',
  },
  'cdc-fever-immunocompromised': {
    org: 'CDC',
    title: 'Infection Risk When Immune Systems Are Weakened',
    url: 'https://www.cdc.gov/cancer-preventing-infections/',
  },
  'healthychildren-fever': {
    org: 'AAP / HealthyChildren.org',
    title: 'Fever in Young Children',
    url: 'https://www.healthychildren.org/English/health-issues/conditions/fever/',
  },
} as const satisfies Record<string, Citation>

export type CitationKey = keyof typeof CITATIONS

/** Look up citations by key — the ONLY way evidence enters a response. */
export function getCitations(keys: readonly CitationKey[]): Citation[] {
  const seen = new Set<string>()
  const out: Citation[] = []
  for (const k of keys) {
    const c = CITATIONS[k]
    if (c && !seen.has(c.url)) { seen.add(c.url); out.push(c) }
  }
  return out
}
