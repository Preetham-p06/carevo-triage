import { HomePage } from '../page'

const safeguards = ['911 hard stop', 'Deterministic routing', 'No account needed']

export default function TriagePage() {
  return (
    <>
    <div className="md:hidden bg-white pt-24">
      <HomePage />
    </div>

    <main className="hidden min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_8%,rgba(59,130,246,0.16),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#ffffff_58%,#f8fafc_100%)] px-4 pb-12 pt-28 text-slate-950 sm:px-5 sm:pb-16 sm:pt-32 md:block">
      <section className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.66fr_1.34fr] lg:items-center">
        <div>
          <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-carevo-600 sm:mb-5">Live Triage</p>
          <h1 className="max-w-3xl text-[clamp(3rem,15vw,4.7rem)] font-black leading-[0.94] tracking-[-0.07em] sm:text-7xl sm:leading-[0.88] lg:text-8xl">
            Start with one clear next step.
          </h1>
          <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-slate-600 sm:mt-8 sm:text-xl sm:leading-9">
            Use Carevo&apos;s patient-facing intake flow here. It screens for emergency signals first, asks only the questions that change routing, and explains the care level in plain language.
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
              Embedded product
            </span>
            <span className="hidden rounded-full bg-carevo-50 px-4 py-2 text-xs font-black text-carevo-700 sm:inline-flex">
              Data stays on this device
            </span>
          </div>
          <iframe
            className="relative h-[76dvh] min-h-[620px] w-full rounded-[1rem] border border-slate-200 bg-white shadow-inner sm:h-[735px] sm:rounded-[1.4rem]"
            src="/triage-embed"
            title="Carevo live triage"
          />
        </div>
      </section>
    </main>
    </>
  )
}
