'use client'

// Public enterprise demo using fictional members and simulated operations data.
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'

type Tab = 'queue' | 'trace' | 'controls' | 'financials'
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
}

const CASES: CaseRow[] = [
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
  { id: 'queue', title: 'Work Queue', subtitle: 'Active routing cases, owners, status, and controls.' },
  { id: 'trace', title: 'Decision Trace', subtitle: 'Replay the route from intake to rule match.' },
  { id: 'controls', title: 'Safety Controls', subtitle: 'Release gates, consent state, and review completeness.' },
  { id: 'financials', title: 'Cost Operations', subtitle: 'Avoidable ER savings and routing mix.' },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black leading-none ${className}`}>
      {children}
    </span>
  )
}

function Metric({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{caption}</p>
    </div>
  )
}

export default function EnterpriseDemo() {
  const [tab, setTab] = useState<Tab>('queue')
  const [selectedId, setSelectedId] = useState(CASES[0].id)
  const selected = CASES.find(c => c.id === selectedId) ?? CASES[0]
  const metrics = useMemo(() => {
    const savings = CASES.reduce((sum, row) => sum + row.saved, 0)
    const avgQuestions = CASES.reduce((sum, row) => sum + row.questions, 0) / CASES.length
    const redirects = CASES.filter(row => row.saved > 0).length
    return {
      active: CASES.length,
      savings,
      redirects,
      avgQuestions: avgQuestions.toFixed(1),
      reviewCount: CASES.filter(row => row.status !== 'Complete').length,
    }
  }, [])

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-slate-950 [font-family:'Plus_Jakarta_Sans',system-ui,sans-serif]">
      <section className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6">
        <header className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-5">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-slate-950">
                <img src="/brand/carevo-logo.png" alt="" className="h-full w-full object-cover" />
              </span>
              <span>
                <span className="block text-base font-black leading-none tracking-tight">Carevo</span>
                <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Enterprise Operations</span>
              </span>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">All safety gates passing</Badge>
              <Badge className="border-slate-200 bg-slate-50 text-slate-600">Simulated demo data</Badge>
              <Link href="/contact" className="inline-flex min-h-10 items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800">
                Request pilot
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500 sm:px-5">
            <span>Northstar Health Plan</span>
            <span className="text-slate-300">/</span>
            <span>Care Routing Control Center</span>
            <span className="ml-auto text-slate-400">Updated 2 min ago</span>
          </div>
        </header>

        <div className="mt-4 grid gap-4 xl:grid-cols-[320px_1fr]">
          <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-4 xl:self-start">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Product demo</p>
            <h1 className="mt-3 font-display text-3xl font-black leading-tight tracking-[-0.055em] text-slate-950">
              Insurer and EHR operations for care routing.
            </h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              A clean operational layer for monitoring intake, route safety, exceptions, cost impact, and audit evidence across Carevo-powered workflows.
            </p>
            <div className="mt-5 grid gap-2">
              {TABS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`min-h-12 rounded-lg border px-3 py-3 text-left transition ${
                    tab === item.id
                      ? 'border-blue-200 bg-blue-50 text-blue-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-sm font-black">{item.title}</span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{item.subtitle}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-4">
            <section className="grid gap-3 md:grid-cols-5">
              <Metric label="Active cases" value={String(metrics.active)} caption="Across queue sample" />
              <Metric label="Review needed" value={String(metrics.reviewCount)} caption="Requires staff check" />
              <Metric label="Under-triage" value="0" caption="Latest 240-case gate" />
              <Metric label="Emergency capture" value="100%" caption="Safety control" />
              <Metric label="Avg questions" value={metrics.avgQuestions} caption="Adaptive intake" />
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    {TABS.find(item => item.id === tab)?.title}
                  </p>
                  <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-slate-950">Care routing operations workbench</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Audit complete</Badge>
                  <Badge className="border-blue-200 bg-blue-50 text-blue-700">Provenance attached</Badge>
                </div>
              </div>

              {tab === 'queue' && (
                <div className="grid lg:grid-cols-[1fr_360px]">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left text-sm">
                      <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        <tr>
                          <th className="px-4 py-3">Case</th>
                          <th className="px-4 py-3">Member</th>
                          <th className="px-4 py-3">Intake</th>
                          <th className="px-4 py-3">Route</th>
                          <th className="px-4 py-3">Owner</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {CASES.map(row => (
                          <tr key={row.id} className={selectedId === row.id ? 'bg-blue-50/50' : 'bg-white'}>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => setSelectedId(row.id)}
                                className="font-mono text-xs font-black text-blue-700 underline-offset-4 hover:underline"
                              >
                                {row.id}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-900">{row.member}</p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">{row.market}</p>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-700">{row.intake}</td>
                            <td className="px-4 py-3">
                              <Badge className={LEVEL_STYLE[row.level]}>{row.level}</Badge>
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-slate-600">{row.owner}</td>
                            <td className="px-4 py-3">
                              <Badge className={STATUS_STYLE[row.status]}>{row.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <CaseSummary selected={selected} />
                </div>
              )}

              {tab === 'trace' && (
                <div className="grid gap-4 p-4 lg:grid-cols-[360px_1fr]">
                  <CaseSummary selected={selected} />
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Selected route trace</p>
                    <ol className="mt-4 space-y-3">
                      {selected.trace.map((step, index) => (
                        <li key={step} className="grid grid-cols-[34px_1fr] gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-mono text-xs font-black text-blue-700 shadow-sm">{index + 1}</span>
                          <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-700">{step}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {tab === 'controls' && (
                <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    ['Safety release gate', 'Passing', '0 under-triage and 0 safety failures required before ship.'],
                    ['Emergency capture', '100%', 'Emergency patterns are monitored as hard controls.'],
                    ['Audit completeness', '100%', 'Route, ruleset, knowledge version, and timestamp attached.'],
                    ['Consent logging', 'Opt-in only', 'Research sharing remains unchecked until the user explicitly agrees.'],
                    ['Review queue', `${metrics.reviewCount} open`, 'Escalated or staff-review cases stay visible.'],
                    ['Network handoff', 'Ready', 'Route can connect to facility and coverage context.'],
                  ].map(([title, value, text]) => (
                    <article key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-black text-slate-950">{title}</h3>
                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{value}</Badge>
                      </div>
                      <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">{text}</p>
                    </article>
                  ))}
                </div>
              )}

              {tab === 'financials' && (
                <div className="grid gap-4 p-4 lg:grid-cols-[0.85fr_1.15fr]">
                  <div className="rounded-xl border border-slate-200 bg-slate-950 p-5 text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-200">Estimated operations impact</p>
                    <p className="mt-4 text-4xl font-black tracking-[-0.05em]">{formatCurrency(metrics.savings)}</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                      Avoidable ER cost in this fictional queue sample.
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-white/10 p-4">
                        <p className="text-2xl font-black">{metrics.redirects}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">lower-acuity redirects</p>
                      </div>
                      <div className="rounded-lg bg-white/10 p-4">
                        <p className="text-2xl font-black">18h</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">manual review avoided</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Routing mix</p>
                    <div className="mt-4 space-y-3">
                      {(['Emergency', 'ER', 'Urgent Care', 'Telehealth', 'Home Care'] as Level[]).map(level => {
                        const count = CASES.filter(row => row.level === level).length
                        const width = `${Math.max(10, count * 20)}%`
                        return (
                          <div key={level}>
                            <div className="flex items-center justify-between text-xs font-black text-slate-600">
                              <span>{level}</span>
                              <span>{count}</span>
                            </div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white">
                              <div className="h-full rounded-full bg-blue-600" style={{ width }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">Enterprise fit</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.045em] text-slate-950">
                  Built for payer operations, front-door navigation, and facility routing teams.
                </h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                  Carevo turns symptom intake into an operational record that shows why a route was returned, which safeguards ran, and where staff should focus review time.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Next step</p>
                <h2 className="mt-3 text-xl font-black tracking-[-0.04em] text-slate-950">Map this to your workflow.</h2>
                <Link href="/contact" className="mt-5 inline-flex w-full min-h-11 items-center justify-center rounded-md bg-blue-700 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800">
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

function CaseSummary({ selected }: { selected: CaseRow }) {
  return (
    <aside className="border-t border-slate-200 bg-white p-4 lg:border-l lg:border-t-0">
      <p className="font-mono text-xs font-black text-slate-400">{selected.id}</p>
      <h3 className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-950">{selected.intake}</h3>
      <p className="mt-2 text-sm font-semibold text-slate-500">{selected.member} - {selected.market}</p>
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
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Red flags</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.redFlags.length ? selected.redFlags.map(flag => (
            <Badge key={flag} className="border-red-200 bg-red-50 text-red-700">{flag}</Badge>
          )) : <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">none established</Badge>}
        </div>
      </div>
    </aside>
  )
}
