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
  const [tab, setTab] = useState<Tab>('queue')
  const [cases, setCases] = useState<CaseRow[]>(() => SEED_CASES.map((c, i) => ({ ...c, receivedAt: Date.now() - (i + 1) * 47000 })))
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
  const streamCounter = useRef(SEED_CASES.length)

  useEffect(() => {
    const t = setInterval(() => { setNow(Date.now()); setTick(v => v + 1) }, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!streamOn) return
    const t = setInterval(() => {
      setCases(prev => {
        const template = STREAM_POOL[streamCounter.current % STREAM_POOL.length]
        streamCounter.current += 1
        const nextNum = 2406 + (streamCounter.current - SEED_CASES.length - 1)
        const fresh: CaseRow = { ...template, id: `CV-${nextNum}`, receivedAt: Date.now(), isNew: true }
        return [fresh, ...prev.map(c => ({ ...c, isNew: false }))].slice(0, 14)
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
        <aside className="shrink-0 border-b border-slate-200 bg-blue-950 text-slate-200 xl:min-h-screen xl:w-64 xl:border-b-0 xl:border-r">
          <div className="flex items-center gap-2.5 px-5 py-4">
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

          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 xl:mt-2 xl:flex-col xl:overflow-visible xl:pb-0" aria-label="Sections">
            {TABS.map(item => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex min-w-max items-center gap-3 rounded-md px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 xl:min-w-0 ${
                    active ? 'bg-white/12 text-white' : 'text-blue-200 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span className={`${active ? 'text-white' : 'text-blue-300'}`}><Icon path={ICONS[item.id]} /></span>
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold">{item.title}</span>
                    <span className="hidden text-[11px] font-medium text-blue-300/80 xl:block">{item.subtitle}</span>
                  </span>
                </button>
              )
            })}
          </nav>

          <div className="hidden px-5 py-4 xl:mt-auto xl:block">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> All safety gates passing
              </p>
              <p className="mt-1.5 text-[11px] leading-4 text-blue-300/80">Engine {ENGINE} · 0 under-triage on the latest 240-case gate.</p>
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
                  Northstar Health Plan <span className="text-slate-300">/</span> Care Routing
                </p>
                <h1 className="truncate text-base font-bold tracking-tight text-slate-900">{TABS.find(t => t.id === tab)?.title}</h1>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Badge className="border-slate-200 bg-slate-50 text-slate-600">Sandbox · demo data</Badge>
                <Badge className="border-slate-200 bg-white font-mono tabular-nums text-slate-600">{clock}</Badge>
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
          </div>
        </main>
      </div>
    </div>
  )
}

function CaseSummary({ selected, now, onReplay, embedded = false }: { selected: CaseRow; now: number; onReplay?: () => void; embedded?: boolean }) {
  return (
    <aside className={embedded ? 'p-4' : 'border-t border-slate-200 bg-slate-50/60 p-4 lg:border-l lg:border-t-0'}>
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs font-semibold text-slate-400">{selected.id}</p>
        <p className="text-[11px] font-medium tabular-nums text-slate-400">{agoLabel(selected.receivedAt, now)}</p>
      </div>
      <h3 className="mt-2 text-base font-bold tracking-tight text-slate-900">{selected.intake}</h3>
      <p className="mt-1 text-xs text-slate-500">{selected.member} · {selected.market}</p>
      <dl className="mt-4 grid gap-2">
        {([
          ['Route', <Badge key="r" className={LEVEL_STYLE[selected.level]}>{selected.level}</Badge>],
          ['Questions', <span key="q" className="text-sm font-semibold tabular-nums text-slate-800">{selected.questions}</span>],
          ['Confidence', <span key="c" className="text-sm font-semibold text-slate-800">{selected.confidence}</span>],
          ['Audit hash', <span key="h" className="font-mono text-xs font-semibold text-blue-800">{hashId(selected.id)}</span>],
        ] as [string, ReactNode][]).map(([label, val]) => (
          <div key={label} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</dt>
            <dd>{val}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Red flags</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.redFlags.length
            ? selected.redFlags.map(flag => <Badge key={flag} className="border-red-200 bg-red-50 text-red-700">{flag}</Badge>)
            : <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">none established</Badge>}
        </div>
      </div>
      {onReplay && (
        <button type="button" onClick={onReplay} className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
          Replay decision trace
          <svg viewBox="0 0 16 16" className="h-3 w-3 fill-blue-800"><path d="M4 3l9 5-9 5z" /></svg>
        </button>
      )}
    </aside>
  )
}
