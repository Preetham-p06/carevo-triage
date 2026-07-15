// ─────────────────────────────────────────────────────────────────────────────
// Carevo Knowledge Platform — knowledge-object schema.
//
// The unit of knowledge is not a "source" but a CHUNK: a small passage of
// clinical guidance with rich metadata (who published it, when, for whom,
// how strong the evidence is, which version). Retrieval filters on metadata
// first, ranks second — precision comes from structure, not just similarity.
// ─────────────────────────────────────────────────────────────────────────────

import type { BodySystem } from '../engine/features'
import type { CitationKey } from './citations'

export type Specialty =
  | 'cardiology' | 'pulmonology' | 'neurology' | 'gastroenterology'
  | 'orthopedics' | 'dermatology' | 'ent' | 'urology' | 'obgyn'
  | 'psychiatry' | 'pediatrics' | 'emergency_medicine' | 'general'

export type AgeGroup = 'infant' | 'child' | 'adult' | 'older_adult' | 'all'

/** What the chunk is FOR — retrieval never mixes content types. */
export type ContentType =
  | 'warning_signs'    // "go to the ER if…"
  | 'self_care'        // safe home measures while waiting / recovering
  | 'follow_up'        // after-visit / recovery guidance
  | 'education'        // plain-language explanation of the situation

/** Editorial grading of the underlying guidance. */
export type EvidenceStrength =
  | 'clinical_guideline'    // formal published guideline (AAP CPG, AHA statement)
  | 'public_health_guidance'// CDC/WHO/NIH public guidance pages
  | 'professional_consensus'// specialty-society patient education

export type ReviewStatus = 'seeded_pending_review' | 'clinician_reviewed' | 'flagged_for_update'

export interface KnowledgeChunk {
  /** Stable id: `${docId}#${n}` */
  id: string
  /** Parent document id (one source page/guideline = one document) */
  docId: string
  /** Links into the citation registry (same key the rule layer uses).
   *  Optional for ingested content — the parent document carries source
   *  attribution; citation keys are for rule linkage. */
  citation?: CitationKey
  contentType: ContentType
  /** Body systems this chunk applies to (retrieval filter) */
  systems: BodySystem[]
  specialty: Specialty
  ageGroup: AgeGroup
  /** Free-text topic tags used by the lexical ranker */
  topics: string[]
  /** The passage itself — plain language, faithful to the source */
  text: string
  meta: {
    org: string
    publishedDate: string      // ISO date of source publication (best known)
    lastReviewed: string       // when Carevo last verified against the source
    evidenceStrength: EvidenceStrength
    version: number            // bumped whenever text changes
    reviewStatus: ReviewStatus
  }
}

export interface KnowledgeDocument {
  docId: string
  /** Optional link into the citation registry (rule linkage) */
  citation?: CitationKey
  title: string
  org: string
  url: string
  /** SHA-256 of the last fetched source content — drives update detection */
  sourceContentHash: string | null
}

/** The overlay file: ingested-and-approved knowledge, loaded at runtime
 *  alongside the hand-seeded corpus. Every promotion bumps `rev`. */
export interface CorpusOverlay {
  rev: number
  promotedAt: string
  documents: KnowledgeDocument[]
  chunks: KnowledgeChunk[]
}

/** A chunk as attached to a recommendation — text + provenance, no internals */
export interface RetrievedGuidance {
  text: string
  org: string
  title: string
  url: string
  publishedDate: string
  evidenceStrength: EvidenceStrength
  chunkId: string
  chunkVersion: number
  /** Lexical relevance score (0–1 normalized) — recorded for the audit trail */
  retrievalScore: number
}
