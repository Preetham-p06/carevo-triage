import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Carevo AuditOS - AI-native care-routing compliance infrastructure',
  description:
    'Carevo AuditOS gives insurers and healthcare facilities real-time monitoring, route traceability, safety metrics, consent status, and operational savings views for AI-assisted care navigation.',
}

const tabs = [
  {
    title: 'Live Triage Monitor',
    text: 'Watch active intake cases by care level, red flags, confidence, questions asked, and route status before handoff.',
    stat: '0',
    label: 'under-triage target',
  },
  {
    title: 'Decision Trace',
    text: 'Replay the path from patient words to extracted facts, emergency screen, deterministic rule, route, facility, and cost context.',
    stat: '100%',
    label: 'route provenance',
  },
  {
    title: 'Compliance Dashboard',
    text: 'Track emergency capture, unresolved cases, audit completeness, consent status, and review queues in one place.',
    stat: 'Live',
    label: 'safety posture',
  },
  {
    title: 'Savings + Operations',
    text: 'Estimate avoidable ER savings, urgent-care redirects, network fit, and manual review hours saved across populations.',
    stat: '$',
    label: 'cost visibility',
  },
]

const traceSteps = [
  'Patient shares symptoms',
  'Emergency screen runs first',
  'Facts are extracted',
  'Ruleset selects the care route',
  'AuditOS records provenance',
]

const useCases = [
  'Insurers monitoring care-navigation safety before authorization workflows',
  'ER and urgent-care operators reducing avoidable wrong-facility arrivals',
  'Clinical operations teams replacing spreadsheet review with a live queue',
  'Compliance leaders proving why a route was recommended and who reviewed it',
]

export default function AuditOSPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_-18%,rgba(125,211,252,0.62),transparent_34%),linear-gradient(180deg,#f7fcff_0%,#ffffff_42%,#f8fbff_100%)] px-4 pb-16 pt-28 text-slate-950 sm:px-6 sm:pb-20 sm:pt-36">
      <section className="marketing-reveal mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/85 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Carevo AuditOS
          </p>
          <h1 className="mt-7 max-w-4xl font-display text-[clamp(3rem,12vw,6.9rem)] font-black leading-[0.94] tracking-[-0.075em]">
            AI-native compliance infrastructure for care routing.
          </h1>
          <p className="mt-7 max-w-2xl text-base font-semibold leading-8 text-slate-600 sm:text-xl sm:leading-9">
            AuditOS turns every Carevo intake into a monitored, replayable record: what the member said, what safety checks ran, which rule fired, what route was returned, and what operational handoff followed.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/demo" className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700">
              View live demo
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 px-8 py-4 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950">
              Talk to us
            </Link>
          </div>
        </div>

        <div className="rounded-[2.2rem] border border-slate-200 bg-white/82 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur sm:p-5">
          <div className="rounded-[1.7rem] bg-slate-950 p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-300">Live safety console</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Route review queue</h2>
              </div>
              <span className="rounded-full bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-200 ring-1 ring-emerald-300/20">
                0 under-triage
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ['Emergency capture', '100%'],
                ['Audit completeness', '100%'],
                ['Avg questions', '4.2'],
                ['Consent status', 'Opt-in'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                  <p className="text-3xl font-black tracking-tight">{value}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Example trace</p>
              <div className="mt-4 space-y-3">
                {traceSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-2 text-sm font-bold text-slate-200">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[10px] font-black text-white">{index + 1}</span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-20 max-w-7xl sm:mt-24">
        <div className="grid gap-4 md:grid-cols-4">
          {tabs.map((item) => (
            <article key={item.title} className="rounded-[1.5rem] border border-slate-200 bg-white/82 p-6 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5">
              <p className="text-3xl font-black tracking-[-0.04em] text-blue-600">{item.stat}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
              <h2 className="mt-8 font-display text-2xl font-black tracking-[-0.05em]">{item.title}</h2>
              <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-20 grid max-w-7xl gap-10 border-t border-slate-200/80 pt-14 sm:mt-24 sm:pt-16 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-carevo-600">Why it matters</p>
          <h2 className="mt-5 font-display text-[clamp(2.4rem,10vw,4.8rem)] font-black leading-[0.98] tracking-[-0.065em]">
            The compliance layer should move at the speed of the intake.
          </h2>
        </div>
        <div className="space-y-5 text-base font-semibold leading-8 text-slate-600 sm:text-lg">
          <p>
            Healthcare routing creates operational risk when decisions live in chat logs, spreadsheets, screenshots, or memory. AuditOS gives insurers and healthcare facilities a live system of record for the routing workflow.
          </p>
          <p>
            The goal is not to replace clinical judgment. The goal is to make every safety step visible: emergency checks, follow-up questions, rule evidence, care level, facility context, consent, and review status.
          </p>
          <p className="font-black text-slate-950">
            The most suitable positioning for Carevo is Carevo Routing Intelligence Layer, with AuditOS as the compliance command center inside it.
          </p>
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-20 max-w-7xl sm:mt-24">
        <p className="mb-5 text-xs font-black uppercase tracking-[0.22em] text-carevo-600">Built for</p>
        <div className="grid gap-5 md:grid-cols-2">
          {useCases.map((item) => (
            <div key={item} className="rounded-[1.4rem] border border-slate-200 bg-white/80 p-6 text-base font-black leading-7 text-slate-800 shadow-sm backdrop-blur">
              <span className="mr-3 inline-block h-2.5 w-2.5 rounded-full bg-blue-500 align-middle" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-20 max-w-7xl rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-900/20 sm:mt-24 sm:p-12">
        <h2 className="max-w-4xl font-display text-[clamp(2.35rem,11vw,4.8rem)] font-black leading-[0.98] tracking-[-0.06em]">
          Stop reviewing routes after the fact.
        </h2>
        <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-slate-300">
          Carevo can give payers and care teams a real-time view of route safety, network movement, review queues, and cost impact before the workflow becomes another spreadsheet.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/demo" className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100">
            Open the AuditOS demo
          </Link>
          <Link href="/triage" className="inline-flex items-center justify-center rounded-full border border-white/15 px-8 py-4 text-sm font-black text-white transition hover:bg-white/10">
            Try AI triage
          </Link>
        </div>
      </section>
    </main>
  )
}
