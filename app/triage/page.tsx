import { HomePage } from '../page'

const safeguards = ['911 hard stop', 'Deterministic routing', 'No account needed']

export default function TriagePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_8%,rgba(59,130,246,0.16),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#ffffff_58%,#f8fafc_100%)] px-4 pb-14 pt-28 text-slate-950 sm:px-5 sm:pb-20 sm:pt-32">
      <section className="mx-auto max-w-3xl">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-carevo-600 sm:mb-5">Live Triage</p>
        <h1 className="max-w-3xl text-[clamp(3.4rem,12vw,6.6rem)] font-black leading-[0.88] tracking-[-0.075em]">
          Start with one clear next step.
        </h1>
        <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-slate-600 sm:mt-8 sm:text-xl sm:leading-9">
          Use Carevo&apos;s patient-facing intake flow here. It screens for emergency signals first, asks only what changes the route, and explains the care level in plain language.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
          {safeguards.map((item) => (
            <span key={item} className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 shadow-sm backdrop-blur sm:px-4 sm:text-xs">
              {item}
            </span>
          ))}
        </div>

        <div className="mt-8 sm:mt-10">
          <HomePage presentation="inline" />
        </div>
      </section>
    </main>
  )
}
