// ─────────────────────────────────────────────────────────────────────────────
// Carevo Decision Audit Log v0 — append-only, hash-chained, replayable.
//
// Every routing decision is recorded with the exact inputs and component
// versions that produced it, so any historical decision can be replayed
// bit-for-bit (invariant I4) and the log is tamper-evident: each record
// carries the SHA-256 of its predecessor, so editing any past record breaks
// the chain. Server-only (Node runtime — the compliance posture requires a
// durable, verifiable trail; console-only logging is not an audit trail).
// No free-text PHI is written — features are the structured vector plus the
// one-line summary the patient already approved.
//
// V0 storage is a JSONL file (matches the current persistence layer); the
// interface is deliberately storage-agnostic so Phase 2 can move it to an
// append-only Postgres partition without touching callers.
// ─────────────────────────────────────────────────────────────────────────────

import { promises as fs } from 'fs'
import path from 'path'
import { createHash, randomUUID } from 'crypto'
import type { ExtractedFeatures, PatientRisk } from './features'
import type { EngineDecision } from './model'

const FILE = path.join(process.cwd(), 'data', 'decision-audit.jsonl')

export interface AuditRecord {
  id: string
  ts: string
  kind: 'recommendation' | 'emergency' | 'self_harm'
  features?: ExtractedFeatures
  knownFields?: string[]
  riskModifiers?: string[]
  questionsAsked?: number
  decision?: {
    careLevel: string
    confidence: number
    floorApplied: string | null
    rulesFired: string[]
    distribution: Record<string, number>
    roundedUp: boolean
  }
  /** Exact guidance chunks (id@version) shown with the recommendation */
  chunksUsed?: string[]
  versions: { engine: string; ruleset: string; kb?: string }
  prevHash: string
  hash: string
}

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex')
}

async function lastHash(): Promise<string> {
  try {
    const raw = await fs.readFile(FILE, 'utf8')
    const lines = raw.trimEnd().split('\n')
    const last = JSON.parse(lines[lines.length - 1])
    return typeof last.hash === 'string' ? last.hash : 'genesis'
  } catch { return 'genesis' }
}

/** Append a decision to the audit chain. Never throws — an audit-write
 *  failure must not block patient-facing care guidance (it is logged). */
export async function auditDecision(entry: {
  kind: AuditRecord['kind']
  features?: ExtractedFeatures
  knownFields?: string[]
  risk?: PatientRisk
  questionsAsked?: number
  decision?: EngineDecision
  roundedUp?: boolean
  chunksUsed?: string[]
  engineVersion: string
  rulesetVersion: string
  kbVersion?: string
}): Promise<void> {
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true })
    const prevHash = await lastHash()
    const body: Omit<AuditRecord, 'hash'> = {
      id: randomUUID(),
      ts: new Date().toISOString(),
      kind: entry.kind,
      features: entry.features,
      knownFields: entry.knownFields,
      riskModifiers: entry.risk?.modifiers,
      questionsAsked: entry.questionsAsked,
      decision: entry.decision ? {
        careLevel: entry.decision.careLevel,
        confidence: entry.decision.confidence,
        floorApplied: entry.decision.floorApplied,
        rulesFired: entry.decision.rulesFired.map(r => r.id),
        distribution: entry.decision.distribution,
        roundedUp: entry.roundedUp ?? false,
      } : undefined,
      chunksUsed: entry.chunksUsed,
      versions: { engine: entry.engineVersion, ruleset: entry.rulesetVersion, kb: entry.kbVersion },
      prevHash,
    }
    const record: AuditRecord = { ...body, hash: sha256(prevHash + JSON.stringify(body)) }
    await fs.appendFile(FILE, JSON.stringify(record) + '\n')
  } catch (err) {
    console.error('Audit write failed (decision still served):', err)
  }
}

/** Verify chain integrity — used by the eval suite and admin tooling. */
export async function verifyAuditChain(): Promise<{ ok: boolean; records: number; brokenAt?: number }> {
  let raw: string
  try { raw = await fs.readFile(FILE, 'utf8') } catch { return { ok: true, records: 0 } }
  const lines = raw.trimEnd().split('\n').filter(Boolean)
  let prev = 'genesis'
  for (let i = 0; i < lines.length; i++) {
    const rec = JSON.parse(lines[i]) as AuditRecord
    const { hash, ...body } = rec
    if (rec.prevHash !== prev || sha256(prev + JSON.stringify(body)) !== hash) {
      return { ok: false, records: lines.length, brokenAt: i }
    }
    prev = hash
  }
  return { ok: true, records: lines.length }
}
