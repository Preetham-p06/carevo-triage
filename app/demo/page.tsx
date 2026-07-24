'use client'

// Carevo AuditOS / Routing Intelligence Layer demo.
// Public, simulated enterprise console. No real patient data.
import { useMemo, useState } from 'react'
import Link from 'next/link'

type View = 'audit' | 'routing'
type Tab = 'monitor' | 'trace' | 'compliance' | 'savings'
type Level = 'Emergency' | 'ER' | 'Urgent Care' | 'Primary Care' | 'Telehealth' | 'Home Care'

type CaseRow = {
  id: string
  member: string
  symptom: string
  level: Level
  status: string
  safe: boolean
  confidence: string
  questions: number
  redFlags: string[]
  payer: string
  saved: number
  trace: string[]
}

const CASES: CaseRow[] = [
  {
    id: 'CV-2401',
    member: 'Fictional member, 58',
    symptom: 'Chest pressure with left arm radiation',
    level: 'Emergency',
    status: '911 hard stop issued',
    safe: true,
    confidence: 'Hard stop',
    questions: 1,
    redFlags: ['chest pressure', 'arm radiation'],
    payer: 'Commercial PPO',
    saved: 0,
    trace: [
      'Patient message: chest feels tight and goes into my left arm',
      'Emergency screen: cardiac warning pattern detected before AI routing',
      'Extracted facts: chest pressure, radiation, acute onset',
      'Rule matched: emergency cardiac floor',
      'Care route: call 911 / emergency care',
      'Audit result: replayable trace saved with rule provenance',
    ],
  },
  {
    id: 'CV-2402',
    member: 'Fictional member, 34',
    symptom: 'Fever 103.1 for two days, no stiff neck or rash',
    level: 'Urgent Care',
    status: 'Routed to in-network UC',
    safe: true,
    confidence: '0.86',
    questions: 4,
    redFlags: ['high fever'],
    payer: 'Commercial HMO',
    saved: 1850,
    trace: [
      'Patient message: fever for two days',
      'Clarify-first question: thermometer number requested',
      'Extracted facts: 103.1 F, 48 hours, fluids tolerated',
      'Emergency screen: stiff neck, rash, dehydration screened negative',
      'Rule matched: sustained adult fever floor',
      'Care route: urgent care with nearby facility context',
    ],
  },
  {
    id: 'CV-2403',
    member: 'Fictional member, 22',
    symptom: 'Rolled ankle, swollen, can bear weight',
    level: 'Home Care',
    status: 'Closed with 48h check-in',
    safe: true,
    confidence: '0.81',
    questions: 5,
    redFlags: [],
    payer: 'Student plan',
    saved: 2900,
    trace: [
      'Patient message: rolled ankle at practice yesterday',
      'Follow-up: weight-bearing and deformity screen',
      'Extracted facts: ankle injury, swelling, can walk, no visible deformity',
      'Emergency screen: no open fracture, numbness, or severe deformity',
      'Rule matched: no higher-acuity floor fired',
      'Care route: home care with escalation instructions',
    ],
  },
  {
    id: 'CV-2404',
    member: 'Fictional guardian, child 8',
    symptom: 'Child fever with wrist and ankle rash',
    level: 'ER',
    status: 'ER recommendation issued',
    safe: true,
    confidence: 'Floor enforced',
    questions: 0,
    redFlags: ['pediatric fever', 'extremity rash'],
    payer: 'Medicaid',
    saved: 0,
    trace: [
      'Patient message: child has fever and rash on wrists and ankles',
      'Emergency screen: pediatric fever plus extremity rash pattern detected',
      'Extracted facts: child, fever, rash distribution',
      'Rule matched: pediatric fever-rash ER floor',
      'Care route: ER',
      'Audit result: high-risk route not delayed by more questions',
    ],
  },
  {
    id: 'CV-2405',
    member: 'Fictional member, 61',
    symptom: 'Gradual shortness of breath only on stairs',
    level: 'Telehealth',
    status: 'Virtual visit queued',
    safe: true,
    confidence: '0.74',
    questions: 6,
    redFlags: [],
    payer: 'Medicare Advantage',
    saved: 2400,
    trace: [
      'Patient message: getting winded walking up stairs',
      'Follow-up: rest breathing screen',
      'Follow-up: chest pain screen',
      'Extracted facts: gradual onset, exertional only, no chest pain',
      'Rule matched: no ER floor; low-acuity route held until danger screened',
      'Care route: telehealth appointment',
    ],
  },
]

const LEVEL_STYLE: Record<Level, string> = {
  Emergency: 'bg-red-500 text-white ring-red-200',
  ER: 'bg-red-50 text-red-700 ring-red-200',
  'Urgent Care': 'bg-amber-50 text-amber-800 ring-amber-200',
  'Primary Care': 'bg-sky-50 text-sky-800 ring-sky-200',
  Telehealth: 'bg-blue-50 text-blue-800 ring-blue-200',
  'Home Care': 'bg-emerald-50 text-emerald-800 ring-emerald-200',
}

const TABS: Array<{ id: Tab; title: string; description: string }> = [
  { id: 'monitor', title: 'Live Triage Monitor', description: 'Active cases, care levels, red flags, confidence, and route safety.' },
  { id: 'trace', title: 'Decision Trace', description: 'Patient words to extracted facts to rule match to facility and cost context.' },
  { id: 'compliance', title: 'Compliance Dashboard', description: 'Safety metrics, consent status, unresolved cases, and audit completeness.' },
  { id: 'savings', title: 'Savings + Operations', description: 'Avoidable ER savings, urgent care redirects, and manual review time saved.' },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function Pill({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ring-1 ${className}`}>{children}</span>
}

export default function AuditOSDemo() {
  const [view, setView] = useState<View>('audit')
  const [tab, setTab] = useState<Tab>('monitor')
  const [selectedId, setSelectedId] = useState(CASES[0].id)
  const selected = CASES.find(c => c.id === selectedId) ?? CASES[0]
  const metrics = useMemo(() => {
    const erDeflected = CASES.filter(c => c.saved > 0).length
    const savings = CASES.reduce((sum, c) => sum + c.saved, 0)
    const avgQuestions = CASES.reduce((sum, c) => sum + c.questions, 0) / CASES.length
    return {
      active: CASES.length,
      emergencyCapture: '100%',
      underTriage: '0',
      auditComplete: '100%',
      erDeflected,
      savings,
      avgQuestions: avgQuestions.toFixed(1),
      manualHours: 18,
    }
  }, [])

  const title = view === 'audit' ? 'Carevo AuditOS' : 'Carevo Routing Intelligence Layer'
  const subtitle = view === 'audit'
    ? 'AI-native care-routing compliance infrastructure for real-time monitoring, audit readiness, and safety review.'
    : 'The enterprise layer that turns each intake into a traceable route, cost signal, and operational handoff.'

  return (
    <main className="min-h-screen bg-[#06101f] text-white [font-family:'Plus_Jakarta_Sans',system-ui,sans-serif]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-[-180px] top-52 h-[460px] w-[460px] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-7xl px-5 pb-14 pt-8">
        <header className="flex items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-white/[0.06] px-5 py-4 shadow-2xl shadow-black/20 backdrop-blur">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-950">
              <img src="/brand/carevo-logo.png" alt="" className="h-full w-full object-cover" />
            </span>
            <span className="text-lg font-black tracking-tight">carevo</span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/benchmarks" className="rounded-full px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white">Benchmarks</Link>
            <Link href="/compliance" className="rounded-full px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white">Compliance Console</Link>
            <Link href="/contact" className="rounded-full bg-white px-5 py-2 text-sm font-black text-slate-950">Request pilot</Link>
          </div>
        </header>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.45fr] lg:items-end">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              {(['audit', 'routing'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setView(mode)}
                  className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${view === mode ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:text-white'}`}
                >
                  {mode === 'audit' ? 'AuditOS' : 'Routing Layer'}
                </button>
              ))}
            </div>
            <h1 className="mt-7 max-w-xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white sm:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-slate-300">{subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Pill className="bg-emerald-400/10 text-emerald-200 ring-emerald-300/20">0 under-triage in latest 240-case gate</Pill>
              <Pill className="bg-blue-400/10 text-blue-100 ring-blue-300/20">Every route has provenance</Pill>
              <Pill className="bg-white/10 text-slate-100 ring-white/15">Simulated demo data</Pill>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              [metrics.active, 'active cases'],
              [metrics.emergencyCapture, 'emergency capture'],
              [metrics.underTriage, 'under-triage'],
              [metrics.auditComplete, 'audit complete'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-xl shadow-black/10 backdrop-blur">
                <p className="text-3xl font-black tracking-tight text-white">{value}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-[32px] border border-white/10 bg-white text-slate-950 shadow-2xl shadow-black/25">
          <div className="grid border-b border-slate-200 bg-slate-50 md:grid-cols-4">
            {TABS.map(item => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`border-b border-slate-200 px-5 py-4 text-left transition md:border-b-0 md:border-r last:md:border-r-0 ${tab === item.id ? 'bg-white' : 'hover:bg-white/70'}`}
              >
                <p className={`text-sm font-black ${tab === item.id ? 'text-blue-700' : 'text-slate-700'}`}>{item.title}</p>
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-400">{item.description}</p>
              </button>
            ))}
          </div>

          {tab === 'monitor' && (
            <div className="grid min-h-[560px] lg:grid-cols-[420px_1fr]">
              <aside className="border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
                <div className="border-b border-slate-200 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Live Triage Monitor</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight">Pre-arrival queue</h2>
                </div>
                {CASES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`grid w-full gap-2 border-b border-slate-200 px-5 py-4 text-left transition ${selectedId === c.id ? 'bg-blue-50' : 'hover:bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-black text-slate-950">{c.symptom}</p>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${LEVEL_STYLE[c.level]}`}>{c.level}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500">{c.member} · {c.payer}</p>
                    <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <span>{c.questions} questions</span>
                      <span>{c.confidence}</span>
                      <span className={c.safe ? 'text-emerald-600' : 'text-red-600'}>{c.safe ? 'safe to route' : 'review needed'}</span>
                    </div>
                  </button>
                ))}
              </aside>
              <section className="p-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-bold text-slate-400">{selected.id}</p>
                      <h2 className="mt-1 text-2xl font-black tracking-tight">{selected.symptom}</h2>
                      <p className="mt-2 text-sm font-semibold text-slate-500">{selected.status}</p>
                    </div>
                    <span className={`rounded-full px-4 py-2 text-sm font-black ring-1 ${LEVEL_STYLE[selected.level]}`}>{selected.level}</span>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <Metric label="confidence" value={selected.confidence} />
                    <Metric label="questions asked" value={String(selected.questions)} />
                    <Metric label="route status" value={selected.safe ? 'safe' : 'review'} good={selected.safe} />
                  </div>
                  <div className="mt-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Red flags</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selected.redFlags.length ? selected.redFlags.map(flag => (
                        <Pill key={flag} className="bg-red-50 text-red-700 ring-red-200">{flag}</Pill>
                      )) : <Pill className="bg-emerald-50 text-emerald-700 ring-emerald-200">none established</Pill>}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {tab === 'trace' && (
            <div className="grid gap-6 p-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Selected Case</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">{selected.symptom}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{selected.member} · {selected.payer}</p>
                <div className="mt-5 rounded-2xl bg-slate-950 p-4 font-mono text-[11px] leading-6 text-slate-300">
                  engine: carevo-engine-1.1<br />
                  ruleset: carevo-rules-2026.07.0<br />
                  kb: carevo-kb-2026.07.0<br />
                  audit: chain verified
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Decision Trace</p>
                <ol className="mt-5 space-y-4">
                  {selected.trace.map((step, index) => (
                    <li key={step} className="grid grid-cols-[34px_1fr] gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">{index + 1}</span>
                      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {tab === 'compliance' && (
            <div className="grid gap-6 p-6 lg:grid-cols-3">
              <ComplianceCard title="Safety posture" value="100%" caption="Emergency capture in latest internal gate" status="Compliant" />
              <ComplianceCard title="Under-triage rate" value="0" caption="Release-blocking metric monitored first" status="Passing" />
              <ComplianceCard title="Consent status" value="Opt-in" caption="Research logs require explicit sharing consent" status="Active" />
              <ComplianceCard title="Audit completeness" value="100%" caption="Every case stores route, ruleset, and provenance" status="Traceable" />
              <ComplianceCard title="Unresolved cases" value="0" caption="Cases that need review before routing" status="Clear" />
              <ComplianceCard title="Avg questions" value={metrics.avgQuestions} caption="More questions when serious paths remain" status="Monitored" />
            </div>
          )}

          {tab === 'savings' && (
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">Savings + Operations</p>
                <h2 className="mt-3 text-4xl font-black tracking-tight">{formatCurrency(metrics.savings)}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">Estimated avoidable ER cost in this simulated queue.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Metric dark label="urgent care redirects" value={String(metrics.erDeflected)} />
                  <Metric dark label="manual review hours saved" value={`${metrics.manualHours}h`} />
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Operating model</p>
                <div className="mt-5 space-y-3">
                  {[
                    'Replace spreadsheet-based QA with a live route safety queue.',
                    'Show insurers which cases were redirected, why, and with what rule evidence.',
                    'Give clinical reviewers a replayable trace instead of raw chat logs.',
                    'Surface unresolved or high-risk cases before they become blind spots.',
                  ].map(item => (
                    <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs font-semibold text-slate-500">
          Demo uses fictional members and simulated operational data. Public benchmark details live on{' '}
          <Link href="/benchmarks" className="font-black text-blue-300 underline">/benchmarks</Link>.
        </p>
      </section>
    </main>
  )
}

function Metric({ label, value, good, dark = false }: { label: string; value: string; good?: boolean; dark?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${dark ? 'bg-white/10' : 'bg-slate-50'}`}>
      <p className={`text-2xl font-black tracking-tight ${good ? 'text-emerald-600' : dark ? 'text-white' : 'text-slate-950'}`}>{value}</p>
      <p className={`mt-1 text-[10px] font-black uppercase tracking-[0.16em] ${dark ? 'text-slate-400' : 'text-slate-400'}`}>{label}</p>
    </div>
  )
}

function ComplianceCard({ title, value, caption, status }: { title: string; value: string; caption: string; status: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-900">{title}</p>
        <Pill className="bg-emerald-50 text-emerald-700 ring-emerald-200">{status}</Pill>
      </div>
      <p className="mt-5 text-4xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{caption}</p>
    </div>
  )
}
