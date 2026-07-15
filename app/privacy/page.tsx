import Link from 'next/link'

const protections = [
  ['Human review stays visible', 'Carevo is built to show the routing trace, rule match, and supporting details before a workflow decision moves forward.'],
  ['Minimal data by default', 'The product is designed to collect only the information needed to route a care question safely and explainably.'],
  ['No client-side AI calls', 'AI requests are handled through the backend workflow, keeping browser code away from model credentials and routing logic.'],
  ['Clear emergency escalation', 'Emergency safeguards run before AI assistance and can stop the flow with a 911 call-to-action.'],
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-6 pt-28 pb-16 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <p className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-carevo-600">Privacy</p>
        <h1 className="max-w-5xl text-5xl font-black leading-[0.98] tracking-[-0.06em] sm:text-7xl">
          Private enough for healthcare workflows. Clear enough for review.
        </h1>
        <p className="mt-8 max-w-3xl text-xl font-semibold leading-9 text-slate-600">
          Carevo is designed around explainable routing, restricted access, and careful handling of health information. Production deployments should store protected health data only in encrypted backend systems approved for that customer workflow.
        </p>
      </section>

      <section className="mx-auto mt-20 grid max-w-6xl gap-5 md:grid-cols-2">
        {protections.map(([title, body]) => (
          <article key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
            <h2 className="text-2xl font-black tracking-[-0.04em]">{title}</h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">{body}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-20 max-w-6xl rounded-[2rem] bg-slate-950 p-8 text-white sm:p-12">
        <h2 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
          Want to review security, data flow, or deployment boundaries?
        </h2>
        <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-slate-300">
          We can walk through how Carevo separates intake, AI assistance, deterministic routing, audit trails, and production data storage.
        </p>
        <Link href="/contact" className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-black text-slate-950 transition hover:bg-slate-100">
          Contact Carevo
        </Link>
      </section>
    </main>
  )
}
