import { promises as fs } from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

export type CareLevelLabel = 'home_care' | 'telehealth' | 'primary_care' | 'urgent_care' | 'er' | 'emergency'

export interface TelemetryRecord {
  session_id: string
  created_at?: string
  conversation_history: Array<{ role: 'user' | 'assistant'; content: string }>
  final_json_vector: Record<string, unknown>
  total_turns: number
  final_care_level: number
  final_care_level_label?: CareLevelLabel
  is_over_triage?: boolean
  total_tokens_used?: number
  engine_version?: string
  ruleset_version?: string
  kb_version?: string
  metadata?: Record<string, unknown>
}

export interface AnomalyCase {
  session_id: string
  reason: string[]
  history: TelemetryRecord['conversation_history']
  extracted_vector: TelemetryRecord['final_json_vector']
  total_turns: number
  final_care_level: number
  final_care_level_label?: CareLevelLabel
  total_tokens_used: number
  versions: {
    engine?: string
    ruleset?: string
    kb?: string
  }
  metadata?: Record<string, unknown>
}

export function valueArg(args: string[], name: string): string | undefined {
  const exact = args.indexOf(name)
  if (exact !== -1) return args[exact + 1]
  return args.find(a => a.startsWith(`${name}=`))?.slice(name.length + 1)
}

export function boolArg(args: string[], name: string): boolean {
  return args.includes(name)
}

export async function readJsonl<T>(file: string): Promise<T[]> {
  const raw = await fs.readFile(file, 'utf8')
  return raw.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line) as T)
}

export async function writeJsonl<T>(file: string, rows: T[], append = false): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true })
  const body = rows.map(row => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : '')
  if (append) await fs.appendFile(file, body)
  else await fs.writeFile(file, body)
}

export async function writeJson(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(value, null, 2) + '\n')
}

export function defaultOut(name: string): string {
  return path.join(process.cwd(), 'data', 'recursive-learning', name)
}

export function careRank(label: CareLevelLabel | undefined): number {
  switch (label) {
    case 'home_care': return 1
    case 'telehealth': return 2
    case 'primary_care': return 3
    case 'urgent_care': return 4
    case 'er': return 5
    case 'emergency': return 6
    default: return 0
  }
}

export function fetchTelemetryFromPostgres(databaseUrl: string, limit: number): TelemetryRecord[] {
  const sql = `
    SELECT json_build_object(
      'session_id', session_id,
      'created_at', created_at,
      'conversation_history', conversation_history,
      'final_json_vector', final_json_vector,
      'total_turns', total_turns,
      'final_care_level', final_care_level,
      'final_care_level_label', final_care_level_label,
      'is_over_triage', is_over_triage,
      'total_tokens_used', total_tokens_used,
      'engine_version', engine_version,
      'ruleset_version', ruleset_version,
      'kb_version', kb_version,
      'metadata', metadata
    )
    FROM carevo_ree_telemetry
    WHERE total_turns >= 5 OR is_over_triage = TRUE
    ORDER BY is_over_triage DESC, total_turns DESC, created_at DESC
    LIMIT ${Math.max(1, Math.min(limit, 500))}
  `

  const stdout = execFileSync('psql', [databaseUrl, '-At', '-c', sql], { encoding: 'utf8' })
  return stdout.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line) as TelemetryRecord)
}

export function isolate(record: TelemetryRecord): AnomalyCase | null {
  const reason: string[] = []
  if (record.total_turns >= 5) reason.push('too_many_turns')
  if (record.is_over_triage) reason.push('over_triage_review')
  if (!reason.length) return null

  return {
    session_id: record.session_id,
    reason,
    history: record.conversation_history,
    extracted_vector: record.final_json_vector,
    total_turns: record.total_turns,
    final_care_level: record.final_care_level,
    final_care_level_label: record.final_care_level_label,
    total_tokens_used: record.total_tokens_used ?? 0,
    versions: {
      engine: record.engine_version,
      ruleset: record.ruleset_version,
      kb: record.kb_version,
    },
    metadata: record.metadata,
  }
}
