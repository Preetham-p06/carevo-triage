import type { Message } from '@/lib/types'
import type { ExtractedFeatures } from '@/lib/engine/features'
import type { EngineDecision } from '@/lib/engine/model'
import type { EngineLevel } from '@/lib/engine/levels'

const LEVEL_TO_RANK: Record<EngineLevel, number> = {
  home_care: 1,
  telehealth: 2,
  primary_care: 3,
  urgent_care: 4,
  er: 5,
  emergency: 6,
}

interface ReeTelemetryInput {
  messages: Message[]
  features?: ExtractedFeatures
  questionsAsked: number
  careLevel: EngineLevel
  totalTokensUsed: number
  engineVersion: string
  rulesetVersion: string
  kbVersion?: string
  decision?: EngineDecision
  metadata?: Record<string, unknown>
}

function enabled(): boolean {
  return process.env.REE_TELEMETRY_ENABLED === '1'
}

function endpoint(): string | undefined {
  return process.env.REE_TELEMETRY_ENDPOINT?.trim() || undefined
}

function bearer(): string | undefined {
  return process.env.REE_TELEMETRY_SECRET?.trim() || undefined
}

export function careLevelRank(level: EngineLevel): number {
  return LEVEL_TO_RANK[level]
}

export async function recordReeTelemetry(input: ReeTelemetryInput): Promise<void> {
  if (!enabled()) return

  const url = endpoint()
  if (!url) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[ree-telemetry-disabled]', JSON.stringify({
        reason: 'REE_TELEMETRY_ENDPOINT is not configured',
        careLevel: input.careLevel,
        questionsAsked: input.questionsAsked,
        totalTokensUsed: input.totalTokensUsed,
      }))
    }
    return
  }

  const payload = {
    conversation_history: input.messages,
    final_json_vector: {
      type: 'features',
      features: input.features ?? null,
      decision: input.decision ? {
        careLevel: input.decision.careLevel,
        confidence: input.decision.confidence,
        floorApplied: input.decision.floorApplied,
        rulesFired: input.decision.rulesFired.map(r => r.id),
        distribution: input.decision.distribution,
        featureKeys: input.decision.featureKeys,
      } : null,
    },
    total_turns: input.questionsAsked,
    final_care_level: careLevelRank(input.careLevel),
    final_care_level_label: input.careLevel,
    is_over_triage: false,
    total_tokens_used: input.totalTokensUsed,
    engine_version: input.engineVersion,
    ruleset_version: input.rulesetVersion,
    kb_version: input.kbVersion,
    metadata: input.metadata ?? {},
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bearer() ? { Authorization: `Bearer ${bearer()}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2500),
    })
  } catch (err) {
    console.error('[ree-telemetry-failed]', err instanceof Error ? err.message : String(err))
  }
}
