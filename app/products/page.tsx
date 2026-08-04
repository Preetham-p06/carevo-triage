import Link from 'next/link'
import type { Metadata } from 'next'
import Reveal from '@/components/Reveal'

export const metadata: Metadata = {
  title: 'Products - Carevo AI Triage & AuditOS',
  description:
    'Two products, one system: the Carevo AI Triage engine routes patients to the right care level, and every decision feeds into AuditOS — AI-native compliance audit routing built for insurers and healthcare facilities.',
}

const triageSteps = [
  ['Emergency screen', 'Red-flag checks run before anything else. Chest pain, stroke signs, and self-harm hard-stop to 911 or 988.'],
  ['Nurse-style interview', 'Up to six plain-language questions, each chosen to reduce routing uncertainty. Never asks patients to rate their own severity.'],
  ['Deterministic route', 'A rules engine — not the model — picks the care level: ER, urgent care, primary care, telehealth, or home care.'],
  ['Cost + coverage', 'Plain-language estimate of what the visit costs and what insurance is likely to cover, with nearby facilities.'],
] as const

const triageStats = [
  ['90.2%', 'Accuracy on the NEJM-45 external benchmark'],
  ['0', 'Under-triage cases in the latest safety gate'],
  ['≤6', 'Questions before a route, only when needed'],
] as const

const auditFeatures = [
  ['Every route, traced', 'Patient words, extracted facts, the safety screen, the matched rule, and the final care level — captured as evidence for every single intake.'],
  ['AI-native compliance', 'Designed to continuously monitor HIPAA, data-handling, and FDA-relevant controls, so it can replace the spreadsheets and periodic audit sweeps. AuditOS is in active development.'],
  ['Care-routing oversight', 'Insurers and facilities see the decision before the patient arrives: what was asked, why the route was chosen, and where the network sent them.'],
  ['Live control checks', 'Security headers, consent gating, admin auth, and privacy posture are probed in real time — always-on, always audit-ready.'],
] as const

function CarevoMark({ className = 'h-10 w-10 rounded-2xl' }: { className?: string }) {
  return (
    <span className={`block overflow-hidden bg-slate-950 shadow-lg shadow-blue-900/20 ${className}`}>
      <img src="/brand/carevo-logo.png" alt="" className="h-full w-full object-cover" />
    </span>
  )
}

export default function ProductsPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_6%,rgba(59,130,246,0.10),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#ffffff_55%,#f6fafc_100%)] px-4 pb-24 pt-24 text-slate-950 sm:px-6 sm:pt-32">
      {/* Hero */}
      <section className="mx-auto max-w-4xl text-center">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-carevo-600">Products</p>
        <h1 className="mx-auto max-w-3xl text-[clamp(2.5rem,8vw,4.6rem)] font-black leading-[1.02] tracking-[-0.055em]">
          One system, two products.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base font-semibold leading-8 text-slate-600 sm:text-lg">
          The <span className="text-slate-950">AI Triage engine</span> decides where a patient should go. Every decision it
          makes <span className="text-slate-950">feeds into AuditOS</span> — AI-native compliance audit routing that keeps
          the whole thing traceable, safe, and always ready for review.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/triage"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-px hover:bg-blue-700"
          >
            Try the triage flow
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-white"><path d="M3 8h10M9 4l4 4-4 4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <Link
            href="/AUDITOS"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            See AuditOS demo
          </Link>
        </div>
      </section>

      {/* Product 1 — AI Triage */}
      <Reveal>
      <section className="mx-auto mt-24 max-w-5xl">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">
              Product 01
            </span>
            <h2 className="mt-5 text-[clamp(2rem,5vw,3rem)] font-black leading-[1.04] tracking-[-0.045em]">
              The AI Triage System
            </h2>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
              A patient describes what&apos;s wrong in their own words. Carevo screens for emergencies first, interviews like
              a nurse, and routes to the right level of care — with the model never making the routing call itself.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {triageStats.map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <p className="text-2xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
                  <p className="mt-0.5 max-w-[15ch] text-[11px] font-bold leading-4 text-slate-500">{label}</p>
                </div>
              ))}
            </div>
            <Link href="/triage" className="mt-7 inline-flex items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-800">
              Open the live triage flow
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current"><path d="M3 8h10M9 4l4 4-4 4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </div>

          <ol className="relative space-y-3">
            {triageSteps.map(([title, detail], index) => (
              <li key={title} className="relative grid grid-cols-[44px_1fr] gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                {index < triageSteps.length - 1 && <span className="absolute left-[43px] top-14 h-[calc(100%-1.5rem)] w-px bg-blue-200/70" />}
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-mono text-xs font-black text-white shadow-md shadow-blue-600/25">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-sm font-black tracking-[-0.02em] text-slate-950">{title}</h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      </Reveal>

      {/* "Feeds into" animation */}
      <Reveal>
      <section className="mx-auto mt-20 max-w-4xl" aria-label="Every triage decision feeds into AuditOS">
        <div className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-[linear-gradient(135deg,#f8fbff,#ffffff_45%,#eff6ff)] px-6 py-12 shadow-xl shadow-blue-950/5 sm:px-10">
          <p className="text-center text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">Every decision feeds into</p>

          <div className="relative mt-8 flex items-center justify-between gap-3">
            {/* Source: triage */}
            <div className="relative z-10 flex flex-col items-center gap-2 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 sm:h-20 sm:w-20">
                <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-white sm:h-9 sm:w-9"><path d="M12 3v6m0 0 3-3m-3 3L9 6M5 13h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <p className="text-xs font-black text-slate-950">AI Triage</p>
              <p className="max-w-[10ch] text-[10px] font-bold leading-3 text-slate-400">route decided</p>
            </div>

            {/* Animated pipe */}
            <div className="relative mx-2 h-14 flex-1">
              <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-blue-100">
                <div className="carevo-flow h-full w-1/2 rounded-full bg-[linear-gradient(90deg,transparent,#22d3ee,#0ea5e9,transparent)]" />
              </div>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="carevo-packet absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]"
                  style={{ animationDelay: `${i * 0.9}s` }}
                />
              ))}
            </div>

            {/* Target: AuditOS */}
            <div className="relative z-10 flex flex-col items-center gap-2 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-blue-200 shadow-lg shadow-slate-950/30 sm:h-20 sm:w-20">
                <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current sm:h-9 sm:w-9"><path d="M12 3 4 6v5c0 4.5 3.2 8.4 8 9.7 4.8-1.3 8-5.2 8-9.7V6l-8-3Z" strokeWidth="1.6" strokeLinejoin="round" /><path d="m9 12 2 2 4-4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <p className="text-xs font-black text-slate-950">AuditOS</p>
              <p className="max-w-[10ch] text-[10px] font-bold leading-3 text-slate-400">traced &amp; audited</p>
            </div>
          </div>

          <p className="mx-auto mt-8 max-w-md text-center text-sm font-semibold leading-6 text-slate-600">
            Nothing is thrown away. Each route, each safety screen, and each consent state streams straight into the
            compliance layer.
          </p>
        </div>
      </section>
      </Reveal>

      {/* Product 2 — AuditOS */}
      <Reveal>
      <section className="mx-auto mt-20 max-w-5xl">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CarevoMark />
              <div>
                <span className="inline-flex items-center rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-blue-200">
                  Product 02
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.85)]" />
              Live controls passing
            </span>
          </div>

          <h2 className="mt-6 text-[clamp(2rem,5vw,3rem)] font-black leading-[1.04] tracking-[-0.045em]">
            Carevo AuditOS
          </h2>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-300">
            AI-native compliance audit routing for care routing. AuditOS watches every decision the triage engine makes and
            turns it into an always-on record — the layer insurers and healthcare facilities trust before a patient ever
            walks in the door.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {auditFeatures.map(([title, detail]) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm font-black tracking-[-0.02em] text-white">{title}</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{detail}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/AUDITOS"
              className="inline-flex items-center gap-2 rounded-full bg-blue-400 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-blue-500/25 transition hover:-translate-y-px hover:bg-blue-300"
            >
              Open the AuditOS demo
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-slate-950"><path d="M3 8h10M9 4l4 4-4 4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <Link
              href="/audit-os"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-transparent px-6 py-3 text-sm font-black text-white transition hover:bg-white/5"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>
      </Reveal>

      {/* Closing CTA */}
      <Reveal>
      <section className="mx-auto mt-20 max-w-3xl text-center">
        <h2 className="text-[clamp(1.6rem,4vw,2.4rem)] font-black leading-tight tracking-[-0.04em]">
          Want it in front of your patients or your network?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base font-semibold leading-7 text-slate-600">
          Carevo is built to slot in ahead of the visit — so facilities and insurers see the routing decision, and the
          reasoning behind it, before the patient arrives.
        </p>
        <Link
          href="/contact"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-px hover:bg-slate-800"
        >
          Talk to us
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-white"><path d="M3 8h10M9 4l4 4-4 4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
      </section>
      </Reveal>
    </main>
  )
}
