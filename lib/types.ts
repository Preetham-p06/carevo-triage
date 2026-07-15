export type CareLevel =
  | 'emergency'
  | 'er'
  | 'urgent_care'
  | 'primary_care'
  | 'telehealth'
  | 'home_care'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface TriageQuestion {
  type: 'question'
  text: string
  questionNumber: number
  /** Which feature the engine asked for (EVOI) — audit/debug */
  askedFor?: string
  /** Why the engine chose this question */
  askRationale?: string
}

export interface EvidenceCitation {
  org: string
  title: string
  url: string
}

export interface TriageRecommendation {
  type: 'recommendation'
  careLevel: CareLevel
  reasoning: string
  confidence: number
  urgency: 'critical' | 'high' | 'medium' | 'low'
  whatToExpect?: string
  selfCare?: string
  factors?: string[]
  featureKeys?: string[]
  /** Retrieved from the curated citation registry — never LLM-generated */
  evidence?: EvidenceCitation[]
  /** Retrieved knowledge-corpus guidance (with attribution + provenance) */
  warningSigns?: Array<{
    text: string; org: string; title: string; url: string
    publishedDate: string; evidenceStrength: string
    chunkId: string; chunkVersion: number; retrievalScore: number
  }>
  followUp?: {
    text: string; org: string; title: string; url: string
    publishedDate: string; evidenceStrength: string
    chunkId: string; chunkVersion: number; retrievalScore: number
  } | null
  /** Everything needed to reproduce this recommendation years later */
  provenance?: {
    engineVersion: string
    rulesetVersion: string
    kbVersion: string
    chunksUsed: string[]
  }
  /** Clinical rules that fired (ids) */
  rulesFired?: string[]
  /** True if uncertainty caused a round-up to the safer level */
  roundedUp?: boolean
  engineVersion?: string
  rulesetVersion?: string
}

export interface TriageEmergency {
  type: 'emergency'
  message: string
}

export type TriageResponse = TriageQuestion | TriageRecommendation | TriageEmergency

export interface Facility {
  name: string
  address: string
  distance?: string
  rating?: number
  openNow?: boolean
  placeId: string
  mapsUrl: string
}

export interface CostEstimate {
  min: number
  max: number
  label: string
}

export const CARE_LEVEL_CONFIG: Record<CareLevel, {
  label: string
  sublabel: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
  cost: CostEstimate | null
}> = {
  emergency: {
    label: 'Call 911 Now',
    sublabel: 'Life-threatening emergency',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: '🚨',
    cost: null,
  },
  er: {
    label: 'Go to the ER',
    sublabel: 'Emergency room — go now',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: '🏥',
    cost: { min: 1800, max: 3200, label: 'Emergency Room Visit' },
  },
  urgent_care: {
    label: 'Urgent Care',
    sublabel: 'Within the next 2–4 hours',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: '⚡',
    cost: { min: 150, max: 300, label: 'Urgent Care Visit' },
  },
  primary_care: {
    label: 'See Your Doctor',
    sublabel: 'Schedule within 1–3 days',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: '🩺',
    cost: { min: 100, max: 250, label: 'Primary Care Visit' },
  },
  telehealth: {
    label: 'Virtual Visit',
    sublabel: 'See a doctor online today',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: '💻',
    cost: { min: 50, max: 75, label: 'Telehealth Visit' },
  },
  home_care: {
    label: 'Rest at Home',
    sublabel: 'Self-care is appropriate',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: '🏠',
    cost: { min: 0, max: 30, label: 'OTC / Self-Care' },
  },
}
