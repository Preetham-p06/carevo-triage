import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Reveal from '@/components/Reveal'

export const metadata: Metadata = {
  title: 'Carevo AuditOS - AI-native care-routing compliance',
  description:
    'Carevo AuditOS is AI-native compliance infrastructure for care routing. Autonomous agents capture every routing decision, run the controls, and keep an audit-ready trail — integrated with the systems you already run.',
}

function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold leading-none ${className}`}>{children}</span>
}

function Icon({ path, className = 'h-5 w-5' }: { path: ReactNode; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{path}</svg>
}

const STEPS = [
  {
    n: '01', title: 'Capture every decision',
    body: 'The moment Carevo routes a patient, it writes one immutable, hash-chained record: the redacted input, extracted facts, the safety screen, the matched rule, the final route, and the ruleset and knowledge versions.',
    icon: <><path d="M4 4h16v6H4zM4 14h10v6H4zM18 14h2v6h-2z" /></>,
  },
  {
    n: '02', title: 'Agents run the controls',
    body: 'Autonomous agents evaluate each record continuously. The checks are deterministic (PHI redaction, consent, emergency floors, evidence completeness, access policy), so compliance never depends on the model behaving.',
    icon: <><path d="M12 3l7 3v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  },
  {
    n: '03', title: 'The audit trail maintains itself',
    body: 'Control status updates in real time and stays tamper-evident. The spreadsheet a compliance team used to keep by hand now writes itself, timestamped and linked to the exact evidence.',
    icon: <><path d="M4 5v14M4 5h11l-2 3 2 3H4" /><path d="M8 19h12M8 15h8" /></>,
  },
  {
    n: '04', title: 'Humans touch only exceptions',
    body: 'Passing cases clear on their own. Any failed control opens a review item and notifies your team, and any decision can be exported as an integrity-verified evidence bundle for an auditor.',
    icon: <><path d="M12 9v4M12 17h.01" /><path d="M10.3 4.3 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" /></>,
  },
]

const AGENTS = [
  ['PHI Redaction Monitor', 'Strips identifiers at intake, before anything is stored.'],
  ['Consent State Auditor', 'Blocks any research or training use without explicit opt-in.'],
  ['Route Safety Sentinel', 'Re-checks every route against the emergency floors: 0 under-triage.'],
  ['Audit Evidence Writer', 'Pins ruleset, knowledge version, and a hash to each decision.'],
  ['HIPAA Access Watch', 'Flags any access to member data outside the minimum-necessary policy.'],
  ['FDA Boundary Guard', 'Confirms output stays care navigation, never diagnosis or treatment.'],
] as const

const INTEGRATIONS = [
  ['Embed the front door', 'Drop the Carevo triage flow into your patient portal or website with a snippet. No build required.', <><path d="M8 9l-4 3 4 3M16 9l4 3-4 3M13 6l-2 12" /></>],
  ['REST API', 'Send an intake, get back a route with cost, coverage, and the full decision trace as JSON.', <><path d="M4 7h16v10H4z" /><path d="M8 11h.01M8 14h5" /></>],
  ['FHIR & EHR', 'Push routes and evidence into Epic, Cerner, and other EHRs as standard FHIR resources.', <><path d="M12 3v18M5 8l7-5 7 5M5 8v8l7 5 7-5V8" /></>],
  ['Webhooks', 'Real-time events: a new route, a cleared safety check, or an exception, delivered to your systems.', <><path d="M12 3a4 4 0 0 1 4 4M12 3a9 9 0 0 1 9 9M8 21l4-8M8 21H4M8 21l-2-4" /></>],
  ['SSO / SAML', 'Staff sign in with your existing identity provider. Access is scoped and logged.', <><path d="M12 3l8 4v5c0 4-3 7-8 9-5-2-8-5-8-9V7Z" /><path d="M9 12l2 2 4-4" /></>],
  ['Evidence export', 'One click produces an integrity-verified JSON or PDF bundle for any case or control.', <><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></>],
] as const

function PipelineCard() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-blue-950 p-6 text-white shadow-2xl shadow-slate-950/25 sm:p-8">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-300">Live compliance pipeline</p>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
          <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" /></span>
          All controls passing
        </span>
      </div>

      {/* Animated flow: decision -> agents -> audit trail */}
      <div className="relative mt-8 flex items-center justify-between gap-2">
        <div className="relative z-10 flex flex-col items-center gap-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white"><Icon path={<><path d="M4 4h16v6H4zM4 14h10v6H4z" /></>} className="h-6 w-6" /></span>
          <p className="text-[11px] font-semibold text-white">Decision</p>
        </div>
        <div className="relative mx-1 h-12 flex-1">
          <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
            <div className="carevo-flow h-full w-1/2 rounded-full bg-[linear-gradient(90deg,transparent,#38bdf8,#3b82f6,transparent)]" />
          </div>
          {[0, 1].map(i => <span key={i} className="carevo-packet absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-cyan-300" style={{ animationDelay: `${i * 1.1}s` }} />)}
        </div>
        <div className="relative z-10 flex flex-col items-center gap-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-cyan-200 ring-1 ring-white/15"><Icon path={<><path d="M12 3l7 3v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>} className="h-6 w-6" /></span>
          <p className="text-[11px] font-semibold text-white">Agents</p>
        </div>
        <div className="relative mx-1 h-12 flex-1">
          <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
            <div className="carevo-flow h-full w-1/2 rounded-full bg-[linear-gradient(90deg,transparent,#34d399,#10b981,transparent)]" />
          </div>
          {[0, 1].map(i => <span key={i} className="carevo-packet absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-emerald-300" style={{ animationDelay: `${0.5 + i * 1.1}s` }} />)}
        </div>
        <div className="relative z-10 flex flex-col items-center gap-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/25"><Icon path={<><path d="M5 4h11l3 3v13H5z" /><path d="m9 13 2 2 4-4" /></>} className="h-6 w-6" /></span>
          <p className="text-[11px] font-semibold text-white">Audit trail</p>
        </div>
      </div>

      {/* Control rows */}
      <div className="mt-8 space-y-2">
        {[['PHI redaction', 'Applied'], ['Consent state', 'Opt-in'], ['Emergency floors', '0 under-triage'], ['Evidence written', 'Hash pinned']].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white">✓</span>{k}
            </span>
            <span className="font-mono text-[11px] text-emerald-300">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AuditOSPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 px-4 pb-24 pt-28 text-slate-900 sm:px-6 sm:pt-36">
      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <Reveal>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-blue-200 bg-blue-50 text-blue-700">Carevo AuditOS</Badge>
              <Badge className="border-slate-200 bg-white text-slate-600">For insurers & healthcare facilities</Badge>
            </div>
            <h1 className="mt-6 max-w-2xl text-[clamp(2.4rem,7vw,4.4rem)] font-black leading-[1.03] tracking-[-0.05em]">
              AI-native compliance for care routing.
            </h1>
            <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-slate-600 sm:text-lg">
              Autonomous agents capture every routing decision, run the controls, and keep an audit-ready trail. It replaces the spreadsheets and periodic sweeps, and plugs into the systems you already run.
            </p>
            <p className="mt-3 max-w-xl text-xs font-medium text-slate-400">
              AuditOS is in active development. Capabilities described reflect the product as designed; the interactive demo uses simulated data.
            </p>
            <div className="mt-7 grid max-w-lg grid-cols-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {[['0', 'under-triage', 'latest gate'], ['100%', 'emergency capture', 'safety control'], ['100%', 'traceable', 'audit-ready']].map(([v, l, c]) => (
                <div key={l} className="border-r border-slate-200 p-4 last:border-r-0">
                  <p className="text-2xl font-black tabular-nums tracking-tight text-blue-900 sm:text-3xl">{v}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{l}</p>
                  <p className="mt-1 hidden text-xs font-medium text-slate-400 sm:block">{c}</p>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/AUDITOS" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-blue-800 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                Open the live demo
              </Link>
              <Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                Talk to us
              </Link>
            </div>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <PipelineCard />
        </Reveal>
      </section>

      {/* How it works */}
      <Reveal>
        <section className="mx-auto mt-24 max-w-7xl sm:mt-32">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">How the AI-native layer works</p>
          <h2 className="mt-3 max-w-3xl text-[clamp(1.9rem,5vw,3.2rem)] font-black leading-[1.06] tracking-[-0.04em]">
            Every decision becomes evidence. Agents do the watching.
          </h2>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">
            Four stages turn a routing call into a defensible, always-current compliance record, with no one keeping a sheet.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 90}>
                <article className="relative h-full rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-800 text-white"><Icon path={s.icon} /></span>
                    <span className="font-mono text-xs font-bold text-slate-300">{s.n}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{s.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Agents grid */}
      <Reveal>
        <section className="mx-auto mt-24 max-w-7xl rounded-3xl border border-slate-800 bg-blue-950 p-6 text-white sm:mt-32 sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-300">The autonomous agents</p>
              <h2 className="mt-3 max-w-2xl text-[clamp(1.8rem,5vw,3rem)] font-black leading-[1.06] tracking-[-0.04em]">
                Six controls, always on.
              </h2>
            </div>
            <p className="max-w-md text-sm font-semibold leading-6 text-blue-200">
              Each agent owns one control and runs continuously against the engine. Deterministic where it matters, so the checks are as reliable as the routing.
            </p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {AGENTS.map(([name, body]) => (
              <div key={name} className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{name}</h3>
                  <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-blue-200">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Integrations */}
      <Reveal>
        <section className="mx-auto mt-24 max-w-7xl sm:mt-32">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">Integrates with what you already run</p>
          <h2 className="mt-3 max-w-3xl text-[clamp(1.9rem,5vw,3.2rem)] font-black leading-[1.06] tracking-[-0.04em]">
            Sits in front of your stack, not on top of it.
          </h2>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">
            Carevo runs the front-door triage and hands the decision, and its evidence, to the systems your teams already use. Pilots start with the embed and API today; deeper connectors are on our roadmap.
          </p>

          {/* Flow diagram */}
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Patient</p>
                <p className="mt-1 text-base font-bold text-slate-900">Front door</p>
                <p className="mt-1 text-xs text-slate-500">Website, portal, or SMS intake</p>
              </div>
              <div className="hidden items-center justify-center lg:flex"><span className="text-slate-300">→</span></div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-blue-600">Carevo</p>
                <p className="mt-1 text-base font-bold text-blue-900">Triage + AuditOS</p>
                <p className="mt-1 text-xs text-blue-700">Routes, then logs the evidence</p>
              </div>
              <div className="hidden items-center justify-center lg:flex"><span className="text-slate-300">→</span></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Your systems</p>
                <p className="mt-1 text-base font-bold text-slate-900">EHR & payer platform</p>
                <p className="mt-1 text-xs text-slate-500">Epic, Cerner, claims, care mgmt</p>
              </div>
            </div>
          </div>

          {/* Integration modes */}
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {INTEGRATIONS.map(([title, body, icon], i) => (
              <Reveal key={title} delay={i * 70}>
                <article className="h-full rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-blue-800"><Icon path={icon} /></span>
                  <h3 className="mt-4 text-base font-bold tracking-tight text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Evidence / trust strip */}
      <Reveal>
        <section className="mx-auto mt-24 max-w-7xl grid gap-6 sm:mt-32 lg:grid-cols-3">
          {[
            ['Immutable & tamper-evident', 'Records are append-only and hash-chained, so any change is detectable. Auditors verify integrity themselves.'],
            ['PHI-minimized by design', 'Built to strip identifiers at intake, encrypt data in transit, and scope and log access.'],
            ['Exported in one click', 'Per case or per control, produce a JSON or PDF evidence bundle ready for review.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Icon path={<><path d="M12 3l8 4v5c0 4-3 7-8 9-5-2-8-5-8-9V7Z" /><path d="m9 12 2 2 4-4" /></>} /></div>
              <h3 className="mt-4 text-base font-bold tracking-tight text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </div>
          ))}
        </section>
      </Reveal>

      {/* CTA */}
      <Reveal>
        <section className="mx-auto mt-24 max-w-7xl overflow-hidden rounded-3xl bg-blue-950 p-8 text-white sm:mt-32 sm:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-300">Carevo AuditOS</p>
              <h2 className="mt-3 max-w-3xl text-[clamp(1.9rem,5vw,3.4rem)] font-black leading-[1.05] tracking-[-0.04em]">
                Compliance that moves at triage speed.
              </h2>
              <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-blue-200">
                See the live console, then map it to your workflow in a short walkthrough.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/AUDITOS" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-7 py-3 text-sm font-bold text-blue-950 transition hover:bg-slate-100">
                Open the product demo
              </Link>
              <Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/20 px-7 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                Request a walkthrough
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </main>
  )
}
