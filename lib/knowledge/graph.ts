// ─────────────────────────────────────────────────────────────────────────────
// Carevo Clinical Knowledge Graph v0 — derived, not hand-maintained.
//
// Every relationship already exists in code (screenable flags per system,
// rules per red flag, citations per rule, chunks per document…). This module
// materializes them into one queryable graph so the clinician view, audit
// tooling, and future rule-authoring workbench can answer questions like
// "show me everything connected to chest_pressure" without spelunking
// through five modules. Because it's derived at load time, it can never
// drift out of sync with the systems it describes.
//
// Nodes: body systems · red flags · clinical rules · risk modifiers ·
//        citations · documents · chunks · care levels
// ─────────────────────────────────────────────────────────────────────────────

import { RED_FLAGS, type RedFlag, type BodySystem } from '../engine/features'
import { CLINICAL_RULES, type ClinicalRule } from '../engine/rules'
import { SCREENABLE_RED_FLAGS } from '../engine/evoi'
import { CITATIONS, type CitationKey } from './citations'
import { allChunks, allDocuments, kbVersion } from './corpus'
import type { ContentType } from './types'

export type NodeKind = 'system' | 'red_flag' | 'rule' | 'citation' | 'document' | 'chunk' | 'care_level'

export interface GraphNode {
  id: string          // e.g. "system:cardiac", "rule:cx.cardiac_highrisk"
  kind: NodeKind
  label: string
}

export interface GraphEdge {
  from: string
  to: string
  relation:
    | 'screens_for'        // system → red flag (EVOI screening set)
    | 'triggers'           // red flag → rule
    | 'floors_to'          // rule → care level
    | 'cites'              // rule → citation
    | 'published_as'       // citation → document
    | 'contains'           // document → chunk
    | 'applies_to'         // chunk → system
}

export interface KnowledgeGraph {
  version: string
  nodes: GraphNode[]
  edges: GraphEdge[]
}

// SCREENABLE_RED_FLAGS lives in evoi.ts but isn't exported; mirror the
// system→flag relation from the rules that reference each flag instead,
// plus the systems declared on chunks. (If evoi exports its map later,
// swap it in here.)

let cache: { graph: KnowledgeGraph; version: string } | null = null

export function buildGraph(): KnowledgeGraph {
  const version = kbVersion()
  if (cache && cache.version === version) return cache.graph

  const nodes = new Map<string, GraphNode>()
  const edges: GraphEdge[] = []
  const addNode = (id: string, kind: NodeKind, label: string) => {
    if (!nodes.has(id)) nodes.set(id, { id, kind, label })
  }
  const addEdge = (from: string, to: string, relation: GraphEdge['relation']) =>
    edges.push({ from, to, relation })

  // Care levels
  for (const l of ['home_care', 'telehealth', 'primary_care', 'urgent_care', 'er', 'emergency']) {
    addNode(`level:${l}`, 'care_level', l.replace('_', ' '))
  }

  // Red flags
  for (const flag of RED_FLAGS) addNode(`flag:${flag}`, 'red_flag', flag.replace(/_/g, ' '))

  // Rules → flags, citations, floors
  for (const rule of CLINICAL_RULES) {
    addNode(`rule:${rule.id}`, 'rule', rule.description)
    addEdge(`rule:${rule.id}`, `level:${rule.floor}`, 'floors_to')
    addNode(`cite:${rule.citation}`, 'citation', CITATIONS[rule.citation]?.title ?? rule.citation)
    addEdge(`rule:${rule.id}`, `cite:${rule.citation}`, 'cites')
    if (rule.id.startsWith('rf.')) {
      const flag = rule.id.slice(3) as RedFlag
      addEdge(`flag:${flag}`, `rule:${rule.id}`, 'triggers')
    }
  }

  // Documents & chunks
  for (const doc of allDocuments()) {
    addNode(`doc:${doc.docId}`, 'document', doc.title)
    if (doc.citation) {
      addNode(`cite:${doc.citation}`, 'citation', CITATIONS[doc.citation]?.title ?? doc.citation)
      addEdge(`cite:${doc.citation}`, `doc:${doc.docId}`, 'published_as')
    }
  }
  for (const chunk of allChunks()) {
    addNode(`chunk:${chunk.id}`, 'chunk', chunk.text.slice(0, 60) + '…')
    addEdge(`doc:${chunk.docId}`, `chunk:${chunk.id}`, 'contains')
    for (const sys of chunk.systems) {
      addNode(`system:${sys}`, 'system', sys)
      addEdge(`chunk:${chunk.id}`, `system:${sys}`, 'applies_to')
    }
  }

  // System → red flag: imported directly from the EVOI screening policy —
  // the graph can never drift from what the interviewer actually asks.
  for (const [sys, flags] of Object.entries(SCREENABLE_RED_FLAGS)) {
    addNode(`system:${sys}`, 'system', sys)
    for (const flag of flags) addEdge(`system:${sys}`, `flag:${flag}`, 'screens_for')
  }

  const graph = { version, nodes: [...nodes.values()], edges }
  cache = { graph, version }
  return graph
}

/** Everything connected to a node, one hop out (clinician view helper). */
export function neighbors(nodeId: string): { node: GraphNode; via: string; direction: 'out' | 'in' }[] {
  const g = buildGraph()
  const byId = new Map(g.nodes.map(n => [n.id, n]))
  const out: { node: GraphNode; via: string; direction: 'out' | 'in' }[] = []
  for (const e of g.edges) {
    if (e.from === nodeId && byId.has(e.to)) out.push({ node: byId.get(e.to)!, via: e.relation, direction: 'out' })
    if (e.to === nodeId && byId.has(e.from)) out.push({ node: byId.get(e.from)!, via: e.relation, direction: 'in' })
  }
  return out
}

// ── Consistency checks — wiring gaps become eval gates ──────────────────────

export interface ConsistencyReport {
  /** Hard failures: broken or unsafe wiring */
  errors: string[]
  /** Coverage gaps worth surfacing, not release-blocking */
  warnings: string[]
  stats: { nodes: number; edges: number; chunks: number; documents: number; rules: number; warningSignsCoverage: string }
}

const ALL_SYSTEMS: BodySystem[] = ['cardiac', 'respiratory', 'neuro', 'gi', 'msk', 'skin', 'ent', 'urinary', 'gyn', 'mental', 'general']

export function checkConsistency(): ConsistencyReport {
  const errors: string[] = []
  const warnings: string[] = []
  const chunks = allChunks()
  const docIds = new Set(allDocuments().map(d => d.docId))
  const citationKeys = new Set(Object.keys(CITATIONS))

  // 1. Every red flag must trigger a floor rule — a flag that routes nowhere
  //    is a promise the engine doesn't keep.
  const flooredFlags = new Set(CLINICAL_RULES.filter(r => r.id.startsWith('rf.')).map(r => r.id.slice(3)))
  for (const flag of RED_FLAGS) {
    if (!flooredFlags.has(flag)) errors.push(`red flag "${flag}" has no floor rule (rf.${flag} missing)`)
  }

  // 2. Every SCREENED flag must have a floor — asking a question whose answer
  //    cannot change routing wastes a question from the budget.
  for (const [system, flags] of Object.entries(SCREENABLE_RED_FLAGS)) {
    for (const flag of flags) {
      if (!flooredFlags.has(flag)) errors.push(`system "${system}" screens for "${flag}" but no rule floors it`)
    }
  }

  // 3. Every rule must cite a resolvable source (explainability contract).
  for (const rule of CLINICAL_RULES) {
    if (!citationKeys.has(rule.citation)) errors.push(`rule ${rule.id} cites unknown source "${rule.citation}"`)
  }

  // 4. Every chunk must belong to a known document; explicit citations resolve.
  for (const c of chunks) {
    if (!docIds.has(c.docId)) errors.push(`chunk ${c.id} references unknown document ${c.docId}`)
    if (c.citation && !citationKeys.has(c.citation)) errors.push(`chunk ${c.id} cites unknown source "${c.citation}"`)
  }

  // 5. Content coverage per system — gaps mean template fallbacks, not bugs.
  const coverage = new Map<BodySystem, Set<ContentType>>()
  for (const c of chunks) for (const s of c.systems) {
    if (!coverage.has(s)) coverage.set(s, new Set())
    coverage.get(s)!.add(c.contentType)
  }
  let covered = 0
  for (const s of ALL_SYSTEMS) {
    const types = coverage.get(s) ?? new Set<ContentType>()
    if (types.has('warning_signs')) covered++
    else warnings.push(`system "${s}" has no warning_signs chunk — falls back to templates`)
    if (!types.has('self_care')) warnings.push(`system "${s}" has no self_care chunk`)
  }

  // 6. Review-status visibility (v0 is seeded; this keeps the gap explicit).
  const unreviewed = chunks.filter(c => c.meta.reviewStatus !== 'clinician_reviewed').length
  if (unreviewed > 0) warnings.push(`${unreviewed}/${chunks.length} chunks not clinician-reviewed yet`)

  const g = buildGraph()
  return {
    errors, warnings,
    stats: {
      nodes: g.nodes.length, edges: g.edges.length,
      chunks: chunks.length, documents: docIds.size, rules: CLINICAL_RULES.length,
      warningSignsCoverage: `${covered}/${ALL_SYSTEMS.length} systems`,
    },
  }
}

/** Full evidence trace for a red flag: flag → rules → floors + citations →
 *  documents. This is the "why should I trust this?" answer, as data. */
export function traceRedFlag(flag: RedFlag): {
  flag: RedFlag
  rules: Array<{ id: string; description: string; floor: string; citation: CitationKey; source: string; url: string }>
} {
  const rules = CLINICAL_RULES
    .filter(r => r.id === `rf.${flag}` || (r.when.toString().includes(flag)))
    .map(r => ({
      id: r.id,
      description: r.description,
      floor: r.floor,
      citation: r.citation,
      source: r.source,
      url: CITATIONS[r.citation]?.url ?? '',
    }))
  return { flag, rules }
}
