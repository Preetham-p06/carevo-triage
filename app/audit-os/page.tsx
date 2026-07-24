import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Carevo AuditOS - Care-routing compliance operations',
  description:
    'Carevo AuditOS is AI-native care-routing compliance infrastructure for insurers and healthcare facilities.',
}

const metrics = [
  ['0', 'UNDER', 'latest gate'],
  ['100%', 'ER capture', 'safety checks'],
  ['100%', 'Trace', 'audit ready'],
] as const

const queue = [
  ['CV-2401', 'Chest pressure', 'Emergency', 'Hard stop', 'red'],
  ['CV-2402', 'Fever 103.1', 'Urgent Care', 'Red flags clear', 'amber'],
  ['CV-2403', 'Rolled ankle', 'Home Care', 'Closed loop', 'green'],
] as const

const productCards = [
  ['Live monitor', 'Every intake, route, consent state, and review status in one clean queue.'],
  ['Decision trace', 'Patient words, extracted facts, safety screen, matched rule, and final route.'],
  ['Ops impact', 'Track avoidable ER spend, redirects, review load, and network movement.'],
] as const

const trace = [
  ['01', 'Intake', 'Patient starts the flow'],
  ['02', 'Safety', 'Emergency checks run first'],
  ['03', 'Rules', 'Deterministic route selected'],
  ['04', 'Audit', 'Evidence saved for review'],
] as const

function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'blue' | 'green' | 'red' | 'amber' }) {
  const classes = {
    slate: 'border-slate-200 bg-white/80 text-slate-600',
    blue: 'border-cyan-200 bg-cyan-50 text-cyan-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-rose-200 bg-rose-50 text-rose-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
  }

  return (
    <span className={`inline-flex min-h-8 items-center rounded-full border px-3 text-[11px] font-black uppercase tracking-[0.14em] ${classes[tone]}`}>
      {children}
    </span>
  )
}

function RouteBadge({ route }: { route: string }) {
  if (route === 'Emergency') return <Badge tone="red">Emergency</Badge>
  if (route === 'Urgent Care') return <Badge tone="amber">Urgent Care</Badge>
  if (route === 'Home Care') return <Badge tone="green">Home Care</Badge>
  return <Badge tone="blue">{route}</Badge>
}

function CarevoMark({ className = 'h-10 w-10 rounded-2xl' }: { className?: string }) {
  return (
    <span className={`block overflow-hidden bg-slate-950 shadow-lg shadow-cyan-900/20 ${className}`}>
      <img src="/brand/carevo-logo.png" alt="" className="h-full w-full object-cover" />
    </span>
  )
}

function CommandCenter() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-cyan-950/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.18),transparent_36%),linear-gradient(135deg,rgba(14,165,233,0.08),transparent_42%,rgba(16,185,129,0.08))]" />
      <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full border border-cyan-200/70" />
      <div className="absolute left-1/2 top-20 h-48 w-48 -translate-x-1/2 rounded-full border border-emerald-200/60" />

      <div className="relative border-b border-slate-200/80 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CarevoMark />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Carevo AuditOS</p>
              <p className="text-sm font-black text-slate-950">Operations Command Center</p>
            </div>
          </div>
          <Badge tone="green">Live controls passing</Badge>
        </div>
      </div>

      <div className="relative grid gap-4 p-4 sm:p-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-3">
          {queue.map(([id, symptom, route, control]) => (
            <article key={id} className="group rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] font-black text-cyan-700">{id}</p>
                  <h3 className="mt-2 text-base font-black tracking-[-0.03em] text-slate-950">{symptom}</h3>
                </div>
                <RouteBadge route={route} />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.12)]" />
                <p className="text-xs font-bold text-slate-500">{control}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Decision trace</p>
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_22px_rgba(52,211,153,0.85)]" />
          </div>
          <div className="mt-6 space-y-4">
            {trace.map(([number, title, detail], index) => (
              <div key={number} className="relative grid grid-cols-[42px_1fr] gap-4">
                {index < trace.length - 1 && <span className="absolute left-5 top-11 h-8 w-px bg-cyan-300/30" />}
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 font-mono text-xs font-black text-cyan-100">
                  {number}
                </span>
                <div>
                  <h4 className="text-sm font-black">{title}</h4>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">{detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-300">Coverage</p>
              <p className="font-mono text-xs font-black text-emerald-300">100%</p>
            </div>
            <div className="mt-4 space-y-2">
              {[88, 72, 96].map((width, index) => (
                <div key={width} className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${index === 1 ? 'bg-cyan-300' : index === 2 ? 'bg-emerald-300' : 'bg-blue-400'}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FlowMap() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-cyan-100 bg-[linear-gradient(135deg,#f8fdff,#ffffff_45%,#ecfeff)] p-5 shadow-xl shadow-cyan-950/5 sm:p-8">
      <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_20%_30%,rgba(125,211,252,0.32),transparent_34%),radial-gradient(circle_at_78%_20%,rgba(186,230,253,0.36),transparent_30%)]" />
      <div className="relative grid gap-4 lg:grid-cols-3 lg:items-center">
        {[
          ['Patient intake', 'Symptom details', 'bg-white'],
          ['Carevo engine', 'Rules + AI support', 'bg-slate-950 text-white'],
          ['Right care', 'ER / UC / PCP', 'bg-white'],
        ].map(([title, text, cls], index) => (
          <article key={title} className={`relative rounded-3xl border border-slate-200 p-6 shadow-sm ${cls}`}>
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${index === 1 ? 'bg-cyan-300/15 text-cyan-200' : 'bg-cyan-50 text-cyan-700'}`}>
              {index === 0 ? (
                <svg aria-hidden="true" viewBox="0 0 64 64" className="h-10 w-10">
                  <path d="M20 46c2-8 8-12 12-12s10 4 12 12" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="32" cy="22" r="9" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
              ) : index === 1 ? (
                <CarevoMark className="h-12 w-12 rounded-2xl" />
              ) : (
                <svg aria-hidden="true" viewBox="0 0 64 64" className="h-10 w-10">
                  <path d="M10 54h44V24L32 10 10 24v30Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
                  <path d="M32 28v16M24 36h16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <h3 className="mt-6 text-center text-xl font-black tracking-[-0.04em]">{title}</h3>
            <p className={`mt-2 text-center text-sm font-bold ${index === 1 ? 'text-slate-300' : 'text-slate-500'}`}>{text}</p>
            {index < 2 && <span className="pointer-events-none absolute -right-3 top-1/2 hidden h-px w-6 bg-cyan-300 lg:block" />}
          </article>
        ))}
      </div>
    </div>
  )
}

export default function AuditOSPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#effaff_0%,#f8fbff_38%,#ffffff_100%)] px-4 pb-20 pt-28 text-slate-950 sm:px-6 sm:pt-36">
      <section className="marketing-reveal mx-auto grid max-w-7xl gap-10 lg:min-h-[680px] lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-14">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="blue">Carevo AuditOS</Badge>
            <Badge>Insurer / EHR ops</Badge>
          </div>
          <h1 className="mt-7 max-w-4xl font-display text-[clamp(2.6rem,10vw,6.25rem)] font-black leading-[1.02] tracking-[-0.065em]">
            Care-routing compliance infrastructure.
          </h1>
          <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-slate-600 sm:text-lg sm:leading-9">
            Real-time monitoring for route safety, decision traces, consent, and operations.
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-3 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {metrics.map(([value, label, caption]) => (
              <div key={label} className="border-r border-slate-200 p-4 last:border-r-0 sm:p-5">
                <p className="text-2xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">{value}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
                <p className="mt-2 hidden text-xs font-semibold text-slate-400 sm:block">{caption}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/AUDITOS" className="inline-flex min-h-12 items-center justify-center rounded-full bg-blue-700 px-7 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100">
              Open live demo
            </Link>
            <Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-black text-slate-700 transition hover:border-slate-400 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-blue-100">
              Contact us
            </Link>
          </div>
        </div>

        <div className="marketing-reveal-delay-1">
          <CommandCenter />
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-20 max-w-7xl sm:mt-32">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">What buyers see</p>
            <h2 className="mt-5 font-display text-[clamp(2.25rem,8vw,4.75rem)] font-black leading-[1.03] tracking-[-0.06em]">
              Less spreadsheet. More command center.
            </h2>
          </div>
          <p className="max-w-2xl text-base font-semibold leading-8 text-slate-600">
            A single operational layer for monitoring safety, auditing routes, and seeing where care navigation affects cost.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:mt-14 md:grid-cols-3">
          {productCards.map(([title, text], index) => (
            <article key={title} className="scroll-reveal group rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-950/8">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 font-mono text-xs font-black text-cyan-700">0{index + 1}</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)]" />
              </div>
              <h3 className="mt-12 font-display text-2xl font-black tracking-[-0.05em] text-slate-950">{title}</h3>
              <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-20 grid max-w-7xl gap-8 sm:mt-36 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <FlowMap />
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <Badge tone="green">Audit-ready flow</Badge>
          <h2 className="mt-6 font-display text-[clamp(2.15rem,8vw,4.35rem)] font-black leading-[1.04] tracking-[-0.06em]">
            From patient intake to operational proof.
          </h2>
          <div className="mt-8 space-y-3">
            {['Route matched', 'Rule recorded', 'Consent checked', 'Review queued'].map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-mono text-[11px] font-black text-cyan-700">{index + 1}</span>
                  <p className="text-sm font-black text-slate-800">{item}</p>
                </div>
                <span className="text-sm font-black text-emerald-600">Ready</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-20 max-w-7xl rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/15 sm:mt-36 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Carevo AuditOS</p>
            <h2 className="mt-4 max-w-4xl font-display text-[clamp(2.2rem,8vw,4.5rem)] font-black leading-[1.03] tracking-[-0.06em]">
              Compliance that moves at triage speed.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link href="/AUDITOS" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100">
              Open product demo
            </Link>
            <Link href="/triage" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-7 py-3 text-sm font-black text-white transition hover:bg-white/10">
              View AI triage
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
