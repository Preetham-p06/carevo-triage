import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Carevo AuditOS - Care-routing compliance operations',
  description:
    'Carevo AuditOS is a care-routing compliance operations layer for insurers and healthcare facilities, with real-time monitoring, traceability, review queues, and safety metrics.',
}

const heroMetrics = [
  ['0', 'under-triage', 'latest 240-case gate'],
  ['100%', 'emergency capture', 'safety control'],
  ['100%', 'audit completeness', 'route provenance'],
] as const

const queueRows = [
  ['CV-2401', 'Chest pressure with arm radiation', 'Emergency', 'Hard stop'],
  ['CV-2402', 'Fever 103.1 for two days', 'Urgent Care', 'Red flags clear'],
  ['CV-2403', 'Rolled ankle, can bear weight', 'Home Care', 'Closed loop'],
  ['CV-2404', 'Child fever with extremity rash', 'ER', 'Safety floor'],
] as const

const productViews = [
  ['Live Triage Monitor', 'See every active intake, route, safety status, and review owner in one place.'],
  ['Decision Trace', 'Open any case and follow the path from patient words to final routing evidence.'],
  ['Compliance Controls', 'Watch the metrics that matter: safety, consent, open reviews, and audit completion.'],
  ['Savings Operations', 'Track lower-acuity redirects, avoidable ER spend, network movement, and review load.'],
] as const

const traceSteps = [
  ['01', 'Intake', 'Member describes symptoms.'],
  ['02', 'Safety screen', 'Emergency and high-alert checks run first.'],
  ['03', 'Route logic', 'Deterministic rules return the care level.'],
  ['04', 'Audit record', 'Evidence, status, and provenance are stored.'],
] as const

function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'blue' | 'green' | 'red' | 'amber' }) {
  const classes = {
    slate: 'border-slate-200 bg-slate-50 text-slate-600',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${classes[tone]}`}>
      {children}
    </span>
  )
}

function RouteBadge({ route }: { route: string }) {
  if (route === 'Emergency') return <Badge tone="red">Emergency</Badge>
  if (route === 'ER') return <Badge tone="red">ER</Badge>
  if (route === 'Urgent Care') return <Badge tone="amber">Urgent Care</Badge>
  if (route === 'Home Care') return <Badge tone="green">Home Care</Badge>
  return <Badge tone="blue">{route}</Badge>
}

export default function AuditOSPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#f6f8fb_42%,#ffffff_100%)] px-4 pb-20 pt-28 text-slate-950 sm:px-6 sm:pt-36">
      <section className="marketing-reveal mx-auto grid min-h-[660px] max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="blue">Carevo AuditOS</Badge>
            <Badge>Insurer / EHR operations</Badge>
          </div>
          <h1 className="mt-8 max-w-4xl font-display text-[clamp(3rem,8.5vw,6.35rem)] font-black leading-[1.01] tracking-[-0.065em]">
            Care-routing compliance operations.
          </h1>
          <p className="mt-8 max-w-xl text-lg font-semibold leading-9 text-slate-600">
            A cleaner way for payers and care teams to monitor routing safety, review exceptions, and keep every decision traceable.
          </p>
          <div className="mt-11 flex flex-col gap-3 sm:flex-row">
            <Link href="/demo" className="inline-flex min-h-12 items-center justify-center rounded-full bg-blue-700 px-7 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100">
              Open product demo
            </Link>
            <Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-black text-slate-700 transition hover:border-slate-400 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-blue-100">
              Talk to Carevo
            </Link>
          </div>
        </div>

        <div className="marketing-reveal-delay-1 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Operations workbench</p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-slate-950">Route safety queue</h2>
            </div>
            <Badge tone="green">Controls passing</Badge>
          </div>
          <div className="grid border-b border-slate-200 sm:grid-cols-3">
            {heroMetrics.map(([value, label, caption]) => (
              <div key={label} className="border-b border-slate-200 px-6 py-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                <p className="text-3xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
                <p className="mt-2 text-xs font-semibold text-slate-400">{caption}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-5 py-3">Case</th>
                  <th className="px-5 py-3">Presentation</th>
                  <th className="px-5 py-3">Route</th>
                  <th className="px-5 py-3">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queueRows.map(([id, presentation, route, control]) => (
                  <tr key={id} className="bg-white">
                    <td className="px-6 py-5 font-mono text-xs font-black text-blue-700">{id}</td>
                    <td className="px-6 py-5 font-bold text-slate-900">{presentation}</td>
                    <td className="px-6 py-5"><RouteBadge route={route} /></td>
                    <td className="px-6 py-5 text-xs font-bold text-slate-600">{control}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-24 max-w-7xl sm:mt-32">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Product views</p>
          <h2 className="mt-5 font-display text-4xl font-black leading-tight tracking-[-0.055em] text-slate-950 sm:text-6xl">
            Four views. One source of truth.
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {productViews.map(([title, text], index) => (
            <article key={title} className="scroll-reveal rounded-[1.35rem] border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5">
              <p className="font-mono text-xs font-black text-blue-700">0{index + 1}</p>
              <h3 className="mt-10 font-display text-3xl font-black tracking-[-0.05em] text-slate-950">{title}</h3>
              <p className="mt-4 max-w-xl text-base font-semibold leading-8 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-28 grid max-w-7xl gap-12 rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-sm sm:mt-36 sm:p-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Decision trace</p>
          <h2 className="mt-5 font-display text-4xl font-black leading-tight tracking-[-0.055em] text-slate-950 sm:text-6xl">
            Every route is reviewable.
          </h2>
          <p className="mt-7 max-w-xl text-base font-semibold leading-8 text-slate-600">
            AuditOS turns intake into a simple operational record that can be checked before it becomes a handoff.
          </p>
        </div>
        <div className="grid gap-4">
          {traceSteps.map(([number, title, text]) => (
            <div key={number} className="scroll-reveal grid grid-cols-[52px_1fr] gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white font-mono text-xs font-black text-blue-700 shadow-sm">{number}</span>
              <div>
                <h3 className="text-base font-black text-slate-950">{title}</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-28 max-w-7xl rounded-[1.5rem] bg-slate-950 p-8 text-white shadow-xl shadow-slate-900/12 sm:mt-36 sm:p-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">Carevo AuditOS</p>
            <h2 className="mt-4 max-w-4xl font-display text-4xl font-black leading-tight tracking-[-0.055em] sm:text-6xl">
              Compliance that runs with the workflow.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link href="/demo" className="inline-flex min-h-12 items-center justify-center rounded-md bg-white px-7 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100">
              Open AuditOS demo
            </Link>
            <Link href="/triage" className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/20 px-7 py-3 text-sm font-black text-white transition hover:bg-white/10">
              View AI triage
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
