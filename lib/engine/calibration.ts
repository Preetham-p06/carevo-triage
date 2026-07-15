// ─────────────────────────────────────────────────────────────────────────────
// Carevo Calibration Layer v0 — the ONLY sanctioned down-adjuster.
//
// This is the runtime consumer of REE's clinician-approved calibration
// artifact. Every other mechanism in the engine can only RAISE acuity;
// this layer may lower an over-triaged decision toward a pattern's target —
// but only under five simultaneous conditions:
//
//   1. The promoted artifact contains a pattern whose trigger AND supporting
//      terms match the raw conversation text.
//   2. NONE of the pattern's boundary terms appear in the NEGATION-STRIPPED
//      text (so "no fever" cannot block, but "fever" does).
//   3. The extractor reported ZERO red flags.
//   4. No clinical rule floor and no raw-text safety floor fired.
//   5. The engine's decision is above the pattern's target and below ER —
//      er/emergency decisions are untouchable, and we never lower below
//      the pattern target.
//
// Provenance: only a PROMOTED artifact is loaded (data/calibration/
// promoted-calibration.json), written exclusively by
// scripts/ree/promote-calibration.ts after clinician review + juror pass.
// The smoke artifact in the training pack is never read by production.
// Every application is logged with the pattern name and the clinician-
// approved row ids it was learned from.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, statSync } from 'fs'
import path from 'path'
import { stripNegatedClauses } from '../emergency'
import type { ExtractedFeatures } from './features'
import { LEVEL_RANK, type EngineLevel } from './levels'

export interface PromotedPattern {
  name: string
  target: EngineLevel
  requiredAny: string[]
  supporting: string[]
  /** Deterministic blockers, checked against negation-stripped text */
  boundaryTerms: string[]
  /** Prose boundary from the artifact — audit/display only */
  safetyBoundary: string
  learnedFrom: string[]
}

export interface PromotedCalibration {
  version: string
  promotedAt: string
  promotedBy: string
  reviewedBy: string
  sourceArtifact: string
  patterns: PromotedPattern[]
}

export interface CalibrationResult {
  pattern: string
  from: EngineLevel
  to: EngineLevel
  learnedFrom: string[]
  version: string
}

const FILE = path.join(process.cwd(), 'data', 'calibration', 'promoted-calibration.json')
let cache: { cal: PromotedCalibration | null; mtimeMs: number } | null = null

export function loadPromotedCalibration(): PromotedCalibration | null {
  let mtimeMs = -1
  try { mtimeMs = statSync(FILE).mtimeMs } catch { /* nothing promoted yet */ }
  if (cache && cache.mtimeMs === mtimeMs) return cache.cal
  let cal: PromotedCalibration | null = null
  if (mtimeMs >= 0) {
    try {
      const parsed = JSON.parse(readFileSync(FILE, 'utf8')) as PromotedCalibration
      if (Array.isArray(parsed.patterns) && parsed.version && parsed.reviewedBy) cal = parsed
    } catch (err) {
      console.error('Promoted calibration unreadable — calibration disabled:', err)
    }
  }
  cache = { cal, mtimeMs }
  return cal
}

const has = (text: string, term: string) => text.includes(term.toLowerCase())

const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** Word-boundary matching for boundary terms — 'fever' must not match inside
 *  'hay fever' (an allergy descriptor, not pyrexia). */
function hasBoundaryTerm(text: string, term: string): boolean {
  const t = text.replace(/hay\s*fever/g, 'hay allergy')
  return new RegExp(`\\b${escapeRx(term.toLowerCase())}\\b`).test(t)
}

/**
 * Decide whether a clinician-approved calibration pattern applies.
 * Returns the adjustment to make, or null. NEVER call the result into
 * effect when a floor fired — the caller enforces conditions 3–5 with
 * its own state; this function re-checks everything it can see.
 */
export function applyCalibration(
  rawText: string,
  features: ExtractedFeatures,
  decisionLevel: EngineLevel,
  floorsFired: boolean,
): CalibrationResult | null {
  const cal = loadPromotedCalibration()
  if (!cal) return null

  // Conditions 3–5 (defense in depth — caller checks these too)
  if (features.redFlags.length > 0) return null
  if (floorsFired) return null
  if (LEVEL_RANK[decisionLevel] >= LEVEL_RANK.er) return null

  const raw = rawText.toLowerCase()
  const stripped = stripNegatedClauses(rawText).toLowerCase()

  for (const p of cal.patterns) {
    if (LEVEL_RANK[decisionLevel] <= LEVEL_RANK[p.target]) continue          // nothing to lower
    if (!p.requiredAny.some(t => has(raw, t))) continue                      // condition 1a
    if (!p.supporting.some(t => has(raw, t))) continue                       // condition 1b
    if (p.boundaryTerms.some(t => hasBoundaryTerm(stripped, t))) continue    // condition 2
    return {
      pattern: p.name,
      from: decisionLevel,
      to: p.target,
      learnedFrom: p.learnedFrom,
      version: cal.version,
    }
  }
  return null
}
