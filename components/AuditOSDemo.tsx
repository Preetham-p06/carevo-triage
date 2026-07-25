'use client'

// Public enterprise demo using fictional members and simulated operations data.
// Nothing here is a real patient record. All numbers are illustrative.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'

type Tab = 'queue' | 'trace' | 'agents' | 'financials'
type Level = 'Emergency' | 'ER' | 'Urgent Care' | 'Primary Care' | 'Telehealth' | 'Home Care'
type Status = 'Complete' | 'Review' | 'Escalated'

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
    id: 'CV-2401',
    member: 'Fictional member, 58',
    market: 'Commercial PPO',
    intake: 'Chest pressure with left arm radiation',
    level: 'Emergency',
    control: '911 hard stop issued',
    owner: 'Safety queue',
    status: 'Escalated',
    questions: 1,
    confidence: 'Hard stop',
    redFlags: ['chest pressure', 'arm radiation'],
    saved: 0,
    trace: [
      'Member message: chest feels tight and goes into my left arm',
      'Emergency screen ran before any route selection',
      'Facts captured: chest pressure, radiation, acute onset',
      'Rule matched: emergency cardiac floor',
      'Route returned: emergency care with 911 instruction',
      'Audit record: route, ruleset, and timestamp saved',
    ],
  },
  {
    id: 'CV-2402',
    member: 'Fictional member, 34',
    market: 'Commercial HMO',
    intake: 'Fever 103.1 for two days',
    level: 'Urgent Care',
    control: 'Red flags screened negative',
    owner: 'Network routing',
    status: 'Complete',
    questions: 4,
    confidence: '0.86',
    redFlags: ['high fever'],
    saved: 1850,
    trace: [
      'Member message: fever for two days',
      'Follow-up asked for measured temperature and danger signs',
      'Facts captured: 103.1 F, 48 hours, fluids tolerated',
      'Emergency screen: stiff neck, rash, dehydration not established',
      'Rule matched: sustained adult fever floor',
      'Route returned: urgent care with facility context',
    ],
  },
  {
    id: 'CV-2403',
    member: 'Fictional member, 22',
    market: 'Student plan',
    intake: 'Rolled ankle, swollen, can bear weight',
    level: 'Home Care',
    control: 'Escalation instructions included',
    owner: 'Closed loop',
    status: 'Complete',
    questions: 5,
    confidence: '0.81',
    redFlags: [],
    saved: 2900,
    trace: [
      'Member message: rolled ankle at practice yesterday',
      'Follow-up checked walking ability, deformity, and numbness',
      'Facts captured: ankle injury, swelling, can walk',
      'Emergency screen: open fracture and severe deformity not established',
      'Rule matched: no higher-acuity floor fired',
      'Route returned: home care with escalation guidance',
    ],
  },
  {
    id: 'CV-2404',
    member: 'Fictional guardian, child 8',
    market: 'Medicaid',
    intake: 'Child fever with wrist and ankle rash',
    level: 'ER',
    control: 'Safety floor applied',
    owner: 'Pediatric review',
    status: 'Review',
    questions: 0,
    confidence: 'Floor enforced',
    redFlags: ['pediatric fever', 'extremity rash'],
    saved: 0,
    trace: [
      'Guardian message: child has fever and rash on wrists and ankles',
      'Emergency screen detected pediatric fever plus extremity rash',
      'Facts captured: child, fever, rash distribution',
      'Rule matched: pediatric fever-rash ER floor',
      'Route returned: ER',
      'Audit record: high-risk route not delayed by more questions',
    ],
  },
  {
    id: 'CV-2405',
    member: 'Fictional member, 61',
    market: 'Medicare Advantage',
    intake: 'Gradual shortness of breath on stairs',
    level: 'Telehealth',
    control: 'Chest pain and rest-breathing screened',
    owner: 'Virtual care',
    status: 'Complete',
    questions: 6,
    confidence: '0.74',
    redFlags: [],
    saved: 2400,
    trace: [
      'Member message: getting winded walking up stairs',
      'Follow-up checked breathing at rest and chest symptoms',
      'Facts captured: gradual onset, exertional only',
      'Emergency screen: no rest distress or chest pain established',
      'Rule matched: no ER floor fired',
      'Route returned: telehealth appointment',
    ],
  },
]

// Pool of extra fictional intakes that "stream in" live during the demo.
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

const TABS: Array<{ id: Tab; title: string; subtitle: string }> = [
  { id: 'queue', title: 'Live Work Queue', subtitle: 'Cases streaming in real time with owners and controls.' },
  { id: 'trace', title: 'Decision Trace', subtitle: 'Replay a route from intake to rule match.' },
  { id: 'agents', title: 'AI Compliance Agents', subtitle: 'Autonomous controls running continuously.' },
  { id: 'financials', title: 'Cost & Coverage', subtitle: 'Insurance cost-share and avoidable ER savings.' },
]

// Illustrative average cost for each care level (USD).
const CARE_COST: Record<Level, number> = {
  Emergency: 2600,
  ER: 2200,
  'Urgent Care': 260,
  'Primary Care': 170,
  Telehealth: 75,
  'Home Care': 0,
}
const ER_BASELINE = 2200

// Illustrative plan cost-share by market (share the plan covers).
const PLAN_COVERAGE: Record<string, number> = {
  'Commercial PPO': 0.8,
  'Commercial HMO': 0.85,
  'Medicare Advantage': 0.9,
  Medicaid: 0.98,
  'Student plan': 0.7,
  'Behavioral health': 0.85,
}

type CoverageBreakdown = {
  estCost: number
  covered: number
  memberOwes: number
  coverRate: number
  avoided: number
}

function coverageFor(row: CaseRow): CoverageBreakdown {
  const estCost = CARE_COST[row.level] ?? 0
  const rate = PLAN_COVERAGE[row.market] ?? 0.8
  const covered = Math.round(estCost * rate)
  const memberOwes = estCost - covered
  const avoided = row.level === 'Emergency' || row.level === 'ER' ? 0 : Math.max(0, ER_BASELINE - estCost)
  return { estCost, covered, memberOwes, coverRate: rate, avoided }
}

type Agent = {
  name: string
  scope: string
  cadence: string
  base: number
  perTick: number
}

const AGENTS: Agent[] = [
  { name: 'PHI Redaction Monitor', scope: 'Scans every intake for identifiers before storage', cadence: 'Per message', base: 48210, perTick: 3 },
  { name: 'Consent State Auditor', scope: 'Verifies opt-in status before any research use', cadence: 'Per session', base: 12894, perTick: 1 },
  { name: 'Route Safety Sentinel', scope: 'Re-checks every route against emergency floors', cadence: 'Per decision', base: 30117, perTick: 2 },
  { name: 'Audit Evidence Writer', scope: 'Pins ruleset, KB version, and hash to each record', cadence: 'Per decision', base: 30117, perTick: 2 },
  { name: 'HIPAA Access Watch', scope: 'Flags out-of-policy access to member data', cadence: 'Continuous', base: 5402, perTick: 1 },
  { name: 'FDA Boundary Guard', scope: 'Confirms output stays navigation, not diagnosis', cadence: 'Per decision', base: 30117, perTick: 2 },
]

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

function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black leading-none ${className}`}>
      {children}
    </span>
  )
}

function Metric({ label, value, caption, live = false }: { label: string; value: string; caption: string; live?: boolean }) {
  return (
    <div className="rounded-xl border border-cyan-100 bg-white/90 px-3 py-3 shadow-sm shadow-cyan-900/5 sm:px-4">
      <div className="flex items-center gap-1.5">
        {live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      </div>
      <p className="mt-2 text-xl font-black tracking-[-0.04em] text-cyan-950 sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{caption}</p>
    </div>
  )
}

function complianceChecks(row: CaseRow) {
  return [
    { label: 'PHI redaction', value: 'Applied at intake', ok: true },
    { label: 'Consent state', value: row.market === 'Medicaid' ? 'Opt-in recorded' : 'Opt-in recorded', ok: true },
    { label: 'Emergency screen', value: 'Ran before routing', ok: true },
    { label: 'Ruleset pinned', value: RULESET, ok: true },
    { label: 'FDA boundary', value: 'Navigation, not diagnosis', ok: true },
    { label: 'Audit hash', value: hashId(row.id), ok: true },
  ]
}

export default function EnterpriseDemo() {
  const [tab, setTab] = useState<Tab>('queue')
  const [cases, setCases] = useState<CaseRow[]>(() =>
    SEED_CASES.map((c, i) => ({ ...c, receivedAt: Date.now() - (i + 1) * 47000 }))
  )
  const [selectedId, setSelectedId] = useState(SEED_CASES[0].id)
  const [now, setNow] = useState(() => Date.now())
  const [streamOn, setStreamOn] = useState(true)
  const [levelFilter, setLevelFilter] = useState<'all' | Level>('all')
  const [query, setQuery] = useState('')
  const [tick, setTick] = useState(0)

  // Trace replay state
  const [replayStep, setReplayStep] = useState<number>(-1)
  const [replaying, setReplaying] = useState(false)
  const replayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const streamCounter = useRef(SEED_CASES.length)

  // Global clock + agent tick
  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now())
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // Live case stream
  useEffect(() => {
    if (!streamOn) return
    const t = setInterval(() => {
      setCases(prev => {
        const template = STREAM_POOL[streamCounter.current % STREAM_POOL.length]
        streamCounter.current += 1
        const nextNum = 2406 + (streamCounter.current - SEED_CASES.length - 1)
        const fresh: CaseRow = {
          ...template,
          id: `CV-${nextNum}`,
          receivedAt: Date.now(),
          isNew: true,
        }
        const cleared = prev.map(c => ({ ...c, isNew: false }))
        return [fresh, ...cleared].slice(0, 12)
      })
    }, 6500)
    return () => clearInterval(t)
  }, [streamOn])

  const selected = cases.find(c => c.id === selectedId) ?? cases[0]

  // Start replay whenever a new case is selected on the trace tab
  function startReplay() {
    if (replayRef.current) clearInterval(replayRef.current)
    setReplaying(true)
    setReplayStep(0)
    let step = 0
    replayRef.current = setInterval(() => {
      step += 1
      if (step >= selected.trace.length) {
        if (replayRef.current) clearInterval(replayRef.current)
        setReplayStep(selected.trace.length)
        setReplaying(false)
        return
      }
      setReplayStep(step)
    }, 850)
  }

  useEffect(() => {
    return () => {
      if (replayRef.current) clearInterval(replayRef.current)
    }
  }, [])

  // Reset replay when switching tabs or case
  useEffect(() => {
    if (replayRef.current) clearInterval(replayRef.current)
    setReplaying(false)
    setReplayStep(-1)
  }, [selectedId, tab])

  const filtered = useMemo(() => {
    return cases.filter(row => {
      if (levelFilter !== 'all' && row.level !== levelFilter) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        if (!row.intake.toLowerCase().includes(q) && !row.id.toLowerCase().includes(q) && !row.market.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [cases, levelFilter, query])

  const metrics = useMemo(() => {
    const covs = cases.map(coverageFor)
    const savings = covs.reduce((sum, c) => sum + c.avoided, 0)
    const memberTotal = covs.reduce((sum, c) => sum + c.memberOwes, 0)
    const coveredTotal = covs.reduce((sum, c) => sum + c.covered, 0)
    const avgQuestions = cases.reduce((sum, row) => sum + row.questions, 0) / cases.length
    const redirects = covs.filter(c => c.avoided > 0).length
    const avgMember = cases.length ? Math.round(memberTotal / cases.length) : 0
    return {
      active: cases.length,
      savings,
      coveredTotal,
      memberTotal,
      avgMember,
      redirects,
      avgQuestions: avgQuestions.toFixed(1),
      reviewCount: cases.filter(row => row.status !== 'Complete').length,
    }
  }, [cases])

  const totalChecks = useMemo(() => AGENTS.reduce((s, a) => s + a.base + a.perTick * tick, 0), [tick])

  const clock = new Date(now).toLocaleTimeString('en-US', { hour12: false })

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_85%_8%,rgba(37,99,235,0.14),transparent_28%),linear-gradient(180deg,#f5fbff_0%,#f4f7fb_42%,#ffffff_100%)] text-slate-950 [font-family:'Plus_Jakarta_Sans',system-ui,sans-serif]">
      <section className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6">
        {/* Top bar */}
        <header className="rounded-xl border border-cyan-100 bg-white/92 shadow-sm shadow-cyan-900/5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-100 px-4 py-3 sm:gap-4 sm:px-5">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-slate-950">
                <img src="/brand/carevo-logo.png" alt="" className="h-full w-full object-cover" />
              </span>
              <span>
                <span className="block text-base font-black leading-none tracking-tight">Carevo</span>
                <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">AuditOS — Enterprise Operations</span>
              </span>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                LIVE
              </span>
              <Badge className="border-slate-200 bg-slate-50 font-mono text-slate-600">{clock}</Badge>
              <Badge className="border-cyan-200 bg-cyan-50 text-cyan-800">Simulated demo data</Badge>
              <Link href="/contact" className="inline-flex min-h-9 items-center justify-center rounded-md bg-cyan-900 px-4 py-2 text-sm font-black text-white shadow-sm shadow-cyan-900/15 transition hover:bg-cyan-800">
                Request pilot
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 sm:gap-x-6 sm:px-5 sm:text-xs">
            <span>Northstar Health Plan</span>
            <span className="text-slate-300">/</span>
            <span>Care Routing Control Center</span>
            <span className="ml-auto inline-flex items-center gap-2 text-cyan-700">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-cyan-500" />
              {totalChecks.toLocaleString()} compliance checks today
            </span>
          </div>
        </header>

        <div className="mt-4 grid gap-4 xl:grid-cols-[320px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-xl border border-cyan-100 bg-white/92 p-4 shadow-sm shadow-cyan-900/5 backdrop-blur xl:sticky xl:top-4 xl:self-start">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700">Carevo AuditOS</p>
            <h1 className="mt-3 font-display text-[1.7rem] font-black leading-[1.08] tracking-[-0.055em] text-cyan-950 sm:text-[1.9rem] sm:leading-tight">
              AI-native care-routing compliance.
            </h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              Autonomous agents monitor intake, route safety, consent, and audit evidence continuously — the layer that replaces spreadsheets and periodic audit sweeps.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <span className="h-1.5 rounded-full bg-cyan-500" />
              <span className="h-1.5 rounded-full bg-emerald-500" />
              <span className="h-1.5 rounded-full bg-amber-400" />
            </div>
            <div className="mt-5 grid gap-2">
              {TABS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`min-h-12 rounded-lg border px-3 py-3 text-left transition ${
                    tab === item.id
                      ? 'border-cyan-200 bg-cyan-50 text-cyan-950 shadow-sm shadow-cyan-900/5'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-100 hover:bg-cyan-50/40'
                  }`}
                >
                  <span className="block text-sm font-black">{item.title}</span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{item.subtitle}</span>
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Case stream</span>
                <button
                  type="button"
                  onClick={() => setStreamOn(s => !s)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black transition ${
                    streamOn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${streamOn ? 'animate-pulse bg-emerald-500' : 'bg-slate-400'}`} />
                  {streamOn ? 'Live' : 'Paused'}
                </button>
              </div>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                New intakes arrive from Carevo-powered front doors as members complete triage.
              </p>
            </div>
          </aside>

          {/* Main */}
          <div className="space-y-4">
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <Metric label="Active cases" value={String(metrics.active)} caption="In live queue" live />
              <Metric label="Review needed" value={String(metrics.reviewCount)} caption="Requires staff check" />
              <Metric label="Under-triage" value="0" caption="Latest 240-case gate" />
              <Metric label="Emergency capture" value="100%" caption="Safety control" />
              <Metric label="Avg questions" value={metrics.avgQuestions} caption="Adaptive intake" />
            </section>

            <section className="overflow-hidden rounded-xl border border-cyan-100 bg-white/94 shadow-sm shadow-cyan-900/5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-100 bg-[linear-gradient(90deg,#ffffff_0%,#ecfeff_100%)] px-4 py-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700">
                    {TABS.find(item => item.id === tab)?.title}
                  </p>
                  <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-cyan-950">Care routing operations workbench</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Audit complete</Badge>
                  <Badge className="border-cyan-200 bg-cyan-50 text-cyan-800">Provenance attached</Badge>
                </div>
              </div>

              {/* QUEUE */}
              {tab === 'queue' && (
                <div>
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                    <input
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Search intake, case ID, or market..."
                      className="min-w-[180px] flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-cyan-300"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {(['all', 'Emergency', 'ER', 'Urgent Care', 'Telehealth', 'Home Care'] as const).map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setLevelFilter(lvl)}
                          className={`rounded-full border px-3 py-1.5 text-[11px] font-black transition ${
                            levelFilter === lvl
                              ? 'border-cyan-300 bg-cyan-600 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {lvl === 'all' ? 'All routes' : lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid lg:grid-cols-[1fr_360px]">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                          <tr>
                            <th className="px-4 py-3">Case</th>
                            <th className="px-4 py-3">Received</th>
                            <th className="px-4 py-3">Intake</th>
                            <th className="px-4 py-3">Route</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filtered.map(row => (
                            <tr
                              key={row.id}
                              onClick={() => setSelectedId(row.id)}
                              className={`cursor-pointer transition ${
                                selectedId === row.id ? 'bg-cyan-50/70' : row.isNew ? 'animate-[carevo-row-in_0.6s_ease]' : 'bg-white hover:bg-slate-50'
                              }`}
                            >
                              <td className="px-4 py-3">
                                <span className="font-mono text-xs font-black text-cyan-700">{row.id}</span>
                                {row.isNew && <span className="ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-700">new</span>}
                              </td>
                              <td className="px-4 py-3 text-xs font-bold text-slate-500">{agoLabel(row.receivedAt, now)}</td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-slate-700">{row.intake}</p>
                                <p className="mt-0.5 text-xs font-semibold text-slate-400">{row.member} · {row.market}</p>
                              </td>
                              <td className="px-4 py-3"><Badge className={LEVEL_STYLE[row.level]}>{row.level}</Badge></td>
                              <td className="px-4 py-3"><Badge className={STATUS_STYLE[row.status]}>{row.status}</Badge></td>
                            </tr>
                          ))}
                          {filtered.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-10 text-center text-sm font-semibold text-slate-400">No cases match this filter.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <CaseSummary selected={selected} now={now} onReplay={() => { setTab('trace') }} />
                  </div>
                </div>
              )}

              {/* TRACE */}
              {tab === 'trace' && (
                <div className="grid gap-4 p-4 lg:grid-cols-[360px_1fr]">
                  <CaseSummary selected={selected} now={now} />
                  <div className="rounded-xl border border-cyan-100 bg-cyan-50/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700">Route trace replay</p>
                      <button
                        type="button"
                        onClick={startReplay}
                        className="inline-flex items-center gap-1.5 rounded-md bg-cyan-700 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-cyan-800"
                      >
                        {replaying ? 'Replaying…' : replayStep >= selected.trace.length ? 'Replay again' : 'Play decision'}
                        <svg viewBox="0 0 16 16" className="h-3 w-3 fill-white"><path d="M4 3l9 5-9 5z" /></svg>
                      </button>
                    </div>
                    <ol className="mt-4 space-y-2.5">
                      {selected.trace.map((step, index) => {
                        const revealed = replayStep < 0 ? true : index < replayStep
                        const active = replayStep === index
                        return (
                          <li key={step} className={`grid grid-cols-[34px_1fr] gap-3 transition-all duration-300 ${revealed || active ? 'opacity-100' : 'opacity-30'}`}>
                            <span className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-black shadow-sm transition ${
                              revealed ? 'bg-emerald-500 text-white' : active ? 'animate-pulse bg-cyan-600 text-white' : 'bg-white text-slate-400'
                            }`}>
                              {revealed ? '✓' : index + 1}
                            </span>
                            <p className={`rounded-lg border px-4 py-3 text-sm font-semibold leading-6 transition ${
                              active ? 'border-cyan-300 bg-white text-slate-900 shadow-sm' : 'border-slate-200 bg-white text-slate-700'
                            }`}>{step}</p>
                          </li>
                        )
                      })}
                    </ol>
                    <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">AI-native controls applied to this case</p>
                      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                        {complianceChecks(selected).map(c => (
                          <div key={c.label} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white">✓</span>
                            <span className="text-slate-500">{c.label}:</span>
                            <span className="truncate font-mono text-[11px] text-slate-700">{c.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AGENTS */}
              {tab === 'agents' && (
                <div className="p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-100 bg-cyan-50/40 px-4 py-3">
                    <p className="text-sm font-black text-cyan-950">Six autonomous agents running against the {ENGINE} pipeline</p>
                    <span className="inline-flex items-center gap-2 text-xs font-black text-emerald-700">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> All passing
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {AGENTS.map((agent, i) => {
                      const checked = agent.base + agent.perTick * tick
                      const scanPct = 40 + ((tick * (7 + i)) % 60)
                      return (
                        <article key={agent.name} className="rounded-xl border border-cyan-100 bg-[linear-gradient(180deg,#ffffff_0%,#f0fdff_100%)] p-4 shadow-sm shadow-cyan-900/5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-black leading-5 text-slate-950">{agent.name}</h3>
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Active
                            </span>
                          </div>
                          <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{agent.scope}</p>
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-700" style={{ width: `${scanPct}%` }} />
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-400">{agent.cadence}</span>
                            <span className="font-mono text-cyan-800">{checked.toLocaleString()} checked</span>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      ['HIPAA', 'Access, minimum-necessary, and PHI handling monitored continuously.'],
                      ['FDA boundary', 'Every output verified as care navigation, not diagnosis or treatment.'],
                      ['Evidence trail', 'Ruleset, KB version, and hash pinned to each decision, immutably.'],
                    ].map(([title, text]) => (
                      <div key={title} className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700">{title}</p>
                        <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FINANCIALS — cost & insurance coverage */}
              {tab === 'financials' && (
                <div className="p-4">
                  {/* Summary tiles */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-cyan-800 bg-[linear-gradient(135deg,#083344_0%,#0f172a_60%,#052e2b_100%)] p-4 text-white shadow-lg shadow-cyan-950/15">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-200">Avoidable ER cost</p>
                      <p className="mt-2 text-3xl font-black tracking-[-0.05em]">{formatCurrency(metrics.savings)}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-300">Across the live queue</p>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-[linear-gradient(180deg,#ffffff,#ecfdf5)] p-4 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Plan covers</p>
                      <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-emerald-800">{formatCurrency(metrics.coveredTotal)}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Insurer responsibility (est.)</p>
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-[linear-gradient(180deg,#ffffff,#fffbeb)] p-4 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">Member out-of-pocket</p>
                      <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-amber-800">{formatCurrency(metrics.avgMember)}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Average per case (est.)</p>
                    </div>
                    <div className="rounded-xl border border-cyan-100 bg-[linear-gradient(180deg,#ffffff,#f0fdff)] p-4 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700">Lower-acuity redirects</p>
                      <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-cyan-900">{metrics.redirects}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Kept out of the ER</p>
                    </div>
                  </div>

                  {/* Per-case cost & coverage table */}
                  <div className="mt-4 overflow-hidden rounded-xl border border-cyan-100 bg-white">
                    <div className="flex items-center justify-between border-b border-cyan-100 bg-cyan-50/50 px-4 py-2.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700">Cost &amp; insurance breakdown</p>
                      <span className="text-[10px] font-bold text-slate-400">Estimates · not a quote</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                          <tr>
                            <th className="px-4 py-3">Case</th>
                            <th className="px-4 py-3">Route</th>
                            <th className="px-4 py-3">Plan</th>
                            <th className="px-4 py-3 text-right">Est. cost</th>
                            <th className="px-4 py-3">Plan covers</th>
                            <th className="px-4 py-3 text-right">Member owes</th>
                            <th className="px-4 py-3 text-right">ER avoided</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {cases.map(row => {
                            const cov = coverageFor(row)
                            return (
                              <tr
                                key={row.id}
                                onClick={() => setSelectedId(row.id)}
                                className={`cursor-pointer transition ${selectedId === row.id ? 'bg-cyan-50/70' : 'hover:bg-slate-50'}`}
                              >
                                <td className="px-4 py-3 font-mono text-xs font-black text-cyan-700">{row.id}</td>
                                <td className="px-4 py-3"><Badge className={LEVEL_STYLE[row.level]}>{row.level}</Badge></td>
                                <td className="px-4 py-3 text-xs font-bold text-slate-600">{row.market}</td>
                                <td className="px-4 py-3 text-right font-black text-slate-800">{formatCurrency(cov.estCost)}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round(cov.coverRate * 100)}%` }} />
                                    </div>
                                    <span className="text-xs font-bold text-emerald-700">{Math.round(cov.coverRate * 100)}%</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right font-black text-amber-700">{formatCurrency(cov.memberOwes)}</td>
                                <td className="px-4 py-3 text-right font-black text-cyan-800">{cov.avoided > 0 ? formatCurrency(cov.avoided) : '—'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Selected case coverage + routing mix */}
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-cyan-100 bg-white p-5 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700">Coverage detail — {selected.id}</p>
                      <h3 className="mt-2 text-lg font-black tracking-[-0.03em] text-slate-950">{selected.intake}</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{selected.member} · {selected.market}</p>
                      {(() => {
                        const cov = coverageFor(selected)
                        const coveredPct = cov.estCost ? Math.round((cov.covered / cov.estCost) * 100) : 0
                        return (
                          <div className="mt-4">
                            <div className="flex h-6 overflow-hidden rounded-lg border border-slate-200">
                              <div className="flex items-center justify-center bg-emerald-500 text-[10px] font-black text-white" style={{ width: `${Math.max(8, coveredPct)}%` }}>{coveredPct}%</div>
                              <div className="flex flex-1 items-center justify-center bg-amber-400 text-[10px] font-black text-amber-900">{100 - coveredPct}%</div>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                              <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Est. cost</p>
                                <p className="mt-1 text-lg font-black text-slate-900">{formatCurrency(cov.estCost)}</p>
                              </div>
                              <div className="rounded-lg bg-emerald-50 p-3">
                                <p className="text-[10px] font-black uppercase tracking-wide text-emerald-600">Plan pays</p>
                                <p className="mt-1 text-lg font-black text-emerald-800">{formatCurrency(cov.covered)}</p>
                              </div>
                              <div className="rounded-lg bg-amber-50 p-3">
                                <p className="text-[10px] font-black uppercase tracking-wide text-amber-600">You owe</p>
                                <p className="mt-1 text-lg font-black text-amber-800">{formatCurrency(cov.memberOwes)}</p>
                              </div>
                            </div>
                            {cov.avoided > 0 && (
                              <p className="mt-3 rounded-lg bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-800">
                                Routing here instead of the ER avoids about {formatCurrency(cov.avoided)} in cost.
                              </p>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                    <div className="rounded-xl border border-cyan-100 bg-cyan-50/45 p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700">Routing mix (live)</p>
                      <div className="mt-4 space-y-3">
                        {(['Emergency', 'ER', 'Urgent Care', 'Telehealth', 'Home Care'] as Level[]).map(level => {
                          const count = cases.filter(row => row.level === level).length
                          const width = `${Math.max(6, (count / Math.max(1, cases.length)) * 100)}%`
                          return (
                            <div key={level}>
                              <div className="flex items-center justify-between text-xs font-black text-slate-600">
                                <span>{level}</span>
                                <span>{count}</span>
                              </div>
                              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white">
                                <div className="h-full rounded-full bg-cyan-600 transition-all duration-700" style={{ width }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">
                        Coverage figures are illustrative estimates based on plan type — not quotes or enrollment decisions.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className="rounded-xl border border-cyan-100 bg-white/94 p-5 shadow-sm shadow-cyan-900/5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700">Enterprise fit</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.045em] text-cyan-950">
                  Built for payer operations, front-door navigation, and facility routing teams.
                </h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                  Carevo turns symptom intake into an operational record that shows why a route was returned, which safeguards ran, and where staff should focus review time — all monitored by AI agents instead of manual audit cycles.
                </p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#ecfdf5_100%)] p-5 shadow-sm shadow-emerald-900/5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Next step</p>
                <h2 className="mt-3 text-xl font-black tracking-[-0.04em] text-cyan-950">Map this to your workflow.</h2>
                <Link href="/contact" className="mt-5 inline-flex w-full min-h-11 items-center justify-center rounded-md bg-cyan-800 px-5 py-3 text-sm font-black text-white shadow-sm shadow-cyan-900/15 transition hover:bg-cyan-900">
                  Request enterprise walkthrough
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}

function CaseSummary({ selected, now, onReplay }: { selected: CaseRow; now: number; onReplay?: () => void }) {
  return (
    <aside className="border-t border-slate-200 bg-white p-4 lg:border-l lg:border-t-0">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs font-black text-slate-400">{selected.id}</p>
        <p className="text-[11px] font-bold text-slate-400">{agoLabel(selected.receivedAt, now)}</p>
      </div>
      <h3 className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-950">{selected.intake}</h3>
      <p className="mt-2 text-sm font-semibold text-slate-500">{selected.member} · {selected.market}</p>
      <div className="mt-4 grid gap-3">
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Route</span>
          <Badge className={LEVEL_STYLE[selected.level]}>{selected.level}</Badge>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Questions</span>
          <span className="text-sm font-black text-slate-800">{selected.questions}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Confidence</span>
          <span className="text-sm font-black text-slate-800">{selected.confidence}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Audit hash</span>
          <span className="font-mono text-xs font-black text-cyan-800">{hashId(selected.id)}</span>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Red flags</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.redFlags.length ? selected.redFlags.map(flag => (
            <Badge key={flag} className="border-red-200 bg-red-50 text-red-700">{flag}</Badge>
          )) : <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">none established</Badge>}
        </div>
      </div>
      {onReplay && (
        <button
          type="button"
          onClick={onReplay}
          className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-black text-cyan-800 transition hover:bg-cyan-100"
        >
          Replay decision trace
          <svg viewBox="0 0 16 16" className="h-3 w-3 fill-cyan-800"><path d="M4 3l9 5-9 5z" /></svg>
        </button>
      )}
    </aside>
  )
}
