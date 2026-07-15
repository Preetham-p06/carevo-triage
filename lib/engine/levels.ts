// Shared care-level definitions. Split from model.ts so the rule layer and
// the scoring model can both import them without circular dependencies.

export type EngineLevel = 'home_care' | 'telehealth' | 'primary_care' | 'urgent_care' | 'er' | 'emergency'

/** The five levels the probabilistic model scores ('emergency' is rule-only). */
export const SCORED_LEVELS: Exclude<EngineLevel, 'emergency'>[] =
  ['home_care', 'telehealth', 'primary_care', 'urgent_care', 'er']

export const LEVEL_RANK: Record<EngineLevel, number> = {
  home_care: 0, telehealth: 1, primary_care: 2, urgent_care: 3, er: 4, emergency: 5,
}
