'use client'

import { useState } from 'react'
import Link from 'next/link'

const CONTACT_EMAIL = 'usecarevoai@gmail.com'
const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}?subject=Hello%20Carevo`

export default function ContactPage() {
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_-10%,rgba(191,219,254,0.82),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-4 pb-16 pt-28 text-slate-950 sm:px-6 sm:pb-20 sm:pt-36">
      <section className="marketing-reveal mx-auto max-w-6xl text-center">
        <p className="mb-6 text-xs font-black uppercase tracking-[0.28em] text-slate-400">Contact</p>
        <h1 className="mx-auto max-w-6xl font-display text-[clamp(2.75rem,13vw,4.75rem)] font-black leading-[1] tracking-[-0.065em] sm:text-7xl sm:leading-[0.98] lg:text-8xl">
          Let&apos;s make care navigation clearer.
        </h1>
        <p className="mx-auto mt-7 max-w-3xl text-base font-semibold leading-8 text-slate-600 sm:mt-8 sm:text-xl sm:leading-9">
          Tell us where members get stuck - intake, routing, network handoffs, or follow-up - and we&apos;ll map where Carevo can help.
        </p>
        <a
          href={CONTACT_MAILTO}
          className="mt-8 inline-flex w-full max-w-xs items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-base font-black text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 sm:mt-10 sm:w-auto"
        >
          Email us
          <span className="ml-3" aria-hidden="true">-&gt;</span>
        </a>
      </section>

      <section className="marketing-reveal-delay-1 mx-auto mt-16 max-w-7xl border-t border-slate-200 pt-12 sm:mt-24 sm:pt-16">
        <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
          <article className="rounded-[1.4rem] border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
            <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-950 sm:mb-16">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-black tracking-[-0.05em] sm:text-3xl">General inquiries</h2>
            <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
              Questions about the product, pilots, pricing, partnerships, or the Carevo roadmap.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3 sm:mt-12">
              <button
                type="button"
                onClick={copyEmail}
                className="inline-flex max-w-full items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
                aria-live="polite"
              >
                <span className="break-all">{copied ? 'Copied ✓' : CONTACT_EMAIL}</span>
              </button>
              <a href={CONTACT_MAILTO} className="inline-flex items-center font-black text-blue-600 hover:text-blue-700">
                Email us
                <span className="ml-3" aria-hidden="true">-&gt;</span>
              </a>
            </div>
          </article>

          <article className="rounded-[1.4rem] border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-carevo-600">What to send</p>
            <h2 className="mt-7 max-w-2xl font-display text-[clamp(2.15rem,11vw,3.3rem)] font-black leading-[1] tracking-[-0.06em] sm:mt-8 sm:text-5xl">
              A workflow where the first step is still too confusing.
            </h2>
            <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-slate-600">
              We can walk through how members enter the system, where unnecessary ER visits happen, which routing decisions need review, and what a clearer handoff could look like.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              {['Insurer pilots', 'Care navigation', 'Audit trail', 'Follow-up'].map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  {item}
                </span>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl rounded-[2rem] bg-slate-950 p-7 text-white sm:mt-20 sm:p-12">
        <h2 className="max-w-3xl font-display text-[clamp(2.3rem,12vw,4.3rem)] font-black leading-[1] tracking-[-0.06em] sm:text-6xl">
          Want to see the product first?
        </h2>
        <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-slate-300">
          Try the intake flow, then send us the workflow you want Carevo to support next.
        </p>
        <Link href="/triage" className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100 sm:w-auto">
          Try Carevo
        </Link>
      </section>
    </main>
  )
}
