// ─────────────────────────────────────────────────────────────────────────────
// Guest data store — everything lives in localStorage on the user's device.
// Nothing is sent to a server except anonymous usage metrics.
// ─────────────────────────────────────────────────────────────────────────────

import type { Message, CareLevel } from './types'

export interface PatientHistory {
  age: string
  sex: '' | 'female' | 'male' | 'intersex' | 'prefer_not'
  conditions: string        // personal medical history
  familyHistory: string
  medications: string
  allergies: string
  insurance: string
  periodHistory: string     // shown when sex === 'female'
  smoking: '' | 'never' | 'former' | 'current'
  vaping: '' | 'never' | 'former' | 'current'
  alcohol: '' | 'none' | 'occasional' | 'weekly' | 'daily'
  drugUse: string
}

export const EMPTY_HISTORY: PatientHistory = {
  age: '', sex: '', conditions: '', familyHistory: '', medications: '',
  allergies: '', insurance: '', periodHistory: '',
  smoking: '', vaping: '', alcohol: '', drugUse: '',
}

export interface ChatRecord {
  id: string
  startedAt: number
  messages: Message[]
  careLevel?: CareLevel
  reasoning?: string
}

export interface AvsEntry {
  id: string
  addedAt: number
  visitDate: string
  facility: string
  visitSummary: string
  medications: string
  followUps: string
  notes: string
}

export interface CheckIn {
  id: string
  avsId: string
  date: number
  takingMeds: 'yes' | 'partially' | 'no' | 'na'
  feelingBetter: 'better' | 'same' | 'worse'
  newSymptoms: string
}

const KEYS = {
  history: 'carevo_history',
  chats: 'carevo_chats',
  avs: 'carevo_avs',
  checkins: 'carevo_checkins',
} as const

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export const store = {
  getHistory: () => read<PatientHistory>(KEYS.history, EMPTY_HISTORY),
  saveHistory: (h: PatientHistory) => write(KEYS.history, h),

  getChats: () => read<ChatRecord[]>(KEYS.chats, []),
  saveChat: (c: ChatRecord) => {
    const chats = read<ChatRecord[]>(KEYS.chats, [])
    write(KEYS.chats, [c, ...chats].slice(0, 25))
  },

  getAvs: () => read<AvsEntry[]>(KEYS.avs, []),
  saveAvs: (a: AvsEntry) => {
    const list = read<AvsEntry[]>(KEYS.avs, [])
    write(KEYS.avs, [a, ...list].slice(0, 25))
  },

  getCheckIns: () => read<CheckIn[]>(KEYS.checkins, []),
  saveCheckIn: (c: CheckIn) => {
    const list = read<CheckIn[]>(KEYS.checkins, [])
    write(KEYS.checkins, [c, ...list].slice(0, 50))
  },

  clearAll: () => {
    if (typeof window === 'undefined') return
    Object.values(KEYS).forEach(k => localStorage.removeItem(k))
  },
}

/** Compact summary of patient history for the triage AI. Empty string if nothing set. */
export function historySummary(h: PatientHistory): string {
  const parts: string[] = []
  if (h.age) parts.push(`Age: ${h.age}`)
  if (h.sex && h.sex !== 'prefer_not') parts.push(`Sex: ${h.sex}`)
  if (h.conditions) parts.push(`Medical history: ${h.conditions}`)
  if (h.familyHistory) parts.push(`Family history: ${h.familyHistory}`)
  if (h.medications) parts.push(`Current medications: ${h.medications}`)
  if (h.allergies) parts.push(`Allergies: ${h.allergies}`)
  if (h.sex === 'female' && h.periodHistory) parts.push(`Menstrual history: ${h.periodHistory}`)
  if (h.smoking && h.smoking !== 'never') parts.push(`Smoking: ${h.smoking}`)
  if (h.vaping && h.vaping !== 'never') parts.push(`Vaping: ${h.vaping}`)
  if (h.alcohol && h.alcohol !== 'none') parts.push(`Alcohol: ${h.alcohol}`)
  if (h.drugUse) parts.push(`Substance use: ${h.drugUse}`)
  return parts.join('\n')
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
