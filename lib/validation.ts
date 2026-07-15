// ─────────────────────────────────────────────────────────────────────────────
// Zod schemas for every user input in Carevo — used on the client for
// real-time field errors AND re-used on the server (never trust the client).
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod'

// ── Triage chat (API) ────────────────────────────────────────────────────────

export const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1, 'Message cannot be empty').max(1200, 'Message too long'),
})

export const triageRequestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(12),
  /** EVOI targets already asked this session (client echoes back what the
   *  server sent as `askedFor`) — lets the engine never repeat a question
   *  even if the extractor misses the patient's answer. */
  askedTargets: z.array(z.string().max(60)).max(20).optional(),
  patientContext: z.string().max(2000).optional(),
  history: z
    .object({
      age: z.string().max(10).optional(),
      sex: z.string().max(20).optional(),
      conditions: z.string().max(1000).optional(),
      familyHistory: z.string().max(1000).optional(),
      medications: z.string().max(1000).optional(),
      allergies: z.string().max(500).optional(),
      insurance: z.string().max(200).optional(),
      periodHistory: z.string().max(500).optional(),
      smoking: z.string().max(20).optional(),
      vaping: z.string().max(20).optional(),
      alcohol: z.string().max(20).optional(),
      drugUse: z.string().max(500).optional(),
    })
    .partial()
    .optional(),
})

// ── Feedback / learning loop (API) ───────────────────────────────────────────

export const feedbackSchema = z.object({
  featureKeys: z.array(z.string().max(60)).max(20),
  careLevel: z.enum(['home_care', 'telehealth', 'primary_care', 'urgent_care', 'er', 'emergency']),
  outcome: z.enum(['right_place', 'wrong_place', 'did_not_go']),
})

// ── Metrics events (API) ─────────────────────────────────────────────────────

export const metricsEventSchema = z.object({
  event: z.enum([
    'visit', 'chat_started', 'triage_completed', 'emergency_shown',
    'avs_added', 'checkin_completed', 'history_saved', 'outcome_feedback',
  ]),
  meta: z.record(z.string().max(40)).optional(),
})

// ── After-visit summary form (client) ────────────────────────────────────────

export const avsEntrySchema = z.object({
  visitDate: z.string().max(20).optional().or(z.literal('')),
  facility: z.string().max(200, 'Facility must be under 200 characters').optional().or(z.literal('')),
  visitSummary: z.string().max(300, 'Keep this under 300 characters').optional().or(z.literal('')),
  medications: z.string().max(500, 'Keep medications under 500 characters').optional().or(z.literal('')),
  followUps: z.string().max(500, 'Keep follow-ups under 500 characters').optional().or(z.literal('')),
  notes: z.string().max(2000, 'Notes must be under 2000 characters').optional().or(z.literal('')),
}).refine(d => (d.visitSummary ?? '').trim() || (d.notes ?? '').trim(), {
  message: 'Add at least a visit summary or a note',
  path: ['visitSummary'],
})

// ── Recovery check-in form (client) ──────────────────────────────────────────

export const checkInSchema = z.object({
  takingMeds: z.enum(['yes', 'partially', 'no', 'na']),
  feelingBetter: z.enum(['better', 'same', 'worse']),
  newSymptoms: z.string().max(500, 'Keep this under 500 characters').optional().or(z.literal('')),
})

// ── Health history form (client) ─────────────────────────────────────────────

export const historySchema = z.object({
  age: z.string()
    .regex(/^\d{0,3}$/, 'Age must be a number')
    .refine(v => !v || (parseInt(v, 10) >= 0 && parseInt(v, 10) <= 120), 'Enter a realistic age')
    .optional().or(z.literal('')),
  sex: z.enum(['', 'female', 'male', 'intersex', 'prefer_not']),
  conditions: z.string().max(1000, 'Keep this under 1000 characters'),
  familyHistory: z.string().max(1000, 'Keep this under 1000 characters'),
  medications: z.string().max(1000, 'Keep this under 1000 characters'),
  allergies: z.string().max(500, 'Keep this under 500 characters'),
  insurance: z.string().max(200, 'Keep this under 200 characters'),
  periodHistory: z.string().max(500, 'Keep this under 500 characters'),
  smoking: z.enum(['', 'never', 'former', 'current']),
  vaping: z.enum(['', 'never', 'former', 'current']),
  alcohol: z.enum(['', 'none', 'occasional', 'weekly', 'daily']),
  drugUse: z.string().max(500, 'Keep this under 500 characters'),
})

// ── Helpers ──────────────────────────────────────────────────────────────────

export const getFirstError = (error: z.ZodError): string =>
  error.issues[0]?.message || 'Validation failed'

export const getFieldErrors = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (!errors[path]) errors[path] = issue.message
  }
  return errors
}
