// Server-only: load/save learned weight adjustments. Imported by API routes
// only. Node runtime — file-backed so outcome feedback survives restarts.
// (Phase 2 moves this to Postgres alongside the audit trail.)

import { promises as fs } from 'fs'
import path from 'path'
import type { Adjustments } from './model'

const FILE = path.join(process.cwd(), 'data', 'engine-adjustments.json')

export async function loadAdjustments(): Promise<Adjustments> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8'))
  } catch { return {} }
}

export async function saveAdjustments(adj: Adjustments): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true })
  await fs.writeFile(FILE, JSON.stringify(adj, null, 2))
}
