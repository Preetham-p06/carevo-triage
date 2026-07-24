import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Carevo AuditOS - Care-routing compliance operations',
  description:
    'Carevo AuditOS is an AI-native care-routing compliance layer for insurers and healthcare facilities, with real-time monitoring, traceability, review queues, and safety metrics.',
}

const controlMetrics = [
  ['Latest 240-case gate', '0 under-triage', 'Release blocker'],
  ['Emergency capture', '100%', 'Safety control'],
  ['Audit completeness', '100%', 'Trace coverage'],
  ['Consent state', 'Opt-in only', 'Research logs'],
] as const

const workQueue = [
  ['CV-2401', 'Chest pressure with arm radiation', 'Emergency', 'Hard stop issued', 'Complete'],
  ['CV-2402', 'Fever 103.1 for two days', 'Urgent Care', 'Red flags screened', 'Complete'],
  ['CV-2403', 'Rolled ankle, can bear weight', 'Home Care', 'Escalation instructions', 'Complete'],
  ['CV-2404', 'Child fever with extremity rash', 'ER', 'Safety floor applied', 'Complete'],
] as const

const trace = [
  ['01', 'Patient intake', 'Member describes symptoms in natural language.'],
  ['02', 'Emergency screen', 'Immediate and high-alert safety nets run before routing.'],
  ['03', 'Fact extraction', 'The AI structures facts but does not choose the care level.'],
  ['04', 'Ruleset route', 'Versioned deterministic rules produce the route and provenance.'],
  ['05', 'Audit record', 'AuditOS stores status, consent, rule evidence, and review state.'],
] as const

const modules = [
  {
    title: 'Live Triage Monitor',
    text: 'Operational queue for active cases, care level, red flags, questions asked, and review status.',
  },
  {
    title: 'Decision Trace',
    text: 'A replayable route record from patient message to extracted facts, safety checks, rule match, and handoff.',
  },
  {
    title: 'Compliance Dashboard',
    text: 'Safety controls for under-triage, emergency capture, unresolved cases, consent, and audit completeness.',
  },
  {
    title: 'Savings + Operations',
    text: 'Views for avoided ER utilization, urgent-care redirects, network movement, and manual review hours saved.',
  },
] as const

const stakeholders = [
  'Health plans monitoring AI-assisted care navigation before authorization workflows',
  'Emergency departments and urgent-care groups reducing wrong-facility arrivals',
  'Clinical operations teams moving review work out of spreadsheets',
  'Compliance teams that need a defensible record for every routing decision',
] as const

function StatusBadge({ tone, children }: { tone: 'green' | 'blue' | 'slate'; children: ReactNode }) {
  const classes = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-600',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${classes[tone]}`}>
      {children}
    </span>
  )
}

export default function AuditOSPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 pb-16 pt-28 text-slate-950 sm:px-6 sm:pb-20 sm:pt-36">
      <section className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
          <div className="rounded-[1.25rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="blue">Carevo AuditOS</StatusBadge>
              <StatusBadge tone="slate">Healthcare operations</StatusBadge>
            </div>
            <h1 className="mt-7 max-w-3xl font-display text-[clamp(2.7rem,8vw,5.8rem)] font-black leading-[0.98] tracking-[-0.065em]">
              Care-routing compliance operations.
            </h1>
            <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-slate-600 sm:text-lg">
              AI-native infrastructure for real-time monitoring, audit readiness, and safety review across insurer and healthcare-facility triage workflows.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {controlMetrics.map(([label, value, caption]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
                  <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{caption}</p>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/demo" className="inline-flex min-h-11 items-center justify-center rounded-md bg-blue-700 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100">
                Open product demo
              </Link>
              <Link href="/contact" className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-black text-slate-700 transition hover:border-slate-400 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-blue-100">
                Talk to Carevo
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">Operational command center</p>
                  <h2 className="mt-1 text-xl font-black tracking-[-0.03em]">Route safety workbench</h2>
                </div>
                <StatusBadge tone="green">All controls passing</StatusBadge>
              </div>
            </div>
            <div className="grid border-b border-slate-200 sm:grid-cols-4">
              {[
                ['Active cases', '124'],
                ['Review needed', '7'],
                ['Avg questions', '4.2'],
                ['SLA risk', '0'],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-slate-200 px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                  <p className="text-2xl font-black tracking-tight text-slate-950">{value}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Case</th>
                    <th className="px-4 py-3">Presentation</th>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Control</th>
                    <th className="px-4 py-3">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workQueue.map(([id, presentation, route, control, audit]) => (
                    <tr key={id} className="bg-white">
                      <td className="px-4 py-4 font-mono text-xs font-bold text-slate-500">{id}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">{presentation}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-700">{route}</span>
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-slate-600">{control}</td>
                      <td className="px-4 py-4">
                        <StatusBadge tone="green">{audit}</StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-8 max-w-7xl">
        <div className="grid gap-4 lg:grid-cols-4">
          {modules.map((module) => (
            <article key={module.title} className="rounded-[1rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-display text-xl font-black tracking-[-0.04em] text-slate-950">{module.title}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{module.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-8 grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.25rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Decision trace</p>
          <h2 className="mt-4 font-display text-4xl font-black leading-tight tracking-[-0.055em] text-slate-950">
            Every route becomes a reviewable record.
          </h2>
          <p className="mt-5 text-sm font-semibold leading-7 text-slate-600">
            Carevo AuditOS is most useful as the control center for the broader Carevo Routing Intelligence Layer. The triage system handles intake and routing; AuditOS monitors the workflow, evidence, exceptions, and operations impact.
          </p>
        </div>
        <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-3">
            {trace.map(([number, title, text]) => (
              <div key={number} className="grid grid-cols-[44px_1fr] gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white font-mono text-xs font-black text-blue-700 shadow-sm">{number}</span>
                <div>
                  <h3 className="text-sm font-black text-slate-950">{title}</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-8 max-w-7xl rounded-[1.25rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Built for enterprise deployment</p>
            <h2 className="mt-4 font-display text-4xl font-black leading-tight tracking-[-0.055em] text-slate-950">
              Replace spreadsheet-heavy monitoring with a live control plane.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {stakeholders.map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-600 align-middle" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-8 max-w-7xl rounded-[1.25rem] border border-slate-900 bg-slate-950 p-7 text-white shadow-sm sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">Carevo AuditOS</p>
            <h2 className="mt-3 max-w-3xl font-display text-4xl font-black leading-tight tracking-[-0.055em]">
              A compliance layer that works while routing is happening.
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-300">
              Built for payers and care teams that need route safety, audit evidence, consent state, cost impact, and exception review in the same operational view.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link href="/demo" className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100">
              Open AuditOS demo
            </Link>
            <Link href="/triage" className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/20 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10">
              View AI triage
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
