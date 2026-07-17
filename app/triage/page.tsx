import { HomePage } from '../page'

const safeguards = ['911 hard stop', 'Deterministic routing', 'No account needed']

export default function TriagePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_8%,rgba(59,130,246,0.16),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#ffffff_58%,#f8fafc_100%)] px-4 pb-10 pt-28 text-slate-950 sm:px-5 sm:pb-14 sm:pt-32">
      <section className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-[0.62fr_1.38fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-carevo-600 sm:mb-5">Live Triage</p>
          <h1 className="max-w-3xl text-[clamp(3.25rem,14vw,5.4rem)] font-black leading-[0.9] tracking-[-0.07em] sm:text-7xl sm:leading-[0.88] lg:text-8xl">
            Start with one clear next step.
          </h1>
          <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-slate-600 sm:mt-8 sm:text-xl sm:leading-9 lg:max-w-lg">
            Use Carevo&apos;s patient-facing intake flow here. It screens for emergency signals first, asks only what changes the route, and explains the next step in plain language.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
            {safeguards.map((item) => (
              <span key={item} className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 shadow-sm sm:px-4 sm:text-xs">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative rounded-[1.4rem] border border-slate-200 bg-white/75 p-2 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:rounded-[2rem] sm:p-4">
          <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[length:42px_42px] opacity-40 [mask-image:linear-gradient(180deg,#000,transparent_78%)]" />
          <div className="relative mb-3 flex items-center justify-between gap-3 px-2 pt-1">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 shadow-sm sm:px-4 sm:text-xs">
              Live product
            </span>
            <span className="hidden rounded-full bg-carevo-50 px-4 py-2 text-xs font-black text-carevo-700 sm:inline-flex">
              Data stays on this device
            </span>
          </div>
          <div className="relative overflow-hidden rounded-[1rem] border border-slate-200 bg-white shadow-inner sm:rounded-[1.4rem]">
            <HomePage embedded />
          </div>
        </div>
      </section>
    </main>
  )
}
