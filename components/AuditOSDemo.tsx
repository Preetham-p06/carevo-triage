'use client'

// Public enterprise demo using fictional members and simulated operations data.
// Nothing here is a real patient record. All numbers are illustrative.
// Design system: "Data-Dense Dashboard" — navy primary, flat bordered surfaces,
// tabular figures, restrained motion. Modeled on payer/provider ops consoles.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'

type Tab = 'queue' | 'trace' | 'agents' | 'financials'
type Level = 'Emergency' | 'ER' | 'Urgent Care' | 'Primary Care' | 'Telehealth' | 'Home Care'
type Status = 'Complete' | 'Review' | 'Escalated'
type SortKey = 'received' | 'route' | 'status'

type CaseRow = {
  id: string
  member: string
  market: string
  intake: string
  level: Level
  control: string
  owner: string
  status: Status
  questions: number
  confidence: string
  redFlags: string[]
  saved: number
  trace: string[]
  receivedAt: number
  isNew?: boolean
}

const RULESET = 'carevo-rules-2026.07.0'
const ENGINE = 'carevo-engine-1.1'

const SEED_CASES: Omit<CaseRow, 'receivedAt'>[] = [
  {
    id: 'CV-2401', member: 'Fictional member, 58', market: 'Commercial PPO',
    intake: 'Chest pressure with left arm radiation', level: 'Emergency', control: '911 hard stop issued',
    owner: 'Safety queue', status: 'Escalated', questions: 1, confidence: 'Hard stop',
    redFlags: ['chest pressure', 'arm radiation'], saved: 0,
    trace: ['Member message: chest feels tight and goes into my left arm', 'Emergency screen ran before any route selection', 'Facts captured: chest pressure, radiation, acute onset', 'Rule matched: emergency cardiac floor', 'Route returned: emergency care with 911 instruction', 'Audit record: route, ruleset, and timestamp saved'],
  },
  {
    id: 'CV-2402', member: 'Fictional member, 34', market: 'Commercial HMO',
    intake: 'Fever 103.1 for two days', level: 'Urgent Care', control: 'Red flags screened negative',
    owner: 'Network routing', status: 'Complete', questions: 4, confidence: '0.86',
    redFlags: ['high fever'], saved: 1850,
    trace: ['Member message: fever for two days', 'Follow-up asked for measured temperature and danger signs', 'Facts captured: 103.1 F, 48 hours, fluids tolerated', 'Emergency screen: stiff neck, rash, dehydration not established', 'Rule matched: sustained adult fever floor', 'Route returned: urgent care with facility context'],
  },
  {
    id: 'CV-2403', member: 'Fictional member, 22', market: 'Student plan',
    intake: 'Rolled ankle, swollen, can bear weight', level: 'Home Care', control: 'Escalation instructions included',
    owner: 'Closed loop', status: 'Complete', questions: 5, confidence: '0.81', redFlags: [], saved: 2900,
    trace: ['Member message: rolled ankle at practice yesterday', 'Follow-up checked walking ability, deformity, and numbness', 'Facts captured: ankle injury, swelling, can walk', 'Emergency screen: open fracture and severe deformity not established', 'Rule matched: no higher-acuity floor fired', 'Route returned: home care with escalation guidance'],
  },
  {
    id: 'CV-2404', member: 'Fictional guardian, child 8', market: 'Medicaid',
    intake: 'Child fever with wrist and ankle rash', level: 'ER', control: 'Safety floor applied',
    owner: 'Pediatric review', status: 'Review', questions: 0, confidence: 'Floor enforced',
    redFlags: ['pediatric fever', 'extremity rash'], saved: 0,
    trace: ['Guardian message: child has fever and rash on wrists and ankles', 'Emergency screen detected pediatric fever plus extremity rash', 'Facts captured: child, fever, rash distribution', 'Rule matched: pediatric fever-rash ER floor', 'Route returned: ER', 'Audit record: high-risk route not delayed by more questions'],
  },
  {
    id: 'CV-2405', member: 'Fictional member, 61', market: 'Medicare Advantage',
    intake: 'Gradual shortness of breath on stairs', level: 'Telehealth', control: 'Chest pain and rest-breathing screened',
    owner: 'Virtual care', status: 'Complete', questions: 6, confidence: '0.74', redFlags: [], saved: 2400,
    trace: ['Member message: getting winded walking up stairs', 'Follow-up checked breathing at rest and chest symptoms', 'Facts captured: gradual onset, exertional only', 'Emergency screen: no rest distress or chest pain established', 'Rule matched: no ER floor fired', 'Route returned: telehealth appointment'],
  },
]

const STREAM_POOL: Omit<CaseRow, 'id' | 'receivedAt' | 'isNew'>[] = [
  {
    member: 'Fictional member, 45', market: 'Commercial PPO', intake: 'Migraine, worst-ever, sudden onset',
    level: 'ER', control: 'Thunderclap pattern floor', owner: 'Safety queue', status: 'Escalated',
    questions: 2, confidence: 'Floor enforced', redFlags: ['sudden severe headache'], saved: 0,
    trace: ['Member message: worst headache of my life, came on in seconds', 'Emergency screen flagged thunderclap pattern', 'Facts captured: sudden onset, peak intensity', 'Rule matched: acute severe headache ER floor', 'Route returned: ER', 'Audit record saved'],
  },
  {
    member: 'Fictional member, 29', market: 'Commercial HMO', intake: 'Sore throat, no fever, 2 days',
    level: 'Telehealth', control: 'Red flags screened negative', owner: 'Virtual care', status: 'Complete',
    questions: 4, confidence: '0.83', redFlags: [], saved: 1600,
    trace: ['Member message: throat hurts when swallowing', 'Follow-up checked breathing, drooling, fever', 'Facts captured: mild, no airway signs', 'Emergency screen negative', 'Rule matched: minor URI', 'Route returned: telehealth'],
  },
  {
    member: 'Fictional member, 52', market: 'Medicare Advantage', intake: 'Cut on hand, bleeding controlled',
    level: 'Urgent Care', control: 'Escalation instructions included', owner: 'Network routing', status: 'Complete',
    questions: 3, confidence: '0.88', redFlags: [], saved: 1400,
    trace: ['Member message: cut my hand cooking, might need stitches', 'Follow-up checked bleeding, depth, numbness', 'Facts captured: controlled bleeding, deep laceration', 'Emergency screen negative', 'Rule matched: laceration repair', 'Route returned: urgent care'],
  },
  {
    member: 'Fictional member, 37', market: 'Student plan', intake: 'Anxiety, chest tightness, no radiation',
    level: 'Telehealth', control: 'Cardiac screen ran first', owner: 'Behavioral health', status: 'Review',
    questions: 6, confidence: '0.71', redFlags: [], saved: 2100,
    trace: ['Member message: chest feels tight and I feel panicky', 'Emergency screen ran cardiac checks first', 'Follow-up checked radiation, exertion, sweating', 'Facts captured: stress-linked, no cardiac red flags', 'Rule matched: no ER floor fired', 'Route returned: telehealth with behavioral health note'],
  },
  {
    member: 'Fictional member, 68', market: 'Medicaid', intake: 'Fell, hit head, briefly confused',
    level: 'Emergency', control: '911 hard stop issued', owner: 'Safety queue', status: 'Escalated',
    questions: 1, confidence: 'Hard stop', redFlags: ['head injury', 'confusion'], saved: 0,
    trace: ['Member message: fell and was confused for a bit', 'Emergency screen detected head injury with altered mental status', 'Facts captured: elderly fall, transient confusion', 'Rule matched: head-injury emergency floor', 'Route returned: emergency care with 911', 'Audit record saved'],
  },
  {
    member: 'Fictional member, 41', market: 'Commercial PPO', intake: 'Back pain after lifting, no leg weakness',
    level: 'Home Care', control: 'Red-flag back screen negative', owner: 'Closed loop', status: 'Complete',
    questions: 5, confidence: '0.79', redFlags: [], saved: 2600,
    trace: ['Member message: hurt my back lifting boxes', 'Follow-up checked leg weakness, numbness, bladder', 'Facts captured: mechanical, no neuro signs', 'Emergency screen negative', 'Rule matched: musculoskeletal back pain', 'Route returned: home care with escalation guidance'],
  },
]

// Semantic status colors — used with an icon/text, never color alone.
const LEVEL_STYLE: Record<Level, string> = {
  Emergency: 'border-red-200 bg-red-50 text-red-700',
  ER: 'border-rose-200 bg-rose-50 text-rose-700',
  'Urgent Care': 'border-amber-200 bg-amber-50 text-amber-800',
  'Primary Care': 'border-sky-200 bg-sky-50 text-sky-800',
  Telehealth: 'border-blue-200 bg-blue-50 text-blue-800',
  'Home Care': 'border-emerald-200 bg-emerald-50 text-emerald-800',
}
const STATUS_STYLE: Record<Status, string> = {
  Complete: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Review: 'border-amber-200 bg-amber-50 text-amber-800',
  Escalated: 'border-red-200 bg-red-50 text-red-700',
}

const CARE_COST: Record<Level, number> = {
  Emergency: 2600, ER: 2200, 'Urgent Care': 260, 'Primary Care': 170, Telehealth: 75, 'Home Care': 0,
}
const ER_BASELINE = 2200
const PLAN_COVERAGE: Record<string, number> = {
  'Commercial PPO': 0.8, 'Commercial HMO': 0.85, 'Medicare Advantage': 0.9,
  Medicaid: 0.98, 'Student plan': 0.7, 'Behavioral health': 0.85,
}

type CoverageBreakdown = { estCost: number; covered: number; memberOwes: number; coverRate: number; avoided: number }
function coverageFor(row: CaseRow): CoverageBreakdown {
  const estCost = CARE_COST[row.level] ?? 0
  const rate = PLAN_COVERAGE[row.market] ?? 0.8
  const covered = Math.round(estCost * rate)
  const memberOwes = estCost - covered
  const avoided = row.level === 'Emergency' || row.level === 'ER' ? 0 : Math.max(0, ER_BASELINE - estCost)
  return { estCost, covered, memberOwes, coverRate: rate, avoided }
}

type Agent = { name: string; scope: string; cadence: string; base: number; perTick: number }
const AGENTS: Agent[] = [
  { name: 'PHI Redaction Monitor', scope: 'Scans every intake for identifiers before storage', cadence: 'Per message', base: 48210, perTick: 3 },
  { name: 'Consent State Auditor', scope: 'Verifies opt-in status before any research use', cadence: 'Per session', base: 12894, perTick: 1 },
  { name: 'Route Safety Sentinel', scope: 'Re-checks every route against emergency floors', cadence: 'Per decision', base: 30117, perTick: 2 },
  { name: 'Audit Evidence Writer', scope: 'Pins ruleset, KB version, and hash to each record', cadence: 'Per decision', base: 30117, perTick: 2 },
  { name: 'HIPAA Access Watch', scope: 'Flags out-of-policy access to member data', cadence: 'Continuous', base: 5402, perTick: 1 },
  { name: 'FDA Boundary Guard', scope: 'Confirms output stays navigation, not diagnosis', cadence: 'Per decision', base: 30117, perTick: 2 },
]

const TABS: Array<{ id: Tab; title: string; subtitle: string }> = [
  { id: 'queue', title: 'Work Queue', subtitle: 'Live routing cases' },
  { id: 'trace', title: 'Decision Trace', subtitle: 'Route replay & evidence' },
  { id: 'agents', title: 'Compliance Agents', subtitle: 'Autonomous controls' },
  { id: 'financials', title: 'Cost & Coverage', subtitle: 'Insurance cost-share' },
]

// ═══ FACILITY (provider) side ═══════════════════════════════
type View = 'payer' | 'facility' | 'clinic'
type Facility = 'Urgent Care' | 'Hospital ER' | 'Primary Care'
type Arriving = 'En route' | 'Arriving' | 'Checked in'

// ESI-style acuity: 1 (most urgent) … 5 (least). Color + label, never color alone.
const ACUITY: Record<number, { label: string; cls: string; bar: string }> = {
  1: { label: 'ESI 1 · Resuscitation', cls: 'border-red-300 bg-red-50 text-red-700', bar: 'bg-red-500' },
  2: { label: 'ESI 2 · Emergent', cls: 'border-orange-300 bg-orange-50 text-orange-700', bar: 'bg-orange-500' },
  3: { label: 'ESI 3 · Urgent', cls: 'border-amber-300 bg-amber-50 text-amber-800', bar: 'bg-amber-500' },
  4: { label: 'ESI 4 · Less urgent', cls: 'border-emerald-300 bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500' },
  5: { label: 'ESI 5 · Non-urgent', cls: 'border-sky-300 bg-sky-50 text-sky-700', bar: 'bg-sky-500' },
}
const ARRIVING_STYLE: Record<Arriving, string> = {
  'En route': 'border-blue-200 bg-blue-50 text-blue-700',
  Arriving: 'border-amber-200 bg-amber-50 text-amber-800',
  'Checked in': 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

type Inbound = {
  id: string
  facility: Facility
  patient: string
  complaint: string
  words: string
  facts: string[]
  redFlags: string[]
  acuity: number
  status: Arriving
  eta: number // minutes; 0 = checked in
  vitals: { hr: string; bp: string; temp: string; spo2: string } | null
  plan: string
  estCost: number
  coverage: number // %
  prep: string[]
  intake: string[]
}

const INBOUND: Inbound[] = [
  {
    id: 'AR-7012', facility: 'Hospital ER', patient: 'Fictional patient · M, 58', complaint: 'Chest pressure radiating to left arm',
    words: 'My chest feels tight and it goes down my left arm', facts: ['Acute onset ~40 min', 'Pressure + arm radiation', 'No prior cardiac history reported'],
    redFlags: ['Possible ACS', 'Arm radiation'], acuity: 2, status: 'En route', eta: 6,
    vitals: { hr: '104', bp: '158/96', temp: '98.7°F', spo2: '96%' }, plan: 'Commercial PPO', estCost: 2600, coverage: 80,
    prep: ['Ready cardiac bay + monitor', 'Prep 12-lead ECG on arrival', 'Notify on-call cardiology', 'Draw troponin STAT'],
    intake: ['Confirm onset time & symptom progression', 'Aspirin per protocol if not contraindicated', 'IV access + continuous telemetry'],
  },
  {
    id: 'AR-7013', facility: 'Hospital ER', patient: 'Fictional guardian · child, 8', complaint: 'Fever with wrist & ankle rash',
    words: 'My kid has a high fever and a rash on his wrists and ankles', facts: ['Pediatric fever', 'Extremity-distributed rash', 'Onset ~1 day'],
    redFlags: ['Pediatric fever + rash'], acuity: 2, status: 'Arriving', eta: 2,
    vitals: { hr: '138', bp: '—', temp: '103.1°F', spo2: '98%' }, plan: 'Medicaid', estCost: 2200, coverage: 98,
    prep: ['Pediatric-ready room', 'Isolation until rash evaluated', 'Weight-based dosing chart ready'],
    intake: ['Full skin exam + distribution photos', 'Assess for meningeal signs', 'Consider sepsis screen'],
  },
  {
    id: 'AR-7014', facility: 'Hospital ER', patient: 'Fictional patient · M, 68', complaint: 'Fall with head strike, brief confusion',
    words: 'I fell and was confused for a little while', facts: ['Elderly fall', 'Head strike', 'Transient confusion'],
    redFlags: ['Head injury', 'Altered mental status'], acuity: 2, status: 'En route', eta: 11,
    vitals: { hr: '88', bp: '146/84', temp: '98.2°F', spo2: '97%' }, plan: 'Medicare Advantage', estCost: 2600, coverage: 90,
    prep: ['CT head availability', 'Check anticoagulant status', 'Neuro checks on arrival'],
    intake: ['GCS + neuro exam', 'Medication reconciliation', 'C-spine precautions until cleared'],
  },
  {
    id: 'AR-7020', facility: 'Urgent Care', patient: 'Fictional patient · F, 34', complaint: 'Fever 103.1°F for two days',
    words: 'I’ve had a fever for two days and feel wiped out', facts: ['48h fever', 'Tolerating fluids', 'No stiff neck / rash'],
    redFlags: [], acuity: 3, status: 'Arriving', eta: 3,
    vitals: { hr: '96', bp: '124/78', temp: '103.1°F', spo2: '98%' }, plan: 'Commercial HMO', estCost: 260, coverage: 85,
    prep: ['Standard exam room', 'Rapid flu/strep/COVID swabs ready'],
    intake: ['Vitals + hydration status', 'Consider point-of-care testing', 'Antipyretic per protocol'],
  },
  {
    id: 'AR-7021', facility: 'Urgent Care', patient: 'Fictional patient · M, 52', complaint: 'Hand laceration, bleeding controlled',
    words: 'I cut my hand cooking, might need stitches', facts: ['Deep laceration', 'Bleeding controlled', 'Full range of motion'],
    redFlags: [], acuity: 4, status: 'Checked in', eta: 0,
    vitals: { hr: '78', bp: '128/80', temp: '98.4°F', spo2: '99%' }, plan: 'Medicare Advantage', estCost: 260, coverage: 90,
    prep: ['Laceration tray + suture kit', 'Confirm tetanus status'],
    intake: ['Irrigate + assess depth/tendon', 'Local anesthetic', 'Repair + wound-care instructions'],
  },
  {
    id: 'AR-7022', facility: 'Urgent Care', patient: 'Fictional patient · F, 22', complaint: 'Rolled ankle, can bear weight',
    words: 'I rolled my ankle at practice, it’s swollen', facts: ['Injury ~1 day', 'Swelling', 'Can walk'],
    redFlags: [], acuity: 4, status: 'En route', eta: 14,
    vitals: null, plan: 'Student plan', estCost: 260, coverage: 70,
    prep: ['X-ray availability (Ottawa rules)', 'Bracing / crutches on hand'],
    intake: ['Assess weight-bearing + deformity', 'Image if Ottawa positive', 'RICE + follow-up guidance'],
  },
  {
    id: 'AR-7030', facility: 'Primary Care', patient: 'Fictional patient · F, 29', complaint: 'Sore throat, no fever, 2 days',
    words: 'My throat hurts when I swallow', facts: ['Mild', 'No airway signs', 'No fever'],
    redFlags: [], acuity: 5, status: 'En route', eta: 25,
    vitals: null, plan: 'Commercial HMO', estCost: 170, coverage: 85,
    prep: ['Standard visit slot', 'Rapid strep test optional'],
    intake: ['Throat exam + Centor score', 'Symptomatic care guidance'],
  },
  {
    id: 'AR-7031', facility: 'Primary Care', patient: 'Fictional patient · M, 41', complaint: 'Back pain after lifting, no leg weakness',
    words: 'I hurt my back lifting boxes yesterday', facts: ['Mechanical onset', 'No numbness/weakness', 'No bladder issues'],
    redFlags: [], acuity: 5, status: 'Checked in', eta: 0,
    vitals: { hr: '74', bp: '122/79', temp: '98.6°F', spo2: '99%' }, plan: 'Commercial PPO', estCost: 170, coverage: 80,
    prep: ['Standard exam room'],
    intake: ['Red-flag back screen', 'Range-of-motion assessment', 'Conservative-care plan'],
  },
  {
    id: 'AR-7032', facility: 'Primary Care', patient: 'Fictional patient · F, 37', complaint: 'Anxiety with chest tightness (cardiac screened)',
    words: 'My chest feels tight and I feel panicky', facts: ['Stress-linked', 'No cardiac red flags', 'Cardiac screen ran first'],
    redFlags: [], acuity: 4, status: 'En route', eta: 18,
    vitals: { hr: '92', bp: '126/82', temp: '98.5°F', spo2: '99%' }, plan: 'Student plan', estCost: 170, coverage: 70,
    prep: ['Quiet room', 'Behavioral-health warm handoff available'],
    intake: ['Confirm cardiac screen negative', 'PHQ/GAD as appropriate', 'Behavioral-health referral'],
  },
]

const FACILITIES: Array<{ id: Facility; label: string; sub: string; icon: ReactNode }> = [
  { id: 'Hospital ER', label: 'Hospital ER', sub: 'Emergency department', icon: <><path d="M12 3 4 6v5c0 4.5 3 8.4 8 9.7 5-1.3 8-5.2 8-9.7V6l-8-3Z" /><path d="M12 9v6M9 12h6" /></> },
  { id: 'Urgent Care', label: 'Urgent Care', sub: 'Walk-in clinic', icon: <><path d="M3 7h18v12H3z" /><path d="M12 11v4M10 13h4" /></> },
  { id: 'Primary Care', label: 'Primary Care', sub: 'PCP office', icon: <><path d="M12 21s-7-4.35-9.5-8.5A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6.5C19 16.65 12 21 12 21Z" /></> },
]

// ═══ CLINIC (small practice) side ═══════════════════════════
// A right-sized view for an independent primary-care / urgent-care group.
// Simple acuity words (no ESI jargon), patient-friendly cost, hands-off compliance.
type Priority = 'Urgent' | 'Soon' | 'Routine'
const PRIORITY: Record<Priority, { cls: string; bar: string }> = {
  Urgent: { cls: 'border-orange-300 bg-orange-50 text-orange-700', bar: 'bg-orange-500' },
  Soon: { cls: 'border-amber-300 bg-amber-50 text-amber-800', bar: 'bg-amber-500' },
  Routine: { cls: 'border-emerald-300 bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500' },
}
type ClinicPatient = {
  id: string
  name: string
  complaint: string
  words: string
  priority: Priority
  status: Arriving
  eta: number
  plan: string
  estCost: number
  coverage: number
  redFlags: string[]
  notes: string[]
}
const CLINIC_NAME = 'Riverside Family Care'
const CLINIC_PATIENTS: ClinicPatient[] = [
  {
    id: 'RC-118', name: 'Fictional patient · F, 34', complaint: 'Fever 103°F, 2 days',
    words: 'Fever for two days and I feel wiped out', priority: 'Urgent', status: 'Arriving', eta: 4,
    plan: 'Commercial HMO', estCost: 175, coverage: 85, redFlags: [],
    notes: ['Rapid flu / strep / COVID swab ready', 'Check hydration on arrival'],
  },
  {
    id: 'RC-119', name: 'Fictional patient · M, 52', complaint: 'Hand cut, may need stitches',
    words: 'Cut my hand cooking, bleeding has stopped', priority: 'Urgent', status: 'En route', eta: 12,
    plan: 'Medicare Advantage', estCost: 190, coverage: 90, redFlags: [],
    notes: ['Laceration tray + suture kit', 'Confirm tetanus status'],
  },
  {
    id: 'RC-120', name: 'Fictional patient · F, 29', complaint: 'Sore throat, no fever',
    words: 'Throat hurts when I swallow', priority: 'Routine', status: 'En route', eta: 22,
    plan: 'Commercial PPO', estCost: 120, coverage: 80, redFlags: [],
    notes: ['Standard visit slot', 'Rapid strep optional'],
  },
  {
    id: 'RC-121', name: 'Fictional patient · M, 41', complaint: 'Back pain after lifting',
    words: 'Hurt my back lifting boxes, no leg weakness', priority: 'Soon', status: 'Checked in', eta: 0,
    plan: 'Commercial PPO', estCost: 145, coverage: 80, redFlags: [],
    notes: ['Red-flag back screen cleared by Carevo', 'Conservative-care plan'],
  },
  {
    id: 'RC-122', name: 'Fictional patient · F, 37', complaint: 'Anxiety, chest tightness',
    words: 'Chest feels tight and I feel panicky', priority: 'Soon', status: 'En route', eta: 18,
    plan: 'Student plan', estCost: 130, coverage: 70, redFlags: ['Cardiac screen ran first, negative'],
    notes: ['Quiet room', 'Behavioral-health resources on hand'],
  },
]

const CLINIC_CONTROLS: Array<{ title: string; detail: string }> = [
  ['Consent on file', 'Every shared record has explicit patient opt-in before anything is stored.'],
  ['PHI minimized', 'Identifiers are stripped at intake. Only what the visit needs is kept.'],
  ['Safe-routing check', 'Emergency red flags are screened before a patient is ever sent to you.'],
  ['Audit log written', 'Each routing decision is timestamped and recorded, automatically.'],
  ['Care-navigation only', 'Output stays “where to go,” never a diagnosis, keeping you on the right side of the line.'],
  ['Access logged', 'Who viewed what, and when, is tracked without anyone maintaining a sheet.'],
].map(([title, detail]) => ({ title, detail }))

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}
function hashId(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h.toString(16).padStart(8, '0').slice(0, 8)
}
function agoLabel(ms: number, now: number) {
  const s = Math.max(0, Math.round((now - ms) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

// ── Icons (Lucide-style, 1.5 stroke, consistent family) ─────────────────────
function Icon({ path, className = 'h-[18px] w-[18px]' }: { path: ReactNode; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{path}</svg>
}
const ICONS: Record<Tab, ReactNode> = {
  queue: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
  trace: <><circle cx="6" cy="6" r="2.4" /><circle cx="6" cy="18" r="2.4" /><path d="M6 8.4v7.2" /><path d="M18 8a4 4 0 0 1-4 4H8" /><circle cx="18" cy="6" r="2.4" /></>,
  agents: <><path d="M12 3l7 3v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  financials: <><path d="M3 7h18v12H3z" /><path d="M3 11h18" /><circle cx="8" cy="15" r="1.3" /></>,
}

function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-none ${className}`}>{children}</span>
}

function Kpi({ label, value, sub, tone = 'default' }: { label: string; value: string; sub?: string; tone?: 'default' | 'good' | 'warn' }) {
  const toneCls = tone === 'good' ? 'text-emerald-700' : tone === 'warn' ? 'text-amber-700' : 'text-blue-900'
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tabular-nums tracking-tight ${toneCls}`}>{value}</p>
      {sub && <p className="mt-1 text-xs font-medium text-slate-400">{sub}</p>}
    </div>
  )
}

function complianceChecks(row: CaseRow) {
  return [
    { label: 'PHI redaction', value: 'Applied at intake' },
    { label: 'Consent state', value: 'Opt-in recorded' },
    { label: 'Emergency screen', value: 'Ran before routing' },
    { label: 'Ruleset pinned', value: RULESET },
    { label: 'FDA boundary', value: 'Navigation, not diagnosis' },
    { label: 'Audit hash', value: hashId(row.id) },
  ]
}

export default function EnterpriseDemo() {
  const [view, setView] = useState<View>('payer')
  const [facility, setFacility] = useState<Facility>('Hospital ER')
  const [inboundId, setInboundId] = useState('AR-7012')
  const [clinicId, setClinicId] = useState('RC-118')
  const [tab, setTab] = useState<Tab>('queue')
  const [cases, setCases] = useState<CaseRow[]>(() => {
    const seed = SEED_CASES.map((c, i) => ({ ...c, receivedAt: Date.now() - (i + 1) * 47000 }))
    // Pre-populate a fuller queue so the board reads as busy on load (no empty void).
    const pre = STREAM_POOL.slice(0, 5).map((t, i) => ({
      ...t, id: `CV-${2406 + i}`, receivedAt: Date.now() - (SEED_CASES.length + i + 1) * 61000, isNew: false,
    }))
    return [...seed, ...pre]
  })
  const [selectedId, setSelectedId] = useState(SEED_CASES[0].id)
  const [now, setNow] = useState(() => Date.now())
  const [streamOn, setStreamOn] = useState(true)
  const [levelFilter, setLevelFilter] = useState<'all' | Level>('all')
  const [query, setQuery] = useState('')
  const [tick, setTick] = useState(0)
  const [sortKey, setSortKey] = useState<SortKey>('received')
  const [sortAsc, setSortAsc] = useState(false)

  const [replayStep, setReplayStep] = useState<number>(-1)
  const [replaying, setReplaying] = useState(false)
  const replayRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamCounter = useRef(5) // 5 pool rows pre-populated above

  useEffect(() => {
    const t = setInterval(() => { setNow(Date.now()); setTick(v => v + 1) }, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!streamOn) return
    const t = setInterval(() => {
      setCases(prev => {
        const template = STREAM_POOL[streamCounter.current % STREAM_POOL.length]
        const nextNum = 2406 + streamCounter.current
        streamCounter.current += 1
        const fresh: CaseRow = { ...template, id: `CV-${nextNum}`, receivedAt: Date.now(), isNew: true }
        return [fresh, ...prev.map(c => ({ ...c, isNew: false }))].slice(0, 16)
      })
    }, 6500)
    return () => clearInterval(t)
  }, [streamOn])

  const selected = cases.find(c => c.id === selectedId) ?? cases[0]

  function startReplay() {
    if (replayRef.current) clearInterval(replayRef.current)
    setReplaying(true); setReplayStep(0)
    let step = 0
    replayRef.current = setInterval(() => {
      step += 1
      if (step >= selected.trace.length) {
        if (replayRef.current) clearInterval(replayRef.current)
        setReplayStep(selected.trace.length); setReplaying(false); return
      }
      setReplayStep(step)
    }, 850)
  }
  useEffect(() => () => { if (replayRef.current) clearInterval(replayRef.current) }, [])
  useEffect(() => {
    if (replayRef.current) clearInterval(replayRef.current)
    setReplaying(false); setReplayStep(-1)
  }, [selectedId, tab])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(key === 'received' ? false : true) }
  }

  const filtered = useMemo(() => {
    const rows = cases.filter(row => {
      if (levelFilter !== 'all' && row.level !== levelFilter) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        if (!row.intake.toLowerCase().includes(q) && !row.id.toLowerCase().includes(q) && !row.market.toLowerCase().includes(q)) return false
      }
      return true
    })
    const dir = sortAsc ? 1 : -1
    const statusRank: Record<Status, number> = { Escalated: 3, Review: 2, Complete: 1 }
    rows.sort((a, b) => {
      if (sortKey === 'received') return (a.receivedAt - b.receivedAt) * dir
      if (sortKey === 'route') return a.level.localeCompare(b.level) * dir
      return (statusRank[a.status] - statusRank[b.status]) * dir
    })
    return rows
  }, [cases, levelFilter, query, sortKey, sortAsc])

  const metrics = useMemo(() => {
    const covs = cases.map(coverageFor)
    const savings = covs.reduce((s, c) => s + c.avoided, 0)
    const memberTotal = covs.reduce((s, c) => s + c.memberOwes, 0)
    const coveredTotal = covs.reduce((s, c) => s + c.covered, 0)
    const avgQuestions = cases.reduce((s, r) => s + r.questions, 0) / cases.length
    const redirects = covs.filter(c => c.avoided > 0).length
    const avgMember = cases.length ? Math.round(memberTotal / cases.length) : 0
    return { active: cases.length, savings, coveredTotal, memberTotal, avgMember, redirects, avgQuestions: avgQuestions.toFixed(1), reviewCount: cases.filter(r => r.status !== 'Complete').length }
  }, [cases])

  const totalChecks = useMemo(() => AGENTS.reduce((s, a) => s + a.base + a.perTick * tick, 0), [tick])
  const clock = new Date(now).toLocaleTimeString('en-US', { hour12: false })

  // Facility (provider) side derived data
  const facilityInbound = useMemo(() => {
    return INBOUND.filter(i => i.facility === facility)
      .sort((a, b) => (a.acuity - b.acuity) || (a.eta - b.eta))
  }, [facility])
  const selectedInbound = INBOUND.find(i => i.id === inboundId && i.facility === facility) ?? facilityInbound[0]
  const facMetrics = useMemo(() => {
    const list = facilityInbound
    return {
      inbound: list.filter(i => i.status !== 'Checked in').length,
      highAcuity: list.filter(i => i.acuity <= 2).length,
      checkedIn: list.filter(i => i.status === 'Checked in').length,
      nextEta: list.filter(i => i.eta > 0).reduce((m, i) => Math.min(m, i.eta), 99),
    }
  }, [facilityInbound])

  // Clinic (small practice) derived data
  const selectedClinic = CLINIC_PATIENTS.find(c => c.id === clinicId) ?? CLINIC_PATIENTS[0]
  const clinicMetrics = useMemo(() => {
    const inbound = CLINIC_PATIENTS.filter(c => c.status !== 'Checked in').length
    const urgent = CLINIC_PATIENTS.filter(c => c.priority === 'Urgent').length
    const avgOwe = Math.round(
      CLINIC_PATIENTS.reduce((s, c) => s + Math.round(c.estCost * (1 - c.coverage / 100)), 0) / CLINIC_PATIENTS.length
    )
    const nextEta = CLINIC_PATIENTS.filter(c => c.eta > 0).reduce((m, c) => Math.min(m, c.eta), 99)
    return { inbound, urgent, avgOwe, nextEta }
  }, [])

  function SortHead({ label, k, className = '' }: { label: string; k: SortKey; className?: string }) {
    const active = sortKey === k
    return (
      <th className={`px-4 py-2.5 ${className}`} aria-sort={active ? (sortAsc ? 'ascending' : 'descending') : 'none'}>
        <button type="button" onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 rounded font-semibold uppercase tracking-[0.08em] text-slate-500 transition hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
          {label}
          <span className={`text-[9px] leading-none ${active ? 'text-blue-700' : 'text-slate-300'}`}>{active ? (sortAsc ? '▲' : '▼') : '▲'}</span>
        </button>
      </th>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 [font-family:'Plus_Jakarta_Sans',system-ui,sans-serif]">
      <div className="mx-auto flex max-w-[1500px] flex-col xl:flex-row">
        {/* ── Left nav rail ─────────────────────────────────────────────── */}
        <aside className="shrink-0 border-b border-slate-200 bg-blue-950 text-slate-200 xl:flex xl:min-h-screen xl:w-64 xl:flex-col xl:border-b-0 xl:border-r">
          {/* Brand */}
          <div className="flex items-center gap-2.5 border-b border-white/[0.08] px-5 py-4">
            <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-white/10 ring-1 ring-white/15">
                <img src="/brand/carevo-logo.png" alt="Carevo" className="h-full w-full object-cover" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-bold text-white">Carevo AuditOS</span>
                <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-blue-300">Operations Console</span>
              </span>
            </Link>
          </div>

          {/* Tenant selector */}
          <div className="hidden px-3 pt-3 xl:block">
            <div className="flex w-full items-center gap-2.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-left">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/25 text-[10px] font-bold text-blue-100">{view === 'payer' ? 'NH' : view === 'facility' ? 'MC' : 'RF'}</span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-xs font-semibold text-white">{view === 'payer' ? 'Northstar Health Plan' : view === 'facility' ? 'Meridian Care Network' : CLINIC_NAME}</span>
                <span className="block text-[10px] text-blue-300/80">{view === 'payer' ? 'Payer workspace' : view === 'facility' ? 'Provider workspace' : 'Small clinic'}</span>
              </span>
            </div>
          </div>

          {/* View switch: Payer / Facility / Clinic */}
          <div className="hidden px-3 pt-3 xl:block">
            <div className="grid grid-cols-3 gap-1 rounded-md border border-white/10 bg-white/[0.04] p-1">
              {([['payer', 'Payer'], ['facility', 'Facility'], ['clinic', 'Clinic']] as [View, string][]).map(([v, lbl]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className={`rounded px-1.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    view === v ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-200 hover:bg-white/[0.06]'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Primary nav */}
          <p className="hidden px-5 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-400/70 xl:block">{view === 'payer' ? 'Operations' : view === 'facility' ? 'Facilities' : 'Clinic'}</p>
          {view === 'clinic' ? (
            <nav className="flex gap-1 px-3 pb-3 xl:flex-col xl:pb-0" aria-label="Clinic">
              {([['today', 'Today', 'inbound patients'], ['compliance', 'Compliance', 'handled for you']] as [string, string, string][]).map(([id, label, sub], i) => (
                <div key={id} className={`group relative flex items-center gap-3 rounded-md px-3 py-2.5 ${i === 0 ? 'bg-white/12 text-white' : 'text-blue-200'}`}>
                  {i === 0 && <span className="absolute inset-y-1.5 left-0 hidden w-0.5 rounded-full bg-blue-400 xl:block" />}
                  <span className={i === 0 ? 'text-white' : 'text-blue-300'}><Icon path={i === 0 ? ICONS.queue : ICONS.agents} /></span>
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="hidden text-[11px] font-medium text-blue-300/80 xl:block">{sub}</span>
                  </span>
                </div>
              ))}
            </nav>
          ) : view === 'payer' ? (
            <nav className="flex gap-1 overflow-x-auto px-3 pb-3 xl:flex-col xl:overflow-visible xl:pb-0" aria-label="Sections">
              {TABS.map(item => {
                const active = tab === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`group relative flex min-w-max items-center gap-3 rounded-md px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 xl:min-w-0 ${
                      active ? 'bg-white/12 text-white' : 'text-blue-200 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {active && <span className="absolute inset-y-1.5 left-0 hidden w-0.5 rounded-full bg-blue-400 xl:block" />}
                    <span className={`${active ? 'text-white' : 'text-blue-300'}`}><Icon path={ICONS[item.id]} /></span>
                    <span className="leading-tight">
                      <span className="block text-sm font-semibold">{item.title}</span>
                      <span className="hidden text-[11px] font-medium text-blue-300/80 xl:block">{item.subtitle}</span>
                    </span>
                  </button>
                )
              })}
            </nav>
          ) : (
            <nav className="flex gap-1 overflow-x-auto px-3 pb-3 xl:flex-col xl:overflow-visible xl:pb-0" aria-label="Facilities">
              {FACILITIES.map(item => {
                const active = facility === item.id
                const count = INBOUND.filter(i => i.facility === item.id && i.status !== 'Checked in').length
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setFacility(item.id); const first = INBOUND.find(i => i.facility === item.id); if (first) setInboundId(first.id) }}
                    aria-current={active ? 'page' : undefined}
                    className={`group relative flex min-w-max items-center gap-3 rounded-md px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 xl:min-w-0 ${
                      active ? 'bg-white/12 text-white' : 'text-blue-200 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {active && <span className="absolute inset-y-1.5 left-0 hidden w-0.5 rounded-full bg-blue-400 xl:block" />}
                    <span className={`${active ? 'text-white' : 'text-blue-300'}`}><Icon path={item.icon} /></span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="hidden text-[11px] font-medium text-blue-300/80 xl:block">{item.sub}</span>
                    </span>
                    <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white">{count}</span>
                  </button>
                )
              })}
            </nav>
          )}

          {/* Governance status */}
          <div className="hidden px-3 pt-5 xl:block">
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-400/70">Governance</p>
            <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-300">
                <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" /></span>
                All safety gates passing
              </div>
              {[
                ['Engine', ENGINE],
                ['Ruleset', RULESET],
                ['Under-triage', '0 / 240 gate'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-blue-300/70">{k}</span>
                  <span className="truncate font-mono text-blue-100/90">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Demo CTA + user identity — pinned to bottom */}
          <div className="hidden space-y-3 px-3 py-4 xl:mt-auto xl:block">
            <div className="rounded-lg border border-blue-400/25 bg-blue-500/10 p-3.5">
              <p className="text-xs font-semibold text-white">Sandbox demo</p>
              <p className="mt-1 text-[11px] leading-4 text-blue-200/80">Every record here is fictional. See it running on your own data in a short walkthrough.</p>
              <Link href="/contact" className="mt-2.5 inline-flex w-full items-center justify-center gap-1 rounded-md bg-white px-3 py-1.5 text-[11px] font-bold text-blue-950 transition hover:bg-blue-50">
                Request a walkthrough
              </Link>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/25 text-xs font-bold text-blue-100">AR</span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-xs font-semibold text-white">Alex Rivera</span>
                <span className="block text-[10px] text-blue-300/80">Utilization review · Demo</span>
              </span>
              <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 fill-none stroke-blue-300" strokeWidth="1.6"><circle cx="8" cy="8" r="1" /><circle cx="8" cy="3" r="1" /><circle cx="8" cy="13" r="1" /></svg>
            </div>
          </div>
        </aside>

        {/* ── Main ──────────────────────────────────────────────────────── */}
        <main className="min-w-0 flex-1">
          {/* Top bar */}
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  {view === 'payer' ? 'Northstar Health Plan' : view === 'facility' ? 'Meridian Care Network' : CLINIC_NAME} <span className="text-slate-300">/</span> {view === 'payer' ? 'Care Routing' : view === 'facility' ? facility : 'Today'}
                </p>
                <h1 className="truncate text-base font-bold tracking-tight text-slate-900">{view === 'payer' ? TABS.find(t => t.id === tab)?.title : view === 'facility' ? 'Inbound patients' : 'Your day at a glance'}</h1>
              </div>
              {/* Mobile view toggle */}
              <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-0.5 xl:hidden">
                {([['payer', 'Payer'], ['facility', 'Facility'], ['clinic', 'Clinic']] as [View, string][]).map(([v, lbl]) => (
                  <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v}
                    className={`rounded px-2 py-1 text-xs font-semibold transition ${view === v ? 'bg-blue-800 text-white' : 'text-slate-600'}`}>{lbl}</button>
                ))}
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Badge className="border-slate-200 bg-slate-50 text-slate-600">Sandbox · demo data</Badge>
                <Badge className="hidden border-slate-200 bg-white font-mono tabular-nums text-slate-600 sm:inline-flex">{clock}</Badge>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                  <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
                  Live
                </span>
                <Link href="/contact" className="inline-flex items-center rounded-md bg-blue-800 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                  Request pilot
                </Link>
              </div>
            </div>
          </header>

          <div className="space-y-5 p-5">
            {view === 'clinic' && (
              <ClinicBoard
                patients={CLINIC_PATIENTS}
                selected={selectedClinic}
                onSelect={setClinicId}
                metrics={clinicMetrics}
                controls={CLINIC_CONTROLS}
                clinicName={CLINIC_NAME}
              />
            )}

            {view === 'facility' && (
              <FacilityBoard
                facility={facility}
                inbound={facilityInbound}
                selected={selectedInbound}
                onSelect={setInboundId}
                metrics={facMetrics}
              />
            )}

            {view === 'payer' && <>
            {/* KPI row */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <Kpi label="Active cases" value={String(metrics.active)} sub="In live queue" />
              <Kpi label="Review needed" value={String(metrics.reviewCount)} sub="Staff attention" tone="warn" />
              <Kpi label="Under-triage" value="0" sub="Latest 240-case gate" tone="good" />
              <Kpi label="Emergency capture" value="100%" sub="Safety control" tone="good" />
              <Kpi label="Compliance checks" value={totalChecks.toLocaleString()} sub="Run today" />
            </section>

            {/* ── QUEUE ─────────────────────────────────────────────────── */}
            {tab === 'queue' && (
              <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
                  <label className="relative flex-1 min-w-[200px]">
                    <span className="sr-only">Search cases</span>
                    <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" /></svg>
                    <input
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Search intake, case ID, or plan…"
                      className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {(['all', 'Emergency', 'ER', 'Urgent Care', 'Telehealth', 'Home Care'] as const).map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setLevelFilter(lvl)}
                        className={`rounded-md border px-2.5 py-1.5 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                          levelFilter === lvl ? 'border-blue-700 bg-blue-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {lvl === 'all' ? 'All' : lvl}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStreamOn(s => !s)}
                    className={`ml-auto inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-semibold transition ${
                      streamOn ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${streamOn ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {streamOn ? 'Streaming' : 'Paused'}
                  </button>
                </div>

                <div className="grid lg:grid-cols-[1fr_340px]">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[11px]">
                        <tr>
                          <th className="px-4 py-2.5 font-semibold uppercase tracking-[0.08em] text-slate-500">Case</th>
                          <SortHead label="Received" k="received" />
                          <th className="px-4 py-2.5 font-semibold uppercase tracking-[0.08em] text-slate-500">Intake</th>
                          <SortHead label="Route" k="route" />
                          <SortHead label="Status" k="status" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filtered.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedId(row.id)}
                            className={`cursor-pointer transition ${selectedId === row.id ? 'bg-blue-50' : row.isNew ? 'animate-[carevo-row-in_0.7s_ease]' : 'hover:bg-slate-50'}`}
                          >
                            <td className="whitespace-nowrap px-4 py-2.5">
                              <span className="font-mono text-xs font-semibold text-blue-800">{row.id}</span>
                              {row.isNew && <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">new</span>}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-xs font-medium tabular-nums text-slate-500">{agoLabel(row.receivedAt, now)}</td>
                            <td className="px-4 py-2.5">
                              <p className="font-medium text-slate-800">{row.intake}</p>
                              <p className="mt-0.5 text-xs text-slate-400">{row.member} · {row.market}</p>
                            </td>
                            <td className="px-4 py-2.5"><Badge className={LEVEL_STYLE[row.level]}>{row.level}</Badge></td>
                            <td className="px-4 py-2.5"><Badge className={STATUS_STYLE[row.status]}>{row.status}</Badge></td>
                          </tr>
                        ))}
                        {filtered.length === 0 && (
                          <tr><td colSpan={5} className="px-4 py-14 text-center">
                            <p className="text-sm font-semibold text-slate-500">No cases match this filter</p>
                            <button type="button" onClick={() => { setQuery(''); setLevelFilter('all') }} className="mt-2 text-xs font-semibold text-blue-700 hover:underline">Clear filters</button>
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <CaseSummary selected={selected} now={now} onReplay={() => setTab('trace')} />
                </div>
              </section>
            )}

            {/* ── TRACE ─────────────────────────────────────────────────── */}
            {tab === 'trace' && (
              <section className="grid gap-4 lg:grid-cols-[340px_1fr]">
                <div className="rounded-lg border border-slate-200 bg-white">
                  <CaseSummary selected={selected} now={now} embedded />
                </div>
                <div className="rounded-lg border border-slate-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Route trace replay</p>
                    <button
                      type="button"
                      onClick={startReplay}
                      className="inline-flex items-center gap-1.5 rounded-md bg-blue-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                    >
                      {replaying ? 'Replaying…' : replayStep >= selected.trace.length ? 'Replay again' : 'Play decision'}
                      <svg viewBox="0 0 16 16" className="h-3 w-3 fill-white"><path d="M4 3l9 5-9 5z" /></svg>
                    </button>
                  </div>
                  <ol className="space-y-0 px-4 py-3">
                    {selected.trace.map((step, index) => {
                      const revealed = replayStep < 0 ? true : index < replayStep
                      const active = replayStep === index
                      return (
                        <li key={step} className={`relative grid grid-cols-[28px_1fr] gap-3 pb-3 transition-opacity duration-300 ${revealed || active ? 'opacity-100' : 'opacity-40'}`}>
                          {index < selected.trace.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-1rem)] w-px bg-slate-200" />}
                          <span className={`z-10 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition ${
                            revealed ? 'bg-emerald-600 text-white' : active ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-400'
                          }`}>{revealed ? '✓' : index + 1}</span>
                          <p className={`rounded-md border px-3 py-2 text-sm leading-6 transition ${active ? 'border-blue-200 bg-blue-50/60 text-slate-900' : 'border-slate-200 bg-white text-slate-700'}`}>{step}</p>
                        </li>
                      )
                    })}
                  </ol>
                  <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">AI-native controls applied to this case</p>
                    <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {complianceChecks(selected).map(c => (
                        <div key={c.label} className="flex items-center gap-2 text-xs">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[9px] text-white">✓</span>
                          <span className="text-slate-500">{c.label}:</span>
                          <span className="truncate font-mono text-[11px] text-slate-700">{c.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── AGENTS ────────────────────────────────────────────────── */}
            {tab === 'agents' && (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">Six autonomous agents running against the {ENGINE} pipeline</p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> All passing</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {AGENTS.map((agent, i) => {
                    const checked = agent.base + agent.perTick * tick
                    const scanPct = 40 + ((tick * (7 + i)) % 60)
                    return (
                      <article key={agent.name} className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold leading-5 text-slate-900">{agent.name}</h3>
                          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active</Badge>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-500">{agent.scope}</p>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-blue-700 transition-all duration-700" style={{ width: `${scanPct}%` }} />
                        </div>
                        <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium">
                          <span className="text-slate-400">{agent.cadence}</span>
                          <span className="font-mono tabular-nums text-blue-800">{checked.toLocaleString()} checked</span>
                        </div>
                      </article>
                    )
                  })}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ['HIPAA', 'Access, minimum-necessary, and PHI handling monitored continuously.'],
                    ['FDA boundary', 'Every output verified as care navigation, not diagnosis or treatment.'],
                    ['Evidence trail', 'Ruleset, KB version, and hash pinned to each decision, immutably.'],
                  ].map(([title, text]) => (
                    <div key={title} className="rounded-lg border border-slate-200 bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-800">{title}</p>
                      <p className="mt-1.5 text-xs leading-5 text-slate-600">{text}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── FINANCIALS ────────────────────────────────────────────── */}
            {tab === 'financials' && (
              <section className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-blue-900 bg-blue-900 p-4 text-white">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-200">Avoidable ER cost</p>
                    <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{formatCurrency(metrics.savings)}</p>
                    <p className="mt-1 text-xs text-blue-200/80">Across the live queue</p>
                  </div>
                  <Kpi label="Plan covers" value={formatCurrency(metrics.coveredTotal)} sub="Insurer responsibility" tone="good" />
                  <Kpi label="Member out-of-pocket" value={formatCurrency(metrics.avgMember)} sub="Avg per case" tone="warn" />
                  <Kpi label="Lower-acuity redirects" value={String(metrics.redirects)} sub="Kept out of the ER" />
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Cost &amp; insurance breakdown</p>
                    <span className="text-[11px] font-medium text-slate-400">Estimates · not a quote</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5">Case</th>
                          <th className="px-4 py-2.5">Route</th>
                          <th className="px-4 py-2.5">Plan</th>
                          <th className="px-4 py-2.5 text-right">Est. cost</th>
                          <th className="px-4 py-2.5">Plan covers</th>
                          <th className="px-4 py-2.5 text-right">Member owes</th>
                          <th className="px-4 py-2.5 text-right">ER avoided</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cases.map(row => {
                          const cov = coverageFor(row)
                          return (
                            <tr key={row.id} onClick={() => setSelectedId(row.id)} className={`cursor-pointer transition ${selectedId === row.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                              <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs font-semibold text-blue-800">{row.id}</td>
                              <td className="px-4 py-2.5"><Badge className={LEVEL_STYLE[row.level]}>{row.level}</Badge></td>
                              <td className="whitespace-nowrap px-4 py-2.5 text-xs font-medium text-slate-600">{row.market}</td>
                              <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-800">{formatCurrency(cov.estCost)}</td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round(cov.coverRate * 100)}%` }} /></div>
                                  <span className="text-xs font-semibold tabular-nums text-emerald-700">{Math.round(cov.coverRate * 100)}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-amber-700">{formatCurrency(cov.memberOwes)}</td>
                              <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-blue-800">{cov.avoided > 0 ? formatCurrency(cov.avoided) : '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Coverage detail — <span className="font-mono text-blue-800">{selected.id}</span></p>
                    <h3 className="mt-1.5 text-base font-bold tracking-tight text-slate-900">{selected.intake}</h3>
                    <p className="mt-0.5 text-xs text-slate-400">{selected.member} · {selected.market}</p>
                    {(() => {
                      const cov = coverageFor(selected)
                      const coveredPct = cov.estCost ? Math.round((cov.covered / cov.estCost) * 100) : 0
                      return (
                        <div className="mt-4">
                          <div className="flex h-6 overflow-hidden rounded-md border border-slate-200">
                            <div className="flex items-center justify-center bg-emerald-600 text-[10px] font-bold text-white" style={{ width: `${Math.max(8, coveredPct)}%` }}>{coveredPct}%</div>
                            <div className="flex flex-1 items-center justify-center bg-amber-400 text-[10px] font-bold text-amber-900">{100 - coveredPct}%</div>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Est. cost</p><p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{formatCurrency(cov.estCost)}</p></div>
                            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Plan pays</p><p className="mt-1 text-lg font-bold tabular-nums text-emerald-800">{formatCurrency(cov.covered)}</p></div>
                            <div className="rounded-md border border-amber-200 bg-amber-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Member owes</p><p className="mt-1 text-lg font-bold tabular-nums text-amber-800">{formatCurrency(cov.memberOwes)}</p></div>
                          </div>
                          {cov.avoided > 0 && <p className="mt-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">Routing here instead of the ER avoids about {formatCurrency(cov.avoided)} in cost.</p>}
                        </div>
                      )
                    })()}
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Routing mix (live)</p>
                    <div className="mt-3 space-y-2.5">
                      {(['Emergency', 'ER', 'Urgent Care', 'Telehealth', 'Home Care'] as Level[]).map(level => {
                        const count = cases.filter(r => r.level === level).length
                        const width = `${Math.max(4, (count / Math.max(1, cases.length)) * 100)}%`
                        return (
                          <div key={level}>
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-600"><span>{level}</span><span className="tabular-nums">{count}</span></div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-700 transition-all duration-700" style={{ width }} /></div>
                          </div>
                        )
                      })}
                    </div>
                    <p className="mt-4 text-xs leading-5 text-slate-500">Coverage figures are illustrative estimates based on plan type — not quotes or enrollment decisions.</p>
                  </div>
                </div>
              </section>
            )}

            {/* Footer strip */}
            <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 lg:grid-cols-[1fr_320px] lg:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-800">Enterprise fit</p>
                <h2 className="mt-2 text-lg font-bold tracking-tight text-slate-900">Built for payer operations, front-door navigation, and facility routing teams.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Carevo turns symptom intake into an operational record showing why a route was returned, which safeguards ran, and where staff should focus review time — monitored by AI agents instead of manual audit cycles.</p>
              </div>
              <Link href="/contact" className="inline-flex w-full items-center justify-center rounded-md bg-blue-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                Request enterprise walkthrough
              </Link>
            </section>
            </>}
          </div>
        </main>
      </div>
    </div>
  )
}

function CaseSummary({ selected, now, onReplay, embedded = false }: { selected: CaseRow; now: number; onReplay?: () => void; embedded?: boolean }) {
  const cov = coverageFor(selected)
  const checks = complianceChecks(selected)
  return (
    <aside className={embedded ? 'p-4' : 'border-t border-slate-200 bg-slate-50/60 p-4 lg:border-l lg:border-t-0'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-slate-400">{selected.id}</span>
        <Badge className={STATUS_STYLE[selected.status]}>{selected.status}</Badge>
      </div>
      <h3 className="mt-2 text-base font-bold leading-6 tracking-tight text-slate-900">{selected.intake}</h3>
      <p className="mt-1 text-xs text-slate-500">{selected.member} · {selected.market}</p>

      {/* Owner + SLA */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Owner</p>
          <p className="mt-1 truncate text-xs font-semibold text-slate-800">{selected.owner}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Received</p>
          <p className="mt-1 text-xs font-semibold tabular-nums text-slate-800">{agoLabel(selected.receivedAt, now)}</p>
        </div>
      </div>

      {/* Route facts */}
      <dl className="mt-3 grid gap-2">
        {([
          ['Route', <Badge key="r" className={LEVEL_STYLE[selected.level]}>{selected.level}</Badge>],
          ['Questions asked', <span key="q" className="text-sm font-semibold tabular-nums text-slate-800">{selected.questions}</span>],
          ['Confidence', <span key="c" className="text-sm font-semibold text-slate-800">{selected.confidence}</span>],
          ['Est. cost', <span key="e" className="text-sm font-semibold tabular-nums text-slate-800">{formatCurrency(cov.estCost)}</span>],
          ['Audit hash', <span key="h" className="font-mono text-xs font-semibold text-blue-800">{hashId(selected.id)}</span>],
        ] as [string, ReactNode][]).map(([label, val]) => (
          <div key={label} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</dt>
            <dd>{val}</dd>
          </div>
        ))}
      </dl>

      {/* Red flags */}
      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Red flags</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.redFlags.length
            ? selected.redFlags.map(flag => <Badge key={flag} className="border-red-200 bg-red-50 text-red-700">{flag}</Badge>)
            : <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">none established</Badge>}
        </div>
      </div>

      {/* Compliance evidence */}
      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Compliance evidence</p>
        <div className="mt-2 space-y-1.5 rounded-md border border-slate-200 bg-white p-3">
          {checks.slice(0, 4).map(c => (
            <div key={c.label} className="flex items-center gap-2 text-xs">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[9px] text-white">✓</span>
              <span className="flex-1 text-slate-500">{c.label}</span>
              <span className="truncate font-mono text-[11px] text-slate-700">{c.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {onReplay && (
        <button type="button" onClick={onReplay} className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
          Replay decision trace
          <svg viewBox="0 0 16 16" className="h-3 w-3 fill-white"><path d="M4 3l9 5-9 5z" /></svg>
        </button>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></svg>
          Export evidence
        </button>
        <button type="button" className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M16 11a4 4 0 1 0-8 0M4 20a6 6 0 0 1 16 0" /></svg>
          Assign review
        </button>
      </div>
    </aside>
  )
}

// ═══ FACILITY BOARD (provider heads-up portal) ══════════════
function FacilityBoard({
  facility, inbound, selected, onSelect, metrics,
}: {
  facility: Facility
  inbound: Inbound[]
  selected: Inbound | undefined
  onSelect: (id: string) => void
  metrics: { inbound: number; highAcuity: number; checkedIn: number; nextEta: number }
}) {
  return (
    <>
      {/* Facility mobile selector handled by rail on desktop; heading here */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">{facility} · inbound heads-up</h2>
          <p className="text-xs text-slate-500">Patients Carevo has routed here — with symptoms and prep guidance, before they arrive.</p>
        </div>
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">Routed by Carevo</Badge>
      </div>

      {/* KPI row */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Inbound now" value={String(metrics.inbound)} sub="En route or arriving" />
        <Kpi label="High acuity" value={String(metrics.highAcuity)} sub="ESI 1–2" tone="warn" />
        <Kpi label="Next arrival" value={metrics.nextEta < 99 ? `${metrics.nextEta} min` : '—'} sub="Soonest ETA" />
        <Kpi label="Checked in" value={String(metrics.checkedIn)} sub="On site now" tone="good" />
      </section>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* Inbound queue */}
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Inbound queue</p>
            <span className="text-[11px] font-medium text-slate-400">Sorted by acuity</span>
          </div>
          <div className="divide-y divide-slate-100">
            {inbound.map(pt => {
              const ac = ACUITY[pt.acuity]
              const active = selected?.id === pt.id
              return (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => onSelect(pt.id)}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-300 ${active ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                >
                  <span className={`mt-0.5 h-full w-1 shrink-0 rounded-full ${ac.bar}`} style={{ minHeight: '2.5rem' }} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-800">{pt.id}</span>
                      <Badge className={ARRIVING_STYLE[pt.status]}>{pt.status === 'Checked in' ? 'Checked in' : `${pt.status} · ${pt.eta}m`}</Badge>
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-slate-900">{pt.complaint}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{pt.patient}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge className={ac.cls}>{ac.label}</Badge>
                      {pt.redFlags.map(f => <Badge key={f} className="border-red-200 bg-red-50 text-red-700">{f}</Badge>)}
                    </span>
                  </span>
                </button>
              )
            })}
            {inbound.length === 0 && <p className="px-4 py-10 text-center text-sm font-semibold text-slate-400">No inbound patients right now.</p>}
          </div>
        </section>

        {/* Patient detail */}
        {selected && <FacilityDetail pt={selected} />}
      </div>

      {/* Footer note */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-800">Why this matters</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Carevo hands your team a structured heads-up for every routed patient — chief complaint, safety flags, acuity, coverage, and prep steps — so the right room, staff, and equipment are ready before they walk in. All records shown are fictional demo data.
        </p>
      </section>
    </>
  )
}

function FacilityDetail({ pt }: { pt: Inbound }) {
  const ac = ACUITY[pt.acuity]
  const memberOwes = Math.round(pt.estCost * (1 - pt.coverage / 100))
  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-400">{pt.id}</span>
            <Badge className={ARRIVING_STYLE[pt.status]}>{pt.status === 'Checked in' ? 'Checked in' : `${pt.status} · ETA ${pt.eta} min`}</Badge>
          </div>
          <h3 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">{pt.complaint}</h3>
          <p className="mt-0.5 text-sm text-slate-500">{pt.patient} · {pt.plan}</p>
        </div>
        <Badge className={`${ac.cls} text-xs`}>{ac.label}</Badge>
      </div>

      {/* Patient words + facts */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">In the patient’s words</p>
          <blockquote className="mt-2 rounded-md border-l-2 border-blue-300 bg-slate-50 px-3 py-2 text-sm italic text-slate-700">“{pt.words}”</blockquote>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Extracted facts</p>
          <ul className="mt-2 space-y-1.5">
            {pt.facts.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />{f}
              </li>
            ))}
          </ul>
          {pt.redFlags.length > 0 && (
            <>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-red-600">Safety flags</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {pt.redFlags.map(f => <Badge key={f} className="border-red-200 bg-red-50 text-red-700">{f}</Badge>)}
              </div>
            </>
          )}
        </div>

        <div>
          {/* Vitals */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Reported vitals</p>
          {pt.vitals ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {([['HR', pt.vitals.hr], ['BP', pt.vitals.bp], ['Temp', pt.vitals.temp], ['SpO₂', pt.vitals.spo2]] as [string, string][]).map(([k, v]) => (
                <div key={k} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{k}</p>
                  <p className="mt-0.5 text-base font-bold tabular-nums text-slate-900">{v}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">Not captured at intake</p>
          )}
          {/* Coverage */}
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Coverage snapshot</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Est. cost</p><p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900">{formatCurrency(pt.estCost)}</p></div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2.5"><p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Covered</p><p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-800">{pt.coverage}%</p></div>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5"><p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Pt. owes</p><p className="mt-0.5 text-sm font-bold tabular-nums text-amber-800">{formatCurrency(memberOwes)}</p></div>
          </div>
        </div>
      </div>

      {/* Prep + intake */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-blue-100 bg-blue-50/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-800">Prep before arrival</p>
          <ul className="mt-2 space-y-1.5">
            {pt.prep.map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-blue-300 text-[9px] text-blue-600">✓</span>{item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Suggested intake steps</p>
          <ol className="mt-2 space-y-1.5">
            {pt.intake.map((item, i) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white">{i + 1}</span>{item}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        <button type="button" className="inline-flex items-center gap-1.5 rounded-md bg-blue-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Acknowledge & prep room</button>
        <button type="button" className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Message care team</button>
        <button type="button" className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">View full route</button>
      </div>
    </section>
  )
}

// ═══ CLINIC BOARD (small practice, right-sized) ═════════════
function ClinicBoard({
  patients, selected, onSelect, metrics, controls, clinicName,
}: {
  patients: ClinicPatient[]
  selected: ClinicPatient
  onSelect: (id: string) => void
  metrics: { inbound: number; urgent: number; avgOwe: number; nextEta: number }
  controls: Array<{ title: string; detail: string }>
  clinicName: string
}) {
  const owes = Math.round(selected.estCost * (1 - selected.coverage / 100))
  const coveredPct = selected.coverage
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">{clinicName}</h2>
          <p className="text-xs text-slate-500">Carevo sends you the right patients with the info you need, and quietly keeps you compliant. No extra staff required.</p>
        </div>
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">Routed by Carevo</Badge>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Coming in today" value={String(metrics.inbound)} sub="On the way now" />
        <Kpi label="Needs attention" value={String(metrics.urgent)} sub="Higher priority" tone="warn" />
        <Kpi label="Next arrival" value={metrics.nextEta < 99 ? `${metrics.nextEta} min` : '—'} sub="Soonest ETA" />
        <Kpi label="Avg patient owes" value={formatCurrency(metrics.avgOwe)} sub="After insurance (est.)" tone="good" />
      </section>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        {/* Inbound list */}
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Patients coming in</p>
            <span className="text-[11px] font-medium text-slate-400">Sorted by priority</span>
          </div>
          <div className="divide-y divide-slate-100">
            {patients.map(pt => {
              const active = selected.id === pt.id
              return (
                <button key={pt.id} type="button" onClick={() => onSelect(pt.id)}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-300 ${active ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                  <span className={`mt-0.5 w-1 shrink-0 rounded-full ${PRIORITY[pt.priority].bar}`} style={{ minHeight: '2.25rem' }} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-800">{pt.id}</span>
                      <Badge className={ARRIVING_STYLE[pt.status]}>{pt.status === 'Checked in' ? 'Here now' : `${pt.status} · ${pt.eta}m`}</Badge>
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-slate-900">{pt.complaint}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge className={PRIORITY[pt.priority].cls}>{pt.priority}</Badge>
                      <span className="text-[11px] text-slate-400">{pt.name}</span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Patient detail: heads-up + cost clarity */}
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-slate-400">{selected.id}</span>
                <Badge className={ARRIVING_STYLE[selected.status]}>{selected.status === 'Checked in' ? 'Here now' : `${selected.status} · ETA ${selected.eta} min`}</Badge>
              </div>
              <h3 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">{selected.complaint}</h3>
              <p className="mt-0.5 text-sm text-slate-500">{selected.name} · {selected.plan}</p>
            </div>
            <Badge className={`${PRIORITY[selected.priority].cls} text-xs`}>{selected.priority}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Heads-up */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">In the patient’s words</p>
              <blockquote className="mt-2 rounded-md border-l-2 border-blue-300 bg-slate-50 px-3 py-2 text-sm italic text-slate-700">“{selected.words}”</blockquote>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Notes for your team</p>
              <ul className="mt-2 space-y-1.5">
                {selected.notes.map(n => (
                  <li key={n} className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />{n}</li>
                ))}
              </ul>
              {selected.redFlags.length > 0 && (
                <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">{selected.redFlags.join(' · ')}</p>
              )}
            </div>

            {/* Cost & coverage clarity */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Cost & coverage (est.)</p>
              <div className="mt-2 flex h-6 overflow-hidden rounded-md border border-slate-200">
                <div className="flex items-center justify-center bg-emerald-600 text-[10px] font-bold text-white" style={{ width: `${Math.max(8, coveredPct)}%` }}>{coveredPct}%</div>
                <div className="flex flex-1 items-center justify-center bg-amber-400 text-[10px] font-bold text-amber-900">{100 - coveredPct}%</div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Visit cost</p><p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">{formatCurrency(selected.estCost)}</p></div>
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Insurance</p><p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-800">{formatCurrency(selected.estCost - owes)}</p></div>
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Patient owes</p><p className="mt-0.5 text-lg font-bold tabular-nums text-amber-800">{formatCurrency(owes)}</p></div>
              </div>
              <p className="mt-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">Share this with the patient before the visit, so there are no billing surprises.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            <button type="button" className="inline-flex items-center gap-1.5 rounded-md bg-blue-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Confirm & add to schedule</button>
            <button type="button" className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Text patient the estimate</button>
          </div>
        </section>
      </div>

      {/* Compliance, handled without a team */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-800">Compliance, handled for you</p>
            <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900">No spreadsheets. No compliance hire. Carevo runs the checks itself.</h3>
          </div>
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> All clear</Badge>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {controls.map(c => (
            <div key={c.title} className="rounded-md border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">✓</span>
                <p className="text-sm font-semibold text-slate-900">{c.title}</p>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">{c.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">Every routing decision is logged automatically with a timestamp, so if you’re ever audited, the record is already there. All records shown are fictional demo data.</p>
      </section>
    </>
  )
}
